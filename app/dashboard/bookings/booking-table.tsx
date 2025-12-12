"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BookingActions } from "@/components/dashboard/booking-actions";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Booking {
    id: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    guests_count: number;
    unit_name: string | null;
    guest_name: string | null;
    guest_phone: string | null;
}

export function BookingTable({ bookings, isHistory }: { bookings: Booking[], isHistory?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "check_in_date";
    const currentOrder = searchParams.get("order") || "asc";

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams);
        if (currentSort === column) {
            // Toggle order
            params.set("order", currentOrder === "asc" ? "desc" : "asc");
        } else {
            // New column, default to asc
            params.set("sort", column);
            params.set("order", "asc");
        }
        router.replace(`?${params.toString()}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground opacity-50" />;
        return currentOrder === "asc" ? <ArrowUp className="ml-2 h-3 w-3 text-foreground" /> : <ArrowDown className="ml-2 h-3 w-3 text-foreground" />;
    };

    const SortableHead = ({ column, label, className }: { column: string, label: string, className?: string }) => (
        <TableHead className={className}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort(column)}
            >
                {label}
                <SortIcon column={column} />
            </Button>
        </TableHead>
    );

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {isHistory ? "No se encontraron reservas en el historial." : "No hay reservas activas o futuras."}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <SortableHead column="guest_name" label="Huésped" />
                    <SortableHead column="unit_name" label="Unidad" />
                    <SortableHead column="check_in_date" label="Entrada" />
                    <SortableHead column="check_out_date" label="Salida" />
                    <SortableHead column="status" label="Estado" />
                    <SortableHead column="guests_count" label="Pax" />
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/bookings/${booking.id}`} className="hover:underline text-blue-600">
                                <div>{booking.guest_name || "Desconocido"}</div>
                                <div className="text-xs text-muted-foreground">{booking.guest_phone || "-"}</div>
                            </Link>
                        </TableCell>
                        <TableCell>{booking.unit_name || "Sin Asignar"}</TableCell>
                        <TableCell>
                            {format(new Date(booking.check_in_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                            {format(new Date(booking.check_out_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${booking.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "checked_in"
                                        ? "bg-blue-100 text-blue-800"
                                        : booking.status === "checked_out"
                                            ? "bg-gray-100 text-gray-800"
                                            : booking.status === "cancelled"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                    }`}
                            >
                                {booking.status === 'checked_in' ? 'Check-in' :
                                    booking.status === 'checked_out' ? 'Check-out' :
                                        booking.status === 'confirmed' ? 'Confirmada' :
                                            booking.status === 'cancelled' ? 'Cancelada' : booking.status}
                            </span>
                        </TableCell>
                        <TableCell>{booking.guests_count}</TableCell>
                        <TableCell className="text-right">
                            <BookingActions bookingId={booking.id} status={booking.status} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
