import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, Users, Plus, Key, Copy, Check } from 'lucide-react';

export function TeamManagementPage() {
  const { user } = useAuth();
  const events = mockStorage.getPublicEvents();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [teamName, setTeamName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('AI / ML Systems');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const event = mockStorage.getEventById(selectedEventId);
  const allTeams = mockStorage.getTeams(selectedEventId);

  // Find user's existing team in this event
  const myTeam = allTeams.find((t) => t.members?.some((m) => m.id === user?.id));

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg('Please specify a team name');
      return;
    }
    setErrorMsg('');
    try {
      mockStorage.createTeam(selectedEventId, teamName.trim(), selectedTrack);
      setSuccessMsg(`Team "${teamName}" registered successfully!`);
      setTeamName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating team');
    }
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setErrorMsg('Please enter a team join code');
      return;
    }
    setErrorMsg('');
    try {
      mockStorage.joinTeamByCode(selectedEventId, joinCodeInput.trim());
      setSuccessMsg(`Joined team successfully!`);
      setJoinCodeInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Team code invalid or not found');
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <Link to="/participant" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Participant Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Team Formation & Join Codes
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Create a new team, share your invite code with teammates, or join an existing squad.
            </p>
          </div>

          <div className="flex items-center border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs rounded-sm">
            <span className="text-neutral-500 mr-2">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent font-medium text-neutral-900 focus:outline-none cursor-pointer"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-800 rounded-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-sm">
          {successMsg}
        </div>
      )}

      {/* If already has a team */}
      {myTeam ? (
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-6 rounded-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-xs">
                Active Team
              </span>
              <h2 className="text-xl font-bold text-neutral-900 mt-2">
                {myTeam.name}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Table: <strong className="text-neutral-800">{myTeam.table_number || 'Pending'}</strong> • Track: <strong className="text-blue-700">{myTeam.track}</strong>
              </p>
            </div>

            <div className="p-3 border border-blue-200 bg-blue-50/70 flex items-center space-x-3 rounded-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-800">Team Join Code</div>
                <div className="text-lg font-mono font-bold text-blue-900">
                  {myTeam.join_code}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyJoinCode(myTeam.join_code)}
                className="space-x-1"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Team Roster ({myTeam.members?.length || 1})
            </h3>
            <div className="divide-y divide-slate-100">
              {myTeam.members?.map((member) => (
                <div key={member.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-neutral-900">
                      {member.full_name}
                    </span>
                    {member.id === user?.id && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 font-mono rounded-xs">
                        (You)
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">Builder</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link to="/participant">
              <Button size="sm">Proceed to Project Submission →</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team Card */}
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-neutral-900">
                Form a New Team
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Register as team captain and generate a shareable join code for your peers.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              <Input
                label="Team Name"
                placeholder="e.g. NeuralNomads"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />

              <Select
                label="Selected Competition Track"
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
              >
                {event?.tracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>

              <Button type="submit" size="sm" className="w-full">
                Create Team & Get Join Code
              </Button>
            </form>
          </div>

          {/* Join with Code Card */}
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-neutral-900">
                Join an Existing Team
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Have a code from your teammate (e.g. <code>CQ-7701</code> or <code>CQ-8822</code>)? Enter it here.
            </p>

            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
              <Input
                label="Team Join Code"
                placeholder="e.g. CQ-7701"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                required
              />

              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Join Team
              </Button>
            </form>

            <div className="p-3 bg-blue-50/50 border border-blue-100 text-[11px] text-slate-600 rounded-xs">
              <strong>Tip for demo testers:</strong> Try joining existing demo team code: <code className="font-bold text-blue-800">CQ-7701</code> or <code className="font-bold text-blue-800">CQ-8822</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
