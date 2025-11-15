import React from "react";

export type TransactionSetupFetcher<TParams extends Record<string, unknown>, TRaw> = (
  input: { coId: string } & TParams
) => Promise<TRaw>;

export type UseTransactionSetupOptions<TParams extends Record<string, unknown>, TRaw, TMapped> = {
  coId?: string;
  params?: TParams;
  enabled?: boolean;
  fetcher: TransactionSetupFetcher<TParams, TRaw>;
  mapData: (raw: TRaw) => TMapped;
  missingCoIdMessage?: string;
  deps?: React.DependencyList;
};

export type UseTransactionSetupResult<TMapped> = {
  data: TMapped | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const DEFAULT_ERROR_MESSAGE = "Select a company to load transaction defaults.";

export function useTransactionSetup<TParams extends Record<string, unknown>, TRaw, TMapped>(
  options: UseTransactionSetupOptions<TParams, TRaw, TMapped>
): UseTransactionSetupResult<TMapped> {
  const {
    coId,
    params,
    enabled = true,
    fetcher,
    mapData,
    missingCoIdMessage = DEFAULT_ERROR_MESSAGE,
    deps = [],
  } = options;

  const [data, setData] = React.useState<TMapped | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = React.useState(0);

  const refresh = React.useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!coId) {
      setData(null);
      setLoading(false);
      setError(missingCoIdMessage);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await fetcher({ coId, ...(params ?? ({} as TParams)) });
        if (cancelled) return;
        const mapped = mapData(raw);
        setData(mapped);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unable to load data.";
        setData(null);
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [coId, enabled, fetcher, mapData, missingCoIdMessage, params, refreshIndex, ...deps]);

  return { data, loading, error, refresh };
}

export default useTransactionSetup;
