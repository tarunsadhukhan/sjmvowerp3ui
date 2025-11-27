import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { savePO, type SavePORequest } from "@/utils/poService";
import type { BranchAddressRecord, EditableLineItem } from "../types/poTypes";

 type UsePOFormSubmissionParams = {
  mode: "create" | "edit" | "view";
  pageError: string | null;
  setupError: string | null;
  branchAddresses: ReadonlyArray<BranchAddressRecord>;
  filledLineItems: ReadonlyArray<EditableLineItem>;
  isLineItemsReady: boolean;
  requestedId: string;
};

/**
 * Encapsulates submit/save logic for the PO forms.
 */
export const usePOFormSubmission = ({
  mode,
  pageError,
  setupError,
  branchAddresses,
  filledLineItems,
  isLineItemsReady,
  requestedId,
}: UsePOFormSubmissionParams) => {
  const [saving, setSaving] = React.useState(false);
  const router = useRouter();

  const handleFormSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (mode === "view" || pageError || setupError) return;

      const billingId = String(values.billing_address ?? "");
      const shippingId = String(values.shipping_address ?? "");
      const billingAddr = branchAddresses.find((a) => a.id === billingId);
      const shippingAddr = branchAddresses.find((a) => a.id === shippingId);

      if (billingAddr?.stateName && shippingAddr?.stateName && billingAddr.stateName !== shippingAddr.stateName) {
        toast({ variant: "destructive", title: "Invalid Address Selection", description: "Billing Address and Shipping Address must be in the same state." });
        return;
      }

      if (!isLineItemsReady) {
        toast({ variant: "destructive", title: "Line items incomplete", description: "Add at least one item with valid quantity and rate." });
        return;
      }

      const itemsPayload = filledLineItems.map((item) => ({
        indent_dtl_id: item.indentDtlId,
        item: item.item || undefined,
        quantity: item.quantity || undefined,
        rate: item.rate || undefined,
        uom: item.uom || undefined,
        make: item.itemMake || undefined,
        discount_mode: item.discountMode,
        discount_value: item.discountValue || undefined,
        remarks: item.remarks || undefined,
        igst_amount: item.igstAmount,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        tax_amount: item.taxAmount,
      }));

      const createPayload: SavePORequest = {
        branch: String(values.branch ?? ""),
        date: String(values.date ?? ""),
        supplier: String(values.supplier ?? ""),
        supplier_branch: String(values.supplier_branch ?? ""),
        billing_address: String(values.billing_address ?? ""),
        shipping_address: String(values.shipping_address ?? ""),
        tax_payable: String(values.tax_payable ?? "Yes"),
        credit_term: values.credit_term ? Number(values.credit_term) : undefined,
        delivery_timeline: Number(values.delivery_timeline ?? 0),
        project: String(values.project ?? ""),
        expense_type: String(values.expense_type ?? ""),
        contact_person: values.contact_person ? String(values.contact_person) : undefined,
        contact_no: values.contact_no ? String(values.contact_no) : undefined,
        footer_note: values.footer_note ? String(values.footer_note) : undefined,
        internal_note: values.internal_note ? String(values.internal_note) : undefined,
        terms_conditions: values.terms_conditions ? String(values.terms_conditions) : undefined,
        advance_percentage: values.advance_percentage ? Number(values.advance_percentage) : undefined,
        items: itemsPayload,
      };

      setSaving(true);
      try {
        if (mode === "edit" && requestedId) {
          createPayload.id = requestedId;
        }

        const result = await savePO(createPayload);
        const poId = result?.po_id ?? result?.poId ?? requestedId;
        toast({ title: result?.message ?? (mode === "edit" ? "PO updated" : "PO created") });

        if (poId) {
          router.replace(`/dashboardportal/procurement/purchaseOrder/createPO?mode=view&id=${encodeURIComponent(String(poId))}`);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Unable to save PO", description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setSaving(false);
      }
    },
    [
      mode,
      pageError,
      setupError,
      branchAddresses,
      filledLineItems,
      isLineItemsReady,
      requestedId,
      router,
    ],
  );

  return { saving, handleFormSubmit };
};
