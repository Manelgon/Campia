"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export type DateRange = "today" | "week" | "month" | "year";

export function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentRange = (searchParams.get("range") as DateRange) || "month";

    const setRange = (range: DateRange) => {
        const params = new URLSearchParams(searchParams);
        params.set("range", range);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
            {(["today", "week", "month", "year"] as const).map((range) => (
                <Button
                    key={range}
                    variant={currentRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setRange(range)}
                    className="capitalize"
                >
                    {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                </Button>
            ))}
        </div>
    );
}
