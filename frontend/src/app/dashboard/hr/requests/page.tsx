"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";

export default function HRRequestsPage() {
    const { user, protectRoute, loading } = useAuth();
    const { hasPermission } = usePermissions();
    const toast = useToast();
    const [requests, setRequests] = useState<Record<string, any>[]>([]);

    const fetchRequests = async () => {
        try {
            const res = await apiFetch('/api/requests');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("Error fetching requests:", err);
                toast.error("Error al cargar solicitudes. Intenta recargar.");
                return;
            }
            const data = await res.json();
            const list = data.requests ?? data;
            setRequests(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Error de conexión al cargar solicitudes.");
        }
    };

    useEffect(() => {
        protectRoute();
        if (user && hasPermission('approve_requests')) {
            fetchRequests();
        }
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleUpdateStatus = async (id: number, status: string) => {
        const response = prompt(status === 'APPROVED' ? "Observación (Opcional):" : "Motivo del rechazo:");
        if (response === null) return;

        try {
            const res = await apiFetch(`/api/requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, response })
            });
            if (!res.ok) throw new Error("Update failed");
            fetchRequests();
        } catch (error) {
            console.error("Error updating request:", error);
            toast.error("Error al actualizar solicitud.");
        }
    };

    if (loading) return <p className="p-8">Cargando...</p>;
    if (!user || !hasPermission('approve_requests')) {
        return <p className="p-8 text-red-600">No tienes permisos.</p>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Gestión de Solicitudes</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay solicitudes pendientes.</td>
                            </tr>
                        ) : (
                            requests.map((req: any) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{req.fullName || req.email}</div>
                                        <div className="text-xs text-gray-500">{req.department}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {req.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {req.startDate} <br /><span className="text-xs">a</span> {req.endDate}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>
                                        {req.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                                    className="text-green-600 hover:text-green-900 font-bold"
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}
                                        {req.status !== 'PENDING' && (
                                            <span className="text-gray-400 text-xs">{req.response}</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
