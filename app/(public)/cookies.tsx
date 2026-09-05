import { PublicInfoPage } from '@/components/PublicInfoPage';

export default function CookiesPage() {
  return <PublicInfoPage
    eyebrow="Legal"
    title="Cookie Policy"
    intro="BuildPair uses browser storage and similar technologies where needed to keep sessions working, remember preferences and understand how the service performs."
    updated="5 September 2026"
    sections={[
      { title: 'Essential storage', body: 'Some cookies or local-storage items are necessary for authentication, account security, navigation and core app behaviour. Disabling these may stop parts of BuildPair from working correctly.' },
      { title: 'Preference storage', body: 'BuildPair may store limited preferences such as account mode, interface choices or other settings so they do not need to be selected every visit.' },
      { title: 'Analytics', body: 'Where analytics are enabled, they should be configured to measure product performance and usage without collecting more information than reasonably necessary. Non-essential analytics should be subject to the consent rules that apply in the UK.' },
      { title: 'Third-party services', body: 'Authentication, payment, hosting and other service providers may set or read their own cookies or storage when their features are used. Their handling of those technologies is governed by their own notices and our agreements with them.' },
      { title: 'Managing cookies', body: 'Browser settings can usually block or delete cookies. Blocking essential storage can affect sign-in and app functionality. BuildPair will add or update consent controls as non-essential tracking features are introduced.' },
      { title: 'Contact', body: 'Questions about cookies and tracking technologies can be sent to info@buildpair.co.uk.' },
    ]}
  />;
}
