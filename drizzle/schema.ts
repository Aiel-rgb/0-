import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  avatarUrl: text("avatarUrl"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile with XP and level information
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  currentLevel: int("currentLevel").default(1).notNull(),
  xpInCurrentLevel: int("xpInCurrentLevel").default(0).notNull(),
  xpNeededForNextLevel: int("xpNeededForNextLevel").default(100).notNull(),
  hp: int("hp").default(100).notNull(),
  streak: int("streak").default(0).notNull(),
  lastStreakUpdate: timestamp("lastStreakUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  equippedThemeId: varchar("equippedThemeId", { length: 64 }).default("default").notNull(),
  lastSeenVersion: varchar("lastSeenVersion", { length: 32 }).default("0.0.0").notNull(),
  gold: int("gold").default(0).notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * User inventory for consumables
 */
export const userInventory = mysqlTable("userInventory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserInventory = typeof userInventory.$inferSelect;
export type InsertUserInventory = typeof userInventory.$inferInsert;

/**
 * User cosmetics (borders, themes)
 */
export const userCosmetics = mysqlTable("userCosmetics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cosmeticId: varchar("cosmeticId", { length: 64 }).notNull(),
  equipped: int("equipped").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCosmetic = typeof userCosmetics.$inferSelect;
export type InsertUserCosmetic = typeof userCosmetics.$inferInsert;

/**
 * Tasks/Habits created by users
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  epicName: text("epicName"), // AI Generated Epic Name
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  xpReward: int("xpReward").notNull(),
  xpPenalty: int("xpPenalty").notNull(),
  repeatType: mysqlEnum("repeatType", ["daily", "weekly", "none"]).default("daily").notNull(),
  repeatDays: text("repeatDays"), // JSON array of day indices [0-6]
  repeatEndsAt: timestamp("repeatEndsAt"),
  isOneTimeCompleted: int("isOneTimeCompleted").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Daily task completions
 */
export const taskCompletions = mysqlTable("taskCompletions", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  xpGained: int("xpGained").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = typeof taskCompletions.$inferInsert;

/**
 * Guilds
 */
export const guilds = mysqlTable("guilds", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  bannerUrl: text("bannerUrl"),
  inviteCode: varchar("inviteCode", { length: 12 }).unique(),
  leaderId: int("leaderId").notNull(),
  totalXp: int("totalXp").default(0).notNull(),
  totalRaidsCompleted: int("totalRaidsCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = typeof guilds.$inferInsert;

/**
 * Guild members (N:N users <-> guilds)
 */
export const guildMembers = mysqlTable("guildMembers", {
  id: int("id").autoincrement().primaryKey(),
  guildId: int("guildId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["leader", "officer", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildMember = typeof guildMembers.$inferInsert;

/**
 * Guild raids — monthly tasks assigned by the leader
 */
export const guildRaids = mysqlTable("guildRaids", {
  id: int("id").autoincrement().primaryKey(),
  guildId: int("guildId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  xpReward: int("xpReward").default(500).notNull(),
  assignedByUserId: int("assignedByUserId").notNull(),
  status: mysqlEnum("status", ["active", "completed", "failed"]).default("active").notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuildRaid = typeof guildRaids.$inferSelect;
export type InsertGuildRaid = typeof guildRaids.$inferInsert;

/**
 * Friendships (bi-directional, with pending/accepted status)
 */
export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  friendId: int("friendId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;

/**
 * Guild Raid Participants - tracks individual completion of a raid
 */
export const guildRaidParticipants = mysqlTable("guildRaidParticipants", {
  id: int("id").autoincrement().primaryKey(),
  raidId: int("raidId").notNull(),
  userId: int("userId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type GuildRaidParticipant = typeof guildRaidParticipants.$inferSelect;
export type InsertGuildRaidParticipant = typeof guildRaidParticipants.$inferInsert;

/**
 * Daily Tasks — preset healthy habit challenges that reset every day at midnight
 */
export const dailyTasks = mysqlTable("dailyTasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 8 }).default("✅").notNull(),
  xpReward: int("xpReward").default(50).notNull(),
  goldReward: int("goldReward").default(25).notNull(),
  category: varchar("category", { length: 64 }).default("health").notNull(),
  active: int("active").default(1).notNull(), // 1 = active, 0 = disabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = typeof dailyTasks.$inferInsert;

/**
 * Daily Task Completions — tracks which user completed which daily task on which date
 */
export const dailyTaskCompletions = mysqlTable("dailyTaskCompletions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dailyTaskId: int("dailyTaskId").notNull(),
  completedDate: varchar("completedDate", { length: 10 }).notNull(), // YYYY-MM-DD
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type DailyTaskCompletion = typeof dailyTaskCompletions.$inferSelect;
export type InsertDailyTaskCompletion = typeof dailyTaskCompletions.$inferInsert;

/**
 * Monthly Dungeons — themed dungeons that run for a calendar month
 */
export const dungeons = mysqlTable("dungeons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  theme: varchar("theme", { length: 64 }).notNull(), // e.g. "astral", "fire", "ice"
  description: text("description"),
  bannerEmoji: varchar("bannerEmoji", { length: 8 }).default("🏰").notNull(),
  themeRewardId: varchar("themeRewardId", { length: 64 }), // CSS theme key
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dungeon = typeof dungeons.$inferSelect;
export type InsertDungeon = typeof dungeons.$inferInsert;

/**
 * Dungeon Missions — preset missions within a monthly dungeon
 */
export const dungeonMissions = mysqlTable("dungeonMissions", {
  id: int("id").autoincrement().primaryKey(),
  dungeonId: int("dungeonId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  goldReward: int("goldReward").default(50).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export type DungeonMission = typeof dungeonMissions.$inferSelect;
export type InsertDungeonMission = typeof dungeonMissions.$inferInsert;

/**
 * Dungeon Progress — tracks which missions a user has completed
 */
export const dungeonProgress = mysqlTable("dungeonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dungeonId: int("dungeonId").notNull(),
  missionId: int("missionId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type DungeonProgress = typeof dungeonProgress.$inferSelect;
export type InsertDungeonProgress = typeof dungeonProgress.$inferInsert;

/**
 * User Themes — cosmetic themes unlocked by completing monthly dungeons
 */
export const userThemes = mysqlTable("userThemes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  themeId: varchar("themeId", { length: 64 }).notNull(), // e.g. "astral"
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;