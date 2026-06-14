import { Plus } from "lucide-react";
import FilterRow, { FIELD_DEFS } from "./FilterRow";
import type { FilterCondition } from "@/api/segments";

interface SegmentBuilderProps {
  filters: FilterCondition[];
  matchMode: "ALL" | "ANY";
  onChange: (filters: FilterCondition[], matchMode: "ALL" | "ANY") => void;
  readOnly?: boolean;
}

function defaultCondition(): FilterCondition {
  return { field: "total_spend", operator: "greater_than", value: 0 };
}

/** Human-readable filter label for read-only display */
export function filterLabel(c: FilterCondition): string {
  const fieldLabel = FIELD_DEFS[c.field]?.label ?? c.field;
  return `${fieldLabel} ${c.operator.replace(/_/g, " ")} ${c.value}`;
}

export default function SegmentBuilder({
  filters,
  matchMode,
  onChange,
  readOnly = false,
}: SegmentBuilderProps) {
  const update = (idx: number, updated: FilterCondition) => {
    const next = filters.map((f, i) => (i === idx ? updated : f));
    onChange(next, matchMode);
  };

  const remove = (idx: number) => {
    onChange(filters.filter((_, i) => i !== idx), matchMode);
  };

  const add = () => {
    onChange([...filters, defaultCondition()], matchMode);
  };

  return (
    <div className="space-y-3">
      {/* Match mode toggle */}
      {!readOnly && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Match</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(["ALL", "ANY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onChange(filters, mode)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  matchMode === mode
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <span className="text-gray-400">conditions</span>
        </div>
      )}

      {/* Filter rows */}
      {filters.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          No conditions yet.{!readOnly && " Use AI Interpret or add manually."}
        </p>
      )}
      {filters.map((condition, i) => (
        <FilterRow
          key={i}
          condition={condition}
          index={i}
          matchMode={matchMode}
          onChange={(updated) => update(i, updated)}
          onRemove={() => remove(i)}
          readOnly={readOnly}
        />
      ))}

      {/* Add condition */}
      {!readOnly && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors mt-1"
        >
          <Plus size={13} />
          Add condition
        </button>
      )}
    </div>
  );
}
