import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type FieldOption = {
  id: string;
  value: string;
  label: string;
  labelAr: string;
};

type FieldOptionsEditorProps = {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
};

function SortableOption({
  option,
  onUpdate,
  onRemove,
}: {
  option: FieldOption;
  onUpdate: (id: string, field: keyof FieldOption, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background"
    >
      <button
        type="button"
        className="cursor-grab hover:bg-muted p-1 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        placeholder="Value"
        value={option.value}
        onChange={(e) => onUpdate(option.id, "value", e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="Label (EN)"
        value={option.label}
        onChange={(e) => onUpdate(option.id, "label", e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="Label (AR)"
        value={option.labelAr}
        onChange={(e) => onUpdate(option.id, "labelAr", e.target.value)}
        className="flex-1"
        dir="rtl"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(option.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function FieldOptionsEditor({ options, onChange }: FieldOptionsEditorProps) {
  const [localOptions, setLocalOptions] = useState<FieldOption[]>(options);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localOptions.findIndex((o) => o.id === active.id);
      const newIndex = localOptions.findIndex((o) => o.id === over.id);
      const newOptions = arrayMove(localOptions, oldIndex, newIndex);
      setLocalOptions(newOptions);
      onChange(newOptions);
    }
  };

  const addOption = () => {
    const newOption: FieldOption = {
      id: `opt_${Date.now()}`,
      value: "",
      label: "",
      labelAr: "",
    };
    const newOptions = [...localOptions, newOption];
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  const updateOption = (id: string, field: keyof FieldOption, value: string) => {
    const newOptions = localOptions.map((opt) =>
      opt.id === id ? { ...opt, [field]: value } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  const removeOption = (id: string) => {
    const newOptions = localOptions.filter((opt) => opt.id !== id);
    setLocalOptions(newOptions);
    onChange(newOptions);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Options</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>
      
      {localOptions.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg border-dashed">
          No options defined. Click "Add Option" to create options.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localOptions.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localOptions.map((option) => (
                <SortableOption
                  key={option.id}
                  option={option}
                  onUpdate={updateOption}
                  onRemove={removeOption}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      <p className="text-xs text-muted-foreground">
        Drag options to reorder. Value is stored in database, labels are displayed to users.
      </p>
    </div>
  );
}
