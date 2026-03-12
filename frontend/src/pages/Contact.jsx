import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { 
    ArrowUp, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    Send,
    Building,
    Users,
    GraduationCap
} from "lucide-react";

export default function Contact() {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Form submitted:', formData);
        // You can add your form submission logic here
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
        });
    };

    const contactInfo = [
        {
            icon: MapPin,
            title: "Address",
            details: [
                "Fatima College",
                "Mary Land, Madurai",
                "Tamil Nadu, India - 625018"
            ]
        },
        {
            icon: Phone,
            title: "Phone",
            details: [
                "+91 452 253 9681",
                "+91 452 253 9682",
                "Fax: +91 452 253 9683"
            ]
        },
        {
            icon: Mail,
            title: "Email",
            details: [
                "info@fatimacollegemdu.org",
                "principal@fatimacollegemdu.org",
                "admissions@fatimacollegemdu.org"
            ]
        },
        {
            icon: Clock,
            title: "Office Hours",
            details: [
                "Monday - Friday: 9:00 AM - 5:00 PM",
                "Saturday: 9:00 AM - 1:00 PM",
                "Sunday: Closed"
            ]
        }
    ];

    const departments = [
        {
            icon: GraduationCap,
            title: "Academic Office",
            contact: "academics@fatimacollegemdu.org",
            phone: "+91 452 253 9684"
        },
        {
            icon: Users,
            title: "Admissions Office",
            contact: "admissions@fatimacollegemdu.org",
            phone: "+91 452 253 9685"
        },
        {
            icon: Building,
            title: "Placement Cell",
            contact: "placements@fatimacollegemdu.org",
            phone: "+91 452 253 9686"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            
            {/* Hero Section */}
            <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="container px-4 sm:px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
                            Contact Us
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground px-4">
                            Get in touch with us for any inquiries about admissions, programs, or general information.
                            We're here to help you on your educational journey.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Information */}
            <section className="py-16 sm:py-20 bg-background">
                <div className="container px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
                        {contactInfo.map((info, index) => {
                            const Icon = info.icon;
                            return (
                                <Card key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex justify-center mb-3 sm:mb-4">
                                            <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
                                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary"/>
                                            </div>
                                        </div>
                                        <h3 className="font-display font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">
                                            {info.title}
                                        </h3>
                                        <div className="space-y-1">
                                            {info.details.map((detail, idx) => (
                                                <p key={idx} className="text-xs sm:text-sm text-muted-foreground">
                                                    {detail}
                                                </p>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Contact Form and Map */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                                    Send us a Message
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name" className="text-sm">Full Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter your full name"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="text-sm">Email Address *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter your email"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Enter your phone number"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="subject" className="text-sm">Subject *</Label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter subject"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="message" className="text-sm">Message *</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows={5}
                                            placeholder="Enter your message"
                                            className="mt-1"
                                        />
                                    </div>
                                    
                                    <Button type="submit" className="w-full gap-2">
                                        <Send className="h-4 w-4"/>
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Map and Additional Info */}
                        <div className="space-y-4 sm:space-y-6">
                            {/* Location Map */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                                        Our Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="relative h-64 sm:h-80 w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-b-lg overflow-hidden">
                                        {/* Map Background Pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563eb" strokeWidth="1"/>
                                                    </pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill="url(#grid)" />
                                            </svg>
                                        </div>
                                        
                                        {/* Location Marker */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <div className="relative">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                    <MapPin className="h-3 w-3 sm:h-5 sm:w-5 text-primary-foreground"/>
                                                </div>
                                                <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 sm:px-3 py-1 rounded-full shadow-md border">
                                                    <span className="text-xs font-medium text-foreground whitespace-nowrap">Fatima College</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Roads/Streets illustration */}
                                        <div className="absolute inset-0">
                                            <svg width="100%" height="100%" className="opacity-20">
                                                <path d="M0,60 Q150,80 300,60 T600,60" stroke="#6b7280" strokeWidth="3" fill="none"/>
                                                <path d="M100,0 Q120,150 100,300" stroke="#6b7280" strokeWidth="2" fill="none"/>
                                                <path d="M200,0 Q220,150 200,300" stroke="#6b7280" strokeWidth="2" fill="none"/>
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 sm:p-4 bg-muted/30">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-foreground text-sm sm:text-base">Fatima College</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">Mary Land, Madurai, Tamil Nadu 625018</p>
                                            </div>
                                            <a
                                                href="https://www.google.com/maps/search/Fatima+College+Mary+Land+Madurai+Tamil+Nadu"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
                                            >
                                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4"/>
                                                View on Maps
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Department Contacts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Department Contacts</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {departments.map((dept, index) => {
                                        const Icon = dept.icon;
                                        return (
                                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Icon className="h-4 w-4 text-primary"/>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-foreground">
                                                        {dept.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dept.contact}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dept.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 sm:py-20 bg-muted/30">
                <div className="container px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Quick answers to common questions
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {[
                            {
                                question: "What are the admission requirements?",
                                answer: "Admission requirements vary by program. Please contact our admissions office for specific requirements for your desired course."
                            },
                            {
                                question: "How can I apply for placement training?",
                                answer: "Current students can access the placement training system through the student portal. Contact the placement cell for more information."
                            },
                            {
                                question: "What are the college timings?",
                                answer: "Regular classes are from 9:00 AM to 4:00 PM on weekdays. Office hours are 9:00 AM to 5:00 PM Monday through Friday."
                            },
                            {
                                question: "How can I get my transcripts?",
                                answer: "Contact the academic office with your request. Processing typically takes 5-7 working days."
                            }
                        ].map((faq, index) => (
                            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <CardContent className="p-4 sm:p-6">
                                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                                        {faq.question}
                                    </h3>
                                    <p className="text-muted-foreground text-xs sm:text-sm">
                                        {faq.answer}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
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