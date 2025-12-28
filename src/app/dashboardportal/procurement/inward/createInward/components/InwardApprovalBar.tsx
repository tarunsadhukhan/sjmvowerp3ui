"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { ApprovalActionPermissions } from "@/utils/inwardService";

type InwardApprovalBarProps = {
	approvalInfo: {
		statusId: number;
		statusLabel: string;
		approvalLevel: number | null;
		maxApprovalLevel: number | null;
	};
	permissions: ApprovalActionPermissions;
	loading: boolean;
	disabled?: boolean;
	onSave?: () => void;
	onOpen?: () => void;
	onCancelDraft?: () => void;
	onApprove?: () => void;
	onReject?: () => void;
};

export const InwardApprovalBar: React.FC<InwardApprovalBarProps> = ({
	approvalInfo,
	permissions,
	loading,
	disabled = false,
	onSave,
	onOpen,
	onCancelDraft,
	onApprove,
	onReject,
}) => {
	const isDisabled = loading || disabled;

	return (
		<div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-muted/30 rounded-md border">
			<span className="text-sm font-medium mr-2">Actions:</span>

			{permissions.canSave && onSave && (
				<Button
					type="button"
					size="sm"
					variant="default"
					onClick={onSave}
					disabled={isDisabled}
				>
					{loading ? "Saving..." : "Save Draft"}
				</Button>
			)}

			{permissions.canOpen && onOpen && (
				<Button
					type="button"
					size="sm"
					variant="secondary"
					onClick={onOpen}
					disabled={isDisabled}
				>
					{loading ? "Processing..." : "Open"}
				</Button>
			)}

			{permissions.canCancelDraft && onCancelDraft && (
				<Button
					type="button"
					size="sm"
					variant="destructive"
					onClick={onCancelDraft}
					disabled={isDisabled}
				>
					{loading ? "Cancelling..." : "Cancel Draft"}
				</Button>
			)}

			{permissions.canApprove && onApprove && (
				<Button
					type="button"
					size="sm"
					variant="default"
					onClick={onApprove}
					disabled={isDisabled}
				>
					{loading ? "Approving..." : "Approve"}
				</Button>
			)}

			{permissions.canReject && onReject && (
				<Button
					type="button"
					size="sm"
					variant="destructive"
					onClick={onReject}
					disabled={isDisabled}
				>
					{loading ? "Rejecting..." : "Reject"}
				</Button>
			)}

			<div className="ml-auto text-xs text-muted-foreground">
				Status: <span className="font-medium">{approvalInfo.statusLabel}</span>
				{approvalInfo.approvalLevel != null && approvalInfo.maxApprovalLevel != null && (
					<span className="ml-2">
						(Level {approvalInfo.approvalLevel}/{approvalInfo.maxApprovalLevel})
					</span>
				)}
			</div>
		</div>
	);
};
