import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";

export default async function DashboardLayout({
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

    // Role Check: If guest, send to Guest Portal
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "guest" || user.user_metadata?.role === 'guest') {
        redirect("/guest");
    }

    // ... rest of layout

    return (
        <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-slate-50">
                <div className="hidden lg:flex h-full w-64 flex-col border-r bg-white">
                    <Sidebar />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center gap-4 border-b bg-white px-6 lg:h-[60px]">
                        <MobileSidebar />
                        <div className="w-full flex-1">
                            <h1 className="text-lg font-semibold text-gray-800">
                                Panel de Control
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
            <Toaster />
        </AuthProvider>
    );
}
