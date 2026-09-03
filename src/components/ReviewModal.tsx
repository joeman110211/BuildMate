import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Job, Profile } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { StarRating } from "@/components/ui/index";
import { Star, CheckCircle2, Send } from "lucide-react";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  trader: Profile | null;
  onSubmitted: () => void;
}

export function ReviewModal({ open, onClose, job, trader, onSubmitted }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!user || !job || !trader) return;
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("reviews").insert({
      job_id: job.id,
      customer_id: user.id,
      trader_id: trader.user_id,
      rating,
      comment,
      verified_completion: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        setRating(0);
        setComment("");
        onClose();
        onSubmitted();
      }, 1500);
    }
  };

  if (!job || !trader) return null;

  return (
    <Modal open={open} onClose={onClose} title="Leave a Verified Review" size="md">
      {success ? (
        <div className="flex flex-col items-center py-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Review Submitted!</h3>
          <p className="text-cream-500 mt-1">Thank you for your feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
            <p className="text-sm text-cream-600">
              <span className="font-medium text-slate-900">Job:</span> {job.title}
            </p>
            <p className="text-sm text-cream-600 mt-1">
              <span className="font-medium text-slate-900">Tradesperson:</span> {trader.full_name}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">Verified Completion — This job was marked as completed through BuildMate</span>
            </div>
          </div>

          <div>
            <label className="label">Your Rating</label>
            <div className="flex items-center gap-2 py-2">
              <StarRating rating={rating} size={32} interactive onChange={setRating} />
              {rating > 0 && <span className="text-sm font-medium text-slate-900 ml-2">{rating} star{rating !== 1 ? "s" : ""}</span>}
            </div>
          </div>

          <Textarea
            label="Your Review"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this tradesperson. How was the quality of work, communication, and value for money?"
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              <Send className="w-4 h-4" />
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
