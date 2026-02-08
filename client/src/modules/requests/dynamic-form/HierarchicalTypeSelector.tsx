import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TypeItem {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  nameAr?: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
}

interface HierarchicalTypeSelectorProps {
  label: string;
  types: TypeItem[];
  value: number | null;
  onChange: (id: number | null, path: number[]) => void;
  placeholder?: string;
  required?: boolean;
  isRTL?: boolean;
}

// Build tree from flat list
function buildTree(items: TypeItem[]): (TypeItem & { children: (TypeItem & { children: any[] })[] })[] {
  const itemMap = new Map<number, TypeItem & { children: any[] }>();
  const roots: (TypeItem & { children: any[] })[] = [];

  // First pass: create all nodes with empty children arrays
  items.filter(i => i.isActive).forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build the tree
  items.filter(i => i.isActive).forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId === null) {
      roots.push(node);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  // Sort children by sortOrder
  const sortChildren = (nodes: any[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };
  sortChildren(roots);

  return roots;
}

// Get path from root to a node
function getPathToNode(items: TypeItem[], targetId: number): number[] {
  const path: number[] = [];
  let currentId: number | null = targetId;
  
  while (currentId !== null) {
    path.unshift(currentId);
    const item = items.find(i => i.id === currentId);
    currentId = item?.parentId ?? null;
  }
  
  return path;
}

// Get children of a parent (or root items if parentId is null)
function getChildren(items: TypeItem[], parentId: number | null): TypeItem[] {
  return items
    .filter(i => i.isActive && i.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Get max depth of the tree
function getMaxDepth(items: TypeItem[]): number {
  return Math.max(0, ...items.map(i => i.level)) + 1;
}

export function HierarchicalTypeSelector({
  label,
  types,
  value,
  onChange,
  placeholder = "Select...",
  required = false,
  isRTL = false,
}: HierarchicalTypeSelectorProps) {
  // Get the current selection path
  const selectionPath = useMemo(() => {
    if (value === null) return [];
    return getPathToNode(types, value);
  }, [types, value]);

  // Get max depth
  const maxDepth = useMemo(() => getMaxDepth(types), [types]);

  // Build cascading selectors based on current selection
  const cascadeSelectors = useMemo(() => {
    const selectors: { level: number; parentId: number | null; options: TypeItem[]; selectedId: number | null }[] = [];
    
    // Always show root level
    const rootOptions = getChildren(types, null);
    if (rootOptions.length === 0) return selectors;
    
    selectors.push({
      level: 0,
      parentId: null,
      options: rootOptions,
      selectedId: selectionPath[0] ?? null,
    });

    // Add subsequent levels based on selection
    for (let i = 0; i < selectionPath.length; i++) {
      const selectedId = selectionPath[i];
      const children = getChildren(types, selectedId);
      
      if (children.length > 0) {
        selectors.push({
          level: i + 1,
          parentId: selectedId,
          options: children,
          selectedId: selectionPath[i + 1] ?? null,
        });
      }
    }

    return selectors;
  }, [types, selectionPath]);

  const handleSelectChange = (level: number, selectedId: number | null) => {
    if (selectedId === null) {
      // Clear selection at this level and below
      if (level === 0) {
        onChange(null, []);
      } else {
        const newPath = selectionPath.slice(0, level);
        onChange(newPath[newPath.length - 1], newPath);
      }
    } else {
      // Update selection
      const newPath = [...selectionPath.slice(0, level), selectedId];
      
      // Check if this item has children - if not, it's the final selection
      const children = getChildren(types, selectedId);
      if (children.length === 0) {
        // This is a leaf node - final selection
        onChange(selectedId, newPath);
      } else {
        // Has children - update path but don't finalize
        onChange(selectedId, newPath);
      }
    }
  };

  // Get display name for selected value
  const getDisplayName = (item: TypeItem) => {
    if (isRTL && item.nameAr) return item.nameAr;
    return item.name;
  };

  // Get level label
  const getLevelLabel = (level: number) => {
    const labels = ["Category", "Type", "Sub-Type", "Detail"];
    return labels[level] || `Level ${level + 1}`;
  };

  // Check if current selection is complete (leaf node selected)
  const isComplete = useMemo(() => {
    if (value === null) return false;
    const children = getChildren(types, value);
    return children.length === 0;
  }, [types, value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className={required ? "after:content-['*'] after:text-[#FF6B6B] after:ml-0.5" : ""}>
          {label}
        </Label>
        {isComplete && (
          <Badge variant="outline" className="text-[#059669] border-[#059669]">
            <Check className="h-3 w-3 mr-1" />
            Selected
          </Badge>
        )}
      </div>

      {/* Cascading Selectors */}
      <div className="space-y-2">
        {cascadeSelectors.map((selector, index) => (
          <div key={selector.level} className="flex items-center gap-2">
            {/* Indentation indicator */}
            {index > 0 && (
              <div className="flex items-center text-[#6B6B6B]">
                <ChevronRight className="h-4 w-4" />
              </div>
            )}
            
            <div className="flex-1">
              <Select
                value={selector.selectedId?.toString() || ""}
                onValueChange={(v) => handleSelectChange(selector.level, v ? parseInt(v) : null)}
              >
                <SelectTrigger className={cn(index > 0 && "ml-2")}>
                  <SelectValue placeholder={`Select ${getLevelLabel(selector.level)}...`} />
                </SelectTrigger>
                <SelectContent>
                  {selector.options.map((option) => {
                    const hasChildren = getChildren(types, option.id).length > 0;
                    return (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {option.code}
                          </Badge>
                          <span>{getDisplayName(option)}</span>
                          {hasChildren && (
                            <ChevronRight className="h-3 w-3 text-[#6B6B6B] ml-auto" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Path Display */}
      {selectionPath.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-[#6B6B6B] flex-wrap">
          {selectionPath.map((id, index) => {
            const item = types.find(t => t.id === id);
            if (!item) return null;
            return (
              <span key={id} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                <span className={cn(index === selectionPath.length - 1 && "font-medium text-[#2C2C2C]")}>
                  {getDisplayName(item)}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
