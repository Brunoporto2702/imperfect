import { Suspense } from "react";
import { DashboardPage } from "@/client/pages/DashboardPage";

export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
