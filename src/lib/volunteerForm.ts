import { Event, VolunteerFormQuestion } from '@/types';

// The pinned role question: its options are the event's volunteer role titles.
export const ROLE_QUESTION_ID = 'role';

export function defaultVolunteerForm(roles: string[] = ['General Volunteer']): VolunteerFormQuestion[] {
  return [
    { id: ROLE_QUESTION_ID, label: 'Preferred role', type: 'choice', options: roles, required: true },
    { id: 'skills', label: 'Relevant skills', type: 'short', required: true },
    { id: 'availability', label: 'Availability during the event', type: 'short', required: true },
    { id: 'motivation', label: 'Why do you want to volunteer?', type: 'paragraph', required: false },
  ];
}

// Events created before the form builder existed fall back to the default form.
// A multiple-choice question with no options can never be answered, so it is dropped
// (with no roles, applicants simply join as General Volunteer).
export function getVolunteerForm(event: Event): VolunteerFormQuestion[] {
  const form = event.volunteer_form?.length ? event.volunteer_form : defaultVolunteerForm();
  return form.filter((q) => q.type !== 'choice' || (q.options ?? []).some((o) => o.trim()));
}

// For the builder: the raw form, always including the pinned role question (even with no roles yet).
export function getEditableVolunteerForm(event: Event): VolunteerFormQuestion[] {
  const form = event.volunteer_form?.length ? event.volunteer_form : defaultVolunteerForm();
  return form.some((q) => q.id === ROLE_QUESTION_ID) ? form : [...defaultVolunteerForm([]).slice(0, 1), ...form];
}

export function getRoleOptions(form: VolunteerFormQuestion[]): string[] {
  return form.find((q) => q.id === ROLE_QUESTION_ID)?.options?.filter((o) => o.trim()) ?? [];
}
