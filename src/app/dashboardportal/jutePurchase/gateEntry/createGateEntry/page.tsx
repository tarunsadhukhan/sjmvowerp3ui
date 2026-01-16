"use client";

/**
 * @page JuteGateEntryCreatePage
 * @description Create page for Jute Gate Entry (IN action).
 * Posts data to jute_mr table via the backend API.
 *
 * Fields displayed (from screenshot):
 * - Branch (required, dropdown)
 * - Entry Date (required, date picker)
 * - Entry Time (required, time picker)
 * - Challan No (text input)
 * - Challan Date (date picker)
 * - Vehicle No (required, text input)
 * - Driver Name (required, text input)
 * - Transporter (required, text input)
 *
 * Section below (disabled before IN, except Remarks):
 * - Tare Weight (Kg)
 * - Net Weight (Kg) - calculated/disabled
 * - Variable Shortage (Kg)
 * - Actual Weight (Kg) - disabled
 * - Challan Weight (Kg)
 * - Gross Weight (Kg, required)
 * - Remarks
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowLeft, LogIn } from "lucide-react";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

// =============================================================================
// TYPES
// =============================================================================

type Option = {
  label: string;
  value: string;
};

type BranchRecord = {
  branch_id: number;
  branch_name: string;
};

type SetupData = {
  branches: BranchRecord[];
};

type GateEntryFormValues = {
  branch: string;
  entryDate: string;
  entryTime: string;
  challanNo: string;
  challanDate: string;
  vehicleNo: string;
  driverName: string;
  transporter: string;
  challanWeight: string;
  grossWeight: string;
  tareWeight: string;
  netWeight: string;
  variableShortage: string;
  actualWeight: string;
  remarks: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const buildDefaultFormValues = (): GateEntryFormValues => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM

  return {
    branch: "",
    entryDate: dateStr,
    entryTime: timeStr,
    challanNo: "",
    challanDate: dateStr,
    vehicleNo: "",
    driverName: "",
    transporter: "",
    challanWeight: "",
    grossWeight: "",
    tareWeight: "",
    netWeight: "",
    variableShortage: "",
    actualWeight: "",
    remarks: "",
  };
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function JuteGateEntryCreatePage() {
  const router = useRouter();
  const { coId } = useSelectedCompanyCoId();

  // Page state
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // Setup data
  const [setupData, setSetupData] = React.useState<SetupData | null>(null);

  // Form values
  const [formValues, setFormValues] = React.useState<GateEntryFormValues>(buildDefaultFormValues);

  // Validation errors
  const [errors, setErrors] = React.useState<Partial<Record<keyof GateEntryFormValues, string>>>({});

  // Build branch options
  const branchOptions = React.useMemo<Option[]>(() => {
    if (!setupData?.branches) return [];
    return setupData.branches.map((b) => ({
      label: b.branch_name,
      value: String(b.branch_id),
    }));
  }, [setupData]);

  // Calculate weights whenever gross/tare/shortage changes
  React.useEffect(() => {
    const gross = parseFloat(formValues.grossWeight) || 0;
    const tare = parseFloat(formValues.tareWeight) || 0;
    const shortage = parseFloat(formValues.variableShortage) || 0;

    const net = gross - tare;
    const actual = net - shortage;

    setFormValues((prev) => ({
      ...prev,
      netWeight: net > 0 ? net.toFixed(2) : "",
      actualWeight: actual > 0 ? actual.toFixed(2) : "",
    }));
  }, [formValues.grossWeight, formValues.tareWeight, formValues.variableShortage]);

  // Fetch setup data on mount
  React.useEffect(() => {
    const fetchSetup = async () => {
      if (!coId) return;

      setLoading(true);
      setPageError(null);

      try {
        const response = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_CREATE_SETUP}?co_id=${coId}`,
          "GET"
        );

        if (response?.data) {
          setSetupData({
            branches: response.data.branches ?? [],
          });
        } else if (response?.error) {
          setPageError(response.error);
        }
      } catch (error) {
        console.error("Error fetching setup data:", error);
        setPageError("Failed to load setup data");
      } finally {
        setLoading(false);
      }
    };

    void fetchSetup();
  }, [coId]);

  // Handle field change
  const handleFieldChange = React.useCallback(
    (field: keyof GateEntryFormValues, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      // Clear error when field is edited
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  // Validate form
  const validateForm = React.useCallback((): boolean => {
    const newErrors: Partial<Record<keyof GateEntryFormValues, string>> = {};

    if (!formValues.branch) {
      newErrors.branch = "Branch is required";
    }
    if (!formValues.entryDate) {
      newErrors.entryDate = "Entry Date is required";
    }
    if (!formValues.entryTime) {
      newErrors.entryTime = "Entry Time is required";
    }
    if (!formValues.vehicleNo) {
      newErrors.vehicleNo = "Vehicle No is required";
    }
    if (!formValues.driverName) {
      newErrors.driverName = "Driver Name is required";
    }
    if (!formValues.transporter) {
      newErrors.transporter = "Transporter is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues]);

  // Handle IN submission
  const handleSubmitIN = React.useCallback(async () => {
    if (!coId) {
      setPageError("Company ID not available");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setPageError(null);

    try {
      // Build payload for jute_gate_entry_create
      // Note: For initial IN action, we send minimal data
      // The weight fields and line items are optional for IN
      const payload = {
        co_id: parseInt(coId, 10),
        branch_id: parseInt(formValues.branch, 10),
        jute_gate_entry_date: formValues.entryDate,
        in_time: formValues.entryTime,
        challan_no: formValues.challanNo || "N/A",
        challan_date: formValues.challanDate || formValues.entryDate,
        challan_weight: parseFloat(formValues.challanWeight) || 0,
        vehicle_no: formValues.vehicleNo,
        driver_name: formValues.driverName,
        transporter: formValues.transporter,
        po_id: null,
        jute_uom: "LOOSE", // Default
        mukam_id: 1, // Default - TODO: Make this a dropdown if needed
        jute_supplier_id: 1, // Default - TODO: Make this a dropdown if needed
        party_id: null,
        gross_weight: parseFloat(formValues.grossWeight) || 0,
        tare_weight: parseFloat(formValues.tareWeight) || 0,
        net_weight: parseFloat(formValues.netWeight) || 0,
        variable_shortage: parseFloat(formValues.variableShortage) || 0,
        vehicle_type_id: null,
        marketing_slip: 0,
        remarks: formValues.remarks || null,
        line_items: [], // No line items for gate entry
      };

      const response = await fetchWithCookie(
        apiRoutesPortalMasters.JUTE_GATE_ENTRY_CREATE,
        "POST",
        payload
      );

      if (response?.error) {
        setPageError(response.error);
        return;
      }

      if (response?.data) {
        // Success - navigate back to list
        router.push("/dashboardportal/jutePurchase/gateEntry");
      }
    } catch (error) {
      console.error("Error creating gate entry:", error);
      setPageError("Failed to create gate entry");
    } finally {
      setSaving(false);
    }
  }, [coId, formValues, validateForm, router]);

  // Handle back navigation
  const handleBack = React.useCallback(() => {
    router.push("/dashboardportal/jutePurchase/gateEntry");
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          New Gate Entry
        </Typography>
        <Chip label="New Entry" size="small" variant="outlined" />
      </Box>

      {/* Error Alert */}
      {pageError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPageError(null)}>
          {pageError}
        </Alert>
      )}

      {/* Form Card */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          {/* Row 1: Branch, Entry Date, Entry Time */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Branch */}
            <FormControl fullWidth required error={Boolean(errors.branch)}>
              <InputLabel id="branch-label">Branch</InputLabel>
              <Select
                labelId="branch-label"
                value={formValues.branch}
                label="Branch"
                onChange={(e) => handleFieldChange("branch", e.target.value)}
              >
                {branchOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.branch && <FormHelperText>{errors.branch}</FormHelperText>}
            </FormControl>

            {/* Entry Date */}
            <TextField
              label="Entry Date"
              type="date"
              required
              fullWidth
              value={formValues.entryDate}
              onChange={(e) => handleFieldChange("entryDate", e.target.value)}
              error={Boolean(errors.entryDate)}
              helperText={errors.entryDate}
              InputLabelProps={{ shrink: true }}
            />

            {/* Entry Time */}
            <TextField
              label="Entry Time"
              type="time"
              required
              fullWidth
              value={formValues.entryTime}
              onChange={(e) => handleFieldChange("entryTime", e.target.value)}
              error={Boolean(errors.entryTime)}
              helperText={errors.entryTime}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Row 2: Challan No, Challan Date, Vehicle No */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Challan No */}
            <TextField
              label="Challan No"
              fullWidth
              value={formValues.challanNo}
              onChange={(e) => handleFieldChange("challanNo", e.target.value)}
            />

            {/* Challan Date */}
            <TextField
              label="Challan Date"
              type="date"
              fullWidth
              value={formValues.challanDate}
              onChange={(e) => handleFieldChange("challanDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Vehicle No */}
            <TextField
              label="Vehicle No"
              required
              fullWidth
              value={formValues.vehicleNo}
              onChange={(e) => handleFieldChange("vehicleNo", e.target.value)}
              error={Boolean(errors.vehicleNo)}
              helperText={errors.vehicleNo}
            />
          </Box>

          {/* Row 3: Driver Name, Transporter */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Driver Name */}
            <TextField
              label="Driver Name"
              required
              fullWidth
              value={formValues.driverName}
              onChange={(e) => handleFieldChange("driverName", e.target.value)}
              error={Boolean(errors.driverName)}
              helperText={errors.driverName}
            />

            {/* Transporter */}
            <TextField
              label="Transporter"
              required
              fullWidth
              value={formValues.transporter}
              onChange={(e) => handleFieldChange("transporter", e.target.value)}
              error={Boolean(errors.transporter)}
              helperText={errors.transporter}
            />
          </Box>

          {/* Divider with note */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This section below will be disabled before IN entry. After IN is done, the rest will be
            visible and editable (except Remarks which is always editable).
          </Typography>

          {/* Row 4: Weights - Challan Weight, Gross Weight */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Challan Weight */}
            <TextField
              label="Challan Weight (Kg)"
              type="number"
              fullWidth
              value={formValues.challanWeight}
              onChange={(e) => handleFieldChange("challanWeight", e.target.value)}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            {/* Gross Weight */}
            <TextField
              label="Gross Weight (Kg)"
              type="number"
              required
              fullWidth
              value={formValues.grossWeight}
              onChange={(e) => handleFieldChange("grossWeight", e.target.value)}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Box>

          {/* Row 5: Tare, Net, Shortage, Actual */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Tare Weight */}
            <TextField
              label="Tare Weight (Kg)"
              type="number"
              fullWidth
              value={formValues.tareWeight}
              onChange={(e) => handleFieldChange("tareWeight", e.target.value)}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            {/* Net Weight - Calculated/Disabled */}
            <TextField
              label="Net Weight (Kg)"
              type="number"
              fullWidth
              value={formValues.netWeight}
              disabled
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            {/* Variable Shortage */}
            <TextField
              label="Variable Shortage (Kg)"
              type="number"
              fullWidth
              value={formValues.variableShortage}
              onChange={(e) => handleFieldChange("variableShortage", e.target.value)}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            {/* Actual Weight - Calculated/Disabled */}
            <TextField
              label="Actual Weight (Kg)"
              type="number"
              fullWidth
              value={formValues.actualWeight}
              disabled
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Box>

          {/* Row 6: Remarks */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Remarks"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={formValues.remarks}
              onChange={(e) => handleFieldChange("remarks", e.target.value)}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={18} />}
          onClick={handleBack}
          disabled={saving}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="success"
          endIcon={<LogIn size={18} />}
          onClick={handleSubmitIN}
          disabled={saving}
        >
          {saving ? "Saving..." : "IN"}
        </Button>
      </Box>
    </Box>
  );
}
