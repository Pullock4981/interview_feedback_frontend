"use client";
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { fetchWithAuth } from "@/utils/api";
import { Upload, Plus, Search, Filter, CheckCircle2, ChevronDown, ChevronUp, Trash2, Settings, Download, Copy, Loader2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CourseTemplateModal from "@/components/CourseTemplateModal";
import PremiumSkeleton from "@/components/PremiumSkeleton";

export default function StudentsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingInterviewId, setStartingInterviewId] = useState(null);
  const [activeProgramme, setActiveProgramme] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const groupedInterviews = interviews.reduce((acc, intv) => {
    const prog = (intv.course && intv.course !== 'N/A') 
      ? intv.course 
      : (intv.student?.course && intv.student.course !== 'N/A') ? intv.student.course : 'Unassigned Programme';
    if (!acc[prog]) acc[prog] = [];
    acc[prog].push(intv);
    return acc;
  }, {});

  const currentProgrammeInterviews = activeProgramme ? (groupedInterviews[activeProgramme] || []) : [];

  const filteredStudents = currentProgrammeInterviews.filter(intv => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const name = (intv.student?.name || '').toLowerCase();
    const email = (intv.student?.email || '').toLowerCase();
    const phone = (intv.student?.phone || '').toLowerCase();
    const status = (intv.status || '').toLowerCase();
    const slot = (intv.student?.slot || intv.batch || intv.student?.batch || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term) || status.includes(term) || slot.includes(term);
  });

  const filteredProgrammes = Object.entries(groupedInterviews).filter(([prog]) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return prog.toLowerCase().includes(term);
  });

  useEffect(() => {
    fetchInterviews();
    
    const onFocus = () => fetchInterviews();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleCreateInterview = () => {
    Swal.fire({
      title: 'Create Interviews (Batch)',
      html: `
        <div class="space-y-4 text-left px-1 mt-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Google Sheets Link <span class="text-red-500">*</span></label>
            <input id="swal-input-url" class="swal2-input !m-0 !w-full !text-sm" placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..." type="url" />
            <div id="swal-url-hint" class="text-xs text-gray-500 mt-1">Must be 'Anyone with the link can view'</div>
          </div>

          <!-- Specific Tab Selector Section -->
          <div class="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-lg">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-primary dark:text-indigo-300">
                Specific Sheet Tab <span class="text-gray-500 font-normal">(নির্দিষ্ট ট্যাব ফিল্টার)</span>
              </label>
              <span id="swal-tab-status" class="text-[11px] font-semibold text-primary dark:text-indigo-300"></span>
            </div>
            
            <div id="swal-tab-select-container" style="display: none;" class="mb-2">
              <label class="block text-[11px] text-gray-600 mb-1 font-medium">Select Tab from Sheet:</label>
              <select id="swal-input-tab-select" class="swal2-select !m-0 !w-full !text-xs !p-2 !border-indigo-300 dark:!border-indigo-700 !rounded-md !bg-white dark:!bg-gray-800">
                <option value="">-- Choose Tab from Dropdown --</option>
              </select>
            </div>

            <div>
              <input id="swal-input-tab-name" class="swal2-input !m-0 !w-full !text-xs !p-2" placeholder="Or type tab name (e.g. Batch 10, Sheet2)..." type="text" />
              <p class="text-[11px] text-gray-500 mt-1 leading-normal">
                💡 লিংকে <b>#gid=...</b> থাকলে বা এখানে ট্যাবের নাম দিলে শুধুমাত্র ঐ ট্যাবের ডাটাই লোড হবে।
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Programme Name <span class="text-red-500">*</span></label>
            <input id="swal-input-course" class="swal2-input !m-0 !w-full !text-sm" placeholder="e.g. Web Development" type="text" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Level <span class="text-gray-400 font-normal">(Optional)</span></label>
              <select id="swal-input-level" class="swal2-select !m-0 !w-full !text-sm !p-2 !border-gray-300 !rounded-md">
                <option value="">Select Level</option>
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
      confirmButtonColor: '#4F46E5',
      confirmButtonText: 'Create Interviews',
      showLoaderOnConfirm: true,
      didOpen: () => {
        const urlInput = document.getElementById('swal-input-url');
        const tabSelectContainer = document.getElementById('swal-tab-select-container');
        const tabSelect = document.getElementById('swal-input-tab-select');
        const tabNameInput = document.getElementById('swal-input-tab-name');
        const tabStatus = document.getElementById('swal-tab-status');
        const hintEl = document.getElementById('swal-url-hint');

        let lastCheckedId = '';

        const checkUrl = async () => {
          const val = urlInput?.value?.trim() || '';
          if (!val) {
            if (hintEl) hintEl.textContent = "Must be 'Anyone with the link can view'";
            if (tabStatus) tabStatus.textContent = "";
            return;
          }

          const gidMatch = val.match(/[#&?]gid=([0-9]+)/);
          const sheetMatch = val.match(/\/d\/([a-zA-Z0-9-_]+)/);

          if (gidMatch && gidMatch[1]) {
            if (tabStatus) tabStatus.innerHTML = `<span class="text-green-600 font-bold">✓ GID Detected (#gid=${gidMatch[1]})</span>`;
          }

          if (sheetMatch && sheetMatch[1]) {
            const sheetId = sheetMatch[1];
            if (sheetId !== lastCheckedId) {
              lastCheckedId = sheetId;
              if (tabStatus && !gidMatch) tabStatus.innerHTML = `<span class="text-primary animate-pulse">🔍 Fetching tabs...</span>`;
              try {
                const editRes = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
                if (editRes.ok) {
                  const html = await editRes.text();
                  const re = /docs-sheet-tab-caption">([^<]+)<\/div>/g;
                  const foundTabs = [];
                  let m;
                  while ((m = re.exec(html)) !== null) {
                    if (m[1] && !foundTabs.includes(m[1])) foundTabs.push(m[1]);
                  }

                  if (foundTabs.length > 0 && tabSelect && tabSelectContainer) {
                    tabSelect.innerHTML = `<option value="">-- Choose Tab (${foundTabs.length} tabs found) --</option>` +
                      foundTabs.map(t => `<option value="${t.replace(/"/g, '&quot;')}">${t}</option>`).join('');
                    tabSelectContainer.style.display = 'block';
                    if (tabStatus) tabStatus.innerHTML = `<span class="text-green-600 font-semibold">✓ ${foundTabs.length} tabs found!</span>`;
                  }
                }
              } catch (e) {
                // Ignore fetch error, manual tab name input remains available
              }
            }
          }
        };

        if (urlInput) {
          urlInput.addEventListener('input', checkUrl);
          urlInput.addEventListener('paste', () => setTimeout(checkUrl, 100));
          if (urlInput.value) checkUrl();
        }

        if (tabSelect && tabNameInput) {
          tabSelect.addEventListener('change', () => {
            if (tabSelect.value) {
              tabNameInput.value = tabSelect.value;
            }
          });
        }
      },
      preConfirm: async () => {
        const url = document.getElementById('swal-input-url')?.value?.trim() || '';
        const tabSelect = document.getElementById('swal-input-tab-select')?.value?.trim() || '';
        const tabNameInput = document.getElementById('swal-input-tab-name')?.value?.trim() || '';
        const chosenTabName = tabNameInput || tabSelect;
        const courseStr = document.getElementById('swal-input-course')?.value?.trim() || '';
        const levelStr = document.getElementById('swal-input-level')?.value || '';
        const batchStr = document.getElementById('swal-input-batch')?.value?.trim() || '';

        if (!url || !courseStr) {
          Swal.showValidationMessage('Please fill all required fields (Link and Programme Name)');
          return false;
        }

        try {
          // Extract Sheet ID from Google Sheets URL
          const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
          let fetchUrl = url;

          if (match && match[1]) {
            const sheetId = match[1];
            if (chosenTabName) {
              // If tab name is pure numeric gid
              if (/^\d{6,}$/.test(chosenTabName)) {
                fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${chosenTabName}`;
              } else {
                fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(chosenTabName)}`;
              }
            } else if (gidMatch && gidMatch[1]) {
              fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gidMatch[1]}`;
            } else {
              fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            }
          }

          const response = await fetch(fetchUrl);
          if (!response.ok) {
            if (chosenTabName) {
              throw new Error(`Could not fetch tab "${chosenTabName}". Make sure the tab name is spelled correctly and the sheet is public.`);
            }
            throw new Error("Could not fetch the sheet. Make sure it is public (Anyone with the link can view).");
          }
          
          const csvData = await response.text();
          
          // If the response is an HTML page (like a Google Login page), it's not public
          if (csvData.trim().startsWith('<!DOCTYPE html>') || csvData.includes('accounts.google.com')) {
            throw new Error("The sheet is private. Please change access to 'Anyone with the link can view'.");
          }
          
          const result = await new Promise((resolve, reject) => {
            Papa.parse(csvData, {
              header: false,
              skipEmptyLines: 'greedy',
              complete: async (results) => {
                try {
                  const rawRows = results.data;
                  if (!rawRows || rawRows.length === 0) throw new Error("No valid data found in the file.");

                  // 1. Find the header row (scan first 10 rows for 'email' or 'name' as substring)
                  let headerIndex = 0;
                  let headers = [];
                  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
                    const row = rawRows[i];
                    if (row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('email') || cell.toLowerCase().includes('name')))) {
                      headerIndex = i;
                      headers = row.map(c => typeof c === 'string' ? c.trim() : `Column_${Math.random()}`);
                      break;
                    }
                  }

                  if (headers.length === 0) {
                    headers = rawRows[0].map((c, i) => typeof c === 'string' && c.trim() ? c.trim() : `Column_${i}`);
                  }

                  // 2. Convert to Array of Objects
                  const objectRows = [];
                  for (let i = headerIndex + 1; i < rawRows.length; i++) {
                    const obj = {};
                    headers.forEach((h, idx) => {
                      if (h && !h.startsWith('Column_')) { // Ignore completely empty headers
                        // If duplicate headers exist, this will overwrite, which is fine as usually only one has data
                        if (!obj[h] || rawRows[i][idx]) {
                           obj[h] = rawRows[i][idx];
                        }
                      }
                    });
                    if (Object.values(obj).some(val => val !== undefined && val !== null && val !== '')) {
                       objectRows.push(obj);
                    }
                  }

                  // 3. Process exactly as before
                  const standardKeysLower = ['name', 'student name', 'candidate name', 'email', 'e-mail', 'email address', 'phone', 'phone number', 'contact', 'mobile', 'course', 'programme', 'batch', 'slot', 'time slot', 'interview slot'];
                  
                  const rows = objectRows.map(row => {
                    const getVal = (possibleSubstrings) => {
                      const rowKeys = Object.keys(row);
                      for (const k of rowKeys) {
                        const lowerKey = k.toLowerCase().trim();
                        if (possibleSubstrings.some(sub => lowerKey.includes(sub))) {
                          return row[k];
                        }
                      }
                      return null;
                    };
                    
                    const name = getVal(['name']) || 'Unknown Candidate';
                    let email = getVal(['email', 'e-mail', 'mail']);
                    if (!email) {
                      email = `no-email-${Math.random().toString(36).substring(2,10)}@placeholder.com`;
                    }
                    const phone = getVal(['phone', 'contact', 'mobile', 'cell']) || '';
                    const course = courseStr || getVal(['course', 'programme']) || '';
                    const batch = batchStr || getVal(['batch']) || '';
                    const slot = getVal(['slot', 'time']) || '';
                    
                    const normalizedRow = {
                      name,
                      email,
                      phone,
                      course,
                      batch,
                      level: levelStr || '',
                      slot,
                      metadata: {}
                    };
                    
                    const standardKeysSubstrings = ['name', 'email', 'e-mail', 'mail', 'phone', 'contact', 'mobile', 'cell', 'course', 'programme', 'batch', 'slot', 'time'];
                    Object.keys(row).forEach(key => {
                      const lowerKey = key.toLowerCase().trim();
                      if (key && !standardKeysSubstrings.some(sub => lowerKey.includes(sub)) && row[key] !== undefined && row[key] !== null && row[key] !== '') {
                        normalizedRow.metadata[key.trim()] = row[key];
                      }
                    });
                    
                    return normalizedRow;
                  });

                  if (rows.length === 0) return reject(new Error("No valid rows found after parsing."));

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
          'Created!', 
          `Successfully created: ${result.value.createdCount} interviews. Updated: ${result.value.updatedCount}`, 
          'success'
        );
        // Refresh the list
        setLoading(true);
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews?pageSize=1000`)
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
      setStartingInterviewId(existingInterviewId);
      return router.push(`/dashboard/interviews/${existingInterviewId}`);
    }

    try {
      setStartingInterviewId(existingInterviewId);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/${studentId}/start`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        const interviewId = data.data.interview._id;
        router.push(`/dashboard/interviews/${interviewId}`);
      } else {
        const errorMessage = data.error?.message || data.message || 'Failed to start interview';
        Swal.fire('Error', errorMessage, 'error');
        setStartingInterviewId(null);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Something went wrong', 'error');
      setStartingInterviewId(null);
    }
  };

  const handleDeleteInterview = async (id, studentName) => {
    const result = await Swal.fire({
      title: "Delete Student/Interview?",
      text: `Are you sure you want to permanently delete the assignment for "${studentName}"? This action cannot be undone.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire("Deleted!", "The interview assignment has been deleted.", "success");
          fetchInterviews();
        } else {
          Swal.fire("Error", data.error?.message || data.message || "Failed to delete", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Something went wrong", "error");
      }
    }
  };

  const handleDeleteCourse = async (courseName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete all students and their interviews for the course "${courseName}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete list!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/bulk/${encodeURIComponent(courseName)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Deleted!', `List for ${courseName} has been deleted.`, 'success');
          // clear active programme and refresh
          if (activeProgramme === courseName) setActiveProgramme(null);
          fetchInterviews();
        } else {
          Swal.fire('Error', data.message || 'Something went wrong', 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to delete list', 'error');
      }
    }
  };

  const getFormattedRows = (progName) => {
    if (!groupedInterviews[progName]) return { headers: [], rows: [] };
    
    const headers = [
      'Student Name', 'Email', 'Phone', 'Course', 'Slot', 'Status', 
      'Interpersonal Skills', 'Language Proficiency', 'Camera & Environment',
      'Technical (Solved)', 'Technical (Partially Solved)', "Technical (Can't Solve)",
      'Problem Solving', 'Final Recommendation', 'General Feedback / Final Comments'
    ];
    
    const rows = groupedInterviews[progName].map(intv => {
      const fb = intv.feedback || {};
      
      // Formatting Language
      let languageStr = '';
      if (fb.bengaliLevel) languageStr += `Bengali: ${fb.bengaliLevel} ${fb.bengaliComment ? '('+fb.bengaliComment+')' : ''} | `;
      if (fb.englishLevel) languageStr += `English: ${fb.englishLevel} ${fb.englishComment ? '('+fb.englishComment+')' : ''}`;
      
      // Formatting Camera
      let cameraStr = fb.cameraOn ? `On (Eye: ${fb.eyeContact || 'N/A'}, BG: ${fb.backgroundLevel || 'N/A'})` : 'Off';
      if (fb.cameraComment) cameraStr += ` - ${fb.cameraComment}`;
      
      // Formatting Technical into 3 parts with their statuses
      const solved = [];
      const partial = [];
      const cant = [];
      
      if (fb.technicalEvaluation && typeof fb.technicalEvaluation === 'object') {
        Object.entries(fb.technicalEvaluation).forEach(([catKey, catData]) => {
          if (catData.topics && Array.isArray(catData.topics)) {
            catData.topics.forEach(t => {
              if (t.status === 'solved' || t.status === 'pass') solved.push(t.name);
              else if (t.status === 'partially_solved') partial.push(t.name);
              else if (t.status === 'cant_solve' || t.status === 'fail') cant.push(t.name);
            });
          }
        });
      }

      const totalEval = solved.length + partial.length + cant.length;

      const solvedText = solved.length > 0 
        ? `Solved (${solved.length}):\n` + solved.map((q, i) => `${i + 1}. ${q}`).join('\n')
        : 'Solved (0): None';

      const partialText = partial.length > 0 
        ? `Partially Solved (${partial.length}):\n` + partial.map((q, i) => `${i + 1}. ${q}`).join('\n')
        : 'Partially Solved (0): None';

      const cantText = cant.length > 0 
        ? `Can't Solve (${cant.length}):\n` + cant.map((q, i) => `${i + 1}. ${q}`).join('\n')
        : "Can't Solve (0): None";

      // Auto-generate General Feedback based on question statuses
      let autoGeneralFeedback = "";
      if (totalEval > 0) {
        const pct = Math.round((solved.length / totalEval) * 100);
        autoGeneralFeedback = `Technical Evaluation: ${totalEval} questions evaluated — ${solved.length} Solved (${pct}%), ${partial.length} Partially Solved, ${cant.length} Can't Solve.`;
        if (solved.length >= totalEval * 0.75 && cant.length === 0) {
          autoGeneralFeedback += " Strong conceptual clarity and technical execution.";
        } else if (solved.length + partial.length >= totalEval * 0.6) {
          autoGeneralFeedback += " Satisfactory foundation; needs review on partial topics.";
        } else {
          autoGeneralFeedback += " Significant preparation needed on fundamental concepts.";
        }
      }

      const combinedFeedback = fb.finalComment 
        ? (autoGeneralFeedback && !fb.finalComment.includes(autoGeneralFeedback) 
            ? `${autoGeneralFeedback}\n\nMentor Notes: ${fb.finalComment}` 
            : fb.finalComment)
        : (autoGeneralFeedback || 'N/A');
      
      return [
        intv.student?.name || '',
        intv.student?.email || '',
        intv.student?.phone || 'N/A',
        progName,
        intv.student?.slot || intv.batch || intv.student?.batch || 'N/A',
        intv.status || '',
        `${fb.interpersonalLevel || 'N/A'} ${fb.interpersonalComment ? '- ' + fb.interpersonalComment : ''}`,
        languageStr.replace(/ \| $/, ''),
        cameraStr,
        solvedText,
        partialText,
        cantText,
        `${(fb.problemSolvingLevel || '').replace('_', ' ')} ${fb.problemSolvingComment ? '- ' + fb.problemSolvingComment : ''}`,
        fb.finalRecommendation || '',
        combinedFeedback
      ];
    });

    return { headers, rows };
  };

  const handleDownloadSheet = (progName) => {
    const { headers, rows } = getFormattedRows(progName);
    if (!headers.length) return;
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${progName}_students_feedback.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyForGoogleSheet = (progName) => {
    const { headers, rows } = getFormattedRows(progName);
    if (!headers.length) return;
    
    // Proper TSV cell escaping so multiline cells paste intact into Google Sheets
    const escapeTsvCell = (val) => {
      const s = (val || '').toString();
      if (s.includes('\t') || s.includes('\n') || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const tsvContent = [
      headers.map(escapeTsvCell).join('\t'),
      ...rows.map(r => r.map(escapeTsvCell).join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      Swal.fire('Copied!', 'Data copied to clipboard. You can now paste it directly into an empty Google Sheet.', 'success');
    }).catch(err => {
      Swal.fire('Error', 'Failed to copy data. Please try downloading instead.', 'error');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View, search, and manage assigned students.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCreateInterview}
            className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>+ Create Interview</span>
          </button>
        </div>
      </div>

      {/* View 1: When no programme is clicked -> Normally show all programme cards */}
      {!activeProgramme ? (
        <div className="space-y-4">
          {/* Overview Search Bar & Counter */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search programmes..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-3">
              <span><b>{Object.keys(groupedInterviews).length}</b> Programmes</span>
              <span>•</span>
              <span><b>{interviews.length}</b> Total Students</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse h-32" />
              ))}
            </div>
          ) : Object.keys(groupedInterviews).length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              No student programmes found. Click <b>+ Create Interview</b> to upload.
            </div>
          ) : filteredProgrammes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              No programmes match &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProgrammes.map(([prog, progInterviews]) => {
                const completed = progInterviews.filter(i => i.status === 'Completed').length;
                return (
                  <div 
                    key={prog} 
                    onClick={() => { setActiveProgramme(prog); setSearchTerm(""); }}
                    className="p-5 rounded-2xl cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-lg dark:hover:border-primary/80 bg-white dark:bg-gray-800 transition-all flex flex-col justify-between group min-h-[135px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors" title={prog}>
                          {prog}
                        </h3>
                        <span className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm shrink-0">
                          →
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full font-semibold">
                        {progInterviews.length} {progInterviews.length === 1 ? 'student' : 'students'}
                      </span>
                      {completed > 0 && (
                        <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completed} done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* View 2: When a programme is clicked -> Hide all other cards, show only this programme's details with Back button */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[400px] space-y-4">
          {/* Header Bar with Back Button & Action Controls */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => { setActiveProgramme(null); setSearchTerm(""); }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Go back to all programmes"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span>Back</span>
              </button>
              <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{activeProgramme}</span>
                  <span className="text-xs bg-primary/10 text-primary dark:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full">
                    {currentProgrammeInterviews.length} students
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Configure Form Template"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
              <button
                onClick={() => handleCopyForGoogleSheet(activeProgramme)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title={`Copy ${activeProgramme} data for Google Sheet`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for Google Sheet</span>
              </button>
              <button
                onClick={() => handleDownloadSheet(activeProgramme)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title={`Download ${activeProgramme} as CSV`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => handleDeleteCourse(activeProgramme)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title={`Delete all students in ${activeProgramme}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete List</span>
              </button>
            </div>
          </div>

          {/* Search bar inside this active programme */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students by name, email, slot, status..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            {searchTerm && (
              <span className="text-xs text-gray-500">
                Found {filteredStudents.length} of {currentProgrammeInterviews.length} students
              </span>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
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
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 italic">
                      {searchTerm ? `No students found matching "${searchTerm}".` : "No students in this programme."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((intv) => (
                    <tr key={intv._id} className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span>{intv.student?.name}</span>
                          {intv.student?.metadata && Object.keys(intv.student.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(intv.student.metadata).map(([k, v]) => (
                                <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{intv.student?.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{intv.student?.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {intv.student?.slot ? intv.student.slot : 
                         (intv.batch && intv.batch !== 'N/A') ? intv.batch : 
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
                                  intv.feedback.finalRecommendation === 'Strongly Recommended (Potential Candidate)' ? 'text-green-600' :
                                  intv.feedback.finalRecommendation === 'Recommended' ? 'text-primary' :
                                  intv.feedback.finalRecommendation === 'Need Improvement' ? 'text-orange-500' :
                                  intv.feedback.finalRecommendation === 'Not Recommended' ? 'text-red-500' : ''
                                }}`}>{intv.feedback.finalRecommendation || 'N/A'}</span>
                                {intv.feedback.finalComment && (
                                  <span className="text-[10px] italic text-gray-400 mt-1 line-clamp-2" title={intv.feedback.finalComment}>&quot;{intv.feedback.finalComment}&quot;</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 z-10 border-l dark:border-gray-700 shadow-sm flex items-center gap-2">
                        {intv.status === 'Completed' ? (
                          <Link 
                            href={`/dashboard/feedbacks/${intv._id}`} 
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors cursor-pointer"
                          >
                            View Feedback
                          </Link>
                        ) : (
                          <button 
                            onClick={() => handleStartInterview(intv.student._id, intv._id, intv.status)}
                            disabled={startingInterviewId === intv._id}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-70"
                          >
                            {startingInterviewId === intv._id ? (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Loading...
                              </span>
                            ) : (
                              intv.status === 'Assigned' ? 'Start Interview' : 'Continue Interview'
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInterview(intv._id, intv.student?.name)}
                          className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white rounded-md shadow-sm transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
      
      {showTemplateModal && activeProgramme && (
        <CourseTemplateModal 
          course={activeProgramme} 
          onClose={() => setShowTemplateModal(false)} 
        />
      )}
    </div>
  );
}
