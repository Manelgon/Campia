"use client";

import { signOutGuestAction } from "@/app/guest/login/actions";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuestSignOutButton() {
    const handleSignOut = async () => {
        await signOutGuestAction();
    };

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Salir del Portal
        </Button>
    );
}
