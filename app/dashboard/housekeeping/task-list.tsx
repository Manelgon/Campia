"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { completeTaskAction, assignTaskAction } from "./actions";
import { useState } from "react";
import { Loader2, CheckCircle, User as UserIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <Card key={task.id} className={`${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{task.units?.name}</CardTitle>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase 
                                ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {task.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{task.units?.type}</p>
                    </CardHeader>
                    <CardContent className="pb-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(new Date(task.created_at), "dd MMM, HH:mm")}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <UserIcon className="mr-2 h-4 w-4" />
                            {task.profiles?.full_name || "Sin asignar"}
                        </div>
                        {task.priority === 'high' && (
                            <div className="text-xs font-bold text-red-600 mt-1">
                                PRIORIDAD ALTA (Check-out)
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        {task.status !== 'completed' && (
                            <>
                                <div className="flex gap-2 w-full">
                                    <form action={async (formData) => {
                                        await assignTaskAction(formData);
                                    }} className="flex-1 flex gap-2">
                                        <input type="hidden" name="taskId" value={task.id} />
                                        <select
                                            name="userId"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                            defaultValue={task.assigned_to || ""}
                                        >
                                            <option value="">Asignar a...</option>
                                            {staffMembers?.map(staff => (
                                                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                                            ))}
                                        </select>
                                        <Button type="submit" size="sm" variant="outline">OK</Button>
                                    </form>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleComplete(task.id, task.unit_id)}
                                        disabled={loadingId === task.id}
                                    >
                                        {loadingId === task.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Start
                                    </Button>
                                    <Button variant="destructive" size="icon" asChild>
                                        <a href={`/dashboard/maintenance/new?unitId=${task.unit_id}`}>
                                            <span className="sr-only">Reportar Problema</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                        </a>
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            ))}
            {tasks.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    No hay tareas pendientes.
                </div>
            )}
        </div>
    );
}
