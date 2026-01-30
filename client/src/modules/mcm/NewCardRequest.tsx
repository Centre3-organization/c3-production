import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  User, 
  FileText, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  Save,
  Search,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Loader2,
  Upload,
  X,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

// Section definitions for MCM card request
const SECTIONS = [
  { id: "company", code: "company", name: "Company Information", nameAr: "معلومات الشركة", icon: Building2 },
  { id: "personal", code: "personal", name: "Personal Information", nameAr: "المعلومات الشخصية", icon: User },
  { id: "documents", code: "documents", name: "Documents", nameAr: "المستندات", icon: FileText },
  { id: "access", code: "access", name: "Access Levels", nameAr: "مستويات الوصول", icon: Shield },
  { id: "review", code: "review", name: "Review & Submit", nameAr: "المراجعة والإرسال", icon: CheckCircle },
];

export default function NewCardRequest() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState("company");
  
  // Form state
  const [formData, setFormData] = useState({
    // Company info
    companyType: "" as "contractor" | "subcontractor" | "client" | "centre3" | "",
    companyId: undefined as number | undefined,
    
    // Personal info
    idType: "saudi_id" as "saudi_id" | "iqama",
    idNumber: "",
    fullName: "",
    fullNameAr: "",
    birthDate: "",
    nationality: "",
    gender: "male" as "male" | "female",
    bloodType: "",
    mobile: "",
    email: "",
    profession: "",
    
    // ID document details
    idIssueDate: "",
    idIssuePlace: "",
    idExpiryDate: "",
    
    // Documents (S3 URLs)
    photoUrl: "",
    idDocumentUrl: "",
    contractUrl: "",
    
    // Access levels
    accessLevels: [] as Array<{
      countryCode: string;
      siteId: number;
      accessLevelId: number;
      roomIds?: number[];
    }>,
  });

  // Fetch companies
  const { data: companies } = trpc.mcm.companies.list.useQuery({ isActive: true });
  
  // Fetch access levels
  const { data: accessLevels } = trpc.mcm.accessLevels.list.useQuery({ isActive: true });
  
  // Fetch sites
  const { data: sites } = trpc.sites.getAll.useQuery();

  // Create request mutation
  const createMutation = trpc.mcm.requests.createCardRequest.useMutation({
    onSuccess: (data) => {
      toast.success(t("mcm.requestCreated", "Card request created successfully"));
      navigate(`/mcm`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (asDraft: boolean = false) => {
    // Validate required fields
    if (!formData.companyType || !formData.idNumber || !formData.fullName) {
      toast.error(t("mcm.fillRequiredFields", "Please fill all required fields"));
      return;
    }

    if (!formData.companyType) {
      toast.error(t("mcm.selectCompanyType", "Please select a company type"));
      return;
    }
    
    createMutation.mutate({
      ...formData,
      companyType: formData.companyType as "contractor" | "subcontractor" | "client" | "centre3",
      companyId: formData.companyId || undefined,
    });
  };

  const addAccessLevel = () => {
    setFormData((prev) => ({
      ...prev,
      accessLevels: [
        ...prev.accessLevels,
        { countryCode: "SA", siteId: 0, accessLevelId: 0 },
      ],
    }));
  };

  const removeAccessLevel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      accessLevels: prev.accessLevels.filter((_, i) => i !== index),
    }));
  };

  const updateAccessLevel = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      accessLevels: prev.accessLevels.map((level, i) =>
        i === index ? { ...level, [field]: value } : level
      ),
    }));
  };

  const getSectionName = (section: typeof SECTIONS[0]) => {
    return isRTL ? section.nameAr : section.name;
  };

  const currentSectionIndex = SECTIONS.findIndex(s => s.code === currentSection);

  const goToNextSection = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentSectionIndex + 1].code);
    }
  };

  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSection(SECTIONS[currentSectionIndex - 1].code);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case "company":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.companyType", "Company Type")} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.companyType} onValueChange={(v) => updateField("companyType", v)}>
                  <SelectTrigger className="h-10 border-gray-300">
                    <SelectValue placeholder={t("mcm.selectCompanyType", "Select company type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">{t("mcm.contractor", "Contractor")}</SelectItem>
                    <SelectItem value="subcontractor">{t("mcm.subcontractor", "Subcontractor")}</SelectItem>
                    <SelectItem value="client">{t("mcm.client", "Client")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.company", "Company")}
                </Label>
                <Select 
                  value={formData.companyId?.toString()} 
                  onValueChange={(v) => updateField("companyId", parseInt(v))}
                >
                  <SelectTrigger className="h-10 border-gray-300">
                    <SelectValue placeholder={t("mcm.selectCompany", "Select company")} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.filter((c: any) => c.type === formData.companyType || !formData.companyType)
                      .map((company: any) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "personal":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.idType", "ID Type")} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.idType} onValueChange={(v) => updateField("idType", v)}>
                  <SelectTrigger className="h-10 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saudi_id">{t("mcm.saudiId", "Saudi ID")}</SelectItem>
                    <SelectItem value="iqama">{t("mcm.iqama", "Iqama")}</SelectItem>
                    <SelectItem value="passport">{t("mcm.passport", "Passport")}</SelectItem>
                    <SelectItem value="gcc_id">{t("mcm.gccId", "GCC ID")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.idNumber", "ID Number")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.idNumber}
                  onChange={(e) => updateField("idNumber", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder={t("mcm.enterIdNumber", "Enter ID number")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.idExpiryDate", "ID Expiry Date")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.idExpiryDate}
                  onChange={(e) => updateField("idExpiryDate", e.target.value)}
                  className="h-10 border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.fullName", "Full Name (English)")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder={t("mcm.enterFullName", "Enter full name")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.fullNameAr", "Full Name (Arabic)")}
                </Label>
                <Input
                  value={formData.fullNameAr}
                  onChange={(e) => updateField("fullNameAr", e.target.value)}
                  className="h-10 border-gray-300"
                  dir="rtl"
                  placeholder={t("mcm.enterFullNameAr", "أدخل الاسم الكامل")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.birthDate", "Date of Birth")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  className="h-10 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.nationality", "Nationality")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => updateField("nationality", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder={t("mcm.enterNationality", "Enter nationality")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.gender", "Gender")} <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger className="h-10 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("mcm.male", "Male")}</SelectItem>
                    <SelectItem value="female">{t("mcm.female", "Female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.mobile", "Mobile Number")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder="+966 5XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.email", "Email")}
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.profession", "Profession")}
                </Label>
                <Input
                  value={formData.profession}
                  onChange={(e) => updateField("profession", e.target.value)}
                  className="h-10 border-gray-300"
                  placeholder={t("mcm.enterProfession", "Enter profession")}
                />
              </div>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.photo", "Photo")} <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0f62fe] transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{t("mcm.uploadPhoto", "Click to upload photo")}</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.idDocument", "ID Document")} <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0f62fe] transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{t("mcm.uploadIdDocument", "Click to upload ID document")}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t("mcm.contract", "Contract/Letter")}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0f62fe] transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{t("mcm.uploadContract", "Click to upload contract")}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "access":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">
                {t("mcm.accessLevels", "Access Levels")}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAccessLevel}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("mcm.addAccessLevel", "Add Access Level")}
              </Button>
            </div>

            {formData.accessLevels.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">{t("mcm.noAccessLevels", "No access levels added yet")}</p>
                <Button variant="outline" onClick={addAccessLevel} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("mcm.addFirstAccessLevel", "Add First Access Level")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.accessLevels.map((level, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="bg-white">
                        {t("mcm.accessLevel", "Access Level")} #{index + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAccessLevel(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t("mcm.site", "Site")} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={level.siteId?.toString()}
                          onValueChange={(v) => updateAccessLevel(index, "siteId", parseInt(v))}
                        >
                          <SelectTrigger className="h-10 border-gray-300 bg-white">
                            <SelectValue placeholder={t("mcm.selectSite", "Select site")} />
                          </SelectTrigger>
                          <SelectContent>
                            {sites?.map((site: any) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t("mcm.accessLevel", "Access Level")} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={level.accessLevelId?.toString()}
                          onValueChange={(v) => updateAccessLevel(index, "accessLevelId", parseInt(v))}
                        >
                          <SelectTrigger className="h-10 border-gray-300 bg-white">
                            <SelectValue placeholder={t("mcm.selectAccessLevel", "Select access level")} />
                          </SelectTrigger>
                          <SelectContent>
                            {accessLevels?.map((al: any) => (
                              <SelectItem key={al.id} value={al.id.toString()}>
                                {al.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t("mcm.countryCode", "Country")}
                        </Label>
                        <Select
                          value={level.countryCode}
                          onValueChange={(v) => updateAccessLevel(index, "countryCode", v)}
                        >
                          <SelectTrigger className="h-10 border-gray-300 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SA">Saudi Arabia</SelectItem>
                            <SelectItem value="AE">UAE</SelectItem>
                            <SelectItem value="QA">Qatar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">
                {t("mcm.reviewSubmission", "Review Your Submission")}
              </h3>
              <p className="text-sm text-blue-600">
                {t("mcm.reviewDescription", "Please review all information before submitting your card request.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Company Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("mcm.companyInfo", "Company Information")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.companyType", "Company Type")}:</span>
                    <span className="font-medium">{formData.companyType || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.company", "Company")}:</span>
                    <span className="font-medium">
                      {companies?.find((c: any) => c.id === formData.companyId)?.name || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("mcm.personalInfo", "Personal Information")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.fullName", "Full Name")}:</span>
                    <span className="font-medium">{formData.fullName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.idNumber", "ID Number")}:</span>
                    <span className="font-medium">{formData.idNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.nationality", "Nationality")}:</span>
                    <span className="font-medium">{formData.nationality || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("mcm.mobile", "Mobile")}:</span>
                    <span className="font-medium">{formData.mobile || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Levels Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("mcm.accessLevels", "Access Levels")} ({formData.accessLevels.length})
              </h4>
              {formData.accessLevels.length > 0 ? (
                <div className="space-y-2">
                  {formData.accessLevels.map((level, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span>
                        {t("mcm.site", "Site")}: {sites?.find((s: any) => s.id === level.siteId)?.name || "-"} | 
                        {t("mcm.level", "Level")}: {accessLevels?.find((a: any) => a.id === level.accessLevelId)?.name || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("mcm.noAccessLevelsAdded", "No access levels added")}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-[#f4f4f4] font-poppins">
      {/* Top Toolbar - IBM Maximo Style */}
      <div className="bg-[#161616] text-white px-4 h-12 flex items-center justify-between text-sm shadow-md z-10">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-wide text-white uppercase">
            {t("mcm.createNewCardRequest", "CREATE NEW CARD REQUEST")}
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
              disabled={createMutation.isPending}
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
        <Link href="/mcm">
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

        <div className="ml-auto flex items-center gap-6 text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-gray-400">
              {t("mcm.requestType", "Request Type")}
            </span>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 rounded-sm px-2 py-0.5"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              {t("mcm.newCard", "NEW CARD")}
            </Badge>
          </div>
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
      <div className="flex-1 overflow-hidden flex">
        {/* Left Navigation Tabs (Vertical) */}
        <div className="w-64 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm uppercase">
              {t("mcm.sections", "Sections")}
            </h3>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = currentSection === section.code;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setCurrentSection(section.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-[#e5f6ff] text-[#0043ce] border-l-4 border-[#0f62fe]"
                      : "text-gray-600 hover:bg-gray-100 border-l-4 border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-[#0f62fe]" : "text-gray-400"
                    )}
                  />
                  <span className="flex-1 text-left truncate">{getSectionName(section)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section Header */}
          <div className="bg-white border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {getSectionName(SECTIONS.find(s => s.code === currentSection)!)}
            </h2>
          </div>

          {/* Section Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {renderSectionContent()}
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPrevSection}
              disabled={currentSectionIndex === 0}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("common.previous", "Previous")}
            </Button>
            <div className="flex gap-3">
              {currentSection === "review" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={createMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t("common.saveAsDraft", "Save as Draft")}
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={createMutation.isPending}
                    className="bg-[#0f62fe] hover:bg-[#0043ce] gap-2"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("common.submit", "Submit Request")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={goToNextSection}
                  className="bg-[#0f62fe] hover:bg-[#0043ce] gap-2"
                >
                  {t("common.next", "Next")}
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
