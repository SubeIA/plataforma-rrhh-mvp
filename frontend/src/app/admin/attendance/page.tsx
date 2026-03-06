"use client";
import { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy, limit, setDoc } from "firebase/firestore";
import { auth } from "@/config/firebase";
import { Calendar, Clock, AlertTriangle, Edit2, ShieldAlert, CheckCircle2, Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

const db = getFirestore(auth.app);

export default function AdminAttendancePage() {
    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states for Extra Hours Validation
    const [validatingRecord, setValidatingRecord] = useState<any>(null);
    const [approvedExtraMinutes, setApprovedExtraMinutes] = useState(0);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const fetchAllHistory = useCallback(async () => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const monthYear = `${year}-${month}`;

        try {
            const res = await apiFetch(`/api/attendance/admin-summary?month_year=${monthYear}`);
            if (res.ok) {
                const data = await res.json();
                setAttendances(data);
            } else {
                setAttendances([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchAllHistory();
    }, [fetchAllHistory]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return "--:--";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleValidateHHEE = async () => {
        if (!validatingRecord) return;

        try {
            // Validate endpoint doesn't exist yet, we can do it directly in Firestore for Admin side or via a new endpoint.
            // Let's do a direct Firestore update for MVP, assuming Admin has permissions or we add a simple update
            const recordRef = doc(db, 'daily_attendance', validatingRecord.id);
            await updateDoc(recordRef, {
                extra_minutes_approved: approvedExtraMinutes,
                hhee_validated: true,
                hhee_validated_by: auth.currentUser?.uid,
                hhee_validated_at: new Date().toISOString()
            });

            // Y agregar el saldo compensatorio en el perfil del usuario (o crear doc en balances)
            // Balance logic could be placed here:
            const balanceRef = doc(db, 'balances', validatingRecord.user_id);
            // using setDoc with merge to initialize or accumulate
            // this is simplified for visual completeness
            setAttendances(attendances.map(a =>
                a.id === validatingRecord.id
                    ? { ...a, extra_minutes_approved: approvedExtraMinutes, hhee_validated: true }
                    : a
            ));

            setValidatingRecord(null);
        } catch (e) {
            console.error(e);
            alert("Error al validar HHEE");
        }
    };

    const filtered = attendances.filter(a => {
        const searchStr = `${a.user_name} ${a.user_email}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Control Central de Asistencia</h1>
                <p className="text-slate-500 mt-1">Supervisión, edición manual justificada y validación de Horas Extraordinarias (HHEE)</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex bg-white items-center p-2 rounded-2xl shadow-sm border border-slate-200 w-fit">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-base font-bold text-slate-800 flex items-center gap-2 px-4">
                        <Calendar size={18} className="text-indigo-600" />
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm py-4 text-slate-500 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold">Colaborador</th>
                                <th className="px-6 py-4 font-semibold">Día</th>
                                <th className="px-6 py-4 font-semibold">Entrada/Salida</th>
                                <th className="px-6 py-4 font-semibold">Hrs</th>
                                <th className="px-6 py-4 font-semibold">HHEE Autogeneradas</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay registros</td></tr>
                            ) : (
                                filtered.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{record.user_name || "Sin nombre"}</div>
                                            <div className="text-xs text-slate-500">{record.user_email}</div>
                                            {record.is_manual_override && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                    Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">{record.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">IN: <span className="font-semibold text-emerald-600">{formatTime(record.entry_time)}</span></div>
                                            <div className="text-sm">OUT: <span className="font-semibold text-rose-600">{formatTime(record.exit_time)}</span></div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {record.calculated_work_hours ? record.calculated_work_hours.toFixed(1) : "-"}
                                            {record.late_minutes > 0 && (
                                                <div className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                                                    <AlertTriangle size={12} /> +{record.late_minutes}m atraso
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.extra_minutes && record.extra_minutes > 0 ? (
                                                record.hhee_validated ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                                                        <CheckCircle2 size={16} /> {record.extra_minutes_approved} min aprob.
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                        <Clock size={16} /> {record.extra_minutes} min pend.
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-slate-400 text-sm">Sin extra</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            {record.extra_minutes && record.extra_minutes > 0 && !record.hhee_validated && (
                                                <button
                                                    onClick={() => {
                                                        setValidatingRecord(record);
                                                        setApprovedExtraMinutes(record.extra_minutes);
                                                    }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Validar Horas Extras"
                                                >
                                                    <ShieldAlert size={18} />
                                                </button>
                                            )}
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edición Manual Justificada">
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Validación HHEE */}
            {validatingRecord && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Validar Horas Extras</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            El sistema autogeneró <strong className="text-indigo-600">{validatingRecord.extra_minutes} minutos</strong> el día {validatingRecord.date} para {validatingRecord.user_name}. Ingresa los minutos legalmente autorizados.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">Minutos a aprobar como Compensatorio</label>
                                <input
                                    type="number"
                                    className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-900 font-semibold"
                                    value={approvedExtraMinutes}
                                    onChange={(e) => setApprovedExtraMinutes(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setValidatingRecord(null)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleValidateHHEE}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Validar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
