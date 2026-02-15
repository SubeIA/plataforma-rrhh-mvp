"use client";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return <>{children}</>;

    const navItems = [
        { name: 'Mi Asistencia', href: '/dashboard', roles: ['admin', 'hr', 'employee'] },
        { name: 'Solicitudes', href: '/dashboard/requests', roles: ['admin', 'hr', 'employee'] },
        { name: 'Mis Documentos', href: '/dashboard/documents', roles: ['admin', 'hr', 'employee'] },
        { name: 'Gestión RRHH', href: '/dashboard/hr', roles: ['admin', 'hr'] },
        { name: 'Gestión Solicitudes', href: '/dashboard/hr/requests', roles: ['admin', 'hr'] },
        { name: 'Reportes y Nómina', href: '/dashboard/hr/reports', roles: ['admin', 'hr'] },
        { name: 'Admin Usuarios', href: '/dashboard/admin', roles: ['admin'] },
        { name: 'Gestión Turnos', href: '/dashboard/admin/shifts', roles: ['admin'] },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="font-bold text-xl text-indigo-600">Portal RRHH</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navItems.map((item) => {
                                    if (!item.roles.includes(user.role)) return null;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-4">Hola, {user.email}</span>
                            <button
                                onClick={logout}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                {children}
            </main>
        </div>
    );
}
