"use client";
// FE-01 FIX: Extracted shared sidebar body (user card + nav) into a single component.
// Previously duplicated verbatim between mobile drawer and desktop sidebar (~150 lines).
// Now a single source of truth — changes in one place affect both sidebars.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserCircle, LogOut } from 'lucide-react';
import type { Permission } from '@/constants/permissions';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    roles: string[];
    permissions?: string[];
}

interface SidebarContentProps {
    user: { email?: string | null; role?: string | null } | null;
    loading: boolean;
    navItems: NavItem[];
    hasPermission: (permission: Permission) => boolean;
    logout: () => void;
    onNavClick?: () => void;
}

export function SidebarContent({
    user,
    loading,
    navItems,
    hasPermission,
    logout,
    onNavClick
}: SidebarContentProps) {
    const pathname = usePathname();

    const effectiveRole = user?.role ?? 'user';
    const visibleItems = navItems.filter(item => {
        if (item.roles.includes(effectiveRole)) return true;
        if (item.permissions && item.permissions.some(p => hasPermission(p as Permission))) return true;
        return false;
    });

    // Find the single best active match: longest href prefix of current pathname
    const bestMatch = visibleItems.reduce<string | null>((best, item) => {
        const matches = pathname === item.href || pathname.startsWith(item.href + '/');
        if (!matches) return best;
        if (best === null || item.href.length > best.length) return item.href;
        return best;
    }, null);

    return (
        <>
            {/* User card */}
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
                                    <span className="text-sm font-semibold text-gray-900 truncate" title={user?.email || ''}>
                                        {user?.email}
                                    </span>
                                    <span className="text-xs text-indigo-600 font-bold uppercase">{user?.role}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="px-3 space-y-1">
                    {visibleItems.map((item) => {
                        const isActive = item.href === bestMatch;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavClick}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                            >
                                <item.icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                                        isActive ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-600'
                                    }`}
                                />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Logout button */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                >
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </div>
        </>
    );
}
