import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  Users, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search,
  Building2,
  Shield,
  FileText,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function McmDashboard() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.mcm.getStats.useQuery();
  
  // Fetch expiring cards
  const { data: expiringCards } = trpc.mcm.cards.getExpiring.useQuery({ days: 30 });
  
  // Fetch blocked cards
  const { data: blockedCards } = trpc.mcm.cards.getBlocked.useQuery();
  
  // Fetch recent requests
  const { data: recentRequests } = trpc.mcm.requests.list.useQuery({ limit: 5 });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">{t("mcm.title", "Magnetic Card Management")}</h1>
          <p className="text-sm text-[#6B6B6B]">{t("mcm.subtitle", "Manage and track magnetic access cards")}</p>
          <p className="text-[#6B6B6B]">
            {t("mcm.subtitle", "Manage access cards for employees and contractors")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/mcm/request/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("mcm.newRequest", "New Card Request")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B]">{stat.title}</p>
                  <p className="text-2xl font-medium mt-1">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/mcm/cards">
          <Card className="cursor-pointer hover:bg-[#E8DCF5]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#5B2C93]/10">
                  <Users className="h-6 w-6 text-[#5B2C93]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{t("mcm.cardDirectory", "Card Directory")}</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    {t("mcm.cardDirectoryDesc", "View and manage all cards")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#6B6B6B]" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mcm/companies">
          <Card className="cursor-pointer hover:bg-[#E8DCF5]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#FFF4E5]/10">
                  <Building2 className="h-6 w-6 text-[#FFB84D]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{t("mcm.companies", "Companies")}</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    {t("mcm.companiesDesc", "Manage contractors & clients")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#6B6B6B]" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mcm/access-levels">
          <Card className="cursor-pointer hover:bg-[#E8DCF5]/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#E8DCF5]/10">
                  <Shield className="h-6 w-6 text-[#5B2C93]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{t("mcm.accessLevels", "Access Levels")}</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    {t("mcm.accessLevelsDesc", "Configure access permissions")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#6B6B6B]" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("mcm.expiringCards", "Cards Expiring Soon")}
            </CardTitle>
            <Link href="/mcm/cards?filter=expiring">
              <Button variant="ghost" size="sm">
                {t("common.viewAll", "View All")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {expiringCards && expiringCards.length > 0 ? (
              <div className="space-y-3">
                {expiringCards.slice(0, 5).map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#E8DCF5]/50"
                  >
                    <div>
                      <p className="font-medium">{card.fullName}</p>
                      <p className="text-sm text-[#6B6B6B]">{card.cardNumber}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[#FFB84D] border-[#FFB84D]">
                        {new Date(card.expiryDate!).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6B6B6B] text-center py-8">
                {t("mcm.noExpiringCards", "No cards expiring in the next 30 days")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Blocked Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t("mcm.blockedCards", "Blocked Cards")}
            </CardTitle>
            <Link href="/mcm/cards?filter=blocked">
              <Button variant="ghost" size="sm">
                {t("common.viewAll", "View All")}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {blockedCards && blockedCards.length > 0 ? (
              <div className="space-y-3">
                {blockedCards.slice(0, 5).map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#E8DCF5]/50"
                  >
                    <div>
                      <p className="font-medium">{card.fullName}</p>
                      <p className="text-sm text-[#6B6B6B]">{card.cardNumber}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {card.blockReason?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6B6B6B] text-center py-8">
                {t("mcm.noBlockedCards", "No blocked cards")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {t("mcm.recentRequests", "Recent Requests")}
          </CardTitle>
          <Link href="/mcm/requests">
            <Button variant="ghost" size="sm">
              {t("common.viewAll", "View All")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentRequests?.requests && recentRequests.requests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#E8DCF5]/50"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{request.requestNumber}</p>
                      <p className="text-sm text-[#6B6B6B]">
                        {request.operationType?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                    <span className="text-sm text-[#6B6B6B]">
                      {new Date(request.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B6B6B] text-center py-8">
              {t("mcm.noRecentRequests", "No recent requests")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
