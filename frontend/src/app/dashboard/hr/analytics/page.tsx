'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { apiFetch } from '@/lib/api';
import { Users, AlertTriangle, Activity, Clock, FileWarning, TrendingUp } from 'lucide-react';

interface KPIs {
    totalUsers: number;
    absenteeismRate: string;
    latenessCount: number;
    medicalLicensesCount: number;
    compensatoryHoursConsumed: number;
    turnoverRate: string;
}

export default function AnalyticsDashboardPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const { hasPermission } = usePermissions();
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        protectRoute();
        const hasAccess = user && (['super_admin', 'admin'].includes(user.role || '') || hasPermission(PERMISSIONS.VIEW_ANALYTICS));
        if (!authLoading && hasAccess) {
            fetchKPIs();
        } else if (!authLoading && user) {
            setError('No tienes permisos para acceder a esta vista.');
            setLoading(false);
        }
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/analytics/kpis');
            if (!res.ok) throw new Error('Error al cargar métricas');
            const data = await res.json();
            setKpis(data);
        } catch (err: any) {
            console.error('Error fetching KPIs:', err);
            setError('Error al cargar la información analítica. Revisa tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    const hasAccess = user && (['super_admin', 'admin'].includes(user.role || '') || hasPermission(PERMISSIONS.VIEW_ANALYTICS));
    if (!hasAccess) return null;

    const statCards = [
        { name: 'Colaboradores Activos', stat: kpis?.totalUsers || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { name: 'Tasa de Ausentismo', stat: `${kpis?.absenteeismRate || 0}%`, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { name: 'Atrasos (Mes Actual)', stat: kpis?.latenessCount || 0, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
        { name: 'Licencias Médicas (Mes Actual)', stat: kpis?.medicalLicensesCount || 0, icon: Activity, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
        { name: 'Hrs Compensatorias Consumidas', stat: kpis?.compensatoryHoursConsumed || 0, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        { name: 'Rotación', stat: `${kpis?.turnoverRate || 0}%`, icon: FileWarning, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Métricas y KPIs clave basados en el comportamiento y asistencia de los colaboradores.
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={fetchKPIs}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Actualizar Métrica
                    </button>
                    {/* Placeholder for future export functionality */}
                    <button
                        title="Exportar Reporte detallado (.csv)"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={true}
                    >
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="mx-auto max-w-7xl">
                <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {statCards.map((item) => (
                        <div
                            key={item.name}
                            className="relative overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-12 shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:px-6 sm:pt-6 dark:bg-gray-800 dark:border dark:border-gray-700"
                        >
                            <dt>
                                <div className={`absolute rounded-xl ${item.bg} p-3`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                </div>
                                <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</p>
                            </dt>
                            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                                <p className="text-3xl font-semibold text-gray-900 dark:text-white">{item.stat}</p>
                                <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-4 sm:px-6">
                                    <div className="text-sm">
                                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            Ver detalles<span className="sr-only"> de {item.name}</span>
                                        </a>
                                    </div>
                                </div>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Extended Analytics (e.g. Activity timelines) can go here in the future */}

        </div>
    );
}
