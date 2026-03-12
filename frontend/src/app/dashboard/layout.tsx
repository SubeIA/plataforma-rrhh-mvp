"use client";
import { useState, useEffect } from "react";
import { setCookie } from 'cookies-next';
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { SidebarContent } from '@/components/layout/SidebarContent';
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
    const { hasPermission } = usePermissions();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // SEC-01 FIX: Only write the cookie for SSR hydration purposes.
    // NEVER read it back for nav/permission logic — it's an unsigned client cookie.
    // The real source of truth for role is user?.role from AuthContext (loaded from Firestore).
    useEffect(() => {
        if (user?.role) {
            setCookie('lastKnownRole', user.role, { maxAge: 60 * 60 * 24 * 7 });
        }
    }, [user?.role]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const navItems = [
        // Empleado Options
        { name: 'Mi Asistencia', href: '/dashboard', icon: Clock, roles: ['admin', 'super_admin', 'user'] },
        { name: 'Solicitudes', href: '/dashboard/requests', icon: FileText, roles: ['admin', 'super_admin', 'user'] },
        { name: 'Licencias Médicas', href: '/dashboard/medical-licenses', icon: Stethoscope, roles: ['admin', 'super_admin', 'user'] },
        { name: 'Mis Documentos', href: '/dashboard/documents', icon: Folder, roles: ['admin', 'super_admin', 'user'] },
        { name: 'ITAM', href: '/dashboard/itam', icon: Cpu, roles: ['admin', 'super_admin', 'user'] },
        { name: 'Ley Karin', href: '/dashboard/karin', icon: ShieldAlert, roles: ['admin', 'super_admin', 'user'] },

        // HR Options (Visible primarily to Admins or anyone with the specific permission)
        { name: 'Gestión RRHH', href: '/dashboard/hr', icon: Users, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.VIEW_HR_PANEL] },
        { name: 'Bandeja Solicitudes', href: '/dashboard/hr/requests', icon: Inbox, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.APPROVE_REQUESTS] },
        { name: 'Licencias (RRHH)', href: '/dashboard/hr/medical-licenses', icon: Briefcase, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_MEDICAL_LICENSES] },
        { name: 'Reportes y Nómina', href: '/dashboard/hr/reports', icon: FileSpreadsheet, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.VIEW_ANALYTICS] },
        { name: 'Analíticas', href: '/dashboard/hr/analytics', icon: Cpu, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.VIEW_ANALYTICS] },
        { name: 'Documentos', href: '/dashboard/hr/documents', icon: Folder, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_DOCUMENTS] },
        { name: 'Gestión ITAM', href: '/dashboard/hr/itam', icon: Cpu, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_ITAM] },
        { name: 'Gestión Ley Karin', href: '/dashboard/hr/karin', icon: ShieldAlert, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_KARIN_REPORTS, PERMISSIONS.VIEW_KARIN_REPORTS] },

        // Admin Options
        { name: 'Admin Usuarios', href: '/dashboard/admin', icon: Settings, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_USERS] },
        { name: 'Gestión Turnos', href: '/dashboard/admin/shifts', icon: Calendar, roles: ['admin', 'super_admin'], permissions: [PERMISSIONS.MANAGE_SHIFTS] },
        { name: 'IA & Tokens', href: '/dashboard/admin/ai', icon: Cpu, roles: ['admin', 'super_admin'] },

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
                    {/* FE-01 FIX: Shared SidebarContent component — no more duplicated JSX */}
                    <SidebarContent
                        user={user}
                        loading={loading}
                        navItems={navItems}
                        hasPermission={hasPermission}
                        logout={logout}
                        onNavClick={() => setIsMobileMenuOpen(false)}
                    />
                </aside>
            </div>

            {/* Desktop Sidebar (Persistent) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white shadow-xl flex-shrink-0 z-20">
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-indigo-600">
                    <span className="font-bold text-xl text-white">Portal RRHH</span>
                </div>
                {/* FE-01 FIX: Shared SidebarContent component */}
                <SidebarContent
                    user={user}
                    loading={loading}
                    navItems={navItems}
                    hasPermission={hasPermission}
                    logout={logout}
                />
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
                        {/* FE-04 FIX: Human-readable breadcrumbs instead of raw URL segments */}
                        {(() => {
                            const routeLabels: Record<string, string> = {
                                dashboard: 'Inicio', attendance: 'Asistencia', requests: 'Mis Solicitudes',
                                'medical-licenses': 'Licencias Médicas', documents: 'Mis Documentos',
                                itam: 'ITAM', karin: 'Ley Karin', hr: 'Gestión RRHH',
                                reports: 'Reportes', analytics: 'Analíticas', admin: 'Administración',
                                shifts: 'Gestión Turnos', ai: 'IA & Tokens',
                                'super-admin': 'Super Admin', companies: 'Empresas'
                            };
                            const segments = pathname.split('/').filter(Boolean);
                            return segments.map(s => routeLabels[s] ?? s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Inicio';
                        })()}
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
