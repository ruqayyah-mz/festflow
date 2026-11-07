import React, { useState, useEffect } from 'react';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CameraQRScanner } from './CameraQRScanner';
import {
  QrCode,
  CheckCircle2,
  X,
  Search,
  Camera,
  UserCheck,
  Check,
} from 'lucide-react';

export interface AttendanceCandidate {
  id: string;
  name: string;
  detail?: string;
  tokenOrCode?: string;
  isAttended?: boolean;
}

export interface QRAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  targetType: 'volunteer' | 'participant' | 'team';
  candidates: AttendanceCandidate[];
  onAttendanceMarked?: (candidateName: string) => void;
}

function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5 note
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Audio synthesis not permitted or unsupported in background
  }
}

export function QRAttendanceModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  targetType,
  candidates,
  onAttendanceMarked,
}: QRAttendanceModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'lookup' | 'code'>('camera');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    id: string;
    name: string;
    detail?: string;
    timestamp: string;
  } | null>(null);
  const [scanMiss, setScanMiss] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLastScanned(null);
      setSearchQuery('');
      setManualCode('');
      setScanMiss(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMark = (candidate: AttendanceCandidate) => {
    const currentUser = mockStorage.getCurrentUser();
    mockStorage.markAttendance({
      event_id: eventId,
      target_id: candidate.id,
      target_type: targetType,
      target_name: candidate.name,
      detail: candidate.detail,
      marked_by: currentUser.full_name,
    });

    playBeepSound();
    const record = {
      id: candidate.id,
      name: candidate.name,
      detail: candidate.detail,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLastScanned(record);

    if (onAttendanceMarked) {
      onAttendanceMarked(candidate.name);
    }
  };

  // Camera scans must match exactly — no fuzzy name matching like the manual box.
  const handleScan = (text: string) => {
    const code = text.trim().toLowerCase();
    const matched = candidates.find(
      (c) => c.id.toLowerCase() === code || c.tokenOrCode?.toLowerCase() === code
    );
    if (matched) {
      setScanMiss(null);
      handleMark(matched);
    } else {
      setScanMiss(text.slice(0, 60));
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toLowerCase();
    if (!code) return;

    const matched = candidates.find(
      (c) =>
        c.id.toLowerCase() === code ||
        (c.tokenOrCode && c.tokenOrCode.toLowerCase() === code) ||
        c.name.toLowerCase().includes(code)
    );

    if (matched) {
      handleMark(matched);
      setManualCode('');
    } else {
      alert(`No matching ${targetType} badge or QR token found for "${manualCode}".`);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.detail && c.detail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tokenOrCode && c.tokenOrCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const targetLabel =
    targetType === 'volunteer'
      ? 'Volunteer'
      : targetType === 'team'
      ? 'Team'
      : 'Participant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xs bg-blue-600 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Scan QR Code • Check-in & Attendance
              </h3>
              <p className="text-[11px] text-slate-500">
                {eventName} • <span className="font-semibold text-slate-700 capitalize">{targetLabel} Attendance</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner when scanned */}
        {lastScanned && (
          <div className="p-4 bg-emerald-500 text-white flex items-center justify-between transition-all">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase opacity-90">
                  Attendance Verified ✓
                </div>
                <div className="text-sm font-bold">{lastScanned.name}</div>
                {lastScanned.detail && (
                  <div className="text-xs opacity-90">{lastScanned.detail}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono opacity-80 block">CHECK-IN TIME</span>
              <span className="text-xs font-mono font-bold">{lastScanned.timestamp}</span>
            </div>
          </div>
        )}

        {/* Scanner Mode Tabs */}
        <div className="border-b border-slate-200 bg-white px-5 flex space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-3 border-b-2 inline-flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`py-3 border-b-2 inline-flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'lookup'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Roster Check-in ({candidates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 border-b-2 inline-flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'code'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Enter QR / Token</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'camera' && (
            <div className="space-y-3 text-center">
              <CameraQRScanner onDecode={handleScan} />
              {scanMiss && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2" role="alert">
                  QR code not recognised for this event: <span className="font-mono">{scanMiss}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Volunteers find their QR under My Events → event → My Profile.
              </p>
            </div>
          )}

          {activeTab === 'lookup' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder={`Search ${targetLabel.toLowerCase()} by name, code or table...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No matching {targetLabel.toLowerCase()} found.
                  </div>
                ) : (
                  filteredCandidates.map((c) => {
                    const attended = c.isAttended || (lastScanned && lastScanned.id === c.id);
                    return (
                      <div
                        key={c.id}
                        className={`p-3 border flex items-center justify-between text-xs transition-colors ${
                          attended
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {c.detail && <span>{c.detail}</span>}
                            {c.tokenOrCode && (
                              <span className="font-mono text-[10px] px-1 bg-slate-100 border border-slate-200">
                                {c.tokenOrCode}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {attended ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMark(c)}
                              className="text-xs space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mark Attendance</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Manually type or paste the QR hash, badge token, or team join code from the physical badge:
              </p>

              <div className="space-y-2">
                <Input
                  placeholder="e.g. vol-cq26-lead, CQ-7701, usr-volunteer-01..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="font-mono text-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button type="submit" variant="primary" size="sm" className="space-x-1.5 text-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify & Mark Present</span>
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 font-mono">
            {candidates.filter((c) => c.isAttended).length} / {candidates.length} Checked In
          </div>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
