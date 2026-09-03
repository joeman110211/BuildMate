import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { TRADE_CATEGORIES, PROPERTY_TYPES, BUDGET_RANGES, getTradeIcon } from "@/lib/constants";
import type { Job, QuoteWithTrader, TraderProfile, Profile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, Badge, StarRating, EmptyState, Spinner } from "@/components/ui/index";
import {
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Hammer,
  PoundSterling,
  FileText,
  Star,
  Send,
  Check,
  X,
} from "lucide-react";

interface CustomerDashboardProps {
  onReviewJob: (job: Job, trader: Profile) => void;
}

export function CustomerDashboard({ onReviewJob }: CustomerDashboardProps) {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostJob, setShowPostJob] = useState(false);
  const [quotesByJob, setQuotesByJob] = useState<Record<string, QuoteWithTrader[]>>({});
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [reviewedJobs, setReviewedJobs] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else if (data) {
      setJobs(data);
      // Fetch quotes for each job
      const quotesMap: Record<string, QuoteWithTrader[]> = {};
      for (const job of data) {
        const { data: quotes } = await supabase
          .from("quotes")
          .select(`
            *,
            trader:profiles!quotes_trader_id_fkey(*),
            trader_profile:trader_profiles!quotes_trader_id_fkey(*)
          `)
          .eq("job_id", job.id)
          .order("created_at", { ascending: false });

        if (quotes) {
          quotesMap[job.id] = quotes as unknown as QuoteWithTrader[];
        }
      }
      setQuotesByJob(quotesMap);

      // Check which jobs have reviews
      const reviewed = new Set<string>();
      for (const job of data) {
        if (job.status === "completed") {
          const { data: quotes } = await supabase
            .from("quotes")
            .select("trader_id")
            .eq("job_id", job.id)
            .eq("status", "accepted");
          if (quotes && quotes.length > 0) {
            const { data: review } = await supabase
              .from("reviews")
              .select("id")
              .eq("job_id", job.id)
              .maybeSingle();
            if (!review) reviewed.add(job.id);
          }
        }
      }
      setReviewedJobs(reviewed);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAcceptQuote = async (quoteId: string, jobId: string) => {
    const { error } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId);

    if (error) {
      console.error("Error accepting quote:", error);
      return;
    }

    // Decline other quotes and set job to in_progress
    await supabase
      .from("quotes")
      .update({ status: "declined" })
      .eq("job_id", jobId)
      .neq("id", quoteId);

    await supabase
      .from("jobs")
      .update({ status: "in_progress" })
      .eq("id", jobId);

    fetchJobs();
  };

  const handleDeclineQuote = async (quoteId: string) => {
    await supabase
      .from("quotes")
      .update({ status: "declined" })
      .eq("id", quoteId);
    fetchJobs();
  };

  const handleMarkComplete = async (jobId: string) => {
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", jobId);
    fetchJobs();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "burnt" | "green" | "gray" | "blue"; icon: React.ReactNode; label: string }> = {
      open: { variant: "blue", icon: <Clock className="w-3 h-3" />, label: "Open" },
      quoted: { variant: "burnt", icon: <FileText className="w-3 h-3" />, label: "Quoted" },
      in_progress: { variant: "gray", icon: <Hammer className="w-3 h-3" />, label: "In Progress" },
      completed: { variant: "green", icon: <CheckCircle2 className="w-3 h-3" />, label: "Completed" },
    };
    const config = map[status] ?? map.open;
    return <Badge variant={config.variant}>{config.icon}{config.label}</Badge>;
  };

  if (loading) {
    return <div className="py-20"><Spinner /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-cream-500 mt-1">Welcome back, {profile?.full_name}</p>
        </div>
        <Button onClick={() => setShowPostJob(true)}>
          <Plus className="w-4 h-4" />
          Post a Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Hammer className="w-8 h-8" />}
          title="No jobs posted yet"
          description="Post your first job to start receiving quotes from verified tradespeople in your area."
          action={<Button onClick={() => setShowPostJob(true)}><Plus className="w-4 h-4" /> Post a Job</Button>}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const quotes = quotesByJob[job.id] ?? [];
            const Icon = getTradeIcon(job.category);
            const isExpanded = expandedJob === job.id;
            const canReview = reviewedJobs.has(job.id);

            return (
              <Card key={job.id} className="overflow-hidden">
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-burnt-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-burnt-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{job.title}</h3>
                        <p className="text-sm text-cream-500 mt-0.5">
                          {job.category} • {job.budget_range || "Budget not specified"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {statusBadge(job.status)}
                          <span className="text-xs text-cream-400">
                            {new Date(job.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {quotes.length > 0 && (
                        <Badge variant="burnt">{quotes.length} quote{quotes.length !== 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-cream-200 p-5 bg-cream-50 animate-slide-down">
                    {job.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-900 mb-1">Description</h4>
                        <p className="text-sm text-cream-600 whitespace-pre-wrap">{job.description}</p>
                      </div>
                    )}
                    {job.property_type && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-900 mb-1">Property Type</h4>
                        <p className="text-sm text-cream-600">{job.property_type}</p>
                      </div>
                    )}

                    {job.status === "in_progress" && (
                      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-700">
                          A quote has been accepted for this job. Once the work is complete, mark it as completed to leave a review.
                        </p>
                        <Button size="sm" className="mt-2" onClick={() => handleMarkComplete(job.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                          Mark as Completed
                        </Button>
                      </div>
                    )}

                    {/* Quotes */}
                    {quotes.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Quotes Received</h4>
                        <div className="space-y-3">
                          {quotes.map((quote) => {
                            const traderProfile = (quote as any).trader_profile as TraderProfile;
                            const trader = quote.trader as Profile;
                            return (
                              <div key={quote.id} className="bg-white rounded-lg border border-cream-200 p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {traderProfile?.business_name ?? trader?.full_name ?? "Unknown Trader"}
                                    </p>
                                    <p className="text-xs text-cream-500">{traderProfile?.trade_category ?? job.category}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-slate-900">£{Number(quote.total_amount).toFixed(2)}</p>
                                    <QuoteStatusBadge status={quote.status} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div className="flex items-center gap-1.5 text-cream-600">
                                    <PoundSterling className="w-3.5 h-3.5" />
                                    Labour: £{Number(quote.labor_cost).toFixed(2)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-cream-600">
                                    <PoundSterling className="w-3.5 h-3.5" />
                                    Materials: £{Number(quote.materials_cost).toFixed(2)}
                                  </div>
                                </div>

                                {quote.payment_terms && (
                                  <p className="text-sm text-cream-600 mb-3">
                                    <span className="font-medium">Payment terms:</span> {quote.payment_terms}
                                  </p>
                                )}

                                {quote.status === "pending" && job.status === "open" && (
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleAcceptQuote(quote.id, job.id)}>
                                      <Check className="w-4 h-4" />
                                      Accept
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => handleDeclineQuote(quote.id)}>
                                      <X className="w-4 h-4" />
                                      Decline
                                    </Button>
                                  </div>
                                )}

                                {quote.status === "accepted" && job.status === "completed" && canReview && trader && (
                                  <Button size="sm" onClick={() => onReviewJob(job, trader)}>
                                    <Star className="w-4 h-4" />
                                    Leave a Review
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-cream-500">No quotes received yet. We'll notify you when tradespeople respond.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <PostJobModal open={showPostJob} onClose={() => setShowPostJob(false)} onPosted={fetchJobs} />
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

// ============ POST JOB MODAL WITH AI SPEC WRITER ============

function PostJobModal({ open, onClose, onPosted }: { open: boolean; onClose: () => void; onPosted: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Spec Writer
  const [showAI, setShowAI] = useState(false);
  const [aiAnswers, setAiAnswers] = useState({ taskType: "", propertyType: "", budgetRange: "", additionalDetails: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("jobs").insert({
      customer_id: user.id,
      title,
      category,
      description,
      property_type: propertyType,
      budget_range: budgetRange,
      status: "open",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Reset form
      setTitle(""); setCategory(""); setPropertyType(""); setBudgetRange(""); setDescription("");
      setLoading(false);
      onClose();
      onPosted();
    }
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-spec-writer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            taskType: aiAnswers.taskType,
            propertyType: aiAnswers.propertyType,
            budgetRange: aiAnswers.budgetRange,
            additionalDetails: aiAnswers.additionalDetails,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AI generation failed");
      }

      const { description: generated, error: fnError } = await response.json();
      if (fnError) throw new Error(fnError);

      setDescription(generated);
      if (!title && aiAnswers.taskType) {
        setTitle(`${aiAnswers.taskType} - ${aiAnswers.propertyType}`);
      }
      if (!category && aiAnswers.taskType) {
        const matched = TRADE_CATEGORIES.find((c) =>
          aiAnswers.taskType.toLowerCase().includes(c.value.toLowerCase())
        );
        if (matched) setCategory(matched.value);
      }
      if (!propertyType && aiAnswers.propertyType) setPropertyType(aiAnswers.propertyType);
      if (!budgetRange && aiAnswers.budgetRange) setBudgetRange(aiAnswers.budgetRange);

      setShowAI(false);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post a New Job" size="lg">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-burnt-50 to-cream-100 border border-burnt-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burnt-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">AI Job Spec Writer</p>
              <p className="text-xs text-cream-500">Answer 3 quick questions and let AI write your description</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)}>
            {showAI ? "Hide" : "Use AI"}
          </Button>
        </div>

        {showAI && (
          <div className="space-y-3 p-4 rounded-lg bg-cream-50 border border-cream-200 animate-slide-down">
            <Input
              label="What task do you need done?"
              value={aiAnswers.taskType}
              onChange={(e) => setAiAnswers({ ...aiAnswers, taskType: e.target.value })}
              placeholder="e.g. Install a new bathroom suite"
            />
            <Input
              label="Property type"
              value={aiAnswers.propertyType}
              onChange={(e) => setAiAnswers({ ...aiAnswers, propertyType: e.target.value })}
              placeholder="e.g. Semi-detached house"
            />
            <Input
              label="Budget range"
              value={aiAnswers.budgetRange}
              onChange={(e) => setAiAnswers({ ...aiAnswers, budgetRange: e.target.value })}
              placeholder="e.g. £1,000 - £2,500"
            />
            <Textarea
              label="Any additional details? (optional)"
              value={aiAnswers.additionalDetails}
              onChange={(e) => setAiAnswers({ ...aiAnswers, additionalDetails: e.target.value })}
              placeholder="Access issues, specific materials, timeline constraints..."
            />
            {aiError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {aiError}
              </div>
            )}
            <Button onClick={handleAIGenerate} loading={aiLoading} disabled={!aiAnswers.taskType || !aiAnswers.propertyType || !aiAnswers.budgetRange}>
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Description
                </>
              )}
            </Button>
          </div>
        )}

        <Input
          label="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bathroom renovation and tiling"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select...</option>
            {TRADE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
          <Select label="Property Type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            <option value="">Select...</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>
        <Select label="Budget Range" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)}>
          <option value="">Select...</option>
          {BUDGET_RANGES.map((range) => (
            <option key={range} value={range}>{range}</option>
          ))}
        </Select>
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project in detail..."
          required
        />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!title || !category || !description} className="flex-1">
            <Send className="w-4 h-4" />
            Post Job
          </Button>
        </div>
      </div>
    </Modal>
  );
}
