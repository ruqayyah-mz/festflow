import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Invite, Event } from '@/types';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, UserCheck, Calendar, MapPin, Loader2 } from 'lucide-react';

export function VolunteerInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, role, switchUser, availableProfiles } = useAuth();

  const [invite, setInvite] = useState<Invite | undefined>(undefined);
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    const found = mockStorage.getInviteByToken(token);
    if (found && mockStorage.isEventConcluded(found.event_id)) {
      setErrorMsg('This event has concluded, so its volunteer links are closed. Past events you worked are under My Events.');
    } else if (found) {
      setInvite(found);
      const evt = mockStorage.getEventById(found.event_id);
      setEvent(evt);
      // Start 2 second auto-redirect countdown for seamless direct access
      setCountdown(2);
    } else {
      setErrorMsg('This volunteer access link is invalid, expired, or has been revoked by the organizer.');
    }
  }, [token]);

  const handleAccessDashboard = () => {
    if (!token || !invite || !event) return;
    setIsProcessing(true);

    // Determine target volunteer identity
    let targetProfileId = availableProfiles[1]?.id; // Default Sarah Chen (volunteer)

    if (invite.volunteer_name) {
      const volProfile = mockStorage.getOrCreateVolunteerProfile(invite.volunteer_name);
      targetProfileId = volProfile.id;
    } else if (invite.volunteer_id) {
      targetProfileId = invite.volunteer_id;
    } else if (user?.id && role === 'volunteer') {
      // Only bind the signed-in account if it's acting as a volunteer — never turn a participant/sponsor into one.
      targetProfileId = user.id;
    }

    // Bind role to this event
    try {
      mockStorage.acceptInvite(token, targetProfileId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not accept this invite.');
      setIsProcessing(false);
      setCountdown(null);
      return;
    }

    // Switch active role to volunteer directly
    switchUser(targetProfileId, 'volunteer');

    // Land directly on volunteer dashboard with this event active
    navigate(`/volunteer/events/${event.id}`);
  };

  // Handle countdown tick
  useEffect(() => {
    if (countdown === null || isProcessing) return;

    if (countdown === 0) {
      handleAccessDashboard();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isProcessing]);

  if (errorMsg || !invite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">
            Volunteer Access Link Expired or Invalid
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMsg || 'The token could not be verified. Please request a fresh access link from the event organizer.'}
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="outline" size="sm">Return to Homepage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assignedName = invite.volunteer_name || 'Volunteer Staff';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-blue-700 tracking-wider font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Direct Volunteer Pass</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-700">
            Authenticated Token
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {invite.role_title || 'General Volunteer Operations'}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {assignedName}!
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have been granted instant direct access to the volunteer duty board for <strong className="text-slate-900">{event?.name}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center text-slate-700 gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{formatDate(event?.starts_at)} — {formatDate(event?.ends_at)}</span>
            </div>
            <div className="flex items-center text-slate-700 gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{event?.venue}</span>
            </div>
            <div className="flex items-center text-slate-700 gap-2">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Assigned Duty: <strong className="text-slate-900">{invite.role_title || 'Shift Duty & Logistics'}</strong></span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <Button
            size="lg"
            className="w-full space-x-2 justify-center"
            onClick={handleAccessDashboard}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Volunteer Workspace...</span>
              </>
            ) : (
              <>
                <span>Access Volunteer Dashboard Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {countdown !== null && countdown > 0 && !isProcessing && (
            <p className="text-[11px] text-center text-slate-500 font-mono">
              Auto-launching in <strong className="text-blue-600">{countdown}s</strong>...
            </p>
          )}

          <p className="text-[11px] text-center text-slate-400">
            No registration or password needed. Token: <span className="font-mono text-slate-600">{invite.token}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
