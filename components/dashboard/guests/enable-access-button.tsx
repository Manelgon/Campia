"use client";

import { createGuestAccountAction } from "@/app/dashboard/guests/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

export function EnableAccessButton({ guest }: { guest: any }) {
    if (guest.user_id) {
        return (
            <div className="flex items-center text-green-600 text-sm font-medium">
                <UserCheck className="mr-2 h-4 w-4" />
                Acceso Habilitado
            </div>
        )
    }

    const handleCreate = async () => {
        const res = await createGuestAccountAction(guest.id, guest.email, guest.document_id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(res.message);
        }
    }

    return (
        <form action={handleCreate}>
            <Button variant="outline" size="sm" type="submit">
                Habilitar Acceso Portal
            </Button>
        </form>
    )
}
