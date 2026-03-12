
import { useState, useEffect } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, CheckCircle, XCircle, Play, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import testApi from "@/api/testApi";
import authApi from "@/api/authApi";

export default function StudentTests() {
  const { toast } = useToast();
  const currentUser = authApi.getCurrentUser();
  const [testInProgress, setTestInProgress] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // Default 60 mins
  const [selectedTest, setSelectedTest] = useState(null);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [malpracticeCount, setMalpracticeCount] = useState(0);

  // Status variables
  const [completedTests, setCompletedTests] = useState([]);
  const [testResults, setTestResults] = useState([]); // Store test results from backend

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await testApi.getTests();
        
        // Fetch student's test results to determine completed tests
        let results = [];
        try {
          results = await testApi.getTestResults(); // We'll need to create this API
        } catch (err) {
          console.log("No test results yet");
        }
        
        setTestResults(results);
        
        // Get IDs of completed tests
        const completedTestIds = results.map(r => r.test?._id || r.testId);
        
        // Map backend test model to UI model
        const mappedUpcoming = data
          .filter(t => !completedTestIds.includes(t._id)) // Filter out completed tests
          .map(t => ({
            id: t._id,
            title: t.title,
            date: "Available",
            time: "Anytime",
            duration: t.duration,
            questions: t.questions.length,
            status: "available",
            rawQuestions: t.questions
          }));
        
        // Map completed tests
        const mappedCompleted = results.map(r => ({
          id: r._id,
          testId: r.test?._id || r.testId,
          title: r.test?.title || "Test",
          date: new Date(r.submittedAt || r.createdAt).toLocaleDateString(),
          score: r.score,
          total: r.totalMarks,
          percentage: (r.score / r.totalMarks) * 100,
          status: r.status // 'pass' or 'fail'
        }));
        
        setUpcomingTests(mappedUpcoming);
        setCompletedTests(mappedCompleted);
      } catch (error) {
        console.error("Failed to fetch tests", error);
      }
    };
    fetchTests();
  }, []);

  const sampleQuestions = selectedTest?.rawQuestions?.map((q, idx) => ({
    id: idx,
    question: q.questionText,
    options: q.options,
    // Backend stores Correct Answer Index, but we shouldn't expose it to frontend trivially if possible, 
    // but here we just need to display. Correctness check happens on backend or frontend before submit? 
    // Backend `submitTest` takes score. So frontend must calculate score currently.
    // Backend Test model has `questions: [{... correctAnswer: Number}]`.
    // So I can check correctness here.
    correct: q.correctAnswer
  })) || [];


  useEffect(() => {
    let timer;
    if (testInProgress && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    else if (timeLeft === 0 && testInProgress) {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [testInProgress, timeLeft]);

  // Anti-malpractice: Detect tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testInProgress) {
        const msg = "Tab Switch Detected";
        toast({
          variant: "destructive",
          title: "Warning: " + msg,
          description: "Switching tabs during test is not allowed. This event has been logged."
        });
        setLogs(prev => [...prev, { timestamp: new Date(), event: 'tab_switch' }]);
        setMalpracticeCount(prev => prev + 1);
      }
    };
    const handleContextMenu = (e) => {
      if (testInProgress) {
        e.preventDefault();
        const msg = "Right-click Attempt";
        toast({
          variant: "destructive",
          title: msg,
          description: "Right-clicking is not allowed."
        });
        setLogs(prev => [...prev, { timestamp: new Date(), event: 'right_click' }]);
      }
    };
    const handleCopy = (e) => {
      if (testInProgress) {
        e.preventDefault();
        const msg = "Copy Attempt";
        toast({
          variant: "destructive",
          title: msg,
          description: "Copying is not allowed."
        });
        setLogs(prev => [...prev, { timestamp: new Date(), event: 'copy_paste' }]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
    };
  }, [testInProgress, toast]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = (test) => {
    setSelectedTest(test);
    setTestInProgress(true);
    setCurrentQuestion(0);
    setAnswers({});
    setLogs([]);
    setMalpracticeCount(0);
    setTimeLeft(test.duration * 60);
    // Request fullscreen
    document.documentElement.requestFullscreen?.();
    toast({
      title: "Test Started",
      description: "Stay focused. Tab switching and copying are monitored."
    });
  };

  const submitTest = async () => {
    // Calculate Score
    let score = 0;
    const totalMarks = sampleQuestions.length; // Assuming 1 mark per question for simplicity or check marks

    sampleQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        score += 1; // Or q.marks if available
      }
    });

    try {
      await testApi.submitTest({
        testId: selectedTest.id,
        score: score,
        totalMarks: totalMarks,
        logs: logs,
        malpracticeFlags: malpracticeCount
      });

      toast({
        title: "Test Submitted!",
        description: `Your answers have been recorded. Score: ${score}/${totalMarks}`
      });

      setTestInProgress(false);
      document.exitFullscreen?.();
      setSelectedTest(null);

      // Remove from upcoming and add to completed
      setUpcomingTests(prev => prev.filter(t => t.id !== selectedTest.id));
      setCompletedTests(prev => [...prev, {
        id: Date.now(), // Temporary ID
        testId: selectedTest.id,
        title: selectedTest.title,
        date: new Date().toLocaleDateString(),
        score: score,
        total: totalMarks,
        percentage: (score / totalMarks) * 100,
        status: (score / totalMarks) * 100 >= 40 ? "pass" : "fail" // Assuming 40% pass
      }]);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit test results."
      });
      setTestInProgress(false);
      document.exitFullscreen?.();
    }
  };

  const selectAnswer = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  if (testInProgress) {
    return (<div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Test Header */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 p-3 sm:p-4">
        <div className="container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <div>
              <h1 className="font-display font-bold text-foreground text-base sm:text-lg">{selectedTest?.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Question {currentQuestion + 1} of {sampleQuestions.length}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${timeLeft < 300 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-mono font-bold text-base sm:text-lg">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={submitTest} variant="hero" className="w-full sm:w-auto">
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="pt-20 sm:pt-24 max-w-4xl mx-auto">
        <Card variant="elevated">
          <CardContent className="p-4 sm:p-8">
            <div className="mb-6 sm:mb-8">
              <span className="text-sm font-medium text-primary mb-2 block">Question {currentQuestion + 1}</span>
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground">
                {sampleQuestions[currentQuestion]?.question}
              </h2>
            </div>

            <div className="space-y-3 mb-6 sm:mb-8">
              {sampleQuestions[currentQuestion]?.options.map((option, index) => (<button key={index} onClick={() => selectAnswer(currentQuestion, index)} className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all ${answers[currentQuestion] === index
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"}`}>
                <span className="flex items-center gap-3">
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-medium ${answers[currentQuestion] === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm sm:text-base">{option}</span>
                </span>
              </button>))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Button variant="outline" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0} className="w-full sm:w-auto">
                Previous
              </Button>
              <div className="flex flex-wrap justify-center gap-2">
                {sampleQuestions.map((_, index) => (<button key={index} onClick={() => setCurrentQuestion(index)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-all ${currentQuestion === index
                  ? "bg-primary text-primary-foreground"
                  : answers[index] !== undefined
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"}`}>
                  {index + 1}
                </button>))}
              </div>
              <Button variant="hero" onClick={() => setCurrentQuestion(Math.min(sampleQuestions.length - 1, currentQuestion + 1))} disabled={currentQuestion === sampleQuestions.length - 1} className="w-full sm:w-auto">
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Answered: {Object.keys(answers).length} / {sampleQuestions.length}</span>
            <span>{Math.round((Object.keys(answers).length / sampleQuestions.length) * 100)}% Complete</span>
          </div>
          <Progress value={(Object.keys(answers).length / sampleQuestions.length) * 100} className="h-2" />
        </div>
      </div>
    </div>);
  }
  return (<div className="min-h-screen bg-background">
    <Sidebar userType="student" />

    <div className="lg:ml-64">
      <DashboardHeader title="Online Tests" userName={currentUser?.name || "Student"} />

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Test Security Info */}
        <Card variant="glass" className="border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base">Secure Testing Environment</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Tests are conducted with anti-malpractice measures. The following actions are monitored:
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-muted text-xs sm:text-sm">Tab Switching</span>
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-muted text-xs sm:text-sm">Copy/Paste Disabled</span>
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-muted text-xs sm:text-sm">Right-click Disabled</span>
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-muted text-xs sm:text-sm">Fullscreen Mode</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">Available Tests</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 sm:flex-none">Completed Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingTests.length > 0 ? upcomingTests.map((test) => (<Card key={test.id} variant="interactive">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${test.status === "available"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"}`}>
                      {test.status === "available" ? "Available Now" : "Upcoming"}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base line-clamp-2">{test.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">{test.date} at {test.time}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      {test.duration} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      {test.rawQuestions?.length || test.questions} questions
                    </span>
                  </div>
                  <Button variant={test.status === "available" ? "hero" : "outline"} className="w-full gap-2 text-xs sm:text-sm" onClick={() => test.status === "available" && startTest(test)} disabled={test.status !== "available"}>
                    {test.status === "available" ? (<>
                      <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                      Start Test
                    </>) : (<>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      Not Yet Available
                    </>)}
                  </Button>
                </CardContent>
              </Card>)) : <div className="col-span-full text-center text-muted-foreground text-sm">No tests available.</div>}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedTests.length > 0 ? completedTests.map((test) => (<Card key={test.id} variant="default">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 sm:p-3 rounded-xl ${test.status === "pass" || test.status === "passed" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {test.status === "pass" || test.status === "passed" ? (<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />) : (<XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />)}
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${test.status === "pass" || test.status === "passed"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"}`}>
                      {test.status === "pass" || test.status === "passed" ? "Passed" : "Failed"}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base line-clamp-2">{test.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">{test.date}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Score</span>
                      <span className="font-medium text-xs sm:text-sm">{test.score}/{test.total}</span>
                    </div>
                    <Progress value={test.percentage} className={`h-2 ${test.status === "fail" || test.status === "failed" ? "[&>div]:bg-destructive" : ""}`} />
                    <p className={`text-base sm:text-lg font-bold ${test.status === "pass" || test.status === "passed" ? "text-success" : "text-destructive"}`}>
                      {test.percentage.toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>)) : (
                <div className="col-span-full text-center p-8 sm:p-12">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Completed Tests</h3>
                  <p className="text-sm text-muted-foreground">
                    Tests you complete will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  </div>);
}
