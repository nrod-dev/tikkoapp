import AppLayout from "@/components/layout/AppLayout";
import { ApprovalsView } from "@/components/dashboard/ApprovalsView";

export default function AprobacionesPage() {
    return (
        <AppLayout>
            <div className="h-full bg-slate-50/50 p-6 min-h-screen">
                <ApprovalsView />
            </div>
        </AppLayout>
    );
}
