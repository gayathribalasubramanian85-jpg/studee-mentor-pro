import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ArrowUp, GraduationCap, Users, BookOpen, Award, Building, Calendar } from "lucide-react";

export default function About() {
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

    const milestones = [
        { year: "1953", event: "College Established" },
        { year: "1970", event: "First Graduation Ceremony" },
        { year: "1985", event: "Computer Science Department Founded" },
        { year: "2000", event: "Digital Learning Initiative" },
        { year: "2010", event: "Placement Training Program Launch" },
        { year: "2020", event: "Online Learning Platform" },
        { year: "2025", event: "AI-Powered Assessment System" }
    ];

    const achievements = [
        {
            icon: Users,
            title: "4005+ Students",
            description: "Active learners across all programs"
        },
        {
            icon: GraduationCap,
            title: "95% Graduation Rate",
            description: "Consistently high success rate"
        },
        {
            icon: BookOpen,
            title: "49 Programs",
            description: "Diverse academic offerings"
        },
        {
            icon: Award,
            title: "210 Teaching Staff",
            description: "Experienced faculty members"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            
            {/* Hero Section with College Image */}
            <section className="relative h-[60vh] overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/images/Aboutimg.png')"
                    }}
                >
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-16 sm:py-20 bg-background">
                <div className="container px-4 sm:px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
                                Our Story
                            </h2>
                            <p className="text-muted-foreground text-base sm:text-lg">
                                Seven decades of commitment to educational excellence
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                                <div className="bg-red-600 text-white px-3 sm:px-4 py-2 inline-block font-bold text-xs sm:text-sm tracking-wider">
                                    PRELUDE
                                </div>
                                
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                                    Women's Empowerment Through Education
                                </h3>
                                
                                <div className="prose prose-sm sm:prose-lg max-w-none text-muted-foreground space-y-3 sm:space-y-4">
                                    <p className="text-sm sm:text-base">
                                        Fatima College, Mary Land, Madurai is a Catholic minority Institution, established 
                                        and run by the Sisters of St. Joseph's Society of Madurai (of the Congregation of 
                                        the Sisters of St. Joseph of Lyon). Today the sisters are present in 48 countries, 
                                        responding to the signs of the times and the needs of the people. The Charism of 
                                        the sisters of St. Joseph of Lyon is unioning Love expressed in greatest charity 
                                        and Deepest Humility. In India, there is one Province in the South of India and a 
                                        Region in the North of India. The sisters are involved in Educational, Social Action, 
                                        Pastoral, Family apostolate ministries empowering the marginalized women and children.
                                    </p>
                                    
                                    <p className="text-sm sm:text-base">
                                        Fatima College, affiliated to Madurai Kamaraj University, was the dream of Sr. Rose 
                                        Benedicte, the founder of the College, realized 71 years ago. With more than half a 
                                        century of experience in the field of education, Fatima College has established a 
                                        reputation for excellence in all aspects of higher education. It has endeared itself 
                                        to the People of Madurai by imparting value based holistic education to young 
                                        women with the objective of giving preference to the rural and economically 
                                        backward women and first generation learners.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="order-1 lg:order-2">
                                <div className="relative">
                                    <img 
                                        src="/images/Aboutimg2.webp" 
                                        alt="Sister and College Building" 
                                        className="w-full h-auto rounded-lg shadow-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Achievements Section */}
            <section className="py-16 sm:py-20 bg-muted/30">
                <div className="container px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
                            Our Achievements
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Numbers that reflect our commitment to excellence
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {achievements.map((achievement, index) => {
                            const Icon = achievement.icon;
                            return (
                                <Card key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex justify-center mb-3 sm:mb-4">
                                            <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                                                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary"/>
                                            </div>
                                        </div>
                                        <h3 className="font-display font-bold text-lg sm:text-2xl text-foreground mb-2">
                                            {achievement.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {achievement.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="py-20 bg-background">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                            Our Journey
                        </h2>
                        <p className="text-muted-foreground">
                            Key milestones in our 72-year history
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20"></div>
                            
                            {milestones.map((milestone, index) => (
                                <div key={index} className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                        <Card className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="h-4 w-4 text-primary"/>
                                                    <span className="font-bold text-primary">{milestone.year}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{milestone.event}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    {/* Timeline dot */}
                                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission Section */}
            <section className="py-16 sm:py-20 bg-muted/30">
                <div className="container px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                        <Card className="gradient-primary border-0">
                            <CardContent className="p-6 sm:p-8 text-center">
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-primary-foreground mb-3 sm:mb-4">
                                    Our Vision
                                </h3>
                                <p className="text-primary-foreground/90 text-sm sm:text-base">
                                    To be a leading institution that transforms students into industry-ready professionals 
                                    through innovative education, comprehensive training, and holistic development.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="gradient-secondary border-0">
                            <CardContent className="p-6 sm:p-8 text-center">
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-secondary-foreground mb-3 sm:mb-4">
                                    Our Mission
                                </h3>
                                <p className="text-secondary-foreground/90 text-sm sm:text-base">
                                    To provide quality education, foster research and innovation, and prepare students 
                                    for successful careers through structured learning and industry partnerships.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
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
        </div>
    );
}