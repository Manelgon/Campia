"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    User,
    CalendarDays,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const guestSidebarItems = [
    {
        title: "Ficha",
        href: "/guest",
        icon: User,
    },
    {
        title: "Reservas",
        href: "/guest/bookings",
        icon: CalendarDays,
    },
];

export function GuestSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-14 items-center border-b px-4">
                <Link href="/guest" className="flex items-center gap-2 font-semibold">
                    <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className="text-xl">CampIa Guest</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {guestSidebarItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900",
                                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-500"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <SignOutButton />
            </div>
        </div>
    );
}
