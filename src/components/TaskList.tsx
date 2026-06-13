import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Calendar,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
  Tag,
  AlertCircle,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types.js";

interface TaskListProps {
  tasks: Task[];
  filters: {
    search: string;
    status: string;
    priority: string;
  };
  onFilterChange: (updates: Partial<{ search: string; status: string; priority: string }>) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenCreateModal: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function TaskList({
  tasks,
  filters,
  onFilterChange,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onOpenCreateModal,
  loading,
  onRefresh,
}: TaskListProps) {
  const [sortBy, setSortBy] = useState<"dueDate" | "title" | "priority" | "createdAt">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Parse priority urgency for sorting
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };

  // Sort logic on local copy
  const sortedTasks = [...tasks].sort((a, b) => {
    let comp = 0;
    if (sortBy === "dueDate") {
      comp = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === "title") {
      comp = a.title.localeCompare(b.title);
    } else if (sortBy === "priority") {
      comp = priorityWeight[a.priority] - priorityWeight[b.priority];
    } else if (sortBy === "createdAt") {
      comp = a.createdAt.localeCompare(b.createdAt);
    }
    return sortOrder === "asc" ? comp : -comp;
  });

  const toggleSort = (field: "dueDate" | "title" | "priority" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getPriorityBadgeColor = (p: TaskPriority) => {
    switch (p) {
      case "High":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "Medium":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "Low":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      default:
        return "bg-slate-500/10 border-slate-705 text-slate-400";
    }
  };

  const getStatusDropColor = (s: TaskStatus) => {
    switch (s) {
      case "Completed":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20 focus:border-emerald-500/60";
      case "In Progress":
        return "text-amber-400 border-amber-500/30 bg-amber-950/20 focus:border-amber-500/60";
      case "Pending":
        return "text-rose-400 border-rose-500/30 bg-rose-950/20 focus:border-rose-500/60";
      default:
        return "text-slate-400 border-slate-750 bg-slate-950/20 focus:border-slate-500/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Work Queue</h2>
          <p className="text-slate-400 text-xs mt-0.5">Manage and organize all your logged tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Real-time search and filter tools */}
      <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search by task title..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative md:col-span-3">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <span className="text-xs">&#9662;</span>
            </div>
          </div>

          {/* Priority filter */}
          <div className="relative md:col-span-3">
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange({ priority: e.target.value })}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <span className="text-xs">&#9662;</span>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => onFilterChange({ search: "", status: "all", priority: "all" })}
            className="md:col-span-1 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sorting Tabs indicators (Tablet and Mobile Helper) */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Sort by:</span>
        <button
          onClick={() => toggleSort("dueDate")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
            sortBy === "dueDate"
              ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
              : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          Due Date
          {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => toggleSort("priority")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
            sortBy === "priority"
              ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
              : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          Priority
          {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => toggleSort("title")}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all ${
            sortBy === "title"
              ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
              : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          Title
          {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* Task List / Table */}
      {sortedTasks.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl py-14 px-6 text-center shadow-inner flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center p-3 text-slate-600 bg-slate-950/40 rounded-xl mb-4 border border-slate-800/40">
            <FolderOpen className="w-8 h-8" />
          </div>
          <p className="text-white font-medium text-sm">No tasks match your criteria</p>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            Try resetting your filters or log a fresh task to start organizing your schedule tracker.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-5 text-xs text-indigo-400 hover:text-indigo-300 border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all font-semibold cursor-pointer"
          >
            Add A Task
          </button>
        </div>
      ) : (
        <>
          {/* Flat List (Mobile Layout) - Displayed on smallest devices */}
          <div className="block md:hidden space-y-4">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-4 hover:border-slate-700/60 transition-all shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadgeColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-sm tracking-tight">{task.title}</h3>
                  {task.description && (
                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/50">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none appearance-none pr-7 cursor-pointer transition-colors ${getStatusDropColor(
                        task.status
                      )}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <span className="text-[10px]">&#9662;</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {confirmDeleteId === task.id ? (
                      <div className="flex items-center gap-1 bg-red-950/20 border border-red-500/20 px-1 py-0.5 rounded-lg">
                        <button
                          onClick={() => {
                            onDeleteTask(task.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 px-1.5 py-1 rounded transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-slate-400 px-1 hover:text-white"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(task.id)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table (Desktop/Client Layout) - Displayed on widescreen viewports */}
          <div className="hidden md:block overflow-x-auto bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-5">Task Details</th>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Due Date</th>
                  <th className="py-4 px-5">Status Tracking</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-800/10 group transition-all"
                  >
                    {/* Task Title & Description */}
                    <td className="py-4 px-5 max-w-sm">
                      <div className="font-bold text-white tracking-tight">{task.title}</div>
                      {task.description && (
                        <div className="text-slate-400 text-xs font-medium leading-relaxed mt-1 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityBadgeColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-5 text-slate-300 font-medium font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                        {task.dueDate}
                      </span>
                    </td>

                    {/* Status Select dropdown */}
                    <td className="py-4 px-5">
                      <div className="relative inline-block">
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none appearance-none pr-8 cursor-pointer transition-colors ${getStatusDropColor(
                            task.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                          <span className="text-[10px]">&#9662;</span>
                        </div>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {confirmDeleteId === task.id ? (
                          <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-500/20 px-1.5 py-0.5 rounded-lg ml-2">
                            <button
                              onClick={() => {
                                onDeleteTask(task.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[11px] text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(task.id)}
                            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
