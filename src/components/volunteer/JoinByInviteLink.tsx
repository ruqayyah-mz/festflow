import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { Link2 } from 'lucide-react';

// Accepts a full invite URL (/volunteer/access/<token> or /invite/<token>, any host) or a bare token.
export function extractInviteToken(input: string): string {
  const text = input.trim();
  const match = text.match(/\/(?:volunteer\/access|invite)\/([^/?#\s]+)/);
  return decodeURIComponent(match ? match[1] : text);
}

export function JoinByInviteLink() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = extractInviteToken(value);
    const invite = token ? mockStorage.getInviteByToken(token) : undefined;

    if (!user) return setError('Please sign in first.');
    if (!invite) return setError('That invite link is invalid, expired, or was revoked by the organizer.');
    if (invite.role_type !== 'volunteer') return setError("That link isn't a volunteer invite.");
    if (mockStorage.isEventConcluded(invite.event_id)) return setError('That event has already concluded.');

    try {
      mockStorage.acceptInvite(token, user.id); // returns the existing role if already joined
      navigate(`/volunteer/events/${invite.event_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join with that link.');
    }
  };

  return (
    <form onSubmit={handleJoin} className="border border-blue-200 bg-blue-50/40 p-4 space-y-2">
      <label htmlFor="invite-link" className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 text-blue-600" />
        Have an invite link?
      </label>
      <p className="text-[11px] text-slate-600">
        Organizers of private (My Team) events share a link. Paste it here to join that event's team directly.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="invite-link"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://…/volunteer/access/vol-abc12-… or just the token"
          className="flex-1 text-xs px-3 py-2 border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600"
        />
        <Button type="submit" size="sm" disabled={!value.trim()}>
          Join Event
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
