import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Ban,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Clock,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import {
  FioriPageHeader,
  FioriFilterBar,
  FioriTable,
  FioriStatusBadge,
} from "@/components/fiori";
import type { FioriColumn } from "@/components/fiori";

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
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    companyType: companyTypeFilter !== "all" ? (companyTypeFilter as any) : undefined,
    page,
    limit: 20,
  });

  // Mutations
  const blockMutation = trpc.mcm.admin.blockCard.useMutation({
    onSuccess: () => { refetch(); setShowBlockDialog(false); setSelectedCard(null); },
  });
  const unblockMutation = trpc.mcm.admin.unblockCard.useMutation({
    onSuccess: () => refetch(),
  });

  const handleBlock = () => {
    if (!selectedCard || !blockReason) return;
    blockMutation.mutate({ cardId: selectedCard.id, blockReason: blockReason as any, blockType: blockType as any });
  };
  const handleUnblock = (cardId: number) => {
    unblockMutation.mutate({ cardId, reason: "Unblocked by admin" });
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (statusFilter !== "all") chips.push({ key: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("all") });
    if (companyTypeFilter !== "all") chips.push({ key: "company", label: `Type: ${companyTypeFilter}`, onRemove: () => setCompanyTypeFilter("all") });
    return chips;
  }, [statusFilter, companyTypeFilter]);

  const columns: FioriColumn<any>[] = useMemo(() => [
    {
      key: "cardNumber",
      header: "Card Number",
      width: "140px",
      render: (c: any) => <span className="font-mono text-sm font-medium text-[#5B2C93]">{c.cardNumber}</span>,
    },
    {
      key: "fullName",
      header: "Full Name",
      render: (c: any) => <span className="font-medium text-[#2C2C2C]">{c.fullName}</span>,
    },
    {
      key: "idNumber",
      header: "ID Number",
      render: (c: any) => <span className="text-sm text-[#6B6B6B] font-mono">{c.idNumber}</span>,
    },
    {
      key: "companyType",
      header: "Company Type",
      render: (c: any) => {
        const colors: Record<string, { bg: string; text: string }> = {
          centre3: { bg: "#E8DCF5", text: "#5B2C93" },
          internal: { bg: "#DBEAFE", text: "#2563EB" },
          contractor: { bg: "#FEF3C7", text: "#D97706" },
          subcontractor: { bg: "#E8DCF5", text: "#5B2C93" },
          client: { bg: "#D1FAE5", text: "#059669" },
        };
        const style = colors[c.companyType!] || { bg: "#F5F5F5", text: "#6B6B6B" };
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
            {c.companyType}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (c: any) => (
        <FioriStatusBadge
          status={c.status === "active" ? "success" : c.status === "blocked" ? "error" : c.status === "expired" ? "inactive" : "pending"}
          label={c.status || "unknown"}
        />
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (c: any) => <span className="text-sm text-[#6B6B6B]">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "\u2014"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      width: "120px",
      render: (c: any) => (
        <div className="flex justify-end gap-1">
          <Link href={`/mcm/cards/${c.id}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#5B2C93]">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {c.status === "active" && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#DC2626]" onClick={(e) => { e.stopPropagation(); setSelectedCard(c); setShowBlockDialog(true); }}>
              <Ban className="h-4 w-4" />
            </Button>
          )}
          {c.status === "blocked" && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#059669]" onClick={(e) => { e.stopPropagation(); handleUnblock(c.id); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-0">
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title={t("mcm.title", "Card Directory")}
        subtitle={t("mcm.subtitle", "Manage access cards for employees and contractors")}
        icon={<CreditCard className="h-5 w-5" />}
        count={cardsData?.total}
        onRefresh={() => refetch()}
        actions={
          <Link href="/mcm/request/new">
            <Button className="bg-[#5B2C93] hover:bg-[#3D1C5E] gap-2" size="sm">
              <Plus className="h-4 w-4" /> {t("mcm.newRequest", "New Card Request")}
            </Button>
          </Link>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: t("mcm.stats.activeCards", "Active Cards"), value: stats?.activeCards || 0, icon: CreditCard, color: "#059669", bg: "#D1FAE5" },
          { label: t("mcm.stats.pendingRequests", "Pending Requests"), value: stats?.pendingRequests || 0, icon: FileText, color: "#5B2C93", bg: "#E8DCF5" },
          { label: t("mcm.stats.expiringSoon", "Expiring Soon"), value: stats?.expiringSoon || 0, icon: Clock, color: "#D97706", bg: "#FEF3C7" },
          { label: t("mcm.stats.blockedCards", "Blocked Cards"), value: stats?.blockedCards || 0, icon: AlertTriangle, color: "#DC2626", bg: "#FFE5E5" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#E0E0E0] rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] font-medium">{kpi.label}</p>
                <p className="text-xl font-semibold text-[#2C2C2C]">{statsLoading ? "..." : kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SAP Fiori Filter Bar */}
      <FioriFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("mcm.searchCards", "Search by name, ID, or card number...")}
        activeFilters={activeFilterChips}
        onClearAll={() => { setStatusFilter("all"); setCompanyTypeFilter("all"); }}
        filters={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-[#E0E0E0]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs border-[#E0E0E0]">
                <SelectValue placeholder="Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="centre3">Centre3</SelectItem>
                <SelectItem value="internal">Internal User</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* SAP Fiori Table */}
      <FioriTable
        columns={columns}
        data={cardsData?.cards || []}
        isLoading={isLoading}
        rowKey={(c: any) => c.id}
        emptyIcon={<CreditCard className="h-10 w-10" />}
        emptyTitle={t("mcm.noCardsFound", "No cards found")}
        emptyDescription="Try adjusting your search or filter criteria."
        footerInfo={cardsData ? `Showing ${((page - 1) * 20) + 1}\u2013${Math.min(page * 20, cardsData.total)} of ${cardsData.total} cards` : undefined}
      />

      {/* Pagination */}
      {cardsData && cardsData.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" className="h-8 border-[#E0E0E0]" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-[#6B6B6B] px-2">Page {page} of {cardsData.totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-[#E0E0E0]" disabled={page >= cardsData.totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Block Card Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="p-0">
          <div className="px-6 pt-5 pb-4 border-b border-[#E0E0E0]">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
              {t("mcm.blockCard", "Block Card")}
            </DialogTitle>
          </div>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-[#6B6B6B]">
              {t("mcm.blockCardConfirm", "Are you sure you want to block this card? This will immediately revoke all access.")}
            </p>
            {selectedCard && (
              <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0]">
                <p className="font-medium text-sm text-[#2C2C2C]">{selectedCard.fullName}</p>
                <p className="text-xs text-[#6B6B6B] font-mono">{selectedCard.cardNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs text-[#6B6B6B] uppercase tracking-wider font-medium">{t("mcm.blockReason", "Block Reason")}</label>
              <Select value={blockReason} onValueChange={setBlockReason}>
                <SelectTrigger className="border-[#E0E0E0]">
                  <SelectValue placeholder={t("mcm.selectReason", "Select reason")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security_violation">Security Violation</SelectItem>
                  <SelectItem value="contract_ended">Contract Ended</SelectItem>
                  <SelectItem value="lost_card">Lost Card</SelectItem>
                  <SelectItem value="damaged_card">Damaged Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#6B6B6B] uppercase tracking-wider font-medium">{t("mcm.blockType", "Block Type")}</label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger className="border-[#E0E0E0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#FAFAFA] flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBlockDialog(false)} className="border-[#E0E0E0]">Cancel</Button>
            <Button variant="destructive" onClick={handleBlock} disabled={!blockReason || blockMutation.isPending}>
              {t("mcm.blockCard", "Block Card")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
