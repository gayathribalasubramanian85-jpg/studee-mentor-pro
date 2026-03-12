import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
export default function Footer() {
    return (<footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground"/>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold text-foreground">PlacePrep</span>
                <span className="text-[10px] text-muted-foreground -mt-1">Training System</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering students with comprehensive placement training and skill development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "About", "Contact", "Login"].map((link) => (<li key={link}>
                  <Link to={link === "Home" ? "/" : `/${link.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Portals</h4>
            <ul className="space-y-2">
              {["Student Portal", "Faculty Portal", "Placement Portal"].map((link) => (<li key={link}>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary"/>
                placement@college.edu
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary"/>
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5"/>
                <span>Training & Placement Cell, College Campus</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PlacePrep Training System. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="#" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>);
}
