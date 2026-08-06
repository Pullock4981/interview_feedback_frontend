"use client";
import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle2, ClipboardList, Users, Clock } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { fetchWithAuth } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function InterviewsList() {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('remaining');
  const [searchQuery, setSearchQuery] = useState('');

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

  const uniqueCourses = [...new Set(interviews.map(i => i.student?.course).filter(Boolean))];
  const [filterCourse, setFilterCourse] = useState('all');

  const filteredInterviews = interviews.filter(i => {
    let matchesStatus = true;
    if (filterStatus === 'completed') matchesStatus = i.status === 'Completed';
    else if (filterStatus === 'remaining') matchesStatus = i.status !== 'Completed';

    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = i.student?.name?.toLowerCase() || '';
      const email = i.student?.email?.toLowerCase() || '';
      const courseStr = i.student?.course?.toLowerCase() || '';
      matchesSearch = name.includes(q) || email.includes(q) || courseStr.includes(q);
    }
    
    let matchesCourse = true;
    if (filterCourse !== 'all') {
      matchesCourse = i.student?.course === filterCourse;
    }

    return matchesStatus && matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            Interviews
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track all assigned interviews.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setFilterStatus('all')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${filterStatus === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Students</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">{interviews.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div 
            onClick={() => setFilterStatus('completed')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${filterStatus === 'completed' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Completed</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">
                {interviews.filter(i => i.status === 'Completed').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div 
            onClick={() => setFilterStatus('remaining')}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border flex items-center justify-between cursor-pointer transition-all ${filterStatus === 'remaining' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Remaining</p>
              <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">
                {interviews.filter(i => i.status !== 'Completed').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search interviews..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 min-w-[300px]">Feedback Summary</th>
                <th className="px-6 py-4 sticky right-0 bg-gray-50 dark:bg-gray-900/50 z-10 border-l dark:border-gray-700 shadow-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading interviews...</td></tr>
              ) : filteredInterviews.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No interviews found.</td></tr>
              ) : (
                filteredInterviews.map((intv) => (
                  <tr key={intv._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{intv.student?.name}</td>
                    <td className="px-6 py-4">{intv.student?.course}</td>
                    <td className="px-6 py-4">
                      {intv.status === 'Completed' ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-md w-max">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold w-max block">
                          {intv.status}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-normal text-xs min-w-[300px] align-top">
                      {intv.status === 'Completed' && intv.feedback ? (
                        <div className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-500">Interpersonal:</span>
                            <span className="font-medium">{intv.feedback.interpersonalLevel || 'N/A'}</span>
                          </div>
                          
                          <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-500">Language:</span>
                            <span className="text-[11px]">
                              {intv.feedback.bengaliLevel || intv.feedback.englishLevel 
                                ? `${intv.feedback.bengaliLevel ? 'BN: ' + intv.feedback.bengaliLevel : ''} ${intv.feedback.englishLevel ? '| EN: ' + intv.feedback.englishLevel : ''}`
                                : 'N/A'}
                            </span>
                          </div>

                          <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-500">Camera:</span>
                            <span className="text-[11px]">{intv.feedback.cameraOn ? `On (Eye: ${intv.feedback.eyeContact || '-'}, BG: ${intv.feedback.backgroundLevel || '-'})` : 'Off'}</span>
                          </div>

                          <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-500">Technical:</span>
                            <div className="flex flex-col gap-1.5">
                              {(() => {
                                const solved = [];
                                const partially = [];
                                const failed = [];
                                
                                const catMap = {
                                  htmlcss: 'HTML & CSS',
                                  jsts: 'JS & TS',
                                  reactnext: 'React & Next',
                                  nodeexpress: 'Node & Express',
                                  mongodb: 'MongoDB'
                                };

                                if (intv.feedback.technicalEvaluation) {
                                  Object.entries(intv.feedback.technicalEvaluation).forEach(([catId, cat]) => {
                                    const label = catMap[catId] || catId.toUpperCase();
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
                                        <span className="mt-[1px] text-green-600">✓</span>
                                        <span className="shrink-0 font-bold bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 px-1 rounded-sm border border-green-200 dark:border-green-800">{q.label}</span>
                                        <span>{q.name}</span>
                                      </div>
                                    ))}
                                    {partially.map((q, i) => (
                                      <div key={`p-${i}`} className="flex items-start gap-1 text-[10px] font-medium bg-orange-50/70 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 px-1.5 py-1 rounded border border-orange-100 dark:border-orange-800/30 leading-snug break-words">
                                        <span className="mt-[1px] text-orange-600">~</span>
                                        <span className="shrink-0 font-bold bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-400 px-1 rounded-sm border border-orange-200 dark:border-orange-800">{q.label}</span>
                                        <span>{q.name}</span>
                                      </div>
                                    ))}
                                    {failed.map((q, i) => (
                                      <div key={`f-${i}`} className="flex items-start gap-1 text-[10px] font-medium bg-red-50/70 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-1.5 py-1 rounded border border-red-100 dark:border-red-800/30 leading-snug break-words">
                                        <span className="mt-[1px] text-red-600">✗</span>
                                        <span className="shrink-0 font-bold bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 px-1 rounded-sm border border-red-200 dark:border-red-800">{q.label}</span>
                                        <span>{q.name}</span>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-[100px_1fr] gap-1 border-b border-dashed pb-1.5 border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-500">Prob Solving:</span>
                            <span className="capitalize font-medium">{intv.feedback.problemSolvingLevel ? intv.feedback.problemSolvingLevel.replace("_", " ") : 'N/A'}</span>
                          </div>

                          <div className="grid grid-cols-[100px_1fr] gap-1">
                            <span className="font-semibold text-gray-500">Final Rec.:</span>
                            <div className="flex flex-col">
                              <span className={`font-bold ${
                                intv.feedback.finalRecommendation === 'Strong Hire' ? 'text-green-600' :
                                intv.feedback.finalRecommendation === 'Hire' ? 'text-primary' :
                                intv.feedback.finalRecommendation === 'Maybe' ? 'text-orange-500' :
                                intv.feedback.finalRecommendation === 'Reject' ? 'text-red-500' : ''
                              }`}>{intv.feedback.finalRecommendation || 'N/A'}</span>
                              {intv.feedback.finalComment && (
                                <span className="text-[10px] italic text-gray-400 mt-1 line-clamp-2" title={intv.feedback.finalComment}>"{intv.feedback.finalComment}"</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-700 shadow-sm">
                      {intv.status === 'Completed' ? (
                        <Link 
                          href={`/dashboard/feedbacks/${intv._id}`} 
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors"
                        >
                          View Feedback
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleStartInterview(intv.student._id, intv._id, intv.status)}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm transition-colors"
                        >
                          {intv.status === 'Assigned' ? 'Start Interview' : 'Continue Interview'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
