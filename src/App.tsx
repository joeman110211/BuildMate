import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/pages/LandingPage";
import { TraderProfilePage } from "@/pages/TraderProfilePage";
import { TraderOnboarding } from "@/pages/TraderOnboarding";
import { CustomerDashboard } from "@/pages/CustomerDashboard";
import { TraderDashboard } from "@/pages/TraderDashboard";
import { ReviewModal } from "@/components/ReviewModal";
import { Spinner } from "@/components/ui/index";
import type { Job, TraderProfile, Profile } from "@/types";
import { Footer } from "@/components/Footer";

type Page = "home" | "trader-profile" | "dashboard" | "onboarding";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>("home");
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [reviewJob, setReviewJob] = useState<Job | null>(null);
  const [reviewTrader, setReviewTrader] = useState<Profile | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleNavigate = (newPage: string) => {
    if (newPage === "dashboard" && !user) {
      setPage("home");
      return;
    }
    if (newPage === "onboarding" && (!user || profile?.role !== "trader")) {
      setPage("home");
      return;
    }
    setPage(newPage as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewTrader = (trader: TraderProfile) => {
    setSelectedTrader(trader);
    setPage("trader-profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRequestQuote = () => {
    // For now, navigate to dashboard if customer, or show auth if not logged in
    if (user && profile?.role === "customer") {
      setPage("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleReviewJob = (job: Job, trader: Profile) => {
    setReviewJob(job);
    setReviewTrader(trader);
    setReviewOpen(true);
  };

  // Redirect to onboarding if trader has no trader_profile
  useEffect(() => {
    if (user && profile?.role === "trader" && page === "dashboard") {
      // Check if trader has a profile - handled in dashboard
    }
  }, [user, profile, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Navbar onNavigate={handleNavigate} currentPage={page} />

      <main className="flex-1">
        {page === "home" && (
          <LandingPage onViewTrader={handleViewTrader} onNavigate={handleNavigate} />
        )}

        {page === "trader-profile" && selectedTrader && (
          <TraderProfilePage
            trader={selectedTrader}
            onBack={() => { setSelectedTrader(null); setPage("home"); }}
            onRequestQuote={handleRequestQuote}
          />
        )}

        {page === "dashboard" && user && profile?.role === "customer" && (
          <CustomerDashboard onReviewJob={handleReviewJob} />
        )}

        {page === "dashboard" && user && profile?.role === "trader" && (
          <TraderDashboard onOnboard={() => setPage("onboarding")} />
        )}

        {page === "onboarding" && user && profile?.role === "trader" && (
          <TraderOnboarding onComplete={() => setPage("dashboard")} />
        )}
      </main>

      <Footer />

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        job={reviewJob}
        trader={reviewTrader}
        onSubmitted={() => {
          // Refresh dashboard by navigating
          setPage("dashboard");
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
