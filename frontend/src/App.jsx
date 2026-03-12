
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import StudentStudy from "./pages/student/Study";
import StudentTests from "./pages/student/Tests";
import StudentProgress from "./pages/student/Progress";
import StudentPlacements from "./pages/student/Placements";
import StudentProfile from "./pages/student/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMaterials from "./pages/admin/Materials";
import AdminTests from "./pages/admin/Tests";
import AdminStudents from "./pages/admin/Students";
import AdminRetests from "./pages/admin/Retests";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import PlacementDashboard from "./pages/placement/Dashboard";
import PlacementDrives from "./pages/placement/Drives";
import PlacementEligibility from "./pages/placement/Eligibility";
import PlacementStudents from "./pages/placement/Students";
import PlacementReports from "./pages/placement/Reports";
import PlacementSettings from "./pages/placement/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/student/study" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentStudy />
            </RoleBasedRoute>
          } />
          <Route path="/student/tests" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentTests />
            </RoleBasedRoute>
          } />
          <Route path="/student/progress" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentProgress />
            </RoleBasedRoute>
          } />
          <Route path="/student/placements" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentPlacements />
            </RoleBasedRoute>
          } />
          <Route path="/student/profile" element={
            <RoleBasedRoute allowedRoles={['student']}>
              <StudentProfile />
            </RoleBasedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/admin/students" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminStudents />
            </RoleBasedRoute>
          } />
          <Route path="/admin/materials" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminMaterials />
            </RoleBasedRoute>
          } />
          <Route path="/admin/tests" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminTests />
            </RoleBasedRoute>
          } />
          <Route path="/admin/retests" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminRetests />
            </RoleBasedRoute>
          } />
          <Route path="/admin/reports" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminReports />
            </RoleBasedRoute>
          } />
          <Route path="/admin/settings" element={
            <RoleBasedRoute allowedRoles={['faculty']}>
              <AdminSettings />
            </RoleBasedRoute>
          } />

          {/* Placement Routes */}
          <Route path="/placement/dashboard" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/placement/drives" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementDrives />
            </RoleBasedRoute>
          } />
          <Route path="/placement/eligibility" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementEligibility />
            </RoleBasedRoute>
          } />
          <Route path="/placement/students" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementStudents />
            </RoleBasedRoute>
          } />
          <Route path="/placement/reports" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementReports />
            </RoleBasedRoute>
          } />
          <Route path="/placement/settings" element={
            <RoleBasedRoute allowedRoles={['placementofficer']}>
              <PlacementSettings />
            </RoleBasedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
