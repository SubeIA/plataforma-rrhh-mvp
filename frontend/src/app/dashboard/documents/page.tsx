"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

export default function MyDocumentsPage() {
    const { user, protectRoute, loading } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [loadingDocs, setLoadingDocs] = useState(false);

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        setError("");
        try {
            const res = await apiFetch('/api/documents/my-documents');
            if (!res.ok) {
                if (res.status === 401) {
                    setError("Sesión expirada. Por favor, vuelva a iniciar sesión.");
                } else {
                    setError("Error al obtener los documentos.");
                }
                setDocuments([]);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setDocuments(data);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
            setError("Error de conexión al obtener documentos.");
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        protectRoute();
        if (user) fetchDocuments();
    }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSign = async (docId: number) => {
        if (!confirm("¿Desea firmar digitalmente este documento?")) return;
        try {
            const res = await apiFetch(`/api/documents/${docId}/sign`, { method: 'POST' });
            if (!res.ok) throw new Error("Signing failed");
            alert("Documento firmado exitosamente.");
            fetchDocuments();
        } catch (error) {
            console.error("Error signing document:", error);
            alert("Error al firmar documento.");
        }
    };

    if (loading || loadingDocs) return <p className="p-8">Cargando...</p>;
    if (!user) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Mis Documentos</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Envío</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Firma</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No tienes documentos asignados.</td>
                            </tr>
                        ) : (
                            documents.map((doc: any) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                        <div className="text-sm text-blue-600 underline cursor-pointer" onClick={() => window.open(doc.url, '_blank')}>Ver Documento</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'SIGNED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {doc.status === 'SIGNED' ? 'FIRMADO' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.signedAt ? new Date(doc.signedAt).toLocaleString() : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {doc.status !== 'SIGNED' && (
                                            <button
                                                onClick={() => handleSign(doc.id)}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold border border-indigo-600 px-3 py-1 rounded"
                                            >
                                                Firmar
                                            </button>
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
