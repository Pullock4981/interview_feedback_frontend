"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Shield, UserCheck, UserX, Search, BookOpen, CheckCircle, Eye, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

export default function UsersPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInstructors = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/users/instructors/stats`);
      const data = await res.json();
      if (data.success) {
        setInstructors(data.data);
      } else {
        Swal.fire("Error", data.message || "Failed to load instructors", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "reactivate";
    const confirmText = currentStatus ? "Deactivate" : "Reactivate";
    const actionText = currentStatus ? "deactivated" : "reactivated";

    const result = await Swal.fire({
      title: `${confirmText} Instructor?`,
      text: `Are you sure you want to ${action} this instructor?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentStatus ? "#ef4444" : "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${confirmText}`,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/users/${id}/${action}`, {
          method: "PATCH",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire("Success!", `Instructor has been ${actionText}.`, "success");
          fetchInstructors();
        } else {
          Swal.fire("Error", data.error?.message || data.message || "Failed to update status", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Something went wrong", "error");
      }
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete Instructor?",
      text: `Are you sure you want to permanently delete instructor "${name}"? This action cannot be undone.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/users/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire("Deleted!", "Instructor has been deleted.", "success");
          fetchInstructors();
        } else {
          Swal.fire("Error", data.error?.message || data.message || "Failed to delete instructor", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Something went wrong", "error");
      }
    }
  };

  const filteredInstructors = instructors.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            Instructor Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage instructors and view their feedback statistics.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm transition-all"
            />
          </div>
          <div className="text-sm px-4 py-2 bg-primary/5 text-primary rounded-lg font-bold border border-primary/10">
            Total Instructors: {filteredInstructors.length}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-bold tracking-wider">
                  <th className="px-6 py-4 font-bold">Instructor</th>
                  <th className="px-6 py-4 text-center font-bold">Status</th>
                  <th className="px-6 py-4 text-center font-bold">Interviews</th>
                  <th className="px-6 py-4 text-center font-bold">Feedback Breakdown</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredInstructors.map((inst) => (
                  <tr key={inst._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/10 text-lg">
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{inst.name}</div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{inst.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          inst.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inst.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {inst.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs border border-gray-200 dark:border-gray-700 shadow-sm w-max mx-auto">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {inst.completedInterviews} Completed
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700 w-max mx-auto">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          {inst.totalInterviews} Assigned
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <div className="flex flex-col items-center" title="Strong Hire">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">SH</span>
                          <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center justify-center font-bold text-xs shadow-sm">
                            {inst.strongHireCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center" title="Hire">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">H</span>
                          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                            {inst.hireCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center" title="Maybe">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">M</span>
                          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center font-bold text-xs shadow-sm">
                            {inst.maybeCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center" title="Reject">
                          <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">R</span>
                          <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center font-bold text-xs shadow-sm">
                            {inst.rejectCount || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/users/${inst._id}`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:shadow-md dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Link>
                        <button
                          onClick={() => handleToggleActive(inst._id, inst.isActive)}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            inst.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-md dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                              : "bg-green-50 text-green-600 hover:bg-green-500 hover:text-white hover:shadow-md dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-500 dark:hover:text-white"
                          }`}
                        >
                          {inst.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Reactivate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(inst._id, inst.name)}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-md dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInstructors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No instructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
