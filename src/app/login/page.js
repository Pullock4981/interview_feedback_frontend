"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data.user, data.data.accessToken);
      } else {
        Swal.fire("Error", data.message || "Failed to login", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-primary p-8 flex flex-col items-center justify-center text-white">
          <Image 
            src="/assats/Screenshot%202026-08-08%20235637.png" 
            alt="NexView Logo" 
            width={80} 
            height={80} 
            className="mb-4 object-contain drop-shadow-md rounded-2xl" 
          />
          <h1 className="text-3xl font-bold">NexView</h1>
          <p className="text-white/80 text-sm mt-2">Interview Evaluation System</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="instructor@programming-hero.com"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors flex justify-center items-center"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account? <a href="/register" className="text-primary hover:underline font-medium">Register</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
