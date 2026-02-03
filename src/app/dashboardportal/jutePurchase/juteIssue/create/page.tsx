"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Create page redirects to edit page with mode=create.
 */
export default function JuteIssueCreatePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboardportal/jutePurchase/juteIssue/edit?mode=create");
  }, [router]);

  return null;
}
