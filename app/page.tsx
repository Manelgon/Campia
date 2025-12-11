import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-4xl font-bold text-primary tracking-tight">CampIa</h1>
                <p className="text-gray-500 text-lg">Sistema de Gestión de Propiedades y Experiencia de Huésped</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 w-full max-w-2xl">
                {/* Staff Access */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-primary">
                    <CardHeader className="text-center">
                        <Building2 className="w-12 h-12 mx-auto text-primary mb-2" />
                        <CardTitle>Personal del Hotel</CardTitle>
                        <CardDescription>Acceso administrativo y gestión</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/login" passHref>
                            <Button className="w-full">
                                Iniciar Sesión Staff
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Guest Access */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-primary">
                    <CardHeader className="text-center">
                        <User className="w-12 h-12 mx-auto text-primary mb-2" />
                        <CardTitle>Portal de Huéspedes</CardTitle>
                        <CardDescription>Información de tu estancia y servicios</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/guest/login" passHref>
                            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                                Soy Huésped
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <footer className="mt-12 text-gray-400 text-sm">
                © 2024 CampIa Systems. Todos los derechos reservados.
            </footer>
        </div>
    );
}
