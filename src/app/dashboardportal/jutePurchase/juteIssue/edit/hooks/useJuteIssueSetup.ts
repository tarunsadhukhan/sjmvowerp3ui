/**
 * Hook for managing jute issue setup data fetching.
 */

import * as React from "react";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import type {
  JuteIssueSetupData,
  JuteItemRecord,
  YarnTypeRecord,
  BranchRecord,
} from "../types/juteIssueTypes";

type UseJuteIssueSetupParams = {
  coId: string | null;
};

type UseJuteIssueSetupReturn = {
  juteItems: JuteItemRecord[];
  yarnTypes: YarnTypeRecord[];
  branches: BranchRecord[];
  loading: boolean;
  error: string | null;
};

export const useJuteIssueSetup = ({
  coId,
}: UseJuteIssueSetupParams): UseJuteIssueSetupReturn => {
  const [juteItems, setJuteItems] = React.useState<JuteItemRecord[]>([]);
  const [yarnTypes, setYarnTypes] = React.useState<YarnTypeRecord[]>([]);
  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!coId) return;

    const fetchSetup = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${apiRoutesPortalMasters.JUTE_ISSUE_CREATE_SETUP}?co_id=${coId}`;
        const { data, error: fetchError } = await fetchWithCookie(url, "GET");

        if (fetchError) {
          throw new Error(fetchError);
        }

        const response = data as JuteIssueSetupData;
        setJuteItems(response.jute_items || []);
        setYarnTypes(response.yarn_types || []);
        setBranches(response.branches || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load setup data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSetup();
  }, [coId]);

  return { juteItems, yarnTypes, branches, loading, error };
};
