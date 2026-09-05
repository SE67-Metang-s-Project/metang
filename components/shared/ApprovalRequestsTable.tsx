"use client";

import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";

export default function ApprovalRequestsTable({ requests }: { requests: ActionRequest[] }) {
  return <RequestsCard requests={requests} userRole="executive" />;
}
