"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function RecoverPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const { resetPassword } = useAuth();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setStatus("loading");
        try {
            await resetPassword(email);
            setStatus("success");
            setMessage("Hemos enviado un enlace de recuperación a tu correo electrónico.");
        } catch (err: any) {
            console.error(err);
            setStatus("error");
            // Simplified error messages for end users
            if (err.message.includes("auth/user-not-found")) {
                setMessage("No hay ningún usuario registrado con este correo.");
            } else if (err.message.includes("auth/invalid-email")) {
                setMessage("El correo electrónico no es válido.");
            } else {
                setMessage("Error al enviar el correo. Por favor, intenta nuevamente.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md animate-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">SubeIA</h1>
                    <p className="text-gray-500 mt-2 font-medium">Recuperación de Contraseña</p>
                </div>

                <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Restaurar Acceso</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Ingresa el correo electrónico vinculado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
                    </p>

                    {status === "success" ? (
                        <div className="text-center space-y-6 animate-in">
                            <div className="flex justify-center">
                                <CheckCircle2 size={64} className="text-emerald-500" />
                            </div>
                            <p className="text-gray-700 font-medium">{message}</p>
                            <Link href="/login" className="block w-full bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-100 transition-colors">
                                Volver al Inicio de Sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 outline-none"
                                        placeholder="ejemplo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {status === "error" && (
                                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium animate-in">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="premium-button w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                            >
                                {status === "loading" ? (
                                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Enviar Enlace"
                                )}
                            </button>

                            <div className="pt-4 text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                                    <ArrowLeft size={16} />
                                    Volver al login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
