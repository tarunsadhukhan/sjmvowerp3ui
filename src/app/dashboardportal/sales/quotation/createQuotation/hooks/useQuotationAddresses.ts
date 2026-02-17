import React from "react";
import type { BranchAddressRecord } from "../types/quotationTypes";

type UseQuotationAddressesParams = {
	branchAddresses: ReadonlyArray<BranchAddressRecord>;
	formValues: Record<string, unknown>;
};

/**
 * Derives billing/shipping state from company branch addresses.
 * For quotations, billing and shipping addresses are company branch addresses
 * (not customer branches like PO's supplier branches).
 */
export const useQuotationAddresses = ({ branchAddresses, formValues }: UseQuotationAddressesParams) => {
	const billingState = React.useMemo(() => {
		const billingId = String(formValues.billing_address ?? "");
		if (!billingId) return undefined;
		return branchAddresses.find((a) => a.id === billingId)?.stateName;
	}, [branchAddresses, formValues.billing_address]);

	const shippingState = React.useMemo(() => {
		const shippingId = String(formValues.shipping_address ?? "");
		if (!shippingId) return undefined;
		return branchAddresses.find((a) => a.id === shippingId)?.stateName;
	}, [branchAddresses, formValues.shipping_address]);

	return {
		billingState,
		shippingState,
	};
};
