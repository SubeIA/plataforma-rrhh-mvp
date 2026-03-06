"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ShieldAlert, Users, LayoutDashboard, Calendar, FileText, Building, CreditCard, ChevronDown, UserSquare2, ShieldCheck, Download, Settings, FileSearch, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== "Admin")) {
            router.replace("/selection");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || user.role !== "Admin") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <ShieldAlert size={64} className="text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
                <p className="text-gray-500 mb-6 text-center max-w-md">No tienes los permisos necesarios para acceder al panel de administración.</p>
                <Link href="/selection" className="premium-button bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium">
                    Volver al Inicio
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50flex">
            {/* Sidebar Simple */}
            <aside className="fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 p-4 hidden md:flex flex-col">
                <div className="mb-8 p-4">
                    <h2 className="text-xl font-bold tracking-tight text-indigo-900 flex items-center gap-2">
                        <ShieldAlert size={24} className="text-indigo-600" />
                        Admin Panel
                    </h2>
                </div>
                <nav className="flex flex-col gap-2 flex-grow">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                        <Users size={20} />
                        <span className="font-medium">Gestión de Usuarios</span>
                    </Link>
                    <Link href="/admin/attendance" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                        <Calendar size={20} />
                        <span className="font-medium">Control Asistencia</span>
                    </Link>
                    <Link href="/admin/requests" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                        <FileText size={20} />
                        <span className="font-medium">Solicitudes</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-8 w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}
