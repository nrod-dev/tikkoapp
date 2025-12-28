import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error: string }>;
}) {
    // Await searchParams in Next.js 15
    const params = await searchParams;
    const error = params.error || 'Ocurrió un error desconocido';

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-800">Error de Autenticación</h1>
                <p className="text-slate-500 mb-6">
                    Hubo un problema al verificar tu sesión.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-sm text-red-700 break-words">
                    Error: {error}
                </div>

                <Link href="/login">
                    <Button className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio de sesión
                    </Button>
                </Link>
            </div>
        </div>
    );
}
