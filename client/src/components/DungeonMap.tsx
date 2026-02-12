import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DoorOpen, Swords, Flame, CheckCircle2, Plus, ShieldCheck, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AddQuestDialog } from "@/components/AddQuestDialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";

// ── Types ──
interface Room {
    id: number;
    taskId?: number;
    type: "entrance" | "normal" | "boss" | "add";
    difficulty?: "easy" | "medium" | "hard";
    status: "locked" | "unlocked" | "completed";
    taskName: string;
    originalTask?: Task;
    xpReward?: number;
}

interface Floor {
    number: number;
    rooms: Room[];
    completed: number;
    total: number;
}

// ── Difficulty Config ──
const diffConfig = {
    easy: {
        icon: ShieldCheck,
        color: "text-green-500",
        border: "border-green-500",
        bg: "bg-green-500/10",
        glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
        label: "Fácil",
        size: "w-20 h-20",
    },
    medium: {
        icon: Swords,
        color: "text-blue-500",
        border: "border-blue-500",
        bg: "bg-blue-500/10",
        glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
        label: "Médio",
        size: "w-24 h-24",
    },
    hard: {
        icon: Flame,
        color: "text-red-500",
        border: "border-red-500",
        bg: "bg-red-500/10",
        glow: "shadow-[0_0_25px_rgba(239,68,68,0.5)]",
        label: "Difícil",
        size: "w-28 h-28",
    },
};

const ROOMS_PER_FLOOR = 3;

export function DungeonMap() {
    const queryClient = useQueryClient();
    const { data: tasks = [] } = trpc.tasks.list.useQuery();
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // ── Mutations ──
    const createTaskMutation = trpc.tasks.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });
            toast.success("Novo desafio adicionado à masmorra!");
        },
    });

    const updateTaskMutation = trpc.tasks.update.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });
            setEditingTask(null);
            toast.success("Missão atualizada!");
        },
    });

    const completeTaskMutation = trpc.tasks.complete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });
            queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] });
            setSelectedRoom(null);

            // Gold reward logic
            const task = selectedRoom?.originalTask;
            if (task) {
                let goldReward = 0;
                if (task.difficulty === "easy") goldReward = 50;
                else if (task.difficulty === "medium") goldReward = 100;
                else if (task.difficulty === "hard") goldReward = 200;

                const currentGold = Number(localStorage.getItem("shop_gold") || "0");
                localStorage.setItem("shop_gold", String(currentGold + goldReward));
                window.dispatchEvent(new Event("gold-changed"));
            }

            toast.success("🏰 Sala da masmorra concluída!");
        },
    });

    // ── Build Rooms from Tasks ──
    const sortedTasks = [...tasks].sort((a, b) => a.id - b.id);

    const rooms: Room[] = sortedTasks.map((task, index) => {
        const isFirst = index === 0;
        const prevTask = index > 0 ? sortedTasks[index - 1] : null;
        const isUnlocked = isFirst || (prevTask?.completed ?? false);
        const isHard = task.difficulty === "hard";

        return {
            id: index + 1,
            taskId: task.id,
            type: isFirst ? "entrance" : isHard ? "boss" : "normal",
            difficulty: task.difficulty as "easy" | "medium" | "hard",
            status: task.completed ? "completed" : isUnlocked ? "unlocked" : "locked",
            taskName: task.title,
            originalTask: task,
            xpReward: task.xpReward,
        };
    });

    // Add "New Room" node
    rooms.push({
        id: rooms.length + 1,
        type: "add",
        status: "unlocked",
        taskName: "Adicionar Sala",
    });

    // ── Group into Floors ──
    const floors: Floor[] = [];
    const taskRooms = rooms.filter((r) => r.type !== "add");
    const addRoom = rooms.find((r) => r.type === "add");

    for (let i = 0; i < taskRooms.length; i += ROOMS_PER_FLOOR) {
        const floorRooms = taskRooms.slice(i, i + ROOMS_PER_FLOOR);
        floors.push({
            number: Math.floor(i / ROOMS_PER_FLOOR) + 1,
            rooms: floorRooms,
            completed: floorRooms.filter((r) => r.status === "completed").length,
            total: floorRooms.length,
        });
    }

    // ── Handlers ──
    const handleRoomClick = (room: Room) => {
        if (room.type === "add") return;
        if (room.status === "locked") {
            toast.error("🔒 Sala bloqueada! Complete a anterior primeiro.");
            return;
        }
        setSelectedRoom(room);
    };

    const handleComplete = () => {
        if (selectedRoom?.taskId) {
            completeTaskMutation.mutate({ taskId: selectedRoom.taskId });
        }
    };

    const handleEdit = () => {
        if (selectedRoom?.originalTask) {
            setEditingTask(selectedRoom.originalTask);
            setSelectedRoom(null);
        }
    };

    const handleAdd = (data: any) => {
        createTaskMutation.mutate(data);
    };

    const handleUpdate = (data: any) => {
        if (editingTask) {
            updateTaskMutation.mutate({ id: editingTask.id, ...data });
        }
    };

    // ── Render ──
    return (
        <div className="w-full flex flex-col gap-2 py-6 relative">
            {/* Dungeon Progress — Total */}
            <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                    Profundidade: Andar {floors.length}
                </span>
                <span className="text-xs text-muted-foreground">
                    {taskRooms.filter((r) => r.status === "completed").length}/{taskRooms.length} salas
                </span>
            </div>

            {/* Floors */}
            {floors.map((floor, floorIndex) => (
                <div key={floor.number} className="relative">
                    {/* Floor Header */}
                    <div className="flex items-center gap-3 px-4 mb-3">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">
                            Andar {floor.number}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(floor.completed / floor.total) * 100}%` }}
                                transition={{ duration: 0.8, delay: floorIndex * 0.2 }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                            {floor.completed}/{floor.total}
                        </span>
                    </div>

                    {/* Rooms — Zigzag Layout */}
                    <div className="relative px-4">
                        {floor.rooms.map((room, roomIndex) => {
                            const globalIndex = floorIndex * ROOMS_PER_FLOOR + roomIndex;
                            const isLeft = roomIndex % 2 === 0;
                            const isCompleted = room.status === "completed";
                            const isUnlocked = room.status === "unlocked";
                            const isLocked = room.status === "locked";
                            const isBoss = room.type === "boss";
                            const diff = room.difficulty ? diffConfig[room.difficulty] : diffConfig.medium;
                            const Icon = isCompleted ? CheckCircle2 : room.type === "entrance" ? DoorOpen : diff.icon;

                            return (
                                <motion.div
                                    key={room.id}
                                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: globalIndex * 0.08, type: "spring", stiffness: 200 }}
                                    className={cn(
                                        "flex items-center gap-4 mb-4",
                                        isLeft ? "flex-row" : "flex-row-reverse"
                                    )}
                                >
                                    {/* Room Node */}
                                    <button
                                        onClick={() => handleRoomClick(room)}
                                        disabled={isLocked}
                                        className={cn(
                                            "relative rounded-2xl border-3 flex flex-col items-center justify-center transition-all duration-300 shrink-0",
                                            diff.size,
                                            isCompleted
                                                ? `${diff.bg} ${diff.border} ${diff.glow} opacity-80`
                                                : isUnlocked
                                                    ? `bg-card ${diff.border} cursor-pointer hover:scale-105 ${diff.glow}`
                                                    : "bg-muted/20 border-muted-foreground/20 opacity-40 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "transition-all",
                                                isBoss ? "w-10 h-10" : room.difficulty === "easy" ? "w-7 h-7" : "w-8 h-8",
                                                isCompleted
                                                    ? diff.color
                                                    : isUnlocked
                                                        ? diff.color
                                                        : "text-muted-foreground"
                                            )}
                                        />

                                        {/* Boss Badge */}
                                        {isBoss && !isCompleted && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                Boss
                                            </span>
                                        )}

                                        {/* Unlocked Pulse */}
                                        {isUnlocked && !isCompleted && (
                                            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500" />
                                            </span>
                                        )}
                                    </button>

                                    {/* Room Label */}
                                    <div
                                        className={cn(
                                            "flex-1 min-w-0 transition-all duration-300",
                                            isLeft ? "text-left" : "text-right",
                                            isLocked ? "opacity-40" : "opacity-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-2" style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}>
                                            <span className={cn(
                                                "text-[10px] uppercase tracking-widest font-bold",
                                                isCompleted ? "text-muted-foreground" : diff.color
                                            )}>
                                                {isBoss ? "⚠ BOSS" : `Sala ${room.id}`}
                                            </span>
                                            {room.difficulty && (
                                                <span className={cn(
                                                    "text-[9px] px-1.5 py-0.5 rounded-full border",
                                                    isCompleted ? "border-muted-foreground/30 text-muted-foreground" : `${diff.border} ${diff.color}`
                                                )}>
                                                    {diff.label}
                                                </span>
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-sm font-display truncate mt-0.5",
                                            isCompleted ? "line-through text-muted-foreground" : "text-foreground font-semibold"
                                        )} title={room.taskName}>
                                            {room.taskName}
                                        </p>
                                        {room.xpReward && (
                                            <span className="text-[10px] text-yellow-500 flex items-center gap-0.5 mt-0.5" style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}>
                                                <Zap className="w-3 h-3 fill-yellow-500" /> {room.xpReward} XP
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Connecting Lines */}
                        {floor.rooms.length > 1 && (
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none">
                                <div className="w-full h-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
                            </div>
                        )}
                    </div>

                    {/* Floor Separator */}
                    {floorIndex < floors.length - 1 && (
                        <div className="flex items-center gap-3 my-4 px-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <span className="text-[10px] text-primary/40 uppercase tracking-widest">▼ Descendo ▼</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        </div>
                    )}
                </div>
            ))}

            {/* Add Room Button */}
            {addRoom && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center my-4"
                >
                    <AddQuestDialog
                        onAdd={handleAdd}
                        trigger={
                            <button className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary/60 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 cursor-pointer">
                                <Plus className="w-5 h-5" />
                                <span className="text-sm font-display font-semibold">Nova Sala</span>
                            </button>
                        }
                    />
                </motion.div>
            )}

            {/* Room Detail Popover */}
            <AnimatePresence>
                {selectedRoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedRoom(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "relative bg-card border-2 rounded-2xl p-6 w-full max-w-sm shadow-2xl",
                                selectedRoom.difficulty ? diffConfig[selectedRoom.difficulty].border : "border-primary"
                            )}
                        >
                            <button
                                onClick={() => setSelectedRoom(null)}
                                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                {selectedRoom.difficulty && (() => {
                                    const d = diffConfig[selectedRoom.difficulty];
                                    const RoomIcon = d.icon;
                                    return (
                                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border-2", d.bg, d.border)}>
                                            <RoomIcon className={cn("w-8 h-8", d.color)} />
                                        </div>
                                    );
                                })()}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                                        {selectedRoom.type === "boss" ? "⚠ BOSS ROOM" : `Sala ${selectedRoom.id}`}
                                    </p>
                                    <h3 className="text-lg font-display font-bold truncate">{selectedRoom.taskName}</h3>
                                </div>
                            </div>

                            {selectedRoom.originalTask?.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {selectedRoom.originalTask.description}
                                </p>
                            )}

                            <div className="flex items-center gap-3 mb-5 text-sm">
                                {selectedRoom.difficulty && (
                                    <span className={cn(
                                        "px-2 py-1 rounded-lg text-xs font-bold border",
                                        diffConfig[selectedRoom.difficulty].border,
                                        diffConfig[selectedRoom.difficulty].color,
                                        diffConfig[selectedRoom.difficulty].bg
                                    )}>
                                        {diffConfig[selectedRoom.difficulty].label}
                                    </span>
                                )}
                                {selectedRoom.xpReward && (
                                    <span className="text-yellow-500 flex items-center gap-1 text-xs font-bold">
                                        <Zap className="w-3.5 h-3.5 fill-yellow-500" />
                                        {selectedRoom.xpReward} XP
                                    </span>
                                )}
                                <span className="text-yellow-400 text-xs font-bold">
                                    🪙 {selectedRoom.difficulty === "easy" ? 50 : selectedRoom.difficulty === "medium" ? 100 : 200} Ouro
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {selectedRoom.status === "completed" ? (
                                    <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-bold">
                                        <CheckCircle2 className="w-4 h-4" /> Concluída
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleComplete}
                                            disabled={completeTaskMutation.isPending}
                                            className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/80 hover:to-cyan-500/80 text-white font-bold"
                                        >
                                            {completeTaskMutation.isPending ? "..." : "⚔️ Completar"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleEdit}
                                            className="border-muted-foreground/30"
                                        >
                                            Editar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Dialog */}
            {editingTask && (
                <AddQuestDialog
                    isOpen={!!editingTask}
                    onOpenChange={(open) => {
                        if (!open) setEditingTask(null);
                    }}
                    onAdd={handleUpdate}
                    initialData={{
                        title: editingTask.title,
                        description: editingTask.description || undefined,
                        difficulty: editingTask.difficulty,
                        deadline: undefined,
                    }}
                    trigger={<></>}
                />
            )}

            {/* Dungeon Tip */}
            <div className="text-center mt-4 px-4">
                <p className="text-xs text-muted-foreground/60">
                    Clique numa sala desbloqueada para ver detalhes e completar.
                </p>
            </div>
        </div>
    );
}
