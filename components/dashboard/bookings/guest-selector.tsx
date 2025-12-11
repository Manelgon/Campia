"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Check } from "lucide-react";
import { searchGuestsAction } from "@/app/dashboard/guests/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GuestForm } from "@/components/dashboard/guests/guest-form";
import { cn } from "@/lib/utils";

interface Guest {
    id: string;
    full_name: string;
    document_id: string;
    email: string;
    phone: string;
}

interface GuestSelectorProps {
    onSelect: (guestId: string) => void;
    defaultValue?: string; // ID
    defaultName?: string;
}

export function GuestSelector({ onSelect, defaultValue, defaultName }: GuestSelectorProps) {
    const [query, setQuery] = useState(defaultName || "");
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        if (query.length < 2) {
            setGuests([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            const res = await searchGuestsAction(query);
            if (res.guests) {
                setGuests(res.guests);
                setIsOpen(true);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (guest: Guest) => {
        setSelectedGuest(guest);
        setQuery(guest.full_name);
        onSelect(guest.id);
        setIsOpen(false);
    };

    const handleCreateSuccess = (guest: any) => {
        setIsCreateOpen(false);
        handleSelect(guest); // Auto select new guest
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, DNI o teléfono..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (selectedGuest && e.target.value !== selectedGuest.full_name) {
                                setSelectedGuest(null); // Deselect if user edits name
                                onSelect("");
                            }
                        }}
                        onFocus={() => {
                            // Automatically search if query is empty to show something (or keep empty)
                            // Or better: allow opening if we have results
                            if (guests.length > 0) setIsOpen(true);
                            else if (query.length >= 2) setIsOpen(true);
                        }}
                        className="pl-8"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Crear Nuevo Huésped"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <UserPlus className="h-4 w-4" />
                </Button>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto dark:bg-slate-950">
                    {guests.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No se encontraron resultados.</div>
                    ) : (
                        guests.map((guest) => (
                            <div
                                key={guest.id}
                                className={cn(
                                    "px-4 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 flex flex-col gap-1",
                                    selectedGuest?.id === guest.id && "bg-orange-100 dark:bg-orange-900/40"
                                )}
                                onClick={() => handleSelect(guest)}
                            >
                                <div className="font-medium flex items-center justify-between">
                                    {guest.full_name}
                                    {selectedGuest?.id === guest.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="text-xs text-gray-500">
                                    DNI: {guest.document_id} • 📞 {guest.phone}
                                </div>
                            </div>
                        ))
                    )}

                    <div className="p-1 border-t">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-primary"
                            onClick={() => {
                                setIsOpen(false);
                                setIsCreateOpen(true);
                            }}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Crear Nuevo Huésped
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Huésped</DialogTitle>
                    </DialogHeader>
                    <GuestForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
