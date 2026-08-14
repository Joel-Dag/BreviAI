"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardPollerProps {
  hasInProgressMeetings: boolean;
}

export function DashboardPoller({ hasInProgressMeetings }: DashboardPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasInProgressMeetings) return;

    // Check database state every 3 seconds while a meeting is processing
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasInProgressMeetings, router]);

  return null;
}