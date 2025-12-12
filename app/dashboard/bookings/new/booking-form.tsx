"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBookingAction, getAvailableUnitsAction, calculatePriceAction } from "../actions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GuestSelector } from "@/components/dashboard/bookings/guest-selector";

export function BookingForm({ units: initialUnits, guests }: { units: any[], guests: any[] }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGuestId, setSelectedGuestId] = useState("");

    // Availability State
    const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
    const [availableUnits, setAvailableUnits] = useState<any[]>(initialUnits);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    // Price Calculation
    const [unitId, setUnitId] = useState("");
    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

    // Disable unit select if no dates or checking
    const isUnitSelectDisabled = !dates.checkIn || !dates.checkOut || isCheckingAvailability || isLoading;

    useEffect(() => {
        const checkAvailability = async () => {
            if (dates.checkIn && dates.checkOut) {
                setIsCheckingAvailability(true);
                // Reset unit selection? Ideally yes, but native select state is hard to control without value prop.
                // We'll trust the user to re-select or we can force it if we controlled the select value.

                const res = await getAvailableUnitsAction(dates.checkIn, dates.checkOut);

                if (res.error) {
                    toast.error("Error comprobando disponibilidad");
                } else if (res.units) {
                    setAvailableUnits(res.units);
                    if (res.units.length === 0) {
                        toast.warning("No hay unidades disponibles para estas fechas.");
                    }
                }
                setIsCheckingAvailability(false);
            }
        };

        const timeout = setTimeout(checkAvailability, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [dates]);

    useEffect(() => {
        const updatePrice = async () => {
            if (unitId && dates.checkIn && dates.checkOut) {
                const res = await calculatePriceAction(unitId, dates.checkIn, dates.checkOut);
                if (res.price !== undefined) {
                    setEstimatedPrice(res.price);
                }
            } else {
                setEstimatedPrice(null);
            }
        };
        updatePrice();
    }, [unitId, dates]);

    const handleSubmit = async (formData: FormData) => {
        if (isLoading) return; // Prevent double submission
        setIsLoading(true);
        setError(null);
        try {
            const res = await createBookingAction(formData);
            if (res?.error) {
                setError(res.error);
                toast.error("Error al crear reserva: " + res.error);
                setIsLoading(false);
            } else {
                toast.success("Reserva creada correctamente");
                // Redirect handles success
            }
        } catch (e) {
            setError("Error inesperado");
            setIsLoading(false);
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
                            <Input
                                type="date"
                                id="checkIn"
                                name="checkIn"
                                required
                                disabled={isLoading}
                                onChange={(e) => setDates(prev => ({ ...prev, checkIn: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="checkOut">Fecha de Salida</Label>
                            <Input
                                type="date"
                                id="checkOut"
                                name="checkOut"
                                required
                                disabled={isLoading}
                                onChange={(e) => setDates(prev => ({ ...prev, checkOut: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guestsCount">Huéspedes</Label>
                        <Input type="number" id="guestsCount" name="guestsCount" min="1" defaultValue="2" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label>Huésped</Label>
                        {/* Hidden input to pass value to Server Action via FormData */}
                        <input type="hidden" name="guestId" value={selectedGuestId} />
                        <GuestSelector onSelect={setSelectedGuestId} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unitId">Unidad</Label>
                        <select
                            id="unitId"
                            name="unitId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={isUnitSelectDisabled}
                            onChange={(e) => setUnitId(e.target.value)}
                        >
                            <option value="">
                                {(!dates.checkIn || !dates.checkOut) ? "Seleccione fechas primero..." :
                                    isCheckingAvailability ? "Comprobando disponibilidad..." :
                                        availableUnits.length === 0 ? "No hay unidades disponibles" :
                                            "Seleccionar unidad..."}
                            </option>
                            {availableUnits?.map(unit => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.type}) - Cap: {unit.capacity}
                                </option>
                            ))}
                        </select>
                        {availableUnits.length === 0 && dates.checkIn && dates.checkOut && !isCheckingAvailability && (
                            <p className="text-xs text-red-500">No hay alojamientos disponibles para estas fechas.</p>
                        )}
                    </div>

                    {estimatedPrice !== null && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex items-center justify-between">
                            <span className="text-orange-800 font-medium">Precio Estimado (Total)</span>
                            <span className="text-2xl font-bold text-orange-600">€{estimatedPrice.toFixed(2)}</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-500 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading || availableUnits.length === 0}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Reserva
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
