import { PublicInfoPage } from '@/components/PublicInfoPage';

export default function TermsPage() {
  return <PublicInfoPage
    eyebrow="Legal"
    title="BuildPair Terms of Use"
    intro="These terms explain the basic rules for using BuildPair as a homeowner, tradesperson or visitor. They should be read alongside the Privacy Policy and any payment-specific terms introduced at launch."
    updated="5 September 2026"
    sections={[
      { title: '1. The platform', body: 'BuildPair provides technology that helps customers and tradespeople discover each other, communicate and manage work. BuildPair is not itself the contractor, employer, agent or professional adviser carrying out the work shown on the platform.' },
      { title: '2. Accounts and information', body: 'You must provide accurate information, keep your account secure and only make claims about qualifications, experience, insurance, work or identity that you can support. One login may enable separate homeowner and tradesperson modes.' },
      { title: '3. Marketplace conduct', body: 'Users must not post unlawful, misleading, abusive, discriminatory, fraudulent or unsafe content; manipulate reviews; impersonate another person or business; misuse contact details; or use BuildPair to facilitate unlawful work.' },
      { title: '4. Tradesperson responsibilities', body: 'Tradespeople remain responsible for deciding whether work is within their competence and for holding any licence, registration, qualification, insurance or permission required by law or appropriate industry practice.' },
      { title: '5. Homeowner responsibilities', body: 'Homeowners remain responsible for deciding who to appoint, checking material credentials and agreeing scope, price, timing and payment arrangements. BuildPair information can assist that decision but does not replace appropriate checks.' },
      { title: '6. Quotes, payments and subscriptions', body: 'Where BuildPair enables quotes, subscriptions or payments, additional pricing and payment terms may apply. Any fees shown before purchase will form part of the relevant transaction terms.' },
      { title: '7. Reviews and moderation', body: 'Reviews must reflect genuine experiences. BuildPair may investigate, hide or remove content or accounts where reasonably necessary to protect users, comply with law, enforce these terms or preserve marketplace integrity.' },
      { title: '8. Availability and changes', body: 'Features may change as BuildPair develops. We aim to provide a reliable service but cannot promise uninterrupted availability or that every feature will always remain unchanged.' },
      { title: '9. Liability', body: 'Nothing in these terms excludes liability that cannot legally be excluded. To the extent permitted by law, BuildPair is not responsible for the quality, safety, legality or completion of work independently agreed between users, or for indirect losses arising from those arrangements.' },
      { title: '10. Contact', body: 'Questions about these terms can be sent to info@buildpair.co.uk.' },
    ]}
  />;
}
