import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Save,
  Search,
  User,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useErrorDialog } from "@/components/ui/error-dialog";
import { CategoryTypeDialog } from "./dynamic-form/CategoryTypeDialog";
import { DynamicForm, FormSection } from "./dynamic-form/DynamicForm";
import { cn } from "@/lib/utils";

export default function DynamicRequestForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id) : null;
  const isEditMode = !!editId;
  
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // State
  const [showCategoryDialog, setShowCategoryDialog] = useState(!isEditMode);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Error dialog
  const { showError, ErrorDialogComponent } = useErrorDialog();

  // Fetch existing request for edit mode
  const { data: existingRequest, isLoading: loadingExisting } = trpc.requests.getById.useQuery(
    { id: editId! },
    { enabled: isEditMode }
  );

  // Fetch categories with types
  const { data: categories, isLoading: loadingCategories } =
    trpc.requestConfig.categories.list.useQuery();

  // Fetch form definition for selected types
  const { data: formDefinition, isLoading: loadingForm } =
    trpc.requestConfig.formDefinition.getFormDefinition.useQuery(
      { typeIds: selectedTypeIds },
      { enabled: selectedTypeIds.length > 0 }
    );

  // Get selected category
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categories) return null;
    return (categories as any[]).find((c: any) => c.id === selectedCategoryId);
  }, [selectedCategoryId, categories]);

  // Get selected types
  const selectedTypes = useMemo(() => {
    if (!selectedCategory?.types || selectedTypeIds.length === 0) return [];
    return selectedCategory.types.filter((t: any) => selectedTypeIds.includes(t.id));
  }, [selectedCategory, selectedTypeIds]);

  // Create request mutation
  const createRequest = trpc.requests.create.useMutation({
    onSuccess: (data: any) => {
      toast.success(
        t("requests.created", "Request {{number}} created successfully!", {
          number: data.requestNumber,
        })
      );
      navigate("/requests");
    },
    onError: (error: any) => {
      showError(
        t(
          "requests.createError",
          "There was an error processing your request. Please try again or contact support if the problem persists."
        ),
        t("requests.submissionFailed", "Request Submission Failed")
      );
      console.error("Request creation error:", error);
    },
  });

  // Update request mutation
  const updateRequest = trpc.requests.update.useMutation({
    onSuccess: (data: any) => {
      toast.success(
        t("requests.updated", "Request {{number}} updated successfully!", {
          number: data.requestNumber,
        })
      );
      navigate("/requests");
    },
    onError: (error: any) => {
      showError(
        t(
          "requests.updateError",
          "There was an error updating your request. Please try again or contact support if the problem persists."
        ),
        t("requests.updateFailed", "Request Update Failed")
      );
      console.error("Request update error:", error);
    },
  });

  // Load existing request data in edit mode
  useEffect(() => {
    if (isEditMode && existingRequest && !isDataLoaded) {
      // Check if request is editable (draft status only)
      if (existingRequest.status !== "draft") {
        toast.error(t("requests.notEditable", "Only draft requests can be edited"));
        navigate("/requests");
        return;
      }

      // Set category and types from existing request
      if (existingRequest.categoryId) {
        setSelectedCategoryId(existingRequest.categoryId);
      }
      if (existingRequest.selectedTypeIds && Array.isArray(existingRequest.selectedTypeIds)) {
        setSelectedTypeIds(existingRequest.selectedTypeIds);
      }
      
      // Set form data from existing request
      if (existingRequest.formData && typeof existingRequest.formData === 'object') {
        setFormData(existingRequest.formData as Record<string, any>);
      }
      
      setShowCategoryDialog(false);
      setIsDataLoaded(true);
    }
  }, [isEditMode, existingRequest, isDataLoaded, navigate, t]);

  // Initialize form data with defaults when form definition loads (only for new requests)
  useEffect(() => {
    if (formDefinition?.sections && !isEditMode) {
      const defaults: Record<string, any> = {};
      formDefinition.sections.forEach((section: any) => {
        if (section.isRepeatable) {
          defaults[section.code] = [];
        } else {
          section.fields.forEach((field: any) => {
            if (field.defaultValue) {
              defaults[field.code] = field.defaultValue;
            }
          });
        }
      });
      setFormData((prev) => ({ ...defaults, ...prev }));

      if (formDefinition.sections.length > 0 && !activeSection) {
        setActiveSection(formDefinition.sections[0].code);
      }
    }
  }, [formDefinition, isEditMode]);

  // Set active section when form definition loads in edit mode
  useEffect(() => {
    if (formDefinition?.sections && isEditMode && formDefinition.sections.length > 0 && !activeSection) {
      setActiveSection(formDefinition.sections[0].code);
    }
  }, [formDefinition, isEditMode, activeSection]);

  // Prefill user info (only for new requests)
  useEffect(() => {
    if (user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        requestor_name: user.name || "",
        requestor_email: user.email || "",
        requestor_company: "Centre3",
      }));
    }
  }, [user, isEditMode]);

  // Handle category/type selection from dialog
  const handleCategoryTypeConfirm = (categoryId: number, typeIds: number[]) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeIds(typeIds);
    if (!isEditMode) {
      setFormData({});
    }
    setActiveSection("");
    setShowCategoryDialog(false);
  };

  // Handle change selection
  const handleChangeSelection = () => {
    setShowCategoryDialog(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formDefinition?.sections) return false;

    formDefinition.sections.forEach((section: any) => {
      if (section.isRepeatable) {
        const items = formData[section.code] || [];
        if (section.minItems && items.length < section.minItems) {
          newErrors[section.code] = t(
            "validation.minItems",
            "At least {{min}} items required",
            { min: section.minItems }
          );
        }
        items.forEach((item: any, index: number) => {
          section.fields.forEach((field: any) => {
            if (field.isRequired && !item[field.code]) {
              newErrors[`${section.code}[${index}].${field.code}`] = t(
                "validation.required",
                "This field is required"
              );
            }
          });
        });
      } else {
        section.fields.forEach((field: any) => {
          if (field.isRequired && !formData[field.code]) {
            newErrors[field.code] = t("validation.required", "This field is required");
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (asDraft: boolean = false) => {
    if (!asDraft && !validateForm()) {
      toast.error(t("requests.validationError", "Please fill in all required fields"));
      return;
    }

    const visitors = formData.visitors || [];
    const mainVisitor = visitors[0] || {
      full_name: user?.name || "Unknown",
      id_type: "national_id",
      id_number: "N/A",
    };

    const requestData = {
      categoryId: selectedCategoryId!,
      selectedTypeIds,
      formData,
      visitorName: mainVisitor.full_name || mainVisitor.name,
      visitorIdType: mainVisitor.id_type || "national_id",
      visitorIdNumber: mainVisitor.id_number || "N/A",
      visitorCompany: mainVisitor.company,
      visitorPhone: mainVisitor.phone,
      visitorEmail: mainVisitor.email,
      siteId: parseInt(formData.site_id) || 1,
      purpose: formData.purpose || formData.visit_purpose || "Request",
      startDate: formData.start_date || new Date().toISOString().split("T")[0],
      endDate: formData.end_date || new Date().toISOString().split("T")[0],
      startTime: formData.start_time,
      endTime: formData.end_time,
      visitors: visitors.map((v: any) => ({
        fullName: v.full_name || v.name,
        idType: v.id_type || "national_id",
        idNumber: v.id_number,
        nationality: v.nationality,
        company: v.company,
        phone: v.phone,
        email: v.email,
        isVerified: v.verified || false,
      })),
      materials: (formData.materials || []).map((m: any) => ({
        materialType: m.material_type,
        description: m.description,
        quantity: parseInt(m.quantity) || 1,
        serialNumber: m.serial_number,
        unit: m.unit,
      })),
      vehicles: (formData.vehicles || []).map((v: any) => ({
        vehicleType: v.vehicle_type,
        plateNumber: v.plate_number,
        driverName: v.driver_name,
        driverIdNumber: v.driver_id_number,
        purpose: v.purpose,
      })),
      submitImmediately: !asDraft,
    };

    if (isEditMode) {
      updateRequest.mutate({ id: editId!, ...requestData } as any);
    } else {
      createRequest.mutate(requestData as any);
    }
  };

  // Check if form is ready (category and types selected)
  const isFormReady = selectedCategoryId && selectedTypeIds.length > 0;
  const isPending = createRequest.isPending || updateRequest.isPending;

  // Show loading state for edit mode
  if (isEditMode && loadingExisting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
      </div>
    );
  }

  return (
    <>
      <ErrorDialogComponent />

      {/* Category/Type Selection Dialog */}
      <CategoryTypeDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        categories={(categories as any[]) || []}
        loadingCategories={loadingCategories}
        onConfirm={handleCategoryTypeConfirm}
        initialCategoryId={selectedCategoryId}
        initialTypeIds={selectedTypeIds}
      />

      <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#F5F5F5]">
        {/* Top Toolbar - IBM Maximo Style */}
        <div className="bg-[#2C2C2C] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
          <div className="flex items-center gap-6">
            <span className="font-medium tracking-wide text-white uppercase">
              {isEditMode 
                ? t("requests.editRequest", "EDIT REQUEST") 
                : t("requests.createNew", "CREATE NEW REQUEST")}
            </span>
            {isEditMode && existingRequest && (
              <Badge variant="outline" className="bg-[#FFF4E5]/20 text-[#FFB84D] border-[#FFB84D]/50">
                {existingRequest.requestNumber}
              </Badge>
            )}
            <div className="h-5 w-px bg-[#6B6B6B]" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
                onClick={() => handleSubmit(true)}
                disabled={isPending || !isFormReady}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-none"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
            <span className="uppercase tracking-wider text-[10px] font-medium text-[#B0B0B0]">
              {t("common.loggedInAs", "LOGGED IN AS:")}
            </span>
            <span className="font-medium text-white flex items-center gap-1 text-xs">
              {user?.name?.toUpperCase() || "USER"} <User className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4 text-sm shadow-sm">
          <Link href="/requests">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5B2C93] hover:bg-[#5B2C93]/10 gap-2 font-medium h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.returnToList", "Return to List")}
            </Button>
          </Link>
          <div className="h-6 w-px bg-[#E0E0E0]" />

          <div className="ml-auto flex items-center gap-6 text-[#6B6B6B]">
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-medium text-[#B0B0B0]">
                  {t("requests.category", "Category")}
                </span>
                <Badge
                  variant="outline"
                  className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93] rounded-sm px-2 py-0.5"
                >
                  {isRTL && selectedCategory.nameAr
                    ? selectedCategory.nameAr
                    : selectedCategory.name}
                </Badge>
              </div>
            )}
            {selectedTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-medium text-[#B0B0B0]">
                  {t("requests.typesLabel", "Types")}
                </span>
                <div className="flex gap-1">
                  {selectedTypes.map((type: any) => (
                    <Badge
                      key={type.id}
                      className="bg-[#5B2C93] text-white rounded-sm px-2 py-0.5"
                    >
                      {type.shortCode || type.code.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {isFormReady && !isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangeSelection}
                className="text-[#5B2C93] hover:bg-[#5B2C93]/10 gap-1 h-7 text-xs"
              >
                <Edit2 className="h-3 w-3" />
                {t("common.change", "Change")}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-medium text-[#B0B0B0]">
                {t("common.status", "Status")}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-sm px-2 py-0.5",
                  isEditMode 
                    ? "bg-[#FFF4E5] text-[#FFB84D] border-[#FFB84D]" 
                    : "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]"
                )}
              >
                {isEditMode ? t("common.draft", "DRAFT") : t("common.new", "NEW")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {!isFormReady ? (
            <div className="h-full flex items-center justify-center text-[#6B6B6B]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-[#B0B0B0]" />
                <p className="text-lg font-medium mb-2">
                  {t("requests.selectCategoryFirst", "Select a category and type to begin")}
                </p>
                <Button
                  onClick={() => setShowCategoryDialog(true)}
                  className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2"
                >
                  {t("requests.selectCategory", "Select Request Category")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : loadingForm ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
            </div>
          ) : formDefinition?.sections && formDefinition.sections.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <DynamicForm
                  sections={formDefinition.sections as FormSection[]}
                  formData={formData}
                  onFormDataChange={setFormData}
                  activeSection={activeSection}
                  onActiveSectionChange={setActiveSection}
                  errors={errors}
                />
              </div>
              {/* Bottom action bar */}
              <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/requests")}
                  className="text-[#6B6B6B]"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t("common.cancel", "Cancel")}
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode 
                      ? t("common.saveDraft", "Save Draft") 
                      : t("common.saveAsDraft", "Save as Draft")}
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={isPending}
                    className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("common.submit", "Submit Request")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#6B6B6B]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-[#B0B0B0]" />
                <p className="text-lg font-medium mb-2">
                  {t("requests.noFormDefinition", "No form definition found for this request type")}
                </p>
                <p className="text-sm text-[#B0B0B0] mb-4">
                  {t("requests.contactAdmin", "Please contact an administrator to configure the form")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
