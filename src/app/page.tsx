"use client";

import AppLayout from "@/components/layout/AppLayout";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardView />
    </AppLayout>
  );
}