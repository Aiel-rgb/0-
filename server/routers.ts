import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createUserProfile, getUserProfile, getUserTasks, createTask, updateTask, deleteTask, completeTask, updateUserProgress, upsertUser, updateUserAvatar, getAllCompletions, getDb, createGuild, getGuild, getUserGuild, getAllGuilds, joinGuild, leaveGuild, getGuildMembers, createGuildRaid, completeGuildRaid, participateInGuildRaid, getGuildRaids, registerUser, loginUser, sendFriendRequest, acceptFriendRequest, rejectOrRemoveFriend, getFriends, getFriendRequests, getGuildByInviteCode, generateInviteCode, getActiveDailyTasks, getUserDailyCompletions, completeDailyTask, seedDailyTasksIfEmpty, searchUsers, getActiveDungeon, getDungeonMissions, getUserDungeonProgress, completeDungeonMission, seedAstralDungeonIfEmpty, getUnlockedThemes, equipTheme, updateLastSeenVersion, getUserByOpenId } from "./db";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import fs from "fs";
import path from "path";
import { eq, sql, ne } from "drizzle-orm";
import { userProfiles, users, guildMembers, guilds } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      // console.log("Current user:", opts.ctx.user);
      if (!opts.ctx.user) return null;
      try {
        const freshUser = await getUserByOpenId(opts.ctx.user.openId);
        return freshUser || opts.ctx.user;
      } catch (e) {
        return opts.ctx.user;
      }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Try local DB login first
        const user = await loginUser(input.email, input.password);
        if (user) {
          const sessionToken = await sdk.createSessionToken(user.openId, {
            name: user.name || "User",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          return { success: true };
        }

        // Fallback to demo admin login
        if (input.email === "admin@peakhabit.com" && input.password === "admin123") {
          const openId = "demo-admin-user";
          try {
            await upsertUser({
              openId,
              email: input.email,
              name: "Admin User",
              lastSignedIn: new Date(),
              loginMethod: "local-demo",
            });
          } catch (e) {
            console.warn("[Auth] DB unavailable for upsert, continuing with JWT-only auth");
          }
          const sessionToken = await sdk.createSessionToken(openId, {
            name: "Admin User",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          return { success: true };
        }
        throw new Error("Credenciais inválidas");
      }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await registerUser(input.name, input.email, input.password);
        if (!user) {
          throw new Error("Email já cadastrado ou erro ao criar conta.");
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "User",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),
  }),

  // User profile router
  profile: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      try {
        let profile = await getUserProfile(ctx.user.id);

        // Create profile if it doesn't exist
        if (!profile) {
          await createUserProfile(ctx.user.id);
          profile = await getUserProfile(ctx.user.id);
        }

        if (profile) return profile;
      } catch (e) {
        console.warn("[Profile] DB unavailable, returning default profile");
      }

      // Fallback profile when DB is unavailable
      return {
        id: 1,
        userId: ctx.user.id,
        totalXp: 0,
        currentLevel: 1,
        xpInCurrentLevel: 0,
        xpNeededForNextLevel: 100,
        streak: 0,
        lastStreakUpdate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        equippedThemeId: "default",
        lastSeenVersion: "0.0.0",
      };
    }),

    updateXp: protectedProcedure
      .input(z.object({ xpGain: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await updateUserProgress(ctx.user.id, input.xpGain);
          const profile = await getUserProfile(ctx.user.id);
          if (profile) return profile;
        } catch (e) {
          console.warn("[Profile] DB unavailable for XP update");
        }
        return {
          id: 1,
          userId: ctx.user.id,
          totalXp: 0,
          currentLevel: 1,
          xpInCurrentLevel: 0,
          xpNeededForNextLevel: 100,
          streak: 0,
          lastStreakUpdate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          equippedThemeId: "default",
          lastSeenVersion: "0.0.0",
        };
      }),

    updateAvatar: protectedProcedure
      .input(z.object({ avatarUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        console.log("ProfileRouter: Updating avatar for user", ctx.user.id, "to", input.avatarUrl);
        const success = await updateUserAvatar(ctx.user.id, input.avatarUrl, ctx.user.openId);
        console.log("ProfileRouter: Update success:", success);
        return { success };
      }),

    uploadAvatar: protectedProcedure
      .input(z.object({
        imageData: z.string(),
        fileName: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Decode base64
          const matches = input.imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error("Invalid base64 string");
          }
          const buffer = Buffer.from(matches[2], 'base64');

          // Ensure directory exists
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const ext = path.extname(input.fileName) || ".png";
          const newFileName = `avatar-${ctx.user.id}-${Date.now()}${ext}`;
          const filePath = path.join(uploadsDir, newFileName);

          fs.writeFileSync(filePath, buffer);

          const publicUrl = `/uploads/${newFileName}`;
          console.log("ProfileRouter: Uploaded avatar to", publicUrl);

          const success = await updateUserAvatar(ctx.user.id, publicUrl, ctx.user.openId);
          return { success, url: publicUrl };
        } catch (e) {
          console.error("ProfileRouter: Upload failed", e);
          throw new Error("Failed to upload image");
        }
      }),

    getUnlockedThemes: protectedProcedure.query(async ({ ctx }) => {
      return await getUnlockedThemes(ctx.user.id);
    }),

    equipTheme: protectedProcedure
      .input(z.object({ themeId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await equipTheme(ctx.user.id, input.themeId);
        return { success };
      }),

    updateLastSeenVersion: protectedProcedure
      .input(z.object({ version: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await updateLastSeenVersion(ctx.user.id, input.version);
        return { success };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const completions = await getAllCompletions(ctx.user.id);
        const totalCompletions = completions.length;
        const profile = await getUserProfile(ctx.user.id);

        let streak = 0;
        if (profile?.lastStreakUpdate) {
          const now = new Date();
          const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
          const lastUpdateDate = new Date(profile.lastStreakUpdate);
          const lastUpdateDay = new Date(Date.UTC(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate()));

          const diffTime = today.getTime() - lastUpdateDay.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            streak = profile.streak;
          }
        }

        const hardTasks = completions.filter(c => c.xpGained >= 50).length;
        const mediumTasks = completions.filter(c => c.xpGained >= 25 && c.xpGained < 50).length;
        const easyTasks = completions.filter(c => c.xpGained < 25).length;

        // Check for Admin Friend
        const friends = await getFriends(ctx.user.id);
        const hasAdminFriend = friends.some(f => f.role === 'admin' || f.userId === 1 || f.name === 'Admin User' || f.name === 'Gabriel Neves');

        return {
          totalCompletions,
          streak,
          hardTasks,
          mediumTasks,
          easyTasks,
          hasAdminFriend
        };
      } catch (e) {
        console.warn("[Profile] Stats calculation failed", e);
        return { totalCompletions: 0, streak: 0, hardTasks: 0, mediumTasks: 0, easyTasks: 0, hasAdminFriend: false };
      }
    }),

    getLeaderboard: protectedProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) return [];

        const result = await db
          .select({
            userId: userProfiles.userId,
            totalXp: userProfiles.totalXp,
            currentLevel: userProfiles.currentLevel,
            name: users.name,
            avatarUrl: users.avatarUrl,
          })
          .from(userProfiles)
          .innerJoin(users, eq(userProfiles.userId, users.id))
          .where(ne(users.role, "admin"))
          .orderBy(sql`${userProfiles.currentLevel} DESC, ${userProfiles.totalXp} DESC`)
          .limit(10);

        return result.map((r) => {
          let rank = "Ferro";
          if (r.currentLevel > 100) rank = "Thorium";
          else if (r.currentLevel > 75) rank = "Diamante";
          else if (r.currentLevel > 50) rank = "Platina";
          else if (r.currentLevel > 25) rank = "Ouro";
          else if (r.currentLevel > 10) rank = "Prata";
          return { ...r, rank };
        });
      } catch (e) {
        console.warn("[Profile] Leaderboard failed", e);
        return [];
      }
    }),
  }),

  // Tasks router
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const tasks = await getUserTasks(ctx.user.id);
        return tasks;
      } catch (e) {
        console.error("[Tasks] List failed:", e);
        return [];
      }
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        repeatType: z.enum(["daily", "weekly", "none"]).default("daily"),
        repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
        repeatEndsAt: z.string().optional(), // ISO string
      }))
      .mutation(async ({ ctx, input }) => {
        const xpRewards = { easy: 10, medium: 25, hard: 50 };
        const xpPenalties = { easy: 5, medium: 12, hard: 25 };

        try {
          const task = await createTask(ctx.user.id, {
            title: input.title,
            description: input.description,
            difficulty: input.difficulty,
            xpReward: xpRewards[input.difficulty],
            xpPenalty: xpPenalties[input.difficulty],
            repeatType: input.repeatType,
            repeatDays: input.repeatDays ? JSON.stringify(input.repeatDays) : null,
            repeatEndsAt: input.repeatEndsAt ? new Date(input.repeatEndsAt) : null,
          });

          if (!task) {
            throw new Error("Falha ao criar tarefa no banco de dados.");
          }
          return task;
        } catch (e) {
          console.warn("[Tasks] Error creating task:", e);
          throw new Error("Erro ao criar tarefa. Verifique os logs do servidor.");
        }
      }),

    delete: protectedProcedure
      .input(z.object({ taskId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await deleteTask(input.taskId, ctx.user.id);
        } catch (e) {
          console.warn("[Tasks] DB unavailable for task deletion");
          return false;
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        repeatType: z.enum(["daily", "weekly", "none"]).optional(),
        repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
        repeatEndsAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateTask(input.id, ctx.user.id, {
            title: input.title,
            description: input.description,
            difficulty: input.difficulty,
            repeatType: input.repeatType,
            repeatDays: input.repeatDays ? JSON.stringify(input.repeatDays) : undefined,
            repeatEndsAt: input.repeatEndsAt ? new Date(input.repeatEndsAt) : undefined,
          });
        } catch (e) {
          console.warn("[Tasks] DB unavailable for task update");
          return false;
        }
      }),

    complete: protectedProcedure
      .input(z.object({ taskId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const tasks = await getUserTasks(ctx.user.id);
          const task = tasks.find(t => t.id === input.taskId);

          if (!task) {
            throw new Error("Task not found");
          }

          if (task.completed) {
            return await getUserProfile(ctx.user.id);
          }

          const success = await completeTask(input.taskId, ctx.user.id, task.xpReward);
          return await getUserProfile(ctx.user.id);
        } catch (e) {
          console.warn("[Tasks] DB unavailable for task completion");
          return {
            id: 1,
            userId: ctx.user.id,
            totalXp: 0,
            currentLevel: 1,
            xpInCurrentLevel: 0,
            xpNeededForNextLevel: 100,
            streak: 0,
            lastStreakUpdate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }),
  }),

  // Guild router
  guild: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await createGuild(ctx.user.id, input.name, input.description);
          if (result === null) {
            throw new Error("Você já faz parte de uma guilda. Saia primeiro para criar uma nova.");
          }
          // Set invite code on creation
          const db = await getDb();
          if (db && result) {
            const code = generateInviteCode();
            await db.update(guilds).set({ inviteCode: code }).where(eq(guilds.id, result.id));
            (result as any).inviteCode = code;
          }
          return result;
        } catch (e: any) {
          throw new Error(e.message || "Erro ao criar guilda");
        }
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getUserGuild(ctx.user.id) || null;
      } catch (e) {
        console.warn("[Guild] Failed to get user guild", e);
        return null;
      }
    }),

    getById: protectedProcedure
      .input(z.object({ guildId: z.number().int() }))
      .query(async ({ input }) => {
        try {
          return await getGuild(input.guildId) || null;
        } catch (e) {
          return null;
        }
      }),

    list: protectedProcedure.query(async () => {
      try {
        return await getAllGuilds();
      } catch (e) {
        console.warn("[Guild] Failed to list guilds", e);
        return [];
      }
    }),

    join: protectedProcedure
      .input(z.object({ guildId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await joinGuild(input.guildId, ctx.user.id);
        if (!success) throw new Error("Não foi possível entrar na guilda. Você já pode estar em uma.");
        return { success };
      }),

    joinByCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const guild = await getGuildByInviteCode(input.code);
        if (!guild) throw new Error("Código de convite inválido.");

        const success = await joinGuild(guild.id, ctx.user.id);
        if (!success) throw new Error("Não foi possível entrar na guilda. Você já pode estar em uma.");
        return { success, guildId: guild.id };
      }),

    leave: protectedProcedure
      .input(z.object({ guildId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await leaveGuild(input.guildId, ctx.user.id);
        if (!success) throw new Error("Erro ao sair da guilda.");
        return { success };
      }),

    members: protectedProcedure
      .input(z.object({ guildId: z.number().int() }))
      .query(async ({ input }) => {
        try {
          return await getGuildMembers(input.guildId);
        } catch (e) {
          return [];
        }
      }),

    createRaid: protectedProcedure
      .input(z.object({
        guildId: z.number().int(),
        title: z.string().min(1),
        description: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user is the leader
        const guild = await getGuild(input.guildId);
        if (!guild || guild.leaderId !== ctx.user.id) {
          throw new Error("Apenas o líder da guilda pode criar raids.");
        }
        const result = await createGuildRaid(input.guildId, ctx.user.id, {
          title: input.title,
          description: input.description,
          difficulty: input.difficulty,
        });
        if (!result) throw new Error("Erro ao criar raid.");
        return { success: true };
      }),

    participateRaid: protectedProcedure
      .input(z.object({
        raidId: z.number().int(),
        guildId: z.number().int(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user is member of guild? participateInGuildRaid checks insertion but not membership explicitly? 
        // Logic in db.ts handles insertion.
        const success = await participateInGuildRaid(input.raidId, ctx.user.id);
        if (!success) throw new Error("Erro ao participar da raid.");
        return { success };
      }),

    raids: protectedProcedure
      .input(z.object({ guildId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        try {
          // Pass ctx.user.id to check participation status
          return await getGuildRaids(input.guildId, ctx.user.id);
        } catch (e) {
          return [];
        }
      }),
  }),

  // Friends router
  friends: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getFriends(ctx.user.id);
    }),

    requests: protectedProcedure.query(async ({ ctx }) => {
      return await getFriendRequests(ctx.user.id);
    }),

    send: protectedProcedure
      .input(z.object({ friendId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await sendFriendRequest(ctx.user.id, input.friendId);
        if (!success) throw new Error("Não foi possível enviar pedido de amizade.");
        return { success };
      }),

    accept: protectedProcedure
      .input(z.object({ requestId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await acceptFriendRequest(input.requestId, ctx.user.id);
        if (!success) throw new Error("Erro ao aceitar pedido.");
        return { success };
      }),

    reject: protectedProcedure
      .input(z.object({ requestId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await rejectOrRemoveFriend(input.requestId, ctx.user.id);
        if (!success) throw new Error("Erro ao rejeitar pedido.");
        return { success };
      }),

    remove: protectedProcedure
      .input(z.object({ friendshipId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await rejectOrRemoveFriend(input.friendshipId, ctx.user.id);
        if (!success) throw new Error("Erro ao remover amigo.");
        return { success };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string().min(2).max(50) }))
      .query(async ({ ctx, input }) => {
        return await searchUsers(input.query, ctx.user.id);
      }),
  }),

  // Daily Tasks router
  dailyTasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await seedDailyTasksIfEmpty();
      const today = new Date().toISOString().split("T")[0];
      const [tasks, completions] = await Promise.all([
        getActiveDailyTasks(),
        getUserDailyCompletions(ctx.user.id, today),
      ]);
      const completedIds = new Set(completions.map(c => c.dailyTaskId));
      return tasks.map(t => ({ ...t, completedToday: completedIds.has(t.id) }));
    }),

    complete: protectedProcedure
      .input(z.object({ dailyTaskId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const result = await completeDailyTask(ctx.user.id, input.dailyTaskId);
        if (result.alreadyDone) throw new Error("Tarefa já concluída hoje!");
        if (!result.success) throw new Error("Erro ao completar tarefa diária.");
        return result;
      }),
  }),

  // Monthly Dungeon router
  dungeon: router({
    active: protectedProcedure.query(async ({ ctx }) => {
      await seedAstralDungeonIfEmpty();
      const dungeon = await getActiveDungeon();
      if (!dungeon) return null;

      const [missions, progress] = await Promise.all([
        getDungeonMissions(dungeon.id),
        getUserDungeonProgress(ctx.user.id, dungeon.id),
      ]);

      const totalXp = missions.reduce((sum, m) => sum + m.xpReward, 0);
      const totalGold = missions.reduce((sum, m) => sum + m.goldReward, 0);

      return {
        dungeon,
        missions,
        completedIds: progress.map((p) => p.missionId),
        totalXp,
        totalGold,
      };
    }),

    completeMission: protectedProcedure
      .input(z.object({ dungeonId: z.number().int(), missionId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const result = await completeDungeonMission(ctx.user.id, input.dungeonId, input.missionId);
        if (result.alreadyDone) throw new Error("Missão já concluída!");
        if (!result.success) throw new Error("Erro ao completar missão da dungeon.");
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
