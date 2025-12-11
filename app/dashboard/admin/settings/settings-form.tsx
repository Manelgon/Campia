"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePropertyAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function SettingsForm({ property }: { property: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setMessage(null);
        setError(null);

        const res = await updatePropertyAction(formData);

        if (res?.error) {
            setError(res.error);
        } else if (res?.message) {
            setMessage(res.message);
        }
        setIsLoading(false);
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Propiedad</Label>
                <Input id="name" name="name" defaultValue={property?.name} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" defaultValue={property?.address || ""} disabled={isLoading} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-500">{message}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
            </Button>
        </form>
    )
}
