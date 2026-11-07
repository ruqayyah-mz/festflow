import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface ChipInputProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  error?: string;
}

// Free-text chips (Enter or comma adds) plus one-click suggestions.
export function ChipInput({ id, label, values, onChange, suggestions = [], placeholder, max = 20, disabled, error }: ChipInputProps) {
  const [draft, setDraft] = useState('');
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const add = (raw: string) => {
    const v = raw.trim().replace(/,$/, '').trim();
    if (v && !has(v) && values.length < max) onChange([...values, v]);
    setDraft('');
  };
  const remaining = suggestions.filter((s) => !has(s));

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <div
        className={`flex flex-wrap items-center gap-1.5 p-2 border bg-white ${error ? 'border-red-500' : 'border-slate-300'} focus-within:border-blue-600`}
      >
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800">
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="text-blue-400 hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && values.length < max && (
          <input
            id={id}
            type="text"
            value={draft}
            placeholder={values.length ? '' : placeholder}
            onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add(draft);
              } else if (e.key === 'Backspace' && !draft && values.length) {
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            className="flex-1 min-w-[8rem] text-sm outline-none bg-transparent"
          />
        )}
      </div>
      {!disabled && remaining.length > 0 && values.length < max && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 border border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
