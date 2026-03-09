'use client';

import React from 'react';
import { UploadCloud } from 'lucide-react';

export interface UserRecord {
    uid: string;
    name: string;
    rut: string;
}

interface Props {
    isOpen: boolean;
    uploading: boolean;
    users: UserRecord[];
    uploadUserId: string;
    uploadType: string;
    uploadTitle: string;
    onUserChange: (val: string) => void;
    onTypeChange: (val: string) => void;
    onTitleChange: (val: string) => void;
    onFileChange: (file: File | null) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const DOCUMENT_TYPES = [
    { value: 'Liquidacion', label: 'Liquidación de Sueldo' },
    { value: 'Contrato', label: 'Contrato de Trabajo' },
    { value: 'Anexo', label: 'Anexo de Contrato' },
    { value: 'Comprobante', label: 'Comprobante / Otro' },
];

const inputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white";
const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function UploadModal({
    isOpen, uploading, users,
    uploadUserId, uploadType, uploadTitle,
    onUserChange, onTypeChange, onTitleChange, onFileChange,
    onSubmit, onClose,
}: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={() => !uploading && onClose()}
                />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={onSubmit}>
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
                                        {/* Colaborador */}
                                        <div>
                                            <label htmlFor="upload-user" className={labelClass}>
                                                Colaborador Asignado <span className="text-red-500">*</span>
                                            </label>
                                            <select id="upload-user" required value={uploadUserId} onChange={(e) => onUserChange(e.target.value)} className={selectClass}>
                                                <option value="" disabled>Selecciona un empleado</option>
                                                {users.map((u) => (
                                                    <option key={u.uid} value={u.uid}>{u.name} ({u.rut})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Tipo */}
                                        <div>
                                            <label htmlFor="upload-type" className={labelClass}>
                                                Tipo de Documento <span className="text-red-500">*</span>
                                            </label>
                                            <select id="upload-type" required value={uploadType} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
                                                {DOCUMENT_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Título */}
                                        <div>
                                            <label htmlFor="upload-title" className={labelClass}>
                                                Título / Descripción <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text" id="upload-title" required
                                                value={uploadTitle}
                                                onChange={(e) => onTitleChange(e.target.value)}
                                                placeholder="E.g. Liquidación Marzo 2026"
                                                className={inputClass}
                                            />
                                        </div>

                                        {/* Archivo */}
                                        <div>
                                            <label htmlFor="upload-file" className={labelClass}>
                                                Archivo PDF <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="file" id="upload-file" required
                                                accept="application/pdf,image/*"
                                                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                                                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300"
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Máx. 10MB.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit" disabled={uploading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {uploading ? 'Subiendo...' : 'Subir Documento'}
                            </button>
                            <button
                                type="button" disabled={uploading}
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
