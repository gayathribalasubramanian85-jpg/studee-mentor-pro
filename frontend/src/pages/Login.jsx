
import { useState } from "react";
import authApi from "@/api/authApi";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users, Briefcase, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") || "student";
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Student fields
    name: "",
    registerNumber: "",
    department: "",
    // Admin/Placement fields
    username: "",
    password: "",
    year: ""
  });
  const departments = [
    "MCA",
    "BCA",
    "IT",
    "CS",
    "DS"
  ];
  const years = ["1st Year", "2nd Year", "3rd Year"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (selectedRole === 'student') {
      if (!formData.department) {
        toast.error("Please select your department");
        return;
      }
    } else if (selectedRole === 'admin') {
      if (!formData.department) {
        toast.error("Please select a department");
        return;
      }
      if (!formData.year) {
        toast.error("Please select a year");
        return;
      }
    }

    try {
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Role:", selectedRole);
      console.log("Username:", formData.username);
      console.log("Has Password:", !!formData.password);
      console.log("Password Length:", formData.password?.length);
      
      let user;
      if (selectedRole === 'student') {
        user = await authApi.login(formData.registerNumber, formData.password, 'student', formData.department, formData.year);
      } else if (selectedRole === 'admin') {
        user = await authApi.login(formData.username, formData.password, 'admin', formData.department, formData.year);
      } else if (selectedRole === 'placement') {
        console.log("Making placement login API call...");
        user = await authApi.login(formData.username, formData.password, 'placement', null, null);
        console.log("Placement login successful:", user);
      }

      console.log("=== LOGIN SUCCESSFUL ===");
      console.log("User role:", user.role);

      // Redirect based on the actual role returned by backend
      if (user.role === "student") {
        navigate("/student/dashboard");
      } else if (user.role === "faculty") {
        navigate("/admin/dashboard");
      } else if (user.role === "placementofficer") {
        navigate("/placement/dashboard");
      } else {
        toast.error("Unauthorized role");
        return;
      }

      toast.success("Login successful!");
    } catch (error) {
      console.log("=== LOGIN ERROR ===");
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.response?.data?.message);
      
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      console.log("Showing toast with message:", errorMessage);
      
      // Force show toast with a delay to ensure it appears
      setTimeout(() => {
        toast.error(errorMessage);
      }, 100);
    }
  };

  const roleConfig = {
    student: {
      icon: GraduationCap,
      title: "Student Login",
      description: "Access your study materials, tests, and placement opportunities"
    },
    admin: {
      icon: Users,
      title: "Faculty Login",
      description: "Manage study materials, create tests, and monitor student progress"
    },
    placement: {
      icon: Briefcase,
      title: "Placement Officer Login",
      description: "Manage placement drives and track student eligibility"
    }
  };
  const currentRole = roleConfig[selectedRole];
  const Icon = currentRole.icon;
  return (<div className="min-h-screen flex">
    {/* Left Panel - Branding */}
    <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="relative flex flex-col justify-center p-12 w-full">
        <Link to="/" className="flex items-center gap-3 mb-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-bold text-primary-foreground">PlacePrep</span>
            <span className="text-xs text-primary-foreground/60 -mt-1">Training System</span>
          </div>
        </Link>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-display font-bold text-primary-foreground leading-tight">
            Welcome to Your Placement Success Journey
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Access comprehensive training materials, take monitored assessments, and connect with top companies.
          </p>

          <div className="space-y-4 pt-8">
            {Object.entries(roleConfig).map(([key, config]) => {
              const RoleIcon = config.icon;
              return (<div key={key} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer ${selectedRole === key
                ? "bg-primary-foreground/20 border border-primary-foreground/30"
                : "bg-primary-foreground/5 hover:bg-primary-foreground/10"}`} onClick={() => setSelectedRole(key)}>
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <RoleIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-primary-foreground">{config.title}</p>
                  <p className="text-sm text-primary-foreground/60">{config.description}</p>
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Right Panel - Login Form */}
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Mobile Role Selector */}
        <div className="lg:hidden mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{currentRole.title}</h2>
              <p className="text-sm text-muted-foreground">{currentRole.description}</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {Object.entries(roleConfig).map(([key, config]) => {
              const RoleIcon = config.icon;
              return (<button key={key} onClick={() => setSelectedRole(key)} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${selectedRole === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"}`}>
                <RoleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </button>);
            })}
          </div>
        </div>

        <Card variant="elevated" className="border-0">
          <CardHeader className="hidden lg:block text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-2xl gradient-primary w-fit">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">{currentRole.title}</CardTitle>
            <CardDescription>{currentRole.description}</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedRole === "student" ? (<>
                <div className="space-y-2">
                  <Label htmlFor="registerNumber">Email</Label>
                  <Input id="registerNumber" placeholder="Enter your email" value={formData.registerNumber} onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password</Label>
                  <div className="relative">
                    <Input id="studentPassword" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Default password is your Register Number</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>) : (<>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Enter your username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {selectedRole === "admin" && (<div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminDepartment">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>)}
              </>)}

              <Button type="submit" variant="hero" size="lg" className="w-full mt-6">
                Login to Portal
              </Button>
            </form>

            {selectedRole !== "student" && (<p className="text-center text-sm text-muted-foreground mt-4">
              Forgot your password?{" "}
              <Link to="#" className="text-primary hover:underline">
                Contact Admin
              </Link>
            </p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>);
}
