
import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Target,
  Clock,
  AlertTriangle,
  Download,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Search
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import adminApi from "@/api/adminApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function AdminReports() {
  const currentUser = authApi.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState("This Semester");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(currentUser?.department || "All Departments");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const reportsData = await adminApi.getReports(
          selectedDeptFilter === "All Departments" ? "All Departments" : selectedDeptFilter
        );
        setData(reportsData);
      } catch (error) {
        console.error("Failed to fetch reports", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedDeptFilter]); // Add selectedDeptFilter as dependency

  const handleDepartmentChange = (newDept) => {
    setSelectedDeptFilter(newDept);
    if (newDept === "All Departments") {
      toast.info("Showing data for all departments");
    } else {
      toast.info(`Filtering data for ${newDept} department`);
    }
  };

  const handleExport = async () => {
    if (!data) {
      toast.error("No data available to export");
      return;
    }

    setIsExporting(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create CSV content
      const csvContent = generateCSVReport(data, selectedDeptFilter, selectedSemester);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Check if browser supports download attribute
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // IE/Edge support
        const date = new Date().toISOString().split('T')[0];
        const deptFilter = selectedDeptFilter === "All Departments" ? "All-Departments" : selectedDeptFilter;
        const filename = `Reports-${deptFilter}-${selectedSemester.replace(' ', '-')}-${date}.csv`;
        window.navigator.msSaveOrOpenBlob(blob, filename);
        toast.success(`Report exported successfully as ${filename} (${data.stats.totalStudents} students)`);
      } else {
        // Modern browsers
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          
          // Generate filename with current date and filters
          const date = new Date().toISOString().split('T')[0];
          const deptFilter = selectedDeptFilter === "All Departments" ? "All-Departments" : selectedDeptFilter;
          const filename = `Reports-${deptFilter}-${selectedSemester.replace(' ', '-')}-${date}.csv`;
          
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // Clean up
          
          toast.success(`Report exported successfully as ${filename} (${data.stats.totalStudents} students, ${deptPerformance.length} departments)`);
        } else {
          // Fallback for very old browsers
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          toast.success(`Report opened in new tab (${data.stats.totalStudents} students). Please save the file manually.`);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSVReport = (reportData, deptFilter, semester) => {
    const { stats, deptPerformance, distribution, studentDetails } = reportData;
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    let csv = '';
    
    // Header
    csv += `PlacePrep - Academic Reports & Analytics\n`;
    csv += `Generated on: ${new Date().toLocaleString()}\n`;
    csv += `Department Filter: ${escapeCSV(deptFilter)}\n`;
    csv += `Period: ${escapeCSV(semester)}\n\n`;
    
    // Summary Statistics
    csv += `SUMMARY STATISTICS\n`;
    csv += `Metric,Value\n`;
    csv += `Total Students,${stats.totalStudents}\n`;
    csv += `Average Performance,${escapeCSV(stats.avgPerformance)}\n`;
    csv += `Average Study Hours,${escapeCSV(stats.avgStudyHours)}\n`;
    csv += `At-Risk Students,${stats.atRiskStudents}\n\n`;
    
    // Department Performance
    csv += `DEPARTMENT-WISE PERFORMANCE\n`;
    csv += `Department,Students,Avg Score (%),Study Hours,Attendance (%),Status\n`;
    deptPerformance.forEach(dept => {
      csv += `${escapeCSV(dept.name)},${dept.students},${dept.avgScore},${dept.studyHours},${dept.attendance},${escapeCSV(dept.status)}\n`;
    });
    csv += `\n`;
    
    // Performance Distribution
    csv += `STUDENT PERFORMANCE DISTRIBUTION\n`;
    csv += `Category,Count\n`;
    distribution.forEach(item => {
      csv += `${escapeCSV(item.name)},${item.value}\n`;
    });
    csv += `\n`;
    
    // Individual Student Details
    if (studentDetails && studentDetails.length > 0) {
      csv += `INDIVIDUAL STUDENT DETAILS\n`;
      csv += `Name,Department,Study Hours,Performance Score (%),Status\n`;
      studentDetails.forEach(student => {
        csv += `${escapeCSV(student.name)},${escapeCSV(student.department)},${student.studyHours},${student.performanceScore},${escapeCSV(student.status)}\n`;
      });
    }
    
    return csv;
  };

  const { stats, deptPerformance, distribution } = data || { stats: {}, deptPerformance: [], distribution: [] };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />

      <div className="lg:ml-64">
        <DashboardHeader
          title={`Reports & Analytics${selectedDeptFilter !== "All Departments" ? ` - ${selectedDeptFilter} Department` : ""}`}
          userName={`${currentUser?.department || 'Admin'} Admin`}
        />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analytics data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This Semester">This Semester</SelectItem>
                      <SelectItem value="Last Semester">Last Semester</SelectItem>
                      <SelectItem value="Full Year">Full Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedDeptFilter} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Departments">All Departments</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="CS">CS</SelectItem>
                      <SelectItem value="DS">DS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleExport} 
                  disabled={isExporting || loading}
                  className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>

          {/* Key Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Students
                    {selectedDeptFilter !== "All Departments" && (
                      <span className="block text-xs text-primary">({selectedDeptFilter})</span>
                    )}
                  </p>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold">{stats?.totalStudents || 0}</h3>
                  <div className="flex items-center text-xs text-success">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>12% from last semester</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Performance</p>
                  <div className="p-2 rounded-lg bg-success/10">
                    <Target className="h-4 w-4 text-success" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold">{stats?.avgPerformance || '0%'}</h3>
                  <div className="flex items-center text-xs text-success">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>5% improvement</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Study Hours</p>
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Clock className="h-4 w-4 text-accent-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold">{stats?.avgStudyHours || '0h'}</h3>
                  <p className="text-xs text-muted-foreground">Target: 7h/week</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-destructive">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">At-Risk Students</p>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-destructive">{stats?.atRiskStudents || 0}</h3>
                  <p className="text-xs text-destructive font-medium">Needs attention</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm sm:text-base">Department-wise Performance</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">Average scores and attendance % by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deptPerformance}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Bar
                        name="Avg Score"
                        dataKey="avgScore"
                        fill="#1e293b"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                      <Bar
                        name="Attendance %"
                        dataKey="attendance"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm sm:text-base">Student Performance Distribution</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">Students categorized by performance range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        formatter={(value, entry) => (
                          <span className="text-xs text-muted-foreground font-medium">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Performance Summary Table */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm sm:text-base">Department Performance Summary</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detailed breakdown of academic metrics per department</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search department..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-xs sm:text-sm">Department</TableHead>
                      <TableHead className="font-semibold text-center text-xs sm:text-sm">Students</TableHead>
                      <TableHead className="font-semibold text-center text-xs sm:text-sm">Avg Score</TableHead>
                      <TableHead className="font-semibold text-center text-xs sm:text-sm hidden sm:table-cell">Study Hours</TableHead>
                      <TableHead className="font-semibold text-center text-xs sm:text-sm">Attendance</TableHead>
                      <TableHead className="font-semibold text-right text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptPerformance.map((dept) => (
                      <TableRow key={dept.name}>
                        <TableCell className="font-bold text-xs sm:text-sm">{dept.name}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{dept.students}</TableCell>
                        <TableCell className="text-center font-medium text-success text-xs sm:text-sm">{dept.avgScore}%</TableCell>
                        <TableCell className="text-center font-medium text-success text-xs sm:text-sm hidden sm:table-cell">{dept.studyHours}h</TableCell>
                        <TableCell className="text-center font-medium text-success text-xs sm:text-sm">{dept.attendance}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-xs ${
                            dept.status === 'Excellent' ? 'bg-success/10 text-success border-success/20' :
                            dept.status === 'Good' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-warning/10 text-warning border-warning/20'
                          }`}>
                            {dept.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
