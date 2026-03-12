import { useEffect, useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Search, Building, MapPin, Users, Clock, CheckCircle, XCircle, Filter, Calendar, IndianRupee } from "lucide-react";
import studentApi from "@/api/studentApi";
import authApi from "@/api/authApi";
import { toast } from "sonner";

export default function StudentPlacements() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Student' });
  const [studentProfile, setStudentProfile] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [filteredPlacements, setFilteredPlacements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("open");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, jobsData, applicationsData] = await Promise.all([
          studentApi.getProfile(),
          studentApi.getJobs(),
          studentApi.getApplications()
        ]);

        setStudentProfile(profileData);
        setApplications(applicationsData);

        const transformedPlacements = jobsData.map(job => {
          const isEligible = checkEligibility(job, profileData);
          const daysLeft = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
          const isClosed = daysLeft < 0;
          const hasApplied = applicationsData.some(app => app.placement?._id === job._id || app.placement === job._id);
          
          return {
            id: job._id,
            company: job.companyName,
            role: job.role,
            package: job.ctc,
            location: job.location,
            description: job.description,
            deadline: new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            daysLeft: daysLeft,
            status: isEligible ? 'eligible' : 'not_eligible',
            isClosed: isClosed,
            hasApplied: hasApplied,
            requirements: job.criteria,
            applyLink: job.applyLink,
            eligibleDepartments: job.eligibleDepartments || [],
            applicants: 0 // TODO: Get from applications
          };
        });

        setPlacements(transformedPlacements);
        setFilteredPlacements(transformedPlacements);
      } catch (error) {
        console.error("Failed to fetch placements", error);
        toast.error("Failed to load placement drives");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = placements;

    // Filter by tab
    if (activeTab === "open") {
      filtered = filtered.filter(p => !p.isClosed);
    } else if (activeTab === "applied") {
      filtered = filtered.filter(p => p.hasApplied);
    } else if (activeTab === "closed") {
      filtered = filtered.filter(p => p.isClosed);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      if (typeFilter === "eligible") {
        filtered = filtered.filter(p => p.status === "eligible");
      } else if (typeFilter === "not_eligible") {
        filtered = filtered.filter(p => p.status === "not_eligible");
      }
    }

    setFilteredPlacements(filtered);
  }, [searchQuery, typeFilter, placements, activeTab]);

  const checkEligibility = (job, student) => {
    if (!job.criteria) return true;

    if (job.eligibleDepartments && job.eligibleDepartments.length > 0) {
      if (!job.eligibleDepartments.includes(student.department)) {
        return false;
      }
    }

    if (job.criteria.minCGPA && (student.cgpa || 0) < job.criteria.minCGPA) {
      return false;
    }

    if (job.criteria.noBacklogs && (student.backlogs || 0) > 0) {
      return false;
    }

    if (job.criteria.minAttendance && (student.attendance || 0) < job.criteria.minAttendance) {
      return false;
    }

    return true;
  };

  const handleApply = (placement) => {
    setJobToApply(placement);
    setShowConfirmDialog(true);
  };

  const confirmApplication = async () => {
    try {
      // Save application to database
      await studentApi.applyToJob(jobToApply.id);
      
      // Open external application link
      if (jobToApply?.applyLink) {
        window.open(jobToApply.applyLink, '_blank');
      }
      
      toast.success(`Application submitted for ${jobToApply.company}!`);
      
      // Update the placements list to mark as applied
      setPlacements(prev => prev.map(p => 
        p.id === jobToApply.id ? { ...p, hasApplied: true } : p
      ));
      
      // Refresh applications list
      const applicationsData = await studentApi.getApplications();
      setApplications(applicationsData);
      
    } catch (error) {
      console.error("Failed to apply:", error);
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setShowConfirmDialog(false);
      setShowDetailsDialog(false);
    }
  };

  const handleViewDetails = (placement) => {
    setSelectedJob(placement);
    setShowDetailsDialog(true);
  };

  const eligibleCount = placements.filter(p => p.status === 'eligible' && !p.isClosed).length;
  const openDrivesCount = placements.filter(p => !p.isClosed).length;
  const closedDrivesCount = placements.filter(p => p.isClosed).length;
  const avgPackage = placements.length > 0 
    ? (placements.reduce((sum, p) => sum + parseFloat(p.package.replace(/[^\d.]/g, '')), 0) / placements.length).toFixed(1)
    : 0;

  // Calculate eligibility rate
  const eligibilityRate = studentProfile 
    ? Math.round((eligibleCount / Math.max(openDrivesCount, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="student" />

      <div className="lg:ml-64">
        <DashboardHeader title="Placement Portal" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{openDrivesCount}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Active Drives</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-success">{eligibleCount}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Eligible For</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-success/10 shrink-0">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{applications.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Applied</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-secondary/10 shrink-0">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">₹{avgPackage}L</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Package</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-warning/10 shrink-0">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Eligibility Status */}
          {studentProfile && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Your Eligibility Status</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studentProfile.cgpa || 0}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">CGPA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studentProfile.studyHours || 0}h</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Study Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{studentProfile.testScore || 0}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Test Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-success">{eligibleCount}/{openDrivesCount}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Eligible Drives</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Eligibility Rate</span>
                    <span className="font-medium">{eligibilityRate}%</span>
                  </div>
                  <Progress value={eligibilityRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies or roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="not_eligible">Not Eligible</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              All Drives
            </Button>
          </div>

          {/* Tabs and Drives */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto">
              <TabsList className="w-full sm:w-auto min-w-max">
                <TabsTrigger value="open" className="gap-2 text-xs sm:text-sm">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Open Drives</span>
                  <span className="sm:hidden">Open</span>
                  ({openDrivesCount})
                </TabsTrigger>
                <TabsTrigger value="applied" className="gap-2 text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">My Applications</span>
                  <span className="sm:hidden">Applied</span>
                  ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="closed" className="gap-2 text-xs sm:text-sm">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Closed</span>
                  <span className="sm:hidden">Closed</span>
                  ({closedDrivesCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4 sm:mt-6">
              <div className="space-y-4">
                {filteredPlacements.length > 0 ? (
                  filteredPlacements.map((placement) => (
                    <Card key={placement.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex gap-3 sm:gap-4 flex-1">
                            <div className="p-3 sm:p-4 rounded-xl bg-primary/10 h-fit shrink-0">
                              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <h3 className="text-lg sm:text-xl font-bold truncate">{placement.company}</h3>
                                  <p className="text-sm text-muted-foreground truncate">{placement.role}</p>
                                </div>
                                {placement.status === "eligible" ? (
                                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-success/10 text-success flex items-center gap-1 shrink-0">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">You're Eligible!</span>
                                    <span className="sm:hidden">Eligible</span>
                                  </span>
                                ) : (
                                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-destructive/10 text-destructive flex items-center gap-1 shrink-0">
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Not Eligible</span>
                                    <span className="sm:hidden">Not Eligible</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-lg sm:text-2xl font-bold text-success">₹{placement.package}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {placement.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {placement.applicants} applicants
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {placement.daysLeft > 0 ? (
                                    <span className={placement.daysLeft <= 2 ? "text-destructive font-medium" : ""}>
                                      {placement.daysLeft} days left
                                    </span>
                                  ) : (
                                    <span className="text-destructive">Closed</span>
                                  )}
                                </div>
                              </div>

                              {placement.status !== "eligible" && placement.requirements && (
                                <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                                  <p className="text-xs sm:text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    {placement.requirements.minCGPA && studentProfile?.cgpa < placement.requirements.minCGPA 
                                      ? `CGPA is below required ${placement.requirements.minCGPA}`
                                      : placement.requirements.noBacklogs && studentProfile?.backlogs > 0
                                      ? "Study hours 45h is below required 50h"
                                      : "Requirements not met"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {placement.requirements.minCGPA > 0 && `• Min CGPA: ${placement.requirements.minCGPA} (Yours: ${studentProfile?.cgpa || 0})`}
                                  </p>
                                  {placement.requirements.noBacklogs && (
                                    <p className="text-xs text-muted-foreground">• No Standing Backlogs</p>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Button
                                  variant={placement.hasApplied ? "outline" : placement.status === "eligible" ? "default" : "outline"}
                                  disabled={placement.hasApplied || placement.status !== "eligible" || placement.isClosed}
                                  onClick={() => handleApply(placement)}
                                  className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
                                >
                                  {placement.hasApplied ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                      Applied
                                    </>
                                  ) : placement.isClosed ? "Closed" : placement.status === "eligible" ? "Apply Now" : "Apply Now"}
                                </Button>
                                <Button variant="outline" onClick={() => handleViewDetails(placement)} className="w-full sm:w-auto text-xs sm:text-sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-base sm:text-lg font-medium text-muted-foreground">
                        {searchQuery || typeFilter !== "all" 
                          ? "No placement drives match your filters." 
                          : activeTab === "applied"
                          ? "You haven't applied to any drives yet."
                          : activeTab === "closed"
                          ? "No closed drives."
                          : "No active placement drives available."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* View Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              {selectedJob && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="p-3 sm:p-4 rounded-xl bg-primary/10 shrink-0">
                        <Building className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-xl sm:text-2xl truncate">{selectedJob.company}</DialogTitle>
                        <p className="text-sm text-muted-foreground truncate">{selectedJob.role}</p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 p-3 sm:p-4 bg-success/5 rounded-lg border border-success/20">
                        <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xl sm:text-2xl font-bold text-success">{selectedJob.package}</p>
                          <p className="text-xs text-muted-foreground">Package</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{selectedJob.location}</p>
                          <p className="text-xs text-muted-foreground">Location</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-warning shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base">{selectedJob.deadline}</p>
                          <p className="text-xs text-muted-foreground">Deadline</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base">{selectedJob.applicants}</p>
                          <p className="text-xs text-muted-foreground">Applications</p>
                        </div>
                      </div>
                    </div>

                    {/* About the Role */}
                    {selectedJob.description && (
                      <div>
                        <h3 className="font-semibold mb-2 text-sm sm:text-base">About the Role</h3>
                        <p className="text-muted-foreground text-xs sm:text-sm">{selectedJob.description}</p>
                      </div>
                    )}

                    {/* Requirements */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">Requirements</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0" />
                          <span>DSA proficiency</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0" />
                          <span>OOP concepts</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0" />
                          <span>Problem-solving</span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Criteria */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">Eligibility Criteria</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {selectedJob.requirements?.minCGPA > 0 && (
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-xs sm:text-sm text-muted-foreground">Min CGPA</span>
                            <span className={`font-semibold text-sm ${studentProfile?.cgpa >= selectedJob.requirements.minCGPA ? 'text-success' : 'text-destructive'}`}>
                              {selectedJob.requirements.minCGPA}
                            </span>
                          </div>
                        )}
                        
                        {selectedJob.requirements?.minTestScore > 0 && (
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <span className="text-xs sm:text-sm text-muted-foreground">Min Test Score</span>
                            <span className="font-semibold text-success text-sm">
                              {selectedJob.requirements.minTestScore}%
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs sm:text-sm text-muted-foreground">Min Study Hours</span>
                          <span className="font-semibold text-success text-sm">35h</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs sm:text-sm text-muted-foreground">Max Backlogs</span>
                          <span className={`font-semibold text-sm ${selectedJob.requirements?.noBacklogs ? 'text-success' : 'text-muted-foreground'}`}>
                            {selectedJob.requirements?.noBacklogs ? '0' : 'Any'}
                          </span>
                        </div>
                      </div>

                      {selectedJob.eligibleDepartments?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">Eligible Departments:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.eligibleDepartments.map(dept => (
                              <span key={dept} className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full bg-primary/10 text-primary font-medium">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Apply Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={selectedJob.hasApplied || selectedJob.status !== "eligible" || selectedJob.isClosed}
                      onClick={() => {
                        handleApply(selectedJob);
                      }}
                    >
                      {selectedJob.hasApplied ? "Already Applied" : selectedJob.isClosed ? "Position Closed" : selectedJob.status === "eligible" ? "Apply for this Position" : "Not Eligible"}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Confirm Application Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Confirm Application</DialogTitle>
              </DialogHeader>
              
              {jobToApply && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You are about to apply for <span className="font-semibold text-foreground">{jobToApply.role}</span> at <span className="font-semibold text-foreground">{jobToApply.company}</span>.
                  </p>

                  <div className="space-y-3 py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Position</span>
                      <span className="font-semibold text-xs sm:text-sm truncate ml-2">{jobToApply.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Company</span>
                      <span className="font-semibold text-xs sm:text-sm truncate ml-2">{jobToApply.company}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Package</span>
                      <span className="font-semibold text-success text-xs sm:text-sm">{jobToApply.package}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    By applying, your profile and eligibility details will be shared with the placement team.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={confirmApplication}
                    >
                      Confirm Application
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
