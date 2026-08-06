"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  PieChart,
  Edit3
} from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const role = user?.role || "instructor";

  return (
    <div className="space-y-6">
      {role === "manager" ? <ManagerDashboard /> : <InstructorDashboard />}
    </div>
  );
}

// ==========================================
// MANAGER DASHBOARD
// ==========================================
function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [techData, setTechData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [mgrRes, techRes, actRes] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/v1/dashboard/manager"),
        fetchWithAuth("http://localhost:5000/api/v1/dashboard/technology-performance"),
        fetchWithAuth("http://localhost:5000/api/v1/dashboard/instructor-activity")
      ]);
      const mgrJson = await mgrRes.json();
      const techJson = await techRes.json();
      const actJson = await actRes.json();

      if (mgrJson.success) setData(mgrJson.data);
      if (techJson.success) setTechData(techJson.data);
      if (actJson.success) setActivityData(actJson.data);
    } catch (err) {
      console.error("Error fetching manager dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading manager dashboard...</div>;
  }

  const statusDist = data?.statusDistribution || {};
  const recs = data?.recommendationBreakdown || { "Strong Hire": 0, "Hire": 0, "Maybe": 0, "Reject": 0 };
  
  // Calculations for UI
  const pendingCount = statusDist['Pending'] || 0;
  const assignedCount = statusDist['Assigned'] || 0;
  const draftCount = statusDist['Draft Saved'] || 0;
  const completedCount = statusDist['Completed'] || 0;
  const totalStudents = pendingCount + assignedCount + draftCount + completedCount;

  const getPercent = (count) => totalStudents === 0 ? 0 : Math.round((count / totalStudents) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldIcon />
            <span>Manager Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track interview volumes, status distribution, and recommendations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={fetchDashboardData} className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Interviews" value={data?.totalInterviews || 0} subtitle="All recorded interviews" icon={<ClipboardList className="w-6 h-6 text-purple-500" />} iconBg="bg-purple-100 dark:bg-purple-500/20" />
        <StatCard title="Total Students" value={totalStudents} subtitle="In the system" icon={<Users className="w-6 h-6 text-blue-500" />} iconBg="bg-blue-100 dark:bg-blue-500/20" />
        <StatCard title="Completed" value={completedCount} subtitle="Final feedback submitted" icon={<CheckCircle className="w-6 h-6 text-green-500" />} iconBg="bg-green-100 dark:bg-green-500/20" />
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-sm uppercase tracking-wider opacity-90">Pending Assignment</span>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-bold">{pendingCount}</h3>
            <p className="text-sm opacity-90 mt-1">Students awaiting instructors</p>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommendation Breakdown</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Global distribution across all instructors.</p>
            </div>
            <span className="px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 font-semibold text-xs rounded-full border border-green-200 dark:border-green-500/20">
              • LIVE DATA
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat title="Strong Hire" value={recs["Strong Hire"] || 0} icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
            <MiniStat title="Hire" value={recs["Hire"] || 0} icon={<UserCheck className="w-5 h-5 text-blue-500" />} />
            <MiniStat title="Maybe" value={recs["Maybe"] || 0} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} />
            <MiniStat title="Reject" value={recs["Reject"] || 0} icon={<Clock className="w-5 h-5 text-red-500" />} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 text-purple-600 flex items-center justify-center rounded-full">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Status Distribution</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide">All Students</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4 justify-center">
            <ProgressBar label="Completed" percent={getPercent(completedCount)} color="bg-green-500" />
            <ProgressBar label="Draft Saved" percent={getPercent(draftCount)} color="bg-orange-500" />
            <ProgressBar label="Assigned" percent={getPercent(assignedCount)} color="bg-blue-500" />
            <ProgressBar label="Pending" percent={getPercent(pendingCount)} color="bg-red-500" />
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instructor Activity Leaderboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Interviews conducted per instructor.</p>
            </div>
          </div>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {activityData.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              activityData.map((act) => (
                <ActivityRow 
                  key={act.instructorId} 
                  avatar={act.name?.charAt(0) || "U"} 
                  name={act.name} 
                  action={`conducted ${act.completedCount} interviews`} 
                  date={`Avg draft time: ${act.avgDraftToFinalHours} hrs`} 
                  badge={`${act.completedCount} Done`} 
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Top Technologies</h2>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {techData.length === 0 ? (
              <p className="text-sm text-gray-500">No technology data yet.</p>
            ) : (
              techData.map((tech) => (
                <QuickActionCard 
                  key={tech.technology}
                  title={tech.technology} 
                  subtitle={`Pass Rate: ${tech.passRatePercent}%`} 
                  icon={<ClipboardList className="w-5 h-5" />} 
                  bg={tech.passRatePercent >= 75 ? "bg-green-100 text-green-600 dark:bg-green-500/20" : tech.passRatePercent >= 50 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20" : "bg-red-100 text-red-600 dark:bg-red-500/20"} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INSTRUCTOR DASHBOARD
// ==========================================
function InstructorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:5000/api/v1/dashboard/instructor");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;
  }

  const recs = data?.recommendationBreakdown || { "Strong Hire": 0, "Hire": 0, "Maybe": 0, "Reject": 0 };
  const recent = data?.recentActivity || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Instructor Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            My Workload
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your assigned students and drafts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push('/dashboard/interviews')} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md transition-all cursor-pointer">
            Start Interview
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="My Pending" 
          value={data?.pendingInterviews || 0} 
          subtitle="Students awaiting interview" 
          icon={<Clock className="w-6 h-6 text-orange-500" />} 
          iconBg="bg-orange-100 dark:bg-orange-500/20" 
          onClick={() => router.push('/dashboard/interviews')}
        />
        <StatCard 
          title="My Drafts" 
          value={data?.myDrafts || 0} 
          subtitle="Feedback needing completion" 
          icon={<Edit3 className="w-6 h-6 text-purple-500" />} 
          iconBg="bg-purple-100 dark:bg-purple-500/20" 
          onClick={() => router.push('/dashboard/interviews')}
        />
        <StatCard 
          title="Completed This Week" 
          value={data?.completedThisWeek || 0} 
          subtitle="Finalized by me" 
          icon={<CheckCircle className="w-6 h-6 text-green-500" />} 
          iconBg="bg-green-100 dark:bg-green-500/20" 
          onClick={() => router.push('/dashboard/students')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendation Breakdown (Mine) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">My Recommendations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your historical recommendation distribution.</p>
          <div className="grid grid-cols-2 gap-4">
            <MiniStat title="Strong Hire" value={recs["Strong Hire"] || 0} icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
            <MiniStat title="Hire" value={recs["Hire"] || 0} icon={<UserCheck className="w-5 h-5 text-blue-500" />} />
            <MiniStat title="Maybe" value={recs["Maybe"] || 0} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} />
            <MiniStat title="Reject" value={recs["Reject"] || 0} icon={<Clock className="w-5 h-5 text-red-500" />} />
          </div>
        </div>

        {/* Drafts Needing Attention */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Recent Activity</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pick up where you left off or review recent work.</p>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {recent.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            ) : (
              recent.map((activity) => (
                <ActivityRow 
                  key={activity._id}
                  avatar={activity.student?.name?.charAt(0) || "S"} 
                  name={activity.student?.name || "Unknown"} 
                  action={`- ${activity.status}`} 
                  date={new Date(activity.updatedAt).toLocaleDateString()} 
                  badge={activity.status === 'Draft Saved' ? 'Edit' : 'View'} 
                  onClick={() => router.push(`/dashboard/interviews/${activity._id}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// REUSABLE SUBCOMPONENTS
// ==========================================
function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
    </svg>
  );
}

function StatCard({ title, value, subtitle, icon, iconBg, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border h-40 flex flex-col justify-between transition-all ${
        onClick 
          ? 'cursor-pointer border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md hover:-translate-y-1' 
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function MiniStat({ title, value, icon }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 border border-gray-100 dark:border-gray-800">
      {icon}
      <h4 className="font-bold text-xl text-gray-900 dark:text-white">{value}</h4>
      <p className="text-xs font-semibold text-gray-500 uppercase">{title}</p>
    </div>
  );
}

function ProgressBar({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500">{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function ActivityRow({ avatar, name, action, date, badge, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center">
          {avatar}
        </div>
        <div>
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="font-bold">{name}</span> {action}
          </p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <div className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 text-xs font-bold rounded-md transition-colors">
        {badge}
      </div>
    </div>
  );
}

function QuickActionCard({ title, subtitle, icon, bg }) {
  return (
    <div className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
          {icon}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h4>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
