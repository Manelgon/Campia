"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addExtraAction } from "@/app/dashboard/financials/actions";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

export function AddExtraForm({ bookingId, extras }: { bookingId: string, extras: any[] }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        await addExtraAction(formData);
        setIsLoading(false);
    };

    return (
        <form action={handleSubmit} className="flex gap-2 items-end">
            <input type="hidden" name="bookingId" value={bookingId} />
            <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">Servicio / Extra</label>
                <select
                    name="extraId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                    disabled={isLoading}
                >
                    <option value="">Seleccionar...</option>
                    {extras.map(e => (
                        <option key={e.id} value={e.id}>{e.name} (€{e.price})</option>
                    ))}
                </select>
            </div>
            <div className="w-24">
                <label className="text-sm font-medium mb-1 block">Cant.</label>
                <Input type="number" name="quantity" defaultValue={1} min={1} required disabled={isLoading} />
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
        </form>
    );
}
