import { Mountain } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Mountain className="relative h-16 w-16 text-primary animate-bounce" />
            </div>
            <div className="text-2xl font-display text-primary font-bold tracking-wider">
                CARREGANDO{dots}
            </div>
            <p className="mt-4 text-muted-foreground text-sm animate-pulse">
                Preparando sua jornada épica...
            </p>
        </div>
    );
}
