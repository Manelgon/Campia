"use client";

import { Button } from "@/components/ui/button";
import { updateTicketStatusAction } from "@/app/dashboard/maintenance/actions";
import { Loader2, Check, Play } from "lucide-react";
import { useState } from "react";

export function TicketActions({ ticketId, status }: { ticketId: string, status: string }) {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (newStatus: string) => {
        setLoading(true);
        await updateTicketStatusAction(ticketId, newStatus);
        setLoading(false);
    };

    if (status === "open") {
        return (
            <Button size="sm" variant="outline" onClick={() => handleUpdate("in_progress")} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />} Iniciar
            </Button>
        )
    }

    if (status === "in_progress") {
        return (
            <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => handleUpdate("resolved")} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />} Resolver
            </Button>
        )
    }

    return null;
}
