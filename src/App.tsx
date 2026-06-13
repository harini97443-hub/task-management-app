import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

import { User, Task, DashboardStats, TaskPriority, TaskStatus } from "./types.js";
import { api, getStoredUser, clearSession } from "./lib/api.js";
import AuthLayout from "./components/AuthLayout.js";
import Dashboard from "./components/Dashboard.js";
import TaskList from "./components/TaskList.js";
import TaskForm from "./components/TaskForm.js";

type Tab = "dashboard" | "tasks";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    byPriority: { Low: 0, Medium: 0, High: 0 },
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
  });

  // Modal control states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // General loading & errors
  const [tasksLoading, setTasksLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [appError, setAppError] = useState("");

  // Mobile menu responsive state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Auth state
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setAuthChecked(true);
  }, []);

  // Fetch stats and tasks upon authentication changes or active listings
  const loadDashboardData = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const liveStats = await api.getDashboardStats();
      setStats(liveStats);
    } catch (err: any) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTasksData = async () => {
    if (!user) return;
    setTasksLoading(true);
    try {
      const fetchedTasks = await api.getTasks(filters);
      setTasks(fetchedTasks);
    } catch (err: any) {
      setAppError(err.message || "Failed to load tasks database.");
    } finally {
      setTasksLoading(false);
    }
  };

  // Trigger loading details accordingly
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasksData();
    }
  }, [user, filters]);

  // Combined full refresh
  const triggerRefresh = async () => {
    setAppError("");
    await Promise.all([loadDashboardData(), loadTasksData()]);
  };

  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setActiveTab("dashboard");
    setAppError("");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setTasks([]);
  };

  // --- CRUD Event Handlers ---

  // Create or Update completion
  const handleFormSubmit = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    status: TaskStatus;
  }) => {
    try {
      if (editingTask) {
        // Edit existing
        await api.updateTask(editingTask.id, taskData);
      } else {
        // Create new
        await api.createTask(taskData);
      }
      setIsFormOpen(false);
      setEditingTask(undefined);
      triggerRefresh();
    } catch (err: any) {
      throw new Error(err.message || "Operation failed.");
    }
  };

  // Direct Inline Status Dropdown Change
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(id, { status: newStatus });
      triggerRefresh();
    } catch (err: any) {
      setAppError(err.message || "Failed to instantly update task status.");
    }
  };

  // Edit action
  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Delete action
  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      triggerRefresh();
    } catch (err: any) {
      setAppError(err.message || "Failed to remove the selected task.");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  // Prevent flash during auth checks
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Not authenticated? Show Login / Registration View
  if (!user) {
    return <AuthLayout onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-white shrink-0">
              Task <span className="text-indigo-400 font-medium">Manager</span>
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("tasks");
                setMobileMenuOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Tasks List
            </button>
          </nav>

          {/* Desktop Right Panel (Profile + Logout) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 px-3 py-1.5 rounded-xl">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile Hambuger Selector */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/55 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Responsive Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden z-30"
          >
            <div className="px-4 pt-3 pb-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2 mb-2">
                <div className="p-1.5 bg-slate-800 rounded-lg text-slate-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-xs truncate">
                  <p className="text-slate-400 text-[10px]">Logged as</p>
                  <p className="text-slate-200 font-bold max-w-[170px] truncate">{user.name}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left inline-flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                    : "text-slate-400"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveTab("tasks");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left inline-flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "tasks"
                    ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                    : "text-slate-400"
                }`}
              >
                <ListTodo className="w-5 h-5" />
                Tasks List
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left inline-flex items-center gap-3.5 px-4 py-3 text-rose-400 font-semibold rounded-xl text-sm hover:bg-slate-800/40 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Layout Wrapper */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {appError && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/25 rounded-2xl flex items-center justify-between text-sm text-red-200">
            <div className="flex items-center gap-3">
              <span className="p-1 px-1.5 bg-red-500/20 border border-red-500/20 rounded-md text-red-400 font-bold text-xs uppercase">Error</span>
              <span>{appError}</span>
            </div>
            <button
              onClick={() => setAppError("")}
              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "dashboard" ? (
              <Dashboard
                stats={stats}
                recentTasks={tasks}
                userName={user.name}
                onNavigateToTasks={() => setActiveTab("tasks")}
                onOpenCreateModal={handleOpenCreateModal}
              />
            ) : (
              <TaskList
                tasks={tasks}
                filters={filters}
                onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
                onStatusChange={handleStatusChange}
                onEditTask={handleEditTaskClick}
                onDeleteTask={handleDeleteTask}
                onOpenCreateModal={handleOpenCreateModal}
                loading={tasksLoading || statsLoading}
                onRefresh={triggerRefresh}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Render pop-up task form modal */}
      <AnimatePresence>
        {isFormOpen && (
          <TaskForm
            task={editingTask}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTask(undefined);
            }}
            onSubmit={handleFormSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
