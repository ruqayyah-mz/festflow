import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleType } from '@/types';

export function LoginPage() {
  const navigate = useNavigate();
  const { switchUser, availableProfiles } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to organizer for custom login, landing on organizer dashboard
    switchUser(availableProfiles[0].id, 'organizer');
    navigate('/organizer');
  };

  const handleQuickLogin = (profileId: string, targetRole: RoleType) => {
    switchUser(profileId, targetRole);
    navigate(`/${targetRole}`);
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

        {/* Quick Demo Persona Switcher */}
        <div className="p-4 bg-blue-50/50 border border-blue-100 space-y-2.5">
          <span className="text-[10px] font-mono uppercase font-semibold text-blue-800">
            Select Role to Enter Dashboard:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin(availableProfiles[0].id, 'organizer')}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Organizer</div>
              <div className="text-[10px] text-blue-600 font-medium">Alex Rivera</div>
            </button>
            <button
              onClick={() => handleQuickLogin(availableProfiles[1].id, 'volunteer')}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Volunteer</div>
              <div className="text-[10px] text-blue-600 font-medium">Sarah Chen</div>
            </button>
            <button
              onClick={() => handleQuickLogin(availableProfiles[2].id, 'sponsor')}
              className="p-2.5 border border-slate-200 bg-white text-left hover:border-blue-500 hover:bg-blue-50/80 transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-semibold text-slate-900">Sponsor</div>
              <div className="text-[10px] text-blue-600 font-medium">Elena Rostova</div>
            </button>
            <button
              onClick={() => handleQuickLogin(availableProfiles[3].id, 'participant')}
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

          <Button type="submit" size="md" className="w-full">
            Sign In to Dashboard
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
