"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBookingAction } from "../actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BookingForm({ units, guests }: { units: any[], guests: any[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        const res = await createBookingAction(formData);
        if (res?.error) {
            setError(res.error);
            toast.error("Error al crear reserva: " + res.error);
            setIsLoading(false);
        } else {
            toast.success("Reserva creada correctamente");
            // Redirect handles success, but we can optimistically show success
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalles de la Reserva</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="checkIn">Fecha de Entrada</Label>
                            <Input type="date" id="checkIn" name="checkIn" required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="checkOut">Fecha de Salida</Label>
                            <Input type="date" id="checkOut" name="checkOut" required disabled={isLoading} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guestsCount">Huéspedes</Label>
                        <Input type="number" id="guestsCount" name="guestsCount" min="1" defaultValue="2" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guestId">Huésped</Label>
                        <select
                            id="guestId"
                            name="guestId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isLoading}
                        >
                            <option value="">Seleccionar huésped...</option>
                            {guests?.map(guest => (
                                <option key={guest.id} value={guest.id}>{guest.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unitId">Unidad</Label>
                        <select
                            id="unitId"
                            name="unitId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isLoading}
                        >
                            <option value="">Seleccionar unidad...</option>
                            {units?.map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Reserva
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
