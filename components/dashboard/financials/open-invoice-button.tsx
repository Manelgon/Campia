"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { createInvoiceAction } from "@/app/dashboard/financials/actions";
import { toast } from "sonner";

interface OpenInvoiceButtonProps {
    bookingId: string;
    paymentMethods?: { id: string; name: string }[];
}

export function OpenInvoiceButton({ bookingId, paymentMethods = [] }: OpenInvoiceButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentMethodId, setPaymentMethodId] = useState<string>("");

    const handleCreate = () => {
        const amount = parseFloat(paymentAmount);

        if (amount > 0 && !paymentMethodId) {
            toast.error("Seleccione un método de pago");
            return;
        }

        startTransition(async () => {
            const initialPayment = amount > 0
                ? { amount, methodId: paymentMethodId }
                : undefined;

            const res = await createInvoiceAction(bookingId, initialPayment);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Cuenta abierta y factura generada");
                setIsOpen(false);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" suppressHydrationWarning>
                    <FileText className="mr-2 h-4 w-4" />
                    Abrir Cuenta / Generar Factura
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Abrir Cuenta</DialogTitle>
                    <DialogDescription>
                        Esto generará una factura para la reserva con los cargos actuales.
                        Puedes registrar un pago inicial opcional ahora mismo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Pago Inicial (Opcional)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                    </div>

                    {parseFloat(paymentAmount) > 0 && (
                        <div className="space-y-2">
                            <Label>Método de Pago</Label>
                            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
