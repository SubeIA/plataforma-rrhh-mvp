'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { FileText, Download, Plus, Search, Trash2, X, UploadCloud } from 'lucide-react';

interface DocumentRecord {
    id: string;
    title: string;
    type: string;
    upload_date: string;
    status: string;
    user_id: string;
    original_name: string;
}

interface UserRecord {
    uid: string;
    name: string;
    rut: string;
}

export default function HRDocumentsPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filterUser, setFilterUser] = useState<string>('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Upload Form State
    const [uploadUserId, setUploadUserId] = useState('');
    const [uploadType, setUploadType] = useState('Liquidacion');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        protectRoute();
        if (!authLoading && user && ['Admin', 'Jefatura'].includes(user.role || '')) {
            fetchData();
        } else if (!authLoading && user) {
            setError('No tienes permisos para acceder a esta vista.');
            setLoading(false);
        }
    }, [user, authLoading, filterUser]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        try {
            setLoading(true);

            // Parallel fetch users and documents
            const [docsRes, usersRes] = await Promise.all([
                apiFetch(`/api/documents${filterUser ? `?user_id=${filterUser}` : ''}`),
                apiFetch('/api/users')
            ]);

            if (!docsRes.ok || !usersRes.ok) throw new Error('Error fetching data');

            setDocuments(await docsRes.json());
            setUsers(await usersRes.json());
        } catch (err: any) {
            console.error('Error fetching HR documents data:', err);
            setError('Error al cargar la información. Revisa tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (docId: string) => {
        try {
            const res = await apiFetch(`/api/documents/${docId}/download`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.downloadUrl, '_blank');
        } catch (err: any) {
            console.error('Error generating download URL:', err);
            alert('No se pudo descargar el documento.');
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const res = await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error deleting doc');
            }
            alert('Documento eliminado exitosamente.');
            fetchData();
        } catch (err: any) {
            console.error('Error deleting document:', err);
            alert(err.response?.data?.error || 'No se pudo eliminar el documento.');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!uploadUserId || !uploadType || !uploadTitle || !uploadFile) {
            return alert('Por favor, completa todos los campos y adjunta un archivo.');
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('user_id', uploadUserId);
            formData.append('type', uploadType);
            formData.append('title', uploadTitle);
            formData.append('file', uploadFile);

            // Fetch natively since axios might have issues with FormData depending on setup, but api.post works usually too.
            // Using native fetch for multipart/form-data to let browser set boundary automatically.
            const token = localStorage.getItem('token');
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al subir documento');
            }

            alert('Documento subido con éxito.');
            setIsUploadModalOpen(false);

            // Reset form
            setUploadUserId('');
            setUploadTitle('');
            setUploadFile(null);

            fetchData();
        } catch (err: any) {
            console.error('Upload error:', err);
            alert(err.message || 'Error interno al subir documento.');
        } finally {
            setUploading(false);
        }
    };

    const getUserName = (uid: string) => {
        const u = users.find(u => u.uid === uid);
        return u ? u.name : 'Usuario Desconocido';
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !['Admin', 'Jefatura'].includes(user.role || '')) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestor Documental</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Sube y administra documentos (Contratos, Liquidaciones) para los colaboradores.
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Subir Documento
                </button>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filtrar por Colaborador
                </label>
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2"
                    >
                        <option value="">Todos los colaboradores</option>
                        {users.map(u => (
                            <option key={u.uid} value={u.uid}>{u.name} ({u.rut})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Documento
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Colaborador
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Tipo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Fecha Subida / Estado
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
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {doc.original_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {getUserName(doc.user_id)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                {doc.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('es-CL') : 'N/A'}
                                            </div>
                                            <div className="mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'SIGNED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                    {doc.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleDownload(doc.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    title="Descargar"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </button>
                                                {user.role === 'Admin' && (
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
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
                                            <p className="text-sm font-medium">No hay documentos subidos en esta vista.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !uploading && setIsUploadModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleUpload}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 sm:mx-0 sm:h-10 sm:w-10">
                                            <UploadCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                                Cargar Nuevo Documento
                                            </h3>

                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Colaborador Asignado <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        id="user"
                                                        required
                                                        value={uploadUserId}
                                                        onChange={(e) => setUploadUserId(e.target.value)}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        <option value="" disabled>Selecciona un empleado</option>
                                                        {users.map((u) => (
                                                            <option key={u.uid} value={u.uid}>{u.name} ({u.rut})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Tipo de Documento <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        id="type"
                                                        required
                                                        value={uploadType}
                                                        onChange={(e) => setUploadType(e.target.value)}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        <option value="Liquidacion">Liquidación de Sueldo</option>
                                                        <option value="Contrato">Contrato de Trabajo</option>
                                                        <option value="Anexo">Anexo de Contrato</option>
                                                        <option value="Comprobante">Comprobante / Otro</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Título / Descripción <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="title"
                                                        required
                                                        value={uploadTitle}
                                                        onChange={(e) => setUploadTitle(e.target.value)}
                                                        placeholder="E.g. Liquidación Marzo 2026"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Archivo PDF <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="file"
                                                        required
                                                        accept="application/pdf,image/*"
                                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-md file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-indigo-50 file:text-indigo-700
                                                        hover:file:bg-indigo-100
                                                        dark:file:bg-indigo-900/50 dark:file:text-indigo-300"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Máx. 10MB.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {uploading ? 'Subiendo...' : 'Subir Documento'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
