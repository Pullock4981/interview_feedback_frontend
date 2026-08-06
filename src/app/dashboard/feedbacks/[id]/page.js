"use client";
import { fetchWithAuth } from "@/utils/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: 'htmlcss', label: 'HTML & CSS' },
  { id: 'jsts', label: 'JavaScript & TypeScript' },
  { id: 'reactnext', label: 'React & Next.js' },
  { id: 'nodeexpress', label: 'Node.js & Express.js' },
  { id: 'mongodb', label: 'MongoDB' },
];

export default function ViewFeedback() {
  const { id: interviewId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;
    
    const fetchData = async () => {
      try {
        const [feedbackRes, interviewRes] = await Promise.all([
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/feedback/${interviewId}`),
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/interviews/${interviewId}`)
        ]);
        
        const fData = await feedbackRes.json();
        const iData = await interviewRes.json();
        
        if (fData.success && iData.success) {
          setData({
            feedback: fData.data.feedback,
            studentInfo: iData.data.student
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [interviewId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading feedback...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load feedback</div>;

  const { feedback, studentInfo } = data;
  const techEval = feedback.technicalEvaluation || {};

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/dashboard/students" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Feedback Review</h1>
          <p className="text-gray-500 text-sm">
            Student: <strong className="text-gray-800 dark:text-gray-200">{studentInfo?.name || "Unknown"}</strong> | 
            Course: {studentInfo?.course || "N/A"} - {studentInfo?.batch || ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Recommendation & General Feedback */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Highlighted Final Recommendation */}
          <div className={`p-4 rounded-xl border shadow-sm flex flex-col gap-3 ${
            feedback.finalRecommendation === 'Strong Hire' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
            feedback.finalRecommendation === 'Hire' ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30' :
            feedback.finalRecommendation === 'Maybe' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
            feedback.finalRecommendation === 'Reject' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
            'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }`}>
            <div>
              <h2 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                feedback.finalRecommendation === 'Strong Hire' ? 'text-green-800 dark:text-green-400' :
                feedback.finalRecommendation === 'Hire' ? 'text-primary dark:text-primary-light' :
                feedback.finalRecommendation === 'Maybe' ? 'text-orange-800 dark:text-orange-400' :
                feedback.finalRecommendation === 'Reject' ? 'text-red-800 dark:text-red-400' : 
                'text-gray-500 dark:text-gray-400'
              }`}>Final Recommendation</h2>
              <div className={`text-2xl font-extrabold ${
                feedback.finalRecommendation === 'Strong Hire' ? 'text-green-900 dark:text-green-300' :
                feedback.finalRecommendation === 'Hire' ? 'text-primary-hover dark:text-primary-light' :
                feedback.finalRecommendation === 'Maybe' ? 'text-orange-900 dark:text-orange-300' :
                feedback.finalRecommendation === 'Reject' ? 'text-red-900 dark:text-red-300' : 
                'text-gray-900 dark:text-gray-100'
              }`}>{feedback.finalRecommendation || "Not Decided"}</div>
            </div>
            
            {feedback.finalComment && (
              <div className="text-sm p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-white/40 dark:border-white/10 text-gray-800 dark:text-gray-200">
                <span className="font-semibold block mb-1 text-xs opacity-70">Overall Comment:</span>
                {feedback.finalComment}
              </div>
            )}
          </div>

          {/* General Feedback Box */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-bold text-primary mb-4 border-b pb-1">General Feedback</h2>
            
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Problem Solving</h3>
              <p className="text-sm font-semibold capitalize text-primary">{feedback.problemSolvingLevel ? feedback.problemSolvingLevel.replace("_", " ") : "N/A"}</p>
              {feedback.problemSolvingComment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{feedback.problemSolvingComment}"</p>}
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Interpersonal Skills</h3>
              <p className="text-sm font-semibold text-primary">{feedback.interpersonalLevel || "N/A"}</p>
              {feedback.interpersonalComment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{feedback.interpersonalComment}"</p>}
            </div>

            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-1">Language & Environment</h3>
              <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                {feedback.bengaliLevel && <p><span className="text-gray-500 mr-2">Bengali:</span> {feedback.bengaliLevel}</p>}
                {feedback.bengaliComment && <p className="italic text-gray-500 ml-4 mb-2">"{feedback.bengaliComment}"</p>}
                {feedback.englishLevel && <p><span className="text-gray-500 mr-2">English:</span> {feedback.englishLevel}</p>}
                {feedback.englishComment && <p className="italic text-gray-500 ml-4 mb-2">"{feedback.englishComment}"</p>}
                {!feedback.bengaliLevel && !feedback.englishLevel && <p><span className="text-gray-500 mr-2">Language:</span> N/A</p>}
                <p><span className="text-gray-500 mr-2">Camera:</span> {feedback.cameraOn ? "On" : "Off"}</p>
                {feedback.cameraOn && <p className="italic text-gray-500 ml-4">Eye Contact: {feedback.eyeContact}, BG: {feedback.backgroundLevel}</p>}
                {feedback.cameraComment && <p className="italic text-gray-500 ml-4 mt-1">"{feedback.cameraComment}"</p>}
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

              // Map CATEGORIES to a dictionary for label lookup, fallback to capitalized key
              const catMap = CATEGORIES.reduce((acc, cat) => ({...acc, [cat.id]: cat.label}), {});
              
              Object.entries(techEval).forEach(([catId, data]) => {
                const label = catMap[catId] || catId.toUpperCase();
                if (!data || !data.topics) return;
                data.topics.forEach(t => {
                  const item = { ...t, categoryLabel: label };
                  if (t.status === 'solved' || t.status === 'pass') solvedQuestions.push(item);
                  else if (t.status === 'partially_solved') partiallySolvedQuestions.push(item);
                  else if (t.status === 'cant_solve' || t.status === 'fail') cantSolveQuestions.push(item);
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
