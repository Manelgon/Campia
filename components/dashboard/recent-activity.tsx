"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import Link from "next/link";

type ActivityLog = {
    id: string;
    type: string;
    description: string;
    created_at: string;
    entity_id?: string | null;
};

const getLogStyle = (type: string) => {
    // "completed con hover verde", "created amarillo", "check out en blanco"
    // User Update: "los titulos de created en amarillo los completed en verde" (Permanent)
    if (type.includes("completed") || type.includes("check-in") || type.includes("updated")) {
        return "text-green-600 dark:text-green-500 hover:bg-green-500/10 transition-colors border-l-2 border-green-500";
    }
    if (type.includes("created") || type.includes("payment")) {
        return "text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/10 transition-colors border-l-2 border-yellow-500";
    }
    // check-out / default
    return "text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-l-2 border-transparent";
};

const getLogLink = (log: ActivityLog) => {
    if (log.type.includes("booking") || log.type.includes("check-in") || log.type.includes("check-out")) {
        return log.entity_id ? `/dashboard/bookings/${log.entity_id}` : "/dashboard/bookings";
    }
    if (log.type.includes("ticket") || log.type.includes("mantenimiento")) {
        return "/dashboard/maintenance";
    }
    if (log.type.includes("housekeeping") || log.type.includes("limpieza")) {
        return "/dashboard/housekeeping";
    }
    if (log.type.includes("payment") || log.type.includes("invoice")) {
        return "/dashboard/financials";
    }
    return "/dashboard";
};

export function RecentActivity({ initialLogs = [] }: { initialLogs?: ActivityLog[] }) {
    const supabase = createClient();
    const [activities, setActivities] = useState<ActivityLog[]>(initialLogs); // No limit here, server filters by time

    useEffect(() => {
        // Realtime Subscription
        const channel = supabase
            .channel('activity-feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_logs' },
                (payload) => {
                    const newLog = payload.new as ActivityLog;
                    setActivities((prev) => [newLog, ...prev]); // Keep all new logs until refresh
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Actividad Reciente (24h)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
                    ) : (
                        activities.map((log) => (
                            <Link
                                href={getLogLink(log)}
                                key={log.id}
                                className={`flex flex-col border-b pb-2 last:border-0 last:pb-0 p-2 rounded-sm cursor-pointer block ${getLogStyle(log.type)}`}
                            >
                                <span className="text-sm font-medium">{log.description}</span>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1 opacity-70">
                                    <span className="capitalize">{log.type.replace("-", " ")}</span>
                                    <span>{new Date(log.created_at).toLocaleTimeString()} {new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
