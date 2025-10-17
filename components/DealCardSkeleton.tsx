// The "export" keyword is the crucial part
export const DealCardSkeleton = () => (
  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse">
    <div className="flex justify-between items-start">
      <div>
        <div className="h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full w-32 mb-2"></div>
        <div className="h-4 bg-slate-400 dark:bg-slate-600 rounded-full w-24 mb-3"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-28"></div>
    </div>
  </div>
);