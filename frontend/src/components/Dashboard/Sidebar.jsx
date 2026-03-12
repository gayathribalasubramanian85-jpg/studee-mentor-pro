import { Link, useLocation } from "react-router-dom";
import { GraduationCap, LayoutDashboard, BookOpen, FileText, BarChart3, Briefcase, Users, Settings, LogOut, Award, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar({ userType = "student" }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-sidebar') && !event.target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const studentLinks = [
    { path: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/student/study", label: "Study Materials", icon: BookOpen },
    { path: "/student/tests", label: "Online Tests", icon: FileText },
    { path: "/student/progress", label: "My Progress", icon: BarChart3 },
    { path: "/student/placements", label: "Placements", icon: Briefcase },
  ];

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/materials", label: "Materials", icon: BookOpen },
    { path: "/admin/tests", label: "Tests", icon: FileText },
    { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  ];

  const placementLinks = [
    { path: "/placement/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/placement/drives", label: "Placement Drives", icon: Briefcase },
    { path: "/placement/eligibility", label: "Eligibility", icon: Award },
    { path: "/placement/students", label: "Students", icon: Users },
    { path: "/placement/reports", label: "Reports", icon: BarChart3 },
  ];

  const links = userType === "student" ? studentLinks : userType === "admin" ? adminLinks : placementLinks;
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary text-primary-foreground shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <aside className={`mobile-sidebar fixed left-0 top-0 h-screen w-64 gradient-primary flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-sidebar-foreground/10">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-sidebar-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-bold text-sidebar-foreground">PlacePrep</span>
              <span className="text-[9px] sm:text-[10px] text-sidebar-foreground/60 -mt-1">
                {userType === "student" ? "Student Portal" : userType === "admin" ? "Faculty Portal" : "Placement Portal"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-sidebar-border space-y-1">
          <Link
            to={userType === "student" ? "/student/profile" : userType === "admin" ? "/admin/settings" : "/placement/settings"}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">{userType === "student" ? "My Profile" : "Settings"}</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive-foreground transition-all duration-200"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
