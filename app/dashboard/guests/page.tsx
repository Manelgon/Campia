import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function GuestsPage() {
    const supabase = await createClient();
    const { data: guests } = await supabase
        .from("guests")
        .select("*")
        .order("full_name", { ascending: true });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Huéspedes / Clientes</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Base de Datos de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre Completo</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>DNI/Pasaporte</TableHead>
                                <TableHead>Nacionalidad</TableHead>
                                <TableHead>Regisrado El</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {guests?.map((guest) => (
                                <TableRow key={guest.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/guests/${guest.id}`} className="hover:underline text-blue-600">
                                            {guest.full_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{guest.email || "-"}</TableCell>
                                    <TableCell>{guest.phone || "-"}</TableCell>
                                    <TableCell>{guest.document_id || "-"}</TableCell>
                                    <TableCell>{guest.nationality || "-"}</TableCell>
                                    <TableCell>
                                        {guest.created_at
                                            ? format(new Date(guest.created_at), "dd/MM/yyyy")
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {guests?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No hay huéspedes registrados.
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
