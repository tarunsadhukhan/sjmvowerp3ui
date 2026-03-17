"use client";

import React from "react";
import { Box, Typography, LinearProgress, IconButton } from "@mui/material";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tokens } from "@/styles/tokens";
import type { WizardStep } from "../../types/employeeTypes";

// ─── Action button definitions ─────────────────────────────────────

interface ActionButtonDef {
  label: string;
  className: "danger" | "success";
}

const ACTION_BUTTONS: ActionButtonDef[] = [
  { label: "BlackList", className: "danger" },
  { label: "Terminate", className: "danger" },
  { label: "Resign", className: "success" },
  { label: "Retire", className: "success" },
];

const ACTION_COLORS: Record<string, string> = {
  danger: "#E91E63",
  success: tokens.brand.primary,
};

// ─── Props ─────────────────────────────────────────────────────────

interface StepOverviewProps {
  steps: readonly WizardStep[];
  completedSteps: Set<number>;
  progress: number;
  mode: "create" | "edit" | "view";
  ebId: number | null;
  onStepClick: (stepIndex: number) => void;
  onActionClick?: (action: string) => void;
  onBack: () => void;
}

// ─── Step Card ─────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  isCompleted,
  onClick,
}: {
  step: WizardStep;
  index: number;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors"
    >
      <Box className="flex items-center gap-4">
        {/* Step indicator circle */}
        {isCompleted ? (
          <Box
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            sx={{ backgroundColor: tokens.brand.primary }}
          >
            <Check className="w-5 h-5 text-white" />
          </Box>
        ) : (
          <Box
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
            sx={{ borderColor: tokens.neutral[200], color: tokens.neutral[500] }}
          >
            <Typography variant="body2" fontWeight={600}>
              {index + 1}
            </Typography>
          </Box>
        )}

        {/* Step text */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {step.step_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step.description}
          </Typography>
        </Box>
      </Box>

      {/* Right side: optional button + arrow */}
      <Box className="flex items-center gap-3 shrink-0">
        {step.rightButton && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); }}>
            {step.rightButton}
          </Button>
        )}
        <IconButton
          onClick={onClick}
          aria-label={`Navigate to ${step.step_name}`}
          sx={{
            border: `1px solid ${tokens.neutral[200]}`,
            width: 36,
            height: 36,
          }}
        >
          <ChevronRight className="w-5 h-5" style={{ color: tokens.neutral[500] }} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── Main component ────────────────────────────────────────────────

export default function StepOverview({
  steps,
  completedSteps,
  progress,
  mode,
  ebId,
  onStepClick,
  onActionClick,
  onBack,
}: StepOverviewProps) {
  const title = mode === "create" ? "Add Employee" : mode === "edit" ? "Edit Employee" : "View Employee";

  return (
    <Box className="flex flex-col gap-0">
      {/* ── Header row ─────────────────────────────────────────── */}
      <Box className="flex items-start justify-between px-6 pt-6 pb-2">
        {/* Left: back arrow + title */}
        <Box className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1 }}>
            {"<"}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: tokens.brand.secondary }}>
            {title}
          </Typography>
        </Box>

        {/* Right: progress bar */}
        <Box className="flex flex-col items-end" sx={{ minWidth: 220 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Completed
          </Typography>
          <Box className="flex items-center gap-2 w-full">
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                backgroundColor: tokens.neutral[200],
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundColor: tokens.brand.primary,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Subtitle + action buttons row ──────────────────────── */}
      <Box className="flex items-center justify-between px-6 pb-4">
        <Typography variant="body2" color="text.secondary">
          Complete the steps below to add employee to your organisation
        </Typography>

        {/* Action buttons (only show when editing/viewing existing employee) */}
        {ebId && mode !== "create" && (
          <Box className="flex items-center gap-2">
            {ACTION_BUTTONS.map((btn) => (
              <Button
                key={btn.label}
                size="sm"
                onClick={() => onActionClick?.(btn.label)}
                style={{
                  backgroundColor: ACTION_COLORS[btn.className],
                  color: "#fff",
                  borderColor: ACTION_COLORS[btn.className],
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Step cards ─────────────────────────────────────────── */}
      <Box className="rounded-lg border bg-white shadow-sm mx-6 mb-6 overflow-hidden">
        {steps.map((step, idx) => (
          <StepCard
            key={step.step_id}
            step={step}
            index={idx}
            isCompleted={completedSteps.has(idx)}
            onClick={() => onStepClick(idx)}
          />
        ))}
      </Box>
    </Box>
  );
}
