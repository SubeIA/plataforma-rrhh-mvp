'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Building2, Plus, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Company {
    id: string;
    name: string;
    rut?: string;
    plan: string;
    adminEmail: string;
    active: boolean;
    createdAt: string;
}

export default function SuperAdminCompaniesPage() {
    const { role, token } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        rut: '',
        plan: 'starter',
        adminEmail: '',
        adminPassword: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (role !== 'super_admin') return;
        loadCompanies();
    }, [role]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/companies');
            if (!res.ok) throw new Error((await res.json()).message || 'Error cargando empresas');
            const data = await res.json();
            setCompanies(data);
        } catch (e: any) {
            setMessage({ type: 'error', text: 'Error cargando empresas: ' + e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setMessage(null);
        try {
            const res = await apiFetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Error creando empresa');
            }
            const result = await res.json();
            setMessage({ type: 'success', text: `✅ Empresa "${result.companyName}" creada. ID: ${result.companyId}` });
            setForm({ name: '', rut: '', plan: 'starter', adminEmail: '', adminPassword: '' });
            setShowForm(false);
            loadCompanies();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setCreating(false);
        }
    };

    if (role !== 'super_admin') {
        return (
            <div className="p-8 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Acceso Denegado</h2>
                <p className="text-gray-500 mt-2">Esta sección es solo para super administradores del sistema.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
                        <p className="text-sm text-gray-500">Panel exclusivo para el administrador del sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setMessage(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Empresa
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {showForm && (
                <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-5">Crear Nueva Empresa</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa *</label>
                            <input
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Acme Corporation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RUT Empresa</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.rut}
                                onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
                                placeholder="76.000.000-0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.plan}
                                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                            >
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Admin *</label>
                            <input
                                required
                                type="email"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.adminEmail}
                                onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                                placeholder="admin@empresa.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Admin (mín. 8 caracteres) *</label>
                            <input
                                required
                                type="password"
                                minLength={8}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={form.adminPassword}
                                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {creating ? 'Creando...' : 'Crear Empresa'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de empresas */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Empresas registradas ({companies.length})</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Cargando empresas...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No hay empresas registradas aún.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {companies.map(company => (
                            <div key={company.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{company.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${company.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {company.active ? 'Activa' : 'Inactiva'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">{company.plan}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            {company.rut && <span className="text-xs text-gray-500">RUT: {company.rut}</span>}
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {company.adminEmail}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</p>
                                    <p className="text-xs text-gray-400">{isMounted ? new Date(company.createdAt).toLocaleDateString('es-CL', {}) : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
