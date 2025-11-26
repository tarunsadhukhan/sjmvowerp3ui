import React from "react";
import { ApprovalActionsBar, type ApprovalInfo, type ApprovalActionPermissions } from "@/components/ui/transaction";

type POApprovalBarProps = {
  approvalInfo: ApprovalInfo | null;
  permissions: ApprovalActionPermissions;
  loading: boolean;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onOpen: () => Promise<void>;
  onCancelDraft: () => Promise<void>;
  onReopen: () => Promise<void>;
  onSendForApproval: () => Promise<void>;
};

/** Wraps ApprovalActionsBar so page.tsx stays focused on orchestration logic. */
export function POApprovalBar({
  approvalInfo,
  permissions,
  loading,
  onApprove,
  onReject,
  onOpen,
  onCancelDraft,
  onReopen,
  onSendForApproval,
}: POApprovalBarProps) {
  if (!approvalInfo) return null;

  return (
    <ApprovalActionsBar
      approvalInfo={approvalInfo}
      permissions={permissions}
      onApprove={onApprove}
      onReject={onReject}
      onOpen={onOpen}
      onCancelDraft={onCancelDraft}
      onReopen={onReopen}
      onSendForApproval={onSendForApproval}
      loading={loading}
    />
  );
}

export default POApprovalBar;
