"use client";
import { useState, useEffect, use } from "react";
import { fetchWithAuth } from "@/utils/api";
import { ArrowLeft, User, Mail, Calendar, CheckCircle, Clock, Ban, Eye } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InstructorDetailsPage({ params }) {
  const router = useRouter();
  const id = use(params).id;
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/users/instructors/${id}/interviews`);
        const data = await res.json();
        if (data.success) {
          setInstructor(data.data);
        } else {
          Swal.fire("Error", data.message || "Failed to load details", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Network error", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading details...</div>;
  }

  if (!instructor) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-700">Instructor not found</h2>
        <button onClick={() => router.push("/dashboard/users")} className="mt-4 text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case "Interview Started":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Started</span>;
      case "Draft Saved":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</span>;
      case "Cancelled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1"><Ban className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'Strongly Recommended (Potential Candidate)':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Strongly Recommended</span>;
      case 'Recommended':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">Recommended</span>;
      case 'Need Improvement':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Need Improvement</span>;
      case 'Not Recommended':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Not Recommended</span>;
      default:
        return <span className="text-gray-400 text-xs italic">N/A</span>;
    }
  };

  const completedCount = instructor.interviews?.filter((i) => i.status === "Completed").length || 0;
  const totalCount = instructor.interviews?.length || 0;

  const filteredInterviews = instructor.interviews?.filter(i => {
    if (filter === "All") return true;
    if (filter === "Completed") return i.status === "Completed";
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users" className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 transition-all hover:shadow-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            Instructor Details
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Viewing assigned interviews and feedback details</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start transition-all hover:shadow-md">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-primary/10 shadow-inner text-4xl text-primary font-bold">
          {instructor.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left pt-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{instructor.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {instructor.email}</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className={`w-2 h-2 rounded-full ${instructor.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              {instructor.isActive ? "Active Account" : "Inactive Account"}
            </span>
          </div>
        </div>
        <div className="flex gap-4 pt-2">
          <div 
            onClick={() => setFilter("All")}
            className={`bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border dark:border-gray-700 text-center min-w-[130px] cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700/50 ${filter === "All" ? "ring-2 ring-gray-400 dark:ring-gray-500 shadow-md transform scale-105" : "hover:shadow-sm"}`}
          >
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{totalCount}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1.5">Assigned</div>
          </div>
          <div 
            onClick={() => setFilter("Completed")}
            className={`bg-primary/5 dark:bg-primary/10 rounded-xl p-5 border border-primary/10 dark:border-primary/20 text-center min-w-[130px] cursor-pointer transition-all hover:bg-primary/10 dark:hover:bg-primary/20 ${filter === "Completed" ? "ring-2 ring-primary/50 shadow-md transform scale-105" : "hover:shadow-sm"}`}
          >
            <div className="text-3xl font-extrabold text-primary dark:text-primary-light">{completedCount}</div>
            <div className="text-xs text-primary/80 dark:text-primary-light/80 uppercase font-bold tracking-wider mt-1.5">Completed</div>
          </div>
        </div>
      </div>

      {/* Interviews Table */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
        Interviews Taken
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <th className="px-6 py-4 font-bold">Student</th>
                <th className="px-6 py-4 font-bold">Course / Batch</th>
                <th className="px-6 py-4 text-center font-bold">Status</th>
                <th className="px-6 py-4 text-center font-bold">Recommendation</th>
                <th className="px-6 py-4 text-center font-bold">Levels</th>
                <th className="px-6 py-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredInterviews.map((interview) => (
                <tr key={interview._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{interview.student?.name || "Unknown"}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">{interview.student?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-bold text-gray-700 dark:text-gray-300">{interview.student?.course || "N/A"}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Batch {interview.student?.batch || "N/A"} • Roll {interview.student?.rollNo || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(interview.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getRecommendationBadge(interview.feedback?.finalRecommendation)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {interview.feedback?.status === 'final' ? (
                      <div className="flex flex-col gap-1.5 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                        {interview.feedback?.problemSolvingLevel && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"><span className="text-gray-400 dark:text-gray-500 mr-1">PS:</span>{interview.feedback.problemSolvingLevel}</span>}
                        {interview.feedback?.interpersonalLevel && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"><span className="text-gray-400 dark:text-gray-500 mr-1">IP:</span>{interview.feedback.interpersonalLevel}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/interviews/${interview._id}`}
                      className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 opacity-80 group-hover:opacity-100"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-gray-400 dark:text-gray-500" /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No interviews found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
