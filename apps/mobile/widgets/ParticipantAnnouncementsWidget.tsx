import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Announcement } from '@festflow/shared';

interface ParticipantAnnouncementsWidgetProps {
  announcements: Announcement[];
  isMedium?: boolean;
}

export function ParticipantAnnouncementsWidget({
  announcements,
  isMedium = true,
}: ParticipantAnnouncementsWidgetProps) {
  const latest = announcements[0];
  const list = isMedium ? announcements.slice(0, 3) : announcements.slice(0, 1);

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
          paddingBottom: 4,
          marginBottom: 6,
        }}
        clickAction="OPEN_APP"
        clickActionData={{ uri: 'festflow://announcements' }}
      >
        <TextWidget
          text="LIVE ANNOUNCEMENTS"
          style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: '700', color: '#1d4ed8' }}
        />
        <TextWidget
          text="Official Feed"
          style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b' }}
        />
      </FlexWidget>

      {/* Items */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-around' }}>
        {list.length === 0 ? (
          <TextWidget
            text="No new announcements"
            style={{ fontSize: 11, color: '#64748b' }}
          />
        ) : (
          list.map((item) => (
            <FlexWidget
              key={item.id}
              style={{
                flexDirection: 'column',
                paddingVertical: 3,
                borderBottomWidth: isMedium ? 1 : 0,
                borderBottomColor: '#f8fafc',
              }}
              clickAction="OPEN_APP"
              clickActionData={{ uri: `festflow://announcement/${item.id}` }}
            >
              <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextWidget
                  text={item.title || 'Broadcast'}
                  style={{ fontSize: 11, fontWeight: '700', color: '#0f172a' }}
                  maxLines={1}
                />
                <TextWidget
                  text={new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  style={{ fontSize: 8, fontFamily: 'monospace', color: '#94a3b8' }}
                />
              </FlexWidget>
              <TextWidget
                text={item.message}
                style={{ fontSize: 10, color: '#475569', marginTop: 1 }}
                maxLines={2}
              />
            </FlexWidget>
          ))
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

