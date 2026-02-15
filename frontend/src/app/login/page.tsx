"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
        } catch (err: any) {
            console.error(err);
            setError("Error al iniciar sesión: " + err.message);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
                        Iniciar Sesión
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
