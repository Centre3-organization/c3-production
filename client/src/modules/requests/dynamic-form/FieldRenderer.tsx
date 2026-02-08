import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/utils/useAuth";
import { Upload, X, FileText, User, Users, Search, Loader2, Activity, AlertTriangle, FileCheck, ClipboardList, MapPin as RoomIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { HierarchicalTypeSelector } from "./HierarchicalTypeSelector";

interface FieldOption {
  value: string;
  label: string;
  labelAr?: string;
}

interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
}

interface ShowCondition {
  field: string;
  operator?: "equals" | "not_equals" | "in" | "not_empty" | "empty";
  value?: string | string[] | boolean;
}

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
  options?: FieldOption[];
  optionsSource?: "static" | "api" | "dependent" | 
    "countries" | "regions" | "cities" | 
    "sites" | "zones" | "areas" | 
    "departments" | "groups" | "users" | "contractors" | 
    "request_types" | "approval_roles" | 
    "user_sites" | "user_groups" | "user_departments" | "user_profile" | "material_types";
  optionsApi?: string;
  dependsOnField?: string;
  filterByField?: string;
  validation?: FieldValidation;
  showCondition?: ShowCondition;
}

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  formValues: Record<string, any>;
  disabled?: boolean;
  error?: string;
}

// Site Type Field Component
function SiteTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: siteTypes, isLoading } = trpc.masterData.getSiteTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
          {getLabel()}
          {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (siteTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

// Zone Type Field Component
function ZoneTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: zoneTypes, isLoading } = trpc.masterData.getZoneTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
          {getLabel()}
          {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (zoneTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

// Area Type Field Component
function AreaTypeField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { data: areaTypes, isLoading } = trpc.masterData.getAreaTypes.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
          {getLabel()}
          {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const types = (areaTypes || []).map((t: any) => ({
    id: t.id,
    parentId: t.parentId ?? null,
    code: t.code,
    name: t.name,
    nameAr: t.nameAr ?? null,
    level: t.level ?? 0,
    sortOrder: t.sortOrder ?? 0,
    isActive: t.isActive !== false,
  }));

  return (
    <div className="space-y-1.5">
      <HierarchicalTypeSelector
        label={getLabel()}
        types={types}
        value={value?.id ?? value ?? null}
        onChange={(id, path) => onChange({ id, path })}
        required={field.isRequired}
        isRTL={isRTL}
      />
      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

// User Lookup Field Component with search functionality
function UserLookupField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getPlaceholder,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getPlaceholder: () => string | undefined;
  getHelpText: () => string | undefined;
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Use proper tRPC batch format with credentials
        const input = {
          "0": {
            json: {
              source: "users",
              search: searchQuery,
            }
          }
        };
        const response = await fetch(
          `/api/trpc/requestConfig.fields.getDataSourceOptions?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`,
          { credentials: 'include' }
        );
        const result = await response.json();
        if (result[0]?.result?.data?.json) {
          setSearchResults(result[0].result.data.json);
          setShowResults(true);
        }
      } catch (error) {
        console.error("User search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (user: any) => {
    onChange({
      id: user.value,
      name: user.label,
      email: user.email || "",
    });
    setSearchQuery("");
    setShowResults(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
        {getLabel()}
        {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
      </Label>
      
      {value?.id ? (
        // Selected user display
        <div className="flex items-center gap-2 p-2 bg-[#E8DCF5] border border-[#5B2C93] rounded-md">
          <User className="h-4 w-4 text-[#5B2C93]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#5B2C93]">{value.name}</p>
            {value.email && (
              <p className="text-xs text-[#5B2C93]">{value.email}</p>
            )}
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#5B2C93] hover:text-[#FF6B6B] hover:bg-[#FFE5E5]"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        // Search input
        <div className="relative">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getPlaceholder() || t("common.searchUser", "Search by name or email...")}
              disabled={disabled}
              className="pr-10"
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#B0B0B0]" />
              ) : (
                <Search className="h-4 w-4 text-[#B0B0B0]" />
              )}
            </div>
          </div>
          
          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((user) => (
                <button
                  key={user.value}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[#F5F5F5] flex items-center gap-2 border-b last:border-b-0"
                  onClick={() => handleSelectUser(user)}
                >
                  <User className="h-4 w-4 text-[#B0B0B0]" />
                  <div>
                    <p className="text-sm font-medium">{user.label}</p>
                    {user.email && (
                      <p className="text-xs text-[#6B6B6B]">{user.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-3 text-center text-sm text-[#6B6B6B]">
              {t("common.noUsersFound", "No users found")}
            </div>
          )}
        </div>
      )}
      
      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

// Multi-User Lookup Field Component - allows selecting multiple users
function MultiUserLookupField({
  field,
  value,
  onChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getPlaceholder,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getPlaceholder: () => string | undefined;
  getHelpText: () => string | undefined;
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Ensure value is always an array
  const selectedUsers: Array<{ id: string; name: string; email?: string }> = Array.isArray(value) ? value : [];

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const input = {
          "0": {
            json: {
              source: "users",
              search: searchQuery,
            }
          }
        };
        const response = await fetch(
          `/api/trpc/requestConfig.fields.getDataSourceOptions?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`,
          { credentials: 'include' }
        );
        const result = await response.json();
        if (result[0]?.result?.data?.json) {
          // Filter out already selected users
          const selectedIds = selectedUsers.map(u => u.id);
          const filtered = result[0].result.data.json.filter(
            (u: any) => !selectedIds.includes(u.value)
          );
          setSearchResults(filtered);
          setShowResults(true);
        }
      } catch (error) {
        console.error("User search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers.length]);

  const handleSelectUser = (user: any) => {
    const newUser = {
      id: user.value,
      name: user.label,
      email: user.email || "",
    };
    onChange([...selectedUsers, newUser]);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUsers.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
        {getLabel()}
        {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
      </Label>

      {/* Selected users as badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((u) => (
            <Badge
              key={u.id}
              variant="secondary"
              className="text-xs flex items-center gap-1 bg-[#E8DCF5] text-[#5B2C93] border border-[#5B2C93] px-2 py-1"
            >
              <User className="h-3 w-3" />
              {u.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(u.id)}
                  className="ml-0.5 hover:text-[#FF6B6B]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getPlaceholder() || t("common.searchUsers", "Search users by name or email...")}
              className="pr-10"
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#B0B0B0]" />
              ) : (
                <Search className="h-4 w-4 text-[#B0B0B0]" />
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((user) => (
                <button
                  key={user.value}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[#F5F5F5] flex items-center gap-2 border-b last:border-b-0"
                  onClick={() => handleSelectUser(user)}
                >
                  <User className="h-4 w-4 text-[#B0B0B0]" />
                  <div>
                    <p className="text-sm font-medium">{user.label}</p>
                    {user.email && (
                      <p className="text-xs text-[#6B6B6B]">{user.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-3 text-center text-sm text-[#6B6B6B]">
              {t("common.noUsersFound", "No users found")}
            </div>
          )}
        </div>
      )}

      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

// Activity Selector Field Component - shows main activity and sub-activity with requirements
function ActivitySelectorField({
  field,
  value,
  onChange,
  onRequirementsChange,
  disabled,
  error,
  isRTL,
  getLabel,
  getHelpText,
}: {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onRequirementsChange?: (requirements: { needsRFC: boolean; needsHRS: boolean; needsMOP: boolean; needsMHV: boolean; needsRoomSelection: boolean }) => void;
  disabled: boolean;
  error?: string;
  isRTL: boolean;
  getLabel: () => string;
  getHelpText: () => string | undefined;
}) {
  const { t } = useTranslation();
  const [selectedMainActivityId, setSelectedMainActivityId] = useState<number | null>(value?.mainActivityId || null);
  const [selectedSubActivityId, setSelectedSubActivityId] = useState<number | null>(value?.subActivityId || null);

  const { data: mainActivities, isLoading: loadingMain } = trpc.masterData.getAllMainActivities.useQuery();
  const { data: subActivities, isLoading: loadingSub } = trpc.masterData.getAllSubActivities.useQuery();

  // Filter sub-activities based on selected main activity
  const filteredSubActivities = useMemo(() => {
    if (!selectedMainActivityId || !subActivities) return [];
    return subActivities.filter((s: any) => s.mainActivityId === selectedMainActivityId && s.isActive);
  }, [selectedMainActivityId, subActivities]);

  // Get selected sub-activity details for requirements
  const selectedSubActivity = useMemo(() => {
    if (!selectedSubActivityId || !subActivities) return null;
    return subActivities.find((s: any) => s.id === selectedSubActivityId);
  }, [selectedSubActivityId, subActivities]);

  // Update parent when selection changes
  useEffect(() => {
    if (selectedMainActivityId && selectedSubActivityId) {
      const mainActivity = mainActivities?.find((m: any) => m.id === selectedMainActivityId);
      const subActivity = subActivities?.find((s: any) => s.id === selectedSubActivityId);
      onChange({
        mainActivityId: selectedMainActivityId,
        mainActivityName: mainActivity?.name,
        subActivityId: selectedSubActivityId,
        subActivityName: subActivity?.name,
        requirements: {
          needsRFC: subActivity?.needsRFC || false,
          needsHRS: subActivity?.needsHRS || false,
          needsMOP: subActivity?.needsMOP || false,
          needsMHV: subActivity?.needsMHV || false,
          needsRoomSelection: subActivity?.needsRoomSelection || false,
        }
      });
      // Notify parent about requirements
      if (onRequirementsChange && subActivity) {
        onRequirementsChange({
          needsRFC: subActivity.needsRFC || false,
          needsHRS: subActivity.needsHRS || false,
          needsMOP: subActivity.needsMOP || false,
          needsMHV: subActivity.needsMHV || false,
          needsRoomSelection: subActivity.needsRoomSelection || false,
        });
      }
    }
  }, [selectedMainActivityId, selectedSubActivityId, mainActivities, subActivities]);

  // Reset sub-activity when main activity changes
  useEffect(() => {
    if (selectedMainActivityId !== value?.mainActivityId) {
      setSelectedSubActivityId(null);
    }
  }, [selectedMainActivityId]);

  if (loadingMain) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
          {getLabel()}
          {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
        </Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Activity Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
          <Activity className="h-3.5 w-3.5" />
          {isRTL ? "النشاط الرئيسي" : "Main Activity"}
          {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
        </Label>
        <Select
          value={selectedMainActivityId?.toString() || ""}
          onValueChange={(v) => setSelectedMainActivityId(parseInt(v))}
          disabled={disabled}
        >
          <SelectTrigger className={error ? "border-[#FF6B6B]" : ""}>
            <SelectValue placeholder={isRTL ? "اختر النشاط الرئيسي" : "Select main activity"} />
          </SelectTrigger>
          <SelectContent>
            {mainActivities?.filter((a: any) => a.isActive).map((activity: any) => (
              <SelectItem key={activity.id} value={activity.id.toString()}>
                {isRTL && activity.nameAr ? activity.nameAr : activity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-Activity Selector */}
      {selectedMainActivityId && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {isRTL ? "النشاط الفرعي" : "Sub-Activity"}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          {loadingSub ? (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <Select
              value={selectedSubActivityId?.toString() || ""}
              onValueChange={(v) => setSelectedSubActivityId(parseInt(v))}
              disabled={disabled || filteredSubActivities.length === 0}
            >
              <SelectTrigger className={error ? "border-[#FF6B6B]" : ""}>
                <SelectValue placeholder={isRTL ? "اختر النشاط الفرعي" : "Select sub-activity"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubActivities.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {isRTL && sub.nameAr ? sub.nameAr : sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filteredSubActivities.length === 0 && !loadingSub && (
            <p className="text-xs text-[#6B6B6B]">
              {isRTL ? "لا توجد أنشطة فرعية لهذا النشاط الرئيسي" : "No sub-activities available for this main activity"}
            </p>
          )}
        </div>
      )}

      {/* Requirements Display */}
      {selectedSubActivity && (
        <div className="p-3 bg-[#E8DCF5] border border-[#5B2C93] rounded-md space-y-2">
          <Label className="text-xs font-medium text-[#5B2C93] uppercase flex items-center gap-1">
            <FileCheck className="h-3.5 w-3.5" />
            {isRTL ? "المتطلبات" : "Requirements"}
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedSubActivity.needsRFC && (
              <Badge className="bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]">
                <AlertTriangle className="h-3 w-3 mr-1" />
                RFC
              </Badge>
            )}
            {selectedSubActivity.needsHRS && (
              <Badge className="bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]">
                <FileCheck className="h-3 w-3 mr-1" />
                HRS
              </Badge>
            )}
            {selectedSubActivity.needsMOP && (
              <Badge className="bg-[#FFF4E5] text-[#FFB84D] hover:bg-[#FFF4E5]">
                <ClipboardList className="h-3 w-3 mr-1" />
                MOP
              </Badge>
            )}
            {selectedSubActivity.needsMHV && (
              <Badge className="bg-[#E8F9F8] text-[#4ECDC4] hover:bg-[#E8F9F8]">
                <FileCheck className="h-3 w-3 mr-1" />
                MHV
              </Badge>
            )}
            {selectedSubActivity.needsRoomSelection && (
              <Badge className="bg-[#E8DCF5] text-[#5B2C93] hover:bg-[#E8DCF5]">
                <RoomIcon className="h-3 w-3 mr-1" />
                {isRTL ? "اختيار الغرفة" : "Room Selection"}
              </Badge>
            )}
            {!selectedSubActivity.needsRFC && !selectedSubActivity.needsHRS && !selectedSubActivity.needsMOP && !selectedSubActivity.needsMHV && !selectedSubActivity.needsRoomSelection && (
              <span className="text-xs text-[#5B2C93]">
                {isRTL ? "لا توجد متطلبات إضافية" : "No additional requirements"}
              </span>
            )}
          </div>
        </div>
      )}

      {getHelpText() && (
        <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
      )}
      {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
    </div>
  );
}

export function FieldRenderer({
  field,
  value,
  onChange,
  formValues,
  disabled = false,
  error,
}: FieldRendererProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { user } = useAuth();
  const [dynamicOptions, setDynamicOptions] = useState<FieldOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Auto-populate user_lookup fields with current user on mount
  useEffect(() => {
    if (field.fieldType === "user_lookup" && !value && user) {
      onChange({
        id: user.id,
        name: user.name || user.email,
        email: user.email
      });
    }
  }, [field.fieldType, user]);

  // Get localized text
  const getLabel = () => (isRTL && field.nameAr ? field.nameAr : field.name);
  const getPlaceholder = () =>
    isRTL && field.placeholderAr ? field.placeholderAr : field.placeholder;
  const getHelpText = () =>
    isRTL && field.helpTextAr ? field.helpTextAr : field.helpText;
  const getOptionLabel = (opt: FieldOption) =>
    isRTL && opt.labelAr ? opt.labelAr : opt.label;

  // Check if field should be visible based on conditions
  const isVisible = (): boolean => {
    if (!field.showCondition) return true;

    const { field: condField, operator = "equals", value: condValue } = field.showCondition;
    const fieldValue = formValues[condField];

    switch (operator) {
      case "equals":
        return fieldValue === condValue;
      case "not_equals":
        return fieldValue !== condValue;
      case "in":
        return Array.isArray(condValue) && condValue.includes(fieldValue);
      case "not_empty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      case "empty":
        return fieldValue === undefined || fieldValue === null || fieldValue === "";
      default:
        return true;
    }
  };

  // Data source types that need API fetching
  const dynamicDataSources = [
    "countries", "regions", "cities", "sites", "zones", "areas",
    "departments", "groups", "users", "contractors",
    "request_types", "approval_roles",
    "user_sites", "user_groups", "user_departments",
    "material_types"
  ];

  // Load options from data source when field mounts or filter changes
  useEffect(() => {
    const source = field.optionsSource;
    if (!source || source === "static") return;

    // Handle dependent options (legacy)
    if (source === "dependent" && field.dependsOnField) {
      const parentValue = formValues[field.dependsOnField];
      if (parentValue) {
        loadDependentOptions(parentValue);
      } else {
        setDynamicOptions([]);
      }
      return;
    }

    // Handle dynamic data sources
    if (dynamicDataSources.includes(source)) {
      const filterValue = field.filterByField ? formValues[field.filterByField] : undefined;
      // If this field depends on a parent via filterByField, only load when parent has a value
      if (field.filterByField && !filterValue) {
        setDynamicOptions([]);
        return;
      }
      loadDataSourceOptions(source, filterValue);
    }
  }, [field.optionsSource, field.dependsOnField, field.filterByField, formValues]);

  // Check if this field's parent filter has a value (for cascading dropdowns)
  const isWaitingForParent = field.filterByField && !formValues[field.filterByField];
  const parentFieldName = field.filterByField ? field.filterByField.charAt(0).toUpperCase() + field.filterByField.slice(1) : '';

  const loadDataSourceOptions = async (source: string, filterValue?: any) => {
    setIsLoadingOptions(true);
    try {
      // Use fetch with proper batch format for tRPC
      const input = {
        "0": {
          json: {
            source,
            filterValue: filterValue ? String(filterValue) : undefined,
          }
        }
      };
      const response = await fetch(
        `/api/trpc/requestConfig.fields.getDataSourceOptions?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result[0]?.result?.data?.json) {
        setDynamicOptions(result[0].result.data.json.map((item: any) => ({
          value: String(item.value),
          label: item.label,
          labelAr: item.labelAr,
        })));
      }
    } catch (error) {
      console.error("Failed to load data source options:", error);
      setDynamicOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadDependentOptions = async (parentValue: string) => {
    setIsLoadingOptions(true);
    try {
      // In a real implementation, this would call the API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDynamicOptions([]);
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Get options to display
  const getOptions = (): FieldOption[] => {
    const source = field.optionsSource;
    // Use dynamic options for non-static sources
    if (source && source !== "static") {
      return dynamicOptions;
    }
    return field.options || [];
  };

  if (!isVisible()) return null;

  const baseInputClass = cn(
    "w-full",
    error && "border-[#FF6B6B] focus:ring-[#FF6B6B]"
  );

  // Render based on field type
  switch (field.fieldType) {
    case "text":
    case "email":
    case "phone":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Input
            type={field.fieldType === "email" ? "email" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={baseInputClass}
            maxLength={field.validation?.maxLength}
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={baseInputClass}
            min={field.validation?.min}
            max={field.validation?.max}
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(baseInputClass, "min-h-[100px]")}
            maxLength={field.validation?.maxLength}
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "datetime":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Input
            type="datetime-local"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "dropdown":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <Select
            value={value || ""}
            onValueChange={onChange}
            disabled={disabled || isLoadingOptions || !!isWaitingForParent}
          >
            <SelectTrigger className={cn(baseInputClass, isWaitingForParent && "opacity-60")}>
              <SelectValue placeholder={isWaitingForParent ? `Select ${parentFieldName} first` : (getPlaceholder() || t("common.select", "Select..."))} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingOptions ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                getOptions().filter((opt) => opt.value !== "" && opt.value != null).map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {getOptionLabel(opt)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "dropdown_multi":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <div className="border rounded-md p-3 space-y-2">
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.code}-${opt.value}`}
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, opt.value]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((v: string) => {
                const opt = getOptions().find((o) => o.value === v);
                return (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {opt ? getOptionLabel(opt) : v}
                    <button
                      type="button"
                      onClick={() => onChange(selectedValues.filter((sv: string) => sv !== v))}
                      className="ml-1 hover:text-[#FF6B6B]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "radio":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <RadioGroup
            value={value || ""}
            onValueChange={onChange}
            disabled={disabled}
            className="flex flex-wrap gap-4"
          >
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`${field.code}-${opt.value}`} />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.code}
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <Label
              htmlFor={field.code}
              className="text-sm font-medium cursor-pointer flex items-center gap-1"
            >
              {getLabel()}
              {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
            </Label>
          </div>
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B] ml-6">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B] ml-6">{error}</p>}
        </div>
      );

    case "checkbox_group":
      const checkedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <div className="border rounded-md p-3 space-y-2.5">
            {getOptions().map((opt) => (
              <div key={opt.value} className="flex items-start gap-2">
                <Checkbox
                  id={`${field.code}-${opt.value}`}
                  checked={checkedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkedValues, opt.value]);
                    } else {
                      onChange(checkedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`${field.code}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer leading-tight"
                >
                  {getOptionLabel(opt)}
                </Label>
              </div>
            ))}
          </div>
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "file":
    case "file_multi":
      const files = Array.isArray(value) ? value : value ? [value] : [];
      const isMulti = field.fieldType === "file_multi";
      const maxFiles = field.validation?.maxFiles || (isMulti ? 10 : 1);

      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase flex items-center gap-1">
            {getLabel()}
            {Boolean(field.isRequired) && <span className="text-[#FF6B6B]">*</span>}
          </Label>
          <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-4 text-center hover:border-[#5B2C93]/50 transition-colors">
            <input
              type="file"
              id={field.code}
              multiple={isMulti}
              accept={field.validation?.accept}
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                if (isMulti) {
                  onChange([...files, ...newFiles].slice(0, maxFiles));
                } else {
                  onChange(newFiles[0] || null);
                }
              }}
              disabled={disabled || files.length >= maxFiles}
              className="hidden"
            />
            <label
              htmlFor={field.code}
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-[#B0B0B0]" />
              <span className="text-sm text-[#6B6B6B]">
                {t("common.clickToUpload", "Click to upload")}
                {isMulti && ` (${files.length}/${maxFiles})`}
              </span>
              {field.validation?.accept && (
                <span className="text-xs text-[#B0B0B0]">
                  {field.validation.accept}
                </span>
              )}
            </label>
          </div>
          {files.length > 0 && (
            <div className="space-y-2 mt-2">
              {files.map((file: File | string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-[#F5F5F5] rounded"
                >
                  <FileText className="h-4 w-4 text-[#6B6B6B]" />
                  <span className="text-sm flex-1 truncate">
                    {typeof file === "string" ? file : file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        onChange(files.filter((_: any, i: number) => i !== index));
                      } else {
                        onChange(null);
                      }
                    }}
                    className="text-[#B0B0B0] hover:text-[#FF6B6B]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
          {error && <p className="text-xs text-[#FF6B6B]">{error}</p>}
        </div>
      );

    case "user_lookup":
      return (
        <UserLookupField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getPlaceholder={getPlaceholder}
          getHelpText={getHelpText}
        />
      );

    case "readonly": {
      // Auto-populate from user profile if optionsSource is user_profile
      let displayValue = value || field.defaultValue || "";
      if (field.optionsSource === "user_profile" && user) {
        const fieldCode = field.code;
        if (fieldCode === "requestor_name") {
          displayValue = user.name || user.email || "";
        } else if (fieldCode === "email") {
          displayValue = user.email || "";
        } else if (fieldCode === "company") {
          // Company comes from auth.me enriched companyName
          displayValue = (user as any).companyName || (user as any).subContractorCompany || "Centre3";
        } else if (fieldCode === "mobile") {
          displayValue = (user as any).phone || "";
        } else if (fieldCode === "department") {
          // Department needs to be fetched separately - show department name if available
          displayValue = (user as any).departmentName || "";
        }
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase">
            {getLabel()}
          </Label>
          <Input
            type="text"
            value={displayValue}
            readOnly
            className="bg-[#F5F5F5]"
          />
          {getHelpText() && (
            <p className="text-xs text-[#6B6B6B]">{getHelpText()}</p>
          )}
        </div>
      );
    }

    case "site_type":
      return (
        <SiteTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "zone_type":
      return (
        <ZoneTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "area_type":
      return (
        <AreaTypeField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    case "multi_user_lookup":
      return (
        <MultiUserLookupField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getPlaceholder={getPlaceholder}
          getHelpText={getHelpText}
        />
      );

    case "activity_selector":
      return (
        <ActivitySelectorField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
          isRTL={isRTL}
          getLabel={getLabel}
          getHelpText={getHelpText}
        />
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-[#6B6B6B] uppercase">
            {getLabel()} (Unsupported: {field.fieldType})
          </Label>
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        </div>
      );
  }
}
