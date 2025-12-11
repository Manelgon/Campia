"use client";

import { Button } from "@/components/ui/button";
import { checkInAction, checkOutAction } from "@/app/dashboard/bookings/actions";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { useState } from "react";

export function BookingActions({
    bookingId,
    status,
}: {
    bookingId: string;
    status: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleCheckIn = async () => {
        setLoading(true);
        await checkInAction(bookingId);
        setLoading(false);
    };

    const handleCheckOut = async () => {
        setLoading(true);
        await checkOutAction(bookingId);
        setLoading(false);
    };

    if (status === "confirmed") {
        return (
            <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                onClick={handleCheckIn}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="mr-1 h-4 w-4" />}
                Check-in
            </Button>
        );
    }

    if (status === "checked_in") {
        return (
            <Button
                size="sm"
                variant="outline"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                onClick={handleCheckOut}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="mr-1 h-4 w-4" />}
                Check-out
            </Button>
        );
    }

    return null;
}
