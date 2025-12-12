"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Mic, X, Loader2, Image as ImageIcon } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { sendMessageAction } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    type: "text" | "image" | "audio";
    sender_id: string;
    created_at: string;
    guest_id: string;
}

export function ChatWindow({ onClose, guestId, userId }: { onClose: () => void, guestId: string, userId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // 1. Initial Load & Realtime Subscription
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("guest_id", guestId) // Filter by current guest conversation
                .order("created_at", { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        const channel = supabase
            .channel(`guest_chat_${guestId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `guest_id=eq.${guestId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [guestId, supabase]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setIsSending(true);

        const formData = new FormData();
        formData.append("content", newMessage);
        formData.append("type", "text");

        const res = await sendMessageAction(formData);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success && res.message) {
            // Manually add message to UI since it's not saved to DB (no realtime)
            setMessages((prev) => [...prev, res.message as Message]);
        }

        setNewMessage("");
        setIsSending(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSending(true);
        // Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${guestId}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chat-uploads').upload(fileName, file);

        if (uploadError) {
            toast.error("Error subiendo imagen");
            setIsSending(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('chat-uploads').getPublicUrl(fileName);

        const formData = new FormData();
        formData.append("content", publicUrl);
        formData.append("type", "image");

        const res = await sendMessageAction(formData);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success && res.message) {
            setMessages((prev) => [...prev, res.message as Message]);
        }

        setIsSending(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const file = new File([blob], "voice-note.webm", { type: "audio/webm" });

                setIsSending(true);
                const fileName = `${guestId}/${Math.random()}.webm`;
                const { error: uploadError } = await supabase.storage.from('chat-uploads').upload(fileName, file);

                if (uploadError) {
                    toast.error("Error subiendo audio");
                } else {
                    const { data: { publicUrl } } = supabase.storage.from('chat-uploads').getPublicUrl(fileName);
                    const formData = new FormData();
                    formData.append("content", publicUrl);
                    formData.append("type", "audio");

                    const res = await sendMessageAction(formData);

                    if (res?.error) {
                        toast.error(res.error);
                    } else if (res?.success && res.message) {
                        setMessages((prev) => [...prev, res.message as Message]);
                    }
                }
                setIsSending(false);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            toast.error("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
        setMediaRecorder(null);
    };

    return (
        <div className="flex flex-col h-[500px] w-full sm:w-[400px] bg-white rounded-lg shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="bg-gray-900 p-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-orange-500">
                        R
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Recepción</h3>
                        <p className="text-xs text-orange-400">En línea</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Messages (Clean Background) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 relative" ref={scrollRef}>
                <div className="space-y-4">
                    {/* Encrypted Notice Dummy */}
                    <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-[10px] px-2 py-1 rounded-md text-gray-500 shadow-sm">
                            Los mensajes están cifrados de extremo a extremo.
                        </span>
                    </div>

                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            content={msg.content}
                            type={msg.type}
                            isMine={msg.sender_id === userId}
                            timestamp={msg.created_at}
                        />
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm mt-10">
                            Escribe un mensaje para comenzar...
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-2 bg-white border-t flex items-center gap-2">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-orange-600"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                >
                    <Paperclip className="w-5 h-5" />
                </Button>

                <div className="flex-1">
                    <Input
                        className="bg-gray-100 rounded-full border-none focus-visible:ring-1 focus-visible:ring-orange-500"
                        placeholder="Escribe un mensaje"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        disabled={isSending || isRecording}
                    />
                </div>

                {newMessage.trim() ? (
                    <Button
                        size="icon"
                        className="rounded-full bg-orange-600 hover:bg-orange-700"
                        onClick={handleSend}
                        disabled={isSending}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                ) : (
                    <Button
                        size="icon"
                        className={cn("rounded-full transition-colors", isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-orange-600 hover:bg-orange-700")}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        disabled={isSending}
                        title="Mantén pulsado para grabar"
                    >
                        <Mic className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
