import React from 'react';
import { FlexWidget, ListWidget, TextWidget } from 'react-native-android-widget';
import type { Task } from '@festflow/shared';

export type TasksWidgetState = 'ok' | 'saving' | 'offline' | 'error' | 'signed_out';

export interface TasksWidgetProps {
  tasks: Task[];
  state?: TasksWidgetState;
  syncedAt?: number | null;
  isSmall?: boolean;
  title?: string; // the event this widget shows
}

const BLUE = '#1d4ed8';
const INK = '#0f172a';
const MUTED = '#94a3b8';
const LINE = '#e2e8f0';
/** Ticked tasks stay visible (like a notes checklist) for this long so a mis-tap can be undone. */
const KEEP_DONE_MS = 12 * 60 * 60 * 1000;
const MAX_ROWS = 12;

function hhmm(iso: string | number) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Open tasks first (soonest due first), then recently ticked ones. */
export function widgetRows(tasks: Task[], now = Date.now()): Task[] {
  const open = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.due_at ? Date.parse(a.due_at) : Infinity) - (b.due_at ? Date.parse(b.due_at) : Infinity));
  const recentlyDone = tasks
    .filter((t) => t.status === 'done' && t.completed_at && now - Date.parse(t.completed_at) < KEEP_DONE_MS)
    .sort((a, b) => Date.parse(b.completed_at!) - Date.parse(a.completed_at!));
  return [...open, ...recentlyDone].slice(0, MAX_ROWS);
}

function footerText(state: TasksWidgetState, syncedAt?: number | null) {
  switch (state) {
    case 'saving':
      return 'Saving…';
    case 'offline':
      return 'Offline · will sync when connected';
    case 'error':
      return "Couldn't sync · tap header to open app";
    default:
      return syncedAt ? `Synced ${hhmm(syncedAt)}` : 'Tap a box to mark done';
  }
}

function Checkbox({ task }: { task: Task }) {
  const done = task.status === 'done';
  return (
    <FlexWidget
      clickAction="TOGGLE_TASK"
      clickActionData={{ taskId: task.id, status: done ? 'todo' : 'done' }}
      style={{
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FlexWidget
        style={{
          width: 20,
          height: 20,
          borderWidth: 2,
          borderColor: done ? BLUE : '#64748b',
          backgroundColor: done ? BLUE : '#ffffff',
          borderRadius: 4,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text={done ? '✓' : ' '} style={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }} />
      </FlexWidget>
    </FlexWidget>
  );
}

function Row({ task }: { task: Task }) {
  const done = task.status === 'done';
  const meta = done
    ? task.completed_at
      ? `Done ${hhmm(task.completed_at)}`
      : 'Done'
    : [task.status === 'in_progress' ? 'In progress' : null, task.due_at ? `Due ${hhmm(task.due_at)}` : null]
        .filter(Boolean)
        .join(' · ');
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
      }}
    >
      <Checkbox task={task} />
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: `festflow://task/${task.id}` }}
        style={{ flex: 1, flexDirection: 'column', paddingVertical: 6, paddingRight: 8 }}
      >
        <TextWidget
          text={task.title}
          maxLines={2}
          truncate="END"
          style={{ fontSize: 13, fontWeight: '600', color: done ? MUTED : INK }}
        />
        {meta ? (
          <TextWidget text={meta} style={{ fontSize: 10, fontFamily: 'monospace', color: MUTED }} />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}

export function TasksWidget({ tasks, state = 'ok', syncedAt, isSmall = false, title = 'My tasks' }: TasksWidgetProps) {
  const rows = widgetRows(tasks);
  const openCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: LINE,
        flexDirection: 'column',
        paddingTop: isSmall ? 8 : 12,
        paddingBottom: 6,
        paddingHorizontal: isSmall ? 6 : 10,
      }}
    >
      {/* Header: opens the app's task list */}
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'festflow://tasks' }}
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 6,
          paddingBottom: 6,
        }}
      >
        <TextWidget text={title} maxLines={1} truncate="END" style={{ fontSize: 15, fontWeight: '700', color: INK }} />
        <TextWidget
          text={state === 'signed_out' ? '' : `${openCount} open`}
          style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: '700', color: BLUE }}
        />
      </FlexWidget>

      {/* Body */}
      {state === 'signed_out' ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'festflow://login' }}
          style={{ flex: 1, width: 'match_parent', justifyContent: 'center', alignItems: 'center' }}
        >
          <TextWidget text="Sign in to FestFlow to see your tasks" style={{ fontSize: 12, color: '#475569' }} />
        </FlexWidget>
      ) : rows.length === 0 ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'festflow://tasks' }}
          style={{ flex: 1, width: 'match_parent', justifyContent: 'center', alignItems: 'center' }}
        >
          <TextWidget text="No tasks right now" style={{ fontSize: 12, color: '#475569' }} />
        </FlexWidget>
      ) : (
        // flex:1 wrapper so the scrolling list takes the leftover height and the footer stays visible
        <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
          <ListWidget style={{ height: 'match_parent', width: 'match_parent' }}>
            {rows.map((t) => (
              <Row key={t.id} task={t} />
            ))}
          </ListWidget>
        </FlexWidget>
      )}

      {!isSmall && (
        <TextWidget
          text={footerText(state, syncedAt)}
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            color: state === 'error' ? '#b91c1c' : MUTED,
            marginTop: 4,
            marginLeft: 6,
          }}
        />
      )}
    </FlexWidget>
  );
}
