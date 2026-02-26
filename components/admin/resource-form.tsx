"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface ResourceFormProps {
  title: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string | number>;
  onSubmit: (values: Record<string, string | number>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function ResourceForm({
  title,
  fields,
  initialValues,
  onSubmit,
  onClose,
  isOpen,
}: ResourceFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    } else {
      const defaults: Record<string, string | number> = {};
      fields.forEach((f) => {
        defaults[f.name] = f.type === "number" ? 0 : "";
      });
      setValues(defaults);
    }
  }, [initialValues, fields, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#09090b] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  required={field.required}
                  className="minimal-input"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={3}
                  className="minimal-input resize-none !h-auto py-3"
                />
              ) : (
                <input
                  type={field.type}
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [field.name]:
                        field.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                  className="minimal-input"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium"
            >
              {loading ? "Saving..." : initialValues ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
