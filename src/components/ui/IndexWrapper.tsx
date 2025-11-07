"use client";

import React, { useMemo } from "react";
import { Box, TextField, Tooltip, IconButton, Typography } from "@mui/material";
import { GridColDef, GridPaginationModel, GridRenderCellParams, GridValidRowModel } from "@mui/x-data-grid";
import { usePathname } from "next/navigation";
import { Eye, Edit } from "lucide-react";
import MuiDataGrid from "./muiDataGrid";
import { Button } from "./button";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";

export type IndexWrapperSearchConfig = {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

type CreateActionConfig = {
  label?: string;
  onClick: () => void;
  allowed?: boolean;
};

type BaseColumn<RowType extends GridValidRowModel> = GridColDef<RowType>;

type CommonGridProps<RowType extends GridValidRowModel> = {
  rows: RowType[];
  columns: BaseColumn<RowType>[];
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  loading?: boolean;
  showLoadingUntilLoaded?: boolean;
};

type IndexWrapperProps<RowType extends GridValidRowModel & { id?: string | number }> = CommonGridProps<RowType> & {
  title: string;
  subtitle?: string;
  search?: IndexWrapperSearchConfig;
  createAction?: CreateActionConfig;
  onView?: (row: RowType) => void;
  onEdit?: (row: RowType) => void;
  toolbarContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

function IndexWrapper<RowType extends GridValidRowModel & { id?: string | number }>({
  title,
  subtitle,
  rows,
  columns,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  loading = false,
  showLoadingUntilLoaded = false,
  search,
  createAction,
  onView,
  onEdit,
  toolbarContent,
  children,
  className,
  contentClassName,
}: IndexWrapperProps<RowType>) {
  const { hasMenuAccess } = useSidebarContext();
  const pathname = usePathname();

  const canView = useMemo(() => hasMenuAccess(pathname, "view"), [hasMenuAccess, pathname]);
  const canEdit = useMemo(() => hasMenuAccess(pathname, "edit"), [hasMenuAccess, pathname]);
  const canCreate = useMemo(() => hasMenuAccess(pathname, "create"), [hasMenuAccess, pathname]);

  const actionColumn = useMemo<BaseColumn<RowType> | undefined>(() => {
    const showEdit = Boolean(onEdit) && canEdit;
    const showView = Boolean(onView) && !showEdit && canView;

    if (!showEdit && !showView) {
      return undefined;
    }

    return {
      field: "__actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<RowType>) => {
        const row = params.row;
        if (showEdit) {
          return (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit?.(row)}>
                <Edit size={16} />
              </IconButton>
            </Tooltip>
          );
        }
        if (showView) {
          return (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => onView?.(row)}>
                <Eye size={16} />
              </IconButton>
            </Tooltip>
          );
        }
        return null;
      },
    } satisfies BaseColumn<RowType>;
  }, [canEdit, canView, onEdit, onView]);

  const finalColumns = useMemo<BaseColumn<RowType>[]>(() => {
    if (!actionColumn) {
      return columns;
    }
    return [actionColumn, ...columns];
  }, [actionColumn, columns]);

  const createAllowed = createAction ? (createAction.allowed ?? canCreate) : false;

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${className ?? ""}`}>
      <div className={`mx-auto ${contentClassName ?? "max-w-7xl"}`}>
        <div className="mb-6 flex flex-col gap-2">
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </div>

        {(search || createAllowed || toolbarContent) && (
          <Box className="mb-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
            {toolbarContent ? <Box className="flex flex-wrap items-center gap-3">{toolbarContent}</Box> : <span />}
            <Box className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {search ? (
                <TextField
                  size="small"
                  value={search.value}
                  onChange={search.onChange}
                  placeholder={search.placeholder ?? "Search"}
                />
              ) : null}
              {createAction && createAllowed ? (
                <Button onClick={createAction.onClick}>
                  {createAction.label ?? "Create"}
                </Button>
              ) : null}
            </Box>
          </Box>
        )}

        <MuiDataGrid
          rows={rows}
          columns={finalColumns}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          loading={loading}
          showLoadingUntilLoaded={showLoadingUntilLoaded}
        />

        {children}
      </div>
    </div>
  );
}

export default IndexWrapper;
