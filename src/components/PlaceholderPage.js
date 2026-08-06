import { Construction } from "lucide-react";

export function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        This section is currently under development. Please check back later.
      </p>
    </div>
  );
}
