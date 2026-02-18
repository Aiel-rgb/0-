import { eq, and, sql, desc, or, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, userProfiles, tasks, taskCompletions, guilds, guildMembers, guildRaids, friendships, guildRaidParticipants, dailyTasks, dailyTaskCompletions } from "../drizzle/schema";
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

    // xp logic
    let newTotalXp = profile.totalXp + xpGain;
    let newLevel = profile.currentLevel;
    let newXpInLevel = profile.xpInCurrentLevel + xpGain;
    let xpNeeded = profile.xpNeededForNextLevel;

    while (newXpInLevel >= xpNeeded) {
      newXpInLevel -= xpNeeded;
      newLevel += 1;
      xpNeeded = Math.floor(100 * (1.1 ** (newLevel - 1)));
    }

    // streak logic
    const now = new Date();
    // Normalize to local date string or just use UTC for simplicity?
    // Using UTC days is safer for consistency.
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    let newStreak = profile.streak;
    let newLastUpdate = profile.lastStreakUpdate;

    if (!profile.lastStreakUpdate) {
      // First task ever
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
        // Missed one or more days
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

  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));

  // Get today's completions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completions = await db.select()
    .from(taskCompletions)
    .where(and(
      eq(taskCompletions.userId, userId),
      sql`${taskCompletions.completedAt} >= ${today}`
    ));

  const completedTaskIds = new Set(completions.map(c => c.taskId));

  return allTasks.map(task => ({
    ...task,
    completed: completedTaskIds.has(task.id)
  }));
}

export async function createTask(userId: number, task: any) {
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

export async function updateTask(taskId: number, userId: number, data: { title?: string; description?: string; difficulty?: "easy" | "medium" | "hard" }) {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCompletion = await db.select()
      .from(taskCompletions)
      .where(and(
        eq(taskCompletions.taskId, taskId),
        eq(taskCompletions.userId, userId),
        sql`${taskCompletions.completedAt} >= ${today}`
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
    // Update user XP & Streak
    await updateUserProgress(userId, xpGained);
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
      totalXp: sql`${guilds.totalXp} + ${raid[0].xpReward}`,
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
        console.log(`[Guild] Raid ${raid.id} failed due to timeout. Penalty applied.`);
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
      resolve(`${salt}:${derivedKey.toString("hex")}`);
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
    const openId = `local-${crypto.randomBytes(16).toString("hex")}`;

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
        sql`LOWER(${users.name}) LIKE ${`%${query.toLowerCase()}%`}`,
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
    const today = new Date().toISOString().split("T")[0];

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

    // Grant XP
    await updateUserProgress(userId, task.xpReward);

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
    const today = new Date().toISOString().split("T")[0];
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

