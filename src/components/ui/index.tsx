import { type ReactNode } from "react";
import { Star } from "lucide-react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            style={{ width: size, height: size }}
            className={star <= Math.round(rating) ? "fill-burnt-500 text-burnt-500" : "text-cream-300"}
          />
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, variant = "gray" }: { children: ReactNode; variant?: "burnt" | "green" | "gray" | "blue" }) {
  const variants = {
    burnt: "badge-burnt",
    green: "badge-green",
    gray: "badge-gray",
    blue: "badge-blue",
  };
  return <span className={variants[variant]}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mb-4 text-cream-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-cream-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-3 border-cream-200 border-t-burnt-500 rounded-full animate-spin" />
    </div>
  );
}
