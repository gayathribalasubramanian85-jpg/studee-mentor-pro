import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    User,
    Mail,
    GraduationCap,
    BookOpen,
    Award,
    FileText,
    Upload,
    Save,
    Plus,
    X,
    FileCheck,
    Building2,
    Calendar
} from "lucide-react";
import studentApi from "@/api/studentApi";
import { toast } from "sonner";

export default function StudentProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        regNo: "",
        department: "",
        year: "",
        semester: "1",
        cgpa: 0,
        backlogs: 0,
        percentage: 0,
        skills: [],
        resume: null,
        interestedInPlacement: false
    });

    const [newSkill, setNewSkill] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    
    // Common skills suggestions
    const commonSkills = [
        "JavaScript", "Python", "Java", "React.js", "Node.js", "HTML/CSS", 
        "SQL", "MongoDB", "Git", "Leadership", "Communication", "Problem Solving",
        "Team Work", "Project Management", "Data Analysis", "Machine Learning"
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await studentApi.getProfile();
                setProfile({
                    ...data,
                    skills: data.skills || [],
                    semester: data.semester || "1",
                    interestedInPlacement: !!data.interestedInPlacement
                });
            } catch (error) {
                console.error("Profile load error:", error);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked) => {
        setProfile(prev => ({ ...prev, interestedInPlacement: checked }));
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            const trimmedSkill = newSkill.trim();
            
            if (profile.skills.includes(trimmedSkill)) {
                toast.error("This skill is already added");
                return;
            }
            
            if (trimmedSkill.length > 50) {
                toast.error("Skill name is too long (max 50 characters)");
                return;
            }
            
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, trimmedSkill]
            }));
            setNewSkill("");
            toast.success(`Added skill: ${trimmedSkill}`);
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
        toast.success(`Removed skill: ${skillToRemove}`);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();

            // Append all profile fields to formData
            Object.keys(profile).forEach(key => {
                if (key === 'skills') {
                    // Handle skills array properly for FormData
                    if (profile.skills && profile.skills.length > 0) {
                        profile.skills.forEach((skill, index) => {
                            formData.append(`skills[${index}]`, skill);
                        });
                    }
                } else if (key !== 'resume' && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
                    formData.append(key, profile[key]);
                }
            });

            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            await studentApi.updateProfile(formData);
            toast.success("Profile updated successfully! Skills have been saved.");

            // Re-fetch to get updated document paths (like resume path)
            const data = await studentApi.getProfile();
            setProfile({
                ...data,
                skills: data.skills || [],
                interestedInPlacement: !!data.interestedInPlacement
            });
            setResumeFile(null);
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Profile...</div>;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar userType="student" />
            <div className="lg:ml-64">
                <DashboardHeader title="My Profile" userName={profile.name} />
                <main className="p-4 sm:p-6">
                    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                            {/* Left Column - Identity Card */}
                            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                                <Card className="border-t-4 border-primary">
                                    <CardHeader className="text-center pb-2">
                                        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full gradient-primary flex items-center justify-center mb-4 shadow-lg">
                                            <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl">{profile.name}</CardTitle>
                                        <CardDescription className="font-medium text-primary text-sm">Student Profile</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Address</span>
                                                <span className="font-medium truncate">{profile.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registration Number</span>
                                                <span className="font-medium truncate">{profile.regNo || 'Not Assigned'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Department</span>
                                                <span className="font-medium truncate">{profile.department}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Admission Year</span>
                                                <span className="font-medium truncate">{profile.year}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resume Upload Section */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            Placement Resume
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {profile.resume ? (
                                            <div className="p-3 bg-success/5 border border-success/20 rounded-lg flex items-center justify-between group">
                                                <div className="flex items-center gap-2 text-success min-w-0">
                                                    <FileCheck className="w-4 h-4 shrink-0" />
                                                    <span className="text-xs font-semibold truncate">Resume.pdf</span>
                                                </div>
                                                <Button variant="outline" size="xs" className="h-7 text-[10px] shrink-0" asChild>
                                                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${profile.resume?.replace(/\\/g, '/').replace(/^uploads\//, '')}`} target="_blank" rel="noopener noreferrer">
                                                        View File
                                                    </a>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="p-4 sm:p-6 border-2 border-dashed rounded-lg text-center bg-muted/30">
                                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-muted-foreground/30 mb-2" />
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">No resume on file</p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="resume-upload" className="block">
                                                <div className="flex items-center justify-center gap-2 p-2.5 border-2 border-primary/20 rounded-xl hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all">
                                                    <Upload className="w-4 h-4 text-primary" />
                                                    <span className="text-xs font-bold text-primary truncate">
                                                        {resumeFile ? resumeFile.name.substring(0, 15) + '...' : "Update Resume"}
                                                    </span>
                                                </div>
                                            </Label>
                                            <input
                                                id="resume-upload"
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <p className="text-[10px] text-center text-muted-foreground">PDF format only (Max 5MB)</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column - Form Sections */}
                            <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                                {/* Academic Form */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-base sm:text-lg">Academic Records</CardTitle>
                                                <CardDescription className="text-sm">Keep your academic statistics up to date</CardDescription>
                                            </div>
                                            <div className="flex flex-col items-start sm:items-end gap-1">
                                                <Label htmlFor="placement-toggle" className="text-[10px] font-bold uppercase text-muted-foreground">Placement Status</Label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium">{profile.interestedInPlacement ? "Opted In" : "Opted Out"}</span>
                                                    <Switch
                                                        id="placement-toggle"
                                                        checked={profile.interestedInPlacement}
                                                        onCheckedChange={handleSwitchChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="semester" className="text-xs font-bold text-muted-foreground uppercase">Current Semester</Label>
                                            <Input
                                                id="semester"
                                                name="semester"
                                                className="bg-muted/30"
                                                value={profile.semester}
                                                onChange={handleInputChange}
                                                placeholder="Semester index (1-8)"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cgpa" className="text-xs font-bold text-muted-foreground uppercase">Cumulative CGPA</Label>
                                            <Input
                                                id="cgpa"
                                                name="cgpa"
                                                type="number"
                                                step="0.01"
                                                className="bg-muted/30 font-mono"
                                                value={profile.cgpa}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="backlogs" className="text-xs font-bold text-muted-foreground uppercase">Active Backlogs</Label>
                                            <Input
                                                id="backlogs"
                                                name="backlogs"
                                                type="number"
                                                className="bg-muted/30 font-mono"
                                                value={profile.backlogs}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="percentage" className="text-xs font-bold text-muted-foreground uppercase">Aggregate Percentage (%)</Label>
                                            <Input
                                                id="percentage"
                                                name="percentage"
                                                type="number"
                                                step="0.1"
                                                className="bg-muted/30 font-mono"
                                                value={profile.percentage}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 85.5"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Skills Form */}
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                            <Award className="w-4 w-4 sm:w-5 sm:h-5 text-primary" />
                                            Skills & Expertise
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Press enter or click + to add skills. {profile.skills.length > 0 && `(${profile.skills.length} skill${profile.skills.length !== 1 ? 's' : ''} added)`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    placeholder="e.g. React.js, Python, Leadership..."
                                                    value={newSkill}
                                                    onChange={(e) => setNewSkill(e.target.value)}
                                                    onKeyDown={handleAddSkill}
                                                    className="pr-10 text-sm"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const trimmedSkill = newSkill.trim();
                                                    
                                                    if (!trimmedSkill) {
                                                        toast.error("Please enter a skill");
                                                        return;
                                                    }
                                                    
                                                    if (profile.skills.includes(trimmedSkill)) {
                                                        toast.error("This skill is already added");
                                                        return;
                                                    }
                                                    
                                                    if (trimmedSkill.length > 50) {
                                                        toast.error("Skill name is too long (max 50 characters)");
                                                        return;
                                                    }
                                                    
                                                    setProfile(prev => ({
                                                        ...prev,
                                                        skills: [...prev.skills, trimmedSkill]
                                                    }));
                                                    setNewSkill("");
                                                    toast.success(`Added skill: ${trimmedSkill}`);
                                                }}
                                                disabled={!newSkill.trim()}
                                                className="px-3"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        {profile.skills.length > 0 && (
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-muted-foreground">
                                                    {profile.skills.length} skill{profile.skills.length !== 1 ? 's' : ''} added
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setProfile(prev => ({ ...prev, skills: [] }));
                                                        toast.success("All skills cleared");
                                                    }}
                                                    className="text-xs text-destructive hover:text-destructive"
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                        )}
                                        
                                        {/* Common Skills Suggestions */}
                                        {profile.skills.length < 5 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground font-medium">Quick Add:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {commonSkills
                                                        .filter(skill => !profile.skills.includes(skill))
                                                        .slice(0, 6)
                                                        .map(skill => (
                                                            <Button
                                                                key={skill}
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setProfile(prev => ({
                                                                        ...prev,
                                                                        skills: [...prev.skills, skill]
                                                                    }));
                                                                    toast.success(`Added skill: ${skill}`);
                                                                }}
                                                                className="text-xs h-7 px-2"
                                                            >
                                                                {skill}
                                                            </Button>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}
                                        <ScrollArea className="h-20 sm:h-24 px-1">
                                            <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                                {profile.skills.map(skill => (
                                                    <Badge key={skill} variant="secondary" className="gap-1.5 pl-2.5 py-1.5 border hover:bg-muted transition-colors text-xs">
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSkill(skill)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                {profile.skills.length === 0 && (
                                                    <div className="w-full py-4 text-center border-2 border-dashed rounded-lg bg-muted/10">
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50 italic">List your professional skills</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Save Section */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 border rounded-xl">
                                    <p className="text-xs text-muted-foreground italic">
                                        Make sure all information is accurate as it will be used for your placement applications.
                                    </p>
                                    <Button type="submit" disabled={saving} className="gap-2 px-6 sm:px-8 py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold w-full sm:w-auto">
                                        {saving ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                                Saving Profile...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
