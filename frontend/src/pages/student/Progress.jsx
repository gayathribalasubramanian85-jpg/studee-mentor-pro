import { useEffect, useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Award, Clock, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import studentApi from "@/api/studentApi";
import testApi from "@/api/testApi";
import authApi from "@/api/authApi";

export default function StudentProgress() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Student' });
  const [stats, setStats] = useState({ studyHours: 0, testsAttended: 0, passRate: '0%' });
  const [testResults, setTestResults] = useState([]);
  const [studyLogs, setStudyLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, resultsData] = await Promise.all([
          studentApi.getStats(),
          testApi.getTestResults()
        ]);

        setStats(statsData);
        setTestResults(resultsData);
      } catch (error) {
        console.error("Failed to fetch progress data", error);
      }
    };

    fetchData();
  }, []);

  const requiredHours = 7;
  const studyProgress = (parseFloat(stats.studyHours) / requiredHours) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="student" />

      <div className="lg:ml-64">
        <DashboardHeader title="My Progress" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Study Hours</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.studyHours}h</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Tests Completed</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.testsAttended}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-secondary/10 shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Pass Rate</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.passRate}</p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Weekly Study Progress
              </CardTitle>
              <CardDescription className="text-sm">Complete {requiredHours} hours to maintain eligibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{stats.studyHours}h / {requiredHours}h</span>
                </div>
                <Progress value={Math.min(studyProgress, 100)} className="h-3" />
                {studyProgress >= 100 ? (
                  <p className="text-sm text-success flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Weekly requirement completed!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {(requiredHours - parseFloat(stats.studyHours)).toFixed(1)} hours remaining
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Test Results
              </CardTitle>
              <CardDescription className="text-sm">Your performance in completed tests</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result) => {
                    // Calculate percentage score
                    const scorePercentage = Math.round((result.score / result.totalMarks) * 100);
                    const isPassed = result.status === 'pass';
                    
                    return (
                      <div key={result._id} className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm sm:text-base">{result.test?.title || 'Test'}</h4>
                          <div className="flex items-center gap-2">
                            {isPassed ? (
                              <span className="flex items-center gap-1 text-success text-xs sm:text-sm font-medium">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                Passed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-destructive text-xs sm:text-sm font-medium">
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span>Score: <span className="font-medium text-foreground">{scorePercentage}%</span></span>
                            <span>Marks: <span className="font-medium text-foreground">{result.score}/{result.totalMarks}</span></span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Progress value={scorePercentage} className="h-2 mt-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No test results yet. Complete some tests to see your progress!</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
