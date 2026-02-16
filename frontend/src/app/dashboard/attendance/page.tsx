"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AttendancePage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

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
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleAttendance = async (type: 'IN' | 'OUT') => {
        setLoading(true);
        setMessage("");
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type }),
            });

            if (res.ok) {
                setMessage(type === 'IN' ? "Entrada registrada" : "Salida registrada");
                fetchHistory();
            } else {
                setMessage("Error al registrar");
            }
        } catch (error) {
            console.error(error);
            setMessage("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Control de Asistencia</h1>

            {user && <p className="mb-4">Hola, <span className="font-semibold">{user.email}</span></p>}

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => handleAttendance('IN')}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                    Marcar Entrada
                </button>
                <button
                    onClick={() => handleAttendance('OUT')}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                    Marcar Salida
                </button>
            </div>

            {message && <p className="text-center mb-4 font-medium">{message}</p>}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Historial Reciente</h2>
                <div className="space-y-3">
                    {history.map((record: any) => (
                        <div key={record.id} className="flex justify-between border-b pb-2">
                            <span className={record.type === 'IN' ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                {record.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                            </span>
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
