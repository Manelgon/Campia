"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteRateAction } from "./actions";
import { toast } from "sonner";

export function RateDeleteButton({ rateId }: { rateId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        startTransition(async () => {
            const res = await deleteRateAction(rateId);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Tarifa eliminada");
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700"
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
