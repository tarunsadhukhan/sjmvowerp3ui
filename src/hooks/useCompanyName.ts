import React from "react";

/**
 * Hook to retrieve the company name from localStorage.
 * Returns undefined during SSR to prevent hydration mismatches.
 */
export const useCompanyName = (): string | undefined => {
	const companyName = React.useMemo(() => {
		if (typeof window === "undefined") return undefined;
		try {
			const storedCompany = localStorage.getItem("sidebar_selectedCompany");
			if (storedCompany) {
				const parsed = JSON.parse(storedCompany) as {
					co_name?: string;
					name?: string;
					company_name?: string;
				} | null;
				return parsed?.co_name || parsed?.name || parsed?.company_name || undefined;
			}
		} catch {
			// Ignore errors
		}
		return undefined;
	}, []);

	return companyName;
};

export default useCompanyName;
