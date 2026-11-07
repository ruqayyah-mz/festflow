import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-slate-200 rounded-none', className)}
      {...props}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="p-6 border border-slate-200 bg-white space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-4 border-t border-slate-100 flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3 px-4 border-b border-slate-200">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/6" />
    </div>
  );
}
