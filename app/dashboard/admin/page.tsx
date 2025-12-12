import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Administración</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Crear y editar usuarios del sistema.</p>
                        <Link href="/dashboard/admin/users" className="text-blue-600 hover:underline">Ir a Usuarios &rarr;</Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración del Hotel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Editar datos de la propiedad.</p>
                        <Link href="/dashboard/admin/settings" className="text-blue-600 hover:underline">Ir a Configuración &rarr;</Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Tarifas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Precios variables y revenue management.</p>
                        <Link href="/dashboard/admin/rates" className="text-blue-600 hover:underline">Ir a Tarifas &rarr;</Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
