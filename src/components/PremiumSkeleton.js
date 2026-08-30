export default function PremiumSkeleton({ type = 'default', rows = 5 }) {
  if (type === 'table') {
    return (
      <div className="w-full mt-4">
        <div className="animate-pulse flex flex-col space-y-4">
          {/* Table Header */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700/50 rounded-lg w-full mb-4" />
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded-md w-1/4" />
              <div className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded-md w-1/4" />
              <div className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded-md w-1/4" />
              <div className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded-md w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-full" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-5/6" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-2/3" />
      </div>
    );
  }

  if (type === 'interview') {
    return (
      <div className="animate-pulse w-full max-w-7xl mx-auto space-y-6 mt-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700/50 rounded-lg w-1/3 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
            <div className="h-48 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700/50 rounded-xl" />
            <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
            <div className="h-96 bg-gray-100 dark:bg-gray-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Default block
  return (
    <div className="animate-pulse mt-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-full mb-3"></div>
      <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded w-5/6 mb-3"></div>
      <div className="h-4 bg-gray-100 dark:bg-gray-800/50 rounded w-4/6"></div>
    </div>
  );
}
