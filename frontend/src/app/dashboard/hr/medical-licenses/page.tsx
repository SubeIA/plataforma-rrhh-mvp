"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { FileHeart, Search, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MedicalLicense {
    id: string; // Folio
    userId: string;
    status: 'RECEPCIONADA' | 'TRAMITADA';
    startDate: string | any; // Timestamp or string
    durationDays: number;
    createdAt: string;
    createdBy: string;
    userName?: string; // We'll populate this locally for the table
}

export default function HRMedicalLicensesPage() {
    const { token, role } = useAuth();
    const toast = useToast();
    const [licenses, setLicenses] = useState<MedicalLicense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [usersMap, setUsersMap] = useState<Record<string, any>>({});

    // Receipt Modal state
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptForm, setReceiptForm] = useState({
        folio: '',
        userId: '',
        startDate: '',
        durationDays: 1
    });

    const [allUsers, setAllUsers] = useState<any[]>([]); // For the select dropdown

    useEffect(() => {
        if (role !== 'admin') return;
        fetchData();
    }, [role]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users first to map names
            const usersRes = await apiFetch('/api/users');
            const usersData = await usersRes.json();

            const map: Record<string, string> = {};
            const userList = usersData.users ?? usersData;
            if (Array.isArray(userList)) {
                setAllUsers(userList);
                userList.forEach((u: any) => { map[u.id] = u.name; });
            }
            setUsersMap(map);

            // Fetch medical licenses
            const licRes = await apiFetch('/api/medical-licenses');
            const licData = await licRes.json();

            if (Array.isArray(licData)) {
                // Attach user names
                const withNames = licData.map(l => ({
                    ...l,
                    userName: map[l.userId] || 'Usuario Desconocido'
                }));
                setLicenses(withNames);
            }
        } catch (err: any) {
            setError('Error al cargar datos. Intente nuevamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReceiptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiFetch('/api/medical-licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folio: receiptForm.folio,
                    userId: receiptForm.userId,
                    startDate: receiptForm.startDate,
                    durationDays: Number(receiptForm.durationDays)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al recepcionar licencia');
            }

            setIsReceiptModalOpen(false);
            setReceiptForm({ folio: '', userId: '', startDate: '', durationDays: 1 });
            fetchData(); // Refresh table
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateStatus = async (folio: string, newStatus: string) => {
        if (!window.confirm(`¿Seguro de marcar la licencia ${folio} como ${newStatus}?`)) return;

        try {
            const response = await apiFetch(`/api/medical-licenses/${folio}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar estado');
            }

            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return '-';
        let d = dateObj;
        if (dateObj._seconds) d = new Date(dateObj._seconds * 1000);
        else if (typeof dateObj === 'string') d = new Date(dateObj);

        try {
            return format(d, 'dd MMM yyyy', { locale: es });
        } catch (e) {
            return String(dateObj);
        }
    };

    if (role !== 'admin') {
        return <div className="p-8 text-center text-red-600">No tienes permisos para ver esta página.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileHeart className="text-red-500" />
                        Recepción de Licencias Médicas
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Bandeja de entrada (IMED / Link-out) y Tramitación a COMPIN/Isapre.
                    </p>
                </div>

                <button
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <PlusCircle size={18} />
                    <span>Recepcionar Manual</span>
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="border-b border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Folio o RUT..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p>Cargando licencias...</p>
                    </div>
                ) : licenses.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <FileHeart className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay licencias</h3>
                        <p className="text-gray-500 mt-1">No se han recepcionado licencias electrónicas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio y Duración</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {licenses.map((lic) => (
                                    <tr key={lic.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-gray-900">{lic.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{lic.userName}</div>
                                            <div className="text-xs text-gray-500">Recepcionada: {formatDate(lic.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Desde: {formatDate(lic.startDate)}</div>
                                            <div className="text-sm text-gray-500">{lic.durationDays} días</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lic.status === 'RECEPCIONADA' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                    <Clock size={12} /> Recepcionada
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    <CheckCircle size={12} /> Tramitada
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {lic.status === 'RECEPCIONADA' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(lic.id, 'TRAMITADA')}
                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                >
                                                    Marcar Tramitada
                                                </button>
                                            )}
                                            {lic.status === 'TRAMITADA' && (
                                                <span className="text-gray-400">Sin acciones</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal para Recepción Manual */}
            {isReceiptModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Ingresar Licencia (Manual)</h3>
                            <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleReceiptSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                                    <select
                                        required
                                        value={receiptForm.userId}
                                        onChange={(e) => setReceiptForm({ ...receiptForm, userId: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                    >
                                        <option value="">Seleccione trabajador...</option>
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.rut || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Folio Licencia</label>
                                    <input
                                        type="text"
                                        required
                                        value={receiptForm.folio}
                                        onChange={(e) => setReceiptForm({ ...receiptForm, folio: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border font-mono"
                                        placeholder="Ej: 83948572A"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            required
                                            value={receiptForm.startDate}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, startDate: e.target.value })}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Días (Duración)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="90"
                                            required
                                            value={receiptForm.durationDays}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, durationDays: Number(e.target.value) })}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsReceiptModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                                >
                                    Guardar Licencia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
