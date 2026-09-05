import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

const updated = '5 September 2026';

export default function PrivacyNotice() {
  return <Screen title="Privacy notice" subtitle={`BuildPair private beta · Last updated ${updated}`}>
    <AppCard>
      <Text variant="titleLarge" style={styles.title}>Who this notice covers</Text>
      <Text style={styles.body}>This notice explains how BuildPair uses personal information when homeowners, tradespeople and visitors use the BuildPair website, mobile apps and marketplace features in the United Kingdom.</Text>
      <Text style={styles.body}>Privacy contact: info@buildpair.co.uk.</Text>
    </AppCard>

    <Section title="Information we collect" paragraphs={[
      'Account information such as your name, email address, authentication identifiers and, where enabled, phone number.',
      'Homeowner job information such as job descriptions, property type, postcode, photos, quotes, messages, invoices, payment-status records and reviews.',
      'Tradesperson profile information such as business name, trade, service area, biography, portfolio images, qualifications you choose to list and public register or social links.',
      'Technical and security information needed to operate the service, prevent abuse, diagnose faults and maintain an audit trail.',
    ]} />

    <Section title="Why we use it" paragraphs={[
      'To provide accounts, marketplace matching, profiles, job posting, quotes, messaging, invoices, reviews and customer support.',
      'To protect users and the service, investigate abuse, moderate reports, prevent fraud and keep reliable records of important marketplace actions.',
      'To improve reliability and understand faults. BuildPair does not sell personal data to advertisers.',
      'Where BuildPair uses an AI job-writing feature, the job details you submit for that feature are sent only to generate the requested draft. You must review the output before using it.',
    ]} />

    <Section title="Legal bases" paragraphs={[
      'We process information where it is necessary to provide the service you ask us for, to take steps connected with a contract, to comply with legal obligations, or for legitimate interests such as security, moderation and service reliability. Where consent is the appropriate legal basis, you can withdraw it.',
    ]} />

    <Section title="Service providers" paragraphs={[
      'BuildPair uses specialist providers to run the service. Current providers include Clerk for authentication, Neon for database hosting, Cloudinary for media storage, Resend for transactional email and Google Gemini for the optional AI job-specification feature. Stripe will be used for subscriptions and marketplace payment processing only when those payment features are deliberately enabled.',
      'These providers process information under their own security and data-processing arrangements. Data may be processed outside the UK where a provider operates internationally; appropriate transfer safeguards should be used where required by UK data-protection law.',
    ]} />

    <Section title="Sharing and public information" paragraphs={[
      'Tradesperson profile information you publish is intended to be public. Open homeowner job listings are designed to reveal only limited location information until access is appropriate.',
      'We may disclose information where required by law, to protect users or the service, or in connection with a genuine business transfer. We do not publish private messages or full customer job addresses as public marketplace content.',
    ]} />

    <Section title="Retention and deletion" paragraphs={[
      'We keep information only for as long as reasonably needed for the service, security, dispute handling, accounting and legal obligations. Different records have different retention needs. Account deletion does not necessarily erase records that must be retained for fraud prevention, legal claims, completed transactions or statutory duties.',
      'You can request access, correction, deletion or restriction where UK data-protection law gives you that right. You may also object to certain processing or ask for a copy of information you provided in a portable format where applicable.',
    ]} />

    <Section title="Complaints" paragraphs={[
      'Contact info@buildpair.co.uk first so the issue can be investigated. You also have the right to complain to the UK Information Commissioner’s Office if you believe your data-protection rights have been infringed.',
    ]} />

    <View style={styles.links}>
      <Link href="/(public)/terms" asChild><Button mode="outlined">Terms of use</Button></Link>
      <Link href="/(public)/cookies" asChild><Button mode="outlined">Cookie notice</Button></Link>
    </View>
  </Screen>;
}

function Section({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return <AppCard><Text variant="titleLarge" style={styles.title}>{title}</Text>{paragraphs.map((paragraph) => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}</AppCard>;
}

const styles = StyleSheet.create({
  title: { color: colors.charcoal, fontWeight: '900' },
  body: { color: colors.text, lineHeight: 23 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
