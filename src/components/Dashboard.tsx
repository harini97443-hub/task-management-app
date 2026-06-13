import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Play,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Percent,
  PlusSquare,
} from "lucide-react";
import { DashboardStats, Task } from "../types.js";

interface DashboardProps {
  stats: DashboardStats;
  recentTasks: Task[];
  userName: string;
  onNavigateToTasks: () => void;
  onOpenCreateModal: () => void;
}

export default function Dashboard({
  stats,
  recentTasks,
  userName,
  onNavigateToTasks,
  onOpenCreateModal,
}: DashboardProps) {
  // Safe stats check
  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const pending = stats?.pending || 0;
  const inProgress = stats?.inProgress || 0;
  const lowP = stats?.byPriority?.Low || 0;
  const medP = stats?.byPriority?.Medium || 0;
  const highP = stats?.byPriority?.High || 0;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stagger animation helpers
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Hello, {userName}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back to your workspace. Here is your current task summary.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <PlusSquare className="w-4 h-4" />
            Add New Task
          </button>
          <button
            onClick={onNavigateToTasks}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 px-4 rounded-xl cursor-pointer border border-slate-700/60 active:scale-[0.98] transition-all"
          >
            View All Tasks
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">
          Task Statistics
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {/* Card: Total Tasks */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Tasks</span>
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {total}
              </span>
              <span className="text-xs text-slate-500 font-medium">registered</span>
            </div>
          </motion.div>

          {/* Card: Completed Tasks */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Completed Tasks</span>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400 tracking-tight">
                {completed}
              </span>
              <span className="text-xs text-slate-500 font-medium">resolved</span>
            </div>
          </motion.div>

          {/* Card: Pending Tasks */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Pending Tasks</span>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-400 tracking-tight">
                {pending}
              </span>
              <span className="text-xs text-slate-500 font-medium">remaining</span>
            </div>
          </motion.div>

          {/* Card: In Progress Tasks */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">In Progress</span>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Play className="w-5 h-5 pl-0.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-400 tracking-tight">
                {inProgress}
              </span>
              <span className="text-xs text-slate-500 font-medium">active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Analytics & Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Gauge Card */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-400" />
              Progress Rate
            </h3>
            <p className="text-slate-400 text-xs">Measurement of resolved workflows</p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center">
            {/* SVG Arc Circle */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  className="stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={`${2 * Math.PI * 58 * (1 - completionRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white">{completionRate}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Done</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-400 leading-relaxed font-mono">
              {completed} of {total} total tasks resolved.
            </span>
          </div>
        </div>

        {/* Priorities distribution list */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Priorities List
            </h3>
            <p className="text-slate-400 text-xs">Total tasks segregated by urgency</p>
          </div>

          <div className="space-y-4 my-6">
            {/* High Priority Bar */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> High Priority / Urgent
                </span>
                <span className="text-slate-300 font-medium">{highP} ({total > 0 ? Math.round((highP / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (highP / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Priority Bar */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium Priority
                </span>
                <span className="text-slate-300 font-medium">{medP} ({total > 0 ? Math.round((medP / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (medP / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low Priority Bar */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Priority
                </span>
                <span className="text-slate-300 font-medium">{lowP} ({total > 0 ? Math.round((lowP / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (lowP / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center italic">
            Focus on resolving High and Medium items as soon as possible.
          </div>
        </div>

        {/* Quick Recent Activity list */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Recent Tasks</h3>
            <p className="text-slate-400 text-xs">The latest additions to your queue</p>
          </div>

          <div className="my-4 divide-y divide-slate-800/60 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-800">
            {recentTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No tasks logged yet
              </div>
            ) : (
              recentTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div className="truncate max-w-[180px]">
                    <p className="text-slate-200 font-medium truncate">{task.title}</p>
                    <span className="text-[10px] text-slate-500">Due: {task.dueDate}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase border ${
                      task.status === "Completed"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : task.status === "In Progress"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-slate-500/10 border-slate-700 text-slate-400"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onNavigateToTasks}
            className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold border-t border-slate-800 pt-2 transition-colors cursor-pointer"
          >
            Management Panel &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
