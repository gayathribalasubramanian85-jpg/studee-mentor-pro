
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Video,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Link as LinkIcon,
  File,
  CheckCircle,
  FolderOpen,
  Edit
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
import { toast } from "sonner";
import authApi from "@/api/authApi";
import adminApi from "@/api/adminApi";
import studyApi from "@/api/studyApi";

export default function AdminMaterials() {
  const currentUser = authApi.getCurrentUser();
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDepartment, setSelectedDepartment] = useState(currentUser?.selectedDepartment || currentUser?.department || "CSE");
  const [selectedYear, setSelectedYear] = useState(currentUser?.selectedYear || currentUser?.year || "3");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [isEditWeekDialogOpen, setIsEditWeekDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState("video");

  // Add Week form states
  const [newWeekNumber, setNewWeekNumber] = useState("");
  const [newWeekStartDate, setNewWeekStartDate] = useState("");
  const [newWeekEndDate, setNewWeekEndDate] = useState("");
  const [customWeeks, setCustomWeeks] = useState([]);
  
  // Edit Week states
  const [editingWeek, setEditingWeek] = useState(null);
  const [editWeekNumber, setEditWeekNumber] = useState("");
  const [editWeekStartDate, setEditWeekStartDate] = useState("");
  const [editWeekEndDate, setEditWeekEndDate] = useState("");

  // Edit Material states
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editMaterialTitle, setEditMaterialTitle] = useState("");
  const [editMaterialDescription, setEditMaterialDescription] = useState("");
  const [editMaterialUrl, setEditMaterialUrl] = useState("");

  // Form states
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState("");

  // Calculate weeks dynamically based on current date
  const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  };

  const generateWeeks = () => {
    // Only return custom weeks added by admin (no hardcoded weeks)
    return customWeeks.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  };

  const weeks = generateWeeks();

  const [materials, setMaterials] = useState({}); // { "1": [], "2": [] }

  const departments = ["MCA", "BCA", "IT", "CS", "DS"];
  const years = ["1", "2", "3"];

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // Reusing getMaterials from studyApi which fetches all or specific? 
        // The backend endpoint `GET /api/study/materials` usually returns all for student. 
        // For admin, we might want to filter by week locally or if backend supports it.
        // Currently assuming it returns a list and we group them.
        const data = await studyApi.getMaterials();
        
        console.log("=== FETCHED MATERIALS FROM API ===");
        console.log("Raw data:", data);

        // Group by week
        const grouped = {};
        data.forEach(m => {
          console.log(`Material: ${m.title}, Type: ${m.type}, Pages: ${m.pages}, Duration: ${m.duration}`);
          const w = m.week || "1";
          if (!grouped[w]) grouped[w] = [];
          grouped[w].push({
            id: m._id,
            title: m.title,
            type: m.type,
            // Support new 'files' array structure or legacy 'link'
            url: m.files?.[0]?.path || m.link,
            link: m.link, // Keep original link for videos
            duration: m.duration || "Duration not set",
            pages: m.pages || null,
            views: 0,
            uploadedAt: new Date(m.createdAt).toLocaleDateString(),
            description: m.description,
            week: m.week
          });
        });
        console.log("Grouped materials:", grouped);
        setMaterials(grouped);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMaterials();
  }, []);

  // Fetch weeks from database
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const data = await adminApi.getWeeks();
        const formattedWeeks = data.map(w => ({
          id: String(w.weekNumber),
          dbId: w._id,
          label: `Week ${w.weekNumber}`,
          startDate: new Date(w.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          endDate: new Date(w.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawStartDate: w.startDate,
          rawEndDate: w.endDate,
          isCustom: true,
        }));
        setCustomWeeks(formattedWeeks);
      } catch (error) {
        console.error("Failed to fetch weeks:", error);
      }
    };
    fetchWeeks();
  }, []);

  const handleUpload = async () => {
    if (!materialTitle.trim()) {
      toast.error("Please enter a material title");
      return;
    }

    if (uploadType === "video" && !videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    // if (uploadType === "pdf" && !pdfFile) {
    //   toast.error("Please select a PDF file");
    //   return;
    // }

    try {
      let payload;

      if (uploadType === 'pdf') {
        if (!pdfFile) {
          toast.error("Please select a PDF file");
          return;
        }
        const formData = new FormData();
        formData.append('title', materialTitle);
        formData.append('description', materialDescription);
        formData.append('type', 'pdf');
        formData.append('week', selectedWeek);
        formData.append('department', selectedDepartment);
        formData.append('year', selectedYear);
        formData.append('file', pdfFile);
        payload = formData;
      } else {
        payload = {
          title: materialTitle,
          description: materialDescription,
          type: 'video',
          week: parseInt(selectedWeek),
          url: videoUrl,
          duration: estimatedTime || null, // Add duration
          department: selectedDepartment,
          year: selectedYear
        };
      }

      const uploadedMaterial = await adminApi.uploadMaterial(payload);

      toast.success(`${uploadType === "video" ? "Video" : "PDF"} uploaded successfully!`);

      // Refresh local state (optimistic or re-fetch)
      setMaterials(prev => ({
        ...prev,
        [selectedWeek]: [...(prev[selectedWeek] || []), {
          id: uploadedMaterial._id || Date.now(),
          title: uploadedMaterial.title || materialTitle,
          type: uploadedMaterial.type || uploadType,
          url: uploadedMaterial.files?.[0]?.path || uploadedMaterial.link || videoUrl,
          link: uploadedMaterial.link || videoUrl,
          duration: uploadedMaterial.duration || estimatedTime || null,
          pages: uploadedMaterial.pages || null,
          views: 0,
          uploadedAt: new Date().toLocaleDateString(),
          description: uploadedMaterial.description || materialDescription,
          week: selectedWeek
        }]
      }));

      // Reset form
      setMaterialTitle("");
      setMaterialDescription("");
      setVideoUrl("");
      setPdfFile(null);
      setEstimatedTime("");
      setIsUploadDialogOpen(false);

    } catch (error) {
      console.error("Upload Error Details:", error);
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
        console.error("Error Status:", error.response.status);
      }
      toast.error(error.response?.data?.message || "Failed to upload material");
    }
  };

  const handleAddWeek = async () => {
    if (!newWeekNumber || !newWeekStartDate || !newWeekEndDate) {
      toast.error("Please fill in all week details");
      return;
    }

    const weekNum = parseInt(newWeekNumber);
    if (weekNum < 1 || weekNum > 52) {
      toast.error("Week number must be between 1 and 52");
      return;
    }

    // Check if week already exists
    if (customWeeks.some(w => w.id === String(weekNum))) {
      toast.error(`Week ${weekNum} already exists`);
      return;
    }

    const startDate = new Date(newWeekStartDate);
    const endDate = new Date(newWeekEndDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      console.log("Creating week with data:", {
        weekNumber: weekNum,
        startDate: newWeekStartDate,
        endDate: newWeekEndDate,
        department: selectedDepartment,
        year: selectedYear
      });
      
      const createdWeek = await adminApi.createWeek({
        weekNumber: weekNum,
        startDate: newWeekStartDate,
        endDate: newWeekEndDate,
        department: selectedDepartment,
        year: selectedYear
      });

      console.log("Week created successfully:", createdWeek);

      const newWeek = {
        id: String(createdWeek.weekNumber),
        dbId: createdWeek._id,
        label: `Week ${createdWeek.weekNumber}`,
        startDate: new Date(createdWeek.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endDate: new Date(createdWeek.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawStartDate: createdWeek.startDate,
        rawEndDate: createdWeek.endDate,
        isCustom: true,
      };

      setCustomWeeks(prev => [...prev, newWeek]);
      toast.success(`Week ${weekNum} added successfully!`);
      
      // Reset form
      setNewWeekNumber("");
      setNewWeekStartDate("");
      setNewWeekEndDate("");
      setIsAddWeekDialogOpen(false);
    } catch (error) {
      console.error("Error creating week:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create week");
    }
  };

  const handleEditWeek = (week) => {
    setEditingWeek(week);
    setEditWeekNumber(week.id);
    // Convert display date back to YYYY-MM-DD format for input
    const startDate = new Date(week.rawStartDate);
    const endDate = new Date(week.rawEndDate);
    setEditWeekStartDate(startDate.toISOString().split('T')[0]);
    setEditWeekEndDate(endDate.toISOString().split('T')[0]);
    setIsEditWeekDialogOpen(true);
  };

  const handleUpdateWeek = async () => {
    if (!editWeekNumber || !editWeekStartDate || !editWeekEndDate) {
      toast.error("Please fill in all week details");
      return;
    }

    const weekNum = parseInt(editWeekNumber);
    if (weekNum < 1 || weekNum > 52) {
      toast.error("Week number must be between 1 and 52");
      return;
    }

    // Check if week number already exists (excluding current week)
    if (customWeeks.some(w => w.id === String(weekNum) && w.dbId !== editingWeek.dbId)) {
      toast.error(`Week ${weekNum} already exists`);
      return;
    }

    const startDate = new Date(editWeekStartDate);
    const endDate = new Date(editWeekEndDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      const updatedWeek = await adminApi.updateWeek(editingWeek.dbId, {
        weekNumber: weekNum,
        startDate: editWeekStartDate,
        endDate: editWeekEndDate
      });

      const updatedWeekData = {
        id: String(updatedWeek.weekNumber),
        dbId: updatedWeek._id,
        label: `Week ${updatedWeek.weekNumber}`,
        startDate: new Date(updatedWeek.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endDate: new Date(updatedWeek.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawStartDate: updatedWeek.startDate,
        rawEndDate: updatedWeek.endDate,
        isCustom: true,
      };

      setCustomWeeks(prev => prev.map(w => w.dbId === editingWeek.dbId ? updatedWeekData : w));
      toast.success(`Week ${weekNum} updated successfully!`);
      
      // Reset form
      setEditingWeek(null);
      setEditWeekNumber("");
      setEditWeekStartDate("");
      setEditWeekEndDate("");
      setIsEditWeekDialogOpen(false);
    } catch (error) {
      console.error("Error updating week:", error);
      toast.error(error.response?.data?.message || "Failed to update week");
    }
  };

  const handleDeleteWeek = async (week) => {
    // Check if week has materials
    if (materials[week.id] && materials[week.id].length > 0) {
      toast.error("Cannot delete week with materials. Please delete materials first.");
      return;
    }

    try {
      await adminApi.deleteWeek(week.dbId);
      setCustomWeeks(prev => prev.filter(w => w.dbId !== week.dbId));
      
      // If deleted week was selected, reset selection
      if (selectedWeek === week.id) {
        setSelectedWeek(customWeeks[0]?.id || "1");
      }
      
      toast.success("Week deleted successfully!");
    } catch (error) {
      console.error("Error deleting week:", error);
      toast.error(error.response?.data?.message || "Failed to delete week");
    }
  };

  const handleDelete = async (materialId) => {
    if (!materialId) {
      toast.error("Invalid material ID");
      return;
    }

    console.log("Attempting to delete material with ID:", materialId);
    
    try {
      const result = await adminApi.deleteMaterial(materialId);
      console.log("Delete result:", result);
      
      setMaterials(prev => ({
        ...prev,
        [selectedWeek]: prev[selectedWeek].filter(m => m.id !== materialId)
      }));
      
      toast.success("Material deleted successfully!");
    } catch (error) {
      console.error("Error deleting material:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete material";
      toast.error(errorMessage);
    }
  };

  const handleViewMaterial = (material) => {
    const url = material.url || material.link;
    if (url) {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      window.open(url.startsWith('http') ? url : `${baseURL}/${url}`, '_blank');
    } else {
      toast.error("No URL available for this material");
    }
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setEditMaterialTitle(material.title);
    setEditMaterialDescription(material.description || "");
    setEditMaterialUrl(material.url || material.link || "");
    setIsEditMaterialDialogOpen(true);
  };

  const handleUpdateMaterial = async () => {
    if (!editMaterialTitle.trim()) {
      toast.error("Please enter a material title");
      return;
    }

    console.log("Updating material:", {
      id: editingMaterial.id,
      title: editMaterialTitle,
      description: editMaterialDescription,
      url: editMaterialUrl
    });

    try {
      const updatedMaterial = await adminApi.updateMaterial(editingMaterial.id, {
        title: editMaterialTitle,
        description: editMaterialDescription,
        url: editMaterialUrl
      });

      console.log("Update response:", updatedMaterial);

      // Update local state
      setMaterials(prev => ({
        ...prev,
        [selectedWeek]: prev[selectedWeek].map(m => 
          m.id === editingMaterial.id 
            ? { 
                ...m, 
                title: editMaterialTitle, 
                description: editMaterialDescription, 
                url: editMaterialUrl || m.url 
              }
            : m
        )
      }));

      toast.success("Material updated successfully!");
      setIsEditMaterialDialogOpen(false);
      setEditingMaterial(null);
      setEditMaterialTitle("");
      setEditMaterialDescription("");
      setEditMaterialUrl("");
    } catch (error) {
      console.error("Error updating material:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to update material";
      toast.error(errorMessage);
    }
  };

  const currentWeekMaterials = materials[selectedWeek] || [];
  const videoCount = currentWeekMaterials.filter(m => m.type === "video").length;
  const pdfCount = currentWeekMaterials.filter(m => m.type === "pdf").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />

      <div className="ml-0 lg:ml-64">
        <DashboardHeader title="Study Materials" userName={`${currentUser?.department || 'Admin'} Admin`} />

        <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-muted-foreground whitespace-nowrap text-sm">Department:</Label>
                  <Select value={selectedDepartment} disabled>
                    <SelectTrigger className="w-full sm:w-32 opacity-100 bg-muted/50 cursor-not-allowed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-muted-foreground whitespace-nowrap text-sm">Year:</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full sm:w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>Year {year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 hidden sm:block" />
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" className="gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      <span className="sm:inline">Upload Material</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Upload Study Material
                      </DialogTitle>
                      <DialogDescription>
                        Add new study material for Week {selectedWeek} - {selectedDepartment} Year {selectedYear}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 overflow-y-auto flex-1">
                      {/* Upload Type Selection */}
                      <div className="space-y-2">
                        <Label>Material Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={uploadType === "video" ? "default" : "outline"}
                            className="flex-1 gap-2"
                            onClick={() => setUploadType("video")}
                          >
                            <Video className="h-4 w-4" />
                            Video Link
                          </Button>
                          <Button
                            type="button"
                            variant={uploadType === "pdf" ? "default" : "outline"}
                            className="flex-1 gap-2"
                            onClick={() => setUploadType("pdf")}
                          >
                            <FileText className="h-4 w-4" />
                            PDF Document
                          </Button>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter material title"
                          value={materialTitle}
                          onChange={(e) => setMaterialTitle(e.target.value)}
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of the material"
                          value={materialDescription}
                          onChange={(e) => setMaterialDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Video URL or PDF Upload */}
                      {uploadType === "video" ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="videoUrl">Video URL *</Label>
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="videoUrl"
                                placeholder="https://youtube.com/watch?v=..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Supports YouTube, Vimeo, and direct video links
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="duration">Estimated Duration</Label>
                            <Input
                              id="duration"
                              placeholder="e.g., 45 mins"
                              value={estimatedTime}
                              onChange={(e) => setEstimatedTime(e.target.value)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="pdfFile">PDF File *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            <input
                              type="file"
                              id="pdfFile"
                              accept=".pdf"
                              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <label htmlFor="pdfFile" className="cursor-pointer">
                              {pdfFile ? (
                                <div className="flex items-center justify-center gap-2 text-primary">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="font-medium">{pdfFile.name}</span>
                                </div>
                              ) : (
                                <>
                                  <File className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    PDF files only (max 50MB)
                                  </p>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleUpload} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Week Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Select Week
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Choose a week to view or upload study materials
                  </CardDescription>
                </div>
                <Dialog open={isAddWeekDialogOpen} onOpenChange={setIsAddWeekDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add Week
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Add Custom Week
                      </DialogTitle>
                      <DialogDescription>
                        Create a new week with custom date range
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="weekNumber">Week Number *</Label>
                        <Input
                          id="weekNumber"
                          type="number"
                          min="1"
                          max="52"
                          placeholder="e.g., 13"
                          value={newWeekNumber}
                          onChange={(e) => setNewWeekNumber(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newWeekStartDate}
                          onChange={(e) => setNewWeekStartDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newWeekEndDate}
                          onChange={(e) => setNewWeekEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAddWeek} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Week
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Week Dialog */}
                <Dialog open={isEditWeekDialogOpen} onOpenChange={setIsEditWeekDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" />
                        Edit Week
                      </DialogTitle>
                      <DialogDescription>
                        Update week details and date range
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="editWeekNumber">Week Number *</Label>
                        <Input
                          id="editWeekNumber"
                          type="number"
                          min="1"
                          max="52"
                          placeholder="e.g., 13"
                          value={editWeekNumber}
                          onChange={(e) => setEditWeekNumber(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editStartDate">Start Date *</Label>
                        <Input
                          id="editStartDate"
                          type="date"
                          value={editWeekStartDate}
                          onChange={(e) => setEditWeekStartDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editEndDate">End Date *</Label>
                        <Input
                          id="editEndDate"
                          type="date"
                          value={editWeekEndDate}
                          onChange={(e) => setEditWeekEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleUpdateWeek} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Update Week
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Material Dialog */}
                <Dialog open={isEditMaterialDialogOpen} onOpenChange={setIsEditMaterialDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" />
                        Edit Material
                      </DialogTitle>
                      <DialogDescription>
                        Update material details
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="editMaterialTitle">Title *</Label>
                        <Input
                          id="editMaterialTitle"
                          placeholder="Enter material title"
                          value={editMaterialTitle}
                          onChange={(e) => setEditMaterialTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editMaterialDescription">Description</Label>
                        <Textarea
                          id="editMaterialDescription"
                          placeholder="Brief description of the material"
                          value={editMaterialDescription}
                          onChange={(e) => setEditMaterialDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {editingMaterial?.type === 'video' && (
                        <div className="space-y-2">
                          <Label htmlFor="editMaterialUrl">Video URL</Label>
                          <Input
                            id="editMaterialUrl"
                            placeholder="https://youtube.com/watch?v=..."
                            value={editMaterialUrl}
                            onChange={(e) => setEditMaterialUrl(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleUpdateMaterial} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Update Material
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {weeks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Weeks Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first week with custom date range
                  </p>
                  <Button
                    variant="hero"
                    className="gap-2"
                    onClick={() => setIsAddWeekDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add First Week
                  </Button>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {weeks.map((week) => (
                  <button
                    key={week.id}
                    onClick={() => setSelectedWeek(week.id)}
                    className={`relative p-4 sm:p-5 pt-6 sm:pt-7 rounded-xl border-2 transition-all text-left group min-h-[120px] sm:min-h-[140px] ${
                      selectedWeek === week.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {selectedWeek === week.id && (
                      <span className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 px-2 sm:px-2.5 py-1 text-xs font-medium bg-success text-success-foreground rounded-full z-20 shadow-md">
                        Active
                      </span>
                    )}
                    <div className={`absolute flex gap-1 z-10 ${
                      selectedWeek === week.id ? 'top-4 sm:top-5 right-2' : 'top-2 right-2'
                    }`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 bg-background/90 hover:bg-background shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWeek(week);
                        }}
                      >
                        <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 bg-background/90 hover:bg-background shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWeek(week);
                        }}
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <p className={`font-semibold text-sm sm:text-base ${selectedWeek === week.id ? "text-primary" : "text-foreground"}`}>
                      {week.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {week.startDate} - {week.endDate}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {(materials[week.id] || []).length} items
                      </span>
                      {(materials[week.id] || []).length > 0 && (
                        <CheckCircle className="h-3 w-3 text-success" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Materials List */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Stats Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Week {selectedWeek} Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Video className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{videoCount}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Video Lectures</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border border-secondary">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{pdfCount}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">PDF Documents</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{videoCount + pdfCount}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Materials</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm"
                      onClick={() => {
                        setUploadType("video");
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <Video className="h-4 w-4 text-primary" />
                      Add Video Lecture
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm"
                      onClick={() => {
                        setUploadType("pdf");
                        setIsUploadDialogOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Add PDF Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Grid */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Week {selectedWeek} Materials
                  </CardTitle>
                  <Badge variant="outline" className="text-muted-foreground text-xs w-fit">
                    {selectedDepartment} - Year {selectedYear}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {currentWeekMaterials.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Materials Yet</h3>
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-4 px-4">
                      Start by uploading study materials for Week {selectedWeek}
                    </p>
                    <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Upload First Material
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {currentWeekMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-colors group"
                      >
                        <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${material.type === "video"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                          }`}>
                          {material.type === "video" ? (
                            <Video className="h-4 w-4 sm:h-6 sm:w-6" />
                          ) : (
                            <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate text-sm sm:text-base">{material.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {material.type === "video" 
                                ? (material.duration || "Video") 
                                : (material.pages ? `${material.pages} pages` : "PDF Document")
                              }
                            </span>
                            <span className="hidden sm:inline">
                              {material.uploadedAt}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleViewMaterial(material)}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
