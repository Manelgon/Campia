"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
    date: { from: Date; to: Date };
    setDate: (range: { from: Date; to: Date } | undefined) => void;
    className?: string;
}

export function DateRangePicker({ date, setDate, className }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Predefined ranges
    const ranges = [
        { label: "Últimos 7 días", days: 7 },
        { label: "Últimos 30 días", days: 30 },
        { label: "Últimos 90 días", days: 90 },
    ];

    const handleRangeSelect = (days: number) => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);
        setDate({ from, to });
        setIsOpen(false);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd MMM yyyy", { locale: es })} -{" "}
                                    {format(date.to, "dd MMM yyyy", { locale: es })}
                                </>
                            ) : (
                                format(date.from, "dd MMM yyyy", { locale: es })
                            )
                        ) : (
                            <span>Seleccionar rango</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                        <div className="text-sm font-medium mb-3">Rangos rápidos</div>
                        {ranges.map((range) => (
                            <Button
                                key={range.days}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => handleRangeSelect(range.days)}
                            >
                                {range.label}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
