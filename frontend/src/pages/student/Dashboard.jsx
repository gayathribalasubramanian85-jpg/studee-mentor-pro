
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCard from "@/components/Dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, FileText, Award, ArrowRight, Play, CheckCircle, Calendar, Briefcase } from "lucide-react";
import studentApi from "@/api/studentApi";
import studyApi from "@/api/studyApi";
import testApi from "@/api/testApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function StudentDashboard() {
  const [user, setUser] = useState(authApi.getCurrentUser() || { name: 'Student' });
  const [studentProfile, setStudentProfile] = useState(null);
  const [stats, setStats] = useState({ studyHours: 0, testsAttended: 0, passRate: '0%' });
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  const requiredHours = 7;
  const studyProgress = (parseFloat(stats.studyHours) / requiredHours) * 100;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Student Profile first
        const profileData = await studentApi.getProfile();
        setStudentProfile(profileData);

        // Fetch Stats
        const statsData = await studentApi.getStats();
        setStats(statsData);

        // Fetch Tests (Upcoming)
        const testsData = await testApi.getTests();
        // Transform to match UI structure
        setUpcomingTests(testsData.map(t => ({
          id: t._id,
          title: t.title,
          date: "Flexible", // Backend doesn't have date yet, assumes flexible
          time: "Anytime",
          duration: `${t.duration} mins`
        })).slice(0, 2));

        // Fetch Materials
        const materialsData = await studyApi.getMaterials();
        setRecentMaterials(materialsData.map(m => ({
          id: m._id,
          title: m.title,
          type: m.type === 'video' ? 'Video' : 'PDF',
          duration: '20 mins', // Placeholder
          completed: false
        })).slice(0, 3));

        // Fetch Placements
        const jobsData = await studentApi.getJobs();

        // Transform jobs with eligibility status
        const transformedPlacements = jobsData.map(job => {
          const isEligible = checkEligibility(job, profileData);
          return {
            id: job._id,
            company: job.companyName,
            role: job.role,
            package: job.ctc,
            status: isEligible ? 'eligible' : 'not_eligible',
            requirements: job.criteria,
            applyLink: job.applyLink
          };
        });
        setPlacements(transformedPlacements);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkEligibility = (job, student) => {
    if (!job.criteria) return true;

    // Check Department
    if (job.eligibleDepartments && job.eligibleDepartments.length > 0) {
      if (!job.eligibleDepartments.includes(student.department)) {
        return false;
      }
    }

    // Check CGPA
    if (job.criteria.minCGPA && (student.cgpa || 0) < job.criteria.minCGPA) {
      return false;
    }

    // Check Backlogs
    if (job.criteria.noBacklogs && (student.backlogs || 0) > 0) {
      return false;
    }

    // Check Attendance
    if (job.criteria.minAttendance && (student.attendance || 0) < job.criteria.minAttendance) {
      return false;
    }

    return true;
  };

  const handleApply = (applyLink) => {
    if (applyLink) {
      window.open(applyLink, '_blank');
    } else {
      toast.error("Application link not available");
    }
  };

  // If loading, we could show a spinner, but to match UI exactly we render with defaults/empty

  return (<div className="min-h-screen bg-background">
    <Sidebar userType="student" />

    <div className="lg:ml-64">
      <DashboardHeader title="Student Dashboard" userName={user.name} />

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Study Hours This Week" value={`${stats.studyHours}h`} subtitle={`${requiredHours}h required`} icon={Clock} variant="primary" />
          <StatsCard title="Tests Completed" value={stats.testsAttended} subtitle="All time" icon={FileText} trend={15} />
          <StatsCard title="Pass Rate" value={stats.passRate} subtitle="Overall performance" icon={Award} variant="success" />
          <StatsCard title="Eligible Drives" value={placements.filter(p => p.status === 'eligible').length} subtitle="Based on criteria" icon={Briefcase} variant="secondary" />
        </div>

        {/* Study Progress */}
        <Card variant="bordered">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Weekly Study Progress</CardTitle>
                <CardDescription className="text-sm">Complete {requiredHours} hours of study to maintain eligibility</CardDescription>
              </div>
              <Link to="/student/study">
                <Button variant="hero" className="gap-2 w-full sm:w-auto">
                  <Play className="h-4 w-4" />
                  Continue Studying
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{stats.studyHours}h / {requiredHours}h</span>
              </div>
              <Progress value={Math.min(studyProgress, 100)} className="h-3" />
              {studyProgress >= 100 ? (<p className="text-sm text-success flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Weekly requirement completed!
              </p>) : (<p className="text-sm text-muted-foreground">
                {(requiredHours - parseFloat(stats.studyHours)).toFixed(1)} hours remaining
              </p>)}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Upcoming Tests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Available Tests
                </CardTitle>
                <Link to="/student/tests">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                    View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTests.length > 0 ? upcomingTests.map((test) => (<div key={test.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">{test.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{test.duration}</p>
                </div>
                <div className="text-right">
                  <Link to="/student/tests">
                    <Button size="sm" variant="outline" className="mt-1 text-xs">
                      Start Test
                    </Button>
                  </Link>
                </div>
              </div>)) : <p className="text-muted-foreground text-sm">No active tests available.</p>}
            </CardContent>
          </Card>

          {/* Recent Materials */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Recent Materials
                </CardTitle>
                <Link to="/student/study">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                    View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMaterials.length > 0 ? recentMaterials.map((material) => (<div key={material.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">{material.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{material.type}</p>
                  </div>
                </div>
                <Button size="sm" variant="default" className="text-xs shrink-0">
                  Start
                </Button>
              </div>)) : <p className="text-muted-foreground text-sm">No materials assigned yet.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Placement Opportunities */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Placement Drives
              </CardTitle>
              <Link to="/student/placements">
                <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm w-full sm:w-auto">
                  View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {placements.length > 0 ? placements.map((placement) => (
                <Card
                  key={placement.id}
                  variant={placement.status === "eligible" ? "interactive" : "default"}
                  className={placement.status !== "eligible" ? "opacity-60 grayscale-[0.5]" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-semibold text-foreground text-sm sm:text-base truncate">{placement.company}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{placement.role}</p>
                      </div>
                      {placement.status === "eligible" ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success shrink-0">
                          Eligible
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive shrink-0">
                          Not Eligible
                        </span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-bold text-primary mb-3">{placement.package}</p>

                    {placement.status !== "eligible" && placement.requirements && (
                      <div className="mb-3 p-2 bg-muted/50 rounded-md text-[10px] space-y-1">
                        <p className="font-semibold text-muted-foreground uppercase tracking-wider">Requirements:</p>
                        {placement.requirements.minCGPA > 0 && (
                          <p className={studentProfile && studentProfile.cgpa < placement.requirements.minCGPA ? "text-destructive" : "text-muted-foreground"}>
                            • Min CGPA: {placement.requirements.minCGPA} (Yours: {studentProfile?.cgpa || 0})
                          </p>
                        )}
                        {placement.requirements.noBacklogs && (
                          <p className={studentProfile && studentProfile.backlogs > 0 ? "text-destructive" : "text-muted-foreground"}>
                            • No Standing Backlogs
                          </p>
                        )}
                      </div>
                    )}

                    <Link to="/student/placements">
                      <Button
                        size="sm"
                        variant={placement.status === "eligible" ? "hero" : "outline"}
                        className="w-full text-xs sm:text-sm"
                        disabled={placement.status !== "eligible"}
                      >
                        {placement.status === "eligible" ? "Apply Now" : "Requirements Not Met"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )) : <p className="col-span-full text-center text-muted-foreground p-6 sm:p-8 bg-muted/20 rounded-xl border border-dashed text-sm">No active placement drives found.</p>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  </div>);
}
