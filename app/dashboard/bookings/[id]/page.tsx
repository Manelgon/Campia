import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Fixed import
import { format } from "date-fns";
import { AddExtraForm } from "@/components/dashboard/add-extra-form";
import { Button } from "@/components/ui/button"; // Still needed for other buttons?
import { FileText } from "lucide-react";
import { RecordPaymentDialog } from "@/components/dashboard/financials/record-payment-dialog";
import { OpenInvoiceButton } from "@/components/dashboard/financials/open-invoice-button";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    // ... (rest of the fetching logic is fine, no changes needed until the return)
    // 1. Fetch Booking
    const { data: booking } = await supabase
        .from("bookings")
        .select(`
            *,
            guests (full_name, email, phone),
            units (name, type)
        `)
        .eq("id", id)
        .single();

    if (!booking) return <div>Reserva no encontrada</div>;

    // 2. Extras
    const { data: bookingExtras } = await supabase.from("booking_extras").select(`*, extras(name, price)`).eq("booking_id", id);

    // 3. Available Extras
    const { data: availableExtras } = await supabase.from("extras").select("*");

    // 4. Invoice
    const { data: invoice } = await supabase.from("invoices").select(`*, payments(*)`).eq("booking_id", id).single();

    // 5. Payment Methods
    const { data: paymentMethods } = await supabase.from("payment_methods").select("id, name").eq("is_active", true);

    // 6. Price Breakdown (Client-side calculation to avoid migration issues)
    // Fetch custom prices relevant to the booking range/unit
    const { data: customPrices } = await supabase
        .from("custom_prices")
        .select("*")
        .or(`unit_id.eq.${booking.unit_id},unit_type.eq.${booking.units?.type}`)
        .lte("start_date", booking.check_out_date) // Optimization: overlap check could be better but this is safe
        .gte("end_date", booking.check_in_date);

    // Generate daily breakdown
    const priceBreakdown = [];
    if (booking.check_in_date && booking.check_out_date && booking.units) {
        let currentDate = new Date(booking.check_in_date);
        const endDate = new Date(booking.check_out_date);
        const basePrice = booking.units.price_per_night;

        while (currentDate < endDate) {
            const dateStr = format(currentDate, "yyyy-MM-dd"); // Match DB date format
            let dailyPrice = basePrice;
            let source = "Tarifa Base";

            // Find best custom price
            // Priority: Unit specific > Type specific
            // Sort by created_at desc if multiple match? (DB logic was order by created_at desc limit 1)
            // Application logic: filter, sort, pick top.

            const relevantPrices = customPrices?.filter(cp =>
                dateStr >= cp.start_date && dateStr <= cp.end_date
            ) || [];

            // 1. Check Unit specific
            const unitPrice = relevantPrices
                .filter(cp => cp.unit_id === booking.unit_id)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            if (unitPrice) {
                dailyPrice = unitPrice.price;
                source = "Tarifa Especial (Unidad)";
            } else {
                // 2. Check Type specific (only if no unit_id is set on the rule, typically)
                // DB logic: "unit_id is null".
                const typePrice = relevantPrices
                    .filter(cp => !cp.unit_id && cp.unit_type === booking.units?.type)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                if (typePrice) {
                    dailyPrice = typePrice.price;
                    source = "Tarifa Especial (Tipo)";
                }
            }

            priceBreakdown.push({
                date: dateStr,
                price: dailyPrice,
                source: source
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    const totalExtras = bookingExtras?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    const totalBooking = (booking.total_amount || 0);

    // Group breakdown items
    const groupedBreakdown: { source: string, price: number, count: number, total: number, startDate: string, endDate: string }[] = [];
    if (priceBreakdown) {
        priceBreakdown.forEach((pb: any) => {
            const last = groupedBreakdown[groupedBreakdown.length - 1];
            if (last && last.source === pb.source && last.price === pb.price) {
                last.count++;
                last.total += pb.price;
                last.endDate = pb.date;
            } else {
                groupedBreakdown.push({
                    source: pb.source,
                    price: pb.price,
                    count: 1,
                    total: pb.price,
                    startDate: pb.date,
                    endDate: pb.date
                });
            }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Reserva #{booking.id.slice(0, 8)}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase 
                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                    {booking.status}
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Guest & Unit Info */}
                <Card>
                    <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Cliente:</span>
                            <span className="font-medium">{booking.guests?.full_name}</span>
                            <span className="text-muted-foreground">Unidad:</span>
                            <span className="font-medium">{booking.units?.name} ({booking.units?.type})</span>
                            <span className="text-muted-foreground">Entrada:</span>
                            <span>{format(new Date(booking.check_in_date), "dd MMM yyyy")}</span>
                            <span className="text-muted-foreground">Salida:</span>
                            <span>{format(new Date(booking.check_out_date), "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Extras */}
                <Card>
                    <CardHeader><CardTitle>Servicios Extra (POS)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {bookingExtras?.map(be => (
                                <div key={be.id} className="flex justify-between text-sm border-b pb-1">
                                    <span>{be.extras?.name} (x{be.quantity})</span>
                                    <span>€{be.total_price.toFixed(2)}</span>
                                </div>
                            ))}
                            {bookingExtras?.length === 0 && <p className="text-muted-foreground text-sm">No hay extras añadidos.</p>}
                        </div>
                        <div className="pt-4 border-t">
                            <AddExtraForm bookingId={id} extras={availableExtras || []} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Summary */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Pagos y Facturación</CardTitle>
                    {invoice && (
                        <div className="flex gap-2">
                            <RecordPaymentDialog
                                invoice={invoice}
                                paymentMethods={paymentMethods || []}
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-2">Desglose de Facturación</h4>

                        <div className="bg-white rounded border">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Concepto</th>
                                        <th className="px-3 py-2 text-center font-medium">Cant.</th>
                                        <th className="px-3 py-2 text-right font-medium">Precio Unit.</th>
                                        <th className="px-3 py-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {/* Accommodation Breakdown */}
                                    {groupedBreakdown.map((item, idx) => {
                                        const dateRange = item.startDate === item.endDate
                                            ? format(new Date(item.startDate), "dd/MM")
                                            : `${format(new Date(item.startDate), "dd/MM")} - ${format(new Date(item.endDate), "dd/MM")}`;

                                        return (
                                            <tr key={`acc-${idx}`}>
                                                <td className="px-3 py-2">
                                                    {item.source}
                                                    <span className="text-xs text-muted-foreground block">
                                                        {dateRange} • Alojamiento
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">{item.count}</td>
                                                <td className="px-3 py-2 text-right">€{item.price.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-medium">€{item.total.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Fallback if no breakdown available but total > 0 */}
                                    {groupedBreakdown.length === 0 && totalBooking > 0 && (
                                        <tr>
                                            <td className="px-3 py-2">Alojamiento (Base)</td>
                                            <td className="px-3 py-2 text-center">1</td>
                                            <td className="px-3 py-2 text-right">€{totalBooking.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-medium">€{totalBooking.toFixed(2)}</td>
                                        </tr>
                                    )}

                                    {/* Extras Breakdown */}
                                    {bookingExtras?.map((be) => (
                                        <tr key={`ext-${be.id}`}>
                                            <td className="px-3 py-2">
                                                {be.extras?.name}
                                                <span className="text-xs text-muted-foreground block">Servicio Extra</span>
                                            </td>
                                            <td className="px-3 py-2 text-center">{be.quantity}</td>
                                            <td className="px-3 py-2 text-right">€{(be.total_price / be.quantity).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-medium">€{be.total_price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2 text-right">Total General</td>
                                        <td className="px-3 py-2 text-right text-base">€{(totalBooking + totalExtras).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {invoice && (
                            <>
                                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                                    <span>Pagado:</span>
                                    <span className="text-green-600 font-medium">€{invoice.total_paid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-dashed">
                                    <span>Pendiente:</span>
                                    <span className={`${((totalBooking + totalExtras) - invoice.total_paid) > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                                        €{Math.max(0, (totalBooking + totalExtras) - invoice.total_paid).toFixed(2)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {invoice ? (
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Historial de Pagos</h4>
                            <div className="space-y-2">
                                {invoice.payments?.map((p: any) => (
                                    <div key={p.id} className="flex justify-between items-center text-sm border p-2 rounded bg-white">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Pago registrado</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}</span>
                                        </div>
                                        <Badge variant="outline" className="ml-auto mr-4">
                                            {paymentMethods?.find(m => m.id === p.payment_method_id)?.name || 'General'}
                                        </Badge>
                                        <span className="font-bold text-green-700">€{p.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                                {(!invoice.payments || invoice.payments.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No hay pagos registrados.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-3">
                            <p className="text-muted-foreground">No hay cuenta/factura activa para esta reserva.</p>
                            <OpenInvoiceButton bookingId={id} paymentMethods={paymentMethods || []} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
