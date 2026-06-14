import { X } from "lucide-react";
import type { FilterCondition } from "@/api/segments";

interface FieldDef {
  label: string;
  type: "number" | "date" | "text" | "select";
  options?: string[];
}

export const FIELD_DEFS: Record<string, FieldDef> = {
  total_spend:      { label: "Total Spend (₹)",    type: "number" },
  total_orders:     { label: "Total Orders",        type: "number" },
  last_order_date:  { label: "Last Order (days)",   type: "date" },
  city:             { label: "City",                type: "text" },
  gender:           { label: "Gender",              type: "select", options: ["male", "female", "other"] },
  product_category: { label: "Product Category",    type: "select", options: ["moisturiser", "serum", "spf", "cleanser", "toner"] },
};

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: "greater_than",          label: "greater than" },
    { value: "greater_than_or_equal", label: "at least" },
    { value: "less_than",             label: "less than" },
    { value: "less_than_or_equal",    label: "at most" },
    { value: "equals",                label: "exactly" },
  ],
  date: [
    { value: "more_than_days_ago",  label: "more than N days ago" },
    { value: "less_than_days_ago",  label: "within last N days" },
  ],
  text:   [{ value: "equals", label: "is" }],
  select: [{ value: "equals", label: "is" }],
};

interface FilterRowProps {
  condition: FilterCondition;
  index: number;
  matchMode?: "ALL" | "ANY";
  onChange: (updated: FilterCondition) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export default function FilterRow({
  condition,
  index,
  matchMode = "ALL",
  onChange,
  onRemove,
  readOnly = false,
}: FilterRowProps) {
  const fieldDef = FIELD_DEFS[condition.field] ?? { label: condition.field, type: "text" };
  const operators = OPERATORS[fieldDef.type] ?? OPERATORS.text;

  const handleField = (field: string) => {
    const def = FIELD_DEFS[field] ?? { type: "text" };
    const ops = OPERATORS[def.type] ?? OPERATORS.text;
    onChange({ field, operator: ops[0].value, value: "" });
  };

  const inputCls =
    "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {index > 0 && (
        <span className="text-xs text-gray-400 w-8 text-right">
          {matchMode === "ANY" ? "or" : "and"}
        </span>
      )}

      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) => handleField(e.target.value)}
        disabled={readOnly}
        className={inputCls}
      >
        {Object.entries(FIELD_DEFS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value })}
        disabled={readOnly}
        className={inputCls}
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Value */}
      {fieldDef.type === "select" ? (
        <select
          value={condition.value as string}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          disabled={readOnly}
          className={inputCls}
        >
          {fieldDef.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={fieldDef.type === "number" || fieldDef.type === "date" ? "number" : "text"}
          value={condition.value as string | number}
          onChange={(e) =>
            onChange({
              ...condition,
              value:
                fieldDef.type === "number" || fieldDef.type === "date"
                  ? Number(e.target.value)
                  : e.target.value,
            })
          }
          disabled={readOnly}
          placeholder={fieldDef.type === "date" ? "days" : "value"}
          className={`${inputCls} w-28`}
        />
      )}

      {!readOnly && (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors ml-1"
          title="Remove condition"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
