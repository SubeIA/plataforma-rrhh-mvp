'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { Monitor, Phone, Laptop, Key, Box, Plus, Search, CheckCircle } from 'lucide-react';

interface ITAMAsset {
    id: string;
    user_id: string;
    asset_type: 'Laptop' | 'Phone' | 'Monitor' | 'Software License' | 'Other';
    serial_id: string;
    model: string;
    status: 'Asignado' | 'Devuelto';
    assigned_at: string;
}

interface UserRecord {
    uid: string;
    name: string;
    rut: string;
}

export default function AdminITAMPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const toast = useToast();
    const [assets, setAssets] = useState<ITAMAsset[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState('');
    const [newType, setNewType] = useState('Laptop');
    const [newSerial, setNewSerial] = useState('');
    const [newModel, setNewModel] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        protectRoute();
        if (!authLoading && user && ['admin', 'hr', 'jefatura'].includes(user.role || '')) {
            fetchData();
        } else if (!authLoading && user) {
            setError('Acceso Denegado. Solo RRHH/TI puede gestionar activos.');
            setLoading(false);
        }
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsRes, usersRes] = await Promise.all([
                apiFetch('/api/itam'),
                apiFetch('/api/users')
            ]);

            if (!assetsRes.ok) {
                const errData = await assetsRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al cargar activos');
            }
            if (!usersRes.ok) {
                const errData = await usersRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al cargar usuarios');
            }

            const assetsData = await assetsRes.json();
            setAssets(Array.isArray(assetsData) ? assetsData : []);

            const usersData = await usersRes.json();
            const userList = usersData.users ?? usersData;
            setUsers(Array.isArray(userList) ? userList : []);
        } catch (err: any) {
            console.error('Error fetching ITAM:', err);
            setError('Error de conexión o permisos insuficientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                user_id: newUser,
                asset_type: newType,
                serial_id: newSerial,
                model: newModel,
                status: 'Asignado'
            };

            const res = await apiFetch('/api/itam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            // Refresh
            setShowForm(false);
            setNewUser('');
            setNewSerial('');
            setNewModel('');
            fetchData();

        } catch (err: any) {
            console.error('Error assigning asset:', err);
            toast.error(err.message || 'Error al asignar el activo.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await apiFetch(`/api/itam/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update');
            setAssets(assets.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        } catch (err) {
            toast.error('Error al actualizar estado.');
        }
    };

    const getUserName = (uid: string) => {
        const u = users.find(x => x.uid === uid);
        return u ? u.name : 'Usuario Desconocido';
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Laptop': return <Laptop className="w-5 h-5 text-gray-400" />;
            case 'Phone': return <Phone className="w-5 h-5 text-gray-400" />;
            case 'Monitor': return <Monitor className="w-5 h-5 text-gray-400" />;
            case 'Software License': return <Key className="w-5 h-5 text-gray-400" />;
            default: return <Box className="w-5 h-5 text-gray-400" />;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !['admin', 'hr', 'jefatura'].includes(user.role || '')) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Monitor className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Gestión de Activos (ITAM)
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Asigna, revisa y gestiona el equipamiento y hardware de los colaboradores.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none sm:w-auto"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Asignar Nuevo Activo
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            {showForm && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Formulario de Asignación Física / Virtual</h3>
                    <form onSubmit={handleAssign} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Colaborador</label>
                            <select
                                required
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Selecciona un empleado</option>
                                {users.map(u => (
                                    <option key={u.uid} value={u.uid}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Activo</label>
                            <select
                                required
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="Laptop">Laptop / Notebook</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Phone">Teléfono Móvil</option>
                                <option value="Software License">Licencia de Software</option>
                                <option value="Other">Otro Periférico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo / Descripción</label>
                            <input
                                required
                                type="text"
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                placeholder="Ej: MacBook Pro M2"
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Id. de Serie / IMEI</label>
                            <input
                                required
                                type="text"
                                value={newSerial}
                                onChange={(e) => setNewSerial(e.target.value)}
                                placeholder="Ej: C02DW2...."
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                            >
                                {submitting ? 'Asignando...' : 'Asignar Activo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of assets */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Activo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Colaborador Asignado
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    S/N o Identificador
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Fecha Asignación
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {assets.length > 0 ? (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                                    {getIcon(asset.asset_type)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {asset.model}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {asset.asset_type}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {getUserName(asset.user_id)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                {asset.serial_id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(asset.assigned_at).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={asset.status}
                                                onChange={(e) => handleStatusUpdate(asset.id, e.target.value)}
                                                className={`text-xs px-2.5 py-1 font-semibold rounded-full border-0 focus:ring-0 cursor-pointer ${asset.status === 'Asignado'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}
                                            >
                                                <option value="Asignado">Asignado</option>
                                                <option value="Devuelto">Devuelto</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Box className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm">No hay activos tecnológicos registrados.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
