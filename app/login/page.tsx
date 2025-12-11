"use client";

import { signInAction, signUpAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        const formData = new FormData(event.currentTarget);

        try {
            if (isSignUp) {
                const res = await signUpAction(formData);
                if (res?.error) {
                    setError(res.error);
                } else if (res?.message) {
                    setMessage(res.message);
                }
            } else {
                const res = await signInAction(formData);
                if (res?.error) {
                    setError(res.error);
                }
            }
        } catch (e) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">C</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">
                        CampIa
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? "Crea una cuenta para gestionar tu alojamiento"
                            : "Ingresa a tu cuenta para continuar"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nombre Completo</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 font-medium">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="text-sm text-green-600 font-medium">
                                {message}
                            </div>
                        )}
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Registrarse" : "Iniciar Sesión"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center">
                    <Button
                        variant="link"
                        className="text-sm text-muted-foreground"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                        }}
                        disabled={isLoading}
                    >
                        {isSignUp
                            ? "¿Ya tienes una cuenta? Inicia sesión"
                            : "¿No tienes cuenta? Regístrate"}
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
