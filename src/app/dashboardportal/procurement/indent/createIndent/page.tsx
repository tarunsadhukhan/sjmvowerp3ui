"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TransactionWrapper, { type TransactionAction, type TransactionMetadataItem } from "@/components/ui/TransactionWrapper";
import MuiForm, { type MuiFormMode, type Schema } from "@/components/ui/muiform";
import IndentPreview from "../components/IndentPreview";
import { useBranchOptions } from "@/utils/branchUtils";
import {
  createIndent,
  fetchIndentSetup1,
  fetchIndentSetup2,
  getIndentById,
  updateIndent,
  type IndentDetails,
  type IndentLine,
} from "@/utils/indentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type Option = { label: string; value: string };

type EditableLineItem = {
  id: string;
  department: string;
  itemGroup: string;
  item: string;
  itemMake: string;
  quantity: string;
  uom: string;
  remarks: string;
};

type DepartmentRecord = { id: string; name: string; branchId?: string };
type ProjectRecord = { id: string; name: string; branchId?: string };
type ExpenseRecord = { id: string; name: string };
type ItemGroupRecord = { id: string; label: string };

type ItemOption = Option & { defaultUomId?: string; defaultUomLabel?: string };

type ItemGroupCacheEntry = {
  items: ItemOption[];
  makes: Option[];
  uomsByItemId: Record<string, Option[]>;
  itemLabelById: Record<string, string>;
  makeLabelById: Record<string, string>;
  uomLabelByItemId: Record<string, Record<string, string>>;
};

const INDENT_TYPE_OPTIONS = [
  { label: "Regular Indent", value: "regular" },
  { label: "Open Indent", value: "open" },
  { label: "BOM", value: "bom" },
];

const buildDefaultFormValues = () => ({
  branch: "",
  indent_type: "",
  expense_type: "",
  date: new Date().toISOString().slice(0, 10),
  indent_no: "",
  project: "",
  requester: "",
  remarks: "",
});

let lineIdSeed = 0;
const generateLineId = () => {
  lineIdSeed += 1;
  return `line-${lineIdSeed}`;
};

const createBlankLine = (): EditableLineItem => ({
  id: generateLineId(),
  department: "",
  itemGroup: "",
  item: "",
  itemMake: "",
  quantity: "",
  uom: "",
  remarks: "",
});

const lineHasAnyData = (line: EditableLineItem) =>
  Boolean(
    line.department ||
      line.itemGroup ||
      line.item ||
      line.itemMake ||
      line.quantity ||
      line.uom ||
      line.remarks
  );

const lineIsComplete = (line: EditableLineItem) => {
  const qty = Number(line.quantity);
  return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0);
};

const readStoredCompanyCoId = () => {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("sidebar_selectedCompany");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.co_id ? String(parsed.co_id) : "";
  } catch {
    return "";
  }
};

type LineItemsEditorProps = {
  items: EditableLineItem[];
  mode: MuiFormMode;
  onFieldChange: (id: string, field: keyof EditableLineItem, value: string) => void;
  onRemove: (id: string) => void;
  departmentOptions: Option[];
  itemGroupOptions: Option[];
  getItemOptions: (itemGroupId: string) => ItemOption[];
  getMakeOptions: (itemGroupId: string) => Option[];
  getUomOptions: (itemGroupId: string, itemId: string) => Option[];
  labelResolvers: {
    department: (id: string) => string;
    itemGroup: (id: string) => string;
    item: (groupId: string, itemId: string) => string;
    itemMake: (groupId: string, makeId: string) => string;
    uom: (groupId: string, itemId: string, uomId: string) => string;
  };
  loadingGroups: Record<string, boolean>;
};

const LineItemsEditor: React.FC<LineItemsEditorProps> = ({
  items,
  mode,
  onFieldChange,
  onRemove,
  departmentOptions,
  itemGroupOptions,
  getItemOptions,
  getMakeOptions,
  getUomOptions,
  labelResolvers,
  loadingGroups,
}) => {
  const canEdit = mode !== "view";
  const columnTemplate =
    "grid grid-cols-[48px_1.2fr_1.6fr_1.6fr_1.1fr_0.7fr_0.75fr_1.6fr_76px] gap-x-3";

  const handleTextareaInput = React.useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 40), 240)}px`;
  }, []);

  const placeholderText = canEdit ? "Add items to build the indent." : "No line items available.";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-base font-semibold text-slate-800">Line Items</p>
        <p className="text-xs text-slate-500">List the materials or services you intend to procure.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1120px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className={`${columnTemplate} bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600`}>
            <span>#</span>
            <span>Department</span>
            <span>Item Group</span>
            <span>Item</span>
            <span>Item Make</span>
            <span>Qty</span>
            <span>UOM</span>
            <span>Remarks</span>
            <span className="text-right">{canEdit ? "Actions" : ""}</span>
          </div>

          {items.length ? (
            items.map((item, index) => {
              const itemOptions = getItemOptions(item.itemGroup);
              const makeOptions = getMakeOptions(item.itemGroup);
              const uomOptions = getUomOptions(item.itemGroup, item.item);
              const waitingForGroup = Boolean(item.itemGroup) && !itemOptions.length && loadingGroups[item.itemGroup];
              const showRemove = canEdit && (items.length > 1 || lineHasAnyData(item));

              return (
                <div
                  key={item.id}
                  className={`${columnTemplate} items-start border-t border-slate-200 px-4 py-3 text-sm ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <span className="pt-2 text-xs font-semibold text-slate-500">{index + 1}</span>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Select
                        value={item.department || undefined}
                        onValueChange={(next) => onFieldChange(item.id, "department", next)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {departmentOptions.length ? (
                            departmentOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="__empty__">
                              No options
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="block truncate text-slate-700">{labelResolvers.department(item.department)}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Select
                        value={item.itemGroup || undefined}
                        onValueChange={(next) => onFieldChange(item.id, "itemGroup", next)}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select item group" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {itemGroupOptions.length ? (
                            itemGroupOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="__empty__">
                              No options
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="block truncate text-slate-700">{labelResolvers.itemGroup(item.itemGroup)}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Select
                        value={item.item || undefined}
                        onValueChange={(next) => onFieldChange(item.id, "item", next)}
                        disabled={!item.itemGroup || waitingForGroup}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={waitingForGroup ? "Loading items..." : "Select item"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {itemOptions.length ? (
                            itemOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="__empty__">
                              {waitingForGroup ? "Loading..." : "No options"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="block truncate text-slate-700">{labelResolvers.item(item.itemGroup, item.item)}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Select
                        value={item.itemMake || undefined}
                        onValueChange={(next) => onFieldChange(item.id, "itemMake", next)}
                        disabled={!item.itemGroup || waitingForGroup}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={makeOptions.length ? "Select make" : "No make options"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {makeOptions.length ? (
                            makeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="__empty__">
                              No options
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="block truncate text-slate-700">{labelResolvers.itemMake(item.itemGroup, item.itemMake)}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(event) => onFieldChange(item.id, "quantity", event.target.value)}
                        placeholder="0"
                        className="bg-white"
                      />
                    ) : (
                      <span className="block truncate text-slate-700">{item.quantity || "-"}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <Select
                        value={item.uom || undefined}
                        onValueChange={(next) => onFieldChange(item.id, "uom", next)}
                        disabled={!item.item || waitingForGroup}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={waitingForGroup ? "Loading UOMs..." : "Select UOM"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {uomOptions.length ? (
                            uomOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="__empty__">
                              {waitingForGroup ? "Loading..." : "No options"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="block truncate text-slate-700">{labelResolvers.uom(item.itemGroup, item.item, item.uom)}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {canEdit ? (
                      <textarea
                        className="h-auto min-h-[40px] w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        rows={1}
                        value={item.remarks}
                        placeholder="Notes"
                        onChange={(event) => {
                          handleTextareaInput(event);
                          onFieldChange(item.id, "remarks", event.target.value);
                        }}
                        onInput={handleTextareaInput}
                      />
                    ) : (
                      <span className="block truncate text-slate-700" title={item.remarks}>
                        {item.remarks || "-"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    {showRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.id)}
                        className="text-xs text-slate-500"
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">{placeholderText}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function IndentTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
  const requestedId = searchParams?.get("id") || "";

  const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

  const branchOptions = useBranchOptions();

  const [coId, setCoId] = React.useState<string>(() => readStoredCompanyCoId());
  const [initialValues, setInitialValues] = React.useState<Record<string, unknown>>(buildDefaultFormValues);
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(buildDefaultFormValues);
  const [lineItems, setLineItems] = React.useState<EditableLineItem[]>(() => (mode === "create" ? [createBlankLine()] : []));
  const [indentDetails, setIndentDetails] = React.useState<IndentDetails | null>(null);
  const [loading, setLoading] = React.useState<boolean>(mode !== "create");
  const [saving, setSaving] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [setupError, setSetupError] = React.useState<string | null>(null);
  const [setupLoading, setSetupLoading] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);

  const [departments, setDepartments] = React.useState<DepartmentRecord[]>([]);
  const [projects, setProjects] = React.useState<ProjectRecord[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseRecord[]>([]);
  const [itemGroups, setItemGroups] = React.useState<ItemGroupRecord[]>([]);

  const [itemGroupCache, setItemGroupCache] = React.useState<Record<string, ItemGroupCacheEntry>>({});
  const [itemGroupLoading, setItemGroupLoading] = React.useState<Record<string, boolean>>({});

  const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>(null);
  const createDefaultsSeededRef = React.useRef(false);

  const mapLineToEditable = React.useCallback((line: IndentLine): EditableLineItem => ({
    id: line.id ? String(line.id) : generateLineId(),
    department: line.department ?? "",
    itemGroup: line.itemGroup ?? "",
    item: line.item ?? "",
    itemMake: line.itemMake ?? "",
    quantity: line.quantity != null ? String(line.quantity) : "",
    uom: line.uom ?? "",
    remarks: line.remarks ?? "",
  }), []);

  React.useEffect(() => {
    const syncCoId = () => setCoId(readStoredCompanyCoId());
    syncCoId();
    const handler = (event: StorageEvent) => {
      if (event.key === "sidebar_selectedCompany") {
        syncCoId();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  React.useEffect(() => {
    if (mode !== "create") {
      createDefaultsSeededRef.current = false;
      return;
    }

    if (!createDefaultsSeededRef.current) {
      const base = buildDefaultFormValues();
      setInitialValues(base);
      setFormValues(base);
      setFormKey((prev) => prev + 1);
      setLineItems((prev) => (prev.length ? prev : [createBlankLine()]));
      createDefaultsSeededRef.current = true;
    }
  }, [mode]);

  React.useEffect(() => {
    if (mode !== "create") return;
    if (!branchOptions.length) return;

    setFormValues((prev) => {
      const currentBranch = (prev.branch as string) || "";
      if (currentBranch) return prev;
      const next = { ...prev, branch: branchOptions[0].value };
      setInitialValues(next);
      setFormKey((value) => value + 1);
      return next;
    });
  }, [mode, branchOptions]);

  React.useEffect(() => {
    if (mode === "create") {
      setIndentDetails(null);
      setPageError(null);
      setLoading(false);
      return;
    }

    if (!requestedId) {
      setIndentDetails(null);
      setLineItems([]);
      setPageError("Missing indent identifier in the URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getIndentById(requestedId)
      .then((detail) => {
        if (cancelled) return;
        setIndentDetails(detail);
        const base = {
          branch: detail.branch ?? "",
          indent_type: detail.indentType ?? "",
          expense_type: detail.expenseType ?? "",
          date: detail.indentDate ?? "",
          indent_no: detail.indentNo ?? "",
          project: detail.project ?? "",
          requester: detail.requester ?? "",
          remarks: detail.remarks ?? "",
        };
        setInitialValues(base);
        setFormValues(base);
        setFormKey((prev) => prev + 1);
  const mappedLines = (detail.lines ?? []).map(mapLineToEditable);
  setLineItems(mappedLines.length ? mappedLines : [createBlankLine()]);
        setPageError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setIndentDetails(null);
        setLineItems([createBlankLine()]);
        setPageError(error instanceof Error ? error.message : "Unable to load indent details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, requestedId, mapLineToEditable]);

  const branchValue = React.useMemo(() => String(formValues.branch ?? ""), [formValues.branch]);
  const branchIdForSetup = React.useMemo(() => (branchValue && /^\d+$/.test(branchValue) ? branchValue : undefined), [branchValue]);

  React.useEffect(() => {
    if (!coId) {
      setSetupError("Select a company to load indent defaults.");
      setDepartments([]);
      setProjects([]);
      setExpenses([]);
      setItemGroups([]);
      setSetupLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setSetupLoading(true);
      try {
        const response = await fetchIndentSetup1({ coId, branchId: branchIdForSetup });
        if (cancelled) return;

        const deptRecords = Array.isArray(response.departments) ? response.departments : [];
        const projectRecords = Array.isArray(response.projects) ? response.projects : [];
        const expenseRecords = Array.isArray(response.expense_types) ? response.expense_types : [];
        const itemGroupRecords = Array.isArray(response.item_groups) ? response.item_groups : [];

        setDepartments(
          deptRecords
            .map((row) => {
              const data = row as any;
              const id = data?.dept_id ?? data?.department_id ?? data?.id;
              if (!id) return null;
              return {
                id: String(id),
                name: data?.dept_desc ?? data?.dept_name ?? data?.name ?? String(id),
                branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
              } as DepartmentRecord;
            })
            .filter(Boolean) as DepartmentRecord[]
        );

        setProjects(
          projectRecords
            .map((row) => {
              const data = row as any;
              const id = data?.project_id ?? data?.prj_id ?? data?.id;
              if (!id) return null;
              return {
                id: String(id),
                name: data?.prj_name ?? data?.project_name ?? data?.name ?? String(id),
                branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
              } as ProjectRecord;
            })
            .filter(Boolean) as ProjectRecord[]
        );

        setExpenses(
          expenseRecords
            .map((row) => {
              const data = row as any;
              const id = data?.expense_type_id ?? data?.id;
              if (!id) return null;
              return {
                id: String(id),
                name: data?.expense_type_name ?? data?.name ?? String(id),
              } as ExpenseRecord;
            })
            .filter(Boolean) as ExpenseRecord[]
        );

        setItemGroups(
          itemGroupRecords
            .map((row) => {
              const data = row as any;
              const id = data?.item_grp_id ?? data?.id;
              if (!id) return null;
              const code = data?.item_grp_code_display ?? data?.code;
              const name = data?.item_grp_name_display ?? data?.name;
              const labelParts = [code, name].filter(Boolean);
              return {
                id: String(id),
                label: labelParts.length ? labelParts.join(" — ") : String(id),
              } as ItemGroupRecord;
            })
            .filter(Boolean) as ItemGroupRecord[]
        );

        setSetupError(null);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to load indent defaults.";
        setSetupError(message);
        setDepartments([]);
        setProjects([]);
        setExpenses([]);
        setItemGroups([]);
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [coId, branchIdForSetup]);

  const expenseOptions = React.useMemo<Option[]>(
    () =>
      expenses.map((exp) => ({
        label: exp.name || exp.id,
        value: exp.id,
      })),
    [expenses]
  );

  const departmentOptions = React.useMemo<Option[]>(() => {
    if (!departments.length) return [];
    const branchFilter = branchIdForSetup;
    return departments
      .filter((dept) => !branchFilter || !dept.branchId || dept.branchId === branchFilter)
      .map((dept) => ({ label: dept.name || dept.id, value: dept.id }));
  }, [departments, branchIdForSetup]);

  const projectOptions = React.useMemo<Option[]>(() => {
    if (!projects.length) return [];
    const branchFilter = branchIdForSetup;
    return projects
      .filter((project) => !branchFilter || !project.branchId || project.branchId === branchFilter)
      .map((project) => ({ label: project.name || project.id, value: project.id }));
  }, [projects, branchIdForSetup]);

  const itemGroupOptions = React.useMemo<Option[]>(
    () => itemGroups.map((grp) => ({ label: grp.label || grp.id, value: grp.id })),
    [itemGroups]
  );

  const departmentLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((dept) => {
      map.set(dept.id, dept.name || dept.id);
    });
    return map;
  }, [departments]);

  const expenseLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    expenses.forEach((exp) => {
      map.set(exp.id, exp.name || exp.id);
    });
    return map;
  }, [expenses]);

  const projectLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((proj) => {
      map.set(proj.id, proj.name || proj.id);
    });
    return map;
  }, [projects]);

  const itemGroupLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    itemGroups.forEach((grp) => {
      map.set(grp.id, grp.label || grp.id);
    });
    return map;
  }, [itemGroups]);

  const getItemOptions = React.useCallback(
    (itemGroupId: string) => itemGroupCache[itemGroupId]?.items ?? [],
    [itemGroupCache]
  );

  const getMakeOptions = React.useCallback(
    (itemGroupId: string) => itemGroupCache[itemGroupId]?.makes ?? [],
    [itemGroupCache]
  );

  const getUomOptions = React.useCallback(
    (itemGroupId: string, itemId: string) =>
      itemGroupCache[itemGroupId]?.uomsByItemId[itemId] ?? [],
    [itemGroupCache]
  );

  React.useEffect(() => {
    setItemGroupCache({});
    setItemGroupLoading({});
  }, [coId]);

  const ensureItemGroupData = React.useCallback(
    async (itemGroupId: string) => {
      if (!itemGroupId || itemGroupCache[itemGroupId]) return;
      setItemGroupLoading((prev) => ({ ...prev, [itemGroupId]: true }));
      try {
        const response = await fetchIndentSetup2(itemGroupId);

        const itemsRaw = Array.isArray(response.items) ? response.items : [];
        const makesRaw = Array.isArray(response.makes) ? response.makes : [];
        const uomsRaw = Array.isArray(response.uoms) ? response.uoms : [];

        const items: ItemOption[] = itemsRaw
          .map((row) => {
            const data = row as any;
            const id = data?.item_id ?? data?.id;
            if (!id) return null;
            const value = String(id);
            const code = data?.item_code;
            const name = data?.item_name;
            const labelParts = [code, name].filter(Boolean);
            return {
              value,
              label: labelParts.length ? labelParts.join(" — ") : value,
              defaultUomId: data?.uom_id != null ? String(data.uom_id) : undefined,
              defaultUomLabel: data?.uom_name ? String(data.uom_name) : undefined,
            } as ItemOption;
          })
          .filter(Boolean) as ItemOption[];

        const makes: Option[] = makesRaw
          .map((row) => {
            const data = row as any;
            const id = data?.item_make_id ?? data?.id;
            if (!id) return null;
            return {
              value: String(id),
              label: data?.item_make_name ?? data?.name ?? String(id),
            } as Option;
          })
          .filter(Boolean) as Option[];

        const uomsByItemId: Record<string, Option[]> = {};
        const uomLabelByItemId: Record<string, Record<string, string>> = {};
        uomsRaw.forEach((row) => {
          const data = row as any;
          const itemId = data?.item_id ?? data?.id;
          const uomId = data?.map_to_id ?? data?.uom_id ?? data?.mapToId;
          if (!itemId || !uomId) return;
          const itemKey = String(itemId);
          const uomKey = String(uomId);
          const label = data?.uom_name ? String(data.uom_name) : uomKey;
          if (!uomsByItemId[itemKey]) uomsByItemId[itemKey] = [];
          if (!uomLabelByItemId[itemKey]) uomLabelByItemId[itemKey] = {};
          if (!uomsByItemId[itemKey].some((opt) => opt.value === uomKey)) {
            uomsByItemId[itemKey].push({ value: uomKey, label });
          }
          uomLabelByItemId[itemKey][uomKey] = label;
        });

        items.forEach((item) => {
          if (!item.defaultUomId) return;
          const bucket = uomsByItemId[item.value] ?? [];
          if (!bucket.some((opt) => opt.value === item.defaultUomId)) {
            bucket.unshift({
              value: item.defaultUomId,
              label: item.defaultUomLabel ?? item.defaultUomId,
            });
          }
          uomsByItemId[item.value] = bucket;
          if (!uomLabelByItemId[item.value]) uomLabelByItemId[item.value] = {};
          uomLabelByItemId[item.value][item.defaultUomId] = item.defaultUomLabel ?? item.defaultUomId ?? item.defaultUomId;
        });

        const itemLabelById: Record<string, string> = {};
        items.forEach((item) => {
          itemLabelById[item.value] = item.label;
        });

        const makeLabelById: Record<string, string> = {};
        makes.forEach((make) => {
          makeLabelById[make.value] = make.label;
        });

        setItemGroupCache((prev) => ({
          ...prev,
          [itemGroupId]: {
            items,
            makes,
            uomsByItemId,
            itemLabelById,
            makeLabelById,
            uomLabelByItemId,
          },
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load item options.";
        toast({
          variant: "destructive",
          title: "Item data not available",
          description: message,
        });
      } finally {
        setItemGroupLoading((prev) => {
          const next = { ...prev };
          delete next[itemGroupId];
          return next;
        });
      }
    },
    [itemGroupCache]
  );

  const getDepartmentLabel = React.useCallback(
    (id: string) => (id ? departmentLabelMap.get(id) ?? id : "-"),
    [departmentLabelMap]
  );

  const getItemGroupLabel = React.useCallback(
    (id: string) => (id ? itemGroupLabelMap.get(id) ?? id : "-"),
    [itemGroupLabelMap]
  );

  const getItemLabel = React.useCallback(
    (groupId: string, itemId: string) => {
      if (!groupId || !itemId) return "-";
      return itemGroupCache[groupId]?.itemLabelById[itemId] ?? itemId;
    },
    [itemGroupCache]
  );

  const getItemMakeLabel = React.useCallback(
    (groupId: string, makeId: string) => {
      if (!groupId || !makeId) return "-";
      return itemGroupCache[groupId]?.makeLabelById[makeId] ?? makeId;
    },
    [itemGroupCache]
  );

  const getUomLabel = React.useCallback(
    (groupId: string, itemId: string, uomId: string) => {
      if (!groupId || !itemId || !uomId) return "-";
      const cache = itemGroupCache[groupId];
      if (!cache) return uomId;
      const labels = cache.uomLabelByItemId[itemId];
      if (labels && labels[uomId]) return labels[uomId];
      const defaultMatch = cache.items.find((opt) => opt.value === itemId && opt.defaultUomId === uomId);
      if (defaultMatch) return defaultMatch.defaultUomLabel ?? defaultMatch.defaultUomId ?? uomId;
      return uomId;
    },
    [itemGroupCache]
  );

  const labelResolvers = React.useMemo(
    () => ({
      department: getDepartmentLabel,
      itemGroup: getItemGroupLabel,
      item: getItemLabel,
      itemMake: getItemMakeLabel,
      uom: getUomLabel,
    }),
    [getDepartmentLabel, getItemGroupLabel, getItemLabel, getItemMakeLabel, getUomLabel]
  );

  React.useEffect(() => {
    if (!Object.keys(itemGroupCache).length) return;
    setLineItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (!item.item || item.uom) return item;
        const cache = itemGroupCache[item.itemGroup];
        if (!cache) return item;
        const options = cache.uomsByItemId[item.item] ?? [];
        const defaultUom = cache.items.find((opt) => opt.value === item.item)?.defaultUomId;
        const newUom = options[0]?.value ?? defaultUom ?? "";
        if (!newUom || newUom === item.uom) return item;
        changed = true;
        return { ...item, uom: newUom };
      });
      return changed ? next : prev;
    });
  }, [itemGroupCache]);

  React.useEffect(() => {
    lineItems.forEach((item) => {
      if (item.itemGroup && !itemGroupCache[item.itemGroup]) {
        void ensureItemGroupData(item.itemGroup);
      }
    });
  }, [lineItems, itemGroupCache, ensureItemGroupData]);

  const schema: Schema = React.useMemo(() => ({
    fields: [
      {
        name: "branch",
        label: "Branch",
        type: "select",
        required: true,
        options: branchOptions,
        disabled: mode !== "create",
        grid: { xs: 12, md: 4 },
      },
      {
        name: "indent_type",
        label: "Indent Type",
        type: "select",
        required: true,
        options: INDENT_TYPE_OPTIONS,
        grid: { xs: 12, md: 4 },
      },
      {
        name: "expense_type",
        label: "Expense Type",
        type: "select",
        required: true,
        options: expenseOptions,
        grid: { xs: 12, md: 4 },
      },
      { name: "date", label: "Indent Date", type: "date", required: true, grid: { xs: 12, md: 6 } },
      {
        name: "indent_no",
        label: "Indent No",
        type: "text",
        disabled: true,
        helperText: "Generated after the indent is created",
        grid: { xs: 12, md: 6 },
      },
      {
        name: "project",
        label: "Project",
        type: "select",
        options: projectOptions,
        grid: { xs: 12, md: 6 },
      },
  { name: "requester", label: "Indent Name", type: "text", grid: { xs: 12, md: 6 } },
      { name: "remarks", label: "Remarks", type: "textarea", grid: { xs: 12 }, minRows: 1, maxRows: 4 },
    ],
  }), [branchOptions, mode, expenseOptions, projectOptions]);

  const filledLineItems = React.useMemo(
    () =>
      lineItems.filter(
        (item) =>
          item.department ||
          item.itemGroup ||
          item.item ||
          item.itemMake ||
          item.quantity ||
          item.uom ||
          item.remarks
      ),
    [lineItems]
  );

  const lineItemsValid = React.useMemo(() => {
    if (mode === "view" || pageError || setupError) return true;
    if (!filledLineItems.length) return false;
    return filledLineItems.every(lineIsComplete);
  }, [mode, filledLineItems, pageError, setupError]);

  const handleLineFieldChange = React.useCallback(
    (id: string, field: keyof EditableLineItem, rawValue: string) => {
      if (mode === "view") return;

      if (field === "itemGroup") {
        setLineItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  itemGroup: rawValue,
                  item: "",
                  itemMake: "",
                  uom: "",
                }
              : item
          )
        );
        if (rawValue) {
          void ensureItemGroupData(rawValue);
        }
        return;
      }

      if (field === "item") {
        let groupToFetch: string | null = null;
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const currentGroup = item.itemGroup;
            if (rawValue && currentGroup && !itemGroupCache[currentGroup]) {
              groupToFetch = currentGroup;
            }
            let nextUom = item.uom;
            if (!rawValue) {
              nextUom = "";
            } else {
              const cache = itemGroupCache[currentGroup ?? ""];
              const options = cache?.uomsByItemId[rawValue] ?? [];
              const defaultUom = cache?.items.find((opt) => opt.value === rawValue)?.defaultUomId;
              if (nextUom && options.some((opt) => opt.value === nextUom)) {
                // keep existing UOM
              } else if (options.length) {
                nextUom = options[0].value;
              } else if (defaultUom) {
                nextUom = defaultUom;
              } else {
                nextUom = "";
              }
            }
            return {
              ...item,
              item: rawValue,
              uom: nextUom,
            };
          })
        );
        if (groupToFetch) {
          void ensureItemGroupData(groupToFetch);
        }
        return;
      }

      if (field === "quantity") {
        const sanitized = rawValue.replace(/[^0-9.]/g, "");
        setLineItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity: sanitized } : item))
        );
        return;
      }

      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: rawValue } as EditableLineItem : item
        )
      );
    },
    [mode, ensureItemGroupData, itemGroupCache]
  );

  const handleRemoveLine = React.useCallback(
    (id: string) => {
      if (mode === "view") return;
      setLineItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (!next.length) {
          return [createBlankLine()];
        }
        return next;
      });
    },
    [mode]
  );

  // Keep a single trailing blank row so the next line appears automatically during entry.
  React.useEffect(() => {
    if (mode === "view") return;

    if (!lineItems.length) {
      setLineItems([createBlankLine()]);
      return;
    }

    const last = lineItems[lineItems.length - 1];
    if (lineHasAnyData(last)) {
      setLineItems((prev) => {
        if (!prev.length) return [createBlankLine()];
        const currentLast = prev[prev.length - 1];
        if (!lineHasAnyData(currentLast)) return prev;
        return [...prev, createBlankLine()];
      });
      return;
    }

    let trailingBlanks = 0;
    for (let index = lineItems.length - 1; index >= 0; index -= 1) {
      if (!lineHasAnyData(lineItems[index])) trailingBlanks += 1;
      else break;
    }

    if (trailingBlanks > 1) {
      setLineItems((prev) => {
        let blanks = 0;
        for (let index = prev.length - 1; index >= 0; index -= 1) {
          if (!lineHasAnyData(prev[index])) blanks += 1;
          else break;
        }
        if (blanks <= 1) return prev;
        return prev.slice(0, prev.length - (blanks - 1));
      });
    }
  }, [mode, lineItems, setLineItems]);

  const handleFormSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (mode === "view" || pageError || setupError) return;

      if (!lineItemsValid) {
        toast({
          variant: "destructive",
          title: "Line items incomplete",
          description: "Add at least one item and make sure quantity is greater than zero.",
        });
        return;
      }

      const itemsPayload = filledLineItems.map((item) => ({
        item_group: item.itemGroup || undefined,
        item: item.item || undefined,
        quantity: item.quantity || undefined,
        uom: item.uom || undefined,
        item_make: item.itemMake || undefined,
        remarks: item.remarks || undefined,
        department: item.department || undefined,
      }));

      const createPayload = {
        branch: String(values.branch ?? ""),
        indent_type: String(values.indent_type ?? ""),
        expense_type: String(values.expense_type ?? ""),
        date: String(values.date ?? ""),
        indent_no: values.indent_no ? String(values.indent_no) : undefined,
        project: values.project ? String(values.project) : undefined,
        requester: values.requester ? String(values.requester) : undefined,
        remarks: values.remarks ? String(values.remarks) : undefined,
        items: itemsPayload,
      };

      setSaving(true);
      try {
        if (mode === "edit" && requestedId) {
          const updatePayload: Partial<IndentDetails> = {
            id: requestedId,
            branch: createPayload.branch,
            indentType: createPayload.indent_type,
            expenseType: createPayload.expense_type,
            indentDate: createPayload.date,
            project: createPayload.project,
            requester: createPayload.requester,
            remarks: createPayload.remarks,
            lines: filledLineItems.map((item) => ({
              id: item.id,
              department: item.department || undefined,
              itemGroup: item.itemGroup || undefined,
              item: item.item || undefined,
              itemMake: item.itemMake || undefined,
              quantity: item.quantity ? Number(item.quantity) : undefined,
              uom: item.uom || undefined,
              remarks: item.remarks || undefined,
            })),
          };

          await updateIndent(updatePayload);
          toast({ title: "Indent updated" });
          router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(requestedId)}`);
        } else {
          const result = await createIndent(createPayload);
          toast({
            title: result?.message ?? "Indent created",
            description: result?.indent_no ? `Indent No: ${result.indent_no}` : undefined,
          });
          const indentId = result?.indent_id ?? result?.indentId;
          if (indentId) {
            router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(String(indentId))}`);
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to save indent",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setSaving(false);
      }
    },
    [filledLineItems, lineItemsValid, mode, pageError, setupError, requestedId, router]
  );

  const pageTitle = mode === "create" ? "Create Indent" : mode === "edit" ? "Edit Indent" : "Indent Details";
  const subtitle =
    mode === "create"
      ? "Capture header information and line items to raise a new indent."
      : mode === "edit"
      ? "Update the indent before sending it forward."
      : "Review the captured indent information.";

  const branchLabel = React.useMemo(() => {
    const value = String(formValues.branch ?? "");
    const option = branchOptions.find((opt) => opt.value === value);
    return option?.label || indentDetails?.branch || "";
  }, [formValues.branch, branchOptions, indentDetails?.branch]);

  const indentTypeLabel = React.useMemo(() => {
    const value = String(formValues.indent_type ?? "");
    return INDENT_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || indentDetails?.indentType || "";
  }, [formValues.indent_type, indentDetails?.indentType]);

  const expenseTypeLabel = React.useMemo(() => {
    const value = String(formValues.expense_type ?? "");
    return expenseLabelMap.get(value) || indentDetails?.expenseType || "";
  }, [formValues.expense_type, indentDetails?.expenseType, expenseLabelMap]);

  const projectLabel = React.useMemo(() => {
    const value = String(formValues.project ?? "");
    return projectLabelMap.get(value) || indentDetails?.project || "";
  }, [formValues.project, indentDetails?.project, projectLabelMap]);

  const previewItems = React.useMemo(
    () =>
      filledLineItems.map((item, index) => ({
        srNo: index + 1,
        department: labelResolvers.department(item.department),
        itemGroup: labelResolvers.itemGroup(item.itemGroup),
        item: labelResolvers.item(item.itemGroup, item.item),
        itemMake: labelResolvers.itemMake(item.itemGroup, item.itemMake),
        quantity: item.quantity || "-",
        uom: labelResolvers.uom(item.itemGroup, item.item, item.uom),
        remarks: item.remarks || "-",
      })),
    [filledLineItems, labelResolvers]
  );

  const previewHeader = {
    indentNo: (formValues.indent_no as string) || indentDetails?.indentNo,
    indentDate: (formValues.date as string) || indentDetails?.indentDate,
    branch: branchLabel,
    indentType: indentTypeLabel,
    expenseType: expenseTypeLabel,
    project: projectLabel,
    requester: (formValues.requester as string) || indentDetails?.requester,
    status: indentDetails?.status,
    updatedBy: indentDetails?.updatedBy,
    updatedAt: indentDetails?.updatedAt,
  };

  const metadata = React.useMemo<TransactionMetadataItem[]>(() => {
    const items: TransactionMetadataItem[] = [
      { label: "Indent No", value: previewHeader.indentNo || "Pending" },
      { label: "Indent Date", value: previewHeader.indentDate || "-" },
    ];
    if (previewHeader.status) items.push({ label: "Status", value: previewHeader.status });
    if (previewHeader.updatedBy) items.push({ label: "Updated By", value: previewHeader.updatedBy });
    if (previewHeader.updatedAt) {
      items.push({
        label: "Updated At",
        value: new Date(previewHeader.updatedAt).toLocaleString(),
      });
    }
    return items;
  }, [previewHeader.indentNo, previewHeader.indentDate, previewHeader.status, previewHeader.updatedBy, previewHeader.updatedAt]);

  const statusChip = React.useMemo(() => {
    if (!indentDetails?.status) return undefined;
    const normalized = indentDetails.status.toLowerCase();
    let color: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info" = "info";
    if (normalized === "approved") color = "success";
    else if (normalized === "rejected") color = "error";
    return { label: indentDetails.status, color };
  }, [indentDetails?.status]);

  const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
    if (mode === "view" || pageError || setupError) return undefined;
    return [
      {
        label: mode === "create" ? "Create Indent" : "Save Changes",
        onClick: () => formRef.current?.submit(),
        disabled: saving || !lineItemsValid || setupLoading,
        loading: saving,
      },
    ];
  }, [mode, pageError, setupError, saving, lineItemsValid, setupLoading]);

  const secondaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
    if (!requestedId || pageError) return undefined;
    const actions: TransactionAction[] = [];
    if (mode === "view") {
      actions.push({
        label: "Edit",
        variant: "secondary",
        onClick: () => router.replace(`/dashboardportal/procurement/indent/createIndent?mode=edit&id=${encodeURIComponent(requestedId)}`),
      });
    }
    if (mode === "edit") {
      actions.push({
        label: "Cancel",
        variant: "ghost",
        onClick: () => router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(requestedId)}`),
      });
    }
    return actions.length ? actions : undefined;
  }, [mode, requestedId, router, pageError]);

  const alerts = pageError || setupError ? (
    <div className="space-y-2">
      {pageError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      ) : null}
      {setupError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{setupError}</div>
      ) : null}
    </div>
  ) : null;

  return (
    <TransactionWrapper
      title={pageTitle}
      subtitle={subtitle}
      backAction={{ label: "Back", onClick: () => router.back() }}
      metadata={metadata}
      statusChip={statusChip}
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
  loading={loading || setupLoading}
      alerts={alerts}
      preview={
        <IndentPreview
          header={previewHeader}
          items={previewItems}
          remarks={(formValues.remarks as string) || indentDetails?.remarks}
          onPrint={() => toast({ title: "Print coming soon", description: "The printable version will be wired shortly." })}
          onDownload={() => toast({ title: "Download coming soon" })}
          onEmail={() => toast({ title: "Email coming soon" })}
        />
      }
    >
      <div className="space-y-6">
        <MuiForm
          key={formKey}
          ref={formRef}
          schema={schema}
          initialValues={initialValues}
          mode={mode}
          hideModeToggle
          hideSubmit
          onSubmit={handleFormSubmit}
          onValuesChange={setFormValues}
        />

        <LineItemsEditor
          items={lineItems}
          mode={mode}
          onFieldChange={handleLineFieldChange}
          onRemove={handleRemoveLine}
          departmentOptions={departmentOptions}
          itemGroupOptions={itemGroupOptions}
          getItemOptions={getItemOptions}
          getMakeOptions={getMakeOptions}
          getUomOptions={getUomOptions}
          labelResolvers={labelResolvers}
          loadingGroups={itemGroupLoading}
        />

        {mode !== "view" ? (
          <p className="text-xs text-slate-500">
            Tip: Keep quantities greater than zero and fill in the UOM so downstream approval can proceed without delays.
          </p>
        ) : null}
      </div>
    </TransactionWrapper>
  );
}
