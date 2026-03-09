'use client';

import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';

export interface DocumentRecord {
    id: string;
    title: string;
    type: string;
    upload_date: string;
    status: string;
    user_id: string;
    original_name: string;
}

interface Props {
    documents: DocumentRecord[];
    getUserName: (uid: string) => string;
    onDownload: (docId: string) => void;
    onDelete: (docId: string) => void;
    isAdmin: boolean;
}

export default function DocumentsTable({ documents, getUserName, onDownload, onDelete, isAdmin }: Props) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            {['Documento', 'Colaborador', 'Tipo', 'Fecha Subida / Estado', 'Acciones'].map((col, i) => (
                                <th
                                    key={col}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 ${i === 4 ? 'text-right' : 'text-left'}`}
                                >
                                    {col}
                                </th>
                            ))}
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
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{doc.original_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{getUserName(doc.user_id)}</div>
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
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'SIGNED'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {doc.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => onDownload(doc.id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                title="Descargar"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => onDelete(doc.id)}
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
    );
}
