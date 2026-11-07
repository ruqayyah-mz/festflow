import { useState } from 'react';
import { VolunteerFormQuestion } from '@/types';
import { Button } from '@/components/ui/Button';
import { ROLE_QUESTION_ID } from '@/lib/volunteerForm';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  questions: VolunteerFormQuestion[];
  onChange: (questions: VolunteerFormQuestion[]) => void;
  // Private-link events skip the application, so only the role list is relevant.
  rolesOnly?: boolean;
}

const inputCls =
  'w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white text-neutral-900 rounded-xs focus:border-blue-600 focus:outline-none';

function OptionsEditor({
  options,
  onChange,
  addLabel,
  placeholder,
}: {
  options: string[];
  onChange: (o: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !options.includes(v)) onChange([...options, v]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <span
            key={opt}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-800"
          >
            {opt}
            <button
              type="button"
              onClick={() => onChange(options.filter((o) => o !== opt))}
              aria-label={`Remove ${opt}`}
              className="text-slate-400 hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className={inputCls}
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="space-x-1 shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span>{addLabel}</span>
        </Button>
      </div>
    </div>
  );
}

export function VolunteerFormBuilder({ questions, onChange, rolesOnly }: Props) {
  const update = (id: string, patch: Partial<VolunteerFormQuestion>) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...questions];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    onChange(next);
  };

  const roleQ = questions.find((q) => q.id === ROLE_QUESTION_ID);
  const custom = questions.filter((q) => q.id !== ROLE_QUESTION_ID);

  return (
    <div className="space-y-4">
      {/* Pinned role question */}
      <div className="p-4 border border-blue-200 bg-blue-50/40 rounded-xs space-y-2">
        <div className="text-xs font-semibold text-slate-900">
          Volunteer Roles{' '}
          <span className="font-normal text-slate-500">
            {rolesOnly
              ? '— one private invite link is generated per role'
              : '— shown to applicants as the required "Preferred role" question'}
          </span>
        </div>
        <OptionsEditor
          options={roleQ?.options ?? []}
          onChange={(options) => update(ROLE_QUESTION_ID, { options })}
          addLabel="Add Role"
          placeholder="e.g. Registration Desk, AV Support"
        />
        {!(roleQ?.options ?? []).length && (
          <p className="text-[11px] text-amber-700">
            No roles added: volunteers will join as "General Volunteer" and won't be asked to pick a role.
          </p>
        )}
      </div>

      {!rolesOnly && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-900">Application Questions</div>
          {custom.map((q) => {
            const index = questions.indexOf(q);
            return (
              <div key={q.id} className="p-3 border border-slate-200 bg-white rounded-xs space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => update(q.id, { label: e.target.value })}
                    placeholder="Question"
                    aria-label="Question text"
                    className={`${inputCls} font-medium`}
                  />
                  <select
                    value={q.type}
                    onChange={(e) =>
                      update(q.id, {
                        type: e.target.value as VolunteerFormQuestion['type'],
                        options: e.target.value === 'choice' ? q.options ?? [] : undefined,
                      })
                    }
                    aria-label="Question type"
                    className="text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-xs sm:w-40"
                  >
                    <option value="short">Short answer</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="choice">Multiple choice</option>
                  </select>
                </div>

                {q.type === 'choice' && (
                  <>
                    <OptionsEditor
                      options={q.options ?? []}
                      onChange={(options) => update(q.id, { options })}
                      addLabel="Add Option"
                      placeholder="New option"
                    />
                    {!(q.options ?? []).length && (
                      <p className="text-[11px] text-amber-700">Add at least one option, or this question will be hidden from applicants.</p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => update(q.id, { required: e.target.checked })}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    Required
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index <= 1}
                      onClick={() => move(index, -1)}
                      aria-label="Move question up"
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move question down"
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(questions.filter((x) => x.id !== q.id))}
                      aria-label="Delete question"
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="space-x-1"
            onClick={() =>
              onChange([
                ...questions,
                { id: `q-${Date.now().toString(36)}`, label: '', type: 'short', required: false },
              ])
            }
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </Button>
        </div>
      )}
    </div>
  );
}
