'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { ShieldAlert, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeyKarinFormPage() {
    const { user, protectRoute, loading } = useAuth();
    const router = useRouter();

    const [isAnonymous, setIsAnonymous] = useState(false);
    const [accusedName, setAccusedName] = useState('');
    const [incidentDate, setIncidentDate] = useState('');
    const [description, setDescription] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        protectRoute();
    }, [protectRoute]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!accusedName || !incidentDate || !description) {
            setError('Por favor completa todos los campos obligatorios.');
            return;
        }

        if (description.length < 20) {
            setError('La descripción debe tener al menos 20 caracteres para aportar el contexto necesario.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await apiFetch('/api/karin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isAnonymous,
                    accused_name: accusedName,
                    incident_date: incidentDate,
                    description,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al enviar la denuncia.');
            }

            setSubmitSuccess(true);
            // Reset form
            setIsAnonymous(false);
            setAccusedName('');
            setIncidentDate('');
            setDescription('');

        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Hubo un error al procesar la denuncia. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/30 px-6 py-8 border-b border-red-100 dark:border-red-900/20 text-center">
                    <ShieldAlert className="mx-auto h-12 w-12 text-red-600 dark:text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Canal Seguro Ley Karin
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                        Este formulario es estrictamente confidencial. Toda la información enviada aquí está amparada bajo la Ley Karin (Ley 21.643) contra el acoso laboral, sexual o de violencia en el trabajo. Tu identidad está protegida.
                    </p>
                </div>

                <div className="px-6 py-8 sm:p-10">
                    {submitSuccess ? (
                        <div className="rounded-md bg-green-50 dark:bg-green-900/40 p-6 text-center">
                            <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">Denuncia Enviada Exitosamente</h3>
                            <p className="text-sm text-green-700 dark:text-green-400 mb-6">
                                Hemos recibido tus antecedentes de manera segura y encriptada. El departamento encargado iniciará los protocolos de investigación en los plazos legales correspondientes.
                            </p>
                            <button
                                onClick={() => setSubmitSuccess(false)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                                Enviar otra denuncia
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-base font-medium text-gray-900 dark:text-white">Opciones de Privacidad</label>
                                <p className="text-sm leading-5 text-gray-500 dark:text-gray-400">
                                    ¿Cómo deseas presentar esta denuncia?
                                </p>
                                <div className="mt-4 space-y-4">
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="anonymous"
                                                name="anonymous"
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="anonymous" className="font-medium text-gray-700 dark:text-gray-300">
                                                Deseo mantener mi denuncia anónima
                                            </label>
                                            <p className="text-gray-500 dark:text-gray-400">Si marcas esto, no asociaremos tu usuario a la denuncia. Considera que esto podría limitar las vías de comunicación para el seguimiento del caso.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="accused" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nombre de la persona denunciada <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="accused"
                                            id="accused"
                                            required
                                            value={accusedName}
                                            onChange={(e) => setAccusedName(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
                                            placeholder="Nombre completo o cargo"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Fecha aproximada del incidente <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            name="date"
                                            id="date"
                                            required
                                            value={incidentDate}
                                            onChange={(e) => setIncidentDate(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Descripción detallada de los hechos <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={6}
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
                                        placeholder="Relata de la manera más precisa posible qué sucedió, dónde, cuándo y si hubo testigos..."
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Mínimo 20 caracteres. Esta información será encriptada en nuestra base de datos para su máxima protección.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 min-w-[150px]"
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Enviar Denuncia
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
