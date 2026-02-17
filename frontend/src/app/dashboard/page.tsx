"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [geoError, setGeoError] = useState("");

    useEffect(() => {
        protectRoute();
    }, [user, authLoading]);

    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attendance/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchHistory();
        // Request Geo on load
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
                    setGeoError("No se pudo obtener ubicación. Asegúrate de permitir el acceso.");
                }
            );
        } else {
            setGeoError("Geolocalización no soportada en este navegador.");
        }
    }, []);

    const handleAttendance = async (type: 'IN' | 'OUT') => {
        setLoading(true);
        setMessage("");
        const token = localStorage.getItem('token');

        const body: any = { type };
        if (location) {
            body.lat = location.lat;
            body.lng = location.lng;
            body.accuracy = location.accuracy;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(type === 'IN' ? "Entrada registrada" : "Salida registrada");
                fetchHistory();
            } else {
                setMessage(`Error: ${data.error || 'Al registrar'}`);
            }
        } catch (error) {
            console.error(error);
            setMessage("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <p className="p-8">Cargando...</p>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Mi Asistencia</h1>

            {user && <p className="mb-4">Hola, <span className="font-semibold">{user.email}</span></p>}

            {/* Geo Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-100 text-sm">
                <p className="font-semibold">Estado GPS:</p>
                {location ? (
                    <p className="text-green-700">
                        Ubicación detectada (Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}, Precisión: {Math.round(location.accuracy)}m)
                    </p>
                ) : (
                    <p className="text-yellow-700">
                        {geoError || "Obteniendo ubicación..."}
                    </p>
                )}
            </div>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => handleAttendance('IN')}
                    disabled={loading} // removed !location check to allow testing/fallback
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Marcar Entrada
                </button>
                <button
                    onClick={() => handleAttendance('OUT')}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Marcar Salida
                </button>
            </div>

            {message && <p className={`text-center mb-4 font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Historial Reciente</h2>
                <div className="space-y-3">
                    {history.map((record: any) => (
                        <div key={record.id} className="flex justify-between border-b pb-2">
                            <div>
                                <span className={record.type === 'IN' ? "text-green-600 font-bold block" : "text-red-600 font-bold block"}>
                                    {record.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                </span>
                                {record.lat && (
                                    <span className="text-xs text-gray-400">
                                        GPS: {record.lat.toFixed(4)}, {record.lng.toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-600">
                                {new Date(record.timestamp).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-gray-500 text-center">No hay registros recientes.</p>}
                </div>
            </div>
        </div>
    );
}
