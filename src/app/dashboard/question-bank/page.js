"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

export default function QuestionBankPage() {
  const { user } = useAuth();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBank, setActiveBank] = useState(null);
  
  // For editing
  const [editTitle, setEditTitle] = useState("");
  const [editQuestions, setEditQuestions] = useState({});

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    return fetch(url, { ...options, headers });
  };

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/questions`);
      const data = await res.json();
      if (data.success) {
        setBanks(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleCreateNew = async () => {
    const { value: title } = await Swal.fire({
      title: 'New Question Bank',
      input: 'text',
      inputLabel: 'Title (e.g., MERN Stack Questions)',
      inputPlaceholder: 'Enter title here',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!';
      }
    });

    if (title) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/questions`, {
          method: 'POST',
          body: JSON.stringify({ title, questions: {} })
        });
        const data = await res.json();
        if (data.success) {
          setBanks([data.data, ...banks]);
          handleEdit(data.data);
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to create', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/questions/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          setBanks(banks.filter(b => b._id !== id));
          if (activeBank?._id === id) setActiveBank(null);
          Swal.fire('Deleted!', 'Question Bank has been deleted.', 'success');
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to delete', 'error');
      }
    }
  };

  const handleEdit = (bank) => {
    setActiveBank(bank);
    setEditTitle(bank.title);
    setEditQuestions(JSON.parse(JSON.stringify(bank.questions || {})));
  };

  const handleAddCategory = () => {
    Swal.fire({
      title: 'Add Section',
      input: 'text',
      inputPlaceholder: 'e.g. React.js, Node.js, HTML',
      showCancelButton: true,
      inputValidator: (val) => !val && "Please enter a section name"
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const catName = result.value.trim();
        if (!editQuestions[catName]) {
          setEditQuestions(prev => ({
            ...prev,
            [catName]: { topics: [], comment: "" }
          }));
        }
      }
    });
  };

  const handleRemoveCategory = (catName) => {
    setEditQuestions(prev => {
      const updated = { ...prev };
      delete updated[catName];
      return updated;
    });
  };

  const handleAddQuestion = (catName) => {
    Swal.fire({
      title: 'Add Question',
      input: 'text',
      inputPlaceholder: 'Type question here',
      showCancelButton: true,
      inputValidator: (val) => !val && "Please enter a question"
    }).then(result => {
      if (result.isConfirmed && result.value) {
        setEditQuestions(prev => {
          const updated = { ...prev };
          if (!updated[catName].topics) updated[catName].topics = [];
          updated[catName].topics.push({ name: result.value.trim(), status: 'pending' });
          return updated;
        });
      }
    });
  };

  const handleRemoveQuestion = (catName, qIndex) => {
    setEditQuestions(prev => {
      const updated = { ...prev };
      updated[catName].topics.splice(qIndex, 1);
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/questions/${activeBank._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, questions: editQuestions })
      });
      const data = await res.json();
      if (data.success) {
        setBanks(banks.map(b => b._id === activeBank._id ? data.data : b));
        setActiveBank(data.data);
        Swal.fire({ title: 'Saved!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to save', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Question Banks</h1>
          <p className="text-gray-500 mt-1">Manage your custom interview question banks.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* List of Banks */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold">
            Your Libraries
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {banks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No banks found.</p>
            ) : (
              banks.map(bank => (
                <div 
                  key={bank._id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center group ${activeBank?._id === bank._id ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  onClick={() => handleEdit(bank)}
                >
                  <span className="font-semibold text-sm truncate pr-2">{bank.title}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(bank._id); }}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[calc(100vh-12rem)] flex flex-col">
          {activeBank ? (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-bold text-lg bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary focus:outline-none transition-colors px-1 py-0.5"
                />
                <div className="flex space-x-2">
                  <button onClick={() => setActiveBank(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">Close</button>
                  <button onClick={handleSave} className="px-4 py-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors flex items-center space-x-1">
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="mb-4">
                  <button onClick={handleAddCategory} className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Section (e.g. React.js)</span>
                  </button>
                </div>

                {Object.keys(editQuestions).length === 0 ? (
                  <div className="text-center text-gray-400 py-10 border-2 border-dashed rounded-xl dark:border-gray-700">
                    No sections added yet. Click "Add Section" to begin building your question bank.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(editQuestions).map(catName => (
                      <div key={catName} className="border dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b dark:border-gray-700 flex justify-between items-center">
                          <h3 className="font-bold text-sm">{catName}</h3>
                          <button onClick={() => handleRemoveCategory(catName)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="p-3">
                          <ul className="space-y-2 mb-3">
                            {(editQuestions[catName].topics || []).map((q, qIndex) => (
                              <li key={qIndex} className="flex justify-between items-start gap-2 text-sm bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="flex-1">{q.name}</span>
                                <button onClick={() => handleRemoveQuestion(catName, qIndex)} className="text-gray-400 hover:text-red-500 shrink-0"><X className="w-3 h-3" /></button>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => handleAddQuestion(catName)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Question
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center flex-col">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a question bank from the left, or create a new one to start editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
