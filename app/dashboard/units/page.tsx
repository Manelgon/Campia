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
import { UnitActions } from "@/components/dashboard/unit-actions";

export default async function UnitsPage() {
    const supabase = await createClient();
    const { data: units } = await supabase
        .from("units")
        .select("*")
        .order("name", { ascending: true });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Alojamientos</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estado de Unidades</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Capacidad</TableHead>
                                <TableHead>Estado Actual</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {units?.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">{unit.name}</TableCell>
                                    <TableCell className="capitalize">{unit.type}</TableCell>
                                    <TableCell>{unit.capacity} pers.</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${unit.status === "clean"
                                                ? "bg-green-100 text-green-800"
                                                : unit.status === "occupied"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : unit.status === "dirty"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {unit.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UnitActions unitId={unit.id} status={unit.status} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {units?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No hay unidades registradas.
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
