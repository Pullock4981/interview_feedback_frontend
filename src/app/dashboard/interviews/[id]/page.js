"use client";
import { fetchWithAuth } from "@/utils/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Check, X, Trash2, Shield, CircleDashed } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import questionBank from "@/data/questions.json";

const INITIAL_CATEGORIES = [
  { id: 'htmlcss', label: 'HTML & CSS', suggestions: ['Semantic HTML', 'Flexbox', 'Grid', 'Responsive Design', 'CSS Variables'] },
  { id: 'jsts', label: 'JavaScript & TypeScript', suggestions: ['Closure', 'Promise', 'Event Loop', 'ES6+', 'Interfaces', 'Generics'] },
  { id: 'reactnext', label: 'React & Next.js', suggestions: ['Hooks', 'Context API', 'Server Components', 'Routing', 'Data Fetching'] },
  { id: 'nodeexpress', label: 'Node.js & Express.js', suggestions: ['Middleware', 'Routing', 'Error Handling', 'Streams', 'Authentication'] },
  { id: 'mongodb', label: 'MongoDB', suggestions: ['Aggregation', 'Indexing', 'Mongoose', 'Schema Design'] },
];

export default function InterviewFeedback() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackStatus, setFeedbackStatus] = useState("draft");

  // Left Column State
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [bengaliLevel, setBengaliLevel] = useState("Excellent");
  const [bengaliComment, setBengaliComment] = useState("");
  const [englishLevel, setEnglishLevel] = useState("Excellent");
  const [englishComment, setEnglishComment] = useState("");
  
  const [cameraOn, setCameraOn] = useState(true);
  const [eyeContact, setEyeContact] = useState("Excellent");
  const [backgroundLevel, setBackgroundLevel] = useState("Excellent");
  const [cameraComment, setCameraComment] = useState("");

  const [finalRecommendation, setFinalRecommendation] = useState("");
  const [finalComment, setFinalComment] = useState("");

  const [interpersonal, setInterpersonal] = useState({
    status: "Excellent", 
    comment: ""
  });

  // Right Column State
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [techEval, setTechEval] = useState({
    htmlcss: { topics: [], comment: "" },
    jsts: { topics: [], comment: "" },
    reactnext: { topics: [], comment: "" },
    nodeexpress: { topics: [], comment: "" },
    mongodb: { topics: [], comment: "" },
  });

  const [topicInputs, setTopicInputs] = useState({});

  const [problemSolving, setProblemSolving] = useState({
    status: "", 
    comment: ""
  });
  const [showProblemSolvingSection, setShowProblemSolvingSection] = useState(true);

  const [experienceLevel, setExperienceLevel] = useState("fresher");

  useEffect(() => {
    if (!interviewId) return;
    
    const fetchInterviewDetails = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/${interviewId}`);
        const data = await res.json();
        if (data.success) {
          const studentInfoObj = data.data.student;
          const course = data.data.course || studentInfoObj?.course || 'N/A';
          setStudentInfo({ ...studentInfoObj, course });
          
          let templateCategories = INITIAL_CATEGORIES;
          if (course && course !== 'N/A') {
            try {
              const tplRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/course-templates/${encodeURIComponent(course)}`);
              const tplData = await tplRes.json();
              if (tplData.success && tplData.data) {
                if (tplData.data.categories?.length > 0) {
                  templateCategories = tplData.data.categories;
                  setCategories(templateCategories);
                }
                setShowProblemSolvingSection(tplData.data.showProblemSolving !== false);
              }
            } catch (tplErr) {
              console.error("Failed to fetch template", tplErr);
            }
          }
          
          // Fetch existing feedback
          const fbRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/feedback/${interviewId}`);
          const fbData = await fbRes.json();
          
          if (fbData.success && fbData.data.feedback) {
            const fb = fbData.data.feedback;
            setFeedbackStatus(fb.status || "draft");
            
            setSelectedLanguage(fb.bengaliLevel ? "Bengali" : fb.englishLevel ? "English" : null);
            setBengaliLevel(fb.bengaliLevel || "Excellent");
            setBengaliComment(fb.bengaliComment || "");
            setEnglishLevel(fb.englishLevel || "Excellent");
            setEnglishComment(fb.englishComment || "");
            
            setCameraOn(fb.cameraOn !== false);
            setEyeContact(fb.eyeContact || "Excellent");
            setBackgroundLevel(fb.backgroundLevel || "Excellent");
            setCameraComment(fb.cameraComment || "");
            
            setInterpersonal({ status: fb.interpersonalLevel || "Excellent", comment: fb.interpersonalComment || "" });
            setProblemSolving({ status: fb.problemSolvingLevel || "", comment: fb.problemSolvingComment || "" });
            
            setFinalRecommendation(fb.finalRecommendation || "");
            setFinalComment(fb.finalComment || "");
            
              if (fb.technicalEvaluation && Object.keys(fb.technicalEvaluation).length > 0) {
                setTechEval(fb.technicalEvaluation);
                const newCats = [];
                const existingIds = templateCategories.map(c => c.id);
                for (const key of Object.keys(fb.technicalEvaluation)) {
                  if (!existingIds.includes(key)) {
                    newCats.push({ id: key, label: key, suggestions: [] });
                  }
                }
                if (newCats.length > 0) {
                  setCategories([...templateCategories, ...newCats]);
                }
              } else {
                const initialTechEval = {};
                templateCategories.forEach(cat => {
                  initialTechEval[cat.id] = { topics: [], comment: "" };
                });
                setTechEval(initialTechEval);
                setCategories(templateCategories);
            }
          }
        } else {
          Swal.fire('Error', 'Failed to load interview details', 'error');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviewDetails();
  }, [interviewId]);

  const buildPayload = () => {
    return {
      bengaliLevel: selectedLanguage === "Bengali" ? bengaliLevel : null,
      bengaliComment: selectedLanguage === "Bengali" ? bengaliComment : null,
      englishLevel: selectedLanguage === "English" ? englishLevel : null,
      englishComment: selectedLanguage === "English" ? englishComment : null,
      cameraOn,
      eyeContact: cameraOn ? eyeContact : null,
      backgroundLevel: cameraOn ? backgroundLevel : null,
      cameraComment: cameraOn ? cameraComment : null,
      
      // using the fields we added to backend schema
      interpersonalLevel: interpersonal.status,
      interpersonalComment: interpersonal.comment,
      
      problemSolvingLevel: showProblemSolvingSection ? problemSolving.status : null,
      problemSolvingComment: showProblemSolvingSection ? problemSolving.comment : null,
      
      finalRecommendation,
      finalComment,
      
      technicalEvaluation: techEval
    };
  };

  const handleSaveDraft = async () => {
    try {
      const payload = buildPayload();
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/feedback/${interviewId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Draft Saved!', 'Your feedback has been saved.', 'success');
      } else {
        Swal.fire('Error', data.error?.message || data.message || 'Failed to save draft', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  };

  const handleLoadFromBank = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/questions`);
      const data = await res.json();
      if (!data.success || !data.data.length) {
        return Swal.fire('No Banks Found', 'You have not created any question banks yet. Create one from the Question Bank page.', 'info');
      }
      
      const options = {};
      data.data.forEach(bank => {
        options[bank._id] = bank.title;
      });

      const { value: selectedId } = await Swal.fire({
        title: 'Select Question Bank',
        input: 'select',
        inputOptions: options,
        inputPlaceholder: 'Select a bank',
        showCancelButton: true,
      });

      if (selectedId) {
        const selectedBank = data.data.find(b => b._id === selectedId);
        if (selectedBank && selectedBank.questions) {
          // Merge questions into techEval
          setTechEval(prev => {
            const updated = { ...prev };
            Object.keys(selectedBank.questions).forEach(cat => {
              if (!updated[cat]) updated[cat] = { topics: [], comment: "" };
              // Ensure we don't duplicate questions if they exist
              const existingTopicNames = updated[cat].topics.map(t => t.name);
              const newTopics = selectedBank.questions[cat].topics || [];
              newTopics.forEach(t => {
                if (!existingTopicNames.includes(t.name)) {
                  updated[cat].topics.push({ ...t, status: 'pending' });
                }
              });
            });
            return updated;
          });
          
          // Add missing categories to the UI list
          setCategories(prev => {
            const updated = [...prev];
            const existingIds = updated.map(c => c.id);
            Object.keys(selectedBank.questions).forEach(cat => {
              if (!existingIds.includes(cat)) {
                updated.push({ id: cat, label: cat, suggestions: [] });
              }
            });
            return updated;
          });
          
          Swal.fire('Loaded!', 'Question bank has been loaded into the evaluation.', 'success');
        }
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to load question banks', 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!finalRecommendation) {
      return Swal.fire('Wait!', 'Please select a Final Recommendation before submitting.', 'warning');
    }

    let total = 0;
    const solvedList = [];
    const partiallyList = [];
    const cantSolveList = [];
    
    Object.values(techEval).forEach(cat => {
      cat.topics.forEach(t => {
        total++;
        if (t.status === 'solved') solvedList.push(t.name);
        else if (t.status === 'partially_solved') partiallyList.push(t.name);
        else if (t.status === 'cant_solve') cantSolveList.push(t.name);
      });
    });

    const formatList = (list, color, title, icon) => {
      if (list.length === 0) return '';
      return `
        <div style="margin-top: 10px;">
          <p style="color: ${color}; margin-bottom: 4px; font-weight: bold;">${icon} ${title} (${list.length}):</p>
          <ul style="list-style-type: disc; padding-left: 20px; font-size: 13px; color: #444; margin: 0;">
            ${list.map(q => `<li style="margin-bottom: 4px;">${q}</li>`).join('')}
          </ul>
        </div>
      `;
    };

    const summaryHtml = `
      <div style="text-align: left; font-size: 14px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 8px; margin-top: 10px; max-height: 400px; overflow-y: auto;">
        <p style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;"><strong>Total Questions Evaluated:</strong> ${total}</p>
        
        ${formatList(solvedList, '#16a34a', 'Solved', '🟢')}
        ${formatList(partiallyList, '#ea580c', 'Partially Solved', '🟠')}
        ${formatList(cantSolveList, '#dc2626', "Can't Solve", '🔴')}

        <hr style="margin: 15px 0; border: 0; border-top: 1px solid rgba(0,0,0,0.1);" />
        
        <p style="margin-bottom: 5px;"><strong>Interpersonal Skills:</strong> ${interpersonal.status || 'N/A'}</p>
        ${interpersonal.comment ? `<p style="font-size: 13px; color: #666; font-style: italic; margin-bottom: 10px;">"${interpersonal.comment}"</p>` : ''}
        
        <p style="margin-bottom: 5px; margin-top: 10px;"><strong>Language (${selectedLanguage || 'N/A'}):</strong> ${selectedLanguage === 'Bengali' ? bengaliLevel : selectedLanguage === 'English' ? englishLevel : 'N/A'}</p>
        ${(selectedLanguage === 'Bengali' && bengaliComment) || (selectedLanguage === 'English' && englishComment) ? `<p style="font-size: 13px; color: #666; font-style: italic; margin-bottom: 10px;">"${selectedLanguage === 'Bengali' ? bengaliComment : englishComment}"</p>` : ''}

        <p style="margin-bottom: 5px; margin-top: 10px;"><strong>Camera:</strong> ${cameraOn ? 'On' : 'Off'} 
          ${cameraOn ? `<span style="font-size: 13px; color: #555;">(Eye Contact: ${eyeContact}, Background: ${backgroundLevel})</span>` : ''}
        </p>
        ${cameraOn && cameraComment ? `<p style="font-size: 13px; color: #666; font-style: italic; margin-bottom: 15px;">"${cameraComment}"</p>` : ''}
        
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid rgba(0,0,0,0.1);" />
        
        <p style="font-size: 16px;"><strong>Final Recommendation:</strong> <span style="color: #5c2d91;">${finalRecommendation}</span></p>
      </div>
      <p style="margin-top: 15px; font-size: 13px; color: #666;">You won't be able to edit this after submitting!</p>
    `;

    Swal.fire({
      title: 'Submit Final Feedback?',
      html: summaryHtml,
      icon: 'info',
      width: '650px',
      showCancelButton: true,
      confirmButtonColor: '#5c2d91',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, submit it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = buildPayload();
          const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/feedback/${interviewId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            Swal.fire('Submitted!', 'Interview feedback finalized.', 'success').then(() => {
              router.push('/dashboard/students');
            });
          } else {
            Swal.fire('Error', data.error?.message || data.message || 'Failed to submit', 'error');
          }
        } catch (err) {
          Swal.fire('Error', 'Something went wrong', 'error');
        }
      }
    });
  };

  const handleAddTopic = (catId, e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const rawVal = topicInputs[catId];
      if (!rawVal || typeof rawVal !== 'string') return;
      
      e.preventDefault();
      const val = rawVal.trim();
      if (val && !techEval[catId].topics.find(t => t.name.toLowerCase() === val.toLowerCase())) {
        setTechEval(prev => ({
          ...prev,
          [catId]: {
            ...prev[catId],
            topics: [...prev[catId].topics, { name: val, status: null }]
          }
        }));
        setTopicInputs(prev => ({ ...prev, [catId]: "" }));
      }
    }
  };

  const toggleTopicStatus = (catId, topicName, status) => {
    setTechEval(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        topics: prev[catId].topics.map(t => 
          t.name === topicName ? { ...t, status: t.status === status ? null : status } : t
        )
      }
    }));
  };

  const removeTopic = (catId, topicName) => {
    setTechEval(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        topics: prev[catId].topics.filter(t => t.name !== topicName)
      }
    }));
  };

  const updateComment = (catId, comment) => {
    setTechEval(prev => ({
      ...prev,
      [catId]: { ...prev[catId], comment }
    }));
  };

  const handleAddCategory = () => {
    const name = window.prompt("Enter new section name (e.g., SQL):");
    if (!name || name.trim() === "") return;
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!id || categories.find(c => c.id === id)) {
      return Swal.fire('Error', 'Invalid or duplicate section name', 'error');
    }
    setCategories(prev => [...prev, { id, label: name.trim(), suggestions: [] }]);
    setTechEval(prev => ({ ...prev, [id]: { topics: [], comment: "" } }));
  };

  const handleRemoveCategory = (catId) => {
    Swal.fire({
      title: 'Remove Section?',
      text: "This will remove the section and all its topics.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      confirmButtonColor: '#ef4444',
    }).then(result => {
      if (result.isConfirmed) {
        setCategories(prev => prev.filter(c => c.id !== catId));
        setTechEval(prev => {
          const next = { ...prev };
          delete next[catId];
          return next;
        });
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading interview data...</div>;

  const isReadOnly = user?.role === "manager" || feedbackStatus === "final";

  if (isReadOnly) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Interview Feedback Details
            </h1>
            <div className="text-gray-500 text-xs mt-1 flex flex-wrap items-center gap-2">
              <span>Student: <strong className="text-gray-800 dark:text-gray-200">{studentInfo?.name || "Unknown"}</strong></span>
              <span>| Course: {studentInfo?.course || "N/A"} - Batch {studentInfo?.batch || "N/A"}</span>
              {studentInfo?.metadata && Object.keys(studentInfo.metadata).length > 0 && (
                <>
                  <span>|</span>
                  {Object.entries(studentInfo.metadata).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {k}: {v}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: Recommendation & General Feedback */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Highlighted Final Recommendation */}
            <div className={`p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${
              finalRecommendation === 'Strongly Recommended (Potential Candidate)' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
              finalRecommendation === 'Recommended' ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30' :
              finalRecommendation === 'Need Improvement' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
              finalRecommendation === 'Not Recommended' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
              'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}>
              <div>
                <h2 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  finalRecommendation === 'Strongly Recommended (Potential Candidate)' ? 'text-green-800 dark:text-green-400' :
                  finalRecommendation === 'Recommended' ? 'text-primary dark:text-primary-light' :
                  finalRecommendation === 'Need Improvement' ? 'text-orange-800 dark:text-orange-400' :
                  finalRecommendation === 'Not Recommended' ? 'text-red-800 dark:text-red-400' : 
                  'text-gray-500 dark:text-gray-400'
                }`}>Final Recommendation</h2>
                <div className={`text-2xl font-extrabold ${
                  finalRecommendation === 'Strongly Recommended (Potential Candidate)' ? 'text-green-900 dark:text-green-300' :
                  finalRecommendation === 'Recommended' ? 'text-primary-hover dark:text-primary-light' :
                  finalRecommendation === 'Need Improvement' ? 'text-orange-900 dark:text-orange-300' :
                  finalRecommendation === 'Not Recommended' ? 'text-red-900 dark:text-red-300' : 
                  'text-gray-900 dark:text-gray-100'
                }`}>{finalRecommendation || "Not Decided"}</div>
              </div>
              
              {finalComment && (
                <div className="text-sm p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200">
                  <span className="font-semibold block mb-1 text-xs opacity-70">Overall Comment:</span>
                  {finalComment}
                </div>
              )}
            </div>

            {/* General Feedback Box */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-primary mb-4 border-b pb-1">General Feedback</h2>
              
              {showProblemSolvingSection && (
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Problem Solving</h3>
                  <p className="text-sm font-semibold capitalize text-primary">{problemSolving.status ? problemSolving.status.replace("_", " ") : "N/A"}</p>
                  {problemSolving.comment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{problemSolving.comment}"</p>}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Interpersonal Skills</h3>
                <p className="text-sm font-semibold text-primary">{interpersonal.status || "N/A"}</p>
                {interpersonal.comment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{interpersonal.comment}"</p>}
              </div>

              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Language & Environment</h3>
                <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {bengaliLevel && <p><span className="text-gray-500 mr-2">Bengali:</span> {bengaliLevel}</p>}
                  {bengaliComment && <p className="italic text-gray-500 ml-4 mb-2">"{bengaliComment}"</p>}
                  {englishLevel && <p><span className="text-gray-500 mr-2">English:</span> {englishLevel}</p>}
                  {englishComment && <p className="italic text-gray-500 ml-4 mb-2">"{englishComment}"</p>}
                  {!bengaliLevel && !englishLevel && <p><span className="text-gray-500 mr-2">Language:</span> N/A</p>}
                  <p><span className="text-gray-500 mr-2">Camera:</span> {cameraOn ? "On" : "Off"}</p>
                  {cameraOn && <p className="italic text-gray-500 ml-4">Eye Contact: {eyeContact}, BG: {backgroundLevel}</p>}
                  {cameraComment && <p className="italic text-gray-500 ml-4 mt-1">"{cameraComment}"</p>}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Technical Evaluation */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
              <h2 className="text-sm font-bold text-primary mb-4 border-b pb-1">Technical Evaluation</h2>
              
              {(() => {
                const solvedQuestions = [];
                const partiallySolvedQuestions = [];
                const cantSolveQuestions = [];

                categories.forEach(cat => {
                  const data = techEval[cat.id];
                  if (!data) return;
                  data.topics.forEach(t => {
                    const item = { ...t, categoryLabel: cat.label };
                    if (t.status === 'solved') solvedQuestions.push(item);
                    else if (t.status === 'partially_solved') partiallySolvedQuestions.push(item);
                    else if (t.status === 'cant_solve') cantSolveQuestions.push(item);
                  });
                });

                const renderQuestionList = (list, title, colorClass, icon, bgClass, borderClass) => {
                  if (list.length === 0) return null;
                  return (
                    <div className={`p-4 rounded-xl border shadow-sm mb-4 ${bgClass} ${borderClass}`}>
                      <h3 className={`font-bold text-sm mb-3 flex items-center gap-2 ${colorClass}`}>
                        {icon} {title} ({list.length})
                      </h3>
                      <ul className="space-y-2">
                        {list.map((q, idx) => (
                          <li key={idx} className="text-xs text-gray-800 dark:text-gray-200 flex items-start gap-2">
                            <span className={`font-semibold shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 border ${borderClass}`}>
                              {q.categoryLabel}
                            </span>
                            <span className="mt-0.5 font-medium">{q.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                };

                return (
                  <>
                    {renderQuestionList(solvedQuestions, 'Solved', 'text-green-700 dark:text-green-400', '🟢', 'bg-green-50/50 dark:bg-green-900/10', 'border-green-200 dark:border-green-800')}
                    {renderQuestionList(partiallySolvedQuestions, 'Partially Solved', 'text-orange-700 dark:text-orange-400', '🟠', 'bg-orange-50/50 dark:bg-orange-900/10', 'border-orange-200 dark:border-orange-800')}
                    {renderQuestionList(cantSolveQuestions, "Can't Solve", 'text-red-700 dark:text-red-400', '🔴', 'bg-red-50/50 dark:bg-red-900/10', 'border-red-200 dark:border-red-800')}
                    
                    {solvedQuestions.length === 0 && partiallySolvedQuestions.length === 0 && cantSolveQuestions.length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-8">No technical questions evaluated.</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-5rem)] -mt-4 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-100 dark:border-gray-700 mb-3 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Interview Feedback Form</h1>
          <div className="text-gray-500 text-xs mt-1 flex flex-wrap items-center gap-2">
            <span>Student: <strong className="text-gray-800 dark:text-gray-200">{studentInfo?.name || "Unknown"}</strong></span>
            <span>| Course: {studentInfo?.course || "N/A"} - {studentInfo?.batch || ""}</span>
            {studentInfo?.metadata && Object.keys(studentInfo.metadata).length > 0 && (
              <>
                <span>|</span>
                {Object.entries(studentInfo.metadata).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {k}: {v}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button type="button" onClick={handleSaveDraft} className="px-4 py-1.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
            Save Draft
          </button>
          <button onClick={handleSubmit} className="px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md">
            Submit Final
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT COLUMN: Metadata, Camera, Recommendation */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
          
          <section className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <h2 className="text-sm font-bold text-primary mb-3 border-b pb-1">Language Proficiency</h2>
            
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">Interview Language</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("Bengali")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                    selectedLanguage === "Bengali"
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  Bengali
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("English")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                    selectedLanguage === "English"
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {selectedLanguage && (
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {selectedLanguage} Level
                  </label>
                  <select 
                    value={selectedLanguage === "Bengali" ? bengaliLevel : englishLevel} 
                    onChange={(e) => selectedLanguage === "Bengali" ? setBengaliLevel(e.target.value) : setEnglishLevel(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  >
                    <option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Average">Average</option><option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={`Optional feedback on ${selectedLanguage}...`}
                    value={selectedLanguage === "Bengali" ? bengaliComment : englishComment}
                    onChange={(e) => selectedLanguage === "Bengali" ? setBengaliComment(e.target.value) : setEnglishComment(e.target.value)}
                    className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <h2 className="text-sm font-bold text-primary mb-3 border-b pb-1">Camera & Environment</h2>
            
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">Camera Status</label>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCameraOn(true)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    cameraOn 
                      ? 'bg-white text-green-700 shadow-sm dark:bg-gray-800 dark:text-green-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Camera On
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOn(false)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    !cameraOn 
                      ? 'bg-white text-red-700 shadow-sm dark:bg-gray-800 dark:text-red-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Camera Off
                </button>
              </div>
            </div>
            
            {cameraOn ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Eye Contact</label>
                  <select value={eyeContact} onChange={(e) => setEyeContact(e.target.value)} className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Average">Average</option><option value="Poor">Poor</option></select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Background</label>
                  <select value={backgroundLevel} onChange={(e) => setBackgroundLevel(e.target.value)} className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Average">Average</option><option value="Poor">Poor</option></select>
                </div>
                <div className="col-span-2">
                  <input type="text" value={cameraComment} onChange={(e) => setCameraComment(e.target.value)} placeholder="Optional comment on environment..." className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-2">Camera was off. No visual evaluation recorded.</p>
            )}
          </section>

          {/* Interpersonal Skills */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <h2 className="text-sm font-bold text-primary mb-3 border-b pb-1">Interpersonal Skills</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Overall Rating</label>
                <select 
                  className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  value={interpersonal.status}
                  onChange={(e) => setInterpersonal({...interpersonal, status: e.target.value})}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <input 
                type="text" 
                placeholder="Optional comment..." 
                className="w-full p-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                value={interpersonal.comment}
                onChange={(e) => setInterpersonal({...interpersonal, comment: e.target.value})}
              />
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-primary mb-3 border-b pb-1">Final Recommendation</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input type="radio" name="rec" value='Strongly Recommended (Potential Candidate)' checked={finalRecommendation === 'Strongly Recommended (Potential Candidate)'} onChange={(e) => setFinalRecommendation(e.target.value)} className="mr-2 text-green-600" />
                <span className="font-bold text-xs">Strongly Recommended (Potential Candidate)</span>
              </label>
              <label className="flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input type="radio" name="rec" value='Recommended' checked={finalRecommendation === 'Recommended'} onChange={(e) => setFinalRecommendation(e.target.value)} className="mr-2 text-primary" />
                <span className="font-bold text-xs">Recommended</span>
              </label>
              <label className="flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input type="radio" name="rec" value='Need Improvement' checked={finalRecommendation === 'Need Improvement'} onChange={(e) => setFinalRecommendation(e.target.value)} className="mr-2 text-orange-500" />
                <span className="font-bold text-xs">Need Improvement</span>
              </label>
              <label className="flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input type="radio" name="rec" value='Not Recommended' checked={finalRecommendation === 'Not Recommended'} onChange={(e) => setFinalRecommendation(e.target.value)} className="mr-2 text-red-500" />
                <span className="font-bold text-xs">Not Recommended</span>
              </label>
            </div>
            <textarea value={finalComment} onChange={(e) => setFinalComment(e.target.value)} placeholder="Final overall comments..." className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm flex-1 min-h-[60px] resize-none focus:ring-2 focus:ring-primary focus:outline-none"></textarea>
          </section>
        </div>

        {/* RIGHT COLUMN: Technical Evaluation */}
        <div className="lg:col-span-8 overflow-y-auto pr-1 custom-scrollbar">
          <section className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b pb-1 shrink-0">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                Technical Evaluation
                <button type="button" onClick={handleAddCategory} className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded font-bold cursor-pointer transition-colors">+ Add Section</button>
                <button type="button" onClick={handleLoadFromBank} className="px-3 py-1 text-xs bg-green-600/10 hover:bg-green-600/20 text-green-700 rounded font-bold cursor-pointer transition-colors">Load from Bank</button>
              </h2>
              <span className="text-[10px] text-gray-500 italic">Select from Question Bank or add manually.</span>
            </div>

            {/* Experience Level Selector */}
            <div className="mb-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg flex shrink-0">
              <button
                type="button"
                onClick={() => setExperienceLevel("fresher")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  experienceLevel === "fresher"
                    ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Fresher
              </button>
              <button
                type="button"
                onClick={() => setExperienceLevel("intermediate")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  experienceLevel === "intermediate"
                    ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Intermediate
              </button>
              <button
                type="button"
                onClick={() => setExperienceLevel("experienced")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  experienceLevel === "experienced"
                    ? 'bg-white text-primary shadow-sm dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Experienced
              </button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 content-start items-start">
              {categories.map((cat) => {
                const catData = techEval[cat.id] || { topics: [], comment: "" };
                return (
                <div key={cat.id} className="p-3 border rounded-lg dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col gap-2 shadow-sm relative group">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-sm text-gray-800 dark:text-gray-200">{cat.label}</label>
                    <button type="button" onClick={() => handleRemoveCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Remove Section">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Topic Input with Datalist */}
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (!catData.topics.find(t => t.name.toLowerCase() === val.toLowerCase())) {
                          setTechEval(prev => ({
                            ...prev,
                            [cat.id]: {
                              ...prev[cat.id],
                              topics: [...prev[cat.id].topics, { name: val, status: null }]
                            }
                          }));
                        }
                        e.target.value = "";
                      }}
                      className="w-full px-3 py-1.5 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-sm focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">Select a question from Question Bank...</option>
                      {((cat.suggestions && cat.suggestions.length > 0) 
                          ? cat.suggestions 
                          : (questionBank[cat.id]?.[experienceLevel] || [])
                       ).filter(sug => !catData.topics.find(t => t.name.toLowerCase() === sug.toLowerCase())).map(sug => (
                        <option key={sug} value={sug}>{sug}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rendered Topic Chips */}
                  {catData.topics.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {catData.topics.map(t => (
                        <div key={t.name} className={`flex flex-col bg-white dark:bg-gray-800 border rounded-md shadow-sm overflow-hidden text-xs transition-colors ${t.status === 'solved' ? 'border-green-300 dark:border-green-700' : t.status === 'cant_solve' ? 'border-red-300 dark:border-red-700' : t.status === 'partially_solved' ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-600'}`}>
                          <div className="px-2 py-1.5 font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/80 border-b dark:border-gray-700">
                            {t.name}
                          </div>
                          <div className="flex justify-between items-center p-1 bg-white dark:bg-gray-800">
                            <div className="flex gap-1 flex-wrap">
                              <button 
                                type="button" 
                                onClick={() => toggleTopicStatus(cat.id, t.name, 'solved')}
                                className={`px-2 py-1 rounded transition-colors flex items-center justify-center cursor-pointer ${t.status === 'solved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                                title="Solved"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Solved
                              </button>
                              <button 
                                type="button" 
                                onClick={() => toggleTopicStatus(cat.id, t.name, 'partially_solved')}
                                className={`px-2 py-1 rounded transition-colors flex items-center justify-center cursor-pointer ${t.status === 'partially_solved' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                                title="Partially Solved"
                              >
                                <CircleDashed className="w-3.5 h-3.5 mr-1" /> Partially
                              </button>
                              <button 
                                type="button" 
                                onClick={() => toggleTopicStatus(cat.id, t.name, 'cant_solve')}
                                className={`px-2 py-1 rounded transition-colors flex items-center justify-center cursor-pointer ${t.status === 'cant_solve' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                                title="Can't Solve"
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Can't Solve
                              </button>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeTopic(cat.id, t.name)}
                              className="px-2 py-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-gray-400 transition-colors flex items-center justify-center cursor-pointer rounded ml-auto"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea 
                    value={catData.comment}
                    onChange={(e) => updateComment(cat.id, e.target.value)}
                    placeholder="Optional comment..."
                    className="w-full px-3 py-2 mt-auto border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                    rows="2"
                  ></textarea>
                </div>
              )})}



            </div>
          </section>
        </div>

      </form>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `}</style>
    </div>
  );
}
