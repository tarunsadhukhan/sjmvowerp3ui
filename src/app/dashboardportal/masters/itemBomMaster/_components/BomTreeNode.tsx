"use client";

import React from "react";
import { Box, IconButton, Typography, Tooltip, Chip } from "@mui/material";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Package, Box as BoxIcon } from "lucide-react";

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

type BomTreeNodeProps = {
  node: BomTreeItem;
  level: number;
  expanded: Record<number, boolean>;
  onToggle: (itemId: number) => void;
  onAddChild: (parentItemId: number) => void;
  onEdit: (node: BomTreeItem) => void;
  onRemove: (node: BomTreeItem) => void;
};

export default function BomTreeNode({
  node,
  level,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onRemove,
}: BomTreeNodeProps) {
  const isExpanded = expanded[node.child_item_id] || false;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          py: 0.75,
          px: 1,
          ml: level * 3,
          borderRadius: 1,
          "&:hover": { bgcolor: "action.hover" },
          "&:hover .bom-actions": { opacity: 1 },
        }}
      >
        {/* Expand/Collapse toggle */}
        <Box
          sx={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: hasChildren ? "pointer" : "default", mr: 0.5 }}
          onClick={() => hasChildren && onToggle(node.child_item_id)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </Box>

        {/* Item icon */}
        {hasChildren ? (
          <Package size={16} style={{ marginRight: 8, color: "#1976d2" }} />
        ) : (
          <BoxIcon size={16} style={{ marginRight: 8, color: "#666" }} />
        )}

        {/* Item info */}
        <Typography variant="body2" sx={{ fontWeight: hasChildren ? 600 : 400, mr: 1 }}>
          {node.child_item_code}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mr: 1 }}>
          {node.child_item_name}
        </Typography>

        {/* Qty + UOM chip */}
        <Chip
          label={`${node.qty} ${node.uom_name || ""}`}
          size="small"
          variant="outlined"
          sx={{ mr: 1, fontSize: "0.75rem" }}
        />

        {/* Action buttons (visible on hover) */}
        <Box className="bom-actions" sx={{ opacity: 0, transition: "opacity 0.2s", display: "flex", gap: 0.25 }}>
          {hasChildren || !node.is_leaf ? (
            <Tooltip title="Add child component">
              <IconButton size="small" onClick={() => onAddChild(node.child_item_id)}>
                <Plus size={14} />
              </IconButton>
            </Tooltip>
          ) : null}
          <Tooltip title="Edit qty / UOM">
            <IconButton size="small" onClick={() => onEdit(node)}>
              <Pencil size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove component">
            <IconButton size="small" color="error" onClick={() => onRemove(node)}>
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <BomTreeNode
              key={child.bom_id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
