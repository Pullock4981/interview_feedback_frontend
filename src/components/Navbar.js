"use client";
import { useTheme } from "next-themes";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-20 bg-background border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8">
      {/* Breadcrumbs or Page Title could go here */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
        <span className="text-primary dark:text-primary-light">Portal</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Dashboard</span>
      </div>

      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
