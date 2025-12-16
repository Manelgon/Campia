"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceReport } from "@/components/reports/maintenance-report";
import { HousekeepingReport } from "@/components/reports/housekeeping-report";
import { FinancialReport } from "@/components/reports/financial-report";
import { OccupancyReport } from "@/components/reports/occupancy-report";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { useState } from "react";

export default function ReportsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Default tab
    const currentTab = searchParams.get("tab") || "maintenance";

    // Date Range State (default last 30 days)
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", val);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
                    <p className="text-muted-foreground">Análisis detallado de rendimiento y operaciones.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={dateRange}
                        setDate={(range) => {
                            if (range?.from) {
                                setDateRange({ from: range.from, to: range.to || range.from });
                            }
                        }}
                    />
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                    <TabsTrigger value="housekeeping">Limpieza</TabsTrigger>
                    <TabsTrigger value="financial">Ingresos</TabsTrigger>
                    <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="maintenance" className="space-y-4">
                        <MaintenanceReport dateRange={dateRange} />
                    </TabsContent>
                    <TabsContent value="housekeeping" className="space-y-4">
                        <HousekeepingReport dateRange={dateRange} />
                    </TabsContent>
                    <TabsContent value="financial" className="space-y-4">
                        <FinancialReport dateRange={dateRange} />
                    </TabsContent>
                    <TabsContent value="occupancy" className="space-y-4">
                        <OccupancyReport dateRange={dateRange} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
