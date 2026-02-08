import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function MaterialTypes() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { data: materialTypes, isLoading, refetch } =
    trpc.masterData.getAllMaterialTypes.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    code: "",
    description: "",
    displayOrder: 0,
  });

  const createMutation = trpc.masterData.createMaterialType.useMutation({
    onSuccess: () => {
      toast.success("Material type created successfully");
      refetch();
      setNewDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.masterData.updateMaterialType.useMutation({
    onSuccess: () => {
      toast.success("Material type updated successfully");
      refetch();
      setEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.masterData.deleteMaterialType.useMutation({
    onSuccess: () => {
      toast.success("Material type deactivated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ name: "", nameAr: "", code: "", description: "", displayOrder: 0 });
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameAr: item.nameAr || "",
      code: item.code,
      description: item.description || "",
      displayOrder: item.displayOrder || 0,
    });
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and Code are required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, ...formData });
  };

  const handleExport = () => {
    if (!materialTypes?.length) return;
    const headers = ["ID", "Code", "Name", "Name (AR)", "Description", "Status", "Order"];
    const rows = materialTypes.map((m) => [
      m.id,
      m.code,
      m.name,
      m.nameAr || "",
      m.description || "",
      m.isActive ? "Active" : "Inactive",
      m.displayOrder,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "material_types.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const filtered = (materialTypes || []).filter((m) => {
    if (!showInactive && !m.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = (materialTypes || []).filter((m) => m.isActive).length;
  const totalCount = (materialTypes || []).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] flex items-center gap-2">
            <Package className="h-7 w-7 text-[#5B2C93]" />
            Material Types
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Manage material types for MHV and inventory tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!materialTypes?.length}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={() => { resetForm(); setNewDialogOpen(true); }} className="bg-[#5B2C93] hover:bg-[#5B2C93]">
            <Plus className="h-4 w-4 mr-1" />
            Add Material Type
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-medium text-[#5B2C93]">{totalCount}</div>
            <div className="text-xs text-[#6B6B6B]">Total Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-medium text-[#4ECDC4]">{activeCount}</div>
            <div className="text-xs text-[#6B6B6B]">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-medium text-[#B0B0B0]">{totalCount - activeCount}</div>
            <div className="text-xs text-[#6B6B6B]">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B0B0]" />
              <Input
                placeholder="Search by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6B6B6B]">
              <Package className="h-12 w-12 mb-3 text-[#B0B0B0]" />
              <p className="font-medium">No material types found</p>
              <p className="text-sm">Add a new material type to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Name (AR)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                    <TableCell className="text-[#6B6B6B]">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-[#6B6B6B]">{item.nameAr || "—"}</TableCell>
                    <TableCell className="text-[#6B6B6B] text-sm max-w-[200px] truncate">
                      {item.description || "—"}
                    </TableCell>
                    <TableCell className="text-[#6B6B6B]">{item.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-[#E8F9F8] text-[#4ECDC4]" : ""}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {item.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#FF6B6B] hover:text-[#FF6B6B]"
                            onClick={() => {
                              if (confirm("Are you sure you want to deactivate this material type?")) {
                                deleteMutation.mutate({ id: item.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Material Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cabinet/Rack"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CABINET_RACK"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Name (Arabic)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="Arabic name (optional)"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description (optional)"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-[#5B2C93] hover:bg-[#5B2C93]">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Material Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Name (Arabic)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B6B6B] uppercase">Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-[#5B2C93] hover:bg-[#5B2C93]">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
