'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Monitor, Phone, Laptop, Key, Box, CheckCircle } from 'lucide-react';

interface ITAMAsset {
    id: string;
    user_id: string;
    asset_type: 'Laptop' | 'Phone' | 'Monitor' | 'Software License' | 'Other';
    serial_id: string;
    model: string;
    status: 'Asignado' | 'Devuelto';
    assigned_at: string;
}

export default function MyITAMPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [assets, setAssets] = useState<ITAMAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        protectRoute();
        if (!authLoading && user) {
            fetchMyAssets();
        }
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchMyAssets = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/itam/me');
            if (!res.ok) throw new Error('Error al cargar activos assignados');
            setAssets(await res.json());
        } catch (err: any) {
            console.error(err);
            setError('No pudimos recuperar tus equipos. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Laptop': return <Laptop className="w-6 h-6 text-indigo-500" />;
            case 'Phone': return <Phone className="w-6 h-6 text-indigo-500" />;
            case 'Monitor': return <Monitor className="w-6 h-6 text-indigo-500" />;
            case 'Software License': return <Key className="w-6 h-6 text-indigo-500" />;
            default: return <Box className="w-6 h-6 text-indigo-500" />;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Monitor className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Mis Equipos e Inventario
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Visualiza los dispositivos y licencias asignados temporalmente para tu uso laboral.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {assets.filter(a => a.status === 'Asignado').map((asset) => (
                    <div key={asset.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-md p-3">
                                    {getIcon(asset.asset_type)}
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                            {asset.asset_type}
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {asset.model}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-500 dark:text-gray-400 flex flex-col space-y-1 w-full">
                                    <span className="flex justify-between">
                                        <span>S/N:</span>
                                        <span className="font-mono text-gray-900 dark:text-gray-200">{asset.serial_id}</span>
                                    </span>
                                    <span className="flex justify-between">
                                        <span>Entregado:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{new Date(asset.assigned_at).toLocaleDateString('es-CL')}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {assets.filter(a => a.status === 'Asignado').length === 0 && !error && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                        <CheckCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">No tienes equipos asignados</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Si crees que esto es un error, contacta a Soporte IT.</p>
                    </div>
                )}
            </div>

            {/* Histórico */}
            {assets.filter(a => a.status === 'Devuelto').length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Equipos Devueltos</h2>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        {assets.filter(a => a.status === 'Devuelto').map(asset => (
                            <li key={asset.id} className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    {getIcon(asset.asset_type)}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.model}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">S/N: {asset.serial_id}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Entregado el: {new Date(asset.assigned_at).toLocaleDateString('es-CL')}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
