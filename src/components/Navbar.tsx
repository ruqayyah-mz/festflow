import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleType } from '@/types';
import { Button } from './ui/Button';
import { Menu, X, RotateCcw, ExternalLink } from 'lucide-react';

export function Navbar() {
  const { user, role, switchUser, availableProfiles, isLiveSupabase, resetData } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Explore Events', path: '/events' },
    ...(role === 'organizer'
      ? [
          { label: 'Organizer Console', path: '/organizer' },
          { label: 'Hackathon Ops', path: '/organizer/hackathon' },
          { label: 'Analytics', path: '/organizer/analytics' },
        ]
      : []),
    ...(role === 'participant'
      ? [
          { label: 'Participant Hub', path: '/participant' },
          { label: 'My Events', path: '/participant/my-events' },
        ]
      : []),
    ...(role === 'volunteer'
      ? [
          { label: 'Volunteer Tasks', path: '/volunteer' },
        ]
      : []),
    ...(role === 'sponsor'
      ? [
          { label: 'Sponsor Portal', path: '/sponsor/dashboard' },
          { label: 'Opportunities', path: '/sponsors' },
        ]
      : []),
  ];

  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as RoleType;
    let targetProfileId = availableProfiles[0].id;
    if (selectedRole === 'volunteer') targetProfileId = availableProfiles[1]?.id || targetProfileId;
    if (selectedRole === 'sponsor') targetProfileId = availableProfiles[2]?.id || targetProfileId;
    if (selectedRole === 'participant') targetProfileId = availableProfiles[3]?.id || targetProfileId;
    switchUser(targetProfileId, selectedRole);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      {/* Top micro status bar in crisp blue & white */}
      <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-1 text-[11px] text-blue-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-blue-700">FestFlow</span>
          <span className="text-blue-300">•</span>
          <span className="text-slate-600 font-medium">Event & Hackathon Operating System</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveSupabase ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
            {isLiveSupabase ? 'Supabase Live' : 'Demo LocalDB Mode'}
          </span>
          <button
            onClick={resetData}
            title="Reset demo data to initial state"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-700 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3 h-3 text-blue-600" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
              FF
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              FestFlow
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                  isActive(link.path)
                    ? 'text-blue-700 bg-blue-50/80 border-blue-600'
                    : 'text-slate-600 hover:text-blue-600 border-transparent hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right actions: Role switcher & Judge Portal Quick Link */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Judge link shortcut */}
          <Link
            to="/judge/cq26-table-14-16"
            className="text-xs text-blue-700 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-50 inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 font-medium transition-colors"
          >
            <span>Judge Portal</span>
            <ExternalLink className="w-3 h-3 text-blue-600" />
          </Link>

          {/* Persona / Role Selector */}
          <div className="flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-blue-600 mr-2 text-[11px] uppercase tracking-wider font-semibold">Role:</span>
            <select
              value={role}
              onChange={handleRoleSelect}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="organizer">Organizer (Alex)</option>
              <option value="volunteer">Volunteer (Sarah)</option>
              <option value="sponsor">Sponsor (Elena)</option>
              <option value="participant">Participant (David)</option>
            </select>
          </div>

          {role === 'organizer' && (
            <Link to="/organizer/events/new">
              <Button size="sm">+ Create Event</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center sm:hidden space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 border border-slate-300 text-slate-700 hover:text-blue-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/judge/cq26-table-14-16"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50/50"
            >
              Judge Marking Demo Portal ↗
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Switch Active Role:</p>
            <select
              value={role}
              onChange={(e) => {
                handleRoleSelect(e);
                setMobileMenuOpen(false);
              }}
              className="w-full p-2 text-sm border border-slate-300 bg-white text-slate-900"
            >
              <option value="organizer">Organizer (Alex Rivera)</option>
              <option value="volunteer">Volunteer (Sarah Chen)</option>
              <option value="sponsor">Sponsor (Elena Rostova)</option>
              <option value="participant">Participant (David Kim)</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
