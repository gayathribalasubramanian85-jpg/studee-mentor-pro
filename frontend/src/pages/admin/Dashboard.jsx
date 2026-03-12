import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCard from "@/components/Dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, FileText, Clock, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Upload, Plus, Bell } from "lucide-react";
import adminApi from "@/api/adminApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminApi.getStudentProgress();
        // Map status
        const mapped = data.map(s => {
          const avgScore = s.testsAttended > 0 ? Math.round((s.testsPassed / s.testsAttended) * 100) : 0;
          let status = "on_track";
          if (avgScore >= 90 && s.totalStudyHours > 5) status = "excellent";
          else if (avgScore < 50 || s.totalStudyHours < 2) status = "at_risk";

          return { ...s, status, avgScore };
        });
        setStudents(mapped);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await adminApi.sendReminders();
      toast.success("Reminders sent successfully to students!");
    } catch (error) {
      console.error("Failed to send reminders:", error);
      toast.error("Failed to send reminders. Please try again.");
    } finally {
      setSendingReminders(false);
    }
  };

  const stats = {
    total: students.length,
    excellent: students.filter(s => s.status === "excellent").length,
    onTrack: students.filter(s => s.status === "on_track").length,
    atRisk: students.filter(s => s.status === "at_risk").length,
    avgStudyHours: (students.reduce((sum, s) => sum + parseFloat(s.totalStudyHours || 0), 0) / (students.length || 1)).toFixed(1),
    testsConducted: [...new Set(students.map(s => s.testsAttended || 0))].reduce((a, b) => a + b, 0)
  };

  return (<div className="min-h-screen bg-background">
    <Sidebar userType="admin" />

    <div className="ml-0 lg:ml-64">
      <DashboardHeader title="Faculty Dashboard" userName={`${currentUser?.department || 'Admin'} Admin`} />

      <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link to="/admin/materials" className="flex-1 sm:flex-none">
            <Button variant="hero" className="gap-2 w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Upload Materials
            </Button>
          </Link>
          <Link to="/admin/tests" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create Test
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 w-full sm:w-auto" 
            onClick={handleSendReminders}
            disabled={sendingReminders}
          >
            <Bell className="h-4 w-4" />
            {sendingReminders ? "Sending..." : "Send Reminders"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Students" value={stats.total.toString()} subtitle={`${currentUser?.selectedDepartment || currentUser?.department || 'My'} - ${currentUser?.selectedYear || ''}`} icon={Users} variant="primary" />
          <StatsCard title="Avg Study Hours" value={`${stats.avgStudyHours}h`} subtitle="This week" icon={Clock} trend={0} />
          <StatsCard title="At Risk" value={stats.atRisk.toString()} subtitle="Needs Attention" icon={AlertTriangle} variant={stats.atRisk > 0 ? "destructive" : "default"} />
          <StatsCard title="Performance Index" value={`${Math.round(students.reduce((a, b) => a + b.avgScore, 0) / students.length || 0)}%`} subtitle="Class Avg" icon={TrendingUp} variant="secondary" />
        </div>

        {/* Performance Overview */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Student Performance
                </CardTitle>
                <Link to="/admin/students">
                  <Button variant="ghost" size="sm" className="gap-1 w-full sm:w-auto">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {students.slice(0, 5).map((student) => (<div key={student.studentId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${student.status === "excellent" ? "bg-success/10" :
                      student.status === "on_track" ? "bg-primary/10" :
                        "bg-destructive/10"}`}>
                      {student.status === "excellent" ? (<TrendingUp className="h-4 w-4 text-success" />) : student.status === "on_track" ? (<CheckCircle className="h-4 w-4 text-primary" />) : (<AlertTriangle className="h-4 w-4 text-destructive" />)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{student.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{student.registerNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Study Hours</p>
                      <p className={`font-semibold text-sm sm:text-base ${parseFloat(student.totalStudyHours) < 7 ? "text-destructive" : "text-foreground"}`}>
                        {student.totalStudyHours}h
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Avg Score</p>
                      <p className={`font-semibold text-sm sm:text-base ${student.avgScore < 60 ? "text-destructive" : "text-success"}`}>
                        {student.avgScore}%
                      </p>
                    </div>
                    <Link to="/admin/students">
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>))}
                {students.length === 0 && <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">No students added yet.</p>}
              </div>
            </CardContent>
          </Card>

          {/* At Risk Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                At-Risk Students
              </CardTitle>
              <CardDescription className="text-sm">Students needing attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {students.filter(s => s.status === "at_risk").slice(0, 3).map((student) => (<div key={student.studentId} className="p-3 sm:p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate flex-1 mr-2">{student.name}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive whitespace-nowrap">
                    At Risk
                  </span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Study Hours</span>
                    <span className="text-destructive font-medium">{student.totalStudyHours}h / 7h</span>
                  </div>
                  <Progress value={(parseFloat(student.totalStudyHours) / 7) * 100} className="h-1.5 [&>div]:bg-destructive" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Score</span>
                    <span className="text-destructive font-medium">{student.avgScore}%</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs sm:text-sm">
                  Schedule Counseling
                </Button>
              </div>))}
              {students.filter(s => s.status === "at_risk").length === 0 && <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">All students are on track!</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  </div>);
}
