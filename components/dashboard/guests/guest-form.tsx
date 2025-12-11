"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createGuestAction } from "@/app/dashboard/guests/actions";

interface GuestFormProps {
    onSuccess?: (guest: any) => void;
    onCancel?: () => void;
}

export function GuestForm({ onSuccess, onCancel }: GuestFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        const res = await createGuestAction(formData);

        if (res.error) {
            toast.error(res.error);
        } else if (res.success && res.guest) {
            toast.success("Huésped creado correctamente");
            if (onSuccess) onSuccess(res.guest);
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input id="fullName" name="fullName" required placeholder="Ej: Juan Pérez" disabled={isLoading} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="documentId">DNI / Pasaporte</Label>
                    <Input id="documentId" name="documentId" required placeholder="12345678A" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" placeholder="+34 600..." disabled={isLoading} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" disabled={isLoading} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input id="nationality" name="nationality" placeholder="España" disabled={isLoading} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Huésped
                </Button>
            </div>
        </form>
    );
}
