// src/components/layout/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, Users, ClipboardCheck, ChartPie, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import Image from 'next/image';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

const menuItems = [
    { href: '/', label: 'Dashboard', icon: ChartPie },
    { href: '/aprobaciones', label: 'Aprobaciones', icon: ClipboardCheck },
    { href: '/rendiciones', label: 'Rendiciones', icon: Receipt },
    { href: '/organization', label: 'Mi organización', icon: Users },
];

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

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
            <div className="mt-auto px-3 py-2">
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
            </div>
        </div>
    );
}
