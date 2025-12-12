"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

interface MessageBubbleProps {
    content: string;
    type: "text" | "image" | "audio";
    isMine: boolean;
    timestamp: string;
}

export function MessageBubble({ content, type, isMine, timestamp }: MessageBubbleProps) {
    return (
        <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm shadow-sm",
                    isMine
                        ? "bg-orange-600 text-white rounded-tr-none" // Corporate Sent
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-200" // Corporate Received
                )}
            >
                {type === "text" && <p className="whitespace-pre-wrap">{content}</p>}

                {type === "image" && (
                    <div className="relative h-48 w-48 overflow-hidden rounded-md cursor-pointer">
                        <Image
                            src={content}
                            alt="Imagen enviada"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {type === "audio" && (
                    <audio controls src={content} className="w-60 h-10 mt-1" />
                )}

                <div className={cn("mt-1 text-right text-[10px]", isMine ? "text-orange-100" : "text-gray-400")}>
                    {format(new Date(timestamp), "HH:mm")}
                </div>
            </div>
        </div>
    );
}
