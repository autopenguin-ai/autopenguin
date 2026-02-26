import { Mail, Linkedin, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { NewsletterSubscribe } from "./NewsletterSubscribe";
export function Footer() {
  return <footer className="border-t bg-white dark:bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/autopenguin-logo.png" alt="AutoPenguin" className="h-8 w-8" />
              <span className="font-semibold text-lg">AutoPenguin</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              AI-powered automation platform for modern businesses
            </p>
            <div className="flex gap-3">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            
            <div className="mt-4">
              <NewsletterSubscribe />
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <Link to="/beta-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Beta Guide
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">
                  What's New
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-muted-foreground">General Inquiries</div>
                  <a href="mailto:info@autopenguin.app" className="text-primary hover:underline">
                    info@autopenguin.app
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-muted-foreground">Customer Support</div>
                  <a href="mailto:cs@autopenguin.app" className="text-primary hover:underline">
                    cs@autopenguin.app
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-muted-foreground">Sales Inquiries</div>
                  <a href="mailto:sales@autopenguin.app" className="text-primary hover:underline">
                    sales@autopenguin.app
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t bg-white dark:bg-white">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
            <p className="text-gray-600">© {new Date().getFullYear()} AutoPenguin. All rights reserved.</p>
            
          </div>
        </div>
      </div>
    </footer>;
}