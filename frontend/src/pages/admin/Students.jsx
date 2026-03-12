
import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Users,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Download,
  Upload,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Edit,
  Save,
  Trash2,
  Plus
} from "lucide-react";
import adminApi from "@/api/adminApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function AdminStudents() {
  const currentUser = authApi.getCurrentUser();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    regNo: '',
    department: '',
    year: '',
    placementInterest: false
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    regNo: '',
    department: '',
    year: '',
    password: '',
    placementInterest: false
  });
  const [adding, setAdding] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const departments = ["MCA", "BCA", "IT", "CS", "DS"];
  const years = ["1st Year", "2nd Year", "3rd Year"];

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadStudents = async () => {
    try {
      const data = await adminApi.getStudentProgress();
      console.log("Fetched student data:", data);
      
      if (!data || data.length === 0) {
        console.warn("No students found for this department/year");
        setStudents([]);
        setLoading(false);
        return;
      }
      
      // Map API data to component state
      const mappedStudents = data.map((s, index) => {
        const avgScore = s.testsAttended > 0 ? Math.round((s.testsPassed / s.testsAttended) * 100) : 0;
        let status = "on_track";
        if (avgScore >= 90 && s.totalStudyHours > 5) status = "excellent";
        else if (avgScore < 50 || s.totalStudyHours < 2) status = "at_risk";

        return {
          id: s.studentId,
          name: s.name,
          regNo: s.registerNumber,
          email: s.email,
          department: s.department || "N/A",
          year: s.year || "N/A",
          resume: s.resume, // Add resume field
          studyHours: {
            current: parseFloat(s.totalStudyHours) || 0,
            target: 7,
            trend: "stable"
          },
          testsCompleted: s.testsAttended || 0,
          testsPassed: s.testsPassed || 0,
          avgScore: avgScore,
          attendance: 85 + (index % 15),
          status: status,
          placementInterest: s.interestedInPlacement
        };
      });
      setStudents(mappedStudents);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.info(`Selected file: ${file.name}`);
    }
  };

  const handleCsvUpload = async () => {
    if (!selectedFile) return;

    const toastId = toast.loading("Uploading students...");
    setUploading(true);

    try {
      const result = await adminApi.uploadStudentsCsv(selectedFile);
      toast.success(`Success! ${result.inserted} students added, ${result.skipped} skipped.`, {
        id: toastId,
        description: result.errors.length > 0 ? `Note: ${result.errors.length} rows had issues.` : null
      });
      setSelectedFile(null); // Clear after success
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload CSV", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // Filter students based on selection
  const filteredStudents = students.filter(student => {
    const matchesDepartment = selectedDepartment === "all" || student.department === selectedDepartment;
    const matchesYear = selectedYear === "all" || student.year === selectedYear;
    const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesYear && matchesStatus && matchesSearch;
  });

  // Stats calculations
  const stats = {
    total: filteredStudents.length,
    excellent: filteredStudents.filter(s => s.status === "excellent").length,
    onTrack: filteredStudents.filter(s => s.status === "on_track").length,
    atRisk: filteredStudents.filter(s => s.status === "at_risk").length,
    avgStudyHours: (filteredStudents.reduce((sum, s) => sum + s.studyHours.current, 0) / filteredStudents.length || 0).toFixed(1),
    avgScore: Math.round(filteredStudents.reduce((sum, s) => sum + s.avgScore, 0) / filteredStudents.length || 0),
    avgAttendance: Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / filteredStudents.length || 0),
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-success/10 text-success border-success/20">Excellent</Badge>;
      case "on_track":
        return <Badge className="bg-primary/10 text-primary border-primary/20">On Track</Badge>;
      case "at_risk":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">At Risk</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-success" />;
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export");
      return;
    }

    // Prepare data for export
    const exportData = filteredStudents.map(student => ({
      'Name': student.name,
      'Register Number': student.regNo,
      'Email': student.email,
      'Department': student.department,
      'Year': student.year,
      'Study Hours': student.studyHours.current,
      'Target Hours': student.studyHours.target,
      'Tests Completed': student.testsCompleted,
      'Tests Passed': student.testsPassed,
      'Average Score': `${student.avgScore}%`,
      'Attendance': `${student.attendance}%`,
      'Status': student.status,
      'Placement Interest': student.placementInterest ? 'Yes' : 'No'
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${currentUser?.department || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredStudents.length} students to CSV`);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleViewResume = (student) => {
    if (!student.resume) {
      toast.error("No resume uploaded for this student");
      return;
    }

    // Use the same path format as student profile
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanPath = student.resume.replace(/\\/g, '/').replace(/^uploads\//, '');
    const resumeUrl = `${baseURL}/uploads/${cleanPath}`;
    
    // Open resume in new tab
    window.open(resumeUrl, '_blank');
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      regNo: student.registerNumber || student.regNo || '',
      department: student.department,
      year: student.year,
      placementInterest: student.placementInterest || false
    });
    setShowEditDialog(true);
  };

  const handleSaveStudent = async () => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.regNo.trim()) {
      toast.error("Name, email, and register number are required");
      return;
    }

    setSaving(true);
    try {
      // Call API to update student
      await adminApi.updateStudent(editingStudent.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        regNo: editForm.regNo.trim(),
        department: editForm.department,
        year: editForm.year,
        interestedInPlacement: editForm.placementInterest
      });

      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === editingStudent.id 
          ? {
              ...s,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              registerNumber: editForm.regNo.trim(),
              department: editForm.department,
              year: editForm.year,
              placementInterest: editForm.placementInterest
            }
          : s
      ));

      toast.success("Student details updated successfully");
      setShowEditDialog(false);
      setEditingStudent(null);
    } catch (error) {
      console.error("Failed to update student:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to update student details");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = (student) => {
    setDeletingStudent(student);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;

    setDeleting(true);
    try {
      await adminApi.deleteStudent(deletingStudent.id);
      
      // Remove student from local state
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
      
      toast.success(`Student ${deletingStudent.name} deleted successfully`);
      setShowDeleteDialog(false);
      setDeletingStudent(null);
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast.error(error.response?.data?.message || "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddStudent = () => {
    setAddForm({
      name: '',
      email: '',
      regNo: '',
      department: currentUser?.department || '',
      year: '',
      password: '',
      placementInterest: false
    });
    setShowAddDialog(true);
  };

  const handleSaveNewStudent = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.regNo.trim() || 
        !addForm.department || !addForm.year || !addForm.password.trim()) {
      toast.error("All fields are required");
      return;
    }

    setAdding(true);
    try {
      const newStudent = await adminApi.createStudent({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        regNo: addForm.regNo.trim(),
        department: addForm.department,
        year: addForm.year,
        password: addForm.password.trim(),
        interestedInPlacement: addForm.placementInterest
      });

      // Reload students to get the updated list
      await loadStudents();

      toast.success(`Student ${addForm.name} added successfully`);
      setShowAddDialog(false);
      setAddForm({
        name: '',
        email: '',
        regNo: '',
        department: '',
        year: '',
        password: '',
        placementInterest: false
      });
    } catch (error) {
      console.error("Failed to add student:", error);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />

      <div className="ml-0 lg:ml-64">
        <DashboardHeader title="Student Management" userName={`${currentUser?.department || 'Admin'} Admin`} />

        <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-success">{stats.excellent}</p>
                    <p className="text-xs text-muted-foreground">Excellent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-primary">{stats.onTrack}</p>
                    <p className="text-xs text-muted-foreground">On Track</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-destructive">{stats.atRisk}</p>
                    <p className="text-xs text-muted-foreground">At Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.avgStudyHours}h</p>
                    <p className="text-xs text-muted-foreground">Avg Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="relative flex-1 min-w-0 sm:min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or register number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <Button 
                  variant="default" 
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleAddStudent}
                >
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => document.getElementById('csv-upload').click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  <span className="truncate">
                    {selectedFile ? `Change File: ${selectedFile.name.substring(0, 10)}...` : "Select CSV file"}
                  </span>
                </Button>

                {selectedFile && (
                  <Button
                    variant="hero"
                    className="gap-2 w-full sm:w-auto"
                    onClick={handleCsvUpload}
                    disabled={uploading}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Submit CSV
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="gap-2 w-full sm:w-auto"
                  onClick={handleExportStudents}
                  disabled={filteredStudents.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Students ({filteredStudents.length})</CardTitle>
                  <CardDescription className="text-sm">
                    View and manage student performance data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Students Found</h3>
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4 px-4">
                    {students.length === 0 
                      ? "No students are registered for your department and year yet."
                      : "No students match your current filters."}
                  </p>
                  {students.length === 0 && (
                    <Button
                      variant="hero"
                      className="gap-2"
                      onClick={() => document.getElementById('csv-upload').click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Students CSV
                    </Button>
                  )}
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="min-w-[120px]">Study Hours</TableHead>
                      <TableHead className="hidden md:table-cell">Tests</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm sm:text-base">{student.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{student.regNo}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {student.department} • {student.year}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <p className="text-foreground text-sm">{student.department}</p>
                            <p className="text-xs text-muted-foreground">{student.year}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${student.studyHours.current < student.studyHours.target
                              ? "text-destructive"
                              : "text-success"
                              }`}>
                              {student.studyHours.current}h
                            </span>
                            <span className="text-muted-foreground text-xs">/ {student.studyHours.target}h</span>
                          </div>
                          <Progress
                            value={(student.studyHours.current / student.studyHours.target) * 100}
                            className="h-1.5 mt-1 w-16 sm:w-24"
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p className="text-foreground text-sm">
                              <span className="text-success font-medium">{student.testsPassed}</span>
                              <span className="text-muted-foreground"> / {student.testsCompleted}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium text-sm ${student.avgScore < 60 ? "text-destructive" :
                            student.avgScore >= 80 ? "text-success" : "text-foreground"
                            }`}>
                            {student.avgScore}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewStudent(student)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewResume(student)}
                              title="View Resume"
                              disabled={!student.resume}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditStudent(student)}
                              title="Edit Student"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteStudent(student)}
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Student Details
            </DialogTitle>
            <DialogDescription>
              Update student information and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-regNo">Register Number *</Label>
              <Input
                id="edit-regNo"
                value={editForm.regNo}
                onChange={(e) => setEditForm(prev => ({ ...prev, regNo: e.target.value }))}
                placeholder="Enter register number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select 
                  value={editForm.department} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-year">Year</Label>
                <Select 
                  value={editForm.year} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, year: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-placement"
                checked={editForm.placementInterest}
                onChange={(e) => setEditForm(prev => ({ ...prev, placementInterest: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-placement" className="cursor-pointer">
                Interested in placement opportunities
              </Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSaveStudent} 
              className="gap-2 w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={showStudentDetail} onOpenChange={setShowStudentDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedStudent.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <span>{selectedStudent.regNo}</span>
                      <span>•</span>
                      <span>{selectedStudent.department}</span>
                      <span>•</span>
                      <span>{selectedStudent.year}</span>
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedStudent.status)}
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.studyHours.current}h
                        </p>
                        <p className="text-xs text-muted-foreground">Study Hours</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <FileText className="h-6 w-6 mx-auto text-success mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.testsPassed}/{selectedStudent.testsCompleted}
                        </p>
                        <p className="text-xs text-muted-foreground">Tests Passed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <Target className="h-6 w-6 mx-auto text-accent-foreground mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {selectedStudent.avgScore}%
                        </p>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Student Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedStudent.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedStudent.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedStudent.year}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resume</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedStudent.resume ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-success" />
                              <span className="text-sm text-success">Resume uploaded</span>
                            </div>
                            <Button
                              onClick={() => handleViewResume(selectedStudent)}
                              className="w-full"
                              size="sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Resume
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">No resume uploaded</span>
                            </div>
                            <Button
                              disabled
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              No Resume Available
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="weekly" className="mt-4">
                  <div className="text-center p-4 text-muted-foreground">Weekly data not available yet.</div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-md max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingStudent?.name}</strong>? 
              This action cannot be undone and will also delete all related data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Test results</li>
                <li>Study logs</li>
                <li>Job applications</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStudent}
              className="gap-2 w-full sm:w-auto"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="mx-4 sm:mx-auto sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Student
            </DialogTitle>
            <DialogDescription>
              Add a new student to the {currentUser?.department} department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-regNo">Register Number *</Label>
              <Input
                id="add-regNo"
                value={addForm.regNo}
                onChange={(e) => setAddForm(prev => ({ ...prev, regNo: e.target.value }))}
                placeholder="Enter register number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-department">Department *</Label>
              <Input
                id="add-department"
                value={currentUser?.department || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-year">Year *</Label>
              <Select 
                value={addForm.year} 
                onValueChange={(value) => setAddForm(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password *</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-placement"
                checked={addForm.placementInterest}
                onChange={(e) => setAddForm(prev => ({ ...prev, placementInterest: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="add-placement" className="text-sm">
                Interested in Placement
              </Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="w-full sm:w-auto"
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewStudent} 
              className="gap-2 w-full sm:w-auto"
              disabled={adding}
            >
              {adding ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
