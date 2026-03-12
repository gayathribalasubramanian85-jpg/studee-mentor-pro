import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCard from "@/components/Dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Users, Building, TrendingUp, ArrowRight, Clock, Plus, ExternalLink, Award, Bell } from "lucide-react";
import placementApi from "@/api/placementApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function PlacementDashboard() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Placement Officer' });
  const [activeDrives, setActiveDrives] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching placement dashboard data...");
        
        const [jobsData, studentsData, applicationsData] = await Promise.all([
          placementApi.getJobs().catch(err => {
            console.error("Failed to fetch jobs:", err);
            return [];
          }),
          placementApi.getAllStudents().catch(err => {
            console.error("Failed to fetch students:", err);
            return [];
          }),
          placementApi.getApplications().catch(err => {
            console.error("Failed to fetch applications:", err);
            return [];
          })
        ]);

        console.log("Jobs:", jobsData);
        console.log("Students:", studentsData);
        console.log("Applications:", applicationsData);

        // Map jobs to drives format
        const mappedDrives = jobsData.map(job => {
          const jobApplications = applicationsData.filter(app => app.placement?._id === job._id || app.placement === job._id);
          const eligibleCount = studentsData.filter(s => 
            job.eligibleDepartments?.includes(s.department)
          ).length;
          
          return {
            id: job._id,
            company: job.companyName,
            role: job.role,
            package: job.ctc,
            eligibleDepts: job.eligibleDepartments || [],
            eligibleStudents: eligibleCount,
            applied: jobApplications.length,
            deadline: new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: new Date(job.deadline) > new Date() ? "active" : "closed"
          };
        }).filter(d => d.status === "active").slice(0, 3);

        setActiveDrives(mappedDrives);
        setStudents(studentsData);
        setApplications(applicationsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSendJobReminders = async () => {
    setSendingReminders(true);
    try {
      await placementApi.sendJobReminders();
      toast.success("Job application reminders sent successfully to eligible students!");
    } catch (error) {
      console.error("Failed to send job reminders:", error);
      toast.error("Failed to send job reminders. Please try again.");
    } finally {
      setSendingReminders(false);
    }
  };

  // Calculate department stats from students
  const departmentStats = students.length > 0 
    ? [...new Set(students.map(s => s.department))].map(dept => {
        const deptStudents = students.filter(s => s.department === dept);
        const eligible = deptStudents.length;
        // Count students with 'selected' status in applications
        const placed = applications.filter(app => 
          app.status === 'selected' && 
          deptStudents.some(s => s._id === app.student?._id || s._id === app.student)
        ).length;
        return {
          name: dept,
          eligible,
          placed,
          percentage: eligible > 0 ? Math.round((placed / eligible) * 100) : 0
        };
      })
    : [];

  const stats = {
    activeDrives: activeDrives.length,
    eligibleStudents: students.length,
    partnerCompanies: [...new Set(activeDrives.map(d => d.company))].length,
    placementRate: departmentStats.length > 0 
      ? Math.round(departmentStats.reduce((sum, d) => sum + d.percentage, 0) / departmentStats.length)
      : 0
  };
  return (<div className="min-h-screen bg-background">
    <Sidebar userType="placement" />

    <div className="lg:ml-64">
      <DashboardHeader title="Placement Dashboard" userName={user.name} />

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Quick Action */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Link to="/placement/drives">
            <Button variant="hero" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add New Drive
            </Button>
          </Link>
          <Link to="/placement/eligibility">
            <Button variant="secondary" className="gap-2 w-full sm:w-auto">
              <Award className="h-4 w-4" />
              Check Eligibility
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 w-full sm:w-auto" 
            onClick={handleSendJobReminders}
            disabled={sendingReminders}
          >
            <Bell className="h-4 w-4" />
            {sendingReminders ? "Sending..." : "Send Job Reminders"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Active Drives" value={stats.activeDrives.toString()} subtitle="Currently accepting applications" icon={Briefcase} variant="primary" />
          <StatsCard title="Eligible Students" value={stats.eligibleStudents.toString()} subtitle="Across all departments" icon={Users} />
          <StatsCard title="Partner Companies" value={stats.partnerCompanies.toString()} subtitle="This academic year" icon={Building} variant="secondary" />
          <StatsCard title="Placement Rate" value={`${stats.placementRate}%`} subtitle="Current placement status" icon={TrendingUp} variant="success" />
        </div>

        {/* Active Drives */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Active Placement Drives
              </CardTitle>
              <Link to="/placement/drives">
                <Button variant="ghost" size="sm" className="gap-1">
                  Manage All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {activeDrives.map((drive) => (<Card key={drive.id} variant="interactive">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl gradient-primary">
                      <Building className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${drive.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"}`}>
                      {drive.status === "active" ? "Active" : "Upcoming"}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-foreground text-sm sm:text-base">{drive.company}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">{drive.role}</p>
                  <p className="text-lg sm:text-xl font-bold text-primary mb-4">{drive.package}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Eligible Departments</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {drive.eligibleDepts.map((dept) => (<span key={dept} className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                        {dept}
                      </span>))}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Applications</span>
                      <span className="font-medium">{drive.applied} / {drive.eligibleStudents}</span>
                    </div>
                    <Progress value={(drive.applied / drive.eligibleStudents) * 100} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Deadline: {drive.deadline}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link to="/placement/drives">
                      <Button variant="default" size="sm" className="w-full gap-1">
                        View <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>))}
            </div>
          </CardContent>
        </Card>

        {/* Department-wise Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Department-wise Placement Status
            </CardTitle>
            <CardDescription>Current academic year statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {departmentStats.map((dept) => (<div key={dept.name} className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{dept.name}</h4>
                  <span className="text-sm font-medium text-primary">{dept.percentage}% placed</span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Eligible: {dept.eligible}</span>
                      <span className="text-success">Placed: {dept.placed}</span>
                    </div>
                    <Progress value={dept.percentage} className="h-2" />
                  </div>
                </div>
              </div>))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  </div>);
}
