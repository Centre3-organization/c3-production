import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Loader2, GripVertical, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  description?: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children?: TypeItem[];
}

interface HierarchicalTypeManagerProps {
  title: string;
  data: TypeItem[];
  isLoading: boolean;
  onCreate: (data: { parentId: number | null; code: string; name: string; nameAr?: string; description?: string; sortOrder?: number }) => void;
  onUpdate: (data: { id: number; parentId?: number | null; code?: string; name?: string; nameAr?: string | null; description?: string | null; sortOrder?: number; isActive?: boolean }) => void;
  onDelete: (id: number) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

// Build tree from flat list
function buildTree(items: TypeItem[]): TypeItem[] {
  const itemMap = new Map<number, TypeItem & { children: TypeItem[] }>();
  const roots: (TypeItem & { children: TypeItem[] })[] = [];

  // First pass: create all nodes with empty children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build the tree
  items.forEach(item => {
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
  const sortChildren = (nodes: TypeItem[]) => {
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

// Flatten tree for parent selection (excluding a node and its descendants)
function flattenForSelect(items: TypeItem[], excludeId?: number): { id: number; name: string; level: number }[] {
  const result: { id: number; name: string; level: number }[] = [];
  
  const traverse = (nodes: TypeItem[], level: number) => {
    for (const node of nodes) {
      if (node.id !== excludeId) {
        result.push({ id: node.id, name: node.name, level });
        if (node.children && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      }
    }
  };
  
  traverse(items, 0);
  return result;
}

interface TreeNodeProps {
  item: TypeItem;
  level: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (item: TypeItem) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}

function TreeNode({ item, level, expandedIds, onToggle, onEdit, onDelete, onAddChild }: TreeNodeProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedIds.has(item.id);

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-[#F5F5F5]/50 rounded-lg group transition-colors",
          level > 0 && "ml-6 border-l-2 border-muted"
        )}
        style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && onToggle(item.id)}
          className={cn(
            "p-1 rounded hover:bg-[#F5F5F5]",
            !hasChildren && "invisible"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
          )}
        </button>

        {/* Code Badge */}
        <Badge variant="outline" className="font-mono text-xs">
          {item.code}
        </Badge>

        {/* Name */}
        <span className="font-medium flex-1">{item.name}</span>

        {/* Arabic Name */}
        {item.nameAr && (
          <span className="text-sm text-[#6B6B6B]" dir="rtl">{item.nameAr}</span>
        )}

        {/* Level Badge */}
        <Badge variant="secondary" className="text-xs">
          L{item.level}
        </Badge>

        {/* Status */}
        <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs">
          {item.isActive ? "Active" : "Inactive"}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(item.id)}
            title="Add child type"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-[#FF6B6B]"
            onClick={() => {
              if (confirm(`Delete "${item.name}"${hasChildren ? " and all its children" : ""}?`)) {
                onDelete(item.id);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map(child => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HierarchicalTypeManager({
  title,
  data,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: HierarchicalTypeManagerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TypeItem | null>(null);
  const [newItem, setNewItem] = useState({
    parentId: null as number | null,
    code: "",
    name: "",
    nameAr: "",
    description: "",
  });

  // Build tree structure
  const treeData = useMemo(() => buildTree(data), [data]);

  // Flatten for parent selection
  const parentOptions = useMemo(() => 
    flattenForSelect(treeData, editingItem?.id),
    [treeData, editingItem?.id]
  );

  const handleToggle = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleExpandAll = () => {
    const allIds = new Set<number>();
    const traverse = (items: TypeItem[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id);
          traverse(item.children);
        }
      });
    };
    traverse(treeData);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleAddChild = (parentId: number) => {
    setNewItem({
      parentId,
      code: "",
      name: "",
      nameAr: "",
      description: "",
    });
    setCreateDialogOpen(true);
  };

  const handleCreate = () => {
    onCreate({
      parentId: newItem.parentId,
      code: newItem.code,
      name: newItem.name,
      nameAr: newItem.nameAr || undefined,
      description: newItem.description || undefined,
    });
    setCreateDialogOpen(false);
    setNewItem({ parentId: null, code: "", name: "", nameAr: "", description: "" });
  };

  const handleEdit = (item: TypeItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    onUpdate({
      id: editingItem.id,
      parentId: editingItem.parentId,
      code: editingItem.code,
      name: editingItem.name,
      nameAr: editingItem.nameAr,
      description: editingItem.description,
      sortOrder: editingItem.sortOrder,
      isActive: editingItem.isActive,
    });
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  // Get parent name for display
  const getParentName = (parentId: number | null): string => {
    if (parentId === null) return "None (Root Level)";
    const parent = data.find(d => d.id === parentId);
    return parent ? parent.name : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-[#5B2C93]" />
          <h3 className="text-lg font-medium">{title}</h3>
          <Badge variant="outline">{data.length} items</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            Collapse All
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#5B2C93] hover:bg-[#5B2C93] gap-2">
                <Plus className="h-4 w-4" /> Add {title.replace(/s$/, "")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <DialogHeader>
                  <DialogTitle>Add New {title.replace(/s$/, "")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Parent Selection */}
                  <div className="space-y-2">
                    <Label>Parent Type</Label>
                    <Select
                      value={newItem.parentId?.toString() || "root"}
                      onValueChange={(v) => setNewItem({ ...newItem, parentId: v === "root" ? null : parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent (or leave as root)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">None (Root Level)</SelectItem>
                        {parentOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>
                            {"—".repeat(opt.level)} {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Input
                        placeholder="e.g. ADMIN"
                        value={newItem.code}
                        onChange={(e) => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (English) *</Label>
                      <Input
                        placeholder="e.g. Administrative"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Name (Arabic)</Label>
                    <Input
                      placeholder="e.g. إداري"
                      value={newItem.nameAr}
                      onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Optional description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#5B2C93] hover:bg-[#5B2C93]" disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tree View */}
      <div className="border rounded-lg p-2 bg-white">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-[#6B6B6B]">
            No {title.toLowerCase()} found. Click "Add {title.replace(/s$/, "")}" to create one.
          </div>
        ) : (
          <div className="space-y-1">
            {treeData.map(item => (
              <TreeNode
                key={item.id}
                item={item}
                level={0}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={onDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <DialogHeader>
              <DialogTitle>Edit {title.replace(/s$/, "")}</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="grid gap-4 py-4">
                {/* Parent Selection */}
                <div className="space-y-2">
                  <Label>Parent Type</Label>
                  <Select
                    value={editingItem.parentId?.toString() || "root"}
                    onValueChange={(v) => setEditingItem({ ...editingItem, parentId: v === "root" ? null : parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">None (Root Level)</SelectItem>
                      {parentOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id.toString()}>
                          {"—".repeat(opt.level)} {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={editingItem.code}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (English)</Label>
                    <Input
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Name (Arabic)</Label>
                  <Input
                    value={editingItem.nameAr || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editingItem.sortOrder}
                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingItem.isActive}
                    onCheckedChange={(c) => setEditingItem({ ...editingItem, isActive: c })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5B2C93] hover:bg-[#5B2C93]" disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
