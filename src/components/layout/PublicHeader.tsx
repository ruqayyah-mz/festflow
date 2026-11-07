import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';

export function PublicHeader() {
  const { resetData, isLiveSupabase } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xs">
      {/* Top micro status bar */}
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
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-2xs">
              FF
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              FestFlow
            </span>
          </Link>

          <nav className="hidden sm:flex items-center space-x-2">
            <Link
              to="/events"
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Public Directory
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/login">
            <Button size="sm" className="font-medium">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

