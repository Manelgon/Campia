"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTicketAction } from "../actions";
import { useState, useRef } from "react";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Need Textarea component, will create or use Input
// Assuming Textarea component exists or use native textarea

import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export function TicketForm({ units, staff }: { units: any[], staff: any[] }) {
    const searchParams = useSearchParams();
    const preselectedUnitId = searchParams.get("unitId");

    const [isLoading, setIsLoading] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [assignedTo, setAssignedTo] = useState("");

    // Image Upload State
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        setIsUploading(true);
        const files = Array.from(e.target.files);
        const newPhotos: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `staff-uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("maintenance-uploads")
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("maintenance-uploads")
                    .getPublicUrl(filePath);

                newPhotos.push(publicUrl);
            }
            setPhotos(prev => [...prev, ...newPhotos]);
            toast.success("Fotos subidas correctamente");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error al subir imagen");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };


    // Simple wrapper to handle loading state
    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);

        // Append photos
        formData.append("photos", JSON.stringify(photos));
        if (assignedTo) {
            formData.append("assignedTo", assignedTo);
        }

        const res = await createTicketAction(formData);
        if (res?.error) {
            toast.error("Error al crear incidencia: " + res.error);
            setIsLoading(false);
        } else {
            toast.success("Incidencia creada correctamente");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reportar Incidencia</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título / Asunto</Label>
                        <Input id="title" name="title" placeholder="Ej. Grifo goteando" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Detalles sobre el problema..."
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <select
                                id="priority"
                                name="priority"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                disabled={isLoading}
                                defaultValue="medium"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unitId">Unidad Afectada (Opcional)</Label>
                            <select
                                id="unitId"
                                name="unitId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isLoading}
                                defaultValue={preselectedUnitId || ""}
                            >
                                <option value="">- Ninguna / General -</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Asignado a (Opcional)</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                    disabled={isLoading}
                                >
                                    {assignedTo
                                        ? staff.find((s) => s.id === assignedTo)?.full_name
                                        : "Asignar"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar por nombre..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="unassigned"
                                                onSelect={() => {
                                                    setAssignedTo("");
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        assignedTo === "" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Sin Asignar
                                            </CommandItem>
                                            {staff.map((s) => (
                                                <CommandItem
                                                    key={s.id}
                                                    value={s.full_name || "Unknown"}
                                                    onSelect={() => {
                                                        setAssignedTo(s.id);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            assignedTo === s.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {s.full_name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>



                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label>Fotos (Opcional)</Label>
                        <div className="flex flex-wrap gap-3">
                            {photos.map((url, idx) => (
                                <div key={idx} className="relative w-20 h-20 border rounded-md overflow-hidden">
                                    <Image
                                        src={url}
                                        alt="Uploaded"
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(idx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-md hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-20 h-20 flex flex-col items-center justify-center p-0 border-dashed"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isLoading}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                ) : (
                                    <ImagePlus className="w-6 h-6 text-slate-400" />
                                )}
                            </Button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Incidencia
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
