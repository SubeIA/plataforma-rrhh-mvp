'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { Shield, Search, Eye, Clock, CheckCircle } from 'lucide-react';

interface KarinReport {
    id: string;
    reporter_id: string | null;
    accused_name: string;
    description: string;
    incident_date: string;
    status: 'Abierto' | 'En_Investigacion' | 'Cerrado';
    created_at: string;
}

interface UserRecord {
    uid: string;
    name: string;
    rut: string;
}

export default function AdminKarinPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const toast = useToast();
    const [reports, setReports] = useState<KarinReport[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [selectedReport, setSelectedReport] = useState<KarinReport | null>(null);

    useEffect(() => {
        protectRoute();
        if (!authLoading && user && user.role === 'admin') {
            fetchData();
        } else if (!authLoading && user && user.role !== 'admin') {
            setError('Acceso Denegado. Solo el Administrador de RRHH puede ver esta sección de cumplimiento legal.');
            setLoading(false);
        }
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportsRes, usersRes] = await Promise.all([
                apiFetch('/api/karin'),
                apiFetch('/api/users')
            ]);

            if (!reportsRes.ok) {
                const errData = await reportsRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al cargar denuncias');
            }
            if (!usersRes.ok) {
                const errData = await usersRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al cargar usuarios');
            }

            const reportsData = await reportsRes.json();
            setReports(Array.isArray(reportsData) ? reportsData : []);

            const usersData = await usersRes.json();
            const userList = usersData.users ?? usersData;
            setUsers(Array.isArray(userList) ? userList : []);
        } catch (err: any) {
            console.error('Error fetching Karin reports:', err);
            setError('Error de carga. Asegúrate de tener permisos de Admin o revisa tu red.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await apiFetch(`/api/karin/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Update local state
            setReports(reports.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
            if (selectedReport?.id === id) {
                setSelectedReport({ ...selectedReport, status: newStatus as any });
            }
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('No se pudo actualizar el estado de la denuncia.');
        }
    };

    const getReporterName = (uid: string | null) => {
        if (!uid) return 'Anónimo';
        const reporter = users.find(u => u.uid === uid);
        return reporter ? reporter.name : 'Usuario Desconocido';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Abierto': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'En_Investigacion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Cerrado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {error && (
                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                        <div className="flex">
                            <Shield className="h-5 w-5 text-red-400 mr-3" />
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Shield className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Bandeja de Denuncias (Ley Karin)
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gestión confidencial de incidentes y acoso laboral. La información visible aquí fue desenmascarada estrictamente por tu Rol de Administrador.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Denunciante
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Denunciado
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Fecha Reporte
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Estado
                                </th>
                                <th scope="col" className="relative px-6 py-3 text-right">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {getReporterName(report.reporter_id)}
                                            </div>
                                            {!report.reporter_id && (
                                                <div className="text-xs text-red-500 font-semibold mt-0.5">
                                                    Identidad Protegida
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {report.accused_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(report.created_at).toLocaleDateString('es-CL')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={report.status}
                                                onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                className={`text-xs px-2.5 py-1 font-semibold rounded-full border-0 focus:ring-0 cursor-pointer ${getStatusStyle(report.status)}`}
                                            >
                                                <option value="Abierto">Abierto</option>
                                                <option value="En_Investigacion">En Investigación</option>
                                                <option value="Cerrado">Cerrado</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Shield className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm">No hay denuncias de Ley Karin registradas.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for viewing report details */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedReport(null)} aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center" id="modal-title">
                                    <Shield className="h-5 w-5 text-indigo-500 mr-2" />
                                    Detalles de Denuncia
                                </h3>
                                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-500">
                                    <span className="sr-only">Cerrar</span>
                                    &times;
                                </button>
                            </div>
                            <div className="px-4 py-5 sm:p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Denunciante</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                                            {getReporterName(selectedReport.reporter_id)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Denunciado</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                                            {selectedReport.accused_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha del Incidente</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(selectedReport.incident_date).toLocaleDateString('es-CL')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Recepción</p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(selectedReport.created_at).toLocaleString('es-CL')}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Relato de los Hechos</p>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-sm text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                        {selectedReport.description}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado de la Investigación</p>
                                    <select
                                        value={selectedReport.status}
                                        onChange={(e) => handleStatusChange(selectedReport.id, e.target.value)}
                                        className={`mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:border-gray-600 ${getStatusStyle(selectedReport.status)}`}
                                    >
                                        <option value="Abierto">Abierto</option>
                                        <option value="En_Investigacion">En Investigación</option>
                                        <option value="Cerrado">Cerrado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setSelectedReport(null)}
                                >
                                    Cerrar Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
