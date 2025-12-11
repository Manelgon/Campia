"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function NewUserForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setMessage(null);
        setError(null);

        const res = await createUserAction(formData);

        if (res?.error) {
            setError(res.error);
        } else if (res?.message) {
            setMessage(res.message);
            // Optionally reset form
            const form = document.getElementById("new-user-form") as HTMLFormElement;
            form?.reset();
        }
        setIsLoading(false);
    };

    return (
        <form id="new-user-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required disabled={isLoading} minLength={6} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input id="fullName" name="fullName" type="text" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                    id="role"
                    name="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={isLoading}
                >
                    <option value="reception">Recepción</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="cleaning">Limpieza</option>
                </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-500">{message}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
            </Button>
        </form>
    )
}
