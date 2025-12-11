"use client";

import { Button } from "@/components/ui/button";
import { updateUnitStatusAction } from "@/app/dashboard/units/actions";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export function UnitActions({
    unitId,
    status,
}: {
    unitId: string;
    status: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleUpdateStatus = async (newStatus: string) => {
        setLoading(true);
        await updateUnitStatusAction(unitId, newStatus);
        setLoading(false);
    };

    if (status === "dirty") {
        return (
            <Button
                size="sm"
                variant="outline"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={() => handleUpdateStatus("clean")}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                Marcar Limpia
            </Button>
        );
    }

    if (status === "occupied") {
        // Usually handled by check-out, but maybe admin wants to force release?
        // Leaving empty for now as check-out handles it.
        return null;
    }

    if (status === "clean") {
        // Option to mark as maintenance?
        return (
            <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => handleUpdateStatus("dirty")} // Manual dirty
                disabled={loading}
            >
                Marcar Sucia
            </Button>
        )
    }

    return null;
}
