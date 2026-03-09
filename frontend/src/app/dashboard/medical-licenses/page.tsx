"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileHeart, Clock, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';

interface MedicalLicense {
    id: string; // Folio
    userId: string;
    status: 'RECEPCIONADA' | 'TRAMITADA';
    startDate: string | any;
    durationDays: number;
    createdAt: string;
}

export default function EmployeeMedicalLicensesPage() {
    const { token, user } = useAuth();
    const [licenses, setLicenses] = useState<MedicalLicense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/medical-licenses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setLicenses(data);
            } else {
                setError(data.error || 'Error fetching licenses');
            }
        } catch (err: any) {
            setError('Error al cargar datos. Intente nuevamente.');
            console.error(err);
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileHeart className="text-red-500" />
                    Mis Licencias Médicas
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Historial de licencias médicas electrónicas recepcionadas por el empleador (IMED/Medipass).
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Aviso UI */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-xl mb-6 flex gap-3">
                <Info className="text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                    Recuerda que las licencias médicas electrónicas llegan automáticamente a la bandeja del administrador de RRHH. No necesitas ingresarlas como solicitud desde acá. Si tienes una licencia física, por favor entrégala directamente a tu jefatura o RRHH.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p>Cargando tus licencias...</p>
                    </div>
                ) : licenses.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <FileHeart className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Sin historial</h3>
                        <p className="text-gray-500 mt-1">No hay registro de licencias médicas asociadas a tu RUT.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {licenses.map((lic) => (
                            <li key={lic.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-red-50 rounded-lg">
                                            <FileHeart className="text-red-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                Folio: <span className="font-mono bg-gray-100 px-2 rounded">{lic.id}</span>
                                            </h4>
                                            <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <strong>Desde:</strong> {formatDate(lic.startDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <strong>Duración:</strong> {lic.durationDays} días
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Recepcionada el {formatDate(lic.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="self-start sm:self-center">
                                        {lic.status === 'RECEPCIONADA' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                <Clock size={14} /> En revisión RRHH
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle size={14} /> Tramitada a Compin/Isapre
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
