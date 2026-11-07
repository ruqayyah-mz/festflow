import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleType } from '@/types';

export function LoginPage() {
  const navigate = useNavigate();
  const { switchUser, availableProfiles, isLiveSupabase, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLiveSupabase) {
      // Demo mode: default to organizer for custom login, landing on organizer dashboard
      switchUser(availableProfiles[0].id, 'organizer');
      navigate('/organizer');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const role = await signIn(email, password);
      navigate(`/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  // Live mode: the buttons sign into the seeded demo accounts (supabase/seed.sql, password is public there).
  const handleQuickLogin = async (profileIndex: number, targetRole: RoleType) => {
    if (!isLiveSupabase) {
      switchUser(availableProfiles[profileIndex].id, targetRole);
      navigate(`/${targetRole}`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      navigate(`/${await signIn(`${targetRole}@festflow.dev`, 'festflow-demo', targetRole)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-slate-200 bg-white shadow-xs p-8 space-y-6">
        <div className="space-y-1 text-center">
          <div className="w-9 h-9 bg-blue-600 text-white font-bold mx-auto flex items-center justify-center text-sm shadow-xs">
            FF
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 pt-2">
            Sign In to FestFlow
          </h1>
          <p className="text-xs text-slate-500">
            Event & Hackathon Operating System
          </p>
        </div>

        {/* Quick demo logins: mock personas, or the seeded demo accounts in live mode */}
        <>
        <div className="p-4 bg-blue-50/50 border border-blue-100 space-y-2.5">
          <span className="text-[10px] font-mono uppercase font-semibold text-blue-800">
            Select Role to Enter Dashboard:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin(0, 'organizer')}
              disabled={busy}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Organizer</div>
              <div className="text-[10px] text-blue-600 font-medium">Alex Rivera</div>
            </button>
            <button
              onClick={() => handleQuickLogin(1, 'volunteer')}
              disabled={busy}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Volunteer</div>
              <div className="text-[10px] text-blue-600 font-medium">Sarah Chen</div>
            </button>
            <button
              onClick={() => handleQuickLogin(2, 'sponsor')}
              disabled={busy}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Sponsor</div>
              <div className="text-[10px] text-blue-600 font-medium">Elena Rostova</div>
            </button>
            <button
              onClick={() => handleQuickLogin(3, 'participant')}
              disabled={busy}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Participant</div>
              <div className="text-[10px] text-blue-600 font-medium">David Kim</div>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase text-slate-400 font-mono">Or email sign in</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>
        </>

        <form onSubmit={handleCustomLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="organizer@festflow.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-2.5 text-xs bg-red-50 border border-red-200 text-red-700" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" size="md" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In to Dashboard'}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Judging a hackathon?{' '}
          <Link to="/judge/cq26-table-14-16" className="font-semibold text-blue-600 hover:text-blue-700 underline">
            Open Judge Link (No login required)
          </Link>
        </div>
      </div>
    </div>
  );
}
