import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import React from 'react';

interface MuiDataGridProps {
  rows: unknown[];
  columns: GridColDef[];
  rowCount: number;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  loading?: boolean;
  paginationModel?: GridPaginationModel;
  pageSizeOptions?: number[];
  paginationMode?: 'client' | 'server';
  disableRowSelectionOnClick?: boolean;
  showLoadingUntilLoaded?: boolean; // NEW: force loading until explicitly set to false
}

const MuiDataGrid: React.FC<MuiDataGridProps> = ({
  rows,
  columns,
  rowCount,
  onPaginationModelChange,
  loading = false,
  paginationModel = { page: 0, pageSize: 10 },
  pageSizeOptions = [10, 20, 50],
  paginationMode = 'server',
  disableRowSelectionOnClick = true,
  showLoadingUntilLoaded = false,
}) => {
  // If showLoadingUntilLoaded is true, use the loading prop from parent; otherwise, fallback to default behavior
  const effectiveLoading = showLoadingUntilLoaded ? loading : false;
  return (
    <Box sx={{
      height: 500,
      width: '100%',
      '& .MuiDataGrid-root': {
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      },
      '& .MuiDataGrid-cell:focus': {
        outline: 'none'
      }
    }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id ?? row.co_id}
        loading={showLoadingUntilLoaded ? loading : false}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={pageSizeOptions}
        paginationMode={paginationMode}
        rowCount={rowCount}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        pagination
        sx={{
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#3ea6da',
            color: 'white',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
          }
        }}
      />
    </Box>
  );
};

export default MuiDataGrid;
