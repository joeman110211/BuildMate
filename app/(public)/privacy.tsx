import { PublicInfoPage } from '@/components/PublicInfoPage';

export default function PrivacyPage() {
  return <PublicInfoPage
    eyebrow="Legal"
    title="Privacy Policy"
    intro="This policy describes the main categories of personal information BuildPair uses to operate accounts, marketplace features and communications."
    updated="6 September 2026"
    sections={[
      { title: 'Who this policy applies to', body: 'This policy applies to visitors, homeowners, tradespeople and other users of the BuildPair website and apps.' },
      { title: 'Information we collect', body: 'Depending on how you use BuildPair, information may include account identifiers, contact details, profile details, business information, job posts, photos, messages, quotes, invoices, reviews, approximate service locations, technical logs and payment-related references supplied by payment providers.' },
      { title: 'Why we use information', body: 'We use information to create and secure accounts, provide marketplace matching, operate profiles and jobs, enable communication, prevent abuse, provide support, process permitted transactions, improve the service and comply with legal obligations.' },
      { title: 'AI-assisted chat and safety analysis', body: 'Messages in BuildPair job conversations may be analysed by automated systems to provide optional reply suggestions, identify possible scams, threats, targeted abuse or other behaviour that may breach marketplace rules, and help prioritise moderation review. Automated analysis can make mistakes. BuildPair may place a warning or temporary messaging restriction on a conversation where risk indicators are detected, and serious or disputed cases may be reviewed by an authorised human moderator. Users remain responsible for checking any AI-generated draft before sending it.' },
      { title: 'Public information', body: 'Tradesperson profile information and public marketplace content may be visible to other users or visitors where that is part of the feature. Do not publish sensitive personal information in public profile fields, job descriptions or photos.' },
      { title: 'Service providers', body: 'BuildPair uses specialist providers for functions such as authentication, hosting, databases, payments, email delivery, media storage and AI-assisted features. Those providers process information only for the services they supply and subject to their own contractual and legal obligations.' },
      { title: 'Retention', body: 'Information is kept only for as long as reasonably needed for the purpose it was collected, including account operation, dispute handling, fraud prevention, legal compliance and financial record keeping. Conversation and moderation records may be retained where reasonably necessary to handle reports, disputes or marketplace safety.' },
      { title: 'Your UK data rights', body: 'Subject to applicable law, you may have rights to access, correct, erase or restrict use of personal information, object to certain processing, or request portability. Some rights are subject to legal exceptions and retention requirements.' },
      { title: 'Security', body: 'BuildPair uses technical and organisational safeguards appropriate to the service. No internet service can guarantee absolute security, so users should also protect their login credentials and devices.' },
      { title: 'Contact', body: 'Privacy enquiries and requests can be sent to info@buildpair.co.uk. If you remain unhappy with how personal information is handled, you may also have the right to complain to the UK Information Commissioner’s Office.' },
    ]}
  />;
}
