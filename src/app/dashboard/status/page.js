"use client";
import { fetchWithAuth } from "@/utils/api";
import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle2, ClipboardList, Download } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StatusList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews?status=Completed`);
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

  const handleExportCSV = () => {
    if (!interviews || interviews.length === 0) {
      return Swal.fire('No Data', 'There are no completed interviews to export.', 'info');
    }

    const headers = [
      'Student Name', 'Email', 'Course', 'Batch', 'Status', 
      'Interpersonal Skills', 'Language Proficiency', 'Camera & Environment',
      'Technical (Solved)', 'Technical (Partially Solved)', "Technical (Can't Solve)",
      'Problem Solving', 'Final Recommendation', 'Final Comment'
    ];
    
    const rows = interviews.map(intv => {
      const fb = intv.feedback || {};
      
      // Formatting Language
      let languageStr = '';
      if (fb.bengaliLevel) languageStr += `Bengali: ${fb.bengaliLevel} ${fb.bengaliComment ? '('+fb.bengaliComment+')' : ''} | `;
      if (fb.englishLevel) languageStr += `English: ${fb.englishLevel} ${fb.englishComment ? '('+fb.englishComment+')' : ''}`;
      
      // Formatting Camera
      let cameraStr = fb.cameraOn ? `On (Eye: ${fb.eyeContact || 'N/A'}, BG: ${fb.backgroundLevel || 'N/A'})` : 'Off';
      if (fb.cameraComment) cameraStr += ` - ${fb.cameraComment}`;
      
      // Formatting Technical
      const solved = [];
      const partial = [];
      const cant = [];
      
      if (fb.technicalEvaluation && typeof fb.technicalEvaluation === 'object') {
        Object.entries(fb.technicalEvaluation).forEach(([catKey, catData]) => {
          if (catData.topics && Array.isArray(catData.topics)) {
            catData.topics.forEach(t => {
              const itemStr = `[${catKey.toUpperCase()}] ${t.name}`;
              if (t.status === 'solved') solved.push(itemStr);
              else if (t.status === 'partially_solved') partial.push(itemStr);
              else if (t.status === 'cant_solve') cant.push(itemStr);
            });
          }
        });
      }
      
      return [
        intv.student?.name || '',
        intv.student?.email || '',
        intv.student?.course || '',
        intv.student?.batch || '',
        intv.status || '',
        `${fb.interpersonalLevel || 'N/A'} ${fb.interpersonalComment ? '- ' + fb.interpersonalComment : ''}`,
        languageStr.replace(/ \| $/, ''),
        cameraStr,
        solved.join('\n'),
        partial.join('\n'),
        cant.join('\n'),
        `${(fb.problemSolvingLevel || '').replace('_', ' ')} ${fb.problemSolvingComment ? '- ' + fb.problemSolvingComment : ''}`,
        fb.finalRecommendation || '',
        fb.finalComment || ''
      ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','); 
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create TSV for clipboard
    const tsvContent = [headers.join('\t'), ...rows.map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').replace(/\n/g, ' ')).join('\t'))].join('\n');

    Swal.fire({
      title: 'Export Data',
      text: 'How would you like to export this data?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Download File',
      denyButtonText: 'Copy for Google Sheets',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#16a34a',
      denyButtonColor: '#2563eb'
    }).then((result) => {
      if (result.isConfirmed) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `interviews_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (result.isDenied) {
        navigator.clipboard.writeText(tsvContent).then(() => {
          Swal.fire('Copied!', 'Data copied to clipboard. You can now paste it directly into an empty Google Sheet.', 'success');
        }).catch(err => {
          Swal.fire('Error', 'Failed to copy data. Please try downloading instead.', 'error');
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Completed Interviews</h1>
          <p className="text-gray-500 mt-2">View interviews you have successfully submitted.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search interviews..." 
              className="pl-9 pr-4 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading interviews...</td></tr>
              ) : interviews.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No interviews found.</td></tr>
              ) : (
                interviews.map((intv) => (
                  <tr key={intv._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{intv.student?.name}</td>
                    <td className="px-6 py-4">{intv.student?.course}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-md w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/feedbacks/${intv.feedback?._id || intv._id}`}
                          className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Feedback
                        </Link>
                      </div>
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
