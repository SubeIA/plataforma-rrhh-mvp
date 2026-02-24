"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Clock, MapPin, CheckCircle2, History as HistoryIcon, LogIn, LogOut } from "lucide-react";

export default function DashboardPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [geoError, setGeoError] = useState("");

    useEffect(() => {
        protectRoute();
    }, [user, authLoading]);

    const fetchHistory = async () => {
        try {
            const res = await apiFetch('/api/attendance/history');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setHistory(data);
                } else {
                    console.warn("History data is not an array:", data);
                    setHistory([]);
                }
            } else {
                setHistory([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchHistory();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setGeoError("");
                },
                (error) => {
                    console.error("Geo Error:", error);
                    setGeoError("No se pudo obtener ubicación. Por favor, activa el GPS.");
                }
            );
        } else {
            setGeoError("Geolocalización no soportada.");
        }
    }, []);

    const handleAttendance = async (type: 'IN' | 'OUT') => {
        setLoading(true);
        setMessage("");

        const body: any = { type };
        if (location) {
            body.lat = location.lat;
            body.lng = location.lng;
            body.accuracy = location.accuracy;
        }

        try {
            const res = await apiFetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(type === 'IN' ? "✅ Entrada registrada con éxito" : "✅ Salida registrada con éxito");
                fetchHistory();
            } else {
                setMessage(`❌ Error: ${data.error || 'No se pudo registrar'}`);
            }
        } catch (error) {
            console.error(error);
            setMessage("❌ Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Mi Asistencia</h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <Clock size={16} />
                        Bienvenido de vuelta, <span className="font-semibold text-indigo-600 underline decoration-indigo-200">{user?.email}</span>
                    </p>
                </div>
            </div>

            {/* GPS Status Component */}
            <div className={`mb-8 p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${location ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                <div className={`p-3 rounded-full ${location ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <MapPin size={24} className={location ? 'text-emerald-600' : 'text-amber-600'} />
                </div>
                <div>
                    <p className="font-bold text-lg">Estado de Ubicación</p>
                    {location ? (
                        <p className="text-sm opacity-90">
                            GPS Detectado: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (±{Math.round(location.accuracy)}m)
                        </p>
                    ) : (
                        <p className="text-sm opacity-90">{geoError || "Detectando ubicación precisa..."}</p>
                    )}
                </div>
                {location && <CheckCircle2 className="ml-auto text-emerald-500" size={20} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <button
                    onClick={() => handleAttendance('IN')}
                    disabled={loading || !location}
                    className="premium-button group flex items-center justify-center gap-3 bg-indigo-600 text-white p-6 rounded-2xl font-bold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogIn className="group-hover:translate-x-1 transition-transform" />
                    Marcar Entrada
                </button>
                <button
                    onClick={() => handleAttendance('OUT')}
                    disabled={loading || !location}
                    className="premium-button group flex items-center justify-center gap-3 bg-white text-gray-900 border border-gray-200 p-6 rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut className="text-rose-500 group-hover:-translate-x-1 transition-transform" />
                    Marcar Salida
                </button>
            </div>

            {!location && !loading && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-center text-sm font-medium animate-pulse">
                    ⚠️ Esperando señal de GPS para habilitar el registro...
                </div>
            )}

            {message && (
                <div className={`mb-10 p-4 rounded-xl text-center font-semibold animate-in ${message.includes('❌') ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {message}
                </div>
            )}

            <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <HistoryIcon className="text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historial Reciente</h2>
                </div>
                <div className="space-y-4">
                    {history.map((record: any) => (
                        <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-white transition-colors border border-transparent hover:border-indigo-100 group">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-10 rounded-full ${record.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <div>
                                    <span className={`text-lg font-bold block ${record.type === 'IN' ? "text-emerald-700" : "text-rose-700"}`}>
                                        {record.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <MapPin size={12} /> {record.lat?.toFixed(4)}, {record.lng?.toFixed(4)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-gray-700">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-xs text-gray-400">{new Date(record.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-center py-10">
                            <HistoryIcon size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-500 italic">Aún no hay marcas registradas para hoy.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
