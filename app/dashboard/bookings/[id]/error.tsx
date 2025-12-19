"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Booking detailed view error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <h2 className="text-lg font-semibold">Algo salió mal cargando la reserva</h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-[500px] text-center">
                Ha ocurrido un error inesperado al intentar cargar los detalles de esta reserva.
                Puede ser un problema temporal o un error en los datos de la reserva.
            </p>
            {error.digest && (
                <p className="text-xs text-muted-foreground font-mono bg-slate-100 px-2 py-1 rounded">
                    Error ID: {error.digest}
                </p>
            )}
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Volver
                </Button>
                <Button onClick={() => reset()}>Intentar de nuevo</Button>
            </div>
        </div>
    );
}
