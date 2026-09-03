import {
  Wrench,
  Droplets,
  Zap,
  PaintRoller,
  Hammer,
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const TRADE_CATEGORIES = [
  { value: "Tiling", label: "Tiling", icon: PaintRoller },
  { value: "Plumbing", label: "Plumbing", icon: Droplets },
  { value: "Electrical", label: "Electrical", icon: Zap },
  { value: "Plastering", label: "Plastering", icon: Wrench },
  { value: "Joinery", label: "Joinery", icon: Hammer },
  { value: "Roofing", label: "Roofing", icon: Home },
] as const;

export const PROPERTY_TYPES = [
  "Flat / Apartment",
  "Terraced House",
  "Semi-Detached House",
  "Detached House",
  "Bungalow",
  "Commercial Property",
  "New Build",
];

export const BUDGET_RANGES = [
  "Under £500",
  "£500 - £1,000",
  "£1,000 - £2,500",
  "£2,500 - £5,000",
  "£5,000 - £10,000",
  "£10,000+",
];

export const SUBSCRIPTION_PLANS = [
  {
    id: "standard" as const,
    name: "Standard",
    price: 19.99,
    features: [
      "Active public profile in directory",
      "Receive unlimited job leads",
      "Submit quotes to customers",
      "Photo gallery on profile",
      "External links to social media",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: 29.99,
    features: [
      "Everything in Standard",
      "Priority placement in directory",
      "Verified badge on profile",
      "Premium profile highlighting",
      "Advanced lead filtering",
    ],
  },
];

export const getTradeIcon = (category: string): LucideIcon => {
  return TRADE_CATEGORIES.find((t) => t.value === category)?.icon ?? Wrench;
};
