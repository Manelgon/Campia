"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Replace with actual N8N Webhook URL
// For demo, we might mock or use an env variable.
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: '¡Hola! ¿En qué podemos ayudarte?', sender: 'agent', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Auto-scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // Send to n8n
        try {
            if (N8N_WEBHOOK_URL) {
                await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMsg.text, userId: 'guest_user' }) // Context needed?
                });
                // We assume n8n might trigger another webhook to push reply back?
                // Or simple request/response if synchronous workflow?
                // For now, let's simulate a reply after delay if no URL
            } else {
                console.log("No n8n Webhook URL configured. Simulating response.");
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        text: "Gracias por tu mensaje. Un agente te atenderá pronto.",
                        sender: 'agent',
                        timestamp: new Date()
                    }]);
                    setIsTyping(false);
                }, 1500);
            }
        } catch (error) {
            console.error("Error sending message to n8n:", error);
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700"
                >
                    <MessageCircle className="h-8 w-8 text-white" />
                </Button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl border-blue-100 animate-in slide-in-from-bottom-10 fade-in">
                    <CardHeader className="bg-blue-600 text-white p-4 rounded-t-lg flex flex-row items-center justify-between">
                        <div className="flex flex-col">
                            <CardTitle className="text-base">Soporte CampIa</CardTitle>
                            <span className="text-xs text-blue-100">En línea</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn(
                                "flex w-full",
                                msg.sender === 'user' ? "justify-end" : "justify-start"
                            )}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                    msg.sender === 'user'
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white text-gray-800 rounded-bl-none border"
                                )}>
                                    {msg.text}
                                    <div className={cn("text-[10px] mt-1 opacity-70", msg.sender === 'user' ? "text-blue-100" : "text-gray-400")}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-500 rounded-2xl rounded-bl-none border px-4 py-2 text-sm">
                                    <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <div className="p-3 border-t bg-white flex gap-2">
                        <Input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu mensaje..."
                            className="bg-slate-50 focus-visible:ring-blue-600"
                        />
                        <Button size="icon" onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
