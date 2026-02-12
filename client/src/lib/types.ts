export interface Task {
    id: number;
    title: string;
    epicName?: string | null;  // AI Generated
    description?: string | null;
    difficulty: "easy" | "medium" | "hard";
    xpReward: number;
    completed: boolean;
}

// Basic User
export interface User {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    createdAt: string | Date;
}

export interface UserProfile {
    level: number;
    totalXp: number;
    currentXp: number;
    xpNeeded: number;
}

export interface Guild {
    id: number;
    name: string;
    description: string | null;
    bannerUrl: string | null;
    leaderId: number;
    totalXp: number;
    totalRaidsCompleted: number;
    memberRole?: string;
    memberCount?: number;
    leaderName?: string;
    leaderAvatar?: string | null;
    createdAt: string | Date;
}

export interface GuildMember {
    id: number;
    userId: number;
    role: "leader" | "officer" | "member";
    joinedAt: string | Date;
    name: string | null;
    avatarUrl: string | null;
    level: number | null;
    totalXp: number | null;
}

export interface GuildRaid {
    id: number;
    guildId: number;
    title: string;
    description: string | null;
    difficulty: "easy" | "medium" | "hard";
    xpReward: number;
    assignedByUserId: number;
    status: "active" | "completed" | "failed";
    month: number;
    year: number;
    completedAt: string | Date | null;
    createdAt: string | Date;
}
