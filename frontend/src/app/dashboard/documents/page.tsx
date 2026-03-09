"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { FileText, Download, FileSignature, Clock } from 'lucide-react';

interface DocumentRecord {
    id: string;
    title: string;
    type: string;
    upload_date: string;
    status: string; // PENDING, SIGNED, etc.
}

export default function MyDocumentsPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const toast = useToast();
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        protectRoute();
        if (!authLoading && user) {
            fetchDocuments();
        }
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/documents');
            if (!res.ok) throw new Error('Error al cargar documentos');
            const data = await res.json();
            setDocuments(data);
        } catch (err: any) {
            console.error('Error fetching documents:', err);
            setError('No se pudieron cargar tus documentos. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (docId: string) => {
        try {
            const res = await apiFetch(`/api/documents/${docId}/download`);
            if (!res.ok) throw new Error('No se generó URL de descarga');
            const data = await res.json();
            window.open(data.downloadUrl, '_blank');
        } catch (err: any) {
            console.error('Error generating download URL:', err);
            toast.error('No se pudo descargar el documento.');
        }
    };

    const handleSign = async (docId: string) => {
        if (!window.confirm('¿Estás seguro de firmar electrónicamente este documento? Esto tiene validez legal.')) {
            return;
        }

        try {
            const res = await apiFetch(`/api/documents/${docId}/sign`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Fallo de firma');
            }
            toast.success('Documento firmado con éxito.');
            fetchDocuments(); // refresh list
        } catch (err: any) {
            console.error('Error signing document:', err);
            toast.error(err.message || 'No se pudo firmar el documento.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Documentos</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Visualiza y descarga tus contratos, anexos y liquidaciones de sueldo.
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Documento
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Tipo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Fecha Subida
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Estado (Firma)
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {doc.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                {doc.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('es-CL') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {doc.status === 'SIGNED' ? (
                                                <span className="inline-flex items-center text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                                                    <FileSignature className="w-3.5 h-3.5 mr-1" />
                                                    Firmado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    Pendiente Firma
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleDownload(doc.id)}
                                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                >
                                                    <Download className="h-4 w-4 mr-1.5" />
                                                    Ver / Descargar
                                                </button>
                                                {doc.status !== 'SIGNED' && (
                                                    <button
                                                        onClick={() => handleSign(doc.id)}
                                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                    >
                                                        <FileSignature className="h-4 w-4 mr-1.5" />
                                                        Firmar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
                                            <p className="text-sm font-medium">No tienes documentos en tu repositorio.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
