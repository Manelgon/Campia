"use client";

import { Button } from "@/components/ui/button";
import { completeTaskAction, assignTaskAction } from "./actions";
import { useState } from "react";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Task = {
    id: string;
    unit_id: string;
    priority: string;
    status: string;
    created_at: string;
    units: { name: string; type: string };
    assigned_to: string | null;
    profiles?: { full_name: string };
};

export function TaskList({ tasks, currentUserId, staffMembers }: { tasks: Task[], currentUserId: string, staffMembers: any[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleComplete = async (taskId: string, unitId: string) => {
        setLoadingId(taskId);
        await completeTaskAction(taskId, unitId);
        setLoadingId(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Listado de Tareas</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Asignado A</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">
                                    <div>{task.units?.name}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{task.units?.type}</div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                                        ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'low' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {task.priority === 'high' ? 'ALTA' : task.priority === 'low' ? 'BAJA' : 'NORMAL'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 max-w-[180px]">
                                        {task.status !== 'completed' ? (
                                            <form action={async (formData) => {
                                                await assignTaskAction(formData);
                                            }} className="flex gap-2 items-center">
                                                <input type="hidden" name="taskId" value={task.id} />
                                                <select
                                                    name="userId"
                                                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors"
                                                    defaultValue={task.assigned_to || ""}
                                                >
                                                    <option value="">Sin asignar</option>
                                                    {staffMembers?.map(staff => (
                                                        <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                                                    ))}
                                                </select>
                                                <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                                                    <CheckCircle className="h-3 w-3" />
                                                </Button>
                                            </form>
                                        ) : (
                                            <span className="text-sm">{task.profiles?.full_name || "Sin asignar"}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(task.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize
                                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {task.status !== 'completed' && (
                                            <Button
                                                size="sm"
                                                className="h-8 bg-green-600 hover:bg-green-700 text-xs"
                                                onClick={() => handleComplete(task.id, task.unit_id)}
                                                disabled={loadingId === task.id}
                                            >
                                                {loadingId === task.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                                                Start
                                            </Button>
                                        )}
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-yellow-600" asChild>
                                            <Link href={`/dashboard/maintenance/new?unitId=${task.unit_id}`}>
                                                <AlertTriangle className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay tareas pendientes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
