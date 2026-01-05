"use client";

/**
 * @hook useJutePOFormState
 * @description Manages form state for Jute PO create/edit/view.
 * Handles form values, initial values, and form key for remounting.
 */

import * as React from "react";
import type { JutePOFormValues, MuiFormMode } from "../types/jutePOTypes";
import { buildDefaultFormValues } from "../utils/jutePOFactories";
import { calculateExpectedDate } from "../utils/jutePOCalculations";

type UseJutePOFormStateParams = {
  mode: MuiFormMode;
};

type UseJutePOFormStateReturn = {
  initialValues: JutePOFormValues;
  setInitialValues: React.Dispatch<React.SetStateAction<JutePOFormValues>>;
  formValues: JutePOFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<JutePOFormValues>>;
  formKey: number;
  bumpFormKey: () => void;
  formRef: React.RefObject<{ submit: () => Promise<void>; isDirty: () => boolean } | null>;
};

export function useJutePOFormState({ mode }: UseJutePOFormStateParams): UseJutePOFormStateReturn {
  const [initialValues, setInitialValues] = React.useState<JutePOFormValues>(buildDefaultFormValues);
  const [formValues, setFormValues] = React.useState<JutePOFormValues>(buildDefaultFormValues);
  const [formKey, setFormKey] = React.useState(0);
  const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>(null);
  const createDefaultsSeededRef = React.useRef(false);

  const bumpFormKey = React.useCallback(() => setFormKey((prev) => prev + 1), []);

  // Seed defaults in create mode
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
      createDefaultsSeededRef.current = true;
    }
  }, [mode]);

  // Auto-calculate expected date when poDate or deliveryTimeline changes
  React.useEffect(() => {
    const { poDate, deliveryTimeline } = formValues;
    const days = Number(deliveryTimeline);
    
    if (poDate && Number.isFinite(days) && days > 0) {
      const expected = calculateExpectedDate(poDate, days);
      setFormValues((prev) => {
        // Only update if actually changed to prevent loops
        if (prev.expectedDate === expected) return prev;
        return { ...prev, expectedDate: expected };
      });
    } else {
      setFormValues((prev) => {
        // Only clear if not already empty
        if (!prev.expectedDate) return prev;
        return { ...prev, expectedDate: "" };
      });
    }
  }, [formValues.poDate, formValues.deliveryTimeline]);

  return {
    initialValues,
    setInitialValues,
    formValues,
    setFormValues,
    formKey,
    bumpFormKey,
    formRef,
  };
}
