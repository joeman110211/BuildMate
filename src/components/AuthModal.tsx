import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { Hammer, User, Wrench, CheckCircle2 } from "lucide-react";
import type { UserRole } from "@/types";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
  defaultRole?: UserRole;
}

export function AuthModal({ open, onClose, defaultMode = "login", defaultRole = "customer" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, role, fullName);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        onClose();
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" closeOnBackdrop={true}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-burnt-500 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">BuildMate</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-cream-500 mt-1">
          {mode === "login" ? "Sign in to manage your jobs and quotes" : "Join the UK's trusted tradesperson marketplace"}
        </p>
      </div>

      {mode === "signup" && (
        <div className="mb-5">
          <label className="label">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === "customer"
                  ? "border-burnt-500 bg-burnt-50"
                  : "border-cream-200 hover:border-cream-300"
              }`}
            >
              <User className={`w-7 h-7 ${role === "customer" ? "text-burnt-500" : "text-cream-400"}`} />
              <span className="font-medium text-slate-900">Customer</span>
              <span className="text-xs text-cream-500 text-center">Post jobs & get quotes</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("trader")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === "trader"
                  ? "border-burnt-500 bg-burnt-50"
                  : "border-cream-200 hover:border-cream-300"
              }`}
            >
              <Wrench className={`w-7 h-7 ${role === "trader" ? "text-burnt-500" : "text-cream-400"}`} />
              <span className="font-medium text-slate-900">Tradesperson</span>
              <span className="text-xs text-cream-500 text-center">Find work & quote jobs</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <Input
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Smith"
            required
          />
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
        />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {mode === "login" ? "Sign In" : "Create Account"}
        </Button>
      </form>

      {mode === "signup" && (
        <div className="mt-4 flex items-start gap-2 text-xs text-cream-500">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      )}

      <p className="text-center text-sm text-cream-500 mt-6">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="text-burnt-500 font-medium hover:text-burnt-600"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </Modal>
  );
}
