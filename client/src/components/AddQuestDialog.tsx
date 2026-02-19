import { useState } from "react";
import { Plus, Swords, Clock, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddQuestDialogProps {
    onAdd: (data: { title: string; description?: string; difficulty: "easy" | "medium" | "hard"; deadline?: string; repeatType?: "daily" | "weekly" | "none"; repeatDays?: number[]; repeatEndsAt?: string }) => void;
    initialData?: { title: string; description?: string; difficulty: "easy" | "medium" | "hard"; deadline?: string };
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddQuestDialog({ onAdd, initialData, trigger, isOpen, onOpenChange }: AddQuestDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled state if provided, otherwise internal
    const open = isOpen !== undefined ? isOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialData?.difficulty || "medium");
    const [deadline, setDeadline] = useState(initialData?.deadline || "");
    const [repeatType, setRepeatType] = useState<"daily" | "weekly" | "none">("none");
    const [repeatDays, setRepeatDays] = useState<number[]>([]);
    const [repeatDuration, setRepeatDuration] = useState<"forever" | "month" | "year">("forever");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        let endsAt: Date | undefined;
        if (repeatType !== 'none') {
            const now = new Date();
            if (repeatDuration === 'month') {
                endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (repeatDuration === 'year') {
                endsAt = new Date(now.getFullYear(), 11, 31);
            }
        }

        onAdd({
            title,
            description,
            difficulty,
            deadline: deadline || undefined,
            repeatType,
            repeatDays: repeatType === 'weekly' ? repeatDays : undefined,
            repeatEndsAt: endsAt?.toISOString()
        });
        setOpen(false);
        if (!initialData) {
            setTitle("");
            setDescription("");
            setDifficulty("medium");
            setDeadline("");
            setRepeatType("none");
            setRepeatDays([]);
            setRepeatDuration("forever");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="w-full sm:w-auto bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,217,255,0.3)] hover:shadow-[0_0_25px_rgba(0,217,255,0.5)] transition-all">
                        <Swords className="mr-2 h-4 w-4" />
                        Nova Missão
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl text-primary">
                        {initialData ? "Editar Missão" : "Nova Missão"}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData ? "Atualize os detalhes da sua missão." : "Defina uma nova missão para o seu herói. Escolha a dificuldade sabiamente."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título da Missão</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Treinar Espada (Academia)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-secondary/50 border-border"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Detalhes (Opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Ex: 3 séries de 12 repetições..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-secondary/50 border-border resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Dificuldade</Label>
                            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                <SelectTrigger className="bg-secondary/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Fácil - 10 XP</SelectItem>
                                    <SelectItem value="medium">Médio - 25 XP</SelectItem>
                                    <SelectItem value="hard">Difícil - 50 XP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deadline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Prazo (Hoje)
                            </Label>
                            <Input
                                id="deadline"
                                type="time"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                    </div>

                    {/* Repetition Section */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <Label className="flex items-center gap-2 text-primary/80">
                            <Repeat className="w-4 h-4" /> Repetição
                        </Label>

                        <div className="flex gap-2">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, index) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                        setRepeatType("weekly");
                                        setRepeatDays(prev =>
                                            prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
                                        );
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-full text-xs font-bold transition-all border",
                                        repeatType === 'weekly' && repeatDays.includes(index)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-secondary/30 text-muted-foreground border-transparent hover:border-primary/50"
                                    )}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="duration"
                                    checked={repeatType === 'none'}
                                    onChange={() => setRepeatType('none')}
                                    className="accent-primary"
                                />
                                <span className={repeatType === 'none' ? "text-foreground" : "text-muted-foreground"}>Não repetir</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="duration"
                                    checked={repeatType !== 'none' && repeatDuration === 'month'}
                                    onChange={() => {
                                        if (repeatType === 'none') setRepeatType('daily');
                                        setRepeatDuration('month');
                                    }}
                                    className="accent-primary"
                                />
                                <span className={repeatType !== 'none' && repeatDuration === 'month' ? "text-foreground" : "text-muted-foreground"}>Até fim do Mês</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="duration"
                                    checked={repeatType !== 'none' && repeatDuration === 'year'}
                                    onChange={() => {
                                        if (repeatType === 'none') setRepeatType('daily');
                                        setRepeatDuration('year');
                                    }}
                                    className="accent-primary"
                                />
                                <span className={repeatType !== 'none' && repeatDuration === 'year' ? "text-foreground" : "text-muted-foreground"}>Até fim do Ano</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold">
                            {initialData ? "Salvar Alterações" : "Aceitar Missão"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
