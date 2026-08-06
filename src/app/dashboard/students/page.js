"use client";
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { fetchWithAuth } from "@/utils/api";
import { Upload, Search, Filter, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgrammes, setExpandedProgrammes] = useState({});

  const toggleProgramme = (prog) => {
    setExpandedProgrammes(prev => ({
      ...prev,
      [prog]: !prev[prog]
    }));
  };

  const groupedInterviews = interviews.reduce((acc, intv) => {
    const prog = (intv.student?.course && intv.student.course !== 'N/A') 
      ? intv.student.course 
      : 'Unassigned Programme';
    if (!acc[prog]) acc[prog] = [];
    acc[prog].push(intv);
    return acc;
  }, {});

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

  const handleImport = () => {
    Swal.fire({
      title: 'Import Students',
      html: `
        <div class="space-y-4 text-left px-1 mt-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Google Sheets Link <span class="text-red-500">*</span></label>
            <input id="swal-input-url" class="swal2-input !m-0 !w-full !text-sm" placeholder="https://docs.google.com/spreadsheets/d/.../edit" type="url" />
            <p class="text-xs text-gray-500 mt-1">Must be 'Anyone with the link can view'</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Programme Name <span class="text-red-500">*</span></label>
            <input id="swal-input-course" class="swal2-input !m-0 !w-full !text-sm" placeholder="e.g. Web Development" type="text" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Level <span class="text-red-500">*</span></label>
              <select id="swal-input-level" class="swal2-select !m-0 !w-full !flex !text-sm !py-2.5 !border !border-gray-300 !rounded-md !px-3 !bg-white outline-none">
                <option value="" disabled selected>Select</option>
                <option value="Level-1">Level-1</option>
                <option value="Level-2">Level-2</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Batch <span class="text-gray-400 font-normal">(Optional)</span></label>
              <input id="swal-input-batch" class="swal2-input !m-0 !w-full !text-sm" placeholder="e.g. B-10" type="text" />
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#5c2d91',
      confirmButtonText: 'Start Import',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const url = document.getElementById('swal-input-url').value;
        const courseStr = document.getElementById('swal-input-course').value;
        const levelStr = document.getElementById('swal-input-level').value;
        const batchStr = document.getElementById('swal-input-batch').value;

        if (!url || !courseStr || !levelStr) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }

        try {
          // Try to extract the Sheet ID from a standard Google Sheets URL
          const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          let fetchUrl = url;
          if (match && match[1]) {
            // Convert standard URL to CSV export URL
            fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
          }

          // Use a CORS proxy to prevent browser CORS blocks
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`;

          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Could not fetch the sheet. Make sure it is public (Anyone with the link can view).");
          
          const csvData = await response.text();
          
          // If the response is an HTML page (like a Google Login page), it's not public
          if (csvData.trim().startsWith('<!DOCTYPE html>')) {
            throw new Error("The sheet is private. Please change access to 'Anyone with the link can view'.");
          }
          
          const result = await new Promise((resolve, reject) => {
            Papa.parse(csvData, {
              header: true,
              skipEmptyLines: true,
              complete: async (results) => {
                try {
                  const rows = results.data.map(row => ({
                    name: row.Name || row.name || 'Unknown',
                    email: row.Email || row.email,
                    phone: row.Phone || row.phone || '',
                    course: courseStr || row.Course || row.course || '',
                    batch: batchStr || row.Batch || row.batch || '',
                    level: levelStr || '',
                    slot: row.Slot || row.slot || ''
                  })).filter(r => r.email);

                  if (rows.length === 0) return reject(new Error("No valid rows found"));

                  const importRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/students/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceSheetId: 'web-upload', rows })
                  });
                  const importData = await importRes.json();
                  if (!importData.success) throw new Error(importData.error?.message || importData.message || "Failed to import");
                  
                  resolve(importData.data);
                } catch (err) {
                  reject(err);
                }
              },
              error: (err) => reject(err)
            });
          });
          return result;
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error.message}`);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire(
          'Imported!', 
          `Successfully created: ${result.value.createdCount}, Updated: ${result.value.updatedCount}`, 
          'success'
        );
        // Refresh the list
        setLoading(true);
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews`)
          .then(res => res.json())
          .then(data => {
            if (data.success) setInterviews(data.data);
            setLoading(false);
          });
      }
    });
  };

  const handleStartInterview = async (studentId, existingInterviewId, status) => {
    // If already started or draft saved, just go to the interview page
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
        // If conflict (already active), try to navigate if backend gives ID, otherwise error
        Swal.fire('Error', data.message || 'Failed to start interview', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View, search, and manage assigned students.</p>
        </div>
        <button 
          onClick={handleImport}
          className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Import via Sheets</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-9 pr-4 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">Loading students...</div>
          ) : interviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">No students assigned yet.</div>
          ) : (
            Object.entries(groupedInterviews).map(([prog, progInterviews]) => (
              <div key={prog} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Card Header */}
                <div 
                  onClick={() => toggleProgramme(prog)}
                  className="p-5 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{prog}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                      {progInterviews.length} {progInterviews.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <div className="text-gray-400 p-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {expandedProgrammes[prog] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Card Body (Table) */}
                {expandedProgrammes[prog] && (
                  <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold whitespace-nowrap">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Slot</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 min-w-[300px]">Feedback Summary</th>
                          <th className="px-6 py-4 sticky right-0 bg-gray-50 dark:bg-gray-900/50 z-10 border-l dark:border-gray-700 shadow-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progInterviews.map((intv) => (
                          <tr key={intv._id} className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{intv.student?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{intv.student?.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{intv.student?.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {intv.student?.slot ? intv.student.slot : 
                               (intv.student?.batch && intv.student?.batch !== 'N/A') ? intv.student.batch : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            {/* Single Feedback Summary Column */}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
