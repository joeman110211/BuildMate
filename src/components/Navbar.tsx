import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/AuthModal";
import { Hammer, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileOpen(false);
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate("home");
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => handleNavigate("home")} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-burnt-500 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">BuildMate</span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              <NavButton active={currentPage === "home"} onClick={() => handleNavigate("home")}>
                Find Tradespeople
              </NavButton>
              {user && profile?.role === "customer" && (
                <NavButton active={currentPage === "dashboard"} onClick={() => handleNavigate("dashboard")}>
                  My Jobs
                </NavButton>
              )}
              {user && profile?.role === "trader" && (
                <NavButton active={currentPage === "dashboard"} onClick={() => handleNavigate("dashboard")}>
                  Dashboard
                </NavButton>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => handleNavigate("dashboard")}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleAuth("login")}>
                    Sign In
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleAuth("signup")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-cream-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-cream-200 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              <MobileNavButton active={currentPage === "home"} onClick={() => handleNavigate("home")}>
                Find Tradespeople
              </MobileNavButton>
              {user && (
                <MobileNavButton active={currentPage === "dashboard"} onClick={() => handleNavigate("dashboard")}>
                  Dashboard
                </MobileNavButton>
              )}
              <div className="pt-3 border-t border-cream-200 space-y-2">
                {user ? (
                  <Button variant="secondary" size="sm" onClick={handleSignOut} className="w-full">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => handleAuth("login")} className="w-full">
                      Sign In
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleAuth("signup")} className="w-full">
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "text-burnt-600 bg-burnt-50" : "text-cream-600 hover:text-slate-900 hover:bg-cream-100"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
        active ? "text-burnt-600 bg-burnt-50" : "text-slate-900 hover:bg-cream-100"
      }`}
    >
      {children}
    </button>
  );
}
