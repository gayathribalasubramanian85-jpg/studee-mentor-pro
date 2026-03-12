import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/about", label: "About" },
        { path: "/contact", label: "Contact" },
    ];
    return (<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground"/>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base sm:text-lg font-bold text-foreground">PlacePrep</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground -mt-1">Training System</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (<Link key={link.path} to={link.path} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? "text-primary" : "text-muted-foreground"}`}>
              {link.label}
            </Link>))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? (<X className="h-5 w-5 sm:h-6 sm:w-6 text-foreground"/>) : (<Menu className="h-5 w-5 sm:h-6 sm:w-6 text-foreground"/>)}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (<div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 px-4 sm:px-6 flex flex-col gap-4">
            {navLinks.map((link) => (<Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium py-2 ${isActive(link.path) ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </Link>))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="hero" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>)}
    </header>);
}
