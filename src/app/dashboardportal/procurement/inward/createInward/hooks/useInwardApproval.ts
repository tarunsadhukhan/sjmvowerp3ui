import React from "react";
import { useRouter } from "next/navigation";
import { useStatusChip, type ApprovalStatusId } from "@/components/ui/transaction";
import { toast } from "@/hooks/use-toast";
import type { MuiFormMode } from "@/components/ui/muiform";
import type { InwardDetails, ApprovalActionPermissions } from "@/utils/inwardService";
import { openInward, cancelDraftInward, approveInward, rejectInward } from "@/utils/inwardService";
import { INWARD_STATUS_IDS, INWARD_STATUS_LABELS } from "../utils/inwardConstants";

type UseInwardApprovalParams = {
	mode: MuiFormMode;
	requestedId: string;
	formValues: Record<string, unknown>;
	inwardDetails: InwardDetails | null;
	coId: string | null;
	getMenuId: () => string;
	setInwardDetails: React.Dispatch<React.SetStateAction<InwardDetails | null>>;
};

export const useInwardApproval = ({
	mode,
	requestedId,
	formValues,
	inwardDetails,
	coId,
	getMenuId,
	setInwardDetails,
}: UseInwardApprovalParams) => {
	const router = useRouter();
	const [approvalLoading, setApprovalLoading] = React.useState(false);

	// Map string status to ApprovalStatusId
	const mapStatusToId = React.useCallback((status?: string): ApprovalStatusId | null => {
		if (!status) return null;
		const normalized = status.toLowerCase();
		if (normalized.includes("draft")) return INWARD_STATUS_IDS.DRAFT;
		if (normalized.includes("pending")) return INWARD_STATUS_IDS.PENDING_APPROVAL;
		if (normalized.includes("approved")) return INWARD_STATUS_IDS.APPROVED;
		if (normalized.includes("rejected")) return INWARD_STATUS_IDS.REJECTED;
		if (normalized.includes("closed")) return INWARD_STATUS_IDS.CLOSED;
		if (normalized.includes("cancelled")) return INWARD_STATUS_IDS.CANCELLED;
		if (normalized.includes("open")) return INWARD_STATUS_IDS.OPEN;
		return null;
	}, []);

	// Derive current status
	const statusId = React.useMemo<ApprovalStatusId>(() => {
		if (inwardDetails?.statusId) return inwardDetails.statusId;
		const mapped = mapStatusToId(inwardDetails?.status);
		return mapped ?? INWARD_STATUS_IDS.DRAFT;
	}, [inwardDetails, mapStatusToId]);

	// Get approval permissions
	const getApprovalPermissions = React.useCallback(
		(
			status: ApprovalStatusId,
			currentMode: MuiFormMode,
			apiPermissions?: ApprovalActionPermissions
		): ApprovalActionPermissions => {
			if (apiPermissions) return apiPermissions;

			if (currentMode === "view") {
				return {};
			}

			if (status === INWARD_STATUS_IDS.DRAFT) {
				return {
					canSave: true,
					canOpen: true,
					canCancelDraft: true,
				};
			}

			if (status === INWARD_STATUS_IDS.OPEN) {
				return {
					canApprove: true,
					canReject: true,
				};
			}

			return {};
		},
		[]
	);

	const approvalPermissions = React.useMemo(
		() => getApprovalPermissions(statusId, mode, inwardDetails?.permissions),
		[statusId, mode, inwardDetails?.permissions, getApprovalPermissions]
	);

	// Approval info
	const approvalInfo = React.useMemo(
		() => ({
			statusId,
			statusLabel: INWARD_STATUS_LABELS[statusId] ?? inwardDetails?.status ?? "Unknown",
			approvalLevel: inwardDetails?.approvalLevel ?? null,
			maxApprovalLevel: inwardDetails?.maxApprovalLevel ?? null,
		}),
		[statusId, inwardDetails]
	);

	// Status chip
	const { statusChipProps } = useStatusChip({
		statusId,
		statusLabels: INWARD_STATUS_LABELS,
	});

	// Get branch ID from form values
	const getBranchId = React.useCallback(() => {
		const branchValue = formValues.branch;
		return branchValue ? String(branchValue) : "";
	}, [formValues.branch]);

	// Handle Open action
	const handleOpen = React.useCallback(async () => {
		if (!requestedId || !getBranchId() || !getMenuId()) {
			toast({
				variant: "destructive",
				title: "Unable to open inward",
				description: "Missing required parameters.",
			});
			return;
		}

		setApprovalLoading(true);
		try {
			const response = await openInward(requestedId, getBranchId(), getMenuId());
			toast({
				title: "Inward opened",
				description: response.inward_no ? `Inward No: ${response.inward_no}` : response.message,
			});
			// Update local state
			setInwardDetails((prev) =>
				prev
					? {
							...prev,
							statusId: response.new_status_id as InwardDetails["statusId"],
							status: "Open",
							inwardNo: response.inward_no ?? prev.inwardNo,
					  }
					: null
			);
			// Refresh to view mode
			router.replace(
				`/dashboardportal/procurement/inward/createInward?mode=view&id=${encodeURIComponent(requestedId)}`
			);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Unable to open inward",
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setApprovalLoading(false);
		}
	}, [requestedId, getBranchId, getMenuId, setInwardDetails, router]);

	// Handle Cancel Draft action
	const handleCancelDraft = React.useCallback(async () => {
		if (!requestedId || !getBranchId() || !getMenuId()) {
			toast({
				variant: "destructive",
				title: "Unable to cancel draft",
				description: "Missing required parameters.",
			});
			return;
		}

		setApprovalLoading(true);
		try {
			const response = await cancelDraftInward(requestedId, getBranchId(), getMenuId());
			toast({
				title: "Draft cancelled",
				description: response.message,
			});
			// Navigate back to list
			router.push("/dashboardportal/procurement/inward");
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Unable to cancel draft",
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setApprovalLoading(false);
		}
	}, [requestedId, getBranchId, getMenuId, router]);

	// Handle Approve action
	const handleApprove = React.useCallback(async () => {
		if (!requestedId || !getBranchId() || !getMenuId()) {
			toast({
				variant: "destructive",
				title: "Unable to approve inward",
				description: "Missing required parameters.",
			});
			return;
		}

		setApprovalLoading(true);
		try {
			const response = await approveInward(requestedId, getBranchId(), getMenuId());
			toast({
				title: "Inward approved",
				description: response.message,
			});
			// Update local state
			setInwardDetails((prev) =>
				prev
					? {
							...prev,
							statusId: response.new_status_id as InwardDetails["statusId"],
							status: "Approved",
					  }
					: null
			);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Unable to approve inward",
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setApprovalLoading(false);
		}
	}, [requestedId, getBranchId, getMenuId, setInwardDetails]);

	// Handle Reject action
	const handleReject = React.useCallback(
		async (reason?: string) => {
			if (!requestedId || !getBranchId() || !getMenuId()) {
				toast({
					variant: "destructive",
					title: "Unable to reject inward",
					description: "Missing required parameters.",
				});
				return;
			}

			setApprovalLoading(true);
			try {
				const response = await rejectInward(
					requestedId,
					getBranchId(),
					getMenuId(),
					reason ?? "Rejected by approver"
				);
				toast({
					title: "Inward rejected",
					description: response.message,
				});
				// Update local state
				setInwardDetails((prev) =>
					prev
						? {
								...prev,
								statusId: response.new_status_id as InwardDetails["statusId"],
								status: "Rejected",
						  }
						: null
				);
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Unable to reject inward",
					description: error instanceof Error ? error.message : "Please try again.",
				});
			} finally {
				setApprovalLoading(false);
			}
		},
		[requestedId, getBranchId, getMenuId, setInwardDetails]
	);

	return {
		approvalLoading,
		approvalInfo,
		approvalPermissions,
		statusChipProps,
		handleOpen,
		handleCancelDraft,
		handleApprove,
		handleReject,
	};
};
