import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Settings2,
  Copy,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";

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
  isActive: boolean;
};

export default function RequestTypeConfig() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  const deleteCategory = trpc.requestConfig.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted successfully");
      refetchCategories();
      setSelectedCategory(null);
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

  const deleteType = trpc.requestConfig.types.delete.useMutation({
    onSuccess: () => {
      toast.success("Request type deleted successfully");
      refetchTypes();
      setSelectedType(null);
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

  const deleteSection = trpc.requestConfig.sections.delete.useMutation({
    onSuccess: () => {
      toast.success("Section deleted successfully");
      refetchSections();
      setSelectedSection(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createField = trpc.requestConfig.fields.create.useMutation({
    onSuccess: () => {
      toast.success("Field created successfully");
      refetchFields();
      setFieldDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateField = trpc.requestConfig.fields.update.useMutation({
    onSuccess: () => {
      toast.success("Field updated successfully");
      refetchFields();
      setFieldDialogOpen(false);
      setEditingItem(null);
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
    const fieldType = formData.get("fieldType") as "text" | "textarea" | "number" | "email" | "phone" | "date" | "datetime" | "dropdown" | "dropdown_multi" | "checkbox" | "radio" | "file" | "readonly" | "checkbox_group" | "file_multi" | "user_lookup";
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
      isActive: formData.get("isActive") === "on",
    };

    if (editingItem) {
      updateField.mutate({ id: editingItem.id, ...data });
    } else {
      createField.mutate(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("settings.requestTypes", "Request Type Configuration")}</h1>
          <p className="text-muted-foreground">
            {t("settings.requestTypesDescription", "Configure request categories, types, form sections, and fields")}
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className={!selectedCategory ? "bg-primary/10 text-primary" : ""}
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
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className={selectedCategory && !selectedType ? "bg-primary/10 text-primary" : ""}
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
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className={selectedType && !selectedSection ? "bg-primary/10 text-primary" : ""}
              onClick={() => setSelectedSection(null)}
            >
              <LayoutList className="h-4 w-4 mr-1" />
              {selectedType.name}
            </Button>
          </>
        )}
        {selectedSection && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" size="sm" className="bg-primary/10 text-primary">
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
              <Button
                onClick={() => {
                  setEditingItem(null);
                  if (!selectedCategory) setCategoryDialogOpen(true);
                  else if (!selectedType) setTypeDialogOpen(true);
                  else if (!selectedSection) setSectionDialogOpen(true);
                  else setFieldDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {!selectedCategory ? "Category" : !selectedType ? "Type" : !selectedSection ? "Section" : "Field"}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Categories List */}
              {!selectedCategory && (
                <div className="space-y-2">
                  {(categories as Category[] | undefined)?.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderTree className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">{category.code}</div>
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
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {(!categories || (categories as Category[]).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedType(type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Badge variant="outline" className="text-xs">{type.shortCode}</Badge>
                        </div>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-muted-foreground">Max {type.maxDurationDays} days</div>
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
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {(!types || (types as RequestType[]).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No types found. Create your first request type.
                    </div>
                  )}
                </div>
              )}

              {/* Sections List */}
              {selectedType && !selectedSection && (
                <div className="space-y-2">
                  {(sections as FormSection[] | undefined)?.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedSection(section)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <LayoutList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-muted-foreground">Order: {section.displayOrder}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {section.isRepeatable && (
                          <Badge variant="secondary">
                            Repeatable ({section.minItems || 1}-{section.maxItems || "∞"})
                          </Badge>
                        )}
                        <Badge variant={section.isActive ? "default" : "outline"}>
                          {section.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(section);
                            setSectionDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {(!sections || (sections as FormSection[]).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sections found. Create form sections (tabs) for this type.
                    </div>
                  )}
                </div>
              )}

              {/* Fields List */}
              {selectedSection && (
                <div className="space-y-2">
                  {(fields as FormField[] | undefined)?.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FormInput className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{field.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {field.fieldType} • {field.code}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {field.isRequired && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                        <Badge variant="outline">Col {field.columnSpan}</Badge>
                        <Badge variant={field.isActive ? "default" : "outline"}>
                          {field.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(field);
                            setFieldDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this field?")) {
                              deleteField.mutate({ id: field.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!fields || (fields as FormField[]).length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No fields found. Add form fields to this section.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Quick Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categories</span>
                <Badge variant="secondary">{(categories as Category[] | undefined)?.length || 0}</Badge>
              </div>
              {selectedCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Types</span>
                  <Badge variant="secondary">{(types as RequestType[] | undefined)?.length || 0}</Badge>
                </div>
              )}
              {selectedType && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sections</span>
                  <Badge variant="secondary">{(sections as FormSection[] | undefined)?.length || 0}</Badge>
                </div>
              )}
              {selectedSection && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fields</span>
                  <Badge variant="secondary">{(fields as FormField[] | undefined)?.length || 0}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Categories</strong> are top-level groupings (e.g., Admin Visit, Technical & Delivery).</p>
              <p><strong>Types</strong> are specific permit types within a category (e.g., TEP, WP, MOP).</p>
              <p><strong>Sections</strong> are form tabs that organize fields.</p>
              <p><strong>Fields</strong> are individual form inputs.</p>
              <p className="pt-2 border-t">
                <strong>Exclusive types</strong> cannot be combined with other types.
              </p>
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
        <DialogContent className="max-w-lg">
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
                <Select name="fieldType" defaultValue={editingItem?.fieldType || "text"}>
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
                <Label htmlFor="columnSpan">Column Span (1-4)</Label>
                <Input
                  id="columnSpan"
                  name="columnSpan"
                  type="number"
                  min="1"
                  max="4"
                  defaultValue={editingItem?.columnSpan || 1}
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
    </div>
  );
}
