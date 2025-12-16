"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Users } from "lucide-react";

type DailyOccupancy = {
    dia: string; // "Lun", "Mar"...
    total_reservas: number;
}

interface OccupancyChartProps {
    data: any[];
    title?: string;
    color?: string;
    dataKey?: string;
}

export function OccupancyChart({ data, title = "Ocupación Semanal", color = "#f97316", dataKey = "value" }: OccupancyChartProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color }} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="dia"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ background: "#333", border: "none", color: "#fff" }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar
                            dataKey={dataKey}
                            name={title} // This sets the tooltip label!
                            fill={color}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
