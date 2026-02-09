import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, ClipboardList } from "lucide-react";

interface FormDataDisplayProps {
  formData: Record<string, any> | null | undefined;
  selectedTypeIds: number[] | null | undefined;
  categoryId?: number | null;
  compact?: boolean; // For approval view (3-column grid)
}

/**
 * Renders the dynamic form data submitted with a request.
 * Fetches the form definition to get field labels and section structure,
 * then displays the values in a structured layout.
 */
export function FormDataDisplay({ formData, selectedTypeIds, categoryId, compact = false }: FormDataDisplayProps) {
  // Fetch form definition to get field labels and sections
  const { data: formDefinition, isLoading } = trpc.requestConfig.formDefinition.getFormDefinition.useQuery(
    { typeIds: selectedTypeIds || [] },
    { enabled: !!selectedTypeIds && selectedTypeIds.length > 0 }
  );

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
                      return (
                        <div key={field.code}>
                          <span className="text-[#6B6B6B] text-xs">{field.name}</span>
                          <p className="font-medium text-[#2C2C2C]">{formatFieldValue(val, field)}</p>
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
                    <p className="font-medium text-[#2C2C2C]">{formatFieldValue(val, field)}</p>
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
  
  // Handle arrays (multi-select)
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  
  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  // Handle dates
  if (field.fieldType === "date" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return value;
    }
  }
  
  // Handle select fields - try to find the label from options
  if ((field.fieldType === "select" || field.fieldType === "radio") && field.options) {
    const options = Array.isArray(field.options) ? field.options : [];
    const option = options.find((o: any) => o.value === value);
    if (option) return option.label || option.value;
  }
  
  return String(value);
}
