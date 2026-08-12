"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  FolderOpen,
  ClipboardList,
  Cpu,
  Trophy,
  LogOut,
  User,
  Users,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  let navItems = [];
  if (user?.role === "manager") {
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Manage Instructors", href: "/dashboard/users", icon: Shield },
    ];
  } else {
    navItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Students", href: "/dashboard/students", icon: Users },
      { name: "Interviews", href: "/dashboard/interviews", icon: ClipboardList },
      { name: "Question Bank", href: "/dashboard/question-bank", icon: BookOpen },
      { name: "Status", href: "/dashboard/status", icon: CheckCircle },
    ];
  }

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col h-full transition-colors duration-300">
      {/* Logo Area */}
      <div className="py-6 flex flex-col items-center justify-center border-b border-white/10">
        <Image 
          src="/assats/Screenshot%202026-08-08%20235637.png" 
          alt="NexView Logo" 
          width={64} 
          height={64} 
          className="mb-3 object-contain drop-shadow-md rounded-xl" 
        />
        <span className="text-xl font-bold tracking-wide">NexView</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard'
            : (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-white text-primary font-semibold shadow-md"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-white/70"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex flex-col items-center justify-center space-y-2 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="text-white w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{user?.name || "User"}</p>
            <p className="text-xs text-white/60 capitalize">{user?.role || "Role"}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center justify-center space-x-2 w-full py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
