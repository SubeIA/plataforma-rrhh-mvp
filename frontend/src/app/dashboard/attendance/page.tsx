"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface DailyRecord {
    id: string;
    date: string;
    entry_time?: string;
    exit_time?: string;
    calculated_work_hours?: number;
    late_minutes?: number;
    extra_minutes?: number;
    is_manual_override?: boolean;
}

export default function AttendanceDashboardPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [history, setHistory] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // Filtro mensual
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        protectRoute();
    }, [user, authLoading, protectRoute]);

    const fetchHistory = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setMessage("");

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const monthYear = `${year}-${month}`;

        try {
            const res = await apiFetch(`/api/attendance/summary?month_year=${monthYear}`);

            if (!res.ok) {
                if (res.status === 401) {
                    setMessage("Sesión expirada. Por favor, vuelve a iniciar sesión.");
                } else {
                    setMessage("Error al obtener el historial de asistencia.");
                }
                setHistory([]);
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error(error);
            setMessage("Error de conexión al obtener el historial.");
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user, currentDate]);

    useEffect(() => {
        if (user && !authLoading) {
            fetchHistory();
        }
    }, [user, authLoading, fetchHistory]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return "--:--";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    if (authLoading) {
        return <div className="p-8 flex justify-center"><div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Mis Marcas Históricas</h1>
                <p className="text-slate-500 mt-1">Revisa tu asistencia mensual, atrasos y horas calculadas.</p>
            </div>

            {/* Selector de Mes */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600" disabled={currentDate >= new Date()}>
                    <ChevronRight size={24} className={currentDate >= new Date() ? "opacity-30" : ""} />
                </button>
            </div>

            {message && (
                <div className="p-4 mb-6 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-medium">
                    {message}
                </div>
            )}

            {/* Tabla de Asistencia */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm py-4 text-slate-500">
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Entrada</th>
                                <th className="px-6 py-4 font-semibold">Salida</th>
                                <th className="px-6 py-4 font-semibold">Horas Trabajadas</th>
                                <th className="px-6 py-4 font-semibold">Atraso</th>
                                <th className="px-6 py-4 font-semibold">HHEE (min)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex justify-center mb-2">
                                            <div className="h-6 w-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                        </div>
                                        <span className="text-slate-500">Cargando registros...</span>
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No hay registros de asistencia en este mes.
                                    </td>
                                </tr>
                            ) : (
                                history.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {record.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.entry_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-emerald-500" />
                                                    <span className="font-medium">{formatTime(record.entry_time)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">--:--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.exit_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-rose-500" />
                                                    <span className="font-medium">{formatTime(record.exit_time)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">En curso</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            {record.calculated_work_hours !== undefined ? `${record.calculated_work_hours.toFixed(1)} hrs` : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.late_minutes && record.late_minutes > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    <AlertTriangle size={14} />
                                                    {record.late_minutes} min
                                                </span>
                                            ) : record.exit_time ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                                                    <CheckCircle2 size={16} /> A tiempo
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.extra_minutes && record.extra_minutes > 0 ? (
                                                <span className="font-bold text-indigo-600">+{record.extra_minutes}</span>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 text-sm text-slate-500 bg-slate-100 p-4 rounded-xl">
                <p className="font-semibold text-slate-700 mb-1">Sobre el cálculo de Asistencia:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>La ventana de flexibilidad de entrada es de 08:00 a 10:00. Las marcas previas a las 08:00 se contabilizan desde esa hora.</li>
                    <li>Los atrasos se contabilizan luego de los 15 minutos (es decir, después de las 10:15).</li>
                    <li>El sistema aplica automáticamente un descuento de colación de 1 hora al total trabajado del día.</li>
                </ul>
            </div>
        </div>
    );
}
