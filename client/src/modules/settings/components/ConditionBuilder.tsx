import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GitBranch, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Condition types
export type ConditionOperator = 
  | "equals" 
  | "not_equals" 
  | "contains" 
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "in_list"
  | "not_in_list";

export type SingleCondition = {
  field: string;
  operator: ConditionOperator;
  value: string;
};

export type ConditionGroup = {
  logic: "AND" | "OR";
  conditions: (SingleCondition | ConditionGroup)[];
};

export type ShowCondition = SingleCondition | ConditionGroup | null;

// Available field type for condition builder
export type AvailableField = {
  code: string;
  name: string;
  fieldType: string;
  options?: { value: string; label: string }[];
};

// Operators with labels
const operators: { value: ConditionOperator; label: string; description: string }[] = [
  { value: "equals", label: "Equals", description: "Field value equals the specified value" },
  { value: "not_equals", label: "Not Equals", description: "Field value does not equal the specified value" },
  { value: "contains", label: "Contains", description: "Field value contains the specified text" },
  { value: "not_contains", label: "Not Contains", description: "Field value does not contain the specified text" },
  { value: "starts_with", label: "Starts With", description: "Field value starts with the specified text" },
  { value: "ends_with", label: "Ends With", description: "Field value ends with the specified text" },
  { value: "greater_than", label: "Greater Than", description: "Field value is greater than the specified value" },
  { value: "less_than", label: "Less Than", description: "Field value is less than the specified value" },
  { value: "is_empty", label: "Is Empty", description: "Field has no value" },
  { value: "is_not_empty", label: "Is Not Empty", description: "Field has a value" },
  { value: "in_list", label: "In List", description: "Field value is one of the specified values (comma-separated)" },
  { value: "not_in_list", label: "Not In List", description: "Field value is not one of the specified values" },
];

// Check if operator requires a value
const operatorRequiresValue = (op: ConditionOperator): boolean => {
  return !["is_empty", "is_not_empty"].includes(op);
};

// Single condition editor component
function SingleConditionEditor({
  condition,
  availableFields,
  onChange,
  onRemove,
}: {
  condition: SingleCondition;
  availableFields: AvailableField[];
  onChange: (condition: SingleCondition) => void;
  onRemove: () => void;
}) {
  const selectedField = availableFields.find(f => f.code === condition.field);
  const hasOptions = selectedField?.options && selectedField.options.length > 0;
  const needsValue = operatorRequiresValue(condition.operator);

  return (
    <div className="flex items-start gap-2 p-3 border rounded-lg bg-[#F5F5F5]">
      <div className="flex-1 grid grid-cols-12 gap-2">
        {/* Field selector */}
        <div className="col-span-4">
          <Label className="text-xs text-[#6B6B6B] mb-1 block">When field</Label>
          <Select
            value={condition.field}
            onValueChange={(value) => onChange({ ...condition, field: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.code} value={field.code}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator selector */}
        <div className="col-span-3">
          <Label className="text-xs text-[#6B6B6B] mb-1 block">Operator</Label>
          <Select
            value={condition.operator}
            onValueChange={(value) => onChange({ ...condition, operator: value as ConditionOperator })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value input */}
        <div className="col-span-4">
          <Label className="text-xs text-[#6B6B6B] mb-1 block">Value</Label>
          {needsValue ? (
            hasOptions ? (
              <Select
                value={condition.value}
                onValueChange={(value) => onChange({ ...condition, value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {selectedField?.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={condition.value}
                onChange={(e) => onChange({ ...condition, value: e.target.value })}
                placeholder="Enter value"
                className="h-9"
              />
            )
          ) : (
            <div className="h-9 flex items-center text-sm text-[#6B6B6B] italic">
              No value needed
            </div>
          )}
        </div>

        {/* Remove button */}
        <div className="col-span-1 flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#FF6B6B] hover:text-[#FF6B6B]"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Condition group editor component
function ConditionGroupEditor({
  group,
  availableFields,
  onChange,
  onRemove,
  depth = 0,
}: {
  group: ConditionGroup;
  availableFields: AvailableField[];
  onChange: (group: ConditionGroup) => void;
  onRemove?: () => void;
  depth?: number;
}) {
  const addCondition = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { field: "", operator: "equals" as ConditionOperator, value: "" },
      ],
    });
  };

  const addGroup = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { logic: "AND" as const, conditions: [] },
      ],
    });
  };

  const updateCondition = (index: number, condition: SingleCondition | ConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onChange({ ...group, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    });
  };

  const toggleLogic = () => {
    onChange({
      ...group,
      logic: group.logic === "AND" ? "OR" : "AND",
    });
  };

  const isGroup = (item: SingleCondition | ConditionGroup): item is ConditionGroup => {
    return "logic" in item;
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 space-y-3",
        depth === 0 ? "bg-[#F5F5F5]/30" : "bg-[#F5F5F5]/50"
      )}
    >
      {/* Group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#6B6B6B]" />
          <span className="text-sm font-medium">
            {depth === 0 ? "Show this field when" : "Nested group"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleLogic}
          >
            {group.logic === "AND" ? "ALL conditions match" : "ANY condition matches"}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {group.logic}
          </Badge>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#FF6B6B] hover:text-[#FF6B6B]"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conditions list */}
      <div className="space-y-2">
        {group.conditions.map((condition, index) => (
          <div key={index}>
            {index > 0 && (
              <div className="flex items-center justify-center py-1">
                <Badge variant="outline" className="text-xs">
                  {group.logic}
                </Badge>
              </div>
            )}
            {isGroup(condition) ? (
              <ConditionGroupEditor
                group={condition}
                availableFields={availableFields}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                depth={depth + 1}
              />
            ) : (
              <SingleConditionEditor
                condition={condition}
                availableFields={availableFields}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={addCondition}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Condition
        </Button>
        {depth < 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={addGroup}
          >
            <GitBranch className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        )}
      </div>
    </div>
  );
}

// Main ConditionBuilder component
export function ConditionBuilder({
  condition,
  availableFields,
  onChange,
  currentFieldCode,
}: {
  condition: ShowCondition;
  availableFields: AvailableField[];
  onChange: (condition: ShowCondition) => void;
  currentFieldCode?: string;
}) {
  const [enabled, setEnabled] = useState(condition !== null);

  // Filter out the current field from available fields
  const filteredFields = availableFields.filter(f => f.code !== currentFieldCode);

  // Initialize with empty group if enabling
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked && !condition) {
      onChange({ logic: "AND", conditions: [] });
    } else if (!checked) {
      onChange(null);
    }
  };

  // Convert single condition to group format for editing
  useEffect(() => {
    if (condition && !("logic" in condition)) {
      // Convert single condition to group
      onChange({ logic: "AND", conditions: [condition] });
    }
  }, []);

  const conditionGroup: ConditionGroup = condition && "logic" in condition
    ? condition
    : { logic: "AND", conditions: condition ? [condition] : [] };

  return (
    <div className="space-y-4">
      {/* Enable/Disable toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-[#F5F5F5]/20">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Eye className="h-5 w-5 text-[#5B2C93]" />
          ) : (
            <EyeOff className="h-5 w-5 text-[#6B6B6B]" />
          )}
          <div>
            <div className="font-medium text-sm">Conditional Visibility</div>
            <div className="text-xs text-[#6B6B6B]">
              {enabled
                ? "This field will only show when conditions are met"
                : "This field will always be visible"}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={() => handleToggle(!enabled)}
        >
          {enabled ? "Enabled" : "Disabled"}
        </Button>
      </div>

      {/* Condition builder */}
      {enabled && (
        <>
          {filteredFields.length === 0 ? (
            <div className="text-center py-6 text-[#6B6B6B] border rounded-lg bg-[#F5F5F5]/20">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No other fields available in this section</p>
              <p className="text-xs mt-1">Add more fields to create conditions</p>
            </div>
          ) : (
            <ConditionGroupEditor
              group={conditionGroup}
              availableFields={filteredFields}
              onChange={onChange}
            />
          )}
        </>
      )}

      {/* Condition summary */}
      {enabled && conditionGroup.conditions.length > 0 && (
        <div className="p-3 border rounded-lg bg-[#5B2C93]/5">
          <div className="text-xs font-medium text-[#5B2C93] mb-1">Condition Summary</div>
          <div className="text-sm text-[#6B6B6B]">
            {formatConditionSummary(conditionGroup, filteredFields)}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format condition summary
function formatConditionSummary(
  condition: ShowCondition,
  fields: AvailableField[]
): string {
  if (!condition) return "Always visible";

  const getFieldName = (code: string) => {
    const field = fields.find(f => f.code === code);
    return field?.name || code;
  };

  const formatSingle = (c: SingleCondition): string => {
    const fieldName = getFieldName(c.field);
    const op = operators.find(o => o.value === c.operator);
    const opLabel = op?.label.toLowerCase() || c.operator;
    
    if (!operatorRequiresValue(c.operator)) {
      return `"${fieldName}" ${opLabel}`;
    }
    return `"${fieldName}" ${opLabel} "${c.value}"`;
  };

  if (!("logic" in condition)) {
    return formatSingle(condition);
  }

  const parts = condition.conditions.map(c => {
    if ("logic" in c) {
      return `(${formatConditionSummary(c, fields)})`;
    }
    return formatSingle(c);
  });

  const connector = condition.logic === "AND" ? " AND " : " OR ";
  return parts.join(connector);
}

// Export helper to parse JSON condition
export function parseCondition(json: string | object | null): ShowCondition {
  if (!json) return null;
  if (typeof json === "string") {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  return json as ShowCondition;
}

// Export helper to stringify condition for storage
export function stringifyCondition(condition: ShowCondition): string | null {
  if (!condition) return null;
  
  // Clean up empty conditions
  if ("logic" in condition) {
    if (condition.conditions.length === 0) return null;
    
    // If only one condition in group, simplify
    if (condition.conditions.length === 1 && !("logic" in condition.conditions[0])) {
      return JSON.stringify(condition.conditions[0]);
    }
  }
  
  return JSON.stringify(condition);
}
