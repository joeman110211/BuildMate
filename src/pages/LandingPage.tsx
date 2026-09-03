import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { TRADE_CATEGORIES, getTradeIcon } from "@/lib/constants";
import type { TraderProfile, ReviewWithCustomer } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, Badge, StarRating, EmptyState, Spinner } from "@/components/ui/index";
import { AuthModal } from "@/components/AuthModal";
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Hammer,
  Lock,
} from "lucide-react";

interface LandingPageProps {
  onViewTrader: (trader: TraderProfile) => void;
  onNavigate: (page: string) => void;
}

export function LandingPage({ onViewTrader, onNavigate }: LandingPageProps) {
  const { user, profile } = useAuth();
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [reviewCounts, setReviewCounts] = useState<Record<string, { count: number; avg: number }>>({});

  const fetchTraders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("trader_profiles")
      .select("*")
      .eq("subscription_status", true)
      .order("created_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("trade_category", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching traders:", error);
    } else if (data) {
      const filtered = searchQuery
        ? data.filter(
            (t) =>
              t.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.trade_category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : data;
      setTraders(filtered);

      const counts: Record<string, { count: number; avg: number }> = {};
      for (const trader of filtered) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("trader_id", trader.user_id);
        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          counts[trader.id] = { count: reviews.length, avg };
        } else {
          counts[trader.id] = { count: 0, avg: 0 };
        }
      }
      setReviewCounts(counts);
    }
    setLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  const requireAuth = (mode: "login" | "signup" = "signup") => {
    if (!user) {
      setAuthMode(mode);
      setAuthOpen(true);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-20 left-10 w-72 h-72 bg-burnt-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-burnt-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-burnt-50 border border-burnt-200 mb-6">
              <ShieldCheck className="w-4 h-4 text-burnt-500" />
              <span className="text-sm font-medium text-burnt-700">Verified tradespeople, real reviews</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Find trusted tradespeople
              <span className="block text-burnt-500">for your next project</span>
            </h1>
            <p className="mt-6 text-lg text-cream-600 max-w-2xl mx-auto">
              Connect with verified UK tradespeople. Post your job, receive competitive quotes, and hire with confidence — backed by verified reviews.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <Button size="lg" onClick={() => onNavigate("dashboard")}>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => requireAuth("signup")}>
                    Post a Job
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => requireAuth("signup")}>
                    I'm a Tradesperson
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{traders.length}+</div>
              <div className="text-sm text-cream-500 mt-1">Active Tradespeople</div>
            </div>
            <div className="border-x border-cream-200">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">6</div>
              <div className="text-sm text-cream-500 mt-1">Trade Categories</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center justify-center gap-1">
                100%
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-sm text-cream-500 mt-1">Verified Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Browse Tradespeople</h2>
          <p className="text-cream-500 mt-1">Active, subscribed professionals ready to quote your job</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
            <input
              type="text"
              placeholder="Search by business name or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input sm:w-56"
          >
            <option value="">All Trades</option>
            {TRADE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory ? "bg-burnt-500 text-white" : "bg-white border border-cream-200 text-cream-600 hover:bg-cream-100"
            }`}
          >
            All
          </button>
          {TRADE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-burnt-500 text-white"
                    : "bg-white border border-cream-200 text-cream-600 hover:bg-cream-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Trader Grid */}
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : traders.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No tradespeople found"
            description="Try adjusting your search or filters. New tradespeople are joining BuildMate every day."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {traders.map((trader) => {
              const Icon = getTradeIcon(trader.trade_category);
              const reviewData = reviewCounts[trader.id];
              return (
                <Card
                  key={trader.id}
                  className="overflow-hidden hover:shadow-md transition-all cursor-pointer group animate-slide-up"
                >
                  <div onClick={() => onViewTrader(trader)}>
                    {/* Cover / Photo area */}
                    <div className="h-40 bg-gradient-to-br from-cream-200 to-burnt-100 relative overflow-hidden">
                      {trader.photos && trader.photos.length > 0 ? (
                        <img
                          src={trader.photos[0]}
                          alt={trader.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-12 h-12 text-burnt-300" />
                        </div>
                      )}
                      {trader.subscription_tier === "premium" && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="burnt"><TrendingUp className="w-3 h-3" /> Premium</Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-burnt-600 transition-colors">
                            {trader.business_name}
                          </h3>
                          <p className="text-sm text-cream-500 flex items-center gap-1 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                            {trader.trade_category}
                          </p>
                        </div>
                      </div>

                      {trader.bio && (
                        <p className="text-sm text-cream-600 line-clamp-2 mb-3">
                          {trader.bio}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        {reviewData && reviewData.count > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-burnt-500 text-burnt-500" />
                            <span className="font-medium text-slate-900">{reviewData.avg.toFixed(1)}</span>
                            <span className="text-cream-500">({reviewData.count})</span>
                          </div>
                        ) : (
                          <span className="text-cream-400 text-sm">New on BuildMate</span>
                        )}
                        <span className="text-cream-300">•</span>
                        <span className="text-cream-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {trader.radius_miles} mi radius
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-white border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">How BuildMate Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              icon={<Search className="w-7 h-7" />}
              step="1"
              title="Post Your Job"
              description="Describe your project, set your budget, and get matched with tradespeople in your area."
            />
            <StepCard
              icon={<Hammer className="w-7 h-7" />}
              step="2"
              title="Compare Quotes"
              description="Receive itemized quotes from verified professionals. Compare prices, reviews, and profiles."
            />
            <StepCard
              icon={<Star className="w-7 h-7" />}
              step="3"
              title="Hire & Review"
              description="Choose your tradesperson, manage the job through completion, and leave a verified review."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-burnt-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-burnt-100 mb-8 max-w-xl mx-auto">
              Join BuildMate today — whether you need work done or you're a tradesperson looking for new customers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
              >
                Join as Customer
              </Button>
              <button
                onClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
                className="btn bg-burnt-700 text-white hover:bg-burnt-800 px-6 py-3 text-base"
              >
                Join as Tradesperson
              </button>
            </div>
          </div>
        </section>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </div>
  );
}

function StepCard({ icon, step, title, description }: { icon: React.ReactNode; step: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-burnt-50 text-burnt-500 mb-4">
        {icon}
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-burnt-500 text-white text-xs font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-cream-500 text-sm">{description}</p>
    </div>
  );
}
