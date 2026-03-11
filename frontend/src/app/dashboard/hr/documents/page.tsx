'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/context/ToastContext';
import { apiFetch } from '@/lib/api';
import { Plus } from 'lucide-react';

import DocumentsTable, { DocumentRecord } from './components/DocumentsTable';
import DocumentFilters from './components/DocumentFilters';
import UploadModal, { UserRecord } from './components/UploadModal';

export default function HRDocumentsPage() {
    const { user, protectRoute, loading: authLoading } = useAuth();
    const { hasPermission } = usePermissions();
    const toast = useToast();

    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [filterUser, setFilterUser] = useState('');

    // Upload modal state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadUserId, setUploadUserId] = useState('');
    const [uploadType, setUploadType] = useState('Liquidacion');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        protectRoute();
        if (!authLoading && user && hasPermission('manage_documents')) {
            fetchData();
        } else if (!authLoading && user) {
            setError('No tienes permisos para acceder a esta vista.');
            setLoading(false);
        }
    }, [user, authLoading, filterUser]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docsRes, usersRes] = await Promise.all([
                apiFetch(`/api/documents${filterUser ? `?user_id=${filterUser}` : ''}`),
                apiFetch('/api/users'),
            ]);
            if (!docsRes.ok || !usersRes.ok) throw new Error('Error fetching data');
            setDocuments(await docsRes.json());
            const usersData = await usersRes.json();
            setUsers(usersData.users ?? usersData);
        } catch (err: any) {
            console.error('Error fetching HR documents data:', err);
            setError('Error al cargar la información. Revisa tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleDownload = async (docId: string) => {
        try {
            const res = await apiFetch(`/api/documents/${docId}/download`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.downloadUrl, '_blank');
        } catch (err: any) {
            console.error('Error generating download URL:', err);
            toast.error('No se pudo descargar el documento.');
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) return;
        try {
            const res = await apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error deleting doc');
            }
            toast.success('Documento eliminado exitosamente.');
            fetchData();
        } catch (err: any) {
            console.error('Error deleting document:', err);
            toast.error(err.response?.data?.error || 'No se pudo eliminar el documento.');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadUserId || !uploadType || !uploadTitle || !uploadFile) {
            toast.warning('Por favor, completa todos los campos y adjunta un archivo.');
            return;
        }
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('user_id', uploadUserId);
            formData.append('type', uploadType);
            formData.append('title', uploadTitle);
            formData.append('file', uploadFile);

            // Use native fetch for multipart/form-data so the browser sets the boundary
            const token = localStorage.getItem('token');
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al subir documento');

            toast.success('Documento subido con éxito.');
            setIsUploadModalOpen(false);
            setUploadUserId('');
            setUploadTitle('');
            setUploadFile(null);
            fetchData();
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || 'Error interno al subir documento.');
        } finally {
            setUploading(false);
        }
    };

    const getUserName = (uid: string) => {
        const u = users.find((u) => u.uid === uid);
        return u ? u.name : 'Usuario Desconocido';
    };

    // ─── Render guards ────────────────────────────────────────────────────────

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (!user || !hasPermission('manage_documents')) return null;

    // ─── View ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
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

            {/* Error banner */}
            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Filter */}
            <DocumentFilters users={users} filterUser={filterUser} onChange={setFilterUser} />

            {/* Table */}
            <DocumentsTable
                documents={documents}
                getUserName={getUserName}
                onDownload={handleDownload}
                onDelete={handleDelete}
                isAdmin={user.role === 'admin' || user.role === 'super_admin'}
            />

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                uploading={uploading}
                users={users}
                uploadUserId={uploadUserId}
                uploadType={uploadType}
                uploadTitle={uploadTitle}
                onUserChange={setUploadUserId}
                onTypeChange={setUploadType}
                onTitleChange={setUploadTitle}
                onFileChange={setUploadFile}
                onSubmit={handleUpload}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div>
    );
}
