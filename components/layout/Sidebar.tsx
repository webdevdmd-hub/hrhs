
import React, { useEffect } from 'react';
import { 
  LayoutDashboard,
  Users, 
  Banknote,
  CalendarDays,
  CalendarClock,
  UserPlus,
  BadgeCheck,
  Briefcase,
  FileText,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Scale,
  PieChart,
  GitBranch,
  Globe,
  Bell,
  Monitor,
  Receipt,
  AlertTriangle,
  Tag,
  Calendar,
  FileSignature,
  MoreHorizontal,
  Building2,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Role } from '../../shared/types';
import { authService } from '../../shared/services/authService';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userRole }) => {
  const location = useLocation();

  // Close sidebar on Escape key press (Mobile accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Comprehensive HR Module List
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Building2 size={20} />, label: 'Company Details', path: '/companies', roles: [Role.ADMIN, Role.CEO] },
    { icon: <Users size={20} />, label: 'User Management', path: '/users', roles: [Role.ADMIN, Role.CEO] },
    { icon: <BadgeCheck size={20} />, label: 'Employees', path: '/employees' },
    { icon: <Banknote size={20} />, label: 'Payroll', path: '/payroll', roles: [Role.ADMIN, Role.CEO] },
    { icon: <CalendarClock size={20} />, label: 'Attendance', path: '/attendance' },
    { icon: <CalendarDays size={20} />, label: 'Leave', path: '/leave' },
    { icon: <UserPlus size={20} />, label: 'Requisitions', path: '/recruitment', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
    { icon: <Briefcase size={20} />, label: 'Job Postings', path: '/recruitment/postings', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
    { icon: <Tag size={20} />, label: 'ATS', path: '/recruitment/ats', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
    { icon: <Calendar size={20} />, label: 'Interviews', path: '/recruitment/interviews', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.INTERVIEWER, Role.HIRING_MANAGER] },
    { icon: <FileSignature size={20} />, label: 'Offers', path: '/recruitment/offers', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
    { icon: <ShieldCheck size={20} />, label: 'Background', path: '/recruitment/background', roles: [Role.ADMIN, Role.CEO, Role.HR] },
    { icon: <PieChart size={20} />, label: 'Recruitment Analytics', path: '/recruitment/analytics', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
    { icon: <Briefcase size={20} />, label: 'Onboarding', path: '/onboarding', roles: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
    { icon: <FileText size={20} />, label: 'Documents', path: '/documents' },
    { icon: <TrendingUp size={20} />, label: 'Performance', path: '/performance' },
    { icon: <UserCheck size={20} />, label: 'My Space (ESS)', path: '/ess' },
    { icon: <ShieldCheck size={20} />, label: 'Manager Zone', path: '/mss' },
    { icon: <Scale size={20} />, label: 'Compliance', path: '/compliance' },
    { icon: <PieChart size={20} />, label: 'Analytics', path: '/analytics' },
    { icon: <GitBranch size={20} />, label: 'Workflows', path: '/workflows' },
    { icon: <Globe size={20} />, label: 'PRO Services', path: '/pro' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
    { icon: <Monitor size={20} />, label: 'Assets', path: '/assets' },
    { icon: <Receipt size={20} />, label: 'Expenses', path: '/expenses' },
    { icon: <AlertTriangle size={20} />, label: 'Disciplinary', path: '/disciplinary' },
  ];

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside 
        aria-label="Sidebar Navigation"
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#0f172a] text-slate-300 shadow-2xl
          transition-transform duration-300 ease-out
          border-r border-slate-700/50
          w-[280px] lg:w-24
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-6 lg:justify-center lg:px-0 bg-blue-600 lg:bg-transparent lg:border-b lg:border-slate-800">
          <div className="flex items-center gap-3 font-bold text-white lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10">
              <LayoutDashboard size={18} aria-hidden="true" />
            </div>
            <span className="text-lg tracking-tight">HR Nexus</span>
          </div>
          
          {/* Desktop Logo (Icon Only) */}
          <div className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20" aria-label="HR Nexus Logo">
            <LayoutDashboard size={20} aria-hidden="true" />
          </div>

          {/* Mobile Close Button */}
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white lg:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close sidebar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation - Flex Column with Scrollable Middle */}
        {/* Using dvh (dynamic viewport height) handles mobile browser address bars better */}
        <nav className="flex h-[calc(100dvh-4rem)] flex-col justify-between px-3 py-4" aria-label="Main Modules">
          
          {/* Scrollable Module List */}
          <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
            {navItems
              .filter(item => !item.roles || item.roles.includes(userRole))
              .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  group flex items-center rounded-xl transition-all duration-200
                  px-4 py-3.5 lg:px-2 lg:py-3
                  lg:flex-col lg:justify-center lg:text-center
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 relative
                  ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}
                `}
              >
                <span className={`transition-transform duration-200 ${item.path === location.pathname ? 'scale-110' : 'group-hover:scale-110'}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span className="ml-3 text-sm font-medium lg:ml-0 lg:mt-1.5 lg:text-[9px] lg:font-medium lg:leading-tight lg:line-clamp-2 lg:px-1">
                  {item.label}
                </span>
                {/* Mobile Active Indicator */}
                <ChevronRight size={16} className="ml-auto opacity-50 lg:hidden" aria-hidden="true" />
              </NavLink>
            ))}
          </div>
          
          {/* Fixed Bottom Actions */}
          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 flex-shrink-0">
            <button 
              type="button"
              className="w-full group flex items-center rounded-xl px-4 py-3.5 lg:px-2 lg:py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-colors lg:flex-col lg:justify-center lg:text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <MoreHorizontal size={22} className="group-hover:text-white transition-colors" aria-hidden="true" />
              <span className="ml-3 text-sm font-medium lg:ml-0 lg:mt-1.5 lg:text-[9px]">More</span>
            </button>
            
            <button 
              type="button"
              className="w-full group flex items-center rounded-xl px-4 py-3.5 lg:px-2 lg:py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors lg:flex-col lg:justify-center lg:text-center focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={handleLogout}
            >
              <LogOut size={22} className="transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              <span className="ml-3 text-sm font-medium lg:ml-0 lg:mt-1.5 lg:text-[9px]">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
