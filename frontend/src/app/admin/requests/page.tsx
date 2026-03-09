'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

type RequestType = "PERMISO_ADMINISTRATIVO" | "FERIADO_LEGAL" | "COMPENSATORIO" | "LICENCIA_MEDICA";
type RequestStatus = "PENDING" | "VISADO" | "APPROVED" | "REJECTED";
type TimeFormat = "DIA_COMPLETO" | "MEDIO_DIA_AM" | "MEDIO_DIA_PM";

interface OffRequest {
    id: string;
    userId: string;
    userName: string;
    type: RequestType;
    startDate: Timestamp;
    endDate: Timestamp;
    returnDate: Timestamp;
    timeFormat: TimeFormat;
    reason: string;
    status: RequestStatus;
    visadoBy?: string;
    approvedBy?: string;
    adminResponse?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export default function RequestsAdminPage() {
    const { user, token, role } = useAuth();
    const [requests, setRequests] = useState<OffRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("PENDING");
    const [responseModalOpen, setResponseModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<OffRequest | null>(null);
    const [adminResponse, setAdminResponse] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user && token && (role === "admin" || role === "jefatura")) {
            fetchRequests();
        }
    }, [user, token, role, statusFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/requests?status=${statusFilter !== "ALL" ? statusFilter : ""}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Error al obtener solicitudes");
            const data = await res.json();
            setRequests(data.requests || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, newStatus: RequestStatus) => {
        if (!selectedRequest) return;
        setProcessing(true);
        setError("");
        try {
            const res = await fetch(`/api/requests/${requestId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    response: adminResponse
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al actualizar estado");
            }

            setResponseModalOpen(false);
            setAdminResponse("");
            fetchRequests(); // Recargar datos
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp || !timestamp.seconds) return "-";
        return format(new Date(timestamp.seconds * 1000), "dd/MM/yyyy");
    };

    const getTypeLabel = (type: RequestType) => {
        const labels: Record<RequestType, string> = {
            PERMISO_ADMINISTRATIVO: "Permiso Administrativo",
            FERIADO_LEGAL: "Feriado Legal",
            COMPENSATORIO: "Día Compensatorio",
            LICENCIA_MEDICA: "Licencia Médica"
        };
        return labels[type] || type;
    };

    const getStatusStyles = (status: RequestStatus) => {
        switch (status) {
            case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
            case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
            case "VISADO": return "bg-blue-100 text-blue-800 border-blue-200";
            default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    if (loading && requests.length === 0) return <div className="p-8 text-center text-gray-500">Cargando solicitudes...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Solicitudes</h1>

            <div className="bg-white rounded-lg shadow mb-8 p-4">
                <div className="flex gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">Filtrar por Estado:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "ALL")}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="ALL">Todas</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="VISADO">Visadas (Requieren Aprobación)</option>
                        <option value="APPROVED">Aprobadas</option>
                        <option value="REJECTED">Rechazadas</option>
                    </select>
                </div>
            </div>

            {error && <div className="mb-4 bg-red-50 p-4 rounded-md text-red-700 text-sm">{error}</div>}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron solicitudes</td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {req.userName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getTypeLabel(req.type)}
                                        <div className="text-xs text-gray-400">{req.timeFormat.replace(/_/g, " ")}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Inicio: {formatDate(req.startDate)}</div>
                                        <div>Fin: {formatDate(req.endDate)}</div>
                                        <div className="text-indigo-600 font-medium text-xs mt-1">Reincorporación: {formatDate(req.returnDate)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusStyles(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {req.status === "PENDING" || req.status === "VISADO" ? (
                                            <button
                                                onClick={() => { setSelectedRequest(req); setResponseModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                Gestionar
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">Resuelta</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Gestión */}
            {responseModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Gestionar Solicitud</h3>

                        <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                            <p><strong>Empleado:</strong> {selectedRequest.userName}</p>
                            <p><strong>Tipo:</strong> {getTypeLabel(selectedRequest.type)} - {selectedRequest.timeFormat.replace(/_/g, " ")}</p>
                            <p><strong>Motivo:</strong> {selectedRequest.reason}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario / Respuesta (Opcional):</label>
                            <textarea
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                rows={3}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                placeholder="Indique el motivo del rechazo o notas de aprobación..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setResponseModalOpen(false); setAdminResponse(""); }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                disabled={processing}
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={() => handleAction(selectedRequest.id, "REJECTED")}
                                disabled={processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                Rechazar
                            </button>

                            {role === "jefatura" && selectedRequest.status === "PENDING" && (
                                <button
                                    onClick={() => handleAction(selectedRequest.id, "VISADO")}
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    Visar
                                </button>
                            )}

                            {role === "admin" && (
                                <button
                                    onClick={() => handleAction(selectedRequest.id, "APPROVED")}
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    Aprobar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
