import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, ClipboardList } from "lucide-react";

interface FormDataDisplayProps {
  formData: Record<string, any> | null | undefined;
  selectedTypeIds: number[] | null | undefined;
  categoryId?: number | null;
  compact?: boolean; // For approval view (3-column grid)
}

// Data sources that store IDs and need name resolution
const REFERENCE_SOURCES = [
  "countries", "regions", "cities",
  "sites", "zones", "areas",
  "departments", "groups", "contractors",
];

/**
 * Renders the dynamic form data submitted with a request.
 * Fetches the form definition to get field labels and section structure,
 * then displays the values in a structured layout.
 * Resolves reference field IDs (country, city, site, etc.) to display names.
 */
export function FormDataDisplay({ formData, selectedTypeIds, categoryId, compact = false }: FormDataDisplayProps) {
  // Fetch form definition to get field labels and sections
  const { data: formDefinition, isLoading } = trpc.requestConfig.formDefinition.getFormDefinition.useQuery(
    { typeIds: selectedTypeIds || [] },
    { enabled: !!selectedTypeIds && selectedTypeIds.length > 0 }
  );

  // Track resolved labels for reference fields
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>({});
  const [isResolving, setIsResolving] = useState(false);

  // Identify which fields need resolution
  const referenceFields = useMemo(() => {
    if (!formDefinition?.sections || !formData) return [];
    const fields: Array<{ code: string; source: string; value: string }> = [];
    for (const section of formDefinition.sections) {
      for (const field of section.fields || []) {
        if (field.optionsSource && REFERENCE_SOURCES.includes(field.optionsSource)) {
          const val = formData[field.code];
          if (val !== null && val !== undefined && val !== "") {
            fields.push({ code: field.code, source: field.optionsSource, value: String(val) });
          }
        }
        // Also check repeatable section items
        if (section.isRepeatable && formData[section.code]) {
          const items = formData[section.code];
          if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
              const itemVal = items[i]?.[field.code];
              if (field.optionsSource && REFERENCE_SOURCES.includes(field.optionsSource) && itemVal) {
                const key = `${section.code}[${i}].${field.code}`;
                fields.push({ code: key, source: field.optionsSource, value: String(itemVal) });
              }
            }
          }
        }
      }
    }
    return fields;
  }, [formDefinition, formData]);

  // Resolve reference field IDs to names
  useEffect(() => {
    if (referenceFields.length === 0) return;

    const resolve = async () => {
      setIsResolving(true);
      const labels: Record<string, string> = {};

      // Group by source to minimize API calls
      const bySource: Record<string, Array<{ code: string; value: string }>> = {};
      for (const f of referenceFields) {
        if (!bySource[f.source]) bySource[f.source] = [];
        // Avoid duplicate lookups for same source+value
        const existing = bySource[f.source].find(x => x.value === f.value);
        if (!existing) {
          bySource[f.source].push({ code: f.code, value: f.value });
        }
      }

      // Fetch options for each source
      for (const [source, items] of Object.entries(bySource)) {
        try {
          const input = {
            "0": {
              json: {
                source,
                limit: 500,
              }
            }
          };
          const response = await fetch(
            `/api/trpc/requestConfig.fields.getDataSourceOptions?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`,
            { credentials: 'include' }
          );
          const result = await response.json();
          if (result[0]?.result?.data?.json) {
            const options = result[0].result.data.json;
            // Map all fields with this source
            for (const field of referenceFields.filter(f => f.source === source)) {
              const match = options.find((o: any) => String(o.value) === String(field.value));
              if (match) {
                labels[`${field.code}:${field.value}`] = match.label;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to resolve ${source} options:`, error);
        }
      }

      setResolvedLabels(labels);
      setIsResolving(false);
    };

    resolve();
  }, [referenceFields]);

  // Helper to get resolved label for a field value
  const getResolvedLabel = (fieldCode: string, value: any, field: any): string => {
    if (value === null || value === undefined) return "—";
    
    // Check if this field has a resolved label
    if (field?.optionsSource && REFERENCE_SOURCES.includes(field.optionsSource)) {
      const key = `${fieldCode}:${value}`;
      if (resolvedLabels[key]) return resolvedLabels[key];
    }
    
    return formatFieldValue(value, field);
  };

  if (!formData || !selectedTypeIds || selectedTypeIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-[#6B6B6B]" />
        <span className="ml-2 text-sm text-[#6B6B6B]">Loading form data...</span>
      </div>
    );
  }

  if (!formDefinition) {
    // Fallback: render raw formData without labels
    return (
      <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
          <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-[#5B2C93]" /> Form Data
          </h4>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          {Object.entries(formData).map(([key, value]) => {
            if (value === null || value === undefined || value === "") return null;
            // Skip array values (repeatable sections) for raw display
            if (Array.isArray(value)) return null;
            return (
              <div key={key}>
                <span className="text-[#6B6B6B] text-xs capitalize">{key.replace(/_/g, " ")}</span>
                <p className="font-medium text-[#2C2C2C]">{String(value)}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render with proper labels from form definition
  const sections = formDefinition.sections || [];
  
  // Skip sections that have no filled data
  const sectionsWithData = sections.filter((section: any) => {
    if (section.isRepeatable) {
      const items = formData[section.code];
      return Array.isArray(items) && items.length > 0;
    }
    return section.fields?.some((field: any) => {
      const val = formData[field.code];
      return val !== null && val !== undefined && val !== "";
    });
  });

  if (sectionsWithData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Type badges */}
      {formDefinition.types && formDefinition.types.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[#6B6B6B]">Request Types:</span>
          {formDefinition.types.map((type: any) => (
            <Badge key={type.id} variant="outline" className="text-xs border-[#5B2C93] text-[#5B2C93]">
              {type.name}
            </Badge>
          ))}
        </div>
      )}

      {sectionsWithData.map((section: any) => (
        <div key={section.id} className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#5B2C93]" /> {section.name}
              </h4>
              {section.typeName && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#5B2C93] text-[#5B2C93]">
                  {section.typeName}
                </Badge>
              )}
              {section.isShared && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#059669] text-[#059669]">
                  Shared
                </Badge>
              )}
            </div>
          </div>
          
          {section.isRepeatable ? (
            // Render repeatable section items
            <div className="p-4 space-y-3">
              {(formData[section.code] || []).map((item: any, idx: number) => (
                <div key={idx} className="border border-[#E0E0E0] rounded-lg p-3 bg-white">
                  <div className="text-xs font-medium text-[#5B2C93] mb-2">
                    {section.name} #{idx + 1}
                  </div>
                  <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-3 text-sm`}>
                    {(section.fields || []).map((field: any) => {
                      const val = item[field.code];
                      if (val === null || val === undefined || val === "") return null;
                      const repeatKey = `${section.code}[${idx}].${field.code}`;
                      return (
                        <div key={field.code}>
                          <span className="text-[#6B6B6B] text-xs">{field.name}</span>
                          <p className="font-medium text-[#2C2C2C]">
                            {getResolvedLabel(repeatKey, val, field)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Render regular section fields
            <div className={`p-4 grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-4 text-sm`}>
              {(section.fields || []).map((field: any) => {
                const val = formData[field.code];
                if (val === null || val === undefined || val === "") return null;
                return (
                  <div key={field.code} className={field.columnSpan === 2 ? "col-span-2" : ""}>
                    <span className="text-[#6B6B6B] text-xs">{field.name}</span>
                    <p className="font-medium text-[#2C2C2C]">
                      {getResolvedLabel(field.code, val, field)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatFieldValue(value: any, field: any): string {
  if (value === null || value === undefined) return "—";
  
  // Handle user lookup objects
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    if (value.name) return value.name;
    if (value.label) return value.label;
    if (value.id && value.path) return value.path; // For hierarchical type selectors
    return JSON.stringify(value);
  }
  
  // Handle arrays (multi-select or multi-user)
  if (Array.isArray(value)) {
    return value.map(v => {
      if (typeof v === "object" && v?.name) return v.name;
      return String(v);
    }).join(", ");
  }
  
  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  // Handle dates
  if (field?.fieldType === "date" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return value;
    }
  }
  
  // Handle select fields - try to find the label from options
  if ((field?.fieldType === "select" || field?.fieldType === "radio" || field?.fieldType === "dropdown") && field?.options) {
    const options = Array.isArray(field.options) ? field.options : [];
    const option = options.find((o: any) => String(o.value) === String(value));
    if (option) return option.label || option.value;
  }
  
  return String(value);
}
