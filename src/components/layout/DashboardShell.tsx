import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { RoleType } from '@/types';
import { RotateCcw, ChevronDown, LogOut } from 'lucide-react';

export interface DashboardNavLink {
  label: string;
  path: string;
  exact?: boolean;
}

interface DashboardShellProps {
  children?: React.ReactNode;
  sidebarLinks: DashboardNavLink[];
  currentRole: RoleType;
  topBanner?: React.ReactNode;
}

export function DashboardShell({
  children,
  sidebarLinks,
  currentRole,
  topBanner,
}: DashboardShellProps) {
  const { user, role, switchUser, availableProfiles, availableRoles, resetData, isLiveSupabase, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const events = mockStorage.getEvents();
  const pathParts = location.pathname.split('/');
  const matchedEventId = location.pathname.includes('/events/')
    ? pathParts[pathParts.indexOf('events') + 1]
    : null;
  const currentEvent =
    matchedEventId && matchedEventId !== 'new'
      ? mockStorage.getEventById(matchedEventId)
      : null;
  const displayEvent =
    currentEvent || (currentRole === 'organizer' && location.pathname === '/organizer' ? null : events[0]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as RoleType;
    if (isLiveSupabase) {
      switchUser(user?.id ?? '', newRole); // live: own roles only
      navigate(`/${newRole}`);
      return;
    }
    let targetProfileId = availableProfiles[0].id;
    if (newRole === 'volunteer') targetProfileId = availableProfiles[1]?.id || targetProfileId;
    if (newRole === 'sponsor') targetProfileId = availableProfiles[2]?.id || targetProfileId;
    if (newRole === 'participant') targetProfileId = availableProfiles[3]?.id || targetProfileId;

    switchUser(targetProfileId, newRole);
    navigate(`/${newRole}`);
  };

  const isLinkActive = (path: string, exact?: boolean) => {
    if (exact || path === `/${currentRole}`) {
      return location.pathname === path || location.pathname === `${path}/`;
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-200 bg-white shadow-2xs">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Brand & Active Event Name */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Link to="/" className="flex items-center space-x-2 shrink-0 group">
              <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-2xs">
                FF
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors hidden sm:inline">
                FestFlow
              </span>
            </Link>

            <span className="text-slate-300 hidden sm:inline">•</span>

            {/* Event Name */}
            <div className="truncate">
              {displayEvent ? (
                <>
                  <span className="text-xs text-slate-500 hidden md:inline mr-1.5 font-medium">Event:</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={displayEvent.name}>
                    {displayEvent.name}
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Organizer Console • All Events
                </span>
              )}
            </div>
          </div>

          {/* Right: Role Switcher & Account Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Minimal text-only Role Switcher (no icons) */}
            <div className="flex items-center text-xs">
              <label htmlFor="role-select" className="text-slate-500 mr-1.5 font-medium hidden sm:inline">
                Role:
              </label>
              <select
                id="role-select"
                value={role}
                onChange={handleRoleChange}
                aria-label="Role Switcher"
                className="text-xs border border-slate-300 bg-white px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
              >
                {(['organizer', 'participant', 'volunteer', 'sponsor'] as const)
                  .filter((r) => !isLiveSupabase || availableRoles.includes(r))
                  .map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Account Menu */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1 border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-800 cursor-pointer font-medium transition-colors shadow-2xs"
                aria-label="Account Menu"
              >
                <span className="max-w-[120px] truncate">{user?.full_name || 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-md py-1 z-20 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-blue-600 capitalize font-medium">{role} view</p>
                    </div>

                    <button
                      onClick={() => {
                        resetData();
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>{isLiveSupabase ? 'Refresh Data' : 'Reset Demo Data'}</span>
                    </button>

                    {isLiveSupabase && (
                      <button
                        onClick={async () => {
                          setAccountMenuOpen(false);
                          await signOut();
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50 flex items-center space-x-2 cursor-pointer border-t border-slate-100"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    )}

                    <Link
                      to="/judge/cq26-table-14-16"
                      target="_blank"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3 py-2 text-blue-700 hover:bg-blue-50 font-medium border-t border-slate-100"
                    >
                      Judge Portal ↗
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Public Landing
                    </Link>

                    <Link
                      to="/login"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-3 py-2 text-red-600 hover:bg-red-50 border-t border-slate-100"
                    >
                      Sign Out
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Persistent Top Banner if passed (e.g. participant countdown & status) */}
      {topBanner}

      {/* Main Layout Body */}
      <div className="flex-1 flex min-w-0">
        {/* Desktop Left Sidebar: 4 to 6 text links max */}
        <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {currentRole} Dashboard
            </span>
          </div>

          <nav className="flex-1 py-2 space-y-0.5">
            {sidebarLinks.map((link) => {
              const active = isLinkActive(link.path, link.exact);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.exact}
                  className={`block px-4 py-2.5 text-xs transition-colors border-l-2 ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400">
            FestFlow Minimalist Shell
          </div>
        </aside>

        {/* Center Main Area */}
        <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto pb-20 md:pb-8 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1 flex items-center overflow-x-auto shadow-lg">
        {sidebarLinks.map((link) => {
          const active = isLinkActive(link.path, link.exact);
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={`min-w-[68px] shrink-0 text-center py-2 px-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'text-blue-700 font-bold bg-blue-50/80 border-t-2 border-blue-600 -mt-1'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="block truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

