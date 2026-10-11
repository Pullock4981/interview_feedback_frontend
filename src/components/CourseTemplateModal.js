"use client";
import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Settings, 
  GripVertical, 
  FileText, 
  Link as LinkIcon, 
  Clipboard, 
  Sparkles, 
  Loader2, 
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/utils/api";

const DEFAULT_CATEGORIES = [
  { id: 'htmlcss', label: 'HTML & CSS', suggestions: [] },
  { id: 'jsts', label: 'JavaScript & TypeScript', suggestions: [] },
  { id: 'reactnext', label: 'React & Next.js', suggestions: [] },
  { id: 'nodeexpress', label: 'Node.js & Express.js', suggestions: [] },
  { id: 'mongodb', label: 'MongoDB', suggestions: [] },
];

// Client-side parser: parses bold headings as categories and preserves each numbered item as one question
function parseDocToCategories(text) {
  const rawLines = text.split(/\r?\n/);
  const categories = [];
  let currentCategory = null;
  let currentQuestion = "";

  const commitCurrentQuestion = () => {
    if (currentCategory && currentQuestion.trim()) {
      const q = currentQuestion.trim();
      if (!currentCategory.suggestions.includes(q)) {
        currentCategory.suggestions.push(q);
      }
      currentQuestion = "";
    }
  };

  const isDocumentTitle = (line, index) => {
    if (index > 4) return false;
    const lower = line.toLowerCase();
    return lower.includes('interview question bank') ||
           lower.includes('question bank') ||
           (lower.includes('interview') && lower.includes('questions') && !/^\d+[\.\)]/.test(line));
  };

  const isHeadingLine = (line, nextLine) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Explicit markdown heading
    if (/^#{1,4}\s+/.test(trimmed)) return true;
    if (/^\*\*.*\*\*$/.test(trimmed) && trimmed.length < 80) return true;

    // Pattern: "1. Interpersonal & Behavioral Questions" or "2. JavaScript Fundamentals"
    const numberedHeadingMatch = trimmed.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
    if (numberedHeadingMatch) {
      const labelPart = numberedHeadingMatch[2].trim();

      // Question opener verbs: if it starts with these, it's definitely a question, NOT a heading!
      const questionVerbs = /^(tell\s+me|describe|explain|what|why|how|design|who|when|where|which|can\s+you|is\s+it|write|compare|given|suppose|look\s+for)\b/i;
      if (questionVerbs.test(labelPart)) {
        return false;
      }

      // If it ends with question mark, it's a question
      if (labelPart.endsWith('?') || labelPart.endsWith('？')) {
        return false;
      }

      // Distinct heading words
      const headingKeywords = /(questions|fundamentals|architecture|authentication|database|security|quality|docker|ci\/cd|system\s+design|scenarios|basics|advanced|concepts|interpersonal|behavioral|frontend|backend|framework|library)/i;
      if (headingKeywords.test(labelPart)) {
        return true;
      }

      // If next non-empty line starts with "1. " or "1) ", this is a section heading whose question list starts from 1
      if (nextLine && /^\s*1[\.\)]\s+/i.test(nextLine)) {
        return true;
      }

      // If short title-like text with no sentence-ending punctuation
      if (labelPart.length <= 50 && !labelPart.includes('?') && !labelPart.endsWith('.')) {
        return true;
      }
    }

    // Subheadings like "PostgreSQL / SQL" or "MongoDB"
    const subHeadingKeywords = /^(postgresql\s*\/\s*sql|mongodb|sql|react|node\.js|typescript|javascript|behavioral)$/i;
    if (subHeadingKeywords.test(trimmed)) {
      return true;
    }

    return false;
  };

  const getHeadingLabel = (line) => {
    return line
      .replace(/^#{1,4}\s+/, '')
      .replace(/^\s*\d+[\.\)]\s*/, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^__|\__$/g, '')
      .replace(/:$/, '')
      .trim();
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Find next non-empty line
    let nextLine = '';
    for (let j = i + 1; j < rawLines.length; j++) {
      if (rawLines[j].trim()) {
        nextLine = rawLines[j].trim();
        break;
      }
    }

    // Skip overarching document title (e.g. Together Initiatives Ltd. Question Bank)
    if (isDocumentTitle(line, i)) {
      continue;
    }

    // Section Heading detection
    if (isHeadingLine(line, nextLine)) {
      commitCurrentQuestion();
      const label = getHeadingLabel(line);
      if (label) {
        const existing = categories.find(c => c.label.toLowerCase() === label.toLowerCase());
        if (existing) {
          currentCategory = existing;
        } else {
          const id = label.toLowerCase().replace(/[^a-z0-9]/g, '') || `cat_${categories.length + 1}`;
          currentCategory = { id, label, suggestions: [] };
          categories.push(currentCategory);
        }
      }
      continue;
    }

    // Scenario questions (e.g. "Scenario 1 — Production API Failure")
    if (/^Scenario\s+\d+/i.test(line)) {
      commitCurrentQuestion();
      currentQuestion = line;
      continue;
    }

    // Numbered Question (e.g. "1. Tell me about...", "2. Tell me about...")
    // Each numbering is preserved as ONE complete question without splitting sentences
    const questionMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
    if (questionMatch) {
      commitCurrentQuestion();

      if (!currentCategory) {
        currentCategory = { id: 'general', label: 'Interpersonal & Behavioral Questions', suggestions: [] };
        categories.push(currentCategory);
      }

      currentQuestion = questionMatch[2].trim();
      continue;
    }

    // Bullet point questions ("- ...", "• ...", "* ...")
    if (/^[-*•–—]\s+/.test(line)) {
      commitCurrentQuestion();

      if (!currentCategory) {
        currentCategory = { id: 'general', label: 'Interpersonal & Behavioral Questions', suggestions: [] };
        categories.push(currentCategory);
      }

      currentQuestion = line.replace(/^[-*•–—]\s+/, '').trim();
      continue;
    }

    // Continuation lines: if line is wrapped across lines or has explanation notes, append to current question
    if (currentQuestion) {
      currentQuestion += " " + line;
    } else if (currentCategory) {
      currentQuestion = line;
    }
  }

  commitCurrentQuestion();

  return categories.filter(c => c.suggestions.length > 0);
}

export default function CourseTemplateModal({ course, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProblemSolving, setShowProblemSolving] = useState(true);
  const [categories, setCategories] = useState([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newTopics, setNewTopics] = useState({});

  // Google Doc Import States
  const [showDocImport, setShowDocImport] = useState(true);
  const [importTab, setImportTab] = useState('url'); // 'url' | 'paste'
  const [docUrl, setDocUrl] = useState("");
  const [docContent, setDocContent] = useState("");
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [importingDoc, setImportingDoc] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/course-templates/${encodeURIComponent(course)}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setShowProblemSolving(data.data.showProblemSolving !== false);
          setCategories(data.data.categories?.length > 0 ? data.data.categories : DEFAULT_CATEGORIES);
        } else {
          setShowProblemSolving(true);
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error("Failed to fetch template", err);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [course]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/course-templates/${encodeURIComponent(course)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showProblemSolving,
          categories
        })
      });
      
      const data = await res.json();
      if (data.success) {
        Swal.fire("Saved!", "Course template updated successfully.", "success");
        if (onSaved) onSaved();
        onClose();
      } else {
        Swal.fire("Error", data.message || "Failed to save template", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleImportDoc = async () => {
    if (importTab === 'url' && !docUrl.trim()) {
      Swal.fire("Notice", "Please enter a valid Google Docs link.", "warning");
      return;
    }
    if (importTab === 'paste' && !docContent.trim()) {
      Swal.fire("Notice", "Please paste your document text.", "warning");
      return;
    }

    setImportingDoc(true);
    try {
      let parsedCategories = [];

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/course-templates/import-doc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docUrl: importTab === 'url' ? docUrl.trim() : null,
            content: importTab === 'paste' ? docContent.trim() : null,
          }),
        }
      );
      const data = await res.json();

      if (data.success && data.data?.categories?.length > 0) {
        parsedCategories = data.data.categories;
      } else {
        const errorMsg = data.error?.message || data.message || "Could not parse questions from document.";
        throw new Error(errorMsg);
      }

      applyParsedCategories(parsedCategories);
    } catch (err) {
      // Offline / local fallback for pasted text
      if (importTab === 'paste' && docContent.trim()) {
        const fallbackCats = parseDocToCategories(docContent.trim());
        if (fallbackCats.length > 0) {
          applyParsedCategories(fallbackCats);
          return;
        }
      }
      Swal.fire("Import Error", err.message || "Failed to load document.", "error");
    } finally {
      setImportingDoc(false);
    }
  };

  const applyParsedCategories = (parsed) => {
    const totalQuestions = parsed.reduce((sum, c) => sum + c.suggestions.length, 0);

    if (importMode === 'replace') {
      setCategories(parsed);
    } else {
      const updated = [...categories];
      parsed.forEach(p => {
        const matchIndex = updated.findIndex(c => 
          c.label.trim().toLowerCase() === p.label.trim().toLowerCase() ||
          c.id === p.id
        );
        if (matchIndex >= 0) {
          const mergedSuggestions = [...updated[matchIndex].suggestions];
          p.suggestions.forEach(s => {
            if (!mergedSuggestions.includes(s)) {
              mergedSuggestions.push(s);
            }
          });
          updated[matchIndex] = {
            ...updated[matchIndex],
            suggestions: mergedSuggestions,
          };
        } else {
          updated.push(p);
        }
      });
      setCategories(updated);
    }

    Swal.fire({
      title: "Questions Loaded!",
      text: `Successfully imported ${parsed.length} sections with ${totalQuestions} questions.`,
      icon: "success",
      timer: 2500,
      showConfirmButton: false,
    });

    if (importTab === 'url') setDocUrl("");
    if (importTab === 'paste') setDocContent("");
  };

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const id = newCategoryLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (categories.find(c => c.id === id)) {
      Swal.fire("Error", "Category with similar name already exists", "error");
      return;
    }
    
    setCategories([...categories, { id, label: newCategoryLabel.trim(), suggestions: [] }]);
    setNewCategoryLabel("");
  };

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleAddTopic = (catId) => {
    const rawTopic = newTopics[catId];
    if (!rawTopic || !rawTopic.trim()) return;
    
    let parsedTopics = [];
    const lines = rawTopic.split('\n').map(l => l.trim()).filter(Boolean);
    
    lines.forEach(line => {
      // Clean leading bullet or number prefix (e.g. "1. ", "- ")
      const clean = line.replace(/^[-*•–—]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
      if (clean) {
        parsedTopics.push(clean);
      }
    });
    
    setCategories(categories.map(c => {
      if (c.id === catId) {
        const newSuggestions = [...c.suggestions];
        parsedTopics.forEach(t => {
          if (!newSuggestions.includes(t)) {
            newSuggestions.push(t);
          }
        });
        return { ...c, suggestions: newSuggestions };
      }
      return c;
    }));
    
    setNewTopics({ ...newTopics, [catId]: "" });
  };

  const handleDeleteTopic = (catId, topicIndex) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        const newSuggestions = [...c.suggestions];
        newSuggestions.splice(topicIndex, 1);
        return { ...c, suggestions: newSuggestions };
      }
      return c;
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configure Interview Form</h2>
              <p className="text-xs text-gray-500">Template for {course}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30 dark:bg-gray-900/20">
          
          {loading ? (
            <div className="flex items-center justify-center h-40">Loading template...</div>
          ) : (
            <>
              {/* General Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">General Sections</h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Problem Solving Section</h4>
                    <p className="text-xs text-gray-500">Include the problem solving evaluation section in the interview form.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={showProblemSolving}
                      onChange={(e) => setShowProblemSolving(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Google Doc Quick Importer */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-850 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary text-white rounded-xl shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        Import from Google Doc
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">New Feature</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Paste your Google Doc link — questions will automatically be organized section by section.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocImport(!showDocImport)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showDocImport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showDocImport && (
                  <div className="space-y-3 pt-1">
                    {/* Tabs: Link vs Text */}
                    <div className="flex items-center gap-2 border-b border-indigo-100 dark:border-gray-700 pb-2">
                      <button
                        onClick={() => setImportTab('url')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          importTab === 'url'
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800"
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Google Doc Link
                      </button>
                      <button
                        onClick={() => setImportTab('paste')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          importTab === 'paste'
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800"
                        }`}
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Paste Text Directly
                      </button>
                    </div>

                    {/* Tab 1: URL Input */}
                    {importTab === 'url' ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://docs.google.com/document/d/.../edit"
                            value={docUrl}
                            onChange={(e) => setDocUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleImportDoc()}
                            className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-inner"
                          />
                          <button
                            onClick={handleImportDoc}
                            disabled={importingDoc}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                          >
                            {importingDoc ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> Load Questions
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-primary" />
                          Doc share permission must be set to <strong>"Anyone with the link can view"</strong>.
                        </p>
                      </div>
                    ) : (
                      /* Tab 2: Raw Text Paste */
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          placeholder={`Paste whole document text here with headings...\n\nExample:\nInterpersonal / Behavioral\n- Question 1\n- Question 2\n\nJavaScript & TypeScript\n- Question 1`}
                          value={docContent}
                          onChange={(e) => setDocContent(e.target.value)}
                          className="w-full text-xs font-mono border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-inner"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleImportDoc}
                            disabled={importingDoc}
                            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {importingDoc ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> Parse & Load Sections
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mode selector */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-500">Action:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="text-primary focus:ring-primary"
                        />
                        Merge with existing sections
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-primary focus:ring-primary"
                        />
                        Replace all existing sections
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Question Bank */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Technical Question Bank ({categories.length} Sections)
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{cat.label}</h4>
                          <span className="text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                            {cat.suggestions?.length || 0} questions
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all rounded"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {cat.suggestions?.map((topic, tidx) => (
                            <span key={tidx} className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-3 py-1.5 rounded-lg text-xs font-medium leading-relaxed shadow-2xs">
                              <span className="max-w-[500px] break-words">{topic}</span>
                              <button 
                                onClick={() => handleDeleteTopic(cat.id, tidx)}
                                className="ml-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                          {(!cat.suggestions || cat.suggestions.length === 0) && (
                            <span className="text-xs text-gray-400 italic">No questions added yet.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="text" 
                            placeholder="Add a new question / topic..." 
                            value={newTopics[cat.id] || ""}
                            onChange={(e) => setNewTopics({...newTopics, [cat.id]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(cat.id)}
                            className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => handleAddTopic(cat.id)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add New Category */}
                  <div className="flex items-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/30">
                    <input 
                      type="text" 
                      placeholder="New Technology / Section Name (e.g. System Design, AWS, Python)" 
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:border-primary"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Section
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Total Sections: <strong>{categories.length}</strong> | Total Questions: <strong>{categories.reduce((sum, c) => sum + (c.suggestions?.length || 0), 0)}</strong>
          </span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2 text-sm"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
