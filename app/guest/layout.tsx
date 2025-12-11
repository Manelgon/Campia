import { ChatWidget } from "@/components/guest/chat-widget";

export default function GuestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b h-16 flex items-center justify-between px-6">
                <div className="font-bold text-xl text-primary">CampIa Guest</div>
                {/* Optional: Language selector, Logout */}
            </header>
            <main className="flex-1 container mx-auto p-4 max-w-4xl">
                {children}
            </main>
            <footer className="text-center py-4 text-sm text-gray-400">
                © 2024 CampIa - Guest Experience
            </footer>
            <ChatWidget />
        </div>
    );
}
