"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UnitActions } from "@/components/dashboard/unit-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Unit {
    id: string;
    name: string;
    type: string;
    capacity: number;
    price_per_night: number;
    status: string;
}

interface CustomPrice {
    unit_id?: string;
    unit_type?: string;
    price: number;
    start_date: string;
    end_date: string;
    label?: string; // Derived
}

export function UnitTable({ units, customPrices }: { units: Unit[], customPrices: CustomPrice[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "name";
    const currentOrder = searchParams.get("order") || "asc";

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams);
        if (currentSort === column) {
            params.set("order", currentOrder === "asc" ? "desc" : "asc");
        } else {
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

    // Helper to get current price (Client-side logic reused from original page)
    const getUnitCurrentPrice = (unit: Unit) => {
        const unitOverride = customPrices?.find(cp => cp.unit_id === unit.id);
        if (unitOverride) return { price: unitOverride.price, isCustom: true, label: 'Específica' };

        const typeOverride = customPrices?.find(cp => cp.unit_type === unit.type && !cp.unit_id);
        if (typeOverride) return { price: typeOverride.price, isCustom: true, label: 'Por Tipo' };

        return { price: unit.price_per_night, isCustom: false, label: 'Base' };
    };

    if (units.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No se encontraron alojamientos.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <SortableHead column="name" label="Nombre" />
                    <SortableHead column="type" label="Tipo" />
                    <SortableHead column="capacity" label="Capacidad" />
                    <TableHead>Precio (Hoy)</TableHead>
                    <SortableHead column="status" label="Estado Actual" />
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {units.map((unit) => {
                    const { price, isCustom, label } = getUnitCurrentPrice(unit);
                    return (
                        <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.name}</TableCell>
                            <TableCell className="capitalize">{unit.type}</TableCell>
                            <TableCell>{unit.capacity} pers.</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className={`font-bold ${isCustom ? 'text-amber-600' : ''}`}>
                                        €{Number(price).toFixed(2)}
                                    </span>
                                    {isCustom && <span className="text-[10px] text-muted-foreground uppercase">{label}</span>}
                                </div>
                            </TableCell>
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
                    );
                })}
            </TableBody>
        </Table>
    );
}
