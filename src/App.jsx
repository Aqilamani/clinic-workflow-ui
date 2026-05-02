import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewWorkflow from "./pages/NewWorkflow";
import WorkflowQueue from "./pages/WorkflowQueue";
import TaskBoard from "./pages/TaskBoard";
import HumanReview from "./pages/HumanReview";
import Profile from "./pages/Profile";

// Stores
import { useAuthStore } from "./store/useAuthStore";
import { useStatsStore } from "./store/useStatsStore";

function App() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);
  const initializeStats = useStatsStore((s) => s.initialize);

  // Restore session on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize stats once we have a session (so RLS lets us read tables)
  useEffect(() => {
    if (session) {
      initializeStats();
    }
  }, [session, initializeStats]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50 min-w-[1024px]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-workflow" element={<NewWorkflow />} />
              <Route path="/queue" element={<WorkflowQueue />} />
              <Route path="/task-board" element={<TaskBoard />} />
              <Route path="/human-review" element={<HumanReview />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>

        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;