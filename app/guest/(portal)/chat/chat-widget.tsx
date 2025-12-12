"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatWindow } from "./chat-window";
import { createClient } from "@/utils/supabase/client";

interface ChatWidgetProps {
    userId: string;
    guestId: string;
}

export function ChatWidget({ userId, guestId }: ChatWidgetProps) {
    const [open, setOpen] = useState(false);

    // No internal fetching needed as we pass props from server
    if (!userId || !guestId) return null; // Should not happen if layout handles it

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
            {open && (
                <ChatWindow
                    onClose={() => setOpen(false)}
                    guestId={guestId}
                    userId={userId}
                />
            )}

            {!open && (
                <Button
                    className="rounded-full h-14 w-14 shadow-lg bg-orange-600 hover:bg-orange-700 text-white p-0 flex items-center justify-center transition-transform hover:scale-110"
                    onClick={() => setOpen(true)}
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
