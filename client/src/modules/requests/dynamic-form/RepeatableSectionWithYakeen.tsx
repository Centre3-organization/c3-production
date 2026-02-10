import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Plus, Trash2, ChevronDown, ChevronUp, Copy, GripVertical,
  ShieldCheck, CheckCircle2, XCircle, Edit3, Globe, Loader2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FieldRenderer } from "./FieldRenderer";
import { toast } from "sonner";

interface FormField {
  id: number;
  code: string;
  name: string;
  nameAr?: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  columnSpan: number;
  placeholder?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextAr?: string;
  defaultValue?: string;
  options?: any[];
  optionsSource?: "static" | "api" | "dependent" | 
    "countries" | "regions" | "cities" | 
    "sites" | "zones" | "areas" | 
    "departments" | "groups" | "users" | "contractors" | 
    "request_types" | "approval_roles" | 
    "user_sites" | "user_groups" | "user_departments" | "user_profile" | "material_types";
  optionsApi?: string;
  dependsOnField?: string;
  filterByField?: string;
  validation?: any;
  showCondition?: any;
}

interface RepeatableSectionWithYakeenProps {
  sectionCode: string;
  sectionName: string;
  sectionNameAr?: string;
  fields: FormField[];
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  minItems?: number;
  maxItems?: number;
  disabled?: boolean;
  itemLabel?: string;
  itemLabelAr?: string;
  getItemSummary?: (item: Record<string, any>, index: number) => string;
  enableYakeenVerification?: boolean;
  maxDurationDays?: number;
}

export function RepeatableSectionWithYakeen({
  sectionCode,
  sectionName,
  sectionNameAr,
  fields,
  items,
  onChange,
  minItems = 0,
  maxItems = 100,
  disabled = false,
  itemLabel,
  itemLabelAr,
  getItemSummary,
  enableYakeenVerification = false,
  maxDurationDays,
}: RepeatableSectionWithYakeenProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  
  // Yakeen verification state
  const [yakeenDialogOpen, setYakeenDialogOpen] = useState(false);
  const [visitorIdType, setVisitorIdType] = useState("national_id");
  const [visitorIdNumber, setVisitorIdNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [yakeenFailed, setYakeenFailed] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  
  // Manual entry fields
  const [manualName, setManualName] = useState("");
  const [manualNationality, setManualNationality] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualJobTitle, setManualJobTitle] = useState("");

  const getName = () => (isRTL && sectionNameAr ? sectionNameAr : sectionName);
  const getItemLabel = () => (isRTL && itemLabelAr ? itemLabelAr : itemLabel || "Item");

  // Reset Yakeen form
  const resetYakeenForm = () => {
    setVisitorIdNumber("");
    setIsValidated(false);
    setValidatedData(null);
    setYakeenFailed(false);
    setManualEntry(false);
    setManualName("");
    setManualNationality("");
    setManualPhone("");
    setManualCompany("");
    setManualEmail("");
    setManualJobTitle("");
  };

  // Yakeen validation
  const handleYakeenValidate = async () => {
    if (!visitorIdNumber) {
      toast.error(t("visitors.enterIdFirst", "Please enter ID number first"));
      return;
    }
    
    if (visitorIdType !== "passport" && !/^\d+$/.test(visitorIdNumber)) {
      toast.error(t("visitors.idDigitsOnly", "ID number must contain only digits"));
      return;
    }
    
    setIsValidating(true);
    setYakeenFailed(false);
    
    // Simulate Yakeen API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random failure (30% chance) for demo, or always fail for passport
    const shouldFail = Math.random() < 0.3 || visitorIdType === "passport";
    
    if (shouldFail) {
      setYakeenFailed(true);
      setIsValidating(false);
      toast.error(t("visitors.yakeenFailed", "Cannot identify through Yakeen - Please enter details manually"));
      return;
    }
    
    // Mock response based on ID type
    const mockData = {
      full_name: visitorIdType === "national_id" 
        ? "Mohammed Abdullah Al-Rashid" 
        : "Ahmed Hassan Khan",
      nationality: visitorIdType === "national_id" ? "Saudi Arabia" : "Pakistan",
      dateOfBirth: "1985-03-15",
      phone: "+966 50 123 4567",
      idType: visitorIdType,
      idNumber: visitorIdNumber,
    };
    
    setValidatedData(mockData);
    setIsValidated(true);
    setIsValidating(false);
    toast.success(t("visitors.yakeenSuccess", "Identity verified via Yakeen"));
  };

  // Add visitor from Yakeen dialog
  const handleAddFromYakeen = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newItem: Record<string, any>;
    
    if (manualEntry || yakeenFailed) {
      // Manual entry validation
      if (!manualName.trim()) {
        toast.error(t("visitors.enterName", "Please enter visitor name"));
        return;
      }
      if (!visitorIdNumber.trim()) {
        toast.error(t("visitors.enterId", "Please enter ID number"));
        return;
      }
      
      newItem = {
        full_name: manualName,
        id_type: visitorIdType,
        id_number: visitorIdNumber,
        nationality: manualNationality,
        mobile: manualPhone,
        email: manualEmail,
        company: manualCompany,
        job_title: manualJobTitle,
        verified: false,
        manualEntry: true,
      };
    } else {
      // Yakeen validated entry
      if (!isValidated || !validatedData) {
        toast.error(t("visitors.validateFirst", "Please validate visitor identity first"));
        return;
      }
      
      newItem = {
        full_name: validatedData.full_name,
        id_type: visitorIdType,
        id_number: visitorIdNumber,
        nationality: validatedData.nationality,
        mobile: validatedData.phone,
        verified: true,
        manualEntry: false,
      };
    }
    
    const newItems = [...items, newItem];
    onChange(newItems);
    setExpandedItems(new Set([...Array.from(expandedItems), newItems.length - 1]));
    
    // Reset form and close dialog
    resetYakeenForm();
    setYakeenDialogOpen(false);
    toast.success(t("visitors.addedSuccess", "Visitor added successfully"));
  };

  // Create default item with default values from fields
  const createDefaultItem = (): Record<string, any> => {
    const item: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue) {
        item[field.code] = field.defaultValue;
      }
    });
    return item;
  };

  const handleAddItem = () => {
    if (items.length >= maxItems) return;
    
    // If Yakeen verification is enabled, open the dialog instead
    if (enableYakeenVerification) {
      setYakeenDialogOpen(true);
      return;
    }
    
    const newItems = [...items, createDefaultItem()];
    onChange(newItems);
    setExpandedItems(new Set([...Array.from(expandedItems), newItems.length - 1]));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= minItems) return;
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    // Update expanded items indices
    const newExpanded = new Set<number>();
    expandedItems.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedItems(newExpanded);
  };

  const handleDuplicateItem = (index: number) => {
    if (items.length >= maxItems) return;
    const newItems = [...items];
    newItems.splice(index + 1, 0, { ...items[index] });
    onChange(newItems);
    setExpandedItems(new Set([...Array.from(expandedItems), index + 1]));
  };

  const handleFieldChange = (itemIndex: number, fieldCode: string, value: any) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [fieldCode]: value,
    };
    onChange(newItems);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getDefaultItemSummary = (item: Record<string, any>, index: number): string => {
    // Try to find a name-like field for summary
    const nameFields = ["full_name", "name", "title", "description", "material_type", "type"];
    for (const fieldCode of nameFields) {
      if (item[fieldCode]) {
        return String(item[fieldCode]);
      }
    }
    return `${getItemLabel()} ${index + 1}`;
  };

  // Sort fields by display order
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-2">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#2C2C2C]">{getName()}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length} / {maxItems}
          </Badge>
        </div>
        
        {enableYakeenVerification ? (
          <Dialog open={yakeenDialogOpen} onOpenChange={(open) => { 
            setYakeenDialogOpen(open); 
            if (!open) resetYakeenForm(); 
          }}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || items.length >= maxItems}
                className="gap-1 border-[#5B2C93] text-[#5B2C93] hover:bg-[#5B2C93]/5"
              >
                <Plus className="h-4 w-4" />
                {t("common.add", "Add")} {getItemLabel()}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#5B2C93]">
                  <ShieldCheck className="h-6 w-6" />
                  {manualEntry || yakeenFailed 
                    ? t("visitors.manualEntry", "Manual Visitor Entry")
                    : t("visitors.yakeenVerification", "Yakeen Identity Verification")}
                </DialogTitle>
                <DialogDescription>
                  {manualEntry || yakeenFailed 
                    ? t("visitors.manualEntryDesc", "Enter visitor details manually.")
                    : t("visitors.yakeenDesc", "Enter visitor ID for real-time government database verification.")}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddFromYakeen}>
                <div className="grid gap-4 py-4">
                  {/* ID Entry Section */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#2C2C2C]">
                          {t("visitors.idType", "ID Type")} <span className="text-[#FF6B6B]">*</span>
                        </Label>
                        <Select 
                          value={visitorIdType} 
                          onValueChange={(v) => { 
                            setVisitorIdType(v); 
                            resetYakeenForm(); 
                            setVisitorIdType(v); 
                          }}
                          disabled={isValidated}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national_id">{t("visitors.nationalId", "National ID")}</SelectItem>
                            <SelectItem value="iqama">{t("visitors.iqama", "Iqama")}</SelectItem>
                            <SelectItem value="passport">{t("visitors.passport", "Passport")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#2C2C2C]">
                          {t("visitors.idNumber", "ID Number")} <span className="text-[#FF6B6B]">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder={visitorIdType === "passport" 
                              ? t("visitors.enterPassport", "Enter passport number")
                              : t("visitors.enterIdNumber", "Enter ID number")}
                            value={visitorIdNumber}
                            onChange={(e) => {
                              const value = visitorIdType === "passport"
                                ? e.target.value.toUpperCase()
                                : e.target.value.replace(/\D/g, '');
                              setVisitorIdNumber(value);
                              setIsValidated(false);
                              setValidatedData(null);
                              setYakeenFailed(false);
                            }}
                            disabled={isValidated && !manualEntry}
                            className="font-mono flex-1"
                          />
                          {!manualEntry && !yakeenFailed && (
                            <Button 
                              type="button"
                              onClick={handleYakeenValidate}
                              disabled={!visitorIdNumber || isValidating || isValidated}
                              className={cn(
                                "min-w-[120px]",
                                isValidated 
                                  ? "bg-[#059669] hover:bg-[#059669]" 
                                  : "bg-[#5B2C93] hover:bg-[#5B2C93]/90"
                              )}
                            >
                              {isValidating ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  {t("common.verifying", "Verifying...")}
                                </>
                              ) : isValidated ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  {t("common.verified", "Verified")}
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  {t("visitors.verifyYakeen", "Verify Yakeen")}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Yakeen Failed Alert */}
                    {yakeenFailed && !manualEntry && (
                      <Alert className="bg-[#FEF3C7] border-[#D97706]">
                        <XCircle className="h-4 w-4 text-[#D97706]" />
                        <AlertTitle className="text-[#D97706]">
                          {t("visitors.cannotIdentify", "Cannot identify through Yakeen")}
                        </AlertTitle>
                        <AlertDescription className="text-[#D97706]">
                          <p className="mb-2">
                            {t("visitors.yakeenFailedDesc", "The ID could not be verified through Yakeen. You can enter the visitor details manually.")}
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setManualEntry(true)}
                            className="border-[#D97706] text-[#D97706] hover:bg-[#FEF3C7]"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            {t("visitors.enterManually", "Enter Manually")}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Passport Notice */}
                    {visitorIdType === "passport" && !manualEntry && !yakeenFailed && (
                      <Alert className="bg-[#E8DCF5] border-[#5B2C93]">
                        <Globe className="h-4 w-4 text-[#5B2C93]" />
                        <AlertTitle className="text-[#5B2C93]">
                          {t("visitors.passportVerification", "Passport Verification")}
                        </AlertTitle>
                        <AlertDescription className="text-[#5B2C93]">
                          {t("visitors.passportNotice", "Passport numbers are alphanumeric. Yakeen verification is not available for passports - manual entry will be required.")}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Verified Success Alert */}
                    {isValidated && !manualEntry && (
                      <Alert className="bg-[#D1FAE5] border-[#059669]">
                        <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                        <AlertTitle className="text-[#059669]">
                          {t("visitors.identityVerified", "Identity Verified")}
                        </AlertTitle>
                        <AlertDescription className="text-[#059669]">
                          {t("visitors.verifiedDesc", "Visitor identity has been verified via Yakeen.")}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {/* Validated details from Yakeen */}
                  {isValidated && validatedData && !manualEntry && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t("visitors.verifiedDetails", "Verified Details")}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6B6B6B] uppercase">{t("visitors.fullName", "Full Name")}</Label>
                            <Input value={validatedData.full_name} readOnly className="bg-[#F5F5F5] font-medium" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6B6B6B] uppercase">{t("visitors.nationality", "Nationality")}</Label>
                            <Input value={validatedData.nationality} readOnly className="bg-[#F5F5F5]" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6B6B6B] uppercase">{t("visitors.phone", "Phone")}</Label>
                            <Input value={validatedData.phone || ""} readOnly className="bg-[#F5F5F5]" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-[#6B6B6B] uppercase">{t("visitors.dateOfBirth", "Date of Birth")}</Label>
                            <Input value={validatedData.dateOfBirth || ""} readOnly className="bg-[#F5F5F5]" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Manual Entry Form */}
                  {(manualEntry || (yakeenFailed && manualEntry)) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Edit3 className="h-4 w-4" />
                          {t("visitors.manualEntry", "Manual Entry")}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.fullName", "Full Name")} <span className="text-[#FF6B6B]">*</span>
                            </Label>
                            <Input
                              placeholder={t("visitors.enterFullName", "Enter full name")}
                              value={manualName}
                              onChange={(e) => setManualName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.nationality", "Nationality")}
                            </Label>
                            <Input
                              placeholder={t("visitors.enterNationality", "Enter nationality")}
                              value={manualNationality}
                              onChange={(e) => setManualNationality(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.company", "Company")}
                            </Label>
                            <Input
                              placeholder={t("visitors.enterCompany", "Enter company name")}
                              value={manualCompany}
                              onChange={(e) => setManualCompany(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.jobTitle", "Job Title")}
                            </Label>
                            <Input
                              placeholder={t("visitors.enterJobTitle", "Enter job title")}
                              value={manualJobTitle}
                              onChange={(e) => setManualJobTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.mobile", "Mobile")}
                            </Label>
                            <Input
                              placeholder={t("visitors.enterMobile", "Enter mobile number")}
                              value={manualPhone}
                              onChange={(e) => setManualPhone(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">
                              {t("visitors.email", "Email")}
                            </Label>
                            <Input
                              type="email"
                              placeholder={t("visitors.enterEmail", "Enter email address")}
                              value={manualEmail}
                              onChange={(e) => setManualEmail(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { 
                      setYakeenDialogOpen(false); 
                      resetYakeenForm(); 
                    }}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#5B2C93] hover:bg-[#5B2C93]/90" 
                    disabled={!isValidated && !manualEntry && !yakeenFailed}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("visitors.addVisitor", "Add Visitor")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={disabled || items.length >= maxItems}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("common.add", "Add")} {getItemLabel()}
          </Button>
        )}
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-8 text-center">
          <User className="h-12 w-12 mx-auto text-[#9CA3AF] mb-3" />
          <p className="text-[#6B6B6B] mb-4">
            {t("common.noItemsYet", "No {{item}} added yet", { item: getItemLabel().toLowerCase() })}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("common.addFirst", "Add first {{item}}", { item: getItemLabel().toLowerCase() })}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const summary = getItemSummary
              ? getItemSummary(item, index)
              : getDefaultItemSummary(item, index);
            const isVerified = item.verified === true;

            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(index)}
              >
                <Card className={cn(
                  "transition-shadow",
                  isExpanded && "shadow-md border-[#5B2C93]/30",
                  isVerified && "border-l-4 border-l-[#059669]"
                )}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-2 px-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-[#9CA3AF] cursor-grab" />
                        <div className="flex-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <CardTitle className="text-sm font-medium truncate">
                            {summary}
                          </CardTitle>
                          {isVerified && (
                            <Badge className="bg-[#D1FAE5] text-[#059669] text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t("visitors.verified", "Verified")}
                            </Badge>
                          )}
                          {item.manualEntry && (
                            <Badge variant="outline" className="text-xs text-[#D97706] border-[#D97706]">
                              <Edit3 className="h-3 w-3 mr-1" />
                              {t("visitors.manual", "Manual")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateItem(index);
                            }}
                            disabled={disabled || items.length >= maxItems}
                            title={t("common.duplicate", "Duplicate")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#FF6B6B] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(index);
                            }}
                            disabled={disabled || items.length <= minItems}
                            title={t("common.remove", "Remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[#6B6B6B]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-3">
                      <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                        {sortedFields.map((field) => (
                          <div
                            key={field.id}
                            className={`col-span-12 md:col-span-${field.columnSpan || 6}`}
                            style={{
                              gridColumn: `span ${Math.min(field.columnSpan || 6, 12)} / span ${Math.min(field.columnSpan || 6, 12)}`,
                            }}
                          >
                            <FieldRenderer
                              field={field}
                              value={item[field.code]}
                              onChange={(value) => handleFieldChange(index, field.code, value)}
                              formValues={item}
                              disabled={disabled}
                              maxDurationDays={maxDurationDays}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Min/max items hint */}
      {(minItems > 0 || maxItems < 100) && (
        <p className="text-xs text-[#6B6B6B]">
          {minItems > 0 && maxItems < 100
            ? t("common.itemsRange", "{{min}} to {{max}} items required", { min: minItems, max: maxItems })
            : minItems > 0
            ? t("common.minItems", "Minimum {{min}} items required", { min: minItems })
            : t("common.maxItems", "Maximum {{max}} items allowed", { max: maxItems })}
        </p>
      )}
    </div>
  );
}
