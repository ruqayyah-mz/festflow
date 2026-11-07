import { Event, JudgingCriterion, Mark, MarkCriteria } from '@/types';

// Used when an event has no custom criteria yet. Always totals 100.
export const DEFAULT_CRITERIA: JudgingCriterion[] = [
  { id: 'innovation', label: 'Innovation', max: 25 },
  { id: 'execution', label: 'Technical Execution', max: 25 },
  { id: 'impact', label: 'Impact', max: 20 },
  { id: 'design', label: 'Design & UX', max: 15 },
  { id: 'presentation', label: 'Presentation', max: 15 },
];

// Marks saved before custom criteria existed were 7 criteria × 10 points and carry no max_score.
const LEGACY_MAX_SCORE = 70;
export const CRITERIA_TOTAL = 100;

export function getCriteria(event: Pick<Event, 'criteria'> | undefined): JudgingCriterion[] {
  return event?.criteria?.length ? event.criteria : DEFAULT_CRITERIA;
}

export const maxScore = (criteria: JudgingCriterion[]) => criteria.reduce((sum, c) => sum + c.max, 0);

export const emptyScores = (criteria: JudgingCriterion[]): MarkCriteria =>
  Object.fromEntries(criteria.map((c) => [c.id, 0]));

// Sum of the scores for the given criteria only (ignores keys from an older criteria set).
export const scoreTotal = (scores: MarkCriteria, criteria: JudgingCriterion[]) =>
  criteria.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);

// A mark as a percentage (0–100) of the maximum it was scored against — what round weights apply to.
// Storing max_score per mark keeps old marks correct even if the organizer later changes the criteria.
export const markPercent = (mark: Pick<Mark, 'score' | 'max_score'>) =>
  (mark.score / (mark.max_score || LEGACY_MAX_SCORE)) * 100;

// Returns a human-readable problem, or null when the criteria are valid.
export function validateCriteria(criteria: JudgingCriterion[]): string | null {
  if (criteria.length === 0) return 'Add at least one criterion.';
  if (criteria.some((c) => !c.label.trim())) return 'Every criterion needs a name.';
  const names = criteria.map((c) => c.label.trim().toLowerCase());
  if (new Set(names).size !== names.length) return 'Criterion names must be unique.';
  if (criteria.some((c) => !Number.isInteger(c.max) || c.max <= 0)) return 'Each criterion must be worth a whole number of points above 0.';
  const total = maxScore(criteria);
  if (total !== CRITERIA_TOTAL) return `Criteria points must add up to exactly ${CRITERIA_TOTAL} (currently ${total}).`;
  return null;
}
