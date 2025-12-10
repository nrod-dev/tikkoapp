// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { LayoutDashboard, FileText, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 min-h-screen bg-[#022c22] text-white w-64 flex flex-col fixed left-0 top-0", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-2xl font-bold tracking-tight text-white">
                        Tikko
                    </h2>
                    <div className="space-y-2 mt-8">
                        <Link href="/">
                            <Button variant="ghost" className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-900/50">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/rendiciones">
                            <Button variant="ghost" className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-900/50">
                                <FileText className="mr-2 h-4 w-4" />
                                Rendiciones
                            </Button>
                        </Link>
                        <Link href="/colaboradores">
                            <Button variant="ghost" className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-900/50">
                                <Users className="mr-2 h-4 w-4" />
                                Colaboradores
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="mt-auto px-3 py-2">
                <Link href="/configuracion">
                    <Button variant="ghost" className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-900/50">
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                    </Button>
                </Link>
            </div>
        </div>
    );
}