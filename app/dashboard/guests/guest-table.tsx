"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createGuestAccountAction, disableGuestAccessAction } from "./actions";
import { toast } from "sonner";
import { Key, Ban, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Guest {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    document_id: string | null;
    nationality: string | null;
    created_at: string;
    user_id: string | null;
}

export function GuestTable({ guests }: { guests: Guest[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "created_at";
    const currentOrder = searchParams.get("order") || "desc";

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

    const handleEnableAccess = async (guest: Guest) => {
        if (!guest.email || !guest.document_id) {
            toast.error("Email y DNI son necesarios para habilitar acceso");
            return;
        }

        try {
            toast.info("Creando usuario...");
            const res = await createGuestAccountAction(guest.id, guest.email, guest.document_id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.message);
                router.refresh();
            }
        } catch (e) {
            toast.error("Error al habilitar acceso");
        }
    };

    const handleDisableAccess = async (guest: Guest) => {
        if (!confirm("¿Estás seguro de desactivar el acceso? El usuario no podrá entrar.")) return;

        try {
            toast.info("Desactivando acceso...");
            const res = await disableGuestAccessAction(guest.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.message);
                router.refresh();
            }
        } catch (e) {
            toast.error("Error al desactivar acceso");
        }
    };

    if (guests.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No se encontraron clientes.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <SortableHead column="full_name" label="Nombre" />
                    <SortableHead column="email" label="Email" />
                    <SortableHead column="phone" label="Teléfono" />
                    <SortableHead column="document_id" label="Documento" />
                    <SortableHead column="nationality" label="Nacionalidad" />
                    <TableHead className="text-center">Estado</TableHead>
                    <SortableHead column="created_at" label="Registrado" />
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {guests.map((guest) => (
                    <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.full_name}</TableCell>
                        <TableCell>{guest.email || "-"}</TableCell>
                        <TableCell>{guest.phone || "-"}</TableCell>
                        <TableCell>{guest.document_id || "-"}</TableCell>
                        <TableCell>{guest.nationality || "-"}</TableCell>
                        <TableCell className="text-center">
                            {guest.user_id ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-muted-foreground">
                                    <XCircle className="w-3 h-3 mr-1" /> Inactivo
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell>{new Date(guest.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            {!guest.user_id ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnableAccess(guest)}
                                    title="Habilitar Acceso App"
                                >
                                    <Key className="mr-2 h-3 w-3" />
                                    Acceso
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                    onClick={() => handleDisableAccess(guest)}
                                    title="Desactivar Acceso"
                                >
                                    <Ban className="mr-2 h-3 w-3" />
                                    Desactivar
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
