import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  Building2,
  Shield,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { FioriPageHeader, FioriStatusBadge } from "@/components/fiori";

export default function McmDashboard() {
  const { t } = useTranslation();

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch } = trpc.mcm.getStats.useQuery();
  const { data: expiringCards } = trpc.mcm.cards.getExpiring.useQuery({ days: 30 });
  const { data: blockedCards } = trpc.mcm.cards.getBlocked.useQuery();
  const { data: recentRequests } = trpc.mcm.requests.list.useQuery({ limit: 5 });

  return (
    <div className="space-y-0">
      {/* SAP Fiori Page Header */}
      <FioriPageHeader
        title={t("mcm.title", "Magnetic Card Management")}
        subtitle={t("mcm.subtitle", "Manage and track magnetic access cards")}
        icon={<CreditCard className="h-5 w-5" />}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { href: "/mcm/cards", icon: Users, color: "#5B2C93", bg: "#E8DCF5", title: t("mcm.cardDirectory", "Card Directory"), desc: t("mcm.cardDirectoryDesc", "View and manage all cards") },
          { href: "/mcm/companies", icon: Building2, color: "#D97706", bg: "#FEF3C7", title: t("mcm.companies", "Companies"), desc: t("mcm.companiesDesc", "Manage contractors & clients") },
          { href: "/mcm/access-levels", icon: Shield, color: "#5B2C93", bg: "#E8DCF5", title: t("mcm.accessLevels", "Access Levels"), desc: t("mcm.accessLevelsDesc", "Configure access permissions") },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="bg-white border border-[#E0E0E0] rounded-lg p-4 cursor-pointer hover:border-[#5B2C93] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: action.bg }}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-[#2C2C2C]">{action.title}</h3>
                  <p className="text-xs text-[#6B6B6B]">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#B0B0B0]" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Expiring Cards */}
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2C2C2C] uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D97706]" />
              {t("mcm.expiringCards", "Cards Expiring Soon")}
            </h3>
            <Link href="/mcm/cards?filter=expiring">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5B2C93]">View All</Button>
            </Link>
          </div>
          <div className="p-4">
            {expiringCards && expiringCards.length > 0 ? (
              <div className="space-y-2">
                {expiringCards.slice(0, 5).map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                    <div>
                      <p className="font-medium text-sm text-[#2C2C2C]">{card.fullName}</p>
                      <p className="text-xs text-[#6B6B6B] font-mono">{card.cardNumber}</p>
                    </div>
                    <FioriStatusBadge status="warning" label={new Date(card.expiryDate!).toLocaleDateString()} showDot={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6B6B6B]">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("mcm.noExpiringCards", "No cards expiring in the next 30 days")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Blocked Cards */}
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2C2C2C] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
              {t("mcm.blockedCards", "Blocked Cards")}
            </h3>
            <Link href="/mcm/cards?filter=blocked">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5B2C93]">View All</Button>
            </Link>
          </div>
          <div className="p-4">
            {blockedCards && blockedCards.length > 0 ? (
              <div className="space-y-2">
                {blockedCards.slice(0, 5).map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                    <div>
                      <p className="font-medium text-sm text-[#2C2C2C]">{card.fullName}</p>
                      <p className="text-xs text-[#6B6B6B] font-mono">{card.cardNumber}</p>
                    </div>
                    <FioriStatusBadge status="error" label={card.blockReason?.replace(/_/g, " ") || "Blocked"} showDot={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6B6B6B]">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("mcm.noBlockedCards", "No blocked cards")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#2C2C2C] uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#5B2C93]" />
            {t("mcm.recentRequests", "Recent Requests")}
          </h3>
          <Link href="/mcm/requests">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-[#5B2C93]">View All</Button>
          </Link>
        </div>
        <div className="p-4">
          {recentRequests?.requests && recentRequests.requests.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm text-[#2C2C2C]">{request.requestNumber}</p>
                      <p className="text-xs text-[#6B6B6B]">{request.operationType?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FioriStatusBadge
                      status={request.status === "approved" ? "success" : request.status === "rejected" ? "error" : "pending"}
                      label={request.status}
                    />
                    <span className="text-xs text-[#6B6B6B]">{new Date(request.createdAt!).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#6B6B6B]">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("mcm.noRecentRequests", "No recent requests")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
