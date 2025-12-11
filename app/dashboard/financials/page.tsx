import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "lucide-react"; // Icon
import { format } from "date-fns";
import { Button } from "@/components/ui/button"; // For actions if needed
import Link from "next/link";
import { Euro, FileText, TrendingUp } from "lucide-react";

export default async function FinancialsPage() {
    const supabase = await createClient();

    // Fetch Invoices
    const { data: invoices } = await supabase
        .from("invoices")
        .select(`
        *,
        bookings (
            guest_id,
            total_price,
            guests (full_name)
        )
    `)
        .order("created_at", { ascending: false });

    // Calculate Stats
    const totalRevenue = invoices?.reduce((acc, curr) => curr.status === 'paid' ? acc + (curr.total_amount || 0) : acc, 0) || 0;
    const pendingAmount = invoices?.reduce((acc, curr) => curr.status === 'pending' ? acc + (curr.total_amount || 0) : acc, 0) || 0;
    const totalInvoices = invoices?.length || 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Finanzas y Facturación</h2>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Facturas pagadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">€{pendingAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Facturas emitidas sin pagar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInvoices}</div>
                        <p className="text-xs text-muted-foreground">Total histórico</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices List */}
            <Card>
                <CardHeader>
                    <CardTitle>Facturas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Factura #</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.bookings?.guests?.full_name || "N/A"}</TableCell>
                                    <TableCell>{format(new Date(invoice.created_at), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase 
                                    ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {invoice.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">€{invoice.total_amount?.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            {invoices?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay facturas registradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
