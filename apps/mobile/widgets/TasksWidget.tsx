import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Task } from '@festflow/shared';

interface TasksWidgetProps {
  tasks: Task[];
  roleTitle: string;
  isSmall?: boolean;
}

export function TasksWidget({ tasks, roleTitle, isSmall = false }: TasksWidgetProps) {
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const nextTask = pendingTasks[0];
  const remainingCount = pendingTasks.length;

  if (isSmall || !pendingTasks.length) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#ffffff',
          borderRadius: 0,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          padding: 12,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        clickAction="OPEN_APP"
        clickActionData={{ uri: 'festflow://tasks' }}
      >
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextWidget
            text={roleTitle.toUpperCase()}
            style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: '#1d4ed8' }}
          />
          <TextWidget
            text={`${remainingCount} left`}
            style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: '#64748b' }}
          />
        </FlexWidget>

        {nextTask ? (
          <FlexWidget style={{ flexDirection: 'column', marginVertical: 4 }}>
            <TextWidget
              text={nextTask.title}
              style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}
              maxLines={2}
            />
            {nextTask.due_at && (
              <TextWidget
                text={`Due: ${new Date(nextTask.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', marginTop: 2 }}
              />
            )}
          </FlexWidget>
        ) : (
          <TextWidget
            text="All tasks completed"
            style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}
          />
        )}

        <TextWidget
          text="Tap to open checklist"
          style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}
        />
      </FlexWidget>
    );
  }

  // Medium / Large: Next 3-5 tasks with interactive checkboxes
  const displayTasks = pendingTasks.slice(0, 4);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          paddingBottom: 6,
          marginBottom: 6,
        }}
        clickAction="OPEN_APP"
        clickActionData={{ uri: 'festflow://tasks' }}
      >
        <TextWidget
          text={`${roleTitle.toUpperCase()} TASKS`}
          style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: '#1d4ed8' }}
        />
        <TextWidget
          text={`${remainingCount} pending`}
          style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}
        />
      </FlexWidget>

      {/* Task list with interactive checkbox triggers */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-around' }}>
        {displayTasks.map((t) => (
          <FlexWidget
            key={t.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 4,
              borderBottomWidth: 1,
              borderBottomColor: '#f8fafc',
            }}
          >
            {/* Interactive Checkbox Button (Headless Task Execution) */}
            <FlexWidget
              style={{
                width: 20,
                height: 20,
                borderWidth: 1.5,
                borderColor: '#1d4ed8',
                backgroundColor: '#eff6ff',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              clickAction="TASK_MARK_DONE"
              clickActionData={{ taskId: t.id }}
            >
              <TextWidget text=" " style={{ fontSize: 10, color: '#1d4ed8' }} />
            </FlexWidget>

            {/* Task Body click opens deep link */}
            <FlexWidget
              style={{ flex: 1, flexDirection: 'column' }}
              clickAction="OPEN_APP"
              clickActionData={{ uri: `festflow://task/${t.id}` }}
            >
              <TextWidget
                text={t.title}
                style={{ fontSize: 11, fontWeight: '600', color: '#1e293b' }}
                maxLines={1}
              />
              {t.due_at && (
                <TextWidget
                  text={new Date(t.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}
                />
              )}
            </FlexWidget>
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

