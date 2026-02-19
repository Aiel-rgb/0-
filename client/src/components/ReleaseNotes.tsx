import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollText, CheckCircle2, Sparkles, Rocket } from "lucide-react";
import { PATCH_NOTES, CURRENT_VERSION } from "@shared/patchNotes";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

interface ReleaseNotesProps {
    lastSeenVersion: string;
    onClose: () => void;
}

export function ReleaseNotes({ lastSeenVersion, onClose }: ReleaseNotesProps) {
    const [open, setOpen] = useState(false);
    const updateVersionMutation = trpc.profile.updateLastSeenVersion.useMutation();

    useEffect(() => {
        // Show if the user hasn't seen the current version
        if (lastSeenVersion !== CURRENT_VERSION) {
            setOpen(true);
        }

        const handleOpen = () => setOpen(true);
        window.addEventListener("open-release-notes", handleOpen);
        return () => window.removeEventListener("open-release-notes", handleOpen);
    }, [lastSeenVersion]);

    const handleClose = async () => {
        setOpen(false);
        updateVersionMutation.mutate({ version: CURRENT_VERSION });
        onClose();
    };

    const latestNote = PATCH_NOTES[0]; // v2.0.0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-primary/20 p-0 overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent flex items-center px-8 border-b border-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Rocket className="w-24 h-24 rotate-12" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Nova Atualização</span>
                        </div>
                        <DialogTitle className="text-3xl font-display font-bold">
                            {latestNote.title} <span className="text-primary/60 text-sm font-mono ml-2">v{latestNote.version}</span>
                        </DialogTitle>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <DialogDescription className="text-foreground/80 leading-relaxed text-base italic">
                        "{latestNote.description}"
                    </DialogDescription>

                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-display font-bold text-sm uppercase tracking-widest text-muted-foreground">
                            <ScrollText className="w-4 h-4" /> Novidades de Hoy
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {latestNote.highlights?.map((highlight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-start gap-3 p-3 bg-secondary/20 rounded-xl border border-white/5 hover:border-primary/20 transition-colors group"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium leading-tight">{highlight}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex sm:justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-64 h-12 text-lg font-display font-bold rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 active:scale-95 transition-all"
                    >
                        ENTENDIDO! 🛡️
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
