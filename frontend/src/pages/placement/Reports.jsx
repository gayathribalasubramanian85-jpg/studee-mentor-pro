import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Building, Download, Target, Award, Briefcase } from "lucide-react";
import placementApi from "@/api/placementApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function PlacementReports() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Placement Officer' });
  const [year, setYear] = useState("2025-26");
  const [department, setDepartment] = useState("all");
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [applicationsData, jobsData, studentsData] = await Promise.all([
          placementApi.getApplications().catch(() => []),
          placementApi.getJobs().catch(() => []),
          placementApi.getAllStudents().catch(() => [])
        ]);

        setApplications(applicationsData);
        setJobs(jobsData);
        setStudents(studentsData);
      } catch (error) {
        console.error("Failed to fetch reports data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected department
  const filteredStudents = department === "all" 
    ? students 
    : students.filter(s => s.department === department);
  
  const filteredApplications = department === "all"
    ? applications
    : applications.filter(app => {
        // Find the student for this application
        const student = students.find(s => s._id === app.student?._id || s._id === app.student);
        return student && student.department === department;
      });

  // Recalculate statistics based on filtered data
  const totalEligible = filteredStudents.length;
  const totalPlaced = filteredApplications.filter(app => app.status === 'selected').length;
  const placementRate = totalEligible > 0 ? ((totalPlaced / totalEligible) * 100).toFixed(1) : 0;
  const totalCompanies = [...new Set(jobs.map(j => j.companyName))].length;
  const newCompaniesThisYear = 12; // TODO: Calculate based on createdAt date

  // Calculate average package from filtered applications
  const filteredPackages = filteredApplications
    .filter(app => app.status === 'selected')
    .map(app => {
      const job = jobs.find(j => j._id === app.placement?._id || j._id === app.placement);
      return job ? parseFloat(job.ctc?.replace(/[^\d.]/g, '') || 0) : 0;
    })
    .filter(p => p > 0);
  
  const avgPackage = filteredPackages.length > 0 
    ? (filteredPackages.reduce((sum, p) => sum + p, 0) / filteredPackages.length).toFixed(1)
    : 0;
  const highestPackage = filteredPackages.length > 0 ? Math.max(...filteredPackages).toFixed(1) : 0;

  // Company-wise selections (filtered)
  const companySelections = jobs.map(job => {
    const jobApplications = filteredApplications.filter(app => 
      (app.placement?._id === job._id || app.placement === job._id)
    );
    const selected = jobApplications.filter(app => app.status === 'selected').length;
    const offered = jobApplications.length;

    return {
      company: job.companyName,
      offered: offered,
      selected: selected,
      package: parseFloat(job.ctc?.replace(/[^\d.]/g, '') || 0)
    };
  }).filter(c => c.offered > 0 || c.selected > 0)
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 6);

  // Top recruiters (companies with most selections) - filtered
  const topRecruiters = [...companySelections]
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 6);

  // Department-wise stats (filtered or single department)
  const departmentsToShow = department === "all" ? [...new Set(students.map(s => s.department))] : [department];
  const departmentStats = departmentsToShow.map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    const deptApplications = applications.filter(app => 
      deptStudents.some(s => s._id === app.student?._id || s._id === app.student)
    );
    const placed = deptApplications.filter(app => app.status === 'selected').length;
    
    return {
      name: dept,
      eligible: deptStudents.length,
      placed: placed,
      percentage: deptStudents.length > 0 ? ((placed / deptStudents.length) * 100).toFixed(1) : 0
    };
  });

  // Package analysis (filtered)
  const packageRanges = [
    { range: '0-3 LPA', min: 0, max: 3, count: 0 },
    { range: '3-5 LPA', min: 3, max: 5, count: 0 },
    { range: '5-7 LPA', min: 5, max: 7, count: 0 },
    { range: '7-10 LPA', min: 7, max: 10, count: 0 },
    { range: '10+ LPA', min: 10, max: Infinity, count: 0 }
  ];

  filteredApplications.filter(app => app.status === 'selected').forEach(app => {
    const job = jobs.find(j => j._id === app.placement?._id || j._id === app.placement);
    if (job) {
      const pkg = parseFloat(job.ctc?.replace(/[^\d.]/g, '') || 0);
      const range = packageRanges.find(r => pkg >= r.min && pkg < r.max);
      if (range) range.count++;
    }
  });

  const handleExport = () => {
    try {
      // Create CSV content
      const csvContent = generateCSVReport();
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with current date and filters
      const date = new Date().toISOString().split('T')[0];
      const deptFilter = department === 'all' ? 'All-Departments' : department;
      const filename = `Placement-Report-${year}-${deptFilter}-${date}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Report exported successfully as ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  const generateCSVReport = () => {
    const headers = [
      'Report Type', 'Academic Year', 'Department Filter', 'Generated On',
      '', // Empty row
      'SUMMARY STATISTICS',
      'Total Eligible Students', 'Total Placed Students', 'Placement Rate (%)', 
      'Average Package (LPA)', 'Highest Package (LPA)', 'Total Companies',
      '', // Empty row
      'DEPARTMENT-WISE BREAKDOWN',
      'Department', 'Eligible Students', 'Placed Students', 'Placement Rate (%)',
      '', // Empty row
      'COMPANY-WISE SELECTIONS',
      'Company Name', 'Total Offers', 'Students Selected', 'Package (LPA)',
      '', // Empty row
      'PACKAGE DISTRIBUTION',
      'Package Range', 'Number of Students',
      '', // Empty row
      'DETAILED STUDENT DATA',
      'Student Name', 'Registration Number', 'Department', 'CGPA', 'Placement Status', 'Company', 'Package (LPA)'
    ];

    let csvRows = [];
    
    // Report header
    csvRows.push(['Placement Report & Analytics']);
    csvRows.push([year, department === 'all' ? 'All Departments' : department, new Date().toLocaleDateString()]);
    csvRows.push(['']); // Empty row
    
    // Summary statistics
    csvRows.push(['SUMMARY STATISTICS']);
    csvRows.push(['Total Eligible Students', totalEligible]);
    csvRows.push(['Total Placed Students', totalPlaced]);
    csvRows.push(['Placement Rate (%)', placementRate]);
    csvRows.push(['Average Package (LPA)', avgPackage]);
    csvRows.push(['Highest Package (LPA)', highestPackage]);
    csvRows.push(['Total Companies', totalCompanies]);
    csvRows.push(['']); // Empty row
    
    // Department-wise breakdown
    csvRows.push(['DEPARTMENT-WISE BREAKDOWN']);
    csvRows.push(['Department', 'Eligible Students', 'Placed Students', 'Placement Rate (%)']);
    departmentStats.forEach(dept => {
      csvRows.push([dept.name, dept.eligible, dept.placed, dept.percentage]);
    });
    csvRows.push(['']); // Empty row
    
    // Company-wise selections
    csvRows.push(['COMPANY-WISE SELECTIONS']);
    csvRows.push(['Company Name', 'Total Offers', 'Students Selected', 'Package (LPA)']);
    companySelections.forEach(company => {
      csvRows.push([company.company, company.offered, company.selected, company.package]);
    });
    csvRows.push(['']); // Empty row
    
    // Package distribution
    csvRows.push(['PACKAGE DISTRIBUTION']);
    csvRows.push(['Package Range', 'Number of Students']);
    packageRanges.filter(r => r.count > 0).forEach(range => {
      csvRows.push([range.range, range.count]);
    });
    csvRows.push(['']); // Empty row
    
    // Detailed student data
    csvRows.push(['DETAILED STUDENT DATA']);
    csvRows.push(['Student Name', 'Registration Number', 'Department', 'CGPA', 'Placement Status', 'Company', 'Package (LPA)']);
    
    filteredStudents.forEach(student => {
      const studentApplication = filteredApplications.find(app => 
        app.student?._id === student._id || app.student === student._id
      );
      
      let status = 'Not Applied';
      let company = '-';
      let packageAmount = '-';
      
      if (studentApplication) {
        status = studentApplication.status === 'selected' ? 'Placed' : 
                 studentApplication.status === 'applied' ? 'Applied' : 
                 studentApplication.status;
        
        if (studentApplication.status === 'selected') {
          const job = jobs.find(j => j._id === studentApplication.placement?._id || j._id === studentApplication.placement);
          if (job) {
            company = job.companyName;
            packageAmount = job.ctc;
          }
        }
      }
      
      csvRows.push([
        student.name || '-',
        student.regNo || student.registerNumber || '-',
        student.department || '-',
        student.cgpa || '-',
        status,
        company,
        packageAmount
      ]);
    });
    
    // Convert to CSV string
    return csvRows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')
    ).join('\n');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="placement" />

      <div className="lg:ml-64">
        <DashboardHeader title="Placement Reports & Analytics" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2024-25">2024-25</SelectItem>
                  <SelectItem value="2023-24">2023-24</SelectItem>
                </SelectContent>
              </Select>

              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {[...new Set(students.map(s => s.department))].map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm opacity-90">Total Placed</p>
                    <p className="text-4xl font-bold mt-1">{totalPlaced}</p>
                    <p className="text-xs opacity-75 mt-1">Out of {totalEligible} eligible</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-success text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm opacity-90">Placement Rate</p>
                    <p className="text-4xl font-bold mt-1">{placementRate}%</p>
                    <p className="text-xs opacity-75 mt-1">+8% from last year</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <Target className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Package</p>
                    <p className="text-4xl font-bold mt-1">₹{avgPackage} LPA</p>
                    <p className="text-xs text-muted-foreground mt-1">Highest: ₹{highestPackage} LPA</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary text-secondary-foreground">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm opacity-90">Companies Visited</p>
                    <p className="text-4xl font-bold mt-1">{totalCompanies}</p>
                    <p className="text-xs opacity-75 mt-1">{newCompaniesThisYear} new this year</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/20">
                    <Building className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="company" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="company" className="text-xs sm:text-sm">Company Analytics</TabsTrigger>
              <TabsTrigger value="department" className="text-xs sm:text-sm">Department Stats</TabsTrigger>
              <TabsTrigger value="package" className="text-xs sm:text-sm">Package Analysis</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Company-wise Selections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Company-wise Selections
                    </CardTitle>
                    <CardDescription>Offers made vs students selected per company</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {companySelections.length > 0 ? (
                      <div className="space-y-6">
                        {companySelections.map((company, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{company.company}</span>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Offers: {company.offered}</span>
                                <span className="text-success font-medium">Selected: {company.selected}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Progress 
                                  value={(company.offered / Math.max(...companySelections.map(c => c.offered))) * 100} 
                                  className="h-2 bg-muted"
                                />
                              </div>
                              <div className="flex-1">
                                <Progress 
                                  value={(company.selected / Math.max(...companySelections.map(c => c.selected))) * 100} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No selection data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Recruiters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Top Recruiters
                    </CardTitle>
                    <CardDescription>Companies with most selections this year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topRecruiters.length > 0 ? (
                      <div className="space-y-4">
                        {topRecruiters.map((company, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{company.company}</span>
                                <span className="text-sm font-semibold">{company.selected} selected</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={(company.selected / totalPlaced) * 100} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground">₹{company.package} LPA</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No recruiter data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="department" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Department-wise Placement Rate - Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Department-wise Placement Rate
                    </CardTitle>
                    <CardDescription>Eligible vs placed students by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {departmentStats.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-end justify-around h-64 border-b border-l pb-2 pl-2">
                          {departmentStats.map((dept, index) => {
                            const maxValue = Math.max(...departmentStats.map(d => d.eligible));
                            const eligibleHeight = (dept.eligible / maxValue) * 100;
                            const placedHeight = (dept.placed / maxValue) * 100;
                            
                            return (
                              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                                <div className="flex items-end gap-1 h-48">
                                  <div 
                                    className="w-8 bg-muted rounded-t"
                                    style={{ height: `${eligibleHeight}%` }}
                                    title={`Eligible: ${dept.eligible}`}
                                  />
                                  <div 
                                    className="w-8 bg-success rounded-t"
                                    style={{ height: `${placedHeight}%` }}
                                    title={`Placed: ${dept.placed}`}
                                  />
                                </div>
                                <span className="text-xs font-medium">{dept.name}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-muted rounded" />
                            <span>Eligible</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-success rounded" />
                            <span>Placed</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No department data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Placement Percentage by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Placement Percentage by Department
                    </CardTitle>
                    <CardDescription>Success rate comparison across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {departmentStats.length > 0 ? (
                      <div className="space-y-4">
                        {departmentStats.map((dept, index) => {
                          const percentage = parseFloat(dept.percentage);
                          const color = percentage >= 70 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-destructive';
                          
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{dept.name}</span>
                                <span className="text-lg font-bold">{dept.placed}/{dept.eligible}({percentage}%)</span>
                              </div>
                              <div className="h-6 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${color} transition-all duration-500`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No department data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="package" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Package Distribution - Donut Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Package Distribution
                    </CardTitle>
                    <CardDescription>Number of students across package ranges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="relative w-64 h-64">
                        {/* Donut Chart using conic-gradient */}
                        <div 
                          className="w-full h-full rounded-full"
                          style={{
                            background: `conic-gradient(
                              from 0deg,
                              #3b82f6 0deg ${(packageRanges[0].count / totalPlaced) * 360}deg,
                              #10b981 ${(packageRanges[0].count / totalPlaced) * 360}deg ${((packageRanges[0].count + packageRanges[1].count) / totalPlaced) * 360}deg,
                              #f59e0b ${((packageRanges[0].count + packageRanges[1].count) / totalPlaced) * 360}deg ${((packageRanges[0].count + packageRanges[1].count + packageRanges[2].count) / totalPlaced) * 360}deg,
                              #6366f1 ${((packageRanges[0].count + packageRanges[1].count + packageRanges[2].count) / totalPlaced) * 360}deg 360deg
                            )`
                          }}
                        >
                          <div className="absolute inset-8 bg-background rounded-full flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-3xl font-bold">{totalPlaced}</p>
                              <p className="text-sm text-muted-foreground">Total Placed</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {packageRanges.filter(r => r.count > 0).map((range, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-orange-500' :
                            'bg-indigo-500'
                          }`} />
                          <span>{range.range}: {range.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Package Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Package Statistics
                    </CardTitle>
                    <CardDescription>Detailed breakdown of compensation offers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-6 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm text-muted-foreground mb-1">Highest Package</p>
                      <p className="text-4xl font-bold text-success">₹{highestPackage} LPA</p>
                      <p className="text-xs text-muted-foreground mt-1">Microsoft - CSE Department</p>
                    </div>

                    <div className="p-6 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground mb-1">Average Package</p>
                      <p className="text-4xl font-bold">₹{avgPackage} LPA</p>
                      <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
                    </div>

                    <div className="p-6 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground mb-1">Median Package</p>
                      <p className="text-4xl font-bold">₹5.2 LPA</p>
                      <p className="text-xs text-muted-foreground mt-1">Middle value of all offers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 sm:space-y-6">
              {/* Monthly Placement Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Placement Trends
                  </CardTitle>
                  <CardDescription>Cumulative placements and offers throughout the academic year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 relative">
                    {/* Area Chart Simulation */}
                    <div className="absolute inset-0 flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                        {/* Offers line (green) */}
                        <path
                          d="M 0 180 L 100 160 L 200 140 L 300 110 L 400 85 L 500 60 L 600 35 L 700 15 L 800 0 L 800 200 L 0 200 Z"
                          fill="rgba(34, 197, 94, 0.2)"
                          stroke="rgb(34, 197, 94)"
                          strokeWidth="2"
                        />
                        {/* Placements line (blue) */}
                        <path
                          d="M 0 190 L 100 175 L 200 155 L 300 130 L 400 105 L 500 80 L 600 55 L 700 30 L 800 10 L 800 200 L 0 200 Z"
                          fill="rgba(59, 130, 246, 0.2)"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-4">
                      <span>Aug</span>
                      <span>Sep</span>
                      <span>Oct</span>
                      <span>Nov</span>
                      <span>Dec</span>
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-green-500 rounded" />
                      <span>Offers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-blue-500 rounded" />
                      <span>Placements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Year-over-Year Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Year-over-Year Comparison</CardTitle>
                    <CardDescription>Placement performance vs previous years</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">2025-26</span>
                        <span className="text-2xl font-bold">56.9%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">336 students placed</p>
                      <span className="text-xs text-success">+8%</span>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">2024-25</span>
                        <span className="text-2xl font-bold">52.4%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">298 students placed</p>
                      <span className="text-xs text-success">+5%</span>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">2023-24</span>
                        <span className="text-2xl font-bold">48.2%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">265 students placed</p>
                      <span className="text-xs text-success">+3%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Sector-wise Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sector-wise Distribution</CardTitle>
                    <CardDescription>Industry sectors hiring students</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { sector: 'IT Services', percentage: 45 },
                      { sector: 'Product Companies', percentage: 20 },
                      { sector: 'Consulting', percentage: 15 },
                      { sector: 'Core Engineering', percentage: 12 },
                      { sector: 'Startups', percentage: 8 }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.sector}</span>
                          <span className="text-sm font-bold">{item.percentage}%</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
