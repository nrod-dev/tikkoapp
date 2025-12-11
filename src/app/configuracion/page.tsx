"use client";

import AppLayout from "@/components/layout/AppLayout";

export default function SettingsPage() {
    return (
        <AppLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Configuración</h1>
                <div className="bg-white rounded-lg shadow border border-slate-200">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Información Legal</h2>
                        <div className="space-y-2">
                            <a
                                href="/configuracion/privacidad"
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <span className="text-slate-600 group-hover:text-slate-900">Políticas de Privacidad</span>
                                <span className="text-slate-400">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
