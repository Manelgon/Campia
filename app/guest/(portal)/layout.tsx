import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GuestSidebar } from "@/components/guest/guest-sidebar";
import { GuestMobileSidebar } from "@/components/guest/mobile-guest-sidebar";
import { ChatWidget } from "./chat/chat-widget";

export default async function GuestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Server-side fetch for Guest ID to ensure ChatWidget works immediately
    const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("user_id", user.id)
        .single();

    return (
        <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-slate-50">
                <div className="hidden lg:flex h-full w-64 flex-col border-r bg-white">
                    <GuestSidebar />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center gap-4 border-b bg-white px-6 lg:h-[60px]">
                        <GuestMobileSidebar />
                        <div className="w-full flex-1">
                            <h1 className="text-lg font-semibold text-gray-800">
                                Portal del Huésped
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                                {user.email?.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
            {guest && <ChatWidget userId={user.id} guestId={guest.id} />}
            <Toaster />
        </AuthProvider>
    );
}
