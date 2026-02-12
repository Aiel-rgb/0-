import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Shield } from "lucide-react";

interface CreateGuildDialogProps {
    onCreateGuild: (data: { name: string; description?: string }) => void;
    isPending?: boolean;
}

export function CreateGuildDialog({ onCreateGuild, isPending }: CreateGuildDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreateGuild({ name: name.trim(), description: description.trim() || undefined });
        setName("");
        setDescription("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-bold gap-2 shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" />
                    Criar Guilda
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display">
                        <Shield className="w-5 h-5 text-primary" />
                        Criar Nova Guilda
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="guild-name" className="text-sm font-medium">Nome da Guilda</Label>
                        <Input
                            id="guild-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Cavaleiros da Aurora"
                            maxLength={100}
                            className="bg-background/50 border-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guild-desc" className="text-sm font-medium">Descrição (Opcional)</Label>
                        <Input
                            id="guild-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Uma breve descrição da sua guilda..."
                            className="bg-background/50 border-primary/20 focus:border-primary"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-purple-600 font-bold"
                        disabled={!name.trim() || isPending}
                    >
                        {isPending ? "Criando..." : "⚔️ Fundar Guilda"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
