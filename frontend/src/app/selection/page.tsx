"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Factory, MapPin, Users } from "lucide-react";

export default function SelectionPage() {
    const { user, loading, protectRoute } = useAuth();
    const router = useRouter();

    useEffect(() => {
        protectRoute();
    }, [user, loading]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-50">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30 text-gray-800">
                    Sistema de Control de Asistencia v1.0
                </p>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }}
                    className="premium-button bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-gray-100 hover:bg-gray-50"
                >
                    Cerrar Sesión
                </button>
            </div>

            <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-6">
                <a href="/dashboard" className="group rounded-[2rem] border border-transparent px-8 py-10 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 bg-gray-50/50">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                        <MapPin size={24} />
                    </div>
                    <h2 className={`mb-3 text-2xl font-bold text-gray-800`}>
                        Asistencia <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm text-gray-500 font-medium`}>
                        Marcar entrada/salida y ver historial de asistencia.
                    </p>
                </a>

                <a href="/dashboard/admin" className="group rounded-[2rem] border border-transparent px-8 py-10 transition-all hover:border-emerald-100 hover:bg-white hover:shadow-2xl hover:shadow-emerald-100/50 bg-gray-50/50">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                        <Factory size={24} />
                    </div>
                    <h2 className={`mb-3 text-2xl font-bold text-gray-800`}>
                        Administración <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm text-gray-500 font-medium`}>
                        Gestión de usuarios, turnos, sitios y reportes generales.
                    </p>
                </a>

                <a href="/dashboard/hr" className="group rounded-[2rem] border border-transparent px-8 py-10 transition-all hover:border-purple-100 hover:bg-white hover:shadow-2xl hover:shadow-purple-100/50 bg-gray-50/50">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-2xl mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <h2 className={`mb-3 text-2xl font-bold text-gray-800`}>
                        RRHH <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm text-gray-500 font-medium`}>
                        Firma digital de documentos y portal del colaborador.
                    </p>
                </a>
            </div>

            <div className="mt-10 text-gray-400 text-xs font-medium uppercase tracking-widest">
                SubeIA • Plataforma Corporativa
            </div>
        </main>
    );
}
