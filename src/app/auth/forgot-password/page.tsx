"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Por favor ingresá tu email');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        });

        if (error) {
            toast.error(error.message);
        } else {
            setSuccess(true);
            toast.success('Email enviado correctamente');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-800">¡Email enviado!</h1>
                    <p className="text-slate-500 mb-6">
                        Si existe una cuenta asociada a <span className="font-medium text-slate-700">{email}</span>,
                        recibirás un enlace para restablecer tu contraseña.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Volver al inicio de sesión
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Link>

                <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">Recuperar contraseña</h1>
                <p className="text-center text-slate-500 mb-6">Te enviaremos un enlace para restablecer tu contraseña.</p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <Button type="submit" className="w-full mt-2" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
