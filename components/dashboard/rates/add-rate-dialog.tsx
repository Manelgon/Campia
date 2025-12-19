"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RateForm } from "@/app/dashboard/admin/rates/rate-form";
import { useState } from "react";

interface AddRateDialogProps {
    units: { id: string; name: string; type: string }[];
    unitTypes: string[];
}

export function AddRateDialog({ units, unitTypes }: AddRateDialogProps) {
    const [open, setOpen] = useState(false);

    // We can pass a callback to RateForm to close the dialog on success
    // Current RateForm uses useTransition but doesn't expose onSuccess. 
    // Ideally we modify RateForm or just let it close manually?
    // For now, let's just render it. A better UX would be passing `onSuccess={() => setOpen(false)}` 
    // but that requires changing RateForm props. 
    // Let's assume user closes it or we adding that prop is trivial.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarifa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Tarifa</DialogTitle>
                    <DialogDescription>
                        Define una excepción de precio para una unidad o tipo.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RateForm
                        units={units}
                        unitTypes={unitTypes}
                        onSuccess={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
