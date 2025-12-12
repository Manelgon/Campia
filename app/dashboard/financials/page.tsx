import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfDay, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { Euro, FileText, TrendingUp, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { RecordPaymentDialog } from "@/components/dashboard/financials/record-payment-dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FinancialsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();

    // Await searchParams before access
    const { range = "month" } = await searchParams;

    // Helper to get date range
    const now = new Date();
    let startDate: Date | null = null;
    let rangeLabel = "Todo el historial";

    // Normalize date handling
    if (range === "today") {
        startDate = startOfDay(now);
        rangeLabel = "Hoy";
    } else if (range === "month") {
        startDate = startOfMonth(now);
        rangeLabel = "Este Mes";
    } else if (range === "year") {
        startDate = startOfYear(now);
        rangeLabel = "Este Año";
    }

    const startDateIso = startDate ? startDate.toISOString() : null;

    // 1. Fetch Invoices (Filtered by range if applicable)
    let invoicesQuery = supabase
        .from("invoices")
        .select(`
        *,
        bookings (
            guest_id,
            total_amount,
            status,
            guests (full_name)
        )
    `)
        .order("created_at", { ascending: false });

    if (startDateIso) {
        invoicesQuery = invoicesQuery.gte("created_at", startDateIso);
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery;

    if (invoicesError) {
        console.error("Error loading invoices:", invoicesError);
    }

    // 2. Fetch Payment Methods
    const { data: paymentMethods } = await supabase
        .from("payment_methods")
        .select("id, name")
        .eq("is_active", true);

    // 3. Fetch Reports (Views)
    // Daily income filtered by range
    let dailyIncomeQuery = supabase.from("view_daily_income").select("*");
    // Note: view_daily_income uses created_at of payments.
    // If we want "Income in this period", we filter THIS view by date.
    // However, the view has a 'dia' column which is date(p.created_at).
    // We can filter on 'dia'.
    if (startDateIso) {
        // dia in view_daily_income is type date (YYYY-MM-DD)
        // startDateIso is timestamp. We should format it to YYYY-MM-DD for comparison if possible,
        // or just pass the ISO string and Postgres might handle it, but safest is YYYY-MM-DD
        const startDia = format(startDate!, "yyyy-MM-dd");
        dailyIncomeQuery = dailyIncomeQuery.gte("dia", startDia);
    }
    const { data: dailyIncome } = await dailyIncomeQuery.limit(50); // Increased limit

    const { data: pendingPayments } = await supabase.from("view_pending_payments").select("*");

    // 4. Calculate Stats

    // A. Real Cash Income (From Payments in this period)
    // We can sum up 'total_ingresos' from dailyIncome query which represents distinct (day, method) sums
    // This is more accurate for "Cash Flow" in the selected period.
    const totalRevenueCash = dailyIncome?.reduce((acc, curr) => acc + (curr.total_ingresos || 0), 0) || 0;

    // B. Pending Amount (Outstanding)
    // Logic: Do we show ALL pending debt, or only debt from invoices generated in this period?
    // User context: "vista de hoy mes y año" usually implies filtering the dataset.
    // So we will show pending amount existing ON THE INVOICES displayed.
    const pendingAmount = invoices?.reduce((acc, curr) => {
        const isUnpaid = curr.status !== 'paid' && curr.status !== 'cancelled';
        if (isUnpaid) {
            return acc + ((curr.total_amount || 0) - (curr.total_paid || 0));
        }
        return acc;
    }, 0) || 0;

    const totalInvoices = invoices?.length || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Finanzas y Facturación</h2>

                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={range === "today" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}
                        asChild
                    >
                        <Link href="/dashboard/financials?range=today">Hoy</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={range === "month" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}
                        asChild
                    >
                        <Link href="/dashboard/financials?range=month">Mes</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={range === "year" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}
                        asChild
                    >
                        <Link href="/dashboard/financials?range=year">Año</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={(!range || range === "all") ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : ""}
                        asChild
                    >
                        <Link href="/dashboard/financials?range=all">Histórico</Link>
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Viendo datos de: <span className="font-medium text-foreground">{rangeLabel}</span></span>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales (Cobrado)</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{totalRevenueCash.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {range === 'today' ? "Recibido hoy" :
                                range === 'month' ? "Recibido este mes" :
                                    "Total cobrado en el periodo"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">€{pendingAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">De facturas del periodo</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInvoices}</div>
                        <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Facturas</TabsTrigger>
                    <TabsTrigger value="reports">Reportes y Vistas</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Facturas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Factura #</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Pagado</TableHead>
                                        <TableHead className="text-right">Pendiente</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices?.map((invoice) => {
                                        const pending = (invoice.total_amount || 0) - (invoice.total_paid || 0);
                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                                <TableCell>
                                                    {invoice.booking_id ? (
                                                        <Link href={`/dashboard/bookings/${invoice.booking_id}`} className="text-orange-500 hover:underline">
                                                            {invoice.bookings?.guests?.full_name || "Cliente Desconocido"}
                                                        </Link>
                                                    ) : (
                                                        invoice.bookings?.guests?.full_name || "N/A"
                                                    )}
                                                </TableCell>
                                                <TableCell>{format(new Date(invoice.created_at), "dd/MM/yyyy")}</TableCell>
                                                <TableCell>
                                                    <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                        {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Anulada' : 'Pendiente'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">€{invoice.total_amount?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-green-600">€{invoice.total_paid?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-orange-600">
                                                    {pending > 0.01 ? `€${pending.toFixed(2)}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {invoice.status !== 'cancelled' && pending > 0.01 && (
                                                        <RecordPaymentDialog
                                                            invoice={{
                                                                id: invoice.id,
                                                                invoice_number: invoice.invoice_number,
                                                                total_amount: invoice.total_amount || 0,
                                                                total_paid: invoice.total_paid || 0
                                                            }}
                                                            paymentMethods={paymentMethods || []}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {invoices?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                No hay facturas registradas en este periodo.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Report 1: Daily Income */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ingresos Diarios por Método ({rangeLabel})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Transacciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dailyIncome?.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.dia}</TableCell>
                                                <TableCell className="capitalize">{row.metodo}</TableCell>
                                                <TableCell className="text-right">€{row.total_ingresos}</TableCell>
                                                <TableCell className="text-right">{row.num_transacciones}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!dailyIncome || dailyIncome.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">Sin datos recientes en este periodo.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Report 2: Outstanding Invoices (Derived from Invoices) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    Cobros Pendientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Factura</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Reserva</TableHead>
                                            <TableHead className="text-right">Pendiente</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices?.filter(inv => {
                                            const pending = (inv.total_amount || 0) - (inv.total_paid || 0);
                                            return inv.status !== 'cancelled' && inv.status !== 'paid' && pending > 0.01;
                                        }).map((inv) => {
                                            const pending = (inv.total_amount || 0) - (inv.total_paid || 0);
                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">#{inv.invoice_number}</TableCell>
                                                    <TableCell>
                                                        {inv.booking_id ? (
                                                            <Link href={`/dashboard/bookings/${inv.booking_id}`} className="text-orange-500 hover:underline">
                                                                {inv.bookings?.guests?.full_name || "Cliente Desconocido"}
                                                            </Link>
                                                        ) : (
                                                            inv.bookings?.guests?.full_name || "N/A"
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {inv.bookings?.status === 'checked_in' ? 'Check-in' : inv.bookings?.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-orange-600">
                                                        €{pending.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {(!invoices || invoices.filter(inv => {
                                            const pending = (inv.total_amount || 0) - (inv.total_paid || 0);
                                            return inv.status !== 'cancelled' && inv.status !== 'paid' && pending > 0.01;
                                        }).length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No hay cobros pendientes.</TableCell>
                                                </TableRow>
                                            )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
