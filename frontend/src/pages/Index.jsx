import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { GraduationCap, BookOpen, FileText, Briefcase, Users, BarChart3, Shield, Clock, ArrowRight, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function Index() {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    const features = [
        {
            icon: BookOpen,
            title: "Weekly Study Materials",
            description: "Access curated content with mandatory monitored study sessions"
        },
        {
            icon: FileText,
            title: "Secure Online Tests",
            description: "Anti-malpractice enabled assessments with automatic grading"
        },
        {
            icon: Clock,
            title: "Study Time Tracking",
            description: "Real-time monitoring with tab switch detection"
        },
        {
            icon: Briefcase,
            title: "Placement Drives",
            description: "Apply to eligible companies based on your performance"
        },
        {
            icon: BarChart3,
            title: "Progress Analytics",
            description: "Detailed reports on study hours and test performance"
        },
        {
            icon: Shield,
            title: "Role-Based Access",
            description: "Secure portals for students, faculty, and placement officers"
        }
    ];
    const stats = [
        { value: "1953", label: "Established" },
        { value: "4005", label: "Students" },
        { value: "95%", label: "Graduation Rate" },
        { value: "210", label: "Teaching Staff" },
        { value: "90", label: "Non-Teaching Staff" },
        { value: "49", label: "Programmes" }
    ];
    const roles = [
        {
            icon: GraduationCap,
            title: "Student Portal",
            description: "Access study materials, attend tests, track progress, and apply for placements",
            link: "/login?role=student",
            color: "primary"
        },
        {
            icon: Users,
            title: "Faculty Portal",
            description: "Upload materials, create tests, monitor student progress, and manage retests",
            link: "/login?role=admin",
            color: "secondary"
        },
        {
            icon: Briefcase,
            title: "Placement Portal",
            description: "Manage placement drives, track eligibility, and communicate with students",
            link: "/login?role=placement",
            color: "accent"
        }
    ];
    return (<div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="container relative py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 px-4 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-xs sm:text-sm">
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4"/>
              Comprehensive Placement Training System
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-primary-foreground leading-tight">
              Transform Your Career with
              <span className="block text-secondary">Structured Training</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto px-4">
              A complete placement preparation ecosystem with monitored study sessions, 
              secure assessments, and direct company connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="xl" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (<div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>))}
          </div>
        </div>
      </section>

      {/* College Image Section */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/college-campus.jpg.webp')"
          }}
        >
          <div className="absolute inset-0 bg-primary/30"></div>
        </div>
        <div className="container relative h-full flex items-center justify-center px-4 sm:px-6">
          <div className="text-center text-white space-y-3 sm:space-y-4 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold">
              Welcome to Our Campus
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 px-4">
              A legacy of excellence in education since 1953
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base px-4">
              Everything you need for comprehensive placement preparation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            return (<Card key={index} variant="glass" className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base">{feature.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>);
        })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container px-4 sm:px-6">
          <Card className="gradient-primary border-0 overflow-hidden">
            <CardContent className="p-8 sm:p-12 md:p-16 text-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-3 sm:mb-4">
                  Ready to Start Your Journey?
                </h2>
                <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6 sm:mb-8 text-sm sm:text-base px-4">
                  Join thousands of students who have successfully prepared for their dream placements
                </p>
                <Link to="/login" className="inline-block">
                  <Button size="xl" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                    Get Started Now
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5"/>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>);
}
