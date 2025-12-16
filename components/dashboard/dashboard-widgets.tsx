"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";
import { Users, Activity, Home, CalendarDays, Brush, DollarSign, Wrench } from "lucide-react";

const ICON_MAP = {
    home: Home,
    calendar: CalendarDays,
    users: Users,
    brush: Brush,
    dollar: DollarSign,
    wrench: Wrench
};

type StatCard = {
    title: string;
    value: string;
    description: string;
    iconName: keyof typeof ICON_MAP;
    color: string;
    id: string; // "occupancy", "arrivals", "guests", "cleaning", "revenue", "tickets"
};

type ChartData = {
    dia: string;
    value: number;
};

type DashboardWidgetsProps = {
    stats: StatCard[];
    occupancyData: ChartData[];
    arrivalsData: ChartData[];
    guestData: ChartData[];
    revenueData: ChartData[];
    cleaningData: ChartData[];
    ticketData: ChartData[];
    children?: React.ReactNode;
};

// Colors
const COLOR_OCCUPANCY = "#f97316"; // Orange
const COLOR_ARRIVALS = "#16a34a"; // Green
const COLOR_GUESTS = "#4f46e5"; // Indigo
const COLOR_CLEANING = "#db2777"; // Pink
const COLOR_REVENUE = "#d97706"; // Amber
const COLOR_TICKETS = "#dc2626"; // Red

export function DashboardWidgets({
    stats,
    occupancyData,
    arrivalsData,
    guestData,
    revenueData,
    cleaningData,
    ticketData,
    children
}: DashboardWidgetsProps) {
    const [selectedMetric, setSelectedMetric] = useState<'occupancy' | 'arrivals' | 'guests' | 'cleaning' | 'revenue' | 'tickets'>('occupancy');

    let currentChartData = occupancyData;
    let currentChartTitle = "Ocupación Semanal";
    let currentChartColor = COLOR_OCCUPANCY;

    if (selectedMetric === 'arrivals') {
        currentChartData = arrivalsData;
        currentChartTitle = "Llegadas Semanal";
        currentChartColor = COLOR_ARRIVALS;
    } else if (selectedMetric === 'guests') {
        currentChartData = guestData;
        currentChartTitle = "Huéspedes Semanal";
        currentChartColor = COLOR_GUESTS;
    } else if (selectedMetric === 'cleaning') {
        currentChartData = cleaningData;
        currentChartTitle = "Tareas de Limpieza (7 días)";
        currentChartColor = COLOR_CLEANING;
    } else if (selectedMetric === 'revenue') {
        currentChartData = revenueData;
        currentChartTitle = "Ingresos (7 días)";
        currentChartColor = COLOR_REVENUE;
    } else if (selectedMetric === 'tickets') {
        currentChartData = ticketData;
        currentChartTitle = "Incidencias Creadas (7 días)";
        currentChartColor = COLOR_TICKETS;
    }

    const handleCardClick = (id: string) => {
        if (id === 'occupancy') setSelectedMetric('occupancy');
        if (id === 'arrivals') setSelectedMetric('arrivals');
        if (id === 'guests') setSelectedMetric('guests');
        if (id === 'cleaning') setSelectedMetric('cleaning');
        if (id === 'revenue') setSelectedMetric('revenue');
        if (id === 'tickets') setSelectedMetric('tickets');
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => {
                    const Icon = ICON_MAP[stat.iconName as keyof typeof ICON_MAP] || Activity;
                    // Check if clickable
                    const isClickable = true; // All 6 are now clickable
                    const isSelected = stat.id === selectedMetric;

                    return (
                        <Card
                            key={index}
                            className={`
                                cursor-pointer transition-all duration-200
                                ${isClickable ? 'hover:shadow-md active:scale-95' : ''}
                                ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                            `}
                            onClick={() => isClickable && handleCardClick(stat.id)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Content Grid: Chart + Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    {/* Reusing OccupancyChart but making it dynamic */}
                    {/* Note: OccupancyChart component hardcodes title/icon/color currently. 
                        We should probably update it to accept props, OR render a customized version here.
                        For now, let's update OccupancyChart to accept props, or duplicate logic if simpler. 
                        Updating OccupancyChart is cleaner.
                        Wait, I can't update OccupancyChart in this step easily without seeing it again or assuming. 
                        I saw it in step 2346. It hardcodes title.
                        I will WRAP it or pass props if I update it. 
                        Plan: I will update OccupancyChart in NEXT step to accept title/color. 
                        For now, I'll render it assuming it will change.
                    */}
                    <OccupancyChart
                        data={currentChartData}
                        // @ts-ignore - I will add these props next
                        title={currentChartTitle}
                        color={currentChartColor}
                    />
                </div>
                <div className="col-span-3">
                    {children}
                </div>
            </div>
        </div>
    );
}
