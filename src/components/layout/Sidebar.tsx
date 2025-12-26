// src/components/layout/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Users, ClipboardCheck, ChartPie, Receipt, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

import Image from 'next/image';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

const menuItems = [
    { href: '/', label: 'Dashboard', icon: ChartPie },
    { href: '/aprobaciones', label: 'Aprobaciones', icon: ClipboardCheck },
    { href: '/rendiciones', label: 'Rendiciones', icon: Receipt },
    { href: '/organization', label: 'Mi organización', icon: Users },
];

export function Sidebar({ className }: SidebarProps) {
    const [userIdentifier, setUserIdentifier] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Prefer metadata full_name, fallback to email
                const name = user.user_metadata?.full_name;
                setUserIdentifier(name || user.email || 'Usuario');
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className={cn("pb-12 min-h-screen bg-[#ffffff] text-black w-64 flex flex-col fixed left-0 top-0 border-r border-gray-200", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-2 px-4">
                        <Image
                            src="/tikko-logo-final.svg"
                            alt="Tikko"
                            width={240}
                            height={80}
                            className="h-22 w-auto"
                            priority
                        />
                    </div>
                    <div className="space-y-2 mt-8">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start mb-2 h-auto py-3 text-base font-medium",
                                            isActive
                                                ? "bg-[#cfefd5] text-[#00562c] border border-[#00562c] hover:bg-[#cfefd5] hover:text-[#00562c]"
                                                : "text-slate-600 hover:text-[#00562c] hover:bg-[#cfefd5] border border-transparent"
                                        )}
                                    >
                                        <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-[#00562c]" : "currentColor")} />
                                        {item.label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-auto px-3 py-2 space-y-2">
                <Link href="/configuracion">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start h-auto py-3 text-base font-medium",
                            pathname === '/configuracion'
                                ? "bg-[#cfefd5] text-[#00562c] border border-[#00562c] hover:bg-[#cfefd5] hover:text-[#00562c]"
                                : "text-slate-600 hover:text-[#00562c] hover:bg-[#cfefd5] border border-transparent"
                        )}
                    >
                        <Settings className={cn("mr-3 h-5 w-5", pathname === '/configuracion' ? "text-[#00562c]" : "currentColor")} />
                        Configuración
                    </Button>
                </Link>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-auto py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="truncate w-full text-left text-sm text-slate-900 font-semibold">{userIdentifier || 'Cargando...'}</span>
                                <span className="text-xs text-slate-500 font-normal">Cerrar Sesión</span>
                            </div>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Desea cerrar sesión?</DialogTitle>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">No, cancelar</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleLogout}>Si, cerrar sesión</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
