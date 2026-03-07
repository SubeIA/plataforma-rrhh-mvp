"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Bot, Activity, BrainCircuit, Shield, AlertTriangle, Search, BarChart3, Users } from "lucide-react";

export default function AITokensPage() {
    const { user, protectRoute, loading } = useAuth();
    const [usageStats, setUsageStats] = useState<any[]>([]);
    const [globalStats, setGlobalStats] = useState({ totalTokens: 0, totalCalls: 0, costEstimate: 0 });
    const [fetchError, setFetchError] = useState("");
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fetchTokenUsage = async () => {
        setIsLoadingData(true);
        try {
            const res = await apiFetch('/api/ai/token-usage');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            if (data && Array.isArray(data.stats)) {
                setUsageStats(data.stats);

                // Calculate global stats
                let totalTokens = 0;
                let totalCalls = 0;

                data.stats.forEach((stat: any) => {
                    totalTokens += stat.totalTokens || 0;
                    totalCalls += stat.callCount || 0;
                });

                // Rough estimate: $0.0015 per 1k tokens combined avg
                setGlobalStats({
                    totalTokens,
                    totalCalls,
                    costEstimate: (totalTokens / 1000) * 0.0015
                });
            } else {
                setUsageStats([]);
            }
        } catch (error) {
            console.error("Error fetching AI token usage:", error);
            setFetchError("No se pudieron cargar los datos de uso de IA. Verifique su sesión.");
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        protectRoute();
        if (user && user?.role === 'admin') {
            fetchTokenUsage();
        }
    }, [user, loading]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!user || user?.role !== 'admin') {
        if (!loading && user) return (
            <div className="p-8 max-w-lg mx-auto mt-20 glass-card rounded-2xl text-center border-rose-100">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-rose-700">Acceso Restringido</h1>
                <p className="text-gray-600 mt-2">No tienes permisos de administrador para ver esta sección.</p>
            </div>
        );
        return null;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Bot className="text-indigo-600" />
                        IA & Monitoreo de Tokens
                    </h1>
                    <p className="text-gray-500 mt-2">Supervisa el uso de modelos de IA, consumo de tokens y establece límites.</p>
                </div>
                <button
                    onClick={fetchTokenUsage}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                >
                    <Activity size={18} />
                    Actualizar Datos
                </button>
            </header>

            {fetchError && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in">
                    <AlertTriangle size={20} />
                    <p className="font-medium text-sm">{fetchError}</p>
                </div>
            )}

            {/* Global Stats Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BrainCircuit size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-indigo-600">
                        <BarChart3 size={24} />
                        <h3 className="font-bold">Tokens Consumidos</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">
                        {globalStats.totalTokens.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Total histórico de la plataforma</p>
                </div>

                <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
                        <Activity size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-emerald-600">
                        <Bot size={24} />
                        <h3 className="font-bold">Interacciones Totales</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">
                        {globalStats.totalCalls.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Consultas realizadas al Asistente</p>
                </div>

                <div className="glass-card rounded-3xl p-6 relative overflow-hidden border-amber-100 bg-amber-50/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
                        <AlertTriangle size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-amber-600">
                        <Activity size={24} />
                        <h3 className="font-bold">Estimación de Costo (USD)</h3>
                    </div>
                    <p className="text-4xl font-black text-amber-700">
                        ${globalStats.costEstimate.toFixed(3)}
                    </p>
                    <p className="text-sm text-amber-600 mt-2">Aprox. $0.0015 por 1K tokens</p>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass-card rounded-3xl p-8 overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Users className="text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Consumo por Usuario</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 transition-shadow outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoadingData ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Colaborador</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Última Interacción</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Modelos Usados</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Interacciones (Calls)</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Tokens Totales</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {usageStats.map((stat: any, index: number) => (
                                    <tr key={stat.userId || index} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase">
                                                    {(stat.userName || stat.userEmail || "?").substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{stat.userName || "Sin nombre"}</div>
                                                    <div className="text-gray-500 text-xs">{stat.userEmail || stat.userId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm text-gray-600">
                                                {stat.lastUsed ? new Date(stat.lastUsed).toLocaleString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {stat.modelsUsed && stat.modelsUsed.map((model: string) => (
                                                    <span key={model} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                                                        {model}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-gray-900 font-medium">
                                            {stat.callCount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-bold text-indigo-600">{stat.totalTokens.toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-700 block text-center">
                                                Normal
                                            </span>
                                            {/* Configured limits can trigger a 'Warning' or 'Exceeded' text color/bg */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!isLoadingData && usageStats.length === 0 && (
                        <div className="text-center py-20">
                            <Bot size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-medium">No hay registros de uso de IA.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
