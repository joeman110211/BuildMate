import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getTradeIcon } from "@/lib/constants";
import type { TraderProfile, ReviewWithCustomer, Profile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, Badge, StarRating, EmptyState, Spinner } from "@/components/ui/index";
import { AuthModal } from "@/components/AuthModal";
import {
  ArrowLeft,
  MapPin,
  Star,
  Facebook,
  Instagram,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  Camera,
  Quote,
} from "lucide-react";

interface TraderProfilePageProps {
  trader: TraderProfile;
  onBack: () => void;
  onRequestQuote: () => void;
}

export function TraderProfilePage({ trader, onBack, onRequestQuote }: TraderProfilePageProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        customer:profiles!reviews_customer_id_fkey(full_name)
      `)
      .eq("trader_id", trader.user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else if (data) {
      setReviews(data as ReviewWithCustomer[]);
      if (data.length > 0) {
        setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length);
      }
    }
    setLoading(false);
  }, [trader.user_id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const Icon = getTradeIcon(trader.trade_category);

  const handleLockedAction = () => {
    if (!user) {
      setAuthOpen(true);
    } else {
      onRequestQuote();
    }
  };

  const socialLinks = trader.external_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => v && v.trim());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-cream-600 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to directory
      </button>

      {/* Profile Header */}
      <Card className="overflow-hidden mb-6">
        <div className="h-48 bg-gradient-to-br from-cream-200 to-burnt-100 relative">
          {trader.photos && trader.photos.length > 0 ? (
            <img src={trader.photos[0]} alt={trader.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-16 h-16 text-burnt-300" />
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-burnt-500 flex items-center justify-center flex-shrink-0 -mt-8 border-4 border-white shadow-md">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{trader.business_name}</h1>
                  {trader.subscription_tier === "premium" && (
                    <Badge variant="burnt"><ShieldCheck className="w-3 h-3" /> Premium</Badge>
                  )}
                  <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> Subscribed</Badge>
                </div>
                <p className="text-cream-500 flex items-center gap-1.5 mt-1">
                  <Icon className="w-4 h-4" />
                  {trader.trade_category}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-burnt-500 text-burnt-500" />
                        <span className="font-semibold text-slate-900">{avgRating.toFixed(1)}</span>
                        <span className="text-cream-500">({reviews.length} reviews)</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-cream-400 text-sm">No reviews yet</span>
                  )}
                  <span className="text-cream-300">•</span>
                  <span className="text-cream-500 flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {trader.radius_miles} mile radius
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button onClick={handleLockedAction} className="w-full sm:w-48">
                {user ? "Request Quote" : (
                  <>
                    <Lock className="w-4 h-4" />
                    Request Quote
                  </>
                )}
              </Button>
              <Button variant="secondary" className="w-full sm:w-48" onClick={handleLockedAction}>
                {user ? (
                  <>
                    <Phone className="w-4 h-4" />
                    Contact
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Contact
                  </>
                )}
              </Button>
            </div>
          </div>

          {trader.bio && (
            <div className="mt-6 pt-6 border-t border-cream-200">
              <h3 className="font-semibold text-slate-900 mb-2">About</h3>
              <p className="text-cream-600 leading-relaxed">{trader.bio}</p>
            </div>
          )}

          {/* Self-Certified Qualifications */}
          <div className="mt-6 pt-6 border-t border-cream-200">
            <h3 className="font-semibold text-slate-900 mb-3">Qualifications & Accreditations</h3>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Self-Certified</p>
                <p className="text-sm text-green-700">
                  This tradesperson has self-certified that they hold valid public liability insurance and required accreditations.
                </p>
              </div>
            </div>
          </div>

          {/* External Links */}
          {hasSocialLinks && (
            <div className="mt-6 pt-6 border-t border-cream-200">
              <h3 className="font-semibold text-slate-900 mb-3">Connect</h3>
              <div className="flex flex-wrap gap-2">
                {socialLinks.facebook && (
                  <SocialButton href={socialLinks.facebook} icon={<Facebook className="w-4 h-4" />} label="Facebook" color="bg-blue-600" />
                )}
                {socialLinks.instagram && (
                  <SocialButton href={socialLinks.instagram} icon={<Instagram className="w-4 h-4" />} label="Instagram" color="bg-pink-600" />
                )}
                {socialLinks.tiktok && (
                  <SocialButton href={socialLinks.tiktok} icon={<Camera className="w-4 h-4" />} label="TikTok" color="bg-slate-900" />
                )}
                {socialLinks.whatsapp && (
                  <SocialButton href={socialLinks.whatsapp} icon={<MessageCircle className="w-4 h-4" />} label="WhatsApp" color="bg-green-600" />
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Photo Gallery */}
      {trader.photos && trader.photos.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-burnt-500" />
            Work Gallery
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trader.photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square rounded-lg overflow-hidden border border-cream-200 hover:opacity-80 transition-opacity"
              >
                <img src={photo} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-burnt-500" />
            Verified Reviews
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} />
              <span className="font-semibold text-slate-900">{avgRating.toFixed(1)}</span>
              <span className="text-cream-500">({reviews.length})</span>
            </div>
          )}
        </div>

        {loading ? (
          <Spinner className="py-12" />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<Star className="w-8 h-8" />}
            title="No reviews yet"
            description="Reviews appear after a job is completed through BuildMate, ensuring every review is verified."
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-cream-200 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center text-cream-600 font-medium">
                      {review.customer?.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{review.customer?.full_name ?? "Anonymous"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size={14} />
                        {review.verified_completion && (
                          <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-cream-400">
                    {new Date(review.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {review.comment && (
                  <div className="mt-3 flex gap-2">
                    <Quote className="w-4 h-4 text-cream-300 flex-shrink-0 mt-0.5" />
                    <p className="text-cream-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Gallery photo" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode="signup" />
    </div>
  );
}

function SocialButton({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity ${color}`}
    >
      {icon}
      {label}
    </a>
  );
}
