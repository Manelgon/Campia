"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUserAction, toggleUserStatusAction, updateUserAction, resetPasswordAction, changeEmailAction } from "../actions";
import { toast } from "sonner";

interface UserRowActionsProps {
    user: any;
}

export function UserRowActions({ user }: UserRowActionsProps) {
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openResetPassword, setOpenResetPassword] = useState(false);
    const [openChangeEmail, setOpenChangeEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Edit form state
    const [fullName, setFullName] = useState(user.full_name || "");
    const [role, setRole] = useState(user.role || "reception");

    // Reset password state
    const [newPassword, setNewPassword] = useState("");

    // Change email state
    const [newEmail, setNewEmail] = useState(user.email || "");

    const handleEdit = async () => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("fullName", fullName);
        formData.append("role", role);

        const result = await updateUserAction(formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Usuario actualizado correctamente");
            setOpenEdit(false);
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        const result = await deleteUserAction(user.id);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Usuario eliminado correctamente");
            setOpenDelete(false);
        }
        setIsLoading(false);
    };

    const handleToggleStatus = async () => {
        setIsLoading(true);
        const result = await toggleUserStatusAction(user.id);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(result.message || "Estado actualizado");
        }
        setIsLoading(false);
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setIsLoading(true);
        const result = await resetPasswordAction(user.id, newPassword);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Contraseña restablecida correctamente");
            setOpenResetPassword(false);
            setNewPassword("");
        }
        setIsLoading(false);
    };

    const handleChangeEmail = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            toast.error("Email inválido");
            return;
        }

        setIsLoading(true);
        const result = await changeEmailAction(user.id, newEmail);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Email actualizado correctamente");
            setOpenChangeEmail(false);
        }
        setIsLoading(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenResetPassword(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Restablecer Contraseña
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenChangeEmail(true)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Cambiar Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleToggleStatus} disabled={isLoading}>
                        {user.is_active !== false ? (
                            <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Desactivar
                            </>
                        ) : (
                            <>
                                <Power className="mr-2 h-4 w-4" />
                                Activar
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpenDelete(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del usuario
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre Completo</Label>
                            <Input
                                id="edit-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Rol</Label>
                            <select
                                id="edit-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                disabled={isLoading}
                            >
                                <option value="reception">Recepción</option>
                                <option value="admin">Admin</option>
                                <option value="maintenance">Mantenimiento</option>
                                <option value="housekeeping">Limpieza</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit} disabled={isLoading}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={openResetPassword} onOpenChange={setOpenResetPassword}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restablecer Contraseña</DialogTitle>
                        <DialogDescription>
                            Establece una nueva contraseña para <strong>{user.full_name || user.email}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isLoading}
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenResetPassword(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleResetPassword} disabled={isLoading}>
                            Restablecer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Email Dialog */}
            <Dialog open={openChangeEmail} onOpenChange={setOpenChangeEmail}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Email</DialogTitle>
                        <DialogDescription>
                            Actualiza el email de acceso para <strong>{user.full_name || user.email}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-email">Nuevo Email</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                disabled={isLoading}
                                placeholder="usuario@ejemplo.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenChangeEmail(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleChangeEmail} disabled={isLoading}>
                            Cambiar Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar usuario?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                            <strong>{user.full_name || user.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
