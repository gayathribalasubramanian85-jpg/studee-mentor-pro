
import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import authApi from "@/api/authApi";
import {
  Search,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  Award,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import placementApi from "@/api/placementApi";

export default function PlacementStudents() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Placement Officer' });
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const departments = ["MCA", "BCA", "IT", "CS", "DS"];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        console.log("Fetching applications...");
        const data = await placementApi.getApplications();
        console.log("Applications received:", data);
        
        // Debug: Log resume paths
        if (data && data.length > 0) {
          console.log("=== RESUME PATHS DEBUG ===");
          data.forEach((app, index) => {
            if (app.student && app.student.resume) {
              console.log(`Application ${index}: Student ${app.student.name}, Resume: "${app.student.resume}"`);
            }
          });
          console.log("=== END RESUME PATHS DEBUG ===");
        }
        
        if (!data) {
          console.log("No data returned, setting empty array");
          setApplications([]);
          setLoading(false);
          return;
        }

        if (!Array.isArray(data)) {
          console.error("Data is not an array:", data);
          setApplications([]);
          setLoading(false);
          return;
        }
        
        const transformedApps = data.map(app => {
          console.log("Processing application:", app);
          return {
            id: app._id,
            student: {
              name: app.student?.name || app.studentName || "Unknown",
              rollNo: app.student?.regNo || app.studentRegNo || "N/A",
              email: app.student?.email || "N/A",
              phone: app.student?.phone || "N/A",
              department: app.student?.department || app.studentDept || "N/A",
              resume: app.student?.resume || null
            },
            company: app.placement?.companyName || app.companyName || "Unknown Company",
            role: app.placement?.role || "N/A",
            appliedAt: new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: app.status || "applied",
            testScore: 0,
            interviewDate: app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : null
          };
        });
        
        console.log("Transformed applications:", transformedApps);
        setApplications(transformedApps);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        console.error("Error response:", error.response);
        console.error("Error message:", error.message);
        setApplications([]);
        
        // Show user-friendly message
        if (error.response?.status === 401) {
          toast.error("Please login as placement officer");
        } else if (error.response?.status === 403) {
          toast.error("Access denied. Placement officer role required.");
        } else if (error.message.includes('Network Error')) {
          toast.error("Cannot connect to server. Please check if backend is running.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleViewResume = (student) => {
    console.log("=== RESUME DEBUG INFO ===");
    console.log("Student resume field:", student.resume);
    console.log("Resume field type:", typeof student.resume);
    
    if (student.resume) {
      // Create a more robust path processing function
      const processResumePath = (resumePath) => {
        if (!resumePath) return '';
        
        // Convert to string and normalize slashes
        let path = String(resumePath).replace(/\\/g, '/');
        
        // Remove various possible prefixes
        const prefixesToRemove = [
          'uploads/',
          './uploads/',
          '/uploads/',
          'backend/uploads/',
          './backend/uploads/'
        ];
        
        for (const prefix of prefixesToRemove) {
          if (path.startsWith(prefix)) {
            path = path.substring(prefix.length);
            break; // Only remove the first matching prefix
          }
        }
        
        return path;
      };
      
      const cleanPath = processResumePath(student.resume);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const resumeUrl = `${baseURL}/uploads/${cleanPath}`;
      
      console.log("Original resume path:", student.resume);
      console.log("Cleaned resume path:", cleanPath);
      console.log("Final resume URL:", resumeUrl);
      console.log("=== END RESUME DEBUG ===");
      
      // Test if the file exists before opening
      fetch(resumeUrl, { method: 'HEAD' })
        .then(response => {
          console.log("File existence check - Status:", response.status);
          if (response.ok) {
            console.log("File exists, opening...");
            window.open(resumeUrl, '_blank');
          } else {
            console.error("File not found at URL:", resumeUrl);
            toast.error("Resume file not found on server");
          }
        })
        .catch(error => {
          console.error("Error checking file existence:", error);
          console.log("Attempting to open anyway...");
          window.open(resumeUrl, '_blank');
        });
    } else {
      console.log("No resume found for student");
      toast.error("Resume not uploaded by student");
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || app.student.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "applied":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Applied</Badge>;
      case "shortlisted":
        return <Badge className="bg-warning/10 text-warning border-warning/20 gap-1"><CheckCircle className="h-3 w-3" />Shortlisted</Badge>;
      case "selected":
        return <Badge className="bg-success/10 text-success border-success/20 gap-1"><Award className="h-3 w-3" />Selected</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === "applied").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    selected: applications.filter(a => a.status === "selected").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="placement" />

      <div className="lg:ml-64">
        <DashboardHeader title="Application Management" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.applied}</p>
                    <p className="text-xs text-muted-foreground">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <CheckCircle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">{stats.shortlisted}</p>
                    <p className="text-xs text-muted-foreground">Shortlisted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Award className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{stats.selected}</p>
                    <p className="text-xs text-muted-foreground">Selected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-full sm:flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Applications</CardTitle>
              <CardDescription>
                Track and manage all placement applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-4 text-muted-foreground">Loading applications...</p>
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Company</TableHead>
                        <TableHead className="hidden md:table-cell">Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Applied On</TableHead>
                        <TableHead className="hidden lg:table-cell">Test Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Interview</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{app.student.name}</p>
                              <p className="text-xs text-muted-foreground">{app.student.rollNo}</p>
                              <div className="sm:hidden mt-1 space-y-1">
                                <p className="text-xs font-medium">{app.company}</p>
                                <p className="text-xs text-muted-foreground">{app.role}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="font-medium text-sm">{app.company}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{app.role}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {app.appliedAt}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <Progress value={app.testScore} className="h-2 w-12" />
                              <span className={`text-sm font-medium ${app.testScore >= 70 ? 'text-success' : app.testScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                                {app.testScore}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {app.interviewDate ? (
                              <div className="text-sm">
                                <p className="font-medium">{app.interviewDate}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="mx-4 sm:mx-auto sm:max-w-2xl max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Application Details</DialogTitle>
                                  <DialogDescription>
                                    {app.student.name}'s application to {app.company}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                  {/* Student Info */}
                                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      Student Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">Name</p>
                                        <p className="font-medium">{app.student.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Roll No</p>
                                        <p className="font-medium">{app.student.rollNo}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Email</p>
                                        <p className="font-medium flex items-center gap-1 text-xs sm:text-sm">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{app.student.email}</span>
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Phone</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {app.student.phone}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Application Info */}
                                  <div className="p-4 rounded-lg border space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      Application Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground mb-1">Company</p>
                                        <p className="font-medium">{app.company}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Role</p>
                                        <p className="font-medium">{app.role}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Applied On</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {app.appliedAt}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Status</p>
                                        {getStatusBadge(app.status)}
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground mb-1">Test Score</p>
                                        <div className="flex items-center gap-2">
                                          <Progress value={app.testScore} className="h-2 w-20" />
                                          <span className="font-medium">{app.testScore}%</span>
                                        </div>
                                      </div>
                                      {app.interviewDate && (
                                        <div>
                                          <p className="text-muted-foreground mb-1">Interview Date</p>
                                          <p className="font-medium">{app.interviewDate}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <Button 
                                      variant="outline" 
                                      className="flex-1 gap-2"
                                      onClick={() => window.location.href = `mailto:${app.student.email}`}
                                    >
                                      <Mail className="h-4 w-4" />
                                      Send Email
                                    </Button>
                                    <Button 
                                      className="flex-1 gap-2"
                                      onClick={() => handleViewResume(app.student)}
                                      disabled={!app.student.resume}
                                    >
                                      <FileText className="h-4 w-4" />
                                      {app.student.resume ? "View Resume" : "No Resume"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">No applications found.</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
