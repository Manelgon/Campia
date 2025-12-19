"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRateAction } from "./actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useState } from "react";

interface RateFormProps {
    units: { id: string; name: string; type: string }[];
    unitTypes: string[];
    onSuccess?: () => void;
}

export function RateForm({ units, unitTypes, onSuccess }: RateFormProps) {
    const [isPending, startTransition] = useTransition();
    const [targetType, setTargetType] = useState<string>("unit");

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const res = await createRateAction(formData);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Tarifa creada correctamente");
                if (onSuccess) {
                    onSuccess();
                }
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select name="targetType" value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unit">Por Unidad Específica</SelectItem>
                        <SelectItem value="type">Por Tipo de Unidad</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Selección</Label>
                <Select name="targetId">
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {targetType === 'type' ? (
                            unitTypes.map(t => (
                                <SelectItem key={`type-${t}`} value={t || 'all'}>{t}</SelectItem>
                            ))
                        ) : (
                            units?.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.type})</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Si eliges 'Por Tipo', selecciona un tipo de la lista. Si es 'Por Unidad', selecciona la unidad.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label>Desde</Label>
                    <Input type="date" name="startDate" required />
                </div>
                <div className="space-y-2">
                    <Label>Hasta</Label>
                    <Input type="date" name="endDate" required />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Precio por Noche (€)</Label>
                <Input type="number" step="0.01" name="price" placeholder="ej. 150.00" required />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Tarifa
            </Button>
        </form>
    );
}
