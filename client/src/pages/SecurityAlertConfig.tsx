import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Zap,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { SecurityAlertConfigModal } from "@/components/SecurityAlertConfigModal";

export function SecurityAlertConfigPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>();

  // Queries
  const { data: configs, isLoading, refetch } = trpc.alertConfig.getConfigs.useQuery({
    isActive: filterActive,
    limit: 100,
  });

  // Mutations
  const deleteConfig = trpc.alertConfig.deleteConfig.useMutation({
    onSuccess: () => {
      refetch();
      alert("Alert configuration deleted");
    },
  });

  // Filter configs based on search term
  const filteredConfigs = configs?.configs.filter((config) =>
    config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (configId: number) => {
    setSelectedConfigId(configId);
    setModalOpen(true);
  };

  const handleDelete = (configId: number) => {
    if (confirm("Are you sure you want to delete this alert configuration?")) {
      deleteConfig.mutate({ id: configId });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedConfigId(undefined);
    refetch();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            Security Alert Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage security alert configurations with trigger conditions, actions, and notifications
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedConfigId(undefined);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Alert Configuration
        </Button>
      </div>

      {/* Alert Modal */}
      <SecurityAlertConfigModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        configId={selectedConfigId}
      />

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === undefined ? "outline" : "default"}
                onClick={() => setFilterActive(undefined)}
              >
                All
              </Button>
              <Button
                variant={filterActive === true ? "default" : "outline"}
                onClick={() => setFilterActive(true)}
              >
                Active
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                onClick={() => setFilterActive(false)}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurations List */}
      <div>
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Loading configurations...</p>
            </CardContent>
          </Card>
        ) : filteredConfigs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No alert configurations found. Create one to get started.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredConfigs.map((config) => (
                <Card key={config.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <Badge className={getSeverityColor(config.impactLevel)}>
                            {config.impactLevel}
                          </Badge>
                          {config.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          {config.isEnabled ? (
                            <Badge variant="secondary">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        {config.description && (
                          <CardDescription className="mt-2">{config.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          disabled={deleteConfig.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Created by:</span>
                        <p className="font-medium">{config.createdByName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Created at:</span>
                        <p className="font-medium">
                          {new Date(config.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status on Trigger:</span>
                        <p className="font-medium">{config.statusOnTrigger}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Summary Stats */}
      {configs && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{configs.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {configs.configs.filter(c => c.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {configs.configs.filter(c => c.isEnabled).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {configs.configs.filter(c => c.impactLevel === "critical").length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
