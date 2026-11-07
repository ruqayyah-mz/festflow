import { Button } from './ui/Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ message, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`border border-dashed border-blue-200 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-2xs ${className}`}
    >
      <p className="text-sm text-slate-600 font-normal">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="shrink-0 font-medium">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
