import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Shield,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plug,
  Zap,
  Activity,
  Power,
} from "lucide-react";

// ============================================================================
// Integration definitions — the marketplace catalog
// ============================================================================

interface IntegrationCard {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  route: string;
  status: "active" | "available" | "coming_soon";
  category: "communication" | "hardware" | "enterprise";
  features: string[];
}

const INTEGRATION_CATALOG: IntegrationCard[] = [
  {
    id: "communications",
    name: "Communications",
    nameKey: "integrationHub.communications",
    description: "Unified messaging hub for SMS, WhatsApp, and Email. Configure providers (Twilio, SMTP, SendGrid), create templates with dynamic variables, set trigger rules for automated notifications, and track delivery logs across all channels.",
    descriptionKey: "integrationHub.communicationsFullDesc",
    icon: MessageSquare,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    route: "/integration-hub/communications",
    status: "active",
    category: "communication",
    features: ["SMS", "WhatsApp", "Email", "HTML Templates", "Trigger Rules", "Delivery Logs"],
  },
  {
    id: "siemens-siport",
    name: "Siemens SiPort",
    nameKey: "integrationHub.siemensSiport",
    description: "Integrate with Siemens SiPort access control system for automated gate management, card validation, and real-time access monitoring.",
    descriptionKey: "integrationHub.siemensSiportDesc",
    icon: Shield,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    route: "",
    status: "coming_soon",
    category: "hardware",
    features: ["Gate Control", "Card Validation", "Access Monitoring", "Event Sync"],
  },
  {
    id: "eam",
    name: "Enterprise Asset Management",
    nameKey: "integrationHub.eam",
    description: "Connect with Enterprise Asset Management platforms (IBM Maximo, SAP PM, Infor EAM) for unified asset lifecycle tracking, preventive maintenance scheduling, work order management, and spare parts inventory across all data centre facilities.",
    descriptionKey: "integrationHub.eamDesc",
    icon: Wrench,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    route: "",
    status: "coming_soon",
    category: "enterprise",
    features: ["Asset Lifecycle", "Work Orders", "Preventive Maintenance", "Spare Parts", "Compliance Reporting"],
  },
];

// ============================================================================
// MAIN COMPONENT — Integration Hub Landing
// ============================================================================

export default function IntegrationHub() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Fetch stats for active integrations
  const { data: integrationsList } = trpc.messaging.listIntegrations.useQuery();
  const { data: logStats } = trpc.messaging.getLogStats.useQuery();

  const activeProviders = integrationsList?.filter(i => i.isEnabled).length || 0;
  const totalMessages = logStats?.totalMessages || 0;

  const categories = [
    { key: "communication", label: t("integrationHub.catCommunication", "Communication") },
    { key: "hardware", label: t("integrationHub.catHardware", "Hardware & Access Control") },
    { key: "enterprise", label: t("integrationHub.catEnterprise", "Enterprise Systems") },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">
          {t("integrationHub.title", "Integration Hub")}
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {t("integrationHub.hubSubtitle", "Connect Centre3 with external systems, communication channels, and hardware devices")}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plug className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{INTEGRATION_CATALOG.length}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.totalIntegrations", "Total Integrations")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Power className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{INTEGRATION_CATALOG.filter(i => i.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.activeIntegrations", "Active Integrations")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{activeProviders}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.connectedProviders", "Connected Providers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Activity className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalMessages}</p>
                <p className="text-sm text-muted-foreground">{t("integrationHub.messagesSent", "Messages Sent")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards by Category */}
      {categories.map(cat => {
        const catIntegrations = INTEGRATION_CATALOG.filter(i => i.category === cat.key);
        if (catIntegrations.length === 0) return null;

        return (
          <div key={cat.key}>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{cat.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catIntegrations.map(integration => (
                <IntegrationCardComponent
                  key={integration.id}
                  integration={integration}
                  onNavigate={() => {
                    if (integration.route) {
                      setLocation(integration.route);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Integration Card Component
// ============================================================================

function IntegrationCardComponent({
  integration,
  onNavigate,
}: {
  integration: IntegrationCard;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const Icon = integration.icon;

  const statusBadge = () => {
    switch (integration.status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t("integrationHub.statusActive", "Active")}
          </Badge>
        );
      case "available":
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <Power className="h-3 w-3" />
            {t("integrationHub.statusAvailable", "Available")}
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {t("integrationHub.statusComingSoon", "Coming Soon")}
          </Badge>
        );
    }
  };

  return (
    <Card
      className={`group transition-all duration-200 ${
        integration.status !== "coming_soon"
          ? "hover:shadow-md hover:border-primary/30 cursor-pointer"
          : "opacity-75"
      }`}
      onClick={integration.status !== "coming_soon" ? onNavigate : undefined}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${integration.iconBg}`}>
            <Icon className={`h-7 w-7 ${integration.iconColor}`} />
          </div>
          {statusBadge()}
        </div>

        <h3 className="text-base font-semibold text-[#2C2C2C] mb-1">
          {t(integration.nameKey, integration.name)}
        </h3>
        <p className="text-sm text-[#6B6B6B] mb-4 line-clamp-3">
          {t(integration.descriptionKey, integration.description)}
        </p>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {integration.features.map(feature => (
            <span
              key={feature}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Action */}
        {integration.status !== "coming_soon" ? (
          <Button
            variant="ghost"
            className="w-full justify-between text-primary hover:text-primary group-hover:bg-primary/5"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            {t("integrationHub.configure", "Configure")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <div className="text-center py-2 text-sm text-muted-foreground">
            {t("integrationHub.comingSoonNote", "Available in a future release")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
