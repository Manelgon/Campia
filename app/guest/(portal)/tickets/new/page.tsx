"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createTicketAction } from "../../actions"; // We will add this to actions.ts
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function NewTicketPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const files = Array.from(e.target.files);
        const newPhotos: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `guest-uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("maintenance-uploads")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("photos", JSON.stringify(photos)); // Append the array of URLs

        const res = await createTicketAction(formData);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Incidencia reportada correctamente");
            router.push("/guest/tickets");
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Reportar Nueva Incidencia</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título del problema</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Ej: Aire acondicionado no funciona"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción detallada</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe el problema para ayudarnos a solucionarlo..."
                                required
                                className="min-h-[120px]"
                            />
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <Label>Fotos (Opcional)</Label>
                            <div className="flex flex-wrap gap-3">
                                {photos.map((url, idx) => (
                                    <div key={idx} className="relative w-20 h-20 border rounded-md overflow-hidden">
                                        <Image src={url} alt="Uploaded" fill className="object-cover" />
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
                                    disabled={isUploading}
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

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={isLoading || isUploading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Reporte"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
