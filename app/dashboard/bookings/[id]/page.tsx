import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "lucide-react"; // Replace with span
import { format } from "date-fns";
import { AddExtraForm } from "@/components/dashboard/add-extra-form";
import { createInvoiceAction } from "@/app/dashboard/financials/actions";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

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

    // 2. Fetch Extras added to this booking
    const { data: bookingExtras } = await supabase
        .from("booking_extras")
        .select(`*, extras(name, price)`)
        .eq("booking_id", id);

    // 3. Fetch Available Extras for dropdown
    const { data: availableExtras } = await supabase
        .from("extras")
        .select("*");

    // 4. Check for existing invoice
    const { data: invoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("booking_id", id)
        .single();

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

                {/* Extras & Services */}
                <Card>
                    <CardHeader><CardTitle>Servicios Extra (POS)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {/* List existing extras */}
                        <div className="space-y-2">
                            {bookingExtras?.map(be => (
                                <div key={be.id} className="flex justify-between text-sm border-b pb-1">
                                    <span>{be.extras?.name} (x{be.quantity})</span>
                                    <span>€{be.total_price.toFixed(2)}</span>
                                </div>
                            ))}
                            {bookingExtras?.length === 0 && <p className="text-muted-foreground text-sm">No hay extras añadidos.</p>}
                        </div>

                        {/* Add New Extra Form */}
                        <div className="pt-4 border-t">
                            <AddExtraForm bookingId={id} extras={availableExtras || []} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Summary */}
            <Card>
                <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Reserva Base:</span>
                        <span>€{booking.total_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                        <span>Total Extras:</span>
                        <span>€{bookingExtras?.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 flex justify-between items-center">
                    {invoice ? (
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                            <FileText className="h-5 w-5" />
                            Factura Generada (#{invoice.invoice_number}) - {invoice.status.toUpperCase()}
                        </div>
                    ) : (
                        <form action={async () => {
                            "use server";
                            await createInvoiceAction(id);
                        }}>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                <FileText className="mr-2 h-4 w-4" />
                                Generar Factura Final
                            </Button>
                        </form>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
