import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { formatDate } from '@/lib/utils';
import { getLocationMode } from '@/lib/eventRules';
import { ShieldCheck, CheckCircle2, Clock, Award } from 'lucide-react';

export function VolunteerRolePage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  const event = mockStorage.getEventById(eventId);
  const myRole = mockStorage
    .getRoles(eventId)
    .find((r) => r.user_id === user?.id && r.role_type === 'volunteer');
  if (!event || !user) return null; // VolunteerEventLayout already guards this

  const attended = mockStorage.isAttendanceMarked(eventId, user.id);
  const experience = mockStorage.getVolunteerExperience(user.id);

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700">{user.full_name}</span>
            <h2 className="text-xl font-bold text-slate-900">{myRole?.role_title || 'General Volunteer'}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Reporting Location:</span>
            <span className="font-bold text-slate-900 text-sm">{event.venue}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Duty Duration:</span>
            <span className="font-bold text-slate-900 text-sm">
              {formatDate(event.starts_at)} — {formatDate(event.ends_at)}
            </span>
          </div>
        </div>

        {getLocationMode(event) === 'online' && (
          <p className="text-xs text-slate-500">Online event — no physical check-in needed.</p>
        )}
        {/* Check-in QR: encodes the user id, which the organizer's QR Attendance scanner matches on. */}
        <div className={`p-5 border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-5 ${getLocationMode(event) === 'online' ? 'hidden' : ''}`}>
          <div className="bg-white p-3 border border-slate-200 shadow-2xs">
            <QRCodeSVG value={user.id} size={160} level="M" aria-label={`Check-in QR code for ${user.full_name}`} />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Check-In Badge</span>
            <p className="text-xs text-slate-600">Show this to an organizer to mark your attendance.</p>
            <div className="text-[11px] font-mono text-slate-500">ID: {user.id}</div>
            {attended ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ATTENDANCE RECORDED</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>NOT CHECKED IN YET</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Volunteer Experience</h2>
        </div>
        {experience.length === 0 ? (
          <p className="text-xs text-slate-500">No past events yet — this is your first one.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {experience.map((x) => (
              <div key={x.event.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{x.event.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {x.roleTitle} • {formatDate(x.event.starts_at)}
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shrink-0">
                  {x.tasksDone} tasks done
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
