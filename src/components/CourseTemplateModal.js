"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Settings, GripVertical, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/utils/api";

const DEFAULT_CATEGORIES = [
  { id: 'htmlcss', label: 'HTML & CSS', suggestions: [] },
  { id: 'jsts', label: 'JavaScript & TypeScript', suggestions: [] },
  { id: 'reactnext', label: 'React & Next.js', suggestions: [] },
  { id: 'nodeexpress', label: 'Node.js & Express.js', suggestions: [] },
  { id: 'mongodb', label: 'MongoDB', suggestions: [] },
];

export default function CourseTemplateModal({ course, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProblemSolving, setShowProblemSolving] = useState(true);
  const [categories, setCategories] = useState([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newTopics, setNewTopics] = useState({}); // map of categoryId -> new topic input

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/course-templates/${encodeURIComponent(course)}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setShowProblemSolving(data.data.showProblemSolving !== false);
          setCategories(data.data.categories?.length > 0 ? data.data.categories : DEFAULT_CATEGORIES);
        } else {
          // No template exists yet, load defaults
          setShowProblemSolving(true);
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error("Failed to fetch template", err);
        // Fallback to defaults
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
      if ((line.match(/\?/g) || []).length > 1) {
        const parts = line.split('?').map(p => p.trim()).filter(Boolean);
        parts.forEach(p => parsedTopics.push(p + '?'));
      } else if (line.includes(',') && !line.includes('?')) {
        const parts = line.split(',').map(p => p.trim()).filter(Boolean);
        parsedTopics.push(...parts);
      } else {
        parsedTopics.push(line);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
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
        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-gray-50/30 dark:bg-gray-900/20">
          
          {loading ? (
            <div className="flex items-center justify-center h-40">Loading template...</div>
          ) : (
            <>
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">General Sections</h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Problem Solving Section</h4>
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

              {/* Technical Question Bank */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">Technical Question Bank</h3>
                </div>
                
                <div className="space-y-4">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">{cat.label}</h4>
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {cat.suggestions.map((topic, tidx) => (
                            <span key={tidx} className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-md text-sm font-medium">
                              {topic}
                              <button 
                                onClick={() => handleDeleteTopic(cat.id, tidx)}
                                className="ml-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                          {cat.suggestions.length === 0 && (
                            <span className="text-sm text-gray-400 italic">No topics added yet.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="text" 
                            placeholder="Add a new topic..." 
                            value={newTopics[cat.id] || ""}
                            onChange={(e) => setNewTopics({...newTopics, [cat.id]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(cat.id)}
                            className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 focus:outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => handleAddTopic(cat.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
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
                      placeholder="New Technology Name (e.g. AWS, Python)" 
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:border-primary"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Technology
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
