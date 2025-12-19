"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RateDeleteButton } from "@/app/dashboard/admin/rates/rate-delete-button";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar, Euro, Home } from "lucide-react";

interface Rate {
    id: string;
    unit_id: string | null;
    unit_type: string | null;
    start_date: string;
    end_date: string;
    price: number;
    units?: { name: string } | null;
}

interface RatesListProps {
    rates: Rate[];
}

export function RatesList({ rates }: RatesListProps) {
    const today = startOfDay(new Date());

    const activeRates = rates.filter(r => !isBefore(new Date(r.end_date), today));
    const expiredRates = rates.filter(r => isBefore(new Date(r.end_date), today));

    const RatesTable = ({ data }: { data: Rate[] }) => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Objetivo</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No hay tarifas en esta sección.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((rate) => (
                            <TableRow key={rate.id}>
                                <TableCell>
                                    {rate.unit_id ? (
                                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                                            <Home className="h-3 w-3" /> Unidad
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="flex w-fit items-center gap-1">
                                            <Home className="h-3 w-3" /> Tipo
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {rate.units?.name || rate.unit_type || "N/A"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {format(new Date(rate.start_date), "dd/MM/yyyy")} - {format(new Date(rate.end_date), "dd/MM/yyyy")}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    €{rate.price}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end">
                                        <RateDeleteButton rateId={rate.id} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <Tabs defaultValue="active" className="w-full">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="active">Activas ({activeRates.length})</TabsTrigger>
                    <TabsTrigger value="history">Histórico ({expiredRates.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="active" className="mt-4">
                <RatesTable data={activeRates} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <RatesTable data={expiredRates} />
            </TabsContent>
        </Tabs>
    );
}
