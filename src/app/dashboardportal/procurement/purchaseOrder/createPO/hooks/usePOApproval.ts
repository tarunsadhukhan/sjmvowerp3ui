import React from "react";
import { toast } from "@/hooks/use-toast";
import type { MuiFormMode } from "@/components/ui/muiform";
import type { ApprovalInfo, ApprovalActionPermissions, ApprovalStatusId } from "@/components/ui/transaction";
import { PO_STATUS_IDS, PO_STATUS_LABELS } from "../utils/poConstants";
import {
  approvePO,
  cancelDraftPO,
  getPOById,
  openPO,
  rejectPO,
  reopenPO,
  sendPOForApproval,
  type PODetails,
} from "@/utils/poService";

 type UsePOApprovalParams = {
  mode: MuiFormMode;
  requestedId: string;
  formValues: Record<string, unknown>;
  poDetails: PODetails | null;
  coId?: string;
  getMenuId: () => string;
  setPODetails: React.Dispatch<React.SetStateAction<PODetails | null>>;
};

/**
 * Centralises approval-state derivation and the action handlers (open/cancel/approve/etc.).
 */
export const usePOApproval = ({ mode, requestedId, formValues, poDetails, coId, getMenuId, setPODetails }: UsePOApprovalParams) => {
  const [approvalLoading, setApprovalLoading] = React.useState(false);

  const statusId = React.useMemo<ApprovalStatusId | null>(() => {
    if (poDetails?.statusId) return poDetails.statusId as ApprovalStatusId;
    if (poDetails?.status) {
      const normalized = poDetails.status.toLowerCase();
      if (normalized.includes("draft")) return PO_STATUS_IDS.DRAFT;
      if (normalized === "open") return PO_STATUS_IDS.OPEN;
      if (normalized.includes("pending") || normalized.includes("approval")) return PO_STATUS_IDS.PENDING_APPROVAL;
      if (normalized === "approved") return PO_STATUS_IDS.APPROVED;
      if (normalized === "rejected" || normalized === "reject" ) return PO_STATUS_IDS.REJECTED;
      if (normalized === "closed") return PO_STATUS_IDS.CLOSED;
      if (normalized === "cancelled") return PO_STATUS_IDS.CANCELLED;
    }
    return null;
  }, [poDetails]);

  const getApprovalPermissions = React.useCallback(
    (status: ApprovalStatusId | null, currentMode: MuiFormMode, apiPermissions?: ApprovalActionPermissions): ApprovalActionPermissions => {
      if (apiPermissions) return apiPermissions;
      if (!status || currentMode === "view") {
        return { canViewApprovalLog: true, canClone: true };
      }
      if (status === PO_STATUS_IDS.DRAFT) return { canSave: true, canOpen: true, canCancelDraft: true };
      if (status === PO_STATUS_IDS.CANCELLED) return { canReopen: true, canClone: true, canViewApprovalLog: true };
      if (status === PO_STATUS_IDS.OPEN) return { canSave: true, canApprove: true };
      if (status === PO_STATUS_IDS.PENDING_APPROVAL) return { canViewApprovalLog: true };
      if (status === PO_STATUS_IDS.APPROVED) return { canViewApprovalLog: true, canClone: true };
      return {};
    },
    [],
  );

  const approvalPermissions = React.useMemo(
    () => getApprovalPermissions(statusId, mode, poDetails?.permissions),
    [statusId, mode, poDetails?.permissions, getApprovalPermissions],
  );

  const approvalInfo: ApprovalInfo | null = React.useMemo(() => {
    if (!statusId) return null;
    return {
      statusId,
      statusLabel: PO_STATUS_LABELS[statusId] ?? poDetails?.status ?? "Unknown",
      approvalLevel: poDetails?.approvalLevel ?? undefined,
      maxApprovalLevel: poDetails?.maxApprovalLevel ?? undefined,
    };
  }, [statusId, poDetails]);

  const statusChipProps = React.useMemo(() => {
    if (!statusId) return undefined;
    type StatusChipColor = "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info";
    const color: StatusChipColor =
      statusId === PO_STATUS_IDS.APPROVED
        ? "success"
        : statusId === PO_STATUS_IDS.REJECTED || statusId === PO_STATUS_IDS.CANCELLED
          ? "error"
          : statusId === PO_STATUS_IDS.PENDING_APPROVAL
            ? "warning"
            : "default";
    return {
      label: PO_STATUS_LABELS[statusId] ?? poDetails?.status ?? "Unknown",
      color,
    };
  }, [statusId, poDetails?.status]);

  const refreshDetails = React.useCallback(async () => {
    if (!requestedId) return;
    const menuId = getMenuId();
    if (!menuId) return;
    const detail = await getPOById(requestedId, coId, menuId || undefined);
    setPODetails(detail);
  }, [requestedId, getMenuId, coId, setPODetails]);

  const branchIdFromForm = React.useCallback(() => String(formValues.branch ?? ""), [formValues.branch]);

  const handleOpen = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = branchIdFromForm();
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await openPO(requestedId, branchId, menuId);
      toast({ title: "PO opened successfully" });
      await refreshDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to open PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, branchIdFromForm, getMenuId, refreshDetails]);

  const handleCancelDraft = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = branchIdFromForm();
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await cancelDraftPO(requestedId, branchId, menuId);
      toast({ title: "Draft cancelled successfully" });
      await refreshDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to cancel draft", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, branchIdFromForm, getMenuId, refreshDetails]);

  const handleReopen = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = branchIdFromForm();
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await reopenPO(requestedId, branchId, menuId);
      toast({ title: "PO reopened successfully" });
      await refreshDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to reopen PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, branchIdFromForm, getMenuId, refreshDetails]);

  const handleSendForApproval = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = branchIdFromForm();
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await sendPOForApproval(requestedId, branchId, menuId);
      toast({ title: "PO sent for approval successfully" });
      await refreshDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to send for approval", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, branchIdFromForm, getMenuId, refreshDetails]);

  const handleApprove = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = branchIdFromForm();
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await approvePO(requestedId, branchId, menuId);
      toast({ title: "PO approved successfully" });
      await refreshDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to approve PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, branchIdFromForm, getMenuId, refreshDetails]);

  const handleReject = React.useCallback(
    async (reason: string) => {
      if (!requestedId) return;
      const branchId = branchIdFromForm();
      const menuId = getMenuId();
      if (!branchId || !menuId) {
        toast({ variant: "destructive", title: "Branch and Menu ID required" });
        return;
      }
      setApprovalLoading(true);
      try {
        await rejectPO(requestedId, branchId, menuId, reason);
        toast({ title: "PO rejected successfully" });
        await refreshDetails();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to reject PO",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setApprovalLoading(false);
      }
    },
    [requestedId, branchIdFromForm, getMenuId, refreshDetails],
  );

  return {
    approvalLoading,
    approvalInfo,
    approvalPermissions,
    statusChipProps,
    handleApprove,
    handleReject,
    handleOpen,
    handleCancelDraft,
    handleReopen,
    handleSendForApproval,
  };
};
