import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface OrganizerProgressWidgetProps {
  eventName: string;
  completedTasks: number;
  totalTasks: number;
  participantCount: number;
}

export function OrganizerProgressWidget({
  eventName,
  completedTasks,
  totalTasks,
  participantCount,
}: OrganizerProgressWidgetProps) {
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      clickActionData={{ uri: 'festflow://organizer/overview' }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget
          text="ORGANIZER OVERVIEW"
          style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: '700', color: '#1d4ed8' }}
        />
        <TextWidget
          text={`${participantCount} hackers`}
          style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}
        />
      </FlexWidget>

      {/* Event Name */}
      <TextWidget
        text={eventName}
        style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', marginVertical: 2 }}
        maxLines={1}
      />

      {/* Progress Metric & Bar */}
      <FlexWidget style={{ flexDirection: 'column', width: '100%' }}>
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <TextWidget
            text="Milestone Tasks"
            style={{ fontSize: 10, color: '#64748b' }}
          />
          <TextWidget
            text={`${completedTasks}/${totalTasks} (${percent}%)`}
            style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: '700', color: '#1d4ed8' }}
          />
        </FlexWidget>

        {/* Progress Bar Container */}
        <FlexWidget
          style={{
            height: 6,
            width: '100%',
            backgroundColor: '#e2e8f0',
            flexDirection: 'row',
          }}
        >
          <FlexWidget
            style={{
              height: 6,
              width: `${Math.max(5, Math.min(100, percent))}%`,
              backgroundColor: '#1d4ed8',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Footer */}
      <TextWidget
        text="Tap to manage event console"
        style={{ fontSize: 9, fontFamily: 'monospace', color: '#94a3b8' }}
      />
    </FlexWidget>
  );
}

