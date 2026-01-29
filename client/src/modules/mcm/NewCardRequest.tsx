import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  User, 
  FileText, 
  Shield, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const TABS = ["company", "personal", "documents", "access", "review"];

export default function NewCardRequest() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("company");
  
  // Form state
  const [formData, setFormData] = useState({
    // Company info
    companyType: "",
    companyId: undefined as number | undefined,
    
    // Personal info
    idType: "saudi_id",
    idNumber: "",
    fullName: "",
    fullNameAr: "",
    birthDate: "",
    nationality: "",
    gender: "male",
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
      navigate(`/mcm/requests/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const currentTabIndex = TABS.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === TABS.length - 1;

  const goNext = () => {
    if (!isLastTab) {
      setActiveTab(TABS[currentTabIndex + 1]);
    }
  };

  const goPrev = () => {
    if (!isFirstTab) {
      setActiveTab(TABS[currentTabIndex - 1]);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate({
      companyType: formData.companyType as any,
      companyId: formData.companyId,
      idType: formData.idType as any,
      idNumber: formData.idNumber,
      fullName: formData.fullName,
      fullNameAr: formData.fullNameAr,
      birthDate: formData.birthDate,
      nationality: formData.nationality,
      gender: formData.gender as any,
      bloodType: formData.bloodType,
      mobile: formData.mobile,
      email: formData.email,
      profession: formData.profession,
      idIssueDate: formData.idIssueDate,
      idIssuePlace: formData.idIssuePlace,
      idExpiryDate: formData.idExpiryDate,
      photoUrl: formData.photoUrl,
      idDocumentUrl: formData.idDocumentUrl,
      contractUrl: formData.contractUrl,
      accessLevels: formData.accessLevels,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("mcm.newCardRequest", "New Card Request")}</h1>
        <p className="text-muted-foreground">
          {t("mcm.newCardRequestDesc", "Submit a request for a new magnetic access card")}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {TABS.map((tab, index) => (
          <div key={tab} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentTabIndex
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {index < currentTabIndex ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < TABS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-2 ${
                  index < currentTabIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("mcm.company", "Company")}</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("mcm.personal", "Personal")}</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t("mcm.documents", "Documents")}</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t("mcm.access", "Access")}</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{t("mcm.review", "Review")}</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Company Tab */}
            <TabsContent value="company" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("mcm.companyType", "Company Type")} *</Label>
                  <Select
                    value={formData.companyType}
                    onValueChange={(v) => updateField("companyType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("mcm.selectCompanyType", "Select company type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centre3">{t("mcm.centre3Employee", "Centre3 Employee")}</SelectItem>
                      <SelectItem value="contractor">{t("mcm.contractor", "Contractor")}</SelectItem>
                      <SelectItem value="subcontractor">{t("mcm.subcontractor", "Sub-Contractor")}</SelectItem>
                      <SelectItem value="client">{t("mcm.client", "Client")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.companyType && formData.companyType !== "centre3" && (
                  <div className="space-y-2">
                    <Label>{t("mcm.company", "Company")} *</Label>
                    <Select
                      value={formData.companyId?.toString() || ""}
                      onValueChange={(v) => updateField("companyId", parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("mcm.selectCompany", "Select company")} />
                      </SelectTrigger>
                      <SelectContent>
                        {companies
                          ?.filter((c) => c.type === formData.companyType)
                          .map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Personal Tab */}
            <TabsContent value="personal" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("mcm.idType", "ID Type")} *</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(v) => updateField("idType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saudi_id">{t("mcm.saudiId", "Saudi ID")}</SelectItem>
                      <SelectItem value="iqama">{t("mcm.iqama", "Iqama")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.idNumber", "ID Number")} *</Label>
                  <Input
                    value={formData.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                    placeholder="10XXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.fullName", "Full Name (English)")} *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.fullNameAr", "Full Name (Arabic)")}</Label>
                  <Input
                    value={formData.fullNameAr}
                    onChange={(e) => updateField("fullNameAr", e.target.value)}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.birthDate", "Birth Date")} *</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.nationality", "Nationality")}</Label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.gender", "Gender")} *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => updateField("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("mcm.male", "Male")}</SelectItem>
                      <SelectItem value="female">{t("mcm.female", "Female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.bloodType", "Blood Type")}</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(v) => updateField("bloodType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("mcm.selectBloodType", "Select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.mobile", "Mobile Number")} *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => updateField("mobile", e.target.value)}
                    placeholder="+966XXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.email", "Email")}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.profession", "Profession")}</Label>
                  <Input
                    value={formData.profession}
                    onChange={(e) => updateField("profession", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">{t("mcm.idDetails", "ID Document Details")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t("mcm.idIssueDate", "Issue Date")}</Label>
                    <Input
                      type="date"
                      value={formData.idIssueDate}
                      onChange={(e) => updateField("idIssueDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("mcm.idIssuePlace", "Issue Place")}</Label>
                    <Input
                      value={formData.idIssuePlace}
                      onChange={(e) => updateField("idIssuePlace", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("mcm.idExpiryDate", "Expiry Date")} *</Label>
                    <Input
                      type="date"
                      value={formData.idExpiryDate}
                      onChange={(e) => updateField("idExpiryDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{t("mcm.photo", "Photo")}</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("mcm.uploadPhoto", "Upload passport photo")}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="mt-2"
                      onChange={(e) => {
                        // In production, upload to S3 and get URL
                        const file = e.target.files?.[0];
                        if (file) {
                          updateField("photoUrl", URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.idDocument", "ID Document")}</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("mcm.uploadIdDocument", "Upload ID copy")}
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-2"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateField("idDocumentUrl", URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("mcm.contract", "Contract/Authorization")}</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("mcm.uploadContract", "Upload contract")}
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mt-2"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateField("contractUrl", URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Access Tab */}
            <TabsContent value="access" className="space-y-4 mt-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{t("mcm.accessLevels", "Access Levels")}</h3>
                <Button variant="outline" onClick={addAccessLevel}>
                  {t("mcm.addAccessLevel", "Add Access Level")}
                </Button>
              </div>

              {formData.accessLevels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("mcm.noAccessLevels", "No access levels added. Click 'Add Access Level' to begin.")}
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.accessLevels.map((level, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline">
                            {t("mcm.accessLevel", "Access Level")} {index + 1}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAccessLevel(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>{t("mcm.site", "Site")}</Label>
                            <Select
                              value={level.siteId?.toString() || ""}
                              onValueChange={(v) =>
                                updateAccessLevel(index, "siteId", parseInt(v))
                              }
                            >
                              <SelectTrigger>
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
                            <Label>{t("mcm.accessLevel", "Access Level")}</Label>
                            <Select
                              value={level.accessLevelId?.toString() || ""}
                              onValueChange={(v) =>
                                updateAccessLevel(index, "accessLevelId", parseInt(v))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("mcm.selectAccessLevel", "Select level")} />
                              </SelectTrigger>
                              <SelectContent>
                                {accessLevels?.map((al) => (
                                  <SelectItem key={al.id} value={al.id.toString()}>
                                    {al.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("mcm.companyInfo", "Company Information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("mcm.companyType", "Company Type")}</span>
                      <span className="font-medium">{formData.companyType || "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("mcm.personalInfo", "Personal Information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("mcm.fullName", "Full Name")}</span>
                      <span className="font-medium">{formData.fullName || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("mcm.idNumber", "ID Number")}</span>
                      <span className="font-medium">{formData.idNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("mcm.mobile", "Mobile")}</span>
                      <span className="font-medium">{formData.mobile || "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("mcm.accessLevels", "Access Levels")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.accessLevels.length > 0 ? (
                      <div className="space-y-2">
                        {formData.accessLevels.map((level, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span>
                              Site: {sites?.find((s: any) => s.id === level.siteId)?.name || "-"} |{" "}
                              Level: {accessLevels?.find((a) => a.id === level.accessLevelId)?.name || "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t("mcm.noAccessLevels", "No access levels selected")}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={isFirstTab}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("common.previous", "Previous")}
              </Button>

              {isLastTab ? (
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? t("common.submitting", "Submitting...")
                    : t("mcm.submitRequest", "Submit Request")}
                </Button>
              ) : (
                <Button onClick={goNext}>
                  {t("common.next", "Next")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
