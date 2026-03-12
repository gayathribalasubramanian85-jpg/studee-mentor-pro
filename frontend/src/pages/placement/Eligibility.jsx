
import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  GraduationCap,
  Building,
  Eye,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import placementApi from "@/api/placementApi";
import authApi from "@/api/authApi";

export default function PlacementEligibility() {
  const [user] = useState(authApi.getCurrentUser() || { name: 'Placement Officer' });
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const departments = ["MCA", "BCA", "IT", "CS", "DS"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching eligibility data...");
        const [studentsData, jobsData] = await Promise.all([
          placementApi.getAllStudents(),
          placementApi.getJobs()
        ]);

        console.log("Students data:", studentsData);
        console.log("Jobs data:", jobsData);

        const processedStudents = studentsData.map(s => {
          const student = {
            id: s._id,
            name: s.name,
            rollNo: s.regNo || s.registerNumber,
            department: s.department,
            year: s.year || 3,
            cgpa: s.cgpa || 0,
            percentage: s.percentage || 0,
            avgTestScore: s.avgTestScore || 0,
            totalTests: s.totalTests || 0,
            passedTests: s.passedTests || 0,
            backlogs: s.backlogs || 0,
            interested: s.interestedInPlacement !== false,
            eligibleFor: [],
            ineligibleReasons: {},
            eligibleReasons: {},
            status: "eligible"
          };
          
          // Precompute search strings for faster filtering
          student.searchString = `${student.name} ${student.rollNo}`.toLowerCase();
          
          return student;
        });

        const processedCompanies = jobsData.map(j => ({
          id: j._id,
          name: j.companyName,
          minCGPA: j.criteria?.minCGPA ?? 0,
          minPercentage: j.criteria?.minPercentage ?? 0,
          minTestScore: j.criteria?.minTestScore ?? 50,
          noBacklogs: j.criteria?.noBacklogs === true
        }));

        // Calculate eligibility immediately
        const studentsWithEligibility = processedStudents.map(student => {
          const eligibleFor = [];
          const ineligibleReasons = {};
          const eligibleReasons = {};
          let isEligibleForAny = false;

          processedCompanies.forEach(company => {
            const reasons = [];
            const eligibleCriteria = [];
            
            if (student.cgpa < company.minCGPA) {
              reasons.push(`CGPA below ${company.minCGPA}`);
            } else {
              eligibleCriteria.push(`CGPA: ${student.cgpa} ≥ ${company.minCGPA}`);
            }
            
            if (student.percentage < company.minPercentage) {
              reasons.push(`Percentage below ${company.minPercentage}`);
            } else {
              eligibleCriteria.push(`Percentage: ${student.percentage}% ≥ ${company.minPercentage}%`);
            }
            
            if (student.avgTestScore < company.minTestScore) {
              reasons.push(`Test score below ${company.minTestScore}%`);
            } else {
              eligibleCriteria.push(`Test Score: ${student.avgTestScore}% ≥ ${company.minTestScore}%`);
            }
            
            if (student.backlogs > 0 && company.noBacklogs) {
              reasons.push("Has active backlogs");
            } else if (company.noBacklogs) {
              eligibleCriteria.push("No active backlogs");
            } else {
              eligibleCriteria.push(`Backlogs allowed (has ${student.backlogs})`);
            }

            if (reasons.length === 0) {
              eligibleFor.push(company.name);
              isEligibleForAny = true;
              eligibleReasons[company.name] = eligibleCriteria.join(", ");
            } else {
              ineligibleReasons[company.name] = reasons.join(", ");
            }
          });

          return {
            ...student,
            eligibleFor,
            ineligibleReasons,
            eligibleReasons,
            status: isEligibleForAny ? "eligible" : "ineligible"
          };
        });

        setStudents(studentsWithEligibility);
        setCompanies(processedCompanies);

      } catch (error) {
        console.error("Failed to fetch eligibility data", error);
        console.error("Error details:", error.response?.data || error.message);
        // Set empty arrays to prevent crashes
        setStudents([]);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Removed the second useEffect - eligibility is now calculated immediately in the first useEffect

  const filteredStudents = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return students.filter(student => {
      const matchesSearch = !searchQuery || student.searchString.includes(searchLower);
      const matchesDepartment = departmentFilter === "all" || student.department === departmentFilter;
      const matchesEligibility = eligibilityFilter === "all" ||
        (eligibilityFilter === "eligible" && student.status === "eligible") ||
        (eligibilityFilter === "ineligible" && student.status === "ineligible");
      return matchesSearch && matchesDepartment && matchesEligibility;
    });
  }, [students, searchQuery, departmentFilter, eligibilityFilter]);

  const getStatusBadge = (student) => {
    if (!student.interested) {
      return <Badge variant="outline" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Not Interested
      </Badge>;
    }

    switch (student.status) {
      case "eligible":
        return <Badge className="bg-success/10 text-success border-success/20 gap-1">
          <CheckCircle className="h-3 w-3" />
          Eligible
        </Badge>;
      case "ineligible":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
          <XCircle className="h-3 w-3" />
          Not Eligible
        </Badge>;
      default:
        return null;
    }
  };

  const eligibilityStats = useMemo(() => ({
    total: students.length,
    eligible: students.filter(s => s.status === "eligible").length,
    ineligible: students.filter(s => s.status === "ineligible").length,
    notInterested: 0,
  }), [students]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="placement" />

      <div className="lg:ml-64">
        <DashboardHeader title="Eligibility Tracking" userName={user.name} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-muted-foreground">Loading eligibility data...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Stats Overview */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{eligibilityStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{eligibilityStats.eligible}</p>
                    <p className="text-xs text-muted-foreground">Eligible Students</p>
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
                    <p className="text-2xl font-bold text-destructive">{eligibilityStats.ineligible}</p>
                    <p className="text-xs text-muted-foreground">Not Eligible</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Eligibility Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Eligibility Criteria
              </CardTitle>
              <CardDescription>
                Overview of requirements for active placement drives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {companies.map(company => (
                  <div key={company.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-foreground mb-3">{company.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min CGPA</span>
                        <span className="font-medium">{company.minCGPA}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min %</span>
                        <span className="font-medium">{company.minPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Test Score</span>
                        <span className="font-medium">{company.minTestScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Backlogs</span>
                        <span className={`font-medium ${company.noBacklogs ? 'text-destructive' : 'text-success'}`}>
                          {company.noBacklogs ? "Not Allowed" : "Allowed"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-full sm:flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
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
                <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Eligibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="eligible">Eligible</SelectItem>
                    <SelectItem value="ineligible">Not Eligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Eligibility Details</CardTitle>
              <CardDescription>
                View eligibility status and reasons for each student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Student</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell">CGPA</TableHead>
                      <TableHead className="hidden md:table-cell">%</TableHead>
                      <TableHead className="hidden lg:table-cell">Test Score</TableHead>
                      <TableHead className="hidden lg:table-cell">Backlogs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Eligible For</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                            <div className="sm:hidden mt-1 space-y-1">
                              <Badge variant="outline" className="text-xs">{student.department}</Badge>
                              <div className="text-xs text-muted-foreground">
                                CGPA: {student.cgpa} | {student.percentage}%
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{student.department}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className={`font-medium ${student.cgpa >= 6.5 ? 'text-success' : student.cgpa >= 5.5 ? 'text-warning' : 'text-destructive'}`}>
                            {student.cgpa}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{student.percentage}%</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {student.totalTests > 0 ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={student.avgTestScore} 
                                  className="h-2 w-16" 
                                />
                                <span className={`text-sm font-medium ${
                                  student.avgTestScore >= 80 ? 'text-success' : 
                                  student.avgTestScore >= 60 ? 'text-warning' : 
                                  'text-destructive'
                                }`}>
                                  {student.avgTestScore}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {student.passedTests}/{student.totalTests} passed
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-sm text-muted-foreground">No tests</span>
                              <div className="text-xs text-muted-foreground">taken yet</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={`font-medium ${student.backlogs === 0 ? 'text-success' : 'text-destructive'}`}>
                            {student.backlogs}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(student)}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {student.eligibleFor.length > 0 ? (
                              student.eligibleFor.slice(0, 2).map(company => (
                                <Badge key={company} variant="secondary" className="text-xs">
                                  {company}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {student.eligibleFor.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.eligibleFor.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Details</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="mx-4 sm:mx-auto sm:max-w-lg max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <GraduationCap className="h-5 w-5 text-primary" />
                                  Eligibility Details
                                </DialogTitle>
                                <DialogDescription>
                                  {student.name} ({student.rollNo})
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                {/* Student Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold">{student.cgpa}</p>
                                    <p className="text-xs text-muted-foreground">CGPA</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold">{student.percentage}%</p>
                                    <p className="text-xs text-muted-foreground">Percentage</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    {student.totalTests > 0 ? (
                                      <>
                                        <p className={`text-lg font-bold ${
                                          student.avgTestScore >= 80 ? 'text-success' : 
                                          student.avgTestScore >= 60 ? 'text-warning' : 
                                          'text-destructive'
                                        }`}>
                                          {student.avgTestScore}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Avg Test Score</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {student.passedTests}/{student.totalTests} passed
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-lg font-bold text-muted-foreground">--</p>
                                        <p className="text-xs text-muted-foreground">No Tests Taken</p>
                                      </>
                                    )}
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className={`text-lg font-bold ${student.backlogs === 0 ? 'text-success' : 'text-destructive'}`}>
                                      {student.backlogs}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Backlogs</p>
                                  </div>
                                </div>

                                {/* Eligibility by Company */}
                                <div className="space-y-2">
                                  <h4 className="font-medium">Company-wise Eligibility</h4>
                                  
                                  {/* Overall Summary */}
                                  <div className="p-3 rounded-lg bg-muted/30 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Eligible for:</span>
                                      <span className="font-medium">
                                        {student.eligibleFor.length} out of {companies.length} companies
                                      </span>
                                    </div>
                                    {student.eligibleFor.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {student.eligibleFor.map(company => (
                                          <Badge key={company} variant="secondary" className="text-xs">
                                            {company}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Accordion type="single" collapsible className="w-full">
                                    {companies.map(company => {
                                      const isEligible = student.eligibleFor.includes(company.name);
                                      const reason = student.ineligibleReasons[company.name];
                                      const eligibleReason = student.eligibleReasons[company.name];

                                      return (
                                        <AccordionItem key={company.id} value={company.name}>
                                          <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-3">
                                              {isEligible ? (
                                                <CheckCircle className="h-4 w-4 text-success" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-destructive" />
                                              )}
                                              <span className="text-sm">{company.name}</span>
                                              <Badge variant={isEligible ? "secondary" : "outline"} className="ml-auto mr-2 text-xs">
                                                {isEligible ? "Eligible" : "Not Eligible"}
                                              </Badge>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent>
                                            <div className="pl-7 space-y-2">
                                              {isEligible && eligibleReason && (
                                                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="h-4 w-4 text-success" />
                                                    <strong className="text-success">Meets all criteria</strong>
                                                  </div>
                                                  <div className="text-success/80 space-y-1">
                                                    {eligibleReason.split(', ').map((criteria, index) => (
                                                      <div key={index} className="flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-success rounded-full"></span>
                                                        {criteria}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {!isEligible && reason && (
                                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                    <strong className="text-destructive">Ineligible reasons</strong>
                                                  </div>
                                                  <div className="text-destructive/80 space-y-1">
                                                    {reason.split(', ').map((criteria, index) => (
                                                      <div key={index} className="flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-destructive rounded-full"></span>
                                                        {criteria}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      );
                                    })}
                                  </Accordion>
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
            </CardContent>
          </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
