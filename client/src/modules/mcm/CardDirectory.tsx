import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Ban, 
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Clock,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function CardDirectory() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockType, setBlockType] = useState<string>("temporary");

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.mcm.getStats.useQuery();

  // Fetch cards
  const { data: cardsData, isLoading, refetch } = trpc.mcm.cards.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    companyType: companyTypeFilter !== "all" ? companyTypeFilter as any : undefined,
    page,
    limit: 20,
  });

  // Block card mutation
  const blockMutation = trpc.mcm.admin.blockCard.useMutation({
    onSuccess: () => {
      refetch();
      setShowBlockDialog(false);
      setSelectedCard(null);
    },
  });

  // Unblock card mutation
  const unblockMutation = trpc.mcm.admin.unblockCard.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const statCards = [
    {
      title: t("mcm.stats.activeCards", "Active Cards"),
      value: stats?.activeCards || 0,
      icon: CreditCard,
      color: "text-[#4ECDC4]",
      bgColor: "bg-[#E8F9F8]/10",
    },
    {
      title: t("mcm.stats.pendingRequests", "Pending Requests"),
      value: stats?.pendingRequests || 0,
      icon: FileText,
      color: "text-[#5B2C93]",
      bgColor: "bg-[#E8DCF5]/10",
    },
    {
      title: t("mcm.stats.expiringSoon", "Expiring Soon"),
      value: stats?.expiringSoon || 0,
      icon: Clock,
      color: "text-[#FFB84D]",
      bgColor: "bg-[#FFF4E5]/10",
    },
    {
      title: t("mcm.stats.blockedCards", "Blocked Cards"),
      value: stats?.blockedCards || 0,
      icon: AlertTriangle,
      color: "text-[#FF6B6B]",
      bgColor: "bg-[#FF6B6B]/10",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "secondary",
      inactive: "outline",
      blocked: "destructive",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCompanyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      centre3: "bg-[#E8DCF5]/10 text-[#5B2C93]",
      contractor: "bg-[#FFF4E5]0/10 text-[#FFB84D]",
      subcontractor: "bg-[#E8DCF5]0/10 text-[#5B2C93]",
      client: "bg-[#E8F9F8]/10 text-[#4ECDC4]",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || ""}`}>
        {type}
      </span>
    );
  };

  const handleBlock = () => {
    if (!selectedCard || !blockReason) return;
    blockMutation.mutate({
      cardId: selectedCard.id,
      blockReason: blockReason as any,
      blockType: blockType as any,
    });
  };

  const handleUnblock = (cardId: number) => {
    unblockMutation.mutate({
      cardId,
      reason: "Unblocked by admin",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium">{t("mcm.title", "Magnetic Card Management")}</h1>
          <p className="text-[#6B6B6B]">
            {t("mcm.subtitle", "Manage access cards for employees and contractors")}
          </p>
        </div>
        <Link href="/mcm/request/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("mcm.newRequest", "New Card Request")}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B]">{stat.title}</p>
                  <p className="text-3xl font-medium mt-1">
                    {statsLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
              <Input
                placeholder={t("mcm.searchCards", "Search by name, ID, or card number...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("mcm.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                <SelectItem value="active">{t("mcm.active", "Active")}</SelectItem>
                <SelectItem value="pending">{t("mcm.pending", "Pending")}</SelectItem>
                <SelectItem value="inactive">{t("mcm.inactive", "Inactive")}</SelectItem>
                <SelectItem value="blocked">{t("mcm.blocked", "Blocked")}</SelectItem>
                <SelectItem value="expired">{t("mcm.expired", "Expired")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("mcm.companyType", "Company Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                <SelectItem value="centre3">{t("mcm.centre3", "Centre3")}</SelectItem>
                <SelectItem value="contractor">{t("mcm.contractor", "Contractor")}</SelectItem>
                <SelectItem value="subcontractor">{t("mcm.subcontractor", "Sub-Contractor")}</SelectItem>
                <SelectItem value="client">{t("mcm.client", "Client")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("mcm.cardNumber", "Card Number")}</TableHead>
                <TableHead>{t("mcm.fullName", "Full Name")}</TableHead>
                <TableHead>{t("mcm.idNumber", "ID Number")}</TableHead>
                <TableHead>{t("mcm.companyType", "Company Type")}</TableHead>
                <TableHead>{t("mcm.status", "Status")}</TableHead>
                <TableHead>{t("mcm.expiryDate", "Expiry Date")}</TableHead>
                <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {t("common.loading", "Loading...")}
                  </TableCell>
                </TableRow>
              ) : cardsData?.cards && cardsData.cards.length > 0 ? (
                cardsData.cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono">{card.cardNumber}</TableCell>
                    <TableCell className="font-medium">{card.fullName}</TableCell>
                    <TableCell>{card.idNumber}</TableCell>
                    <TableCell>{getCompanyTypeBadge(card.companyType!)}</TableCell>
                    <TableCell>{getStatusBadge(card.status!)}</TableCell>
                    <TableCell>
                      {card.expiryDate
                        ? new Date(card.expiryDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/mcm/cards/${card.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {card.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCard(card);
                              setShowBlockDialog(true);
                            }}
                          >
                            <Ban className="h-4 w-4 text-[#FF6B6B]" />
                          </Button>
                        )}
                        {card.status === "blocked" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnblock(card.id)}
                          >
                            <RefreshCw className="h-4 w-4 text-[#4ECDC4]" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#6B6B6B]">
                    {t("mcm.noCardsFound", "No cards found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {cardsData && cardsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B6B6B]">
            {t("common.showing", "Showing")} {((page - 1) * 20) + 1} -{" "}
            {Math.min(page * 20, cardsData.total)} {t("common.of", "of")} {cardsData.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= cardsData.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Block Card Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
              {t("mcm.blockCard", "Block Card")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#6B6B6B]">
              {t("mcm.blockCardConfirm", "Are you sure you want to block this card? This will immediately revoke all access.")}
            </p>
            {selectedCard && (
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="font-medium">{selectedCard.fullName}</p>
                <p className="text-sm text-[#6B6B6B]">{selectedCard.cardNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("mcm.blockReason", "Block Reason")}</label>
              <Select value={blockReason} onValueChange={setBlockReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t("mcm.selectReason", "Select reason")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security_violation">{t("mcm.securityViolation", "Security Violation")}</SelectItem>
                  <SelectItem value="contract_ended">{t("mcm.contractEnded", "Contract Ended")}</SelectItem>
                  <SelectItem value="lost_card">{t("mcm.lostCard", "Lost Card")}</SelectItem>
                  <SelectItem value="damaged_card">{t("mcm.damagedCard", "Damaged Card")}</SelectItem>
                  <SelectItem value="other">{t("mcm.other", "Other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("mcm.blockType", "Block Type")}</label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">{t("mcm.temporary", "Temporary")}</SelectItem>
                  <SelectItem value="permanent">{t("mcm.permanent", "Permanent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBlock}
              disabled={!blockReason || blockMutation.isPending}
            >
              {t("mcm.blockCard", "Block Card")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
