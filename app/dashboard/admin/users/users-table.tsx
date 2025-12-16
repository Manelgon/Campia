import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { UserRowActions } from "./UserRowActions";

interface UsersTableProps {
    users: any[];
}

export function UsersTable({ users }: UsersTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "Sin nombre"}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize 
                            ${user.role === 'admin' || user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'housekeeping' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                                {user.role || "user"}
                            </span>
                        </TableCell>
                        <TableCell>
                            {user.created_at
                                ? format(new Date(user.created_at), "dd/MM/yyyy")
                                : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                            <UserRowActions user={user} />
                        </TableCell>
                    </TableRow>
                ))}
                {users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                            No se encontraron usuarios.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
