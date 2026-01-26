import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useErrorDialog } from "@/components/ui/error-dialog";
import { CategorySelector } from "./dynamic-form/CategorySelector";
import { TypeSelector } from "./dynamic-form/TypeSelector";
import { DynamicForm, FormSection } from "./dynamic-form/DynamicForm";
import { cn } from "@/lib/utils";

// Steps in the request creation wizard
type WizardStep = "category" | "type" | "form" | "review";

export default function DynamicRequestForm() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("category");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Error dialog
  const { showError, ErrorDialogComponent } = useErrorDialog();

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } =
    trpc.requestConfig.categories.list.useQuery();

  // Fetch types for selected category
  const { data: types, isLoading: loadingTypes } =
    trpc.requestConfig.types.list.useQuery(
      { categoryId: selectedCategoryId! },
      { enabled: !!selectedCategoryId }
    );

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
    if (!types || selectedTypeIds.length === 0) return [];
    return (types as any[]).filter((t: any) => selectedTypeIds.includes(t.id));
  }, [types, selectedTypeIds]);

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

  // Initialize form data with defaults when form definition loads
  useEffect(() => {
    if (formDefinition?.sections) {
      const defaults: Record<string, any> = {};
      formDefinition.sections.forEach((section: any) => {
        if (section.isRepeatable) {
          // Initialize repeatable sections with empty array
          defaults[section.code] = [];
        } else {
          // Initialize fields with default values
          section.fields.forEach((field: any) => {
            if (field.defaultValue) {
              defaults[field.code] = field.defaultValue;
            }
          });
        }
      });
      // Merge with existing form data (preserve user input)
      setFormData((prev) => ({ ...defaults, ...prev }));
      
      // Set first section as active
      if (formDefinition.sections.length > 0 && !activeSection) {
        setActiveSection(formDefinition.sections[0].code);
      }
    }
  }, [formDefinition]);

  // Prefill user info
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        requestor_name: user.name || "",
        requestor_email: user.email || "",
        requestor_company: "Centre3",
      }));
    }
  }, [user]);

  // Handle category selection
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeIds([]);
    setFormData({});
    setCurrentStep("type");
  };

  // Handle type selection
  const handleTypeSelect = (typeIds: number[]) => {
    setSelectedTypeIds(typeIds);
  };

  // Proceed to form step
  const handleProceedToForm = () => {
    if (selectedTypeIds.length === 0) {
      toast.error(t("requests.selectType", "Please select at least one request type"));
      return;
    }
    setCurrentStep("form");
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
        // Validate each item's required fields
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

    // Extract visitors from form data
    const visitors = formData.visitors || [];
    
    // Get first visitor as main visitor (for backward compatibility)
    const mainVisitor = visitors[0] || {
      full_name: user?.name || "Unknown",
      id_type: "national_id",
      id_number: "N/A",
    };

    // Build request data
    const requestData = {
      categoryId: selectedCategoryId!,
      selectedTypeIds,
      formData,
      // Legacy fields for backward compatibility
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
      // Visitors array for proper storage
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
      // Materials array
      materials: (formData.materials || []).map((m: any) => ({
        materialType: m.material_type,
        description: m.description,
        quantity: parseInt(m.quantity) || 1,
        serialNumber: m.serial_number,
        unit: m.unit,
      })),
      // Vehicles array
      vehicles: (formData.vehicles || []).map((v: any) => ({
        vehicleType: v.vehicle_type,
        plateNumber: v.plate_number,
        driverName: v.driver_name,
        driverIdNumber: v.driver_id_number,
        purpose: v.purpose,
      })),
      submitImmediately: !asDraft,
    };

    createRequest.mutate(requestData as any);
  };

  // Go back to previous step
  const handleBack = () => {
    switch (currentStep) {
      case "type":
        setCurrentStep("category");
        break;
      case "form":
        setCurrentStep("type");
        break;
      case "review":
        setCurrentStep("form");
        break;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: "category", label: t("requests.step.category", "Category") },
      { id: "type", label: t("requests.step.type", "Type") },
      { id: "form", label: t("requests.step.details", "Details") },
    ];

    return (
      <div className="flex items-center gap-2 text-sm">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast =
            steps.findIndex((s) => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4",
                    isPast ? "text-[#0f62fe]" : "text-gray-300"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded",
                  isActive
                    ? "bg-[#0f62fe] text-white"
                    : isPast
                    ? "bg-[#e5f6ff] text-[#0043ce]"
                    : "text-gray-500"
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full border flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                )}
                <span className="font-medium">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <ErrorDialogComponent />
      <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#f4f4f4] font-poppins">
        {/* Top Toolbar - IBM Maximo Style */}
        <div className="bg-[#161616] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
          <div className="flex items-center gap-6">
            <span className="font-bold tracking-wide text-white uppercase">
              {t("requests.createNew", "CREATE NEW REQUEST")}
            </span>
            <div className="h-5 w-px bg-gray-600" />
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
                disabled={createRequest.isPending || currentStep !== "form"}
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
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="uppercase tracking-wider text-[10px] font-medium text-gray-400">
              {t("common.loggedInAs", "LOGGED IN AS:")}
            </span>
            <span className="font-bold text-white flex items-center gap-1 text-xs">
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
              className="text-[#0f62fe] hover:bg-[#0f62fe]/10 gap-2 font-medium h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.returnToList", "Return to List")}
            </Button>
          </Link>
          <div className="h-6 w-px bg-gray-200" />

          {/* Step indicator */}
          {renderStepIndicator()}

          <div className="ml-auto flex items-center gap-6 text-gray-500">
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-gray-400">
                  {t("requests.category", "Category")}
                </span>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 rounded-sm px-2 py-0.5"
                >
                  {isRTL && selectedCategory.nameAr
                    ? selectedCategory.nameAr
                    : selectedCategory.name}
                </Badge>
              </div>
            )}
            {selectedTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-gray-400">
                  {t("requests.types", "Types")}
                </span>
                <div className="flex gap-1">
                  {selectedTypes.map((type: any) => (
                    <Badge
                      key={type.id}
                      className="bg-[#0f62fe] text-white rounded-sm px-2 py-0.5"
                    >
                      {type.shortCode || type.code.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-gray-400">
                {t("common.status", "Status")}
              </span>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 rounded-sm px-2 py-0.5"
              >
                {t("common.new", "NEW")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Category Selection Step */}
          {currentStep === "category" && (
            <div className="h-full overflow-y-auto p-6 bg-[#f4f4f4]">
              <div className="max-w-4xl mx-auto bg-white border shadow-sm rounded-sm p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  {t("requests.selectCategory", "Select Request Category")}
                </h2>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
                  </div>
                ) : categories && (categories as any[]).length > 0 ? (
                  <CategorySelector
                    categories={categories as any[]}
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={handleCategorySelect}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>{t("requests.noCategories", "No categories available")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Type Selection Step */}
          {currentStep === "type" && (
            <div className="h-full overflow-y-auto p-6 bg-[#f4f4f4]">
              <div className="max-w-4xl mx-auto bg-white border shadow-sm rounded-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {t("requests.selectTypes", "Select Request Type(s)")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t("common.back", "Back")}
                  </Button>
                </div>
                {loadingTypes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
                  </div>
                ) : types && (types as any[]).length > 0 ? (
                  <>
                    <TypeSelector
                      types={types as any[]}
                      selectedTypeIds={selectedTypeIds}
                      onSelectionChange={handleTypeSelect}
                      allowMultiple={selectedCategory?.allowMultipleTypes || false}
                      combinationRules={selectedCategory?.combinationRules as any}
                    />
                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={handleProceedToForm}
                        disabled={selectedTypeIds.length === 0}
                        className="bg-[#0f62fe] hover:bg-[#0043ce] gap-2"
                      >
                        {t("common.continue", "Continue")}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>{t("requests.noTypes", "No types available for this category")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Step */}
          {currentStep === "form" && (
            <div className="h-full flex flex-col">
              {loadingForm ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
                </div>
              ) : formDefinition?.sections && formDefinition.sections.length > 0 ? (
                <>
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
                      onClick={handleBack}
                      className="text-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      {t("common.back", "Back")}
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit(true)}
                        disabled={createRequest.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {t("common.saveAsDraft", "Save as Draft")}
                      </Button>
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={createRequest.isPending}
                        className="bg-[#0f62fe] hover:bg-[#0043ce] gap-2"
                      >
                        {createRequest.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {t("common.submit", "Submit Request")}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>{t("requests.noFormDefinition", "No form definition available")}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
