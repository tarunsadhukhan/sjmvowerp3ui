"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  Autocomplete,
  TextField,
} from "@mui/material";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import BomTreeNode from "./BomTreeNode";
import AddComponentDialog from "./AddComponentDialog";

type BomTreeItem = {
  bom_id: number;
  parent_item_id: number;
  child_item_id: number;
  child_item_code: string;
  child_item_name: string;
  qty: number;
  uom_id: number;
  uom_name: string;
  sequence_no: number;
  has_children: boolean;
  is_leaf: boolean;
  children: BomTreeItem[];
};

type BomTreeEditorProps = {
  open: boolean;
  onClose: () => void;
  item: { item_id: number; item_code: string; item_name: string } | null;
  onSnackbar: (message: string, severity: "success" | "error") => void;
};

export default function BomTreeEditor({ open, onClose, item, onSnackbar }: BomTreeEditorProps) {
  const [tree, setTree] = useState<BomTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentItemId, setAddParentItemId] = useState<number | null>(null);
  const [editingNode, setEditingNode] = useState<BomTreeItem | null>(null);

  // For "Define BOM" mode: pick an item first
  const [itemPickerMode, setItemPickerMode] = useState(false);
  const [itemOptions, setItemOptions] = useState<any[]>([]);
  const [selectedRootItem, setSelectedRootItem] = useState<any | null>(null);
  const [itemSearchValue, setItemSearchValue] = useState("");

  const getCoId = () => {
    const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
    return selectedCompany ? JSON.parse(selectedCompany).co_id : "";
  };

  const fetchTree = useCallback(async (itemId: number) => {
    setLoading(true);
    try {
      const co_id = getCoId();
      const params = new URLSearchParams({ co_id, item_id: String(itemId) });
      const { data, error } = await fetchWithCookie(
        `${apiRoutesPortalMasters.BOM_TREE}?${params}`,
        "GET"
      );
      if (error || !data) throw new Error(error || "Failed to fetch BOM tree");
      setTree(data.data || []);
      // Auto-expand first level
      const initialExpanded: Record<number, boolean> = {};
      (data.data || []).forEach((node: BomTreeItem) => {
        if (!node.is_leaf) initialExpanded[node.child_item_id] = true;
      });
      setExpanded(initialExpanded);
    } catch (err: any) {
      onSnackbar(err.message || "Failed to load BOM tree", "error");
    } finally {
      setLoading(false);
    }
  }, [onSnackbar]);

  useEffect(() => {
    if (open && item) {
      setItemPickerMode(false);
      setSelectedRootItem(item);
      fetchTree(item.item_id);
    } else if (open && !item) {
      setItemPickerMode(true);
      setTree([]);
      setSelectedRootItem(null);
    }
  }, [open, item, fetchTree]);

  // Search items for the item picker
  useEffect(() => {
    if (!itemPickerMode) return;
    const searchItems = async () => {
      const co_id = getCoId();
      const params = new URLSearchParams({ co_id });
      if (itemSearchValue) params.append("search", itemSearchValue);
      const { data } = await fetchWithCookie(
        `${apiRoutesPortalMasters.BOM_CREATE_SETUP}?${params}`,
        "GET"
      );
      if (data?.items) setItemOptions(data.items);
    };
    const timeout = setTimeout(searchItems, 300);
    return () => clearTimeout(timeout);
  }, [itemPickerMode, itemSearchValue]);

  const handleToggle = (itemId: number) => {
    setExpanded(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleAddChild = (parentItemId: number) => {
    setAddParentItemId(parentItemId);
    setEditingNode(null);
    setAddDialogOpen(true);
  };

  const handleEdit = (node: BomTreeItem) => {
    setEditingNode(node);
    setAddParentItemId(null);
    setAddDialogOpen(true);
  };

  const handleRemove = async (node: BomTreeItem) => {
    try {
      const co_id = getCoId();
      const { error } = await fetchWithCookie(
        apiRoutesPortalMasters.BOM_REMOVE_COMPONENT,
        "POST",
        { bom_id: node.bom_id, co_id: parseInt(co_id) }
      );
      if (error) throw new Error(error);
      onSnackbar("Component removed", "success");
      if (selectedRootItem) fetchTree(selectedRootItem.item_id);
    } catch (err: any) {
      onSnackbar(err.message || "Failed to remove component", "error");
    }
  };

  const handleDialogSubmit = async () => {
    setAddDialogOpen(false);
    if (selectedRootItem) fetchTree(selectedRootItem.item_id);
  };

  const handleSelectRootItem = (newValue: any) => {
    if (newValue) {
      setSelectedRootItem(newValue);
      setItemPickerMode(false);
      fetchTree(newValue.item_id);
    }
  };

  const rootItemId = selectedRootItem?.item_id ?? item?.item_id;
  const rootLabel = selectedRootItem
    ? `${selectedRootItem.item_code} — ${selectedRootItem.item_name}`
    : item
    ? `${item.item_code} — ${item.item_name}`
    : "";

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "60vh" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Item BOM {rootLabel ? `— ${rootLabel}` : ""}</span>
        </DialogTitle>
        <DialogContent dividers>
          {itemPickerMode ? (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Select an item to define or view its BOM:
              </Typography>
              <Autocomplete
                options={itemOptions}
                getOptionLabel={(opt: any) => `${opt.item_code} — ${opt.item_name}`}
                onChange={(_, newValue) => handleSelectRootItem(newValue)}
                onInputChange={(_, value) => setItemSearchValue(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Item" placeholder="Type to search..." size="small" autoFocus />
                )}
                isOptionEqualToValue={(opt, val) => opt.item_id === val.item_id}
              />
            </Box>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              {tree.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No components defined yet. Click &quot;Add Component&quot; to get started.
                </Typography>
              ) : (
                tree.map((node) => (
                  <BomTreeNode
                    key={node.bom_id}
                    node={node}
                    level={0}
                    expanded={expanded}
                    onToggle={handleToggle}
                    onAddChild={handleAddChild}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                  />
                ))
              )}
              {rootItemId && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => handleAddChild(rootItemId)}
                >
                  + Add Component
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <AddComponentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        parentItemId={addParentItemId}
        editNode={editingNode}
        onSnackbar={onSnackbar}
      />
    </>
  );
}
