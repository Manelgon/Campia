"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { recordPaymentAction } from "@/app/dashboard/financials/actions";

interface RecordPaymentDialogProps {
    invoice: {
        id: string;
        invoice_number: number;
        total_amount: number;
        total_paid: number;
    };
    paymentMethods: { id: string; name: string }[];
}

export function RecordPaymentDialog({ invoice, paymentMethods }: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Default to full remaining amount
    const remaining = invoice.total_amount - invoice.total_paid;
    const [amount, setAmount] = useState(remaining.toString());
    const [methodId, setMethodId] = useState("");

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setAmount((invoice.total_amount - invoice.total_paid).toFixed(2));
            setMethodId("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !methodId) return;

        setIsLoading(true);
        const res = await recordPaymentAction(invoice.id, parseFloat(amount), methodId);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Pago registrado correctamente");
            setOpen(false);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Pagar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago - Factura #{invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Total Factura</Label>
                            <div className="text-lg font-bold">€{invoice.total_amount.toFixed(2)}</div>
                        </div>
                        <div className="space-y-2">
                            <Label>Pendiente</Label>
                            <div className="text-lg font-bold text-orange-600">
                                €{(invoice.total_amount - invoice.total_paid).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto a Pagar (€)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Método de Pago</Label>
                        <Select value={methodId} onValueChange={setMethodId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar método..." />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((pm) => (
                                    <SelectItem key={pm.id} value={pm.id}>
                                        {pm.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar Pago
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
