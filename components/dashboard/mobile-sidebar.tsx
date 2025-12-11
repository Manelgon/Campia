"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar"; // Reuse existing sidebar content
import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Fix Hydration Mismatch by only rendering on client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close on navigation
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    if (!isMounted) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
}
