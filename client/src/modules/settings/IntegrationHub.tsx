import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Plug, Database, Cloud, Webhook, ArrowRight } from "lucide-react";

export default function IntegrationHub() {
  const { t } = useTranslation();

  const plannedIntegrations = [
    {
      icon: Database,
      title: "SIPORT Integration",
      description: "Connect with SIPORT access control system for real-time card synchronization",
    },
    {
      icon: Cloud,
      title: "Active Directory",
      description: "Sync users and groups with Microsoft Active Directory",
    },
    {
      icon: Webhook,
      title: "Webhook Events",
      description: "Send real-time notifications to external systems",
    },
    {
      icon: Plug,
      title: "REST API",
      description: "Full API access for custom integrations",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="p-4 rounded-full bg-[#5B2C93]/10 mb-4">
          <Radio className="h-12 w-12 text-[#5B2C93]" />
        </div>
        <h1 className="text-2xl font-medium text-[#2C2C2C] leading-8 mb-2">
          {t("integrationHub.title", "Integration Hub")}
        </h1>
        <p className="text-[#6B6B6B] max-w-md">
          {t("integrationHub.subtitle", "Connect Centre3 with your existing systems and tools")}
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-primary/20 bg-[#5B2C93]/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5B2C93]/10 text-[#5B2C93] font-medium mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B2C93] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5B2C93]"></span>
              </span>
              {t("common.comingSoon", "Coming Soon")}
            </div>
            <h2 className="text-xl font-medium text-[#2C2C2C] leading-7 mb-2">
              {t("integrationHub.underDevelopment", "Under Development")}
            </h2>
            <p className="text-[#6B6B6B] max-w-lg">
              {t("integrationHub.description", "We're building powerful integration capabilities to help you connect Centre3 with your existing infrastructure. Stay tuned for updates!")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planned Integrations */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {t("integrationHub.plannedIntegrations", "Planned Integrations")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plannedIntegrations.map((integration, index) => (
            <Card key={index} className="opacity-60">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-[#F5F5F5]">
                    <integration.icon className="h-6 w-6 text-[#6B6B6B]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{integration.title}</h4>
                    <p className="text-sm text-[#6B6B6B]">
                      {integration.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#6B6B6B]/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
