import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Invite, Team, Role, SponsorshipApplication } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { Copy, Check, Plus, ExternalLink } from 'lucide-react';

export function OrganizerPeoplePage() {
  const events = mockStorage.getEvents();
  const activeEvent = events[0];

  const [activeTab, setActiveTab] = useState<'volunteers' | 'sponsors' | 'participants'>('volunteers');
  const [invites, setInvites] = useState<Invite[]>(() =>
    activeEvent ? mockStorage.getInvites(activeEvent.id) : []
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    activeEvent ? mockStorage.getTeams(activeEvent.id) : []
  );
  const [roles, setRoles] = useState<Role[]>(() =>
    activeEvent ? mockStorage.getRoles(activeEvent.id) : []
  );
  const [sponsorApps, setSponsorApps] = useState<SponsorshipApplication[]>(() =>
    activeEvent ? mockStorage.getSponsorshipApplications(activeEvent.id) : []
  );

  // Invite creator state
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteRoleType, setInviteRoleType] = useState<'volunteer' | 'participant' | 'sponsor'>('volunteer');
  const [inviteRoleTitle, setInviteRoleTitle] = useState('Hacker Check-in & Badge Desk');
  const [inviteeName, setInviteeName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [recentlyGeneratedUrl, setRecentlyGeneratedUrl] = useState<string | null>(null);
  const [editingTableTeamId, setEditingTableTeamId] = useState<string | null>(null);
  const [editingTableValue, setEditingTableValue] = useState<string>('');

  const refresh = () => {
    if (!activeEvent) return;
    setInvites(mockStorage.getInvites(activeEvent.id));
    setTeams(mockStorage.getTeams(activeEvent.id));
    setRoles(mockStorage.getRoles(activeEvent.id));
    setSponsorApps(mockStorage.getSponsorshipApplications(activeEvent.id));
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [activeEvent?.id]);

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    const token = `${inviteRoleType}-${Math.random().toString(36).substring(2, 7)}-${activeEvent.id.substring(4, 8)}`;
    const newInvite = mockStorage.createInvite({
      event_id: activeEvent.id,
      role_type: inviteRoleType,
      role_title: inviteRoleTitle.trim() || undefined,
      volunteer_name: inviteeName.trim() || undefined,
      token,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    });

    const fullUrl = `${window.location.origin}/invite/${newInvite.token}`;
    setRecentlyGeneratedUrl(fullUrl);
    setInviteeName('');
    setIsCreatingInvite(false);
  };

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!activeEvent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">People Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage volunteers, sponsors, and hackathon teams.</p>
        </div>
        <EmptyState
          message="No active events found. Create an event to begin inviting team members."
          actionLabel="Create Event"
          onAction={() => {
            window.location.href = '/organizer/events/new';
          }}
        />
      </div>
    );
  }

  const volunteerRoles = roles.filter((r) => r.role_type === 'volunteer');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            People & Invite Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Volunteers, sponsors, and participants for <strong className="text-slate-800">{activeEvent.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to={`/organizer/events/${activeEvent.id}?tab=people&subtab=participants`}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xs"
          >
            <span>Open in Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Button
            size="sm"
            onClick={() => setIsCreatingInvite(!isCreatingInvite)}
            className="space-x-1.5 font-medium shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreatingInvite ? 'Close Form' : 'Generate Invite Link'}</span>
          </Button>
        </div>
      </div>

      {recentlyGeneratedUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Invite Link Created:</span>
            <button
              onClick={() => setRecentlyGeneratedUrl(null)}
              className="text-xs text-emerald-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={recentlyGeneratedUrl}
              className="w-full text-xs font-mono bg-white border border-emerald-300 p-2 text-slate-800"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(recentlyGeneratedUrl);
                alert('Copied invite link to clipboard!');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Invite Link Generator Modal/Box */}
      {isCreatingInvite && (
        <form onSubmit={handleCreateInvite} className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Create Onboarding Invite Link
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Role Type"
              value={inviteRoleType}
              onChange={(e) => setInviteRoleType(e.target.value as any)}
            >
              <option value="volunteer">Volunteer Staff</option>
              <option value="participant">Participant / Hacker</option>
              <option value="sponsor">Sponsor Partner</option>
            </Select>

            <Input
              label="Duty Title / Tier"
              placeholder="e.g. Swag Desk Lead or Platinum Partner"
              value={inviteRoleTitle}
              onChange={(e) => setInviteRoleTitle(e.target.value)}
            />

            <Input
              label="Recipient Name (Optional)"
              placeholder="e.g. Sarah Chen"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingInvite(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Generate Invite Link
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'volunteers'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Volunteers ({volunteerRoles.length})
        </button>

        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sponsors'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Sponsors ({sponsorApps.length})
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'participants'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Participants ({teams.length} Teams)
        </button>
      </div>

      {/* Tab 1: Volunteers */}
      {activeTab === 'volunteers' && (
        <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assigned Volunteer Staff
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {volunteerRoles.length} active roles
            </span>
          </div>

          {volunteerRoles.length === 0 ? (
            <EmptyState
              message="No volunteers assigned yet for this event."
              actionLabel="Generate Volunteer Invite"
              onAction={() => {
                setInviteRoleType('volunteer');
                setIsCreatingInvite(true);
              }}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {volunteerRoles.map((vr) => (
                <div key={vr.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Volunteer User ({vr.user_id})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Assigned Role: <span className="text-blue-700 font-medium">{vr.role_title || 'General Operations'}</span>
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Registered {formatDate(vr.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sponsors */}
      {activeTab === 'sponsors' && (
        <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Sponsor Partners & Applications
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {sponsorApps.length} partners
            </span>
          </div>

          {sponsorApps.length === 0 ? (
            <EmptyState
              message="No sponsorship applications received yet for this event."
              actionLabel="Create Sponsor Invite"
              onAction={() => {
                setInviteRoleType('sponsor');
                setIsCreatingInvite(true);
              }}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {sponsorApps.map((sa) => (
                <div key={sa.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-slate-900">{sa.sponsor_name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 border border-slate-200 bg-slate-50 text-slate-700">
                        {sa.form_data.tier}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 uppercase font-bold border ${
                        sa.status === 'confirmed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                      }`}>
                        {sa.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Contact: {sa.form_data.contact_email} • {sa.form_data.perks_offered}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {formatDate(sa.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Participants */}
      {activeTab === 'participants' && (
        <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Participant Teams ({teams.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Hacker Teams & Roster
            </span>
          </div>

          {teams.length === 0 ? (
            <EmptyState
              message="No participant teams registered yet for this event."
              actionLabel="Create Participant Invite"
              onAction={() => {
                setInviteRoleType('participant');
                setIsCreatingInvite(true);
              }}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {teams.map((t) => (
                <div key={t.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-bold text-slate-900">{t.name}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200">
                          Join Code: {t.join_code}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                          {t.track || 'General'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Members ({t.members?.length || 1}): {t.members?.map((m) => m.full_name).join(', ') || 'Solo Hacker'}
                      </p>
                    </div>

                    {/* Table Assignment Feature */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {editingTableTeamId === t.id ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={editingTableValue}
                            placeholder="e.g. Table 14"
                            onChange={(e) => setEditingTableValue(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-blue-600"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                mockStorage.updateTeamTable(t.id, editingTableValue);
                                setEditingTableTeamId(null);
                              }
                              if (e.key === 'Escape') setEditingTableTeamId(null);
                            }}
                          />
                          <button
                            onClick={() => {
                              mockStorage.updateTeamTable(t.id, editingTableValue);
                              setEditingTableTeamId(null);
                            }}
                            className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-xs cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTableTeamId(null)}
                            className="px-1 text-xs text-slate-500 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 font-bold border ${
                              t.table_number
                                ? 'border-blue-200 bg-blue-50 text-blue-800'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {t.table_number || 'Unassigned'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTableTeamId(t.id);
                              setEditingTableValue(t.table_number || '');
                            }}
                            className="text-xs text-blue-600 hover:underline cursor-pointer"
                          >
                            {t.table_number ? 'Edit Table' : 'Assign Table'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission summary if any */}
                  {t.submission ? (
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xs text-[11px] flex items-center justify-between">
                      <span className="text-slate-700">
                        Project: <strong>{t.submission.title}</strong>
                      </span>
                      <span className="text-emerald-700 font-mono font-semibold">
                        ✓ {t.submission.status}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No project submission yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Invite Links list */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Issued Invite Links ({invites.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Role tokens with automatic access
          </span>
        </div>

        {invites.length === 0 ? (
          <EmptyState
            message="No active invite links generated yet."
            actionLabel="Generate Invite Link"
            onAction={() => setIsCreatingInvite(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {invites.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold">
                      {inv.role_type}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {inv.role_title || 'Member'}
                    </span>
                    {inv.volunteer_name && (
                      <span className="text-xs text-slate-500">
                        ({inv.volunteer_name})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Expires {formatDate(inv.expires_at)}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(inv.token)}
                  className="px-2.5 py-1 border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 font-medium inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedToken === inv.token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
