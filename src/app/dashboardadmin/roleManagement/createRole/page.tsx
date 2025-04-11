"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import apiRoutes from '@/utils/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';

interface RoleMappingData {
  roles: {
    role_id: number;
    role_name: string;
  }[];
  menus: {
    menu_id: number;
    menu_name: string;
    parent_id: number | null;
    path: string;
    icon: string;
    order: number;
    children?: any[];
  }[];
  flat_menus: {
    menu_id: number;
    menu_name: string;
    path: string;
    menu_path: string;
  }[];
  mappings: {
    mapping_id: number;
    role_id: number;
    menu_id: number;
    access_type_id: number;
  }[];
  access_types: {
    access_type_id: number;
    access_type: string;
  }[];
  table_structure: {
    columns: {
      field: string;
      headerName: string;
      width: number;
    }[];
    rows: {
      id: number;
      role_id: number;
      role_name: string;
      menu_id: number;
      menu_name: string;
      access_type_id: number;
      access_type: string;
    }[];
  };
}

export default function CreateRolePage() {
  const [roleMappingData, setRoleMappingData] = useState<RoleMappingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoleMappingData = async () => {
      try {
        const response = await apiClient<RoleMappingData>({
          url: apiRoutes.GETMENUMAPPINGCOMPANY,
          method: 'GET',
          withCredentials: true,
        });

        if (response.isError) {
          throw new Error(response.error);
        }

        setRoleMappingData(response.data);
      } catch (err) {
        setError((err as Error).message || 'Failed to fetch role mapping data');
        console.error('Error fetching role mapping data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleMappingData();
  }, []);

  const getAccessTypeChipColor = (accessType: string) => {
    switch (accessType) {
      case 'Read':
        return 'info';
      case 'Write':
        return 'warning';
      case 'Full':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role Management
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Roles
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Role ID</TableCell>
                <TableCell>Role Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roleMappingData?.roles.map((role) => (
                <TableRow key={role.role_id}>
                  <TableCell>{role.role_id}</TableCell>
                  <TableCell>{role.role_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Role-Menu Mappings
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {roleMappingData?.table_structure.columns.map((column) => (
                  <TableCell key={column.field} style={{ width: column.width }}>
                    {column.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {roleMappingData?.table_structure.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.role_name}</TableCell>
                  <TableCell>{row.menu_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.access_type} 
                      color={getAccessTypeChipColor(row.access_type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label="Edit" 
                        size="small" 
                        variant="outlined" 
                        onClick={() => console.log('Edit', row.id)} 
                      />
                      <Chip 
                        label="Delete" 
                        size="small" 
                        color="error" 
                        variant="outlined" 
                        onClick={() => console.log('Delete', row.id)} 
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
