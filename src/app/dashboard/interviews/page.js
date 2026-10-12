"use client";
import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle2, ClipboardList, Users, Clock, ArrowRight, Play, Edit3 } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { fetchWithAuth } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function InterviewsList() {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('remaining'); // 'remaining' | 'completed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews?pageSize=1000`);
        const data = await res.json();
        if (data.success) {
          setInterviews(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch interviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleStartInterview = async (studentId, existingInterviewId, status) => {
    if (status === 'Interview Started' || status === 'Draft Saved') {
      return router.push(`/dashboard/interviews/${existingInterviewId}`);
    }

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/${studentId}/start`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        const interviewId = data.data.interview._id;
        router.push(`/dashboard/interviews/${interviewId}`);
      } else {
        Swal.fire('Error', data.message || 'Failed to start interview', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  };

  const uniqueCourses = [...new Set(interviews.map(i => i.student?.course || i.course).filter(Boolean))];

  const completedInterviews = interviews.filter(i => i.status === 'Completed');
  const remainingInterviews = interviews.filter(i => i.status !== 'Completed');

  const filterList = (list) => {
    return list.filter(i => {
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (i.student?.name || '').toLowerCase();
        const email = (i.student?.email || '').toLowerCase();
        const phone = (i.student?.phone || '').toLowerCase();
        const courseStr = (i.student?.course || i.course || '').toLowerCase();
        const slot = (i.student?.slot || i.batch || i.student?.batch || '').toLowerCase();
        matchesSearch = name.includes(q) || email.includes(q) || phone.includes(q) || courseStr.includes(q) || slot.includes(q);
      }

      let matchesCourse = true;
      if (filterCourse !== 'all') {
        const c = i.student?.course || i.course;
        matchesCourse = c === filterCourse;
      }

      return matchesSearch && matchesCourse;
    });
  };

  const filteredRemaining = filterList(remainingInterviews);
  const filteredCompleted = filterList(completedInterviews);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            <span>Interviews</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track remaining interviews and review completed interview feedback in 2 dedicated sections.
          </p>
        </div>
      </div>

      {/* Stats Cards with Click to Filter */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setActiveTab('remaining')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'remaining' 
                ? 'border-amber-500 ring-2 ring-amber-500/25 shadow-md transform scale-[1.01]' 
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Remaining (বাকি)</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">
                {remainingInterviews.length}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Awaiting interview completion</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('completed')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'completed' 
                ? 'border-green-500 ring-2 ring-green-500/25 shadow-md transform scale-[1.01]' 
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Completed (হয়ে গেছে)</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">
                {completedInterviews.length}
              </h3>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">Evaluations finalized</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('all')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${
              activeTab === 'all' 
                ? 'border-primary ring-2 ring-primary/25 shadow-md transform scale-[1.01]' 
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Students (সর্বমোট)</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">{interviews.length}</h3>
              <p className="text-xs text-primary font-medium mt-1">View both parts together</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-primary rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar & Filters */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Segmented Part Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('remaining')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'remaining'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Part 1: Remaining ({remainingInterviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Part 2: Completed ({completedInterviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>View Both Parts</span>
          </button>
        </div>

        {/* Search and Course Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by student, email, slot..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block shrink-0" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3.5 py-2 w-full sm:w-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PART 1: REMAINING INTERVIEWS (বাকি থাকা ইন্টারভিউ) */}
      {/* ========================================================= */}
      {(activeTab === 'remaining' || activeTab === 'all') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Section Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-950/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Part 1: Remaining Interviews (বাকি থাকা ইন্টারভিউ)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {filteredRemaining.length} remaining
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Students awaiting evaluation. Click &quot;Start Interview&quot; or &quot;Continue Interview&quot; to begin.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course / Programme</th>
                  <th className="px-6 py-4">Batch / Slot</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 sticky right-0 bg-gray-50 dark:bg-gray-900/50 z-10 border-l dark:border-gray-700 shadow-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading remaining interviews...</td></tr>
                ) : filteredRemaining.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">No remaining interviews found matching criteria.</td></tr>
                ) : (
                  filteredRemaining.map((intv) => (
                    <tr key={intv._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900 dark:text-white">{intv.student?.name}</span>
                          <span className="text-xs text-gray-500 font-normal">{intv.student?.email}</span>
                          {intv.student?.phone && intv.student.phone !== 'N/A' && (
                            <span className="text-[11px] text-gray-400 font-normal">{intv.student.phone}</span>
                          )}
                          {intv.student?.metadata && Object.keys(intv.student.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(intv.student.metadata).map(([k, v]) => (
                                <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {intv.student?.course || intv.course || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                        {intv.student?.slot || intv.batch || intv.student?.batch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                          intv.status === 'Interview Started' || intv.status === 'Draft Saved'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            intv.status === 'Interview Started' || intv.status === 'Draft Saved' ? 'bg-blue-600' : 'bg-amber-600'
                          }`} />
                          {intv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-700 shadow-sm text-right">
                        <button 
                          onClick={() => handleStartInterview(intv.student._id, intv._id, intv.status)}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          {intv.status === 'Assigned' ? 'Start Interview' : 'Continue Interview'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PART 2: COMPLETED INTERVIEWS (সম্পন্ন হওয়া ইন্টারভিউ) */}
      {/* ========================================================= */}
      {(activeTab === 'completed' || activeTab === 'all') && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Section Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-green-50/50 dark:bg-green-950/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Part 2: Completed Interviews (সম্পন্ন হওয়া ইন্টারভিউ)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  {filteredCompleted.length} completed
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Final evaluations submitted. View comprehensive feedback summary, question breakdown, and recommendations.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course / Programme</th>
                  <th className="px-6 py-4">Recommendation</th>
                  <th className="px-6 py-4 min-w-[320px]">Detailed Evaluation Summary</th>
                  <th className="px-6 py-4 sticky right-0 bg-gray-50 dark:bg-gray-900/50 z-10 border-l dark:border-gray-700 shadow-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading completed interviews...</td></tr>
                ) : filteredCompleted.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">No completed interviews found matching criteria.</td></tr>
                ) : (
                  filteredCompleted.map((intv) => (
                    <tr key={intv._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900 dark:text-white">{intv.student?.name}</span>
                          <span className="text-xs text-gray-500 font-normal">{intv.student?.email}</span>
                          {intv.student?.phone && intv.student.phone !== 'N/A' && (
                            <span className="text-[11px] text-gray-400 font-normal">{intv.student.phone}</span>
                          )}
                          <span className="text-[11px] text-gray-400 font-normal mt-1">
                            Slot: {intv.student?.slot || intv.batch || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {intv.student?.course || intv.course || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        {intv.feedback?.finalRecommendation ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            intv.feedback.finalRecommendation === 'Strongly Recommended (Potential Candidate)' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' :
                            intv.feedback.finalRecommendation === 'Recommended' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                            intv.feedback.finalRecommendation === 'Need Improvement' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                          }`}>
                            {intv.feedback.finalRecommendation}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Pending recommendation</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-xs min-w-[320px] align-top">
                        {intv.feedback ? (
                          <div className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            {/* Interpersonal */}
                            <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                              <span className="font-semibold text-gray-500">Interpersonal:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{intv.feedback.interpersonalLevel || 'N/A'}</span>
                            </div>

                            {/* Language */}
                            <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                              <span className="font-semibold text-gray-500">Language:</span>
                              <span className="text-[11px] text-gray-800 dark:text-gray-200">
                                {intv.feedback.bengaliLevel || intv.feedback.englishLevel 
                                  ? `${intv.feedback.bengaliLevel ? 'BN: ' + intv.feedback.bengaliLevel : ''} ${intv.feedback.englishLevel ? '| EN: ' + intv.feedback.englishLevel : ''}`
                                  : 'N/A'}
                              </span>
                            </div>

                            {/* Camera */}
                            <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                              <span className="font-semibold text-gray-500">Camera:</span>
                              <span className="text-[11px] text-gray-800 dark:text-gray-200">
                                {intv.feedback.cameraOn ? `On (Eye: ${intv.feedback.eyeContact || '-'}, BG: ${intv.feedback.backgroundLevel || '-'})` : 'Off'}
                              </span>
                            </div>

                            {/* Technical */}
                            <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                              <span className="font-semibold text-gray-500">Technical:</span>
                              <div className="flex flex-col gap-1.5">
                                {(() => {
                                  const solved = [];
                                  const partially = [];
                                  const failed = [];
                                  
                                  if (intv.feedback.technicalEvaluation) {
                                    Object.entries(intv.feedback.technicalEvaluation).forEach(([catId, cat]) => {
                                      const label = catId.toUpperCase();
                                      if (cat && cat.topics) {
                                        cat.topics.forEach(t => {
                                          const qItem = { name: t.name, label };
                                          if (t.status === 'pass' || t.status === 'solved') solved.push(qItem);
                                          else if (t.status === 'partially_solved') partially.push(qItem);
                                          else if (t.status === 'fail' || t.status === 'cant_solve') failed.push(qItem);
                                        });
                                      }
                                    });
                                  }
                                  
                                  const hasTech = solved.length > 0 || partially.length > 0 || failed.length > 0;
                                  if (!hasTech) return <span className="text-gray-400 italic">None</span>;

                                  return (
                                    <>
                                      {solved.map((q, i) => (
                                        <div key={`s-${i}`} className="flex items-start gap-1 text-[10px] font-medium bg-green-50/70 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-1.5 py-1 rounded border border-green-100 dark:border-green-800/30 leading-snug break-words">
                                          <span className="mt-[1px] text-green-600 font-bold">✓</span>
                                          <span>{q.name}</span>
                                        </div>
                                      ))}
                                      {partially.map((q, i) => (
                                        <div key={`p-${i}`} className="flex items-start gap-1 text-[10px] font-medium bg-amber-50/70 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 px-1.5 py-1 rounded border border-amber-100 dark:border-amber-800/30 leading-snug break-words">
                                          <span className="mt-[1px] text-amber-600 font-bold">~</span>
                                          <span>{q.name}</span>
                                        </div>
                                      ))}
                                      {failed.map((q, i) => (
                                        <div key={`f-${i}`} className="flex items-start gap-1 text-[10px] font-medium bg-red-50/70 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-1.5 py-1 rounded border border-red-100 dark:border-red-800/30 leading-snug break-words">
                                          <span className="mt-[1px] text-red-600 font-bold">✗</span>
                                          <span>{q.name}</span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Problem Solving */}
                            {intv.feedback.problemSolvingLevel && (
                              <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                                <span className="font-semibold text-gray-500">Prob Solving:</span>
                                <span className="capitalize font-medium text-gray-800 dark:text-gray-200">{intv.feedback.problemSolvingLevel.replace("_", " ")}</span>
                              </div>
                            )}

                            {/* Final comment */}
                            {intv.feedback.finalComment && (
                              <div className="pt-0.5">
                                <p className="text-[11px] italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                  &quot;{intv.feedback.finalComment}&quot;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-700 shadow-sm text-right align-top">
                        <Link 
                          href={`/dashboard/feedbacks/${intv._id}`} 
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          View Feedback
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
