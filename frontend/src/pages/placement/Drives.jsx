
import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import authApi from "@/api/authApi";
import {
  Plus,
  Building,
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Briefcase,
  Link as LinkIcon,
  Eye,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import placementApi from "@/api/placementApi";

export default function PlacementDrives() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Placement Officer' });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [packageAmount, setPackageAmount] = useState("");
  const [description, setDescription] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minCGPA, setMinCGPA] = useState("6.0");
  const [minPercentage, setMinPercentage] = useState("60");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedYears, setSelectedYears] = useState(["3"]);
  const [noBacklogs, setNoBacklogs] = useState(true);
  const [minTestScore, setMinTestScore] = useState("50");

  const departments = ["MCA", "BCA", "IT", "CS", "DS"];
  const years = ["1", "2", "3"];

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driveToDelete, setDriveToDelete] = useState(null);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const data = await placementApi.getJobs();
        const mappedDrives = data.map(job => ({
          id: job._id,
          company: job.companyName,
          logo: job.companyName.charAt(0).toUpperCase(),
          role: job.role,
          package: job.ctc, // API uses 'ctc', UI uses 'package'
          deadline: job.deadline,
          status: new Date(job.deadline) > new Date() ? "active" : "closed",
          eligibility: { departments: job.eligibleDepartments || [] },
          stats: { applied: 0, eligible: 0 },
          notifications: { sent: false, count: 0 }
        }));
        setDrives(mappedDrives);
      } catch (error) {
        console.error("Failed to fetch drives", error);
        toast.error("Failed to load placement drives");
      } finally {
        setLoading(false);
      }
    };

    fetchDrives();
  }, []);

  const handleAddDrive = async () => {
    if (!companyName.trim() || !role.trim() || !packageAmount.trim() || !deadline) {
      toast.error("Please fill all required fields");
      return;
    }

    if (selectedDepartments.length === 0) {
      toast.error("Please select at least one department");
      return;
    }

    try {
      const payload = {
        companyName: companyName,
        role: role,
        description: description,
        ctc: packageAmount,
        location: location || "TBD",
        deadline: new Date(deadline),
        applyLink: applicationLink,
        eligibleDepartments: selectedDepartments,
        criteria: {
          minCGPA: parseFloat(minCGPA),
          minPercentage: parseInt(minPercentage),
          noBacklogs: noBacklogs
        }
      };

      await placementApi.createJob(payload);

      toast.success("Placement drive created successfully!");

      // Optimistic UI update
      const newDrive = {
        id: Date.now(),
        company: companyName,
        logo: companyName.charAt(0).toUpperCase(),
        role,
        package: packageAmount,
        deadline: deadline,
        status: "active",
        eligibility: { departments: selectedDepartments },
        requirements: {
          minCGPA: parseFloat(minCGPA),
          minPercentage: parseInt(minPercentage),
          noBacklogs: noBacklogs
        },
        stats: { applied: 0, eligible: 0 },
        notifications: { sent: false, count: 0 }
      };
      setDrives([newDrive, ...drives]);

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to create drive", error);
      toast.error(error.response?.data?.message || "Failed to create drive");
    }
  };

  const resetForm = () => {
    setCompanyName("");
    setRole("");
    setPackageAmount("");
    setDescription("");
    setApplicationLink("");
    setLocation("");
    setDeadline("");
    setMinCGPA("6.0");
    setMinPercentage("60");
    setSelectedDepartments([]);
    setSelectedYears(["3"]);
    setNoBacklogs(true);
    setMinTestScore("50");
  };

  const handleDepartmentToggle = (dept) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const handleYearToggle = (year) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "upcoming":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Upcoming</Badge>;
      case "closed":
        return <Badge className="bg-muted text-muted-foreground">Closed</Badge>;
      default:
        return null;
    }
  };

  const handleViewDrive = (drive) => {
    setSelectedDrive(drive);
    setIsViewDialogOpen(true);
  };

  const handleEditDrive = (drive) => {
    setSelectedDrive(drive);
    setCompanyName(drive.company);
    setRole(drive.role);
    setPackageAmount(drive.package);
    setDeadline(new Date(drive.deadline).toISOString().split('T')[0]);
    setSelectedDepartments(drive.eligibility?.departments || []);
    if (drive.requirements) {
      setMinCGPA(drive.requirements.minCGPA?.toString() || "6.0");
      setMinPercentage(drive.requirements.minPercentage?.toString() || "60");
      setNoBacklogs(drive.requirements.noBacklogs !== false);
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateDrive = async () => {
    if (!companyName.trim() || !role.trim() || !packageAmount.trim() || !deadline) {
      toast.error("Please fill all required fields");
      return;
    }

    if (selectedDepartments.length === 0) {
      toast.error("Please select at least one department");
      return;
    }

    try {
      const payload = {
        companyName: companyName,
        role: role,
        description: description,
        ctc: packageAmount,
        location: location || "TBD",
        deadline: new Date(deadline),
        applyLink: applicationLink,
        eligibleDepartments: selectedDepartments,
        criteria: {
          minCGPA: parseFloat(minCGPA),
          minPercentage: parseInt(minPercentage),
          noBacklogs: noBacklogs
        }
      };

      await placementApi.updateJob(selectedDrive.id, payload);
      toast.success("Placement drive updated successfully!");

      // Update local state
      setDrives(drives.map(d =>
        d.id === selectedDrive.id
          ? {
            ...d,
            company: companyName,
            role,
            package: packageAmount,
            deadline: deadline,
            eligibility: { departments: selectedDepartments },
            requirements: {
              minCGPA: parseFloat(minCGPA),
              minPercentage: parseInt(minPercentage),
              noBacklogs: noBacklogs
            }
          }
          : d
      ));

      resetForm();
      setIsEditDialogOpen(false);
      setSelectedDrive(null);
    } catch (error) {
      console.error("Failed to update drive", error);
      toast.error(error.response?.data?.message || "Failed to update drive");
    }
  };

  const handleDeleteDrive = async (driveId) => {
    try {
      await placementApi.deleteJob(driveId);
      setDrives(drives.filter(d => d.id !== driveId));
      toast.success("Placement drive deleted successfully!");
      setIsDeleteDialogOpen(false);
      setDriveToDelete(null);
    } catch (error) {
      console.error("Failed to delete drive", error);
      toast.error(error.response?.data?.message || "Failed to delete drive");
    }
  };

  const confirmDeleteDrive = (drive) => {
    setDriveToDelete(drive);
    setIsDeleteDialogOpen(true);
  };

  const filteredDrives = drives.filter(drive => {
    const matchesSearch =
      drive.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || drive.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="placement" />

      <div className="lg:ml-64">
        <DashboardHeader title="Placement Drives" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:flex-1">
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies or roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add New Drive
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 sm:mx-auto sm:max-w-2xl max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Create New Placement Drive
                  </DialogTitle>
                  <DialogDescription>
                    Add a new company placement drive with eligibility criteria
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Company Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Details
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., TCS, Infosys"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Job Role *</Label>
                        <Input
                          id="role"
                          placeholder="e.g., Software Developer"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="package">Package *</Label>
                        <Input
                          id="package"
                          placeholder="e.g., ₹7 LPA"
                          value={packageAmount}
                          onChange={(e) => setPackageAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Job Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Bangalore, Remote"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Application Deadline *</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the role and requirements"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appLink">Application Link</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="appLink"
                          placeholder="https://company.com/careers/apply"
                          value={applicationLink}
                          onChange={(e) => setApplicationLink(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Criteria */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Eligibility Criteria
                    </h4>

                    <div className="space-y-2">
                      <Label>Eligible Departments *</Label>
                      <div className="flex flex-wrap gap-2">
                        {departments.map(dept => (
                          <Button
                            key={dept}
                            type="button"
                            variant={selectedDepartments.includes(dept) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDepartmentToggle(dept)}
                          >
                            {dept}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="minCGPA">Minimum CGPA</Label>
                        <Input
                          id="minCGPA"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={minCGPA}
                          onChange={(e) => setMinCGPA(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minPercentage">Minimum %</Label>
                        <Input
                          id="minPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={minPercentage}
                          onChange={(e) => setMinPercentage(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="noBacklogs"
                        checked={noBacklogs}
                        onCheckedChange={setNoBacklogs}
                      />
                      <Label htmlFor="noBacklogs" className="cursor-pointer">
                        No active backlogs required
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleAddDrive} className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Create Drive
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Drives Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Placement Drives</CardTitle>
              <CardDescription>
                Manage company drives, eligibility, and track applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDrives.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Company</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="hidden md:table-cell">Package</TableHead>
                        <TableHead className="hidden lg:table-cell">Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDrives.map((drive) => (
                        <TableRow key={drive.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-xs sm:text-sm">{drive.logo}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{drive.company}</p>
                                <p className="text-xs text-muted-foreground truncate sm:hidden">
                                  {drive.role}
                                </p>
                                <p className="text-xs text-muted-foreground md:hidden">
                                  {drive.eligibility?.departments?.join(", ")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{drive.role}</TableCell>
                          <TableCell className="hidden md:table-cell font-semibold text-primary">{drive.package}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(drive.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(drive.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleViewDrive(drive)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditDrive(drive)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => confirmDeleteDrive(drive)}
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
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No drives created yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Drive Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="mx-4 sm:mx-auto sm:max-w-2xl max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  {selectedDrive?.company} - {selectedDrive?.role}
                </DialogTitle>
                <DialogDescription>
                  Placement drive details and eligibility criteria
                </DialogDescription>
              </DialogHeader>

              {selectedDrive && (
                <div className="space-y-6 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Company</Label>
                      <p className="font-medium">{selectedDrive.company}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Role</Label>
                      <p className="font-medium">{selectedDrive.role}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Package</Label>
                      <p className="font-medium text-primary">{selectedDrive.package}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Deadline</Label>
                      <p className="font-medium">
                        {new Date(selectedDrive.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedDrive.status)}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Eligible Departments</Label>
                      <p className="font-medium">{selectedDrive.eligibility?.departments?.join(", ") || "All"}</p>
                    </div>
                  </div>

                  {selectedDrive.requirements && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Eligibility Criteria</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Min CGPA: {selectedDrive.requirements.minCGPA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Min Percentage: {selectedDrive.requirements.minPercentage}%</span>
                        </div>
                        {selectedDrive.requirements.noBacklogs && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-sm">No Active Backlogs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-6">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Drive Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="mx-4 sm:mx-auto sm:max-w-2xl max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Edit Placement Drive
                </DialogTitle>
                <DialogDescription>
                  Update placement drive details and eligibility criteria
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Company Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-company">Company Name *</Label>
                      <Input
                        id="edit-company"
                        placeholder="e.g., TCS, Infosys"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Job Role *</Label>
                      <Input
                        id="edit-role"
                        placeholder="e.g., Software Developer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-package">Package *</Label>
                      <Input
                        id="edit-package"
                        placeholder="e.g., ₹7 LPA"
                        value={packageAmount}
                        onChange={(e) => setPackageAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-deadline">Application Deadline *</Label>
                      <Input
                        id="edit-deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Eligibility Criteria */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Eligibility Criteria
                  </h4>

                  <div className="space-y-2">
                    <Label>Eligible Departments *</Label>
                    <div className="flex flex-wrap gap-2">
                      {departments.map(dept => (
                        <Button
                          key={dept}
                          type="button"
                          variant={selectedDepartments.includes(dept) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDepartmentToggle(dept)}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-minCGPA">Minimum CGPA</Label>
                      <Input
                        id="edit-minCGPA"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={minCGPA}
                        onChange={(e) => setMinCGPA(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-minPercentage">Minimum %</Label>
                      <Input
                        id="edit-minPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={minPercentage}
                        onChange={(e) => setMinPercentage(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-noBacklogs"
                      checked={noBacklogs}
                      onCheckedChange={setNoBacklogs}
                    />
                    <Label htmlFor="edit-noBacklogs" className="cursor-pointer">
                      No active backlogs required
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdateDrive} className="gap-2 w-full sm:w-auto">
                  <Edit className="h-4 w-4" />
                  Update Drive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="mx-4 sm:mx-auto sm:max-w-md max-w-[calc(100vw-2rem)]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Placement Drive
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this placement drive? This action cannot be undone and will remove all associated data.
                </DialogDescription>
              </DialogHeader>

              {driveToDelete && (
                <div className="py-4">
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">{driveToDelete.logo}</span>
                      </div>
                      <div>
                        <p className="font-medium">{driveToDelete.company}</p>
                        <p className="text-sm text-muted-foreground">{driveToDelete.role}</p>
                        <p className="text-xs text-destructive font-medium mt-1">
                          Package: {driveToDelete.package}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDrive(driveToDelete?.id)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Drive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
