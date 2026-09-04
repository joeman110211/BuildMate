/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    EXPO_PUBLIC_API_URL?: string;
    DATABASE_URL?: string;
    DATABASE_URL_UNPOOLED?: string;
    CLERK_SECRET_KEY?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_BASIC_PRICE_ID?: string;
    STRIPE_FEATURED_PRICE_ID?: string;
    GEMINI_API_KEY?: string;
    RESEND_API_KEY?: string;
    INVOICE_FROM_EMAIL?: string;
  }
}
