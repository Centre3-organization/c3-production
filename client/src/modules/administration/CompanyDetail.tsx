import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Building2, Users, CreditCard, FileText, Calendar,
  Phone, Mail, MapPin, Globe, Hash, User, Briefcase, Shield,
  AlertTriangle, CheckCircle2, Clock, XCircle, Loader2, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  active: "bg-[#D1FAE5] text-[#059669] border-[#059669]",
  inactive: "bg-[#F5F5F5] text-[#6B6B6B] border-[#E0E0E0]",
  suspended: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  pending: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  blocked: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  expired: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  approved: "bg-[#D1FAE5] text-[#059669] border-[#059669]",
  rejected: "bg-[#FFE5E5] text-[#FF6B6B] border-[#FF6B6B]",
  pending_approval: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]",
  draft: "bg-[#F5F5F5] text-[#6B6B6B] border-[#E0E0E0]",
  cancelled: "bg-[#F5F5F5] text-[#6B6B6B] border-[#E0E0E0]",
};

const typeLabels: Record<string, string> = {
  contractor: "Contractor",
  subcontractor: "Sub-Contractor",
  client: "Client",
};

const requestTypeLabels: Record<string, string> = {
  admin_visit: "Admin Visit",
  work_permit: "Work Permit",
  material_entry: "Material Entry",
  tep: "TEP",
  mop: "MOP",
  escort: "Escort",
};

export default function CompanyDetail() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/companies/:id");
  const companyId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: company, isLoading } = trpc.masterData.getCompanyDetails.useQuery(
    { id: companyId },
    { enabled: !!companyId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B2C93]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="h-12 w-12 text-[#6B6B6B]" />
        <p className="text-lg text-[#6B6B6B]">Company not found</p>
        <Button variant="outline" onClick={() => setLocation("/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
        </Button>
      </div>
    );
  }

  const isContractExpiring = company.contractEndDate && 
    new Date(company.contractEndDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/companies")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">{company.name}</h1>
              {company.nameAr && (
                <span className="text-lg text-[#6B6B6B] font-arabic">{company.nameAr}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {company.code && (
                <Badge variant="outline" className="font-mono text-xs">
                  <Hash className="h-3 w-3 mr-1" />{company.code}
                </Badge>
              )}
              <Badge className={`${statusColors[company.status] || ""} border`}>
                {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
              </Badge>
              <Badge variant="outline">
                {typeLabels[company.type] || company.type}
              </Badge>
              {company.parentCompany && (
                <Badge variant="outline" className="bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93] cursor-pointer"
                  onClick={() => setLocation(`/companies/${company.parentCompany!.id}`)}>
                  <Building2 className="h-3 w-3 mr-1" />
                  Parent: {company.parentCompany.name}
                </Badge>
              )}
              {isContractExpiring && (
                <Badge className="bg-[#FEF3C7] text-[#D97706] border-[#D97706] border">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Contract Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#5B2C93]" />
              <span className="text-xs text-[#6B6B6B]">Active Cards</span>
            </div>
            <p className="text-2xl font-medium mt-1">{company.stats.activeCardholders}</p>
            <p className="text-xs text-[#6B6B6B]">of {company.stats.totalCardholders} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#5B2C93]" />
              <span className="text-xs text-[#6B6B6B]">Sub-Companies</span>
            </div>
            <p className="text-2xl font-medium mt-1">{company.stats.subCompanyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#059669]" />
              <span className="text-xs text-[#6B6B6B]">Active Requests</span>
            </div>
            <p className="text-2xl font-medium mt-1">{company.stats.activeRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#6B6B6B]" />
              <span className="text-xs text-[#6B6B6B]">Total Requests</span>
            </div>
            <p className="text-2xl font-medium mt-1">{company.stats.totalRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#D97706]" />
              <span className="text-xs text-[#6B6B6B]">Contract End</span>
            </div>
            <p className="text-lg font-medium mt-1">
              {company.contractEndDate 
                ? format(new Date(company.contractEndDate), "MMM d, yyyy")
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cardholders">
            Cardholders ({company.stats.totalCardholders})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({company.stats.totalRequests})
          </TabsTrigger>
          {company.stats.subCompanyCount > 0 && (
            <TabsTrigger value="subcompanies">
              Sub-Companies ({company.stats.subCompanyCount})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Code" value={company.code || "—"} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Type" value={typeLabels[company.type] || company.type} />
                <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Registration No." value={company.registrationNumber || "—"} />
                <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={company.address || "—"} />
                <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="City" value={company.city || "—"} />
                <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Country" value={company.country || "—"} />
                {company.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-[#6B6B6B] mb-1">Notes</p>
                    <p className="text-sm">{company.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Person
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Name" value={company.contactPersonName || company.contactPerson || "—"} />
                <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Position" value={company.contactPersonPosition || "—"} />
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={company.contactPersonEmail || company.contactEmail || "—"} />
                <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={company.contactPersonPhone || company.contactPhone || "—"} />
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Reference" value={company.contractReference || "—"} />
                  <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Start Date" 
                    value={company.contractStartDate ? format(new Date(company.contractStartDate), "MMM d, yyyy") : "—"} />
                  <div>
                    <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="End Date" 
                      value={company.contractEndDate ? format(new Date(company.contractEndDate), "MMM d, yyyy") : "—"} />
                    {isContractExpiring && (
                      <p className="text-xs text-[#D97706] mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Expiring within 30 days
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cardholders Tab */}
        <TabsContent value="cardholders">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cardholders</CardTitle>
            </CardHeader>
            <CardContent>
              {company.cardholders.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-[#6B6B6B]">
                  <CreditCard className="h-8 w-8 mb-2" />
                  <p>No cardholders registered for this company</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card No.</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Profession</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>ID Expiry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.cardholders.map((ch: any) => (
                        <TableRow key={ch.id}>
                          <TableCell className="font-mono text-xs">{ch.cardNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{ch.fullName}</p>
                              {ch.fullNameAr && <p className="text-xs text-[#6B6B6B] font-arabic">{ch.fullNameAr}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{ch.idNumber}</p>
                              <p className="text-xs text-[#6B6B6B]">{ch.idType?.replace("_", " ")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{ch.profession || "—"}</TableCell>
                          <TableCell className="text-sm">{ch.mobile || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[ch.status] || ""} border text-xs`}>
                              {ch.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {ch.idExpiryDate ? format(new Date(ch.idExpiryDate), "MMM d, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Access Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {company.requests.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-[#6B6B6B]">
                  <FileText className="h-8 w-8 mb-2" />
                  <p>No access requests found for this company</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request No.</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.requests.map((req: any) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono text-xs">{req.requestNumber}</TableCell>
                          <TableCell className="text-sm font-medium">{req.visitorName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {requestTypeLabels[req.type] || req.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[req.status] || ""} border text-xs`}>
                              {req.status?.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{req.startDate || "—"}</TableCell>
                          <TableCell className="text-sm">{req.endDate || "—"}</TableCell>
                          <TableCell className="text-sm">
                            {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sub-Companies Tab */}
        {company.stats.subCompanyCount > 0 && (
          <TabsContent value="subcompanies">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sub-Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.subCompanies.map((sub: any) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-mono text-xs">{sub.code || "—"}</TableCell>
                          <TableCell className="text-sm font-medium">{sub.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {typeLabels[sub.type] || sub.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{sub.contactPersonName || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[sub.status] || ""} border text-xs`}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/companies/${sub.id}`)}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#6B6B6B] mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-[#6B6B6B]">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
