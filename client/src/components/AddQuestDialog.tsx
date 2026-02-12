import { useState } from "react";
import { Plus, Swords, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    onAdd: (data: { title: string; description?: string; difficulty: "easy" | "medium" | "hard"; deadline?: string }) => void;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAdd({ title, description, difficulty, deadline: deadline || undefined });
        setOpen(false);
        if (!initialData) {
            setTitle("");
            setDescription("");
            setDifficulty("medium");
            setDeadline("");
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
