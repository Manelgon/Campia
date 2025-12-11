"use client";

import { signOutAction } from "@/app/login/actions";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
    // No need for router since redirect happens on server
    const handleSignOut = async () => {
        await signOutAction();
    };

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
        </Button>
    );
}
