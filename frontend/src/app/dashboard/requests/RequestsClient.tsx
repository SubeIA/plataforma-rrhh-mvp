"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { FileText, Calendar, Clock, Send, AlertCircle, CheckCircle2, ChevronRight, XCircle } from "lucide-react";

// Helper para manejar tanto ISO strings como Firestore Timestamps {_seconds, _nanoseconds}
function safeDate(value: string | { _seconds: number; _nanoseconds: number } | unknown): Date {
    if (value && typeof value === 'object' && '_seconds' in (value as object)) {
        return new Date((value as { _seconds: number })._seconds * 1000);
    }
    return new Date(value as string);
}

type RequestType = 'PERMISO_ADMINISTRATIVO' | 'FERIADO_LEGAL' | 'COMPENSATORIO' | 'LICENCIA_MEDICA';
type TimeFormat = 'DIA_COMPLETO' | 'MEDIO_DIA_AM' | 'MEDIO_DIA_PM';

interface RequestItem {
    id: string;
    type: RequestType;
    startDate: string;
    endDate: string;
    timeFormat?: TimeFormat;
    reason?: string;
    status: 'PENDING' | 'VISADO' | 'APPROVED' | 'REJECTED';
    response?: string;
    createdAt: string;
}

export default function RequestsClient() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [type, setType] = useState<RequestType>('PERMISO_ADMINISTRATIVO');
    const [timeFormat, setTimeFormat] = useState<TimeFormat>('DIA_COMPLETO');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/requests?mode=my-requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : (data.requests ?? []));
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        protectRoute();
        if (user && !authLoading) {
            fetchRequests();
        }
    }, [user, authLoading, protectRoute, fetchRequests]);

    // Lógica autocompletado fecha fin si es medio día o un solo día
    useEffect(() => {
        if (timeFormat !== 'DIA_COMPLETO' && startDate) {
            setEndDate(startDate);
        }
    }, [timeFormat, startDate]);

    // Cálculo fecha de reincorporación (solo cliente, sin SSR)
    const getReincorporationDate = () => {
        if (!endDate) return "Seleccione fecha de fin";
        const d = new Date(endDate + 'T12:00:00');
        if (timeFormat === 'DIA_COMPLETO' || timeFormat === 'MEDIO_DIA_PM') {
            d.setDate(d.getDate() + 1);
            if (d.getDay() === 6) d.setDate(d.getDate() + 2);
            if (d.getDay() === 0) d.setDate(d.getDate() + 1);
            return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (timeFormat === 'MEDIO_DIA_AM') {
            return `Mismo día (${new Date(startDate + 'T12:00:00').toLocaleDateString('es-CL')}) en la tarde (14:00 hrs)`;
        }
        return "-";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (new Date(startDate) > new Date(endDate)) {
            setMessage({ type: 'error', text: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, timeFormat, startDate, endDate, reason })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al enviar la solicitud");
            }

            setMessage({ type: 'success', text: 'Solicitud enviada exitosamente para revisión de su Jefatura.' });
            setStartDate("");
            setEndDate("");
            setReason("");
            setTimeFormat("DIA_COMPLETO");
            fetchRequests();
        } catch (error: any) {
            console.error("Error submitting request:", error);
            setMessage({ type: 'error', text: error.message || 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 size={14} /> Aprobado Legal</span>;
            case 'VISADO': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><CheckCircle2 size={14} /> Visado Jefatura</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700"><XCircle size={14} /> Rechazado</span>;
            case 'PENDING': default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock size={14} /> Por Visar</span>;
        }
    };

    const getTypeLabel = (t: string) => t.replace(/_/g, ' ');

    if (authLoading || !user) {
        return <div className="p-8 flex justify-center"><div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Solicitudes y Permisos</h1>
                <p className="text-slate-500 mt-1">Ingresa tus ausencias legales y verifica su estado de aprobación.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Nueva Solicitud</h2>
                        </div>

                        {message.text && (
                            <div className={`p-4 mb-6 rounded-xl text-sm font-medium flex items-start gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                                <p>{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Clasificación</label>
                                <select
                                    value={type}
                                    onChange={(e) => {
                                        setType(e.target.value as RequestType);
                                        if (e.target.value === 'LICENCIA_MEDICA') setTimeFormat('DIA_COMPLETO');
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors"
                                >
                                    <option value="PERMISO_ADMINISTRATIVO">Permiso Administrativo (Con goce)</option>
                                    <option value="FERIADO_LEGAL">Feriado Legal (Vacaciones)</option>
                                    <option value="COMPENSATORIO">Día/Horas Compensatorias</option>
                                    <option value="LICENCIA_MEDICA">Licencia Médica</option>
                                </select>
                            </div>

                            {type !== 'LICENCIA_MEDICA' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Modalidad</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['DIA_COMPLETO', 'MEDIO_DIA_AM', 'MEDIO_DIA_PM'] as TimeFormat[]).map((fmt) => (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setTimeFormat(fmt)}
                                                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${timeFormat === fmt ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                            >
                                                {fmt === 'DIA_COMPLETO' ? 'Día Entero' : fmt === 'MEDIO_DIA_AM' ? 'Medio AM' : 'Medio PM'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Desde</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Calendar size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Hasta</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Calendar size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            disabled={timeFormat !== 'DIA_COMPLETO'}
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-start gap-3">
                                <ChevronRight size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block text-xs font-bold text-indigo-800 uppercase tracking-wide">Reincorporación Estimada</span>
                                    <span className="text-sm font-medium text-indigo-900 capitalize">{getReincorporationDate()}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Motivo / Observaciones</label>
                                <textarea
                                    required={type !== 'FERIADO_LEGAL'}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={type === 'FERIADO_LEGAL' ? "Opcional para vacaciones..." : "Explica brevemente tu solicitud..."}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors resize-none h-24"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !startDate || !endDate}
                                className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-bold rounded-xl text-sm px-5 py-3.5 text-center flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                            >
                                {isSubmitting ? "Enviando Solicitud..." : (
                                    <>Enviar a Jefatura <Send size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Historial Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Mi Historial Documental</h2>
                            <span className="text-sm font-medium text-slate-500">{requests.length} Registros</span>
                        </div>

                        <div className="p-0">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500 fill-indigo-600">
                                    <div className="mx-auto h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                    Cargando historial...
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="font-medium text-lg text-slate-600">No hay solicitudes emitidas</p>
                                    <p className="text-sm">Tus futuros permisos aparecerán aquí con su estado de aprobación.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {requests.map((req) => (
                                        <li key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-base text-slate-900 capitalize flex items-center gap-2">
                                                            {getTypeLabel(req.type)}
                                                            {req.timeFormat && req.timeFormat !== 'DIA_COMPLETO' && (
                                                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                                                    {req.timeFormat === 'MEDIO_DIA_AM' ? 'AM' : 'PM'}
                                                                </span>
                                                            )}
                                                        </h3>
                                                        {getStatusBadge(req.status)}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                                        <span className="flex items-center gap-1.5 font-medium"><Calendar size={14} /> {req.startDate} {req.endDate !== req.startDate ? `al ${req.endDate}` : ''}</span>
                                                        <span className="flex items-center gap-1.5"><Clock size={14} /> Emitido el {safeDate(req.createdAt).toLocaleDateString('es-CL', {})}</span>
                                                    </div>

                                                    {(req.reason || req.response) && (
                                                        <div className="bg-slate-50 rounded-xl p-4 text-sm mt-3 border border-slate-100">
                                                            {req.reason && (
                                                                <p className="text-slate-700"><span className="font-semibold text-slate-900">Motivo:</span> {req.reason}</p>
                                                            )}
                                                            {req.response && (
                                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                                    <p className="text-indigo-800"><span className="font-bold">Respuesta RRHH/Jefatura:</span> {req.response}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
