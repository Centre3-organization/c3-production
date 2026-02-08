import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderTree,
  FileType,
  LayoutList,
  FormInput,
  ChevronRight,
  Eye,
  Repeat,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldOptionsEditor, FieldOption } from "./components/FieldOptionsEditor";
import { FormPreview } from "./components/FormPreview";
import { ConditionBuilder, ShowCondition, parseCondition, stringifyCondition, AvailableField } from "./components/ConditionBuilder";

type Category = {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  description: string | null;
  icon: string | null;
  allowMultipleTypes: boolean;
  isActive: boolean;
};

type RequestType = {
  id: number;
  categoryId: number;
  code: string;
  name: string;
  nameAr: string;
  shortCode: string;
  description: string | null;
  isExclusive: boolean;
  maxDurationDays: number;
  sortOrder: number;
  isActive: boolean;
};

type FormSection = {
  id: number;
  requestTypeId: number;
  code: string;
  name: string;
  nameAr: string;
  icon: string | null;
  displayOrder: number;
  isRepeatable: boolean;
  minItems: number | null;
  maxItems: number | null;
  isActive: boolean;
};

type FormField = {
  id: number;
  sectionId: number;
  code: string;
  name: string;
  nameAr: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  columnSpan: number;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  options: any;
  optionsSource: string | null;
  filterByField: string | null;
  showCondition: any;
  isActive: boolean;
};

// Sortable item component for sections
function SortableSectionItem({
  section,
  onClick,
  onEdit,
}: {
  section: FormSection;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab hover:bg-[#F5F5F5] p-1 rounded"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-[#6B6B6B]" />
        </button>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <LayoutList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">{section.name}</div>
          <div className="text-sm text-[#6B6B6B]">Order: {section.displayOrder}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {section.isRepeatable && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            Repeatable ({section.minItems || 1}-{section.maxItems || "∞"})
          </Badge>
        )}
        <Badge variant={section.isActive ? "default" : "outline"}>
          {section.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
      </div>
    </div>
  );
}

// Sortable item component for fields
function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: FormField;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab hover:bg-[#F5F5F5] p-1 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-[#6B6B6B]" />
        </button>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FormInput className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">{field.name}</div>
          <div className="text-sm text-[#6B6B6B]">{field.fieldType} · {field.code}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {field.isRequired && <Badge variant="destructive">Required</Badge>}
        <Badge variant="outline">Col {field.columnSpan}</Badge>
        <Badge variant={field.isActive ? "default" : "outline"}>
          {field.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function RequestTypeConfig() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Field options state
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<string>("text");
  const [showCondition, setShowCondition] = useState<ShowCondition>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string>("static");
  const [filterByField, setFilterByField] = useState<string>("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: categories, refetch: refetchCategories } = trpc.requestConfig.categories.list.useQuery();
  const { data: types, refetch: refetchTypes } = trpc.requestConfig.types.list.useQuery(
    { categoryId: selectedCategory?.id },
    { enabled: !!selectedCategory }
  );
  const { data: sections, refetch: refetchSections } = trpc.requestConfig.sections.list.useQuery(
    { requestTypeId: selectedType?.id! },
    { enabled: !!selectedType }
  );
  const { data: fields, refetch: refetchFields } = trpc.requestConfig.fields.list.useQuery(
    { sectionId: selectedSection?.id! },
    { enabled: !!selectedSection }
  );

  // Mutations
  const createCategory = trpc.requestConfig.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created successfully");
      refetchCategories();
      setCategoryDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCategory = trpc.requestConfig.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated successfully");
      refetchCategories();
      setCategoryDialogOpen(false);
      setEditingItem(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const createType = trpc.requestConfig.types.create.useMutation({
    onSuccess: () => {
      toast.success("Request type created successfully");
      refetchTypes();
      setTypeDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateType = trpc.requestConfig.types.update.useMutation({
    onSuccess: () => {
      toast.success("Request type updated successfully");
      refetchTypes();
      setTypeDialogOpen(false);
      setEditingItem(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const createSection = trpc.requestConfig.sections.create.useMutation({
    onSuccess: () => {
      toast.success("Section created successfully");
      refetchSections();
      setSectionDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSection = trpc.requestConfig.sections.update.useMutation({
    onSuccess: () => {
      toast.success("Section updated successfully");
      refetchSections();
      setSectionDialogOpen(false);
      setEditingItem(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSectionOrder = trpc.requestConfig.sections.updateOrder.useMutation({
    onSuccess: () => {
      toast.success("Section order updated");
      refetchSections();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createField = trpc.requestConfig.fields.create.useMutation({
    onSuccess: () => {
      toast.success("Field created successfully");
      refetchFields();
      setFieldDialogOpen(false);
      setFieldOptions([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateField = trpc.requestConfig.fields.update.useMutation({
    onSuccess: () => {
      toast.success("Field updated successfully");
      refetchFields();
      setFieldDialogOpen(false);
      setEditingItem(null);
      setFieldOptions([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteField = trpc.requestConfig.fields.delete.useMutation({
    onSuccess: () => {
      toast.success("Field deleted successfully");
      refetchFields();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateFieldOrder = trpc.requestConfig.fields.updateOrder.useMutation({
    onSuccess: () => {
      toast.success("Field order updated");
      refetchFields();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Initialize field options and showCondition when editing
  useEffect(() => {
    if (editingItem && fieldDialogOpen) {
      setSelectedFieldType(editingItem.fieldType || "text");
      if (editingItem.options && Array.isArray(editingItem.options)) {
        setFieldOptions(editingItem.options);
      } else {
        setFieldOptions([]);
      }
      // Initialize showCondition
      setShowCondition(parseCondition(editingItem.showCondition));
    } else if (!fieldDialogOpen) {
      // Reset when dialog closes
      setShowCondition(null);
    }
  }, [editingItem, fieldDialogOpen]);

  // Form handlers
  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      description: formData.get("description") as string || undefined,
      icon: formData.get("icon") as string || undefined,
      allowMultipleTypes: formData.get("allowMultipleTypes") === "on",
      isActive: formData.get("isActive") === "on",
    };

    if (editingItem) {
      updateCategory.mutate({ id: editingItem.id, ...data });
    } else {
      createCategory.mutate(data);
    }
  };

  const handleTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      categoryId: selectedCategory!.id,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      shortCode: formData.get("shortCode") as string,
      description: formData.get("description") as string || undefined,
      isExclusive: formData.get("isExclusive") === "on",
      maxDurationDays: parseInt(formData.get("maxDurationDays") as string) || 30,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 1,
      isActive: formData.get("isActive") === "on",
    };

    if (editingItem) {
      updateType.mutate({ id: editingItem.id, ...data });
    } else {
      createType.mutate(data);
    }
  };

  const handleSectionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      requestTypeId: selectedType!.id,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      icon: formData.get("icon") as string || undefined,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 1,
      isRepeatable: formData.get("isRepeatable") === "on",
      minItems: formData.get("minItems") ? parseInt(formData.get("minItems") as string) : undefined,
      maxItems: formData.get("maxItems") ? parseInt(formData.get("maxItems") as string) : undefined,
      isActive: formData.get("isActive") === "on",
    };

    if (editingItem) {
      updateSection.mutate({ id: editingItem.id, ...data });
    } else {
      createSection.mutate(data);
    }
  };

  const handleFieldSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fieldType = selectedFieldType as any;
    
    // Prepare options for select/radio fields
    const isDropdownType = ["dropdown", "dropdown_multi", "radio", "checkbox_group"].includes(fieldType);
    const options = isDropdownType && selectedDataSource === "static"
      ? fieldOptions.filter(opt => opt.value && opt.label)
      : undefined;
    
    // Prepare optionsSource for dropdown fields
    const optionsSource = isDropdownType ? selectedDataSource : undefined;

    // Prepare showCondition for storage - convert to simple format expected by backend
    type BackendOperator = "equals" | "not_equals" | "in" | "not_empty" | "empty";
    const prepareConditionForBackend = (cond: ShowCondition): { field: string; operator?: BackendOperator; value?: string | boolean | string[] } | undefined => {
      if (!cond) return undefined;
      // If it's a group with single condition, extract it
      if ('logic' in cond && cond.conditions.length === 1 && !('logic' in cond.conditions[0])) {
        const single = cond.conditions[0] as { field: string; operator: string; value: string };
        return {
          field: single.field,
          operator: single.operator as any,
          value: single.value,
        };
      }
      // If it's a single condition
      if (!('logic' in cond)) {
        return {
          field: cond.field,
          operator: cond.operator as any,
          value: cond.value,
        };
      }
      // For complex conditions, just use the first condition for now
      // TODO: Support complex conditions in backend
      if (cond.conditions.length > 0 && !('logic' in cond.conditions[0])) {
        const first = cond.conditions[0] as { field: string; operator: string; value: string };
        return {
          field: first.field,
          operator: first.operator as any,
          value: first.value,
        };
      }
      return undefined;
    };

    const data = {
      sectionId: selectedSection!.id,
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      fieldType,
      isRequired: formData.get("isRequired") === "on",
      displayOrder: parseInt(formData.get("displayOrder") as string) || 1,
      columnSpan: parseInt(formData.get("columnSpan") as string) || 1,
      placeholder: formData.get("placeholder") as string || undefined,
      helpText: formData.get("helpText") as string || undefined,
      defaultValue: formData.get("defaultValue") as string || undefined,
      options,
      optionsSource: optionsSource as any,
      filterByField: isDropdownType && filterByField ? filterByField : undefined,
      showCondition: prepareConditionForBackend(showCondition),
      isActive: formData.get("isActive") === "on",
    };

    if (editingItem) {
      updateField.mutate({ id: editingItem.id, ...data });
    } else {
      createField.mutate(data);
    }
  };

  // Drag and drop handlers
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sectionsList = sections as FormSection[];
      const oldIndex = sectionsList.findIndex((s) => s.id === active.id);
      const newIndex = sectionsList.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sectionsList, oldIndex, newIndex);
      
      // Update order in database
      const orderUpdates = newOrder.map((s, idx) => ({
        id: s.id,
        displayOrder: idx + 1,
      }));
      updateSectionOrder.mutate({ updates: orderUpdates });
    }
  };

  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fieldsList = fields as FormField[];
      const oldIndex = fieldsList.findIndex((f) => f.id === active.id);
      const newIndex = fieldsList.findIndex((f) => f.id === over.id);
      const newOrder = arrayMove(fieldsList, oldIndex, newIndex);
      
      // Update order in database
      const orderUpdates = newOrder.map((f, idx) => ({
        id: f.id,
        displayOrder: idx + 1,
      }));
      updateFieldOrder.mutate({ updates: orderUpdates });
    }
  };

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "Date & Time" },
    { value: "dropdown", label: "Dropdown" },
    { value: "dropdown_multi", label: "Multi-Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "checkbox_group", label: "Checkbox Group" },
    { value: "radio", label: "Radio Buttons" },
    { value: "file", label: "File Upload" },
    { value: "file_multi", label: "Multi-File Upload" },
    { value: "user_lookup", label: "User Lookup" },
    { value: "readonly", label: "Read Only" },
  ];

  const showOptionsEditor = ["dropdown", "dropdown_multi", "radio", "checkbox_group"].includes(selectedFieldType);
  const showDataSourceSelector = showOptionsEditor;

  // Data source options for dropdown fields - grouped by category
  const dataSourceGroups = [
    {
      label: "Manual Entry",
      options: [
        { value: "static", label: "Manual Options", description: "Define options manually", icon: "✏️" },
      ]
    },
    {
      label: "Location Hierarchy",
      options: [
        { value: "countries", label: "Countries", description: "Master data countries", icon: "🌍" },
        { value: "regions", label: "Regions", description: "Filter by Country", icon: "🗺️" },
        { value: "cities", label: "Cities", description: "Filter by Region", icon: "🏙️" },
      ]
    },
    {
      label: "Facilities",
      options: [
        { value: "sites", label: "Sites", description: "All sites or filter by City", icon: "🏢" },
        { value: "zones", label: "Zones", description: "Filter by Site", icon: "📍" },
        { value: "areas", label: "Areas", description: "Filter by Zone", icon: "📐" },
      ]
    },
    {
      label: "Organization",
      options: [
        { value: "departments", label: "Departments", description: "Organization departments", icon: "🏛️" },
        { value: "groups", label: "Groups", description: "User groups", icon: "👥" },
        { value: "users", label: "Users", description: "User lookup", icon: "👤" },
        { value: "contractors", label: "Contractors", description: "Contractor companies", icon: "🏗️" },
      ]
    },
    {
      label: "System Data",
      options: [
        { value: "request_types", label: "Request Types", description: "Filter by Category", icon: "📋" },
        { value: "approval_roles", label: "Approval Roles", description: "Workflow roles", icon: "✅" },
      ]
    },
    {
      label: "Current User Context",
      options: [
        { value: "user_sites", label: "My Sites", description: "Current user's assigned sites", icon: "📌" },
        { value: "user_groups", label: "My Groups", description: "Current user's groups", icon: "👥" },
        { value: "user_departments", label: "My Department", description: "Current user's department", icon: "🏢" },
      ]
    },
  ];

  // Flatten for easy lookup
  const dataSourceOptions = dataSourceGroups.flatMap(g => g.options);

  // Cascading filter field mapping
  const cascadingFilters: Record<string, { label: string; sourceField: string }> = {
    regions: { label: "Country Field", sourceField: "country" },
    cities: { label: "Region Field", sourceField: "region" },
    sites: { label: "City Field (optional)", sourceField: "city" },
    zones: { label: "Site Field", sourceField: "site" },
    areas: { label: "Zone Field", sourceField: "zone" },
    request_types: { label: "Category Field (optional)", sourceField: "category" },
    users: { label: "Department Field (optional)", sourceField: "department" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">{t("settings.requestTypes", "Request Type Configuration")}</h1>
          <p className="text-[#6B6B6B]">
            {t("settings.requestTypesDesc", "Configure request categories, types, form sections, and fields")}
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={!selectedCategory ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setSelectedCategory(null);
            setSelectedType(null);
            setSelectedSection(null);
          }}
        >
          <FolderTree className="h-4 w-4 mr-1" />
          Categories
        </Button>
        {selectedCategory && (
          <>
            <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
            <Button
              variant={!selectedType ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setSelectedType(null);
                setSelectedSection(null);
              }}
            >
              <FileType className="h-4 w-4 mr-1" />
              {selectedCategory.name}
            </Button>
          </>
        )}
        {selectedType && (
          <>
            <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
            <Button
              variant={!selectedSection ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedSection(null)}
            >
              <LayoutList className="h-4 w-4 mr-1" />
              {selectedType.name}
            </Button>
          </>
        )}
        {selectedSection && (
          <>
            <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
            <Button variant="default" size="sm" className="bg-primary/10 text-primary">
              <FormInput className="h-4 w-4 mr-1" />
              {selectedSection.name}
            </Button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {!selectedCategory && "Categories"}
                  {selectedCategory && !selectedType && "Request Types"}
                  {selectedType && !selectedSection && "Form Sections"}
                  {selectedSection && "Form Fields"}
                </CardTitle>
                <CardDescription>
                  {!selectedCategory && "Manage request categories (e.g., Admin Visit, Technical & Delivery)"}
                  {selectedCategory && !selectedType && `Types under ${selectedCategory.name}`}
                  {selectedType && !selectedSection && `Sections (tabs) for ${selectedType.name}`}
                  {selectedSection && `Fields in ${selectedSection.name}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedType && !selectedSection && (
                  <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Form
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setFieldOptions([]);
                    setSelectedFieldType("text");
                    setSelectedDataSource("static");
                    setFilterByField("");
                    if (!selectedCategory) setCategoryDialogOpen(true);
                    else if (!selectedType) setTypeDialogOpen(true);
                    else if (!selectedSection) setSectionDialogOpen(true);
                    else setFieldDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {!selectedCategory ? "Category" : !selectedType ? "Type" : !selectedSection ? "Section" : "Field"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Categories List */}
              {!selectedCategory && (
                <div className="space-y-2">
                  {(categories as Category[] | undefined)?.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderTree className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-[#6B6B6B]">{category.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.allowMultipleTypes && (
                          <Badge variant="secondary">Multi-Type</Badge>
                        )}
                        <Badge variant={category.isActive ? "default" : "outline"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(category);
                            setCategoryDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
                      </div>
                    </div>
                  ))}
                  {(!categories || (categories as Category[]).length === 0) && (
                    <div className="text-center py-8 text-[#6B6B6B]">
                      No categories found. Create your first category to get started.
                    </div>
                  )}
                </div>
              )}

              {/* Types List */}
              {selectedCategory && !selectedType && (
                <div className="space-y-2">
                  {(types as RequestType[] | undefined)?.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedType(type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Badge variant="outline" className="text-xs">{type.shortCode}</Badge>
                        </div>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-[#6B6B6B]">Max {type.maxDurationDays} days</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {type.isExclusive && (
                          <Badge variant="destructive">Exclusive</Badge>
                        )}
                        <Badge variant={type.isActive ? "default" : "outline"}>
                          {type.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(type);
                            setTypeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-[#6B6B6B]" />
                      </div>
                    </div>
                  ))}
                  {(!types || (types as RequestType[]).length === 0) && (
                    <div className="text-center py-8 text-[#6B6B6B]">
                      No types found. Create your first request type.
                    </div>
                  )}
                </div>
              )}

              {/* Sections List with Drag and Drop */}
              {selectedType && !selectedSection && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSectionDragEnd}
                >
                  <SortableContext
                    items={(sections as FormSection[] || []).map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(sections as FormSection[] | undefined)?.map((section) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          onClick={() => setSelectedSection(section)}
                          onEdit={(e) => {
                            e.stopPropagation();
                            setEditingItem(section);
                            setSectionDialogOpen(true);
                          }}
                        />
                      ))}
                      {(!sections || (sections as FormSection[]).length === 0) && (
                        <div className="text-center py-8 text-[#6B6B6B]">
                          No sections found. Create your first form section.
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Fields List with Drag and Drop */}
              {selectedSection && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFieldDragEnd}
                >
                  <SortableContext
                    items={(fields as FormField[] || []).map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(fields as FormField[] | undefined)?.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={(e) => {
                            e.stopPropagation();
                            setEditingItem(field);
                            setSelectedFieldType(field.fieldType);
                            setFieldOptions(field.options || []);
                            setSelectedDataSource(field.optionsSource || "static");
                            setFilterByField(field.filterByField || "");
                            setFieldDialogOpen(true);
                          }}
                          onDelete={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this field?")) {
                              deleteField.mutate({ id: field.id });
                            }
                          }}
                        />
                      ))}
                      {(!fields || (fields as FormField[]).length === 0) && (
                        <div className="text-center py-8 text-[#6B6B6B]">
                          No fields found. Create your first form field.
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Quick Stats & Help */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Categories</span>
                <span className="font-medium">{(categories as Category[])?.length || 0}</span>
              </div>
              {selectedCategory && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Types</span>
                  <span className="font-medium">{(types as RequestType[])?.length || 0}</span>
                </div>
              )}
              {selectedType && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Sections</span>
                  <span className="font-medium">{(sections as FormSection[])?.length || 0}</span>
                </div>
              )}
              {selectedSection && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Fields</span>
                  <span className="font-medium">{(fields as FormField[])?.length || 0}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#6B6B6B] space-y-2">
              <p><strong>Categories</strong> are top-level groupings (e.g., Admin Visit, Technical & Delivery).</p>
              <p><strong>Types</strong> are specific permit types within a category (e.g., TEP, WP, MOP).</p>
              <p><strong>Sections</strong> are form tabs that organize fields.</p>
              <p><strong>Fields</strong> are individual form inputs.</p>
              <p className="pt-2 border-t"><strong>Drag and drop</strong> sections or fields to reorder them.</p>
              <p><strong>Exclusive</strong> types cannot be combined with other types.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the category details" : "Add a new request category"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="admin_visit"
                  defaultValue={editingItem?.code}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="clipboard-list"
                  defaultValue={editingItem?.icon}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Admin Visit"
                defaultValue={editingItem?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                name="nameAr"
                placeholder="زيارة إدارية"
                defaultValue={editingItem?.nameAr}
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description of this category"
                defaultValue={editingItem?.description || ""}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="allowMultipleTypes"
                  name="allowMultipleTypes"
                  defaultChecked={editingItem?.allowMultipleTypes ?? true}
                />
                <Label htmlFor="allowMultipleTypes">Allow Multiple Types</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingItem?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Request Type" : "Create Request Type"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the request type details" : "Add a new request type"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="tep"
                  defaultValue={editingItem?.code}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortCode">Short Code *</Label>
                <Input
                  id="shortCode"
                  name="shortCode"
                  placeholder="TEP"
                  defaultValue={editingItem?.shortCode}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Temporary Entry Permission"
                defaultValue={editingItem?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                name="nameAr"
                placeholder="تصريح دخول مؤقت"
                defaultValue={editingItem?.nameAr}
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description of this type"
                defaultValue={editingItem?.description || ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDurationDays">Max Duration (days)</Label>
                <Input
                  id="maxDurationDays"
                  name="maxDurationDays"
                  type="number"
                  defaultValue={editingItem?.maxDurationDays || 30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={editingItem?.sortOrder || 1}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isExclusive"
                  name="isExclusive"
                  defaultChecked={editingItem?.isExclusive ?? false}
                />
                <Label htmlFor="isExclusive">Exclusive (cannot combine)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingItem?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createType.isPending || updateType.isPending}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Section" : "Create Section"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the section details" : "Add a new form section (tab)"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSectionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="visitors"
                  defaultValue={editingItem?.code}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="users"
                  defaultValue={editingItem?.icon}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Visitors"
                defaultValue={editingItem?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                name="nameAr"
                placeholder="الزوار"
                defaultValue={editingItem?.nameAr}
                dir="rtl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                defaultValue={editingItem?.displayOrder || 1}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isRepeatable"
                name="isRepeatable"
                defaultChecked={editingItem?.isRepeatable ?? false}
              />
              <Label htmlFor="isRepeatable">Repeatable Section</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minItems">Min Items</Label>
                <Input
                  id="minItems"
                  name="minItems"
                  type="number"
                  placeholder="1"
                  defaultValue={editingItem?.minItems || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxItems">Max Items</Label>
                <Input
                  id="maxItems"
                  name="maxItems"
                  type="number"
                  placeholder="20"
                  defaultValue={editingItem?.maxItems || ""}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={editingItem?.isActive ?? true}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSection.isPending || updateSection.isPending}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Field" : "Create Field"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the field details" : "Add a new form field"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="full_name"
                  defaultValue={editingItem?.code}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type *</Label>
                <Select 
                  value={selectedFieldType} 
                  onValueChange={setSelectedFieldType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Full Name"
                defaultValue={editingItem?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                name="nameAr"
                placeholder="الاسم الكامل"
                defaultValue={editingItem?.nameAr}
                dir="rtl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue={editingItem?.displayOrder || 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="columnSpan">Column Span (1-12)</Label>
                <Input
                  id="columnSpan"
                  name="columnSpan"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue={editingItem?.columnSpan || 6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                name="placeholder"
                placeholder="Enter placeholder text"
                defaultValue={editingItem?.placeholder || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="helpText">Help Text</Label>
              <Input
                id="helpText"
                name="helpText"
                placeholder="Help text shown below the field"
                defaultValue={editingItem?.helpText || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                name="defaultValue"
                placeholder="Default value"
                defaultValue={editingItem?.defaultValue || ""}
              />
            </div>

            {/* Data Source Selector for dropdown fields */}
            {showDataSourceSelector && (
              <div className="border rounded-lg overflow-hidden bg-[#F5F5F5]">
                {/* Header */}
                <div className="px-4 py-3 bg-primary/5 border-b">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs">📋</span>
                    Options Source
                  </h4>
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    Choose where dropdown options come from
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  {/* Data Source Selection - Card Style */}
                  <div className="grid grid-cols-2 gap-2">
                    {dataSourceGroups.map((group) => (
                      <div key={group.label} className="space-y-1">
                        <p className="text-[10px] font-medium text-[#6B6B6B] uppercase tracking-wider px-1">
                          {group.label}
                        </p>
                        {group.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSelectedDataSource(opt.value);
                              if (opt.value !== "static") {
                                setFieldOptions([]);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
                              selectedDataSource === opt.value
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-white border hover:bg-[#F5F5F5] hover:border-primary/30"
                            }`}
                          >
                            <span className="text-base">{opt.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{opt.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Selected Source Info */}
                  {selectedDataSource && (
                    <div className={`rounded-lg p-3 border-2 ${
                      selectedDataSource === "static" 
                        ? "border-[#FFB84D] bg-[#FFF4E5]" 
                        : "border-[#4ECDC4] bg-[#E8F9F8]"
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {dataSourceOptions.find(o => o.value === selectedDataSource)?.icon}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {dataSourceOptions.find(o => o.value === selectedDataSource)?.label}
                          </p>
                          <p className="text-xs text-[#6B6B6B]">
                            {dataSourceOptions.find(o => o.value === selectedDataSource)?.description}
                          </p>
                          {selectedDataSource !== "static" && (
                            <p className="text-xs text-[#4ECDC4] mt-1 font-medium">
                              ✓ Options will be loaded dynamically from the system
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter By Field selector for cascading dropdowns */}
                  {cascadingFilters[selectedDataSource] && (
                    <div className="bg-[#E8DCF5] border border-[#5B2C93] rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#5B2C93]">🔗</span>
                        <Label className="text-sm font-medium text-[#5B2C93]">
                          Cascading Filter: {cascadingFilters[selectedDataSource].label}
                        </Label>
                      </div>
                      <Select
                        value={filterByField}
                        onValueChange={setFilterByField}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select field to filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            <span className="text-[#6B6B6B]">No filter (show all)</span>
                          </SelectItem>
                          {(fields || []).filter((f: FormField) => 
                            ["dropdown", "dropdown_multi"].includes(f.fieldType) &&
                            f.code !== editingItem?.code
                          ).map((f: FormField) => (
                            <SelectItem key={f.code} value={f.code}>
                              {f.name} ({f.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#5B2C93]">
                        💡 Options will be filtered based on the selected value of this field
                      </p>
                    </div>
                  )}

                  {/* Manual Options Editor - only show when static is selected */}
                  {selectedDataSource === "static" && (
                    <div className="border-t pt-4">
                      <FieldOptionsEditor
                        options={fieldOptions}
                        onChange={setFieldOptions}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditional Visibility Editor */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Conditional Visibility</Label>
              <ConditionBuilder
                condition={showCondition}
                availableFields={(fields || []).map((f: FormField) => ({
                  code: f.code,
                  name: f.name,
                  fieldType: f.fieldType,
                  options: f.options?.map((opt: any) => ({ value: opt.value, label: opt.label })),
                }))}
                onChange={setShowCondition}
                currentFieldCode={editingItem?.code}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isRequired"
                  name="isRequired"
                  defaultChecked={editingItem?.isRequired ?? false}
                />
                <Label htmlFor="isRequired">Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={editingItem?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFieldDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createField.isPending || updateField.isPending}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Form Preview Dialog */}
      {selectedType && (
        <FormPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          requestTypeId={selectedType.id}
          typeName={selectedType.name}
        />
      )}
    </div>
  );
}
