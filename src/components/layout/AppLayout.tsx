
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 bg-slate-50 min-h-screen">
                {children}
            </main>
        </div>
    );
}
