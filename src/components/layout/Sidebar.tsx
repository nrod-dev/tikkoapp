// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { LayoutDashboard, FileText, Settings } from 'lucide-react'; // Quitamos Users
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 min-h-screen bg-[#0f172a] text-white w-64 flex flex-col fixed left-0 top-0", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-500 rounded-full" />
                        Tikko
                    </h2>
                    <div className="space-y-1 mt-8">
                        <Link href="/">
                            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/rendiciones">
                            <Button variant="secondary" className="w-full justify-start bg-slate-800 text-white hover:bg-slate-700">
                                <FileText className="mr-2 h-4 w-4" />
                                Rendiciones
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="mt-auto px-3 py-2">
                <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                </Button>
            </div>
        </div>
    );
}