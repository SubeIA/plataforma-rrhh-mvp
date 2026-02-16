"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RequestsPage() {
    const { user, protectRoute, loading } = useAuth();
    const [requests, setRequests] = useState([]);

    // Form State
    const [type, setType] = useState("VACATION");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            // mode=my-requests ensures we get own requests even if we are HR
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/requests?mode=my-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    useEffect(() => {
        protectRoute();
        if (user) fetchRequests();
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type, startDate, endDate, reason })
            });
            if (!res.ok) throw new Error("Submission failed");

            alert("Solicitud enviada correctamente.");
            setStartDate("");
            setEndDate("");
            setReason("");
            fetchRequests();
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Error al enviar solicitud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Mis Solicitudes</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* New Request Form */}
                <div className="bg-white p-6 rounded-lg shadow h-fit">
                    <h2 className="text-xl font-semibold mb-4">Nueva Solicitud</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            >
                                <option value="VACATION">Vacaciones</option>
                                <option value="SICK">Licencia Médica</option>
                                <option value="PERMIT">Permiso Administrativo</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Desde</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hasta</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Motivo</label>
                            <textarea
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                rows={3}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                        </button>
                    </form>
                </div>

                {/* Requests List */}
                <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold">Historial</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay solicitudes registradas.</td>
                                </tr>
                            ) : (
                                requests.map((req: any) => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {req.type === 'VACATION' ? 'Vacaciones' :
                                                req.type === 'SICK' ? 'Licencia' : req.type}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {req.startDate} - {req.endDate}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {req.status === 'APPROVED' ? 'APROBADO' :
                                                    req.status === 'REJECTED' ? 'RECHAZADO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {req.reason}
                                            {req.response && <div className="text-xs text-gray-400 mt-1">Resp: {req.response}</div>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
