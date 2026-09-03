import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getTradeIcon, SUBSCRIPTION_PLANS } from "@/lib/constants";
import type { Job, Quote, TraderProfile, Profile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, Badge, EmptyState, Spinner } from "@/components/ui/index";
import {
  Search,
  Hammer,
  PoundSterling,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
  ShieldCheck,
  Lock,
  Sparkles,
  Briefcase,
} from "lucide-react";

interface TraderDashboardProps {
  onOnboard: () => void;
}

export function TraderDashboard({ onOnboard }: TraderDashboardProps) {
  const { user, profile } = useAuth();
  const [traderProfile, setTraderProfile] = useState<TraderProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [quotedJobIds, setQuotedJobIds] = useState<Set<string>>(new Set());

  const fetchTraderProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trader_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setTraderProfile(data as TraderProfile);
  }, [user]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("status", ["open", "quoted"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else if (data) {
      setJobs(data);
    }
  }, [user]);

  const fetchMyQuotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("trader_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotes:", error);
    } else if (data) {
      setMyQuotes(data);
      setQuotedJobIds(new Set(data.map((q) => q.job_id)));
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      await fetchTraderProfile();
      await fetchJobs();
      await fetchMyQuotes();
      setLoading(false);
    })();
  }, [fetchTraderProfile, fetchJobs, fetchMyQuotes]);

  const handleSubscribe = async (plan: "standard" | "premium") => {
    if (!user) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Payment setup failed");
      }

      const { url, error: fnError } = await response.json();
      if (fnError) throw new Error(fnError);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Subscription error:", err);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || job.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="py-20"><Spinner /></div>;
  }

  // If no trader profile, show onboarding prompt
  if (!traderProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          icon={<Hammer className="w-8 h-8" />}
          title="Complete your trader profile"
          description="Set up your business profile to start receiving job leads and submitting quotes to customers."
          action={<Button onClick={onOnboard}><Sparkles className="w-4 h-4" /> Start Onboarding</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trader Dashboard</h1>
          <p className="text-cream-500 mt-1">{traderProfile.business_name} • {traderProfile.trade_category}</p>
        </div>
        <Button variant="secondary" onClick={onOnboard}>
          <Briefcase className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Subscription Status Panel */}
      <Card className={`p-5 mb-6 ${traderProfile.subscription_status ? "border-green-200 bg-green-50/50" : "border-burnt-200 bg-burnt-50/50"}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${traderProfile.subscription_status ? "bg-green-100" : "bg-burnt-100"}`}>
              {traderProfile.subscription_status ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <Lock className="w-5 h-5 text-burnt-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {traderProfile.subscription_status ? "Active Subscription" : "Subscription Inactive"}
              </p>
              <p className="text-sm text-cream-500">
                {traderProfile.subscription_status
                  ? `${traderProfile.subscription_tier === "premium" ? "Premium" : "Standard"} plan — your profile is live in the directory`
                  : "Your profile is not visible to customers. Subscribe to activate it."}
              </p>
            </div>
          </div>
          {traderProfile.subscription_status ? (
            <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> Active</Badge>
          ) : (
            <Button size="sm" onClick={() => setShowSubscribe(true)}>
              <TrendingUp className="w-4 h-4" />
              Subscribe Now
            </Button>
          )}
        </div>
      </Card>

      {/* My Quotes Summary */}
      {myQuotes.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-burnt-500" />
            My Submitted Quotes ({myQuotes.length})
          </h3>
          <div className="space-y-2">
            {myQuotes.slice(0, 5).map((quote) => {
              const job = jobs.find((j) => j.id === quote.job_id);
              return (
                <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-cream-50 border border-cream-200">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{job?.title ?? "Job"}</p>
                    <p className="text-xs text-cream-500">£{Number(quote.total_amount).toFixed(2)}</p>
                  </div>
                  <QuoteStatusBadge status={quote.status} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Lead Feed */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Open Job Leads</h2>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input sm:w-48"
          >
            <option value="">All Categories</option>
            <option value={traderProfile.trade_category}>My Trade ({traderProfile.trade_category})</option>
            {["Tiling", "Plumbing", "Electrical", "Plastering", "Joinery", "Roofing"]
              .filter((c) => c !== traderProfile.trade_category)
              .map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No open jobs found"
            description="New jobs are posted every day. Check back soon or adjust your filters."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const Icon = getTradeIcon(job.category);
              const alreadyQuoted = quotedJobIds.has(job.id);
              return (
                <Card key={job.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-burnt-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-burnt-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-cream-500">{job.category}</p>
                    </div>
                    {alreadyQuoted && <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> Quoted</Badge>}
                  </div>

                  {job.description && (
                    <p className="text-sm text-cream-600 line-clamp-3 mb-3">{job.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-cream-500 mb-4">
                    {job.budget_range && (
                      <span className="flex items-center gap-1">
                        <PoundSterling className="w-3.5 h-3.5" />
                        {job.budget_range}
                      </span>
                    )}
                    {job.property_type && (
                      <>
                        <span className="text-cream-300">•</span>
                        <span>{job.property_type}</span>
                      </>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    disabled={alreadyQuoted}
                    onClick={() => { setSelectedJob(job); setShowQuoteModal(true); }}
                  >
                    {alreadyQuoted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Quote Submitted
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Quote
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {selectedJob && (
        <QuoteModal
          open={showQuoteModal}
          onClose={() => { setShowQuoteModal(false); setSelectedJob(null); }}
          job={selectedJob}
          onSubmitted={() => { fetchMyQuotes(); fetchJobs(); }}
        />
      )}

      {/* Subscribe Modal */}
      <Modal open={showSubscribe} onClose={() => setShowSubscribe(false)} title="Choose Your Plan" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className="p-6 cursor-pointer hover:border-burnt-500 transition-colors"
            >
              <div onClick={() => handleSubscribe(plan.id)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                  {plan.id === "premium" && <Badge variant="burnt"><Sparkles className="w-3 h-3" /> Best Value</Badge>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">£{plan.price}</span>
                  <span className="text-cream-500">/month</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-cream-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-4" onClick={() => handleSubscribe(plan.id)}>
                  <Lock className="w-4 h-4" />
                  Subscribe £{plan.price}/mo
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "burnt" | "green" | "gray" | "blue"; label: string }> = {
    pending: { variant: "blue", label: "Pending" },
    accepted: { variant: "green", label: "Accepted" },
    declined: { variant: "gray", label: "Declined" },
  };
  const config = map[status] ?? map.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============ QUOTE MODAL ============

function QuoteModal({
  open,
  onClose,
  job,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  job: Job;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [laborCost, setLaborCost] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = (parseFloat(laborCost) || 0) + (parseFloat(materialsCost) || 0);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("quotes").insert({
      job_id: job.id,
      trader_id: user.id,
      labor_cost: parseFloat(laborCost) || 0,
      materials_cost: parseFloat(materialsCost) || 0,
      total_amount: total,
      payment_terms: paymentTerms,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Update job status to quoted
      await supabase.from("jobs").update({ status: "quoted" }).eq("id", job.id);

      setLoading(false);
      setLaborCost(""); setMaterialsCost(""); setPaymentTerms("");
      onClose();
      onSubmitted();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Quote for: ${job.title}`} size="md">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
          <p className="text-sm text-cream-600">
            <span className="font-medium text-slate-900">Job:</span> {job.title}
          </p>
          <p className="text-sm text-cream-600 mt-1">
            <span className="font-medium text-slate-900">Category:</span> {job.category}
          </p>
          {job.budget_range && (
            <p className="text-sm text-cream-600 mt-1">
              <span className="font-medium text-slate-900">Budget:</span> {job.budget_range}
            </p>
          )}
        </div>

        <Input
          label="Labour Cost (£)"
          type="number"
          value={laborCost}
          onChange={(e) => setLaborCost(e.target.value)}
          placeholder="0.00"
          min={0}
          step="0.01"
          required
        />
        <Input
          label="Materials Cost (£)"
          type="number"
          value={materialsCost}
          onChange={(e) => setMaterialsCost(e.target.value)}
          placeholder="0.00"
          min={0}
          step="0.01"
          required
        />

        <div className="p-4 rounded-lg bg-burnt-50 border border-burnt-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">Total Quote</span>
            <span className="text-2xl font-bold text-burnt-600">£{total.toFixed(2)}</span>
          </div>
        </div>

        <Textarea
          label="Payment Terms"
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          placeholder="e.g. 50% upfront, 50% on completion. Payment via bank transfer."
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!laborCost && !materialsCost} className="flex-1">
            <Send className="w-4 h-4" />
            Submit Quote
          </Button>
        </div>
      </div>
    </Modal>
  );
}
