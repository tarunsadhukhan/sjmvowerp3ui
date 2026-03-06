import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import type { ApprovalInfo, ApprovalActionPermissions, ApprovalStatusId } from "@/components/ui/transaction";
import type { SRHeader, SRLineItem, SRAdditionalCharge } from "../types/srTypes";
import { SR_STATUS_IDS, SR_STATUS_LABELS } from "../utils/srConstants";

type UseSRApprovalParams = {
	inwardId: string;
	header: SRHeader | null;
	srDate: string;
	srRemarks: string;
	lineItems: SRLineItem[];
	additionalCharges?: SRAdditionalCharge[];
	getChargesToSave?: () => SRAdditionalCharge[];
	onRefresh: () => Promise<void>;
};

type UseSRApprovalReturn = {
	saving: boolean;
	canEdit: boolean;
	approvalInfo: ApprovalInfo;
	approvalPermissions: ApprovalActionPermissions;
	handleSave: () => Promise<void>;
	handleOpen: () => Promise<void>;
	handleApprove: () => Promise<void>;
	handleReject: (reason: string) => Promise<void>;
};

/**
 * Manages SR approval workflow actions.
 */
export const useSRApproval = ({
	inwardId,
	header,
	srDate,
	srRemarks,
	lineItems,
	additionalCharges,
	getChargesToSave,
	onRefresh,
}: UseSRApprovalParams): UseSRApprovalReturn => {
	const router = useRouter();
	const [saving, setSaving] = React.useState(false);

	const rawStatusId = header?.sr_status ?? 0;
	// Map status 0 (no SR yet) to Draft (21) for approval logic
	const statusId: ApprovalStatusId = (rawStatusId === 0 ? SR_STATUS_IDS.DRAFT : rawStatusId) as ApprovalStatusId;

	const isApproved = statusId === SR_STATUS_IDS.APPROVED;
	const isRejected = statusId === SR_STATUS_IDS.REJECTED;
	const canEdit = !isApproved && !isRejected;

	const approvalInfo: ApprovalInfo = React.useMemo(
		() => ({
			statusId,
			statusLabel: SR_STATUS_LABELS[statusId] ?? header?.sr_status_name ?? "Draft",
			approvalLevel: null,
			maxApprovalLevel: null,
			isFinalLevel: false,
		}),
		[statusId, header?.sr_status_name],
	);

	const approvalPermissions: ApprovalActionPermissions = React.useMemo(() => {
		if (!canEdit) return {};
		switch (statusId) {
			case SR_STATUS_IDS.DRAFT:
				return { canSave: true, canOpen: true };
			case SR_STATUS_IDS.OPEN:
				return { canSave: true, canApprove: true, canReject: true };
			default:
				return {};
		}
	}, [statusId, canEdit]);

	/**
	 * Save SR as draft.
	 */
	const handleSave = React.useCallback(async () => {
		if (!inwardId) return;

		// Validate warehouse_id is set for all line items
		const missingWarehouse = lineItems.filter((item) => item.warehouse_id === null || item.warehouse_id === undefined);
		if (missingWarehouse.length > 0) {
			toast({
				title: "Validation Error",
				description: `Warehouse is required for all line items. ${missingWarehouse.length} item(s) missing warehouse.`,
				variant: "destructive",
			});
			return;
		}

		setSaving(true);
		try {
			const lineItemsPayload = lineItems.map((item) => ({
				inward_dtl_id: item.inward_dtl_id,
				accepted_rate: item.accepted_rate,
				amount: item.amount,
				discount_mode: item.discount_mode,
				discount_value: item.discount_value,
				discount_amount: item.discount_amount,
				warehouse_id: item.warehouse_id,
				hsn_code: item.hsn_code,
				// GST fields
				tax_percentage: item.tax_percentage,
				igst_amount: item.igst_amount,
				cgst_amount: item.cgst_amount,
				sgst_amount: item.sgst_amount,
				tax_amount: item.tax_amount,
			}));

			// Prepare additional charges payload
			const chargesToSave = getChargesToSave ? getChargesToSave() : [];
			const additionalChargesPayload = chargesToSave.map((charge) => ({
				inward_additional_id: charge.inward_additional_id,
				additional_charges_id: charge.additional_charges_id,
				qty: charge.qty,
				rate: charge.rate,
				net_amount: charge.net_amount,
				remarks: charge.remarks,
				apply_tax: charge.apply_tax,
				tax_pct: charge.tax_pct,
				igst_amount: charge.igst_amount,
				sgst_amount: charge.sgst_amount,
				cgst_amount: charge.cgst_amount,
				tax_amount: charge.tax_amount,
			}));

			const url = apiRoutesPortalMasters.SR_SAVE;
			const result = await fetchWithCookie(url, "POST", {
				inward_id: Number(inwardId),
				sr_date: srDate,
				sr_remarks: srRemarks,
				line_items: lineItemsPayload,
				additional_charges: additionalChargesPayload,
			});

			if (result.error) {
				throw new Error(result.error);
			}

			toast({
				title: "Success",
				description: "Stores Receipt saved successfully",
				variant: "default",
			});

			await onRefresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save SR";
			toast({
				title: "Error",
				description: message,
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	}, [inwardId, srDate, srRemarks, lineItems, getChargesToSave, onRefresh]);

	/**
	 * Open SR for approval.
	 */
	const handleOpen = React.useCallback(async () => {
		if (!inwardId) return;

		setSaving(true);
		try {
			const url = apiRoutesPortalMasters.SR_OPEN;
			const { error } = await fetchWithCookie(url, "POST", {
				inward_id: Number(inwardId),
			});

			if (error) {
				throw new Error(error);
			}

			toast({
				title: "Success",
				description: "SR opened for approval",
				variant: "default",
			});

			await onRefresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to open SR";
			toast({
				title: "Error",
				description: message,
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	}, [inwardId, onRefresh]);

	/**
	 * Approve SR.
	 */
	const handleApprove = React.useCallback(async () => {
		if (!inwardId) return;

		setSaving(true);
		try {
			const url = apiRoutesPortalMasters.SR_APPROVE;
			const { data, error } = await fetchWithCookie(url, "POST", {
				inward_id: Number(inwardId),
			});

			if (error) {
				throw new Error(error);
			}

			const result = data as { drcr_created?: boolean };
			let message = "SR approved successfully";
			if (result.drcr_created) {
				message += ". DRCR Note(s) auto-created.";
			}

			toast({
				title: "Success",
				description: message,
				variant: "default",
			});

			router.push("/dashboardportal/procurement/sr");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to approve SR";
			toast({
				title: "Error",
				description: message,
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	}, [inwardId, router]);

	/**
	 * Reject SR with reason.
	 */
	const handleReject = React.useCallback(async (reason: string) => {
		if (!inwardId) return;

		setSaving(true);
		try {
			const url = apiRoutesPortalMasters.SR_REJECT;
			const { error } = await fetchWithCookie(url, "POST", {
				inward_id: Number(inwardId),
				reason,
			});

			if (error) {
				throw new Error(error);
			}

			toast({
				title: "Success",
				description: "SR rejected",
				variant: "default",
			});

			router.push("/dashboardportal/procurement/sr");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to reject SR";
			toast({
				title: "Error",
				description: message,
				variant: "destructive",
			});
		} finally {
			setSaving(false);
		}
	}, [inwardId, router]);

	return {
		saving,
		canEdit,
		approvalInfo,
		approvalPermissions,
		handleSave,
		handleOpen,
		handleApprove,
		handleReject,
	};
};
