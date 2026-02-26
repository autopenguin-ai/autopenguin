import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (isLanding) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      navigate(`/#${anchor}`);
    }
  };

  return (
    <header className={`sticky top-4 z-50 mx-4 md:mx-6 rounded-xl border bg-background/95 backdrop-blur shadow-lg supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1rem)]'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/autopenguin-logo.png" alt="AutoPenguin" className="h-8 w-8" />
            <span className="font-bold text-xl">AutoPenguin</span>
          </div>

          {/* Centered Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link 
              to="/why-ap"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Why AP
            </Link>
            <Link 
              to="/how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              How It Works
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
          </nav>

          {/* Get Beta Access Button - Right (Desktop) */}
          <div className="hidden md:block">
            <Button onClick={() => navigate("/auth?mode=signup")}>
              Get Beta Access
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/why-ap"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Why AP
                  </Link>
                  <Link 
                    to="/how-it-works"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link 
                    to="/about" 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Contact Us
                  </Link>
                  <Button onClick={() => navigate("/auth?mode=signup")} className="mt-4">
                    Get Beta Access
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}