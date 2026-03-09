'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { UserRecord } from './UploadModal';

interface Props {
    users: UserRecord[];
    filterUser: string;
    onChange: (uid: string) => void;
}

export default function DocumentFilters({ users, filterUser, onChange }: Props) {
    return (
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
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2"
                >
                    <option value="">Todos los colaboradores</option>
                    {users.map((u) => (
                        <option key={u.uid} value={u.uid}>{u.name} ({u.rut})</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
