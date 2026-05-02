import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ addToast }) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Sticky Navbar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <Navbar addToast={addToast} />
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {/* The Outlet renders whatever page component matches the current URL */}
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
}