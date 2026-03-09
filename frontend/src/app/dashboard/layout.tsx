"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { ChatWidget } from '@/components/chat/ChatWidget';
import {
    Clock,
    FileText,
    Stethoscope,
    Folder,
    Users,
    Inbox,
    FileSpreadsheet,
    ShieldAlert,
    Settings,
    Cpu,
    Calendar,
    Briefcase,
    Menu,
    X,
    LogOut,
    UserCircle,
    Building2
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Read role synchronously from sessionStorage so items appear on first render (no flash)
    const [lastKnownRole, setLastKnownRole] = useState<string>(
        () => (typeof window !== 'undefined' ? sessionStorage.getItem('lastKnownRole') || 'user' : 'user')
    );

    useEffect(() => {
        if (user?.role) {
            setLastKnownRole(user.role);
        }
    }, [user?.role]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const navItems = [
        // Empleado Options
        { name: 'Mi Asistencia', href: '/dashboard', icon: Clock, roles: ['admin', 'hr', 'jefatura', 'user'] },
        { name: 'Solicitudes', href: '/dashboard/requests', icon: FileText, roles: ['admin', 'hr', 'jefatura', 'user'] },
        { name: 'Licencias Médicas', href: '/dashboard/medical-licenses', icon: Stethoscope, roles: ['admin', 'hr', 'jefatura', 'user'] },
        { name: 'Mis Documentos', href: '/dashboard/documents', icon: Folder, roles: ['admin', 'hr', 'jefatura', 'user'] },
        { name: 'ITAM', href: '/dashboard/itam', icon: Cpu, roles: ['admin', 'hr', 'jefatura', 'user'] },
        { name: 'Ley Karin', href: '/dashboard/karin', icon: ShieldAlert, roles: ['admin', 'hr', 'jefatura', 'user'] },

        // HR Options
        { name: 'Gestión RRHH', href: '/dashboard/hr', icon: Users, roles: ['admin', 'hr'] },
        { name: 'Bandeja Solicitudes', href: '/dashboard/hr/requests', icon: Inbox, roles: ['admin', 'hr', 'jefatura'] },
        { name: 'Licencias (RRHH)', href: '/dashboard/hr/medical-licenses', icon: Briefcase, roles: ['admin', 'hr'] },
        { name: 'Reportes y Nómina', href: '/dashboard/hr/reports', icon: FileSpreadsheet, roles: ['admin', 'hr'] },
        { name: 'Analíticas', href: '/dashboard/hr/analytics', icon: Cpu, roles: ['admin', 'hr'] },
        { name: 'Documentos', href: '/dashboard/hr/documents', icon: Folder, roles: ['admin', 'hr'] },
        { name: 'Gestión ITAM', href: '/dashboard/hr/itam', icon: Cpu, roles: ['admin', 'hr'] },
        { name: 'Gestión Ley Karin', href: '/dashboard/hr/karin', icon: ShieldAlert, roles: ['admin', 'hr'] },

        // Admin Options
        { name: 'Admin Usuarios', href: '/dashboard/admin', icon: Settings, roles: ['admin'] },
        { name: 'Gestión Turnos', href: '/dashboard/admin/shifts', icon: Calendar, roles: ['admin'] },
        { name: 'IA & Tokens', href: '/dashboard/admin/ai', icon: Cpu, roles: ['admin'] },

        // Super Admin Options
        { name: 'Empresas', href: '/dashboard/super-admin/companies', icon: Building2, roles: ['super_admin'] },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay & Drawer */}
            <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className={`fixed inset-0 bg-gray-900/50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer */}
                <aside
                    className={`fixed top-0 bottom-0 left-0 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-indigo-600">
                        <span className="font-bold text-xl text-white">Portal RRHH</span>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-white hover:text-gray-200"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                        <div className="px-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <UserCircle className="text-indigo-600 h-10 w-10" />
                                <div className="flex flex-col overflow-hidden">
                                    {loading && !user ? (
                                        <>
                                            <div className="h-3 w-32 bg-indigo-100 rounded animate-pulse mb-1" />
                                            <div className="h-2 w-10 bg-indigo-200 rounded animate-pulse" />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-semibold text-gray-900 truncate" title={user?.email || ''}>{user?.email}</span>
                                            <span className="text-xs text-indigo-600 font-bold uppercase">{user?.role}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <nav className="px-3 space-y-1">
                            {(() => {
                                const effectiveRole = lastKnownRole;
                                const visibleItems = navItems.filter(item => item.roles.includes(effectiveRole));
                                // Find the single best match: longest href that is a prefix of pathname
                                const bestMatch = visibleItems.reduce<string | null>((best, item) => {
                                    const matches = pathname === item.href || pathname.startsWith(item.href + '/');
                                    if (!matches) return best;
                                    if (best === null || item.href.length > best.length) return item.href;
                                    return best;
                                }, null);
                                return visibleItems.map((item) => {
                                    const isActive = item.href === bestMatch;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                                }`}
                                        >
                                            <item.icon
                                                className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-600'
                                                    }`}
                                            />
                                            <span className="truncate">{item.name}</span>
                                        </Link>
                                    );
                                });
                            })()}
                        </nav>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                            Cerrar Sesión
                        </button>
                    </div>
                </aside>
            </div>

            {/* Desktop Sidebar (Persistent) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white shadow-xl flex-shrink-0 z-20">
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-indigo-600">
                    <span className="font-bold text-xl text-white">Portal RRHH</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <div className="px-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <UserCircle className="text-indigo-600 h-10 w-10" />
                            <div className="flex flex-col overflow-hidden">
                                {loading && !user ? (
                                    <>
                                        <div className="h-3 w-32 bg-indigo-100 rounded animate-pulse mb-1" />
                                        <div className="h-2 w-10 bg-indigo-200 rounded animate-pulse" />
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold text-gray-900 truncate" title={user?.email || ''}>{user?.email}</span>
                                        <span className="text-xs text-indigo-600 font-bold uppercase">{user?.role}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <nav className="px-3 space-y-1">
                        {(() => {
                            const effectiveRole = lastKnownRole;
                            const visibleItems = navItems.filter(item => item.roles.includes(effectiveRole));
                            // Find the single best match: longest href that is a prefix of pathname
                            const bestMatch = visibleItems.reduce<string | null>((best, item) => {
                                const matches = pathname === item.href || pathname.startsWith(item.href + '/');
                                if (!matches) return best;
                                if (best === null || item.href.length > best.length) return item.href;
                                return best;
                            }, null);
                            return visibleItems.map((item) => {
                                const isActive = item.href === bestMatch;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-600'
                                                }`}
                                        />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                );
                            });
                        })()}
                    </nav>
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white shadow-sm lg:hidden relative z-30">
                    <div className="px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none"
                            >
                                <Menu size={24} />
                            </button>
                            <span className="font-bold text-lg text-indigo-600 truncate">Portal RRHH</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationsPanel />
                        </div>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 h-16 items-center justify-between px-8 sticky top-0 z-30">
                    <div className="text-gray-500 text-sm font-medium">
                        {pathname.split('/').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') || 'Inicio'}
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationsPanel />
                    </div>
                </header>

                <main className="flex-1 overflow-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Chatbot Widget */}
            <ChatWidget />
        </div>
    );
}
