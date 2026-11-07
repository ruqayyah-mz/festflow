import { useState } from 'react';
import { Submission } from '@/types';
import { FolderGit2, Globe, MonitorPlay, X } from 'lucide-react';

// Read-only view of a project submission, shared by the judge portal and organizer pages.
export function SubmissionShowcase({ submission, compact = false }: { submission: Submission; compact?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const images = submission.images ?? [];
  const links = [
    { url: submission.repo_url, label: 'Repository', icon: FolderGit2 },
    { url: submission.demo_url, label: 'Live Website', icon: Globe },
    { url: submission.youtube_url, label: 'Demo Video', icon: MonitorPlay },
  ].filter((l) => l.url);

  return (
    <div className="space-y-2.5 text-xs">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPreview(src)}
              className="shrink-0 border border-slate-200 hover:border-blue-400 cursor-zoom-in"
              aria-label={`View screenshot ${i + 1} of ${submission.title}`}
            >
              <img src={src} alt="" className={`${compact ? 'h-14' : 'h-24'} w-auto object-cover`} />
            </button>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map(({ url, label, icon: Icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 bg-white text-blue-700 hover:border-blue-400 font-medium"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          ))}
        </div>
      )}

      {!!(submission.tags?.length || submission.technologies?.length) && (
        <div className="flex flex-wrap gap-1.5">
          {submission.tags?.map((t) => (
            <span key={`tag-${t}`} className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
              {t}
            </span>
          ))}
          {submission.technologies?.map((t) => (
            <span key={`tech-${t}`} className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
              {t}
            </span>
          ))}
        </div>
      )}

      {!compact && submission.additional_info && (
        <p className="text-slate-600 whitespace-pre-line">
          <span className="font-semibold text-slate-700">Additional info: </span>
          {submission.additional_info}
        </p>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-label="Screenshot preview"
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
            className="absolute top-4 right-4 text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={preview} alt={`Screenshot of ${submission.title}`} className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  );
}
