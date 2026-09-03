import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { TRADE_CATEGORIES, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, Badge } from "@/components/ui/index";
import {
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Star,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface TraderOnboardingProps {
  onComplete: () => void;
}

export function TraderOnboarding({ onComplete }: TraderOnboardingProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business details
  const [businessName, setBusinessName] = useState(profile?.full_name ?? "");
  const [tradeCategory, setTradeCategory] = useState("");
  const [bio, setBio] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(25);

  // Step 2: External links
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 3: Certification
  const [certified, setCertified] = useState(false);

  // Step 4: Subscription
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("standard");

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const external_links: Record<string, string> = {};
    if (facebook.trim()) external_links.facebook = facebook.trim();
    if (instagram.trim()) external_links.instagram = instagram.trim();
    if (tiktok.trim()) external_links.tiktok = tiktok.trim();
    if (whatsapp.trim()) external_links.whatsapp = whatsapp.trim();

    const { data: existing } = await supabase
      .from("trader_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let dbError;
    if (existing) {
      ({ error: dbError } = await supabase
        .from("trader_profiles")
        .update({
          business_name: businessName,
          trade_category: tradeCategory,
          bio,
          radius_miles: radiusMiles,
          external_links,
          photos,
        })
        .eq("user_id", user.id));
    } else {
      ({ error: dbError } = await supabase.from("trader_profiles").insert({
        user_id: user.id,
        business_name: businessName,
        trade_category: tradeCategory,
        bio,
        radius_miles: radiusMiles,
        external_links,
        photos,
        subscription_status: false,
        subscription_tier: selectedPlan,
      }));
    }

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
    } else {
      await refreshProfile();
      setLoading(false);
      setStep(4);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

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
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Payment setup failed");
      }

      const { url, error: fnError } = await response.json();
      if (fnError) throw new Error(fnError);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    onComplete();
  };

  const addPhotoUrl = () => {
    setPhotos([...photos, ""]);
  };

  const updatePhoto = (idx: number, value: string) => {
    const updated = [...photos];
    updated[idx] = value;
    setPhotos(updated);
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= s ? "bg-burnt-500 text-white" : "bg-cream-200 text-cream-500"
              }`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 4 && <div className={`h-1 flex-1 mx-2 rounded ${step > s ? "bg-burnt-500" : "bg-cream-200"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Business Details */}
      {step === 1 && (
        <Card className="p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-burnt-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-burnt-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Business Details</h2>
              <p className="text-sm text-cream-500">Tell customers about your business</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Smith & Sons Plumbing"
              required
            />
            <Select
              label="Trade Category"
              value={tradeCategory}
              onChange={(e) => setTradeCategory(e.target.value)}
              required
            >
              <option value="">Select your trade...</option>
              {TRADE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </Select>
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your experience, specialties, and what makes your business stand out..."
            />
            <Input
              label="Working Radius (miles)"
              type="number"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(parseInt(e.target.value) || 25)}
              min={1}
              max={200}
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setStep(2)}
              disabled={!businessName.trim() || !tradeCategory}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: External Links & Photos */}
      {step === 2 && (
        <Card className="p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-burnt-50 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-burnt-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Links & Gallery</h2>
              <p className="text-sm text-cream-500">Add your social links and work photos</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Facebook Page URL"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
            <Input
              label="Instagram URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
            <Input
              label="TikTok URL"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@yourhandle"
            />
            <Input
              label="WhatsApp Link"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/447123456789"
            />

            <div>
              <label className="label">Work Gallery Photos (URLs)</label>
              <p className="text-xs text-cream-500 mb-2">Paste image URLs of your previous work</p>
              {photos.map((photo, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={photo}
                    onChange={(e) => updatePhoto(idx, e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="input flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removePhoto(idx)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPhotoUrl}>
                + Add Photo URL
              </Button>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Certification */}
      {step === 3 && (
        <Card className="p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-burnt-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-burnt-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Legal Certification</h2>
              <p className="text-sm text-cream-500">Required to activate your public profile</p>
            </div>
          </div>

          <div className="rounded-lg bg-cream-50 border border-cream-200 p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Self-Certification Declaration</h3>
            <p className="text-sm text-cream-600 leading-relaxed">
              I self-certify that I hold valid public liability insurance and all required accreditations
              for my trade category ({tradeCategory}). I understand that providing false information may
              result in the immediate suspension of my BuildMate profile.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 border-cream-200 hover:bg-cream-50 transition-colors">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-cream-300 text-burnt-500 focus:ring-burnt-500"
            />
            <div>
              <p className="font-medium text-slate-900">I agree to the self-certification declaration</p>
              <p className="text-sm text-cream-500 mt-0.5">
                I confirm I hold valid public liability insurance and required accreditations.
              </p>
            </div>
          </label>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleSaveProfile} disabled={!certified} loading={loading}>
              Save & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Subscription */}
      {step === 4 && (
        <div className="animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-burnt-50 border border-burnt-200 mb-4">
              <Sparkles className="w-4 h-4 text-burnt-500" />
              <span className="text-sm font-medium text-burnt-700">Activate Your Profile</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Choose Your Subscription</h2>
            <p className="text-cream-500 mt-2 max-w-md mx-auto">
              Your profile won't appear in the directory until you subscribe. Choose a plan to activate your public profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id ? "border-2 border-burnt-500 shadow-md" : "border border-cream-200"
                }`}
              >
                <div onClick={() => setSelectedPlan(plan.id)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                    {plan.id === "premium" && <Badge variant="burnt"><Star className="w-3 h-3" /> Best Value</Badge>}
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
                </div>
              </Card>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleSubscribe} loading={loading}>
              <Lock className="w-4 h-4" />
              Subscribe with £{SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)?.price}/mo
            </Button>
            <Button variant="ghost" onClick={handleSkipForNow}>
              Skip for now — I'll subscribe later
            </Button>
          </div>
          <p className="text-center text-xs text-cream-400 mt-4">
            You'll be redirected to Stripe's secure checkout to complete payment.
          </p>
        </div>
      )}
    </div>
  );
}
