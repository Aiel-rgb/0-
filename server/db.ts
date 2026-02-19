import { eq, and, sql, desc, or, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, userProfiles, tasks, taskCompletions, guilds, guildMembers, guildRaids, friendships, guildRaidParticipants, dailyTasks, dailyTaskCompletions, dungeons, dungeonMissions, dungeonProgress, userThemes, userInventory, userCosmetics, userPets, guildUpgrades } from "../drizzle/schema";
import crypto from "crypto";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _dbChecked = false;

const timeoutPromise = (ms: number) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Connection timeout")), ms)
);

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (_dbChecked) return _db;

  const dbUrl = ENV.databaseUrl;

  if (dbUrl) {
    try {
      console.log("[Database] Testing connection...");
      // Test connection with a hard 2-second timeout
      const connPromise = mysql.createConnection(dbUrl);
      const testConn = await Promise.race([connPromise, timeoutPromise(2000)]) as mysql.Connection;
      await testConn.end();

      _db = drizzle(dbUrl);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Connection failed:", error);
      console.warn("[Database] Not available, running in demo mode");
      _db = null;
    }
  } else {
    console.warn("[Database] DATABASE_URL is empty in ENV");
  }

  _dbChecked = true;
  return _db;
}

// ── Timezone Helpers (BRL: UTC-3) ────────────────────────
export function getAdjustedDate() {
  const now = new Date();
  // Brazil is UTC-3. We adjust the date to reflect local time for midnight calculations.
  // This is a simple offset adjustment for server-side consistency.
  const BRL_OFFSET = -3;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * BRL_OFFSET));
}

export function getTodayMidnight() {
  const adjusted = getAdjustedDate();
  adjusted.setHours(0, 0, 0, 0);
  return adjusted;
}

export function getTodayDateString() {
  const adjusted = getAdjustedDate();
  return adjusted.toISOString().split("T")[0];
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User Profile queries
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserProfile(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(userProfiles).values({
      userId,
      totalXp: 0,
      currentLevel: 1,
      xpInCurrentLevel: 0,
      xpNeededForNextLevel: 100,
      gold: 0,
    });
  } catch (error) {
    console.error("[Database] Failed to create user profile:", error);
  }
}

export async function updateUserProgress(userId: number, xpGain: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    // Pet XP Bonus Logic
    let multiplier = 1.0;
    try {
      const activePets = await db.select().from(userPets).where(and(eq(userPets.userId, userId), eq(userPets.isActive, 1))).limit(1);
      if (activePets.length > 0) {
        const pet = activePets[0];
        if (pet.petId === "slime-blue") multiplier = 1.05;
        else if (pet.petId === "fox-fire") multiplier = 1.10;
        else if (pet.petId === "dragon-void") multiplier = 1.15;
        else if (pet.petId === "phoenix-gold") multiplier = 1.20;
      }
    } catch (e) {
      console.warn("[XP] Failed to apply pet bonus:", e);
    }

    const boostedXp = Math.floor(xpGain * multiplier);

    // Guild XP Bonus Logic
    let finalXp = boostedXp;
    try {
      const userRole = await getUserGuild(userId);
      if (userRole) {
        const gUpgrades = await getGuildUpgrades(userRole.id);
        if (gUpgrades.some(u => u.upgradeId === "banner-xp")) {
          finalXp = Math.floor(finalXp * 1.20);
        }
      }
    } catch (e) {
      console.warn("[XP] Failed to apply guild bonus:", e);
    }

    // xp logic
    let newTotalXp = profile.totalXp + finalXp;
    let newLevel = profile.currentLevel;
    let newXpInLevel = profile.xpInCurrentLevel + finalXp;
    let xpNeeded = profile.xpNeededForNextLevel;

    while (newXpInLevel >= xpNeeded) {
      newXpInLevel -= xpNeeded;
      newLevel += 1;
      xpNeeded = Math.floor(100 * (1.1 ** (newLevel - 1)));
    }

    // streak logic - uses adjusted local time
    const today = getTodayMidnight();
    const now = getAdjustedDate();

    let newStreak = profile.streak;
    let newLastUpdate = profile.lastStreakUpdate;

    if (!profile.lastStreakUpdate) {
      // First activity ever
      newStreak = 1;
      newLastUpdate = now;
    } else {
      const lastUpdateDate = new Date(profile.lastStreakUpdate);
      const lastUpdateDay = new Date(Date.UTC(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate()));

      const diffTime = today.getTime() - lastUpdateDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
        newLastUpdate = now;
      } else if (diffDays > 1) {
        // Missed one or more days - RESET
        newStreak = 1;
        newLastUpdate = now;
      }
      // If diffDays === 0, already updated today, keep streak
    }

    await db.update(userProfiles).set({
      totalXp: newTotalXp,
      currentLevel: newLevel,
      xpInCurrentLevel: newXpInLevel,
      xpNeededForNextLevel: xpNeeded,
      streak: newStreak,
      lastStreakUpdate: newLastUpdate
    }).where(eq(userProfiles.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to update user progress:", error);
  }
}

export async function resetAllStreaks() {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(userProfiles).set({ streak: 0, lastStreakUpdate: null });
    console.log("[Database] All streaks reset to 0.");
  } catch (error) {
    console.error("[Database] Failed to reset streaks:", error);
  }
}

export async function updateUserHp(userId: number, hpChange: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    let newHp = profile.hp + hpChange;
    if (newHp > 100) newHp = 100;
    if (newHp < 0) newHp = 0;

    await db.update(userProfiles).set({ hp: newHp }).where(eq(userProfiles.userId, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update user HP:", error);
    return false;
  }
}

// Task queries
export async function getUserTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all tasks for the user
  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));

  // Get today's completions (adjusted timezone)
  const today = getTodayMidnight();

  const completions = await db.select()
    .from(taskCompletions)
    .where(and(
      eq(taskCompletions.userId, userId),
      sql`${taskCompletions.completedAt} >= ${today} `
    ));

  const completedTaskIds = new Set(completions.map(c => c.taskId));
  const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Filter tasks based on repetition rules
  const activeTasks = allTasks.filter(task => {
    // 1. Check if repetition ended
    if (task.repeatEndsAt && new Date(task.repeatEndsAt) < today) {
      console.log(`[TaskDebug] Task ${task.id} filtered: repetition ended`);
      return false;
    }

    // 2. Weekly repetition check
    if (task.repeatType === 'weekly') {
      if (!task.repeatDays) {
        console.log(`[TaskDebug] Task ${task.id} filtered: weekly but no days`);
        return false;
      }
      try {
        const days = JSON.parse(task.repeatDays as string);
        if (Array.isArray(days) && !days.includes(currentDayIndex)) {
          // console.log(`[TaskDebug] Task ${ task.id } filtered: wrong day(Task days: ${ days }, Today: ${ currentDayIndex })`);
          return false;
        }
      } catch (e) {
        console.log(`[TaskDebug] Task ${task.id} filtered: parsing days failed`);
        return false;
      }
    }

    // 3. One-time task check (if completed previously, don't show, unless completed TODAY)
    if (task.repeatType === 'none' && task.isOneTimeCompleted && !completedTaskIds.has(task.id)) {
      // console.log(`[TaskDebug] Task ${ task.id } filtered: one - time completed`);
      return false;
    }

    return true;
  });

  return activeTasks.map(task => ({
    ...task,
    completed: completedTaskIds.has(task.id)
  }));
}

export async function createTask(userId: number, task: {
  title: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  xpPenalty: number;
  repeatType?: "daily" | "weekly" | "none";
  repeatDays?: string | null;
  repeatEndsAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.insert(tasks).values({ ...task, userId });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create task:", error);
    return undefined;
  }
}

export async function updateTask(taskId: number, userId: number, data: {
  title?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  repeatType?: "daily" | "weekly" | "none";
  repeatDays?: string; // stringified JSON
  repeatEndsAt?: Date;
}) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update task:", error);
    return false;
  }
}

export async function deleteTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete task:", error);
    return false;
  }
}

// Task completion queries
export async function completeTask(taskId: number, userId: number, xpGained: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Check if already completed today
    const today = getTodayMidnight();

    const existingCompletion = await db.select()
      .from(taskCompletions)
      .where(and(
        eq(taskCompletions.taskId, taskId),
        eq(taskCompletions.userId, userId),
        sql`${taskCompletions.completedAt} >= ${today} `
      ))
      .limit(1);

    if (existingCompletion.length > 0) {
      return false; // Already completed today
    }

    await db.insert(taskCompletions).values({
      taskId,
      userId,
      xpGained,
    });

    // Check if it's a one-time task (repeatType = 'none')
    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (task.length > 0 && task[0].repeatType === 'none') {
      await db.update(tasks).set({ isOneTimeCompleted: 1 }).where(eq(tasks.id, taskId));
    }

    // Update user XP & Streak
    await updateUserProgress(userId, xpGained);
    await addExperienceToActivePet(userId, xpGained);
    return true;
  } catch (error) {
    console.error("[Database] Failed to complete task:", error);
    return false;
  }
}

export async function getAllCompletions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskCompletions).where(
    eq(taskCompletions.userId, userId)
  );
}

export async function updateUserAvatar(userId: number, avatarUrl: string, openId?: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    const [result] = await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));

    if ('affectedRows' in result && (result as any).affectedRows === 0) {
      console.warn("[Database] updateUserAvatar: No user found with id", userId);

      // Self-heal: If openId is provided, try to insert/upsert the user
      if (openId) {
        console.log("[Database] Attempting to self-heal user:", openId);
        await upsertUser({
          openId,
          avatarUrl,
          name: "Admin User", // Fallback name
          loginMethod: "local-demo"
        });
        // Try update again or just assume success if upsert worked?
        // Upsert with avatarUrl should have set it.
        return true;
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to update avatar:", error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// GUILD FUNCTIONS
// ═══════════════════════════════════════════════════════

export async function createGuild(leaderId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    // Check if user is already in a guild
    const existing = await db.select().from(guildMembers).where(eq(guildMembers.userId, leaderId)).limit(1);
    if (existing.length > 0) return null; // already in a guild

    const result = await db.insert(guilds).values({ name, description, leaderId });
    const guildId = result[0].insertId;

    // Add leader as member
    await db.insert(guildMembers).values({ guildId, userId: leaderId, role: "leader" });

    return { id: guildId, name, description, leaderId };
  } catch (error) {
    console.error("[Database] Failed to create guild:", error);
    return undefined;
  }
}

export async function getGuild(guildId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserGuild(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const membership = await db.select().from(guildMembers).where(eq(guildMembers.userId, userId)).limit(1);
    if (membership.length === 0) return undefined;

    const guild = await db.select().from(guilds).where(eq(guilds.id, membership[0].guildId)).limit(1);
    if (guild.length === 0) return undefined;

    return { ...guild[0], memberRole: membership[0].role };
  } catch (error) {
    console.error("[Database] Failed to get user guild:", error);
    return undefined;
  }
}

export async function getAllGuilds() {
  const db = await getDb();
  if (!db) return [];
  try {
    const allGuilds = await db.select().from(guilds).orderBy(desc(guilds.totalXp));

    // Get member counts
    const result = [];
    for (const g of allGuilds) {
      const members = await db.select().from(guildMembers).where(eq(guildMembers.guildId, g.id));
      const leader = await db.select({ name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, g.leaderId)).limit(1);
      result.push({
        ...g,
        memberCount: members.length,
        leaderName: leader[0]?.name || "Unknown",
        leaderAvatar: leader[0]?.avatarUrl || null,
      });
    }
    return result;
  } catch (error) {
    console.error("[Database] Failed to list guilds:", error);
    return [];
  }
}

export async function joinGuild(guildId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Check if already in a guild
    const existing = await db.select().from(guildMembers).where(eq(guildMembers.userId, userId)).limit(1);
    if (existing.length > 0) return false;

    await db.insert(guildMembers).values({ guildId, userId, role: "member" });
    return true;
  } catch (error) {
    console.error("[Database] Failed to join guild:", error);
    return false;
  }
}

export async function leaveGuild(guildId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Check if user is the leader
    const guild = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
    if (guild.length > 0 && guild[0].leaderId === userId) {
      // Leader leaving = delete guild
      await db.delete(guildMembers).where(eq(guildMembers.guildId, guildId));
      await db.delete(guildRaids).where(eq(guildRaids.guildId, guildId));
      await db.delete(guilds).where(eq(guilds.id, guildId));
      return true;
    }

    await db.delete(guildMembers).where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to leave guild:", error);
    return false;
  }
}

export async function getGuildMembers(guildId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const members = await db
      .select({
        id: guildMembers.id,
        userId: guildMembers.userId,
        role: guildMembers.role,
        joinedAt: guildMembers.joinedAt,
        name: users.name,
        avatarUrl: users.avatarUrl,
        level: userProfiles.currentLevel,
        totalXp: userProfiles.totalXp,
      })
      .from(guildMembers)
      .innerJoin(users, eq(guildMembers.userId, users.id))
      .leftJoin(userProfiles, eq(guildMembers.userId, userProfiles.userId))
      .where(eq(guildMembers.guildId, guildId));
    return members;
  } catch (error) {
    console.error("[Database] Failed to get guild members:", error);
    return [];
  }
}

export async function createGuildRaid(guildId: number, assignedByUserId: number, data: { title: string; description?: string; difficulty: "easy" | "medium" | "hard"; xpReward?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const now = new Date();
    const xpRewards = { easy: 300, medium: 500, hard: 1000 };
    await db.insert(guildRaids).values({
      guildId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      xpReward: data.xpReward || xpRewards[data.difficulty],
      assignedByUserId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to create guild raid:", error);
    return undefined;
  }
}

export async function updateGuildAvatar(guildId: number, avatarUrl: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(guilds).set({ bannerUrl: avatarUrl }).where(eq(guilds.id, guildId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update guild avatar:", error);
    return false;
  }
}

export async function participateInGuildRaid(raidId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Check if already participated
    const existing = await db.select().from(guildRaidParticipants).where(and(eq(guildRaidParticipants.raidId, raidId), eq(guildRaidParticipants.userId, userId))).limit(1);
    if (existing.length > 0) return true;

    await db.insert(guildRaidParticipants).values({ raidId, userId });

    // Check if all members have participated
    const raid = await db.select().from(guildRaids).where(eq(guildRaids.id, raidId)).limit(1);
    if (raid.length === 0) return true;

    const guildId = raid[0].guildId;
    const members = await db.select().from(guildMembers).where(eq(guildMembers.guildId, guildId));
    const participants = await db.select().from(guildRaidParticipants).where(eq(guildRaidParticipants.raidId, raidId));

    // If all members participated, complete the raid
    if (participants.length >= members.length) {
      await completeGuildRaid(raidId, guildId);
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to participate in raid:", error);
    return false;
  }
}

export async function completeGuildRaid(raidId: number, guildId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const raid = await db.select().from(guildRaids).where(and(eq(guildRaids.id, raidId), eq(guildRaids.guildId, guildId))).limit(1);
    if (raid.length === 0 || raid[0].status !== "active") return false;

    await db.update(guildRaids).set({ status: "completed", completedAt: new Date() }).where(eq(guildRaids.id, raidId));

    // Add XP to guild and increment raids completed
    await db.update(guilds).set({
      totalXp: sql`${guilds.totalXp} + ${raid[0].xpReward} `,
      totalRaidsCompleted: sql`${guilds.totalRaidsCompleted} + 1`,
    }).where(eq(guilds.id, guildId));

    // Distribute XP to ALL guild members
    const members = await getGuildMembers(guildId);
    for (const member of members) {
      await updateUserProgress(member.userId, raid[0].xpReward);
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to complete guild raid:", error);
    return false;
  }
}

export async function checkGuildRaidStatus(guildId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const activeRaids = await db.select().from(guildRaids).where(and(eq(guildRaids.guildId, guildId), eq(guildRaids.status, "active")));
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const raid of activeRaids) {
      if (raid.createdAt < sevenDaysAgo) {
        // Mark as failed
        await db.update(guildRaids).set({ status: "failed" }).where(eq(guildRaids.id, raid.id));

        // PENALTY: Reduce HP of all members by 25% (25 points)
        const members = await getGuildMembers(guildId);
        for (const member of members) {
          await updateUserHp(member.userId, -25);
        }
        console.log(`[Guild] Raid ${raid.id} failed due to timeout.Penalty applied.`);
      }
    }
  } catch (error) {
    console.error("[Database] Failed to check raid status:", error);
  }
}

export async function getGuildRaids(guildId: number, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    // Check for expired raids first
    await checkGuildRaidStatus(guildId);

    const raids = await db.select().from(guildRaids).where(eq(guildRaids.guildId, guildId)).orderBy(desc(guildRaids.createdAt));

    if (userId) {
      const result = [];
      const totalMembers = (await db.select().from(guildMembers).where(eq(guildMembers.guildId, guildId))).length;

      for (const r of raids) {
        const participants = await db.select().from(guildRaidParticipants).where(eq(guildRaidParticipants.raidId, r.id));
        const userParticipated = participants.some(p => p.userId === userId);
        result.push({
          ...r,
          participantsCount: participants.length,
          totalMembers,
          userParticipated
        });
      }
      return result;
    }

    return raids;
  } catch (error) {
    console.error("[Database] Failed to get guild raids:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// REGISTRATION & AUTH FUNCTIONS
// ═══════════════════════════════════════════════════════

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")} `);
    });
  });
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}

export async function registerUser(name: string, email: string, password: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return null; // email taken

    const passwordHashed = await hashPassword(password);
    const openId = `local - ${crypto.randomBytes(16).toString("hex")} `;

    await db.insert(users).values({
      openId,
      name,
      email,
      passwordHash: passwordHashed,
      loginMethod: "local",
      lastSignedIn: new Date(),
    });

    // Get the created user
    const created = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    if (created.length === 0) return undefined;

    // Create profile
    await createUserProfile(created[0].id);

    return created[0];
  } catch (error) {
    console.error("[Database] Failed to register user:", error);
    return undefined;
  }
}

export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) return null;

    const user = result[0];
    if (!user.passwordHash) return null; // no password set (demo user)

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    // Update last sign in
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    return user;
  } catch (error) {
    console.error("[Database] Failed to login user:", error);
    return undefined;
  }
}

// ═══════════════════════════════════════════════════════
// FRIENDS FUNCTIONS
// ═══════════════════════════════════════════════════════

export async function sendFriendRequest(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    if (userId === friendId) return false;

    // Check if friendship already exists in either direction
    const existing = await db.select().from(friendships).where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
      )
    );
    if (existing.length > 0) return false;

    // Check if target user exists
    const target = await db.select().from(users).where(eq(users.id, friendId)).limit(1);
    if (target.length === 0) return false;

    await db.insert(friendships).values({ userId, friendId, status: "pending" });
    return true;
  } catch (error) {
    console.error("[Database] Failed to send friend request:", error);
    return false;
  }
}

export async function acceptFriendRequest(requestId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Only the recipient (friendId) can accept
    const request = await db.select().from(friendships).where(and(eq(friendships.id, requestId), eq(friendships.friendId, userId))).limit(1);
    if (request.length === 0 || request[0].status !== "pending") return false;

    await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, requestId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to accept friend request:", error);
    return false;
  }
}

export async function rejectOrRemoveFriend(requestId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Either party can remove
    const request = await db.select().from(friendships).where(
      and(
        eq(friendships.id, requestId),
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
      )
    );
    if (request.length === 0) return false;

    await db.delete(friendships).where(eq(friendships.id, requestId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to reject/remove friend:", error);
    return false;
  }
}

export async function getFriends(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    // Get accepted friendships in both directions
    const sent = await db
      .select({ id: friendships.id, friendId: friendships.friendId, createdAt: friendships.createdAt })
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")));

    const received = await db
      .select({ id: friendships.id, friendId: friendships.userId, createdAt: friendships.createdAt })
      .from(friendships)
      .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));

    const allFriendIds = [...sent, ...received];
    const result = [];

    for (const f of allFriendIds) {
      const u = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(eq(users.id, f.friendId)).limit(1);
      const p = await db.select({ level: userProfiles.currentLevel, totalXp: userProfiles.totalXp }).from(userProfiles).where(eq(userProfiles.userId, f.friendId)).limit(1);
      if (u.length > 0) {
        result.push({
          friendshipId: f.id,
          userId: u[0].id,
          name: u[0].name,
          avatarUrl: u[0].avatarUrl,
          role: u[0].role,
          level: p[0]?.level || 1,
          totalXp: p[0]?.totalXp || 0,
        });
      }
    }
    return result;
  } catch (error) {
    console.error("[Database] Failed to get friends:", error);
    return [];
  }
}

export async function getFriendRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const requests = await db.select().from(friendships).where(and(eq(friendships.friendId, userId), eq(friendships.status, "pending")));
    const result = [];
    for (const r of requests) {
      const u = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, r.userId)).limit(1);
      if (u.length > 0) {
        result.push({ requestId: r.id, userId: u[0].id, name: u[0].name, avatarUrl: u[0].avatarUrl, createdAt: r.createdAt });
      }
    }
    return result;
  } catch (error) {
    console.error("[Database] Failed to get friend requests:", error);
    return [];
  }
}

export async function searchUsers(query: string, excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        level: userProfiles.currentLevel,
        totalXp: userProfiles.totalXp,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(
        sql`LOWER(${users.name}) LIKE ${`%${query.toLowerCase()}%`} `,
        ne(users.id, excludeUserId),
        ne(users.role, "admin"),
      ))
      .limit(10);
    return results;
  } catch (error) {
    console.error("[Database] Failed to search users:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// GUILD INVITE CODE FUNCTIONS
// ═══════════════════════════════════════════════════════

export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function getGuildByInviteCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(guilds).where(eq(guilds.inviteCode, code.toUpperCase())).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get guild by invite code:", error);
    return undefined;
  }
}

// ═══════════════════════════════════════════════════════
// DAILY TASKS FUNCTIONS
// ═══════════════════════════════════════════════════════

const DEFAULT_DAILY_TASKS = [
  { title: "Beba 3 litros de água", description: "Hidratação é essencial para o corpo e a mente.", emoji: "💧", xpReward: 50, goldReward: 25, category: "health" },
  { title: "Faça 10 flexões", description: "Fortaleça o corpo com um exercício simples.", emoji: "💪", xpReward: 60, goldReward: 30, category: "fitness" },
  { title: "Caminhe por 20 minutos", description: "Uma caminhada diária melhora o humor e a saúde.", emoji: "🚶", xpReward: 70, goldReward: 35, category: "fitness" },
  { title: "Leia por 15 minutos", description: "Alimente sua mente com conhecimento.", emoji: "📖", xpReward: 50, goldReward: 25, category: "mind" },
  { title: "Faça 5 min de respiração consciente", description: "Reduza o estresse com meditação simples.", emoji: "🧘", xpReward: 40, goldReward: 20, category: "mind" },
  { title: "Coma uma refeição saudável", description: "Nutrição é a base do seu progresso.", emoji: "🥗", xpReward: 50, goldReward: 25, category: "health" },
  { title: "Durma antes da meia-noite", description: "O sono é o maior aliado da sua evolução.", emoji: "😴", xpReward: 80, goldReward: 40, category: "health" },
];

export async function seedDailyTasksIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select({ id: dailyTasks.id }).from(dailyTasks).limit(1);
    if (existing.length === 0) {
      await db.insert(dailyTasks).values(DEFAULT_DAILY_TASKS);
      console.log("[DailyTasks] Seeded default daily tasks");
    }
  } catch (e) {
    console.warn("[DailyTasks] Failed to seed daily tasks:", e);
  }
}

export async function getActiveDailyTasks() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(dailyTasks).where(eq(dailyTasks.active, 1));
  } catch (e) {
    console.warn("[DailyTasks] Failed to get daily tasks:", e);
    return [];
  }
}

export async function getUserDailyCompletions(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(dailyTaskCompletions)
      .where(and(eq(dailyTaskCompletions.userId, userId), eq(dailyTaskCompletions.completedDate, date)));
  } catch (e) {
    console.warn("[DailyTasks] Failed to get completions:", e);
    return [];
  }
}

export async function completeDailyTask(userId: number, dailyTaskId: number): Promise<{ success: boolean; alreadyDone: boolean; xpReward: number; goldReward: number }> {
  const db = await getDb();
  if (!db) return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
  try {
    const today = getTodayDateString();

    // Check if already completed today
    const existing = await db
      .select()
      .from(dailyTaskCompletions)
      .where(and(
        eq(dailyTaskCompletions.userId, userId),
        eq(dailyTaskCompletions.dailyTaskId, dailyTaskId),
        eq(dailyTaskCompletions.completedDate, today)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, alreadyDone: true, xpReward: 0, goldReward: 0 };
    }

    // Get task rewards
    const taskResult = await db.select().from(dailyTasks).where(eq(dailyTasks.id, dailyTaskId)).limit(1);
    if (taskResult.length === 0) return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
    const task = taskResult[0];

    // Record completion
    await db.insert(dailyTaskCompletions).values({ userId, dailyTaskId, completedDate: today });

    // Grant XP and Gold
    await updateUserProgress(userId, task.xpReward);
    await updateUserGold(userId, task.goldReward);
    await addExperienceToActivePet(userId, task.xpReward);

    return { success: true, alreadyDone: false, xpReward: task.xpReward, goldReward: task.goldReward };
  } catch (e) {
    console.warn("[DailyTasks] Failed to complete daily task:", e);
    return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
  }
}

export async function getFriendDailyProgress(friendId: number) {
  const db = await getDb();
  if (!db) return { completed: 0, total: 0 };
  try {
    const today = getTodayDateString();
    const [totalResult, completedResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(dailyTasks).where(eq(dailyTasks.active, 1)),
      db.select({ count: sql<number>`count(*)` }).from(dailyTaskCompletions)
        .where(and(eq(dailyTaskCompletions.userId, friendId), eq(dailyTaskCompletions.completedDate, today))),
    ]);
    return {
      completed: Number(completedResult[0]?.count ?? 0),
      total: Number(totalResult[0]?.count ?? 0),
    };
  } catch (e) {
    return { completed: 0, total: 0 };
  }
}

// ═══════════════════════════════════════════════════════
// MONTHLY DUNGEON FUNCTIONS
// ═══════════════════════════════════════════════════════

const ASTRAL_DUNGEON_MISSIONS = [
  { title: "50 Flexões", description: "Comece o aquecimento com 50 flexões de braço.", difficulty: "medium" as const, xpReward: 150, goldReward: 75, orderIndex: 0 },
  { title: "100 Abdominais", description: "Fortaleça seu core com 100 abdominais.", difficulty: "medium" as const, xpReward: 150, goldReward: 75, orderIndex: 1 },
  { title: "5 km Corrida", description: "Mantenha o ritmo por 5 quilômetros.", difficulty: "medium" as const, xpReward: 250, goldReward: 125, orderIndex: 2 },
  { title: "150 Polichinelos", description: "Explosão de cardio com 150 polichinelos.", difficulty: "medium" as const, xpReward: 180, goldReward: 90, orderIndex: 3 },
  { title: "100 Agachamentos", description: "Base sólida: 100 agachamentos profundos.", difficulty: "medium" as const, xpReward: 200, goldReward: 100, orderIndex: 4 },
  { title: "3 min Prancha", description: "Resistência pura: 3 minutos de prancha isométrica.", difficulty: "hard" as const, xpReward: 300, goldReward: 150, orderIndex: 5 },
  { title: "200 Abdominais", description: "Desafio dobrado: 200 abdominais para um core de aço.", difficulty: "hard" as const, xpReward: 350, goldReward: 175, orderIndex: 6 },
  { title: "100 Flexões", description: "O dobro do esforço: 100 flexões técnicas.", difficulty: "hard" as const, xpReward: 400, goldReward: 200, orderIndex: 7 },
  { title: "10 km Corrida", description: "A prova de fogo: 10 quilômetros sem parar.", difficulty: "hard" as const, xpReward: 500, goldReward: 250, orderIndex: 8 },
  { title: "BOSS: Desafio do Titã", description: "A glória astral espera por quem completar todos os desafios diários por 7 dias seguidos esta semana.", difficulty: "hard" as const, xpReward: 800, goldReward: 400, orderIndex: 9 },
];

export async function seedAstralDungeonIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    // Check for ACTIVE dungeon in CURRENT month
    const now = new Date();
    const existing = await db
      .select()
      .from(dungeons)
      .where(and(
        eq(dungeons.active, 1),
        sql`${dungeons.endsAt} >= ${now} `
      ))
      .limit(1);

    if (existing.length > 0) {
      // Fix: If existing dungeon has less than 28 days total duration, update it to end of month
      const dungeon = existing[0];
      const diffDays = Math.floor((dungeon.endsAt.getTime() - dungeon.startsAt.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 28) {
        console.log("[Dungeon] Updating existing dungeon duration to 1 month");
        const newEndsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await db.update(dungeons).set({ endsAt: newEndsAt }).where(eq(dungeons.id, dungeon.id));
      }
      return;
    }

    // Dungeon runs for the current calendar month
    const startsAt = new Date(now.getFullYear(), now.getMonth(), 1);
    const endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of month

    const [inserted] = await db.insert(dungeons).values({
      name: "Dungeon Astral",
      theme: "astral",
      description: "Uma jornada pelos confins do cosmos. Complete as missões antes que o portal se feche e desbloqueie o tema exclusivo ASTRAL para o seu perfil.",
      bannerEmoji: "🌌",
      themeRewardId: "astral",
      startsAt,
      endsAt,
      active: 1,
    });

    const dungeonId = (inserted as any).insertId as number;
    await db.insert(dungeonMissions).values(
      ASTRAL_DUNGEON_MISSIONS.map(m => ({ ...m, dungeonId }))
    );
    console.log("[Dungeon] Seeded ASTRAL dungeon");
  } catch (e) {
    console.warn("[Dungeon] Failed to seed ASTRAL dungeon:", e);
  }
}

export async function getActiveDungeon() {
  const db = await getDb();
  if (!db) return null;
  try {
    const now = new Date();
    const result = await db
      .select()
      .from(dungeons)
      .where(and(
        eq(dungeons.active, 1),
        sql`${dungeons.startsAt} <= ${now} `,
        sql`${dungeons.endsAt} >= ${now} `,
      ))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (e) {
    console.warn("[Dungeon] Failed to get active dungeon:", e);
    return null;
  }
}

export async function getDungeonMissions(dungeonId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(dungeonMissions)
      .where(eq(dungeonMissions.dungeonId, dungeonId))
      .orderBy(dungeonMissions.orderIndex);
  } catch (e) {
    return [];
  }
}

export async function getUserDungeonProgress(userId: number, dungeonId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(dungeonProgress)
      .where(and(eq(dungeonProgress.userId, userId), eq(dungeonProgress.dungeonId, dungeonId)));
  } catch (e) {
    return [];
  }
}

export async function completeDungeonMission(
  userId: number,
  dungeonId: number,
  missionId: number
): Promise<{ success: boolean; alreadyDone: boolean; xpReward: number; goldReward: number; themeUnlocked?: string }> {
  const db = await getDb();
  if (!db) return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
  try {
    // Check already done
    const existing = await db
      .select()
      .from(dungeonProgress)
      .where(and(
        eq(dungeonProgress.userId, userId),
        eq(dungeonProgress.dungeonId, dungeonId),
        eq(dungeonProgress.missionId, missionId),
      ))
      .limit(1);

    if (existing.length > 0) return { success: false, alreadyDone: true, xpReward: 0, goldReward: 0 };

    // Get mission
    const missionResult = await db.select().from(dungeonMissions).where(eq(dungeonMissions.id, missionId)).limit(1);
    if (missionResult.length === 0) return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
    const mission = missionResult[0];

    // Record progress
    await db.insert(dungeonProgress).values({ userId, dungeonId, missionId });

    // Grant XP and Gold
    await updateUserProgress(userId, mission.xpReward);
    await updateUserGold(userId, mission.goldReward);
    await addExperienceToActivePet(userId, mission.xpReward);

    // Check if all missions completed → unlock theme
    const allMissions = await getDungeonMissions(dungeonId);
    const allProgress = await getUserDungeonProgress(userId, dungeonId);
    const completedIds = new Set(allProgress.map(p => p.missionId));
    completedIds.add(missionId);

    let themeUnlocked: string | undefined;
    if (allMissions.every(m => completedIds.has(m.id))) {
      const dungeonResult = await db.select().from(dungeons).where(eq(dungeons.id, dungeonId)).limit(1);
      const dungeon = dungeonResult[0];
      if (dungeon?.themeRewardId) {
        // Check if already unlocked
        const existingTheme = await db
          .select()
          .from(userThemes)
          .where(and(eq(userThemes.userId, userId), eq(userThemes.themeId, dungeon.themeRewardId)))
          .limit(1);
        if (existingTheme.length === 0) {
          await db.insert(userThemes).values({ userId, themeId: dungeon.themeRewardId });
          themeUnlocked = dungeon.themeRewardId;
        }
      }
    }

    return { success: true, alreadyDone: false, xpReward: mission.xpReward, goldReward: mission.goldReward, themeUnlocked };
  } catch (e) {
    console.warn("[Dungeon] Failed to complete mission:", e);
    return { success: false, alreadyDone: false, xpReward: 0, goldReward: 0 };
  }
}

export async function getUnlockedThemes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userThemes).where(eq(userThemes.userId, userId));
  } catch (e) {
    return [];
  }
}

export async function equipTheme(userId: number, themeId: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    // Verify user owns the theme (except for 'default')
    if (themeId !== "default") {
      const owned = await db
        .select()
        .from(userThemes)
        .where(and(eq(userThemes.userId, userId), eq(userThemes.themeId, themeId)))
        .limit(1);
      if (owned.length === 0) return false;
    }

    await db
      .update(userProfiles)
      .set({ equippedThemeId: themeId })
      .where(eq(userProfiles.userId, userId));
    return true;
  } catch (e) {
    console.error("[Dungeon] Failed to equip theme:", e);
    return false;
  }
}

export async function updateLastSeenVersion(userId: number, version: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db
      .update(userProfiles)
      .set({ lastSeenVersion: version })
      .where(eq(userProfiles.userId, userId));
    return true;
  } catch (e) {
    console.error("[Profile] Failed to update last seen version:", e);
    return false;
  }
}

// Gold, Inventory and Cosmetics

export async function updateUserGold(userId: number, goldChange: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    let finalChange = goldChange;
    if (goldChange > 0) {
      const userRole = await getUserGuild(userId);
      if (userRole) {
        const gUpgrades = await getGuildUpgrades(userRole.id);
        if (gUpgrades.some(u => u.upgradeId === "chalice-gold")) {
          finalChange = Math.floor(finalChange * 1.15);
        }
      }
    }

    const newGold = Math.max(0, profile.gold + finalChange);
    await db.update(userProfiles).set({ gold: newGold }).where(eq(userProfiles.userId, userId));
    return true;
  } catch (e) {
    console.error("[Gold] Failed to update gold:", e);
    return false;
  }
}

export async function getUserInventory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userInventory).where(eq(userInventory.userId, userId));
  } catch (e) {
    console.error("[Inventory] Failed to get inventory:", e);
    return [];
  }
}

export async function addToUserInventory(userId: number, itemId: string, quantity: number = 1) {
  const db = await getDb();
  if (!db) return false;
  try {
    const existing = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userInventory)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(userInventory.id, existing[0].id));
    } else {
      await db.insert(userInventory).values({ userId, itemId, quantity });
    }
    return true;
  } catch (e) {
    console.error("[Inventory] Failed to add to inventory:", e);
    return false;
  }
}

export async function useUserInventoryItem(userId: number, itemId: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    const existing = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
      .limit(1);

    if (existing.length === 0 || existing[0].quantity <= 0) return false;

    if (existing[0].quantity === 1) {
      await db.delete(userInventory).where(eq(userInventory.id, existing[0].id));
    } else {
      await db
        .update(userInventory)
        .set({ quantity: existing[0].quantity - 1 })
        .where(eq(userInventory.id, existing[0].id));
    }

    // Apply Effects
    if (itemId === "scroll-gold") {
      await updateUserGold(userId, 200);
    } else if (itemId === "potion-heal") {
      const profile = await getUserProfile(userId);
      if (profile) {
        const newHp = Math.min(100, profile.hp + 30);
        await db.update(userProfiles).set({ hp: newHp }).where(eq(userProfiles.userId, userId));
      }
    }
    return true;
  } catch (e) {
    console.error("[Inventory] Failed to use item:", e);
    return false;
  }
}

export async function getUserCosmetics(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userCosmetics).where(eq(userCosmetics.userId, userId));
  } catch (e) {
    console.error("[Cosmetics] Failed to get cosmetics:", e);
    return [];
  }
}

export async function buyUserCosmetic(userId: number, cosmeticId: string, price: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const profile = await getUserProfile(userId);
    if (!profile || profile.gold < price) return false;

    // Check if already owned
    const owned = await db
      .select()
      .from(userCosmetics)
      .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId)))
      .limit(1);
    if (owned.length > 0) return false;

    // Deduct gold and add cosmetic
    await db.transaction(async (tx) => {
      await tx.update(userProfiles).set({ gold: profile.gold - price }).where(eq(userProfiles.userId, userId));
      await tx.insert(userCosmetics).values({ userId, cosmeticId, equipped: 0 });
    });
    return true;
  } catch (e) {
    console.error("[Cosmetics] Failed to buy cosmetic:", e);
    return false;
  }
}

export async function equipUserCosmetic(userId: number, cosmeticId: string, category: 'border' | 'theme') {
  const db = await getDb();
  if (!db) return false;
  try {
    // For themes, we use the existing equipTheme logic or update it
    if (category === 'theme') {
      const themeKey = cosmeticId.replace('theme-', '');
      return await equipTheme(userId, themeKey);
    }

    // For borders (stored in userCosmetics)
    const owned = await db
      .select()
      .from(userCosmetics)
      .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId)))
      .limit(1);
    if (owned.length === 0) return false;

    await db.transaction(async (tx) => {
      // Unequip all other borders
      await tx
        .update(userCosmetics)
        .set({ equipped: 0 })
        .where(and(eq(userCosmetics.userId, userId), sql`cosmeticId LIKE 'border-%'`));

      // Equip this one
      await tx
        .update(userCosmetics)
        .set({ equipped: 1 })
        .where(and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId)));
    });
    return true;
  } catch (e) {
    console.error("[Cosmetics] Failed to equip cosmetic:", e);
    return false;
  }
}

// ── Pets System ────────────────────────────────────────

export const PET_DEFS: Record<string, {
  name: string;
  description: string;
  bonus: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}> = {
  "slime-blue": {
    name: "Slime Azul",
    description: "Um pequeno companheiro gelatinoso e amigável.",
    bonus: "+5% XP em tarefas",
    icon: "💧",
    rarity: 'common'
  },
  "fox-fire": {
    name: "Raposa de Fogo",
    description: "Uma raposa mística que emana calor e determinação.",
    bonus: "+10% XP em tarefas de Foco",
    icon: "🦊",
    rarity: 'rare'
  },
  "dragon-void": {
    name: "Dragão do Vácuo",
    description: "Um dragão ancestral que distorce a realidade.",
    bonus: "+15% XP em todas as missões",
    icon: "🐲",
    rarity: 'epic'
  },
  "phoenix-gold": {
    name: "Fênix Dourada",
    description: "Uma ave lendária que renasce das cinzas do fracasso.",
    bonus: "Proteção de Streak + Reset de HP 1x/semana",
    icon: "🐦",
    rarity: 'legendary'
  }
};

export async function getUserPets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(userPets).where(eq(userPets.userId, userId));
  } catch (e) {
    console.error("[Pets] Failed to get pets:", e);
    return [];
  }
}

export async function grantUserPet(userId: number, petId: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    const existing = await db
      .select()
      .from(userPets)
      .where(and(eq(userPets.userId, userId), eq(userPets.petId, petId)))
      .limit(1);

    if (existing.length > 0) return false; // Already has it

    await db.insert(userPets).values({ userId, petId, level: 1, experience: 0, isActive: 0 });
    return true;
  } catch (e) {
    console.error("[Pets] Failed to grant pet:", e);
    return false;
  }
}

export async function activateUserPet(userId: number, petId: string | null) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.transaction(async (tx) => {
      // Deactivate all
      await tx.update(userPets).set({ isActive: 0 }).where(eq(userPets.userId, userId));

      if (petId) {
        // Activate specific one
        await tx
          .update(userPets)
          .set({ isActive: 1 })
          .where(and(eq(userPets.userId, userId), eq(userPets.petId, petId)));
      }
    });
    return true;
  } catch (e) {
    console.error("[Pets] Failed to activate pet:", e);
    return false;
  }
}

export async function addExperienceToActivePet(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const activePet = await db
      .select()
      .from(userPets)
      .where(and(eq(userPets.userId, userId), eq(userPets.isActive, 1)))
      .limit(1);

    if (activePet.length === 0) return false;

    const pet = activePet[0];
    let newExp = pet.experience + amount;
    let newLevel = pet.level;

    // Simple level up logic: level * 100 XP
    const expNeeded = newLevel * 100;
    if (newExp >= expNeeded) {
      newExp -= expNeeded;
      newLevel += 1;
    }

    await db
      .update(userPets)
      .set({ level: newLevel, experience: newExp })
      .where(eq(userPets.id, pet.id));

    return true;
  } catch (e) {
    console.error("[Pets] Failed to add experience to pet:", e);
    return false;
  }
}

// ── Guild Vault System ─────────────────────────────────

export const GUILD_UPGRADE_DEFS: Record<string, {
  name: string;
  description: string;
  bonus: string;
  price: number;
  durationHours: number;
  icon: string;
}> = {
  "banner-xp": {
    name: "Estandarte de Batalha",
    description: "Um estandarte imponente que inspira todos os membros.",
    bonus: "+20% XP global",
    price: 1000,
    durationHours: 24,
    icon: "🚩"
  },
  "chalice-gold": {
    name: "Cálice da Prosperidade",
    description: "Um cálice sagrado que atrai riquezas para a guilda.",
    bonus: "+15% Ouro global",
    price: 1500,
    durationHours: 48,
    icon: "🏆"
  },
  "shield-protection": {
    name: "Escudo do Guardião",
    description: "Protege os membros de danos críticos.",
    bonus: "-50% Dano de Missões Expiradas",
    price: 2000,
    durationHours: 72,
    icon: "🛡️"
  }
};

export async function donateToGuild(userId: number, goldAmount: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const userRole = await getUserGuild(userId);
    if (!userRole) return false;

    const profile = await getUserProfile(userId);
    if (!profile || profile.gold < goldAmount) return false;

    await db.transaction(async (tx) => {
      // Deduct from user
      await tx.update(userProfiles).set({ gold: profile.gold - goldAmount }).where(eq(userProfiles.userId, userId));
      // Add to guild vault
      await tx
        .update(guilds)
        .set({ vaultGold: sql`${guilds.vaultGold} + ${goldAmount}` })
        .where(eq(guilds.id, userRole.id));
    });
    return true;
  } catch (e) {
    console.error("[Vault] Failed to donate:", e);
    return false;
  }
}

export async function buyGuildUpgrade(leaderId: number, guildId: number, upgradeId: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    const guild = await getGuild(guildId);
    if (!guild || guild.leaderId !== leaderId) return false;

    const def = GUILD_UPGRADE_DEFS[upgradeId];
    if (!def || guild.vaultGold < def.price) return false;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + def.durationHours);

    await db.transaction(async (tx) => {
      // Deduct from vault
      await tx.update(guilds).set({ vaultGold: guild.vaultGold - def.price }).where(eq(guilds.id, guildId));

      // Upsert upgrade
      const existing = await tx.select().from(guildUpgrades).where(and(eq(guildUpgrades.guildId, guildId), eq(guildUpgrades.upgradeId, upgradeId))).limit(1);

      if (existing.length > 0) {
        // If still active, extend. If expired, reset.
        const currentEnd = existing[0].expiresAt ? new Date(existing[0].expiresAt).getTime() : 0;
        const newEnd = Math.max(Date.now(), currentEnd) + (def.durationHours * 60 * 60 * 1000);
        await tx.update(guildUpgrades).set({ expiresAt: new Date(newEnd) }).where(eq(guildUpgrades.id, existing[0].id));
      } else {
        await tx.insert(guildUpgrades).values({ guildId, upgradeId, expiresAt, level: 1 });
      }
    });
    return true;
  } catch (e) {
    console.error("[Vault] Failed to buy upgrade:", e);
    return false;
  }
}

export async function getGuildUpgrades(guildId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(guildUpgrades).where(and(eq(guildUpgrades.guildId, guildId), sql`expiresAt > NOW()`));
  } catch (e) {
    console.error("[Vault] Failed to get upgrades:", e);
    return [];
  }
}
