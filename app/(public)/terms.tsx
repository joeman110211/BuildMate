import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

const updated = '5 September 2026';

export default function TermsOfUse() {
  return <Screen title="Terms of use" subtitle={`BuildPair private beta · Last updated ${updated}`}>
    <Section title="1. About BuildPair" paragraphs={[
      'BuildPair is a UK marketplace and job-management service that helps homeowners and tradespeople find each other, exchange job information, quotes and messages, and keep records of work.',
      'BuildPair is not the tradesperson carrying out the work and is not a party to the building contract between a homeowner and a tradesperson unless a specific feature expressly says otherwise.',
    ]} />

    <Section title="2. Beta service" paragraphs={[
      'BuildPair is currently operating as a private beta. Features may change, be restricted or be temporarily unavailable while reliability, security and marketplace processes are tested.',
      'Paid BuildPair card payments and paid subscription billing are not active unless the service clearly shows that Stripe payment functionality has been enabled. Recording that a payment was made outside BuildPair does not mean BuildPair processed, held or guaranteed that payment.',
    ]} />

    <Section title="3. Accounts" paragraphs={[
      'You must give accurate account information and keep your account secure. One login may contain both a homeowner profile and a tradesperson profile, but actions taken in each mode remain tied to the same account identity.',
      'You must not impersonate another person or business, create misleading profiles, manipulate reviews, misuse another user’s contact information or use BuildPair for unlawful activity.',
    ]} />

    <Section title="4. Tradesperson information and vetting" paragraphs={[
      'Unless BuildPair explicitly marks a particular item as verified, business descriptions, qualifications, memberships, insurance claims, register links, service areas and portfolio information are supplied by the tradesperson.',
      'A BuildPair listing or profile is not a guarantee of workmanship, solvency, insurance, qualifications, availability or suitability. Homeowners should check the qualifications, insurance, registrations and references relevant to the particular work before appointing anyone.',
    ]} />

    <Section title="5. Jobs, quotes and agreements" paragraphs={[
      'Homeowners are responsible for giving reasonably accurate job information. Tradespeople are responsible for inspecting or clarifying anything needed before relying on a job description or submitting a quote.',
      'A quote should state the price, scope, important exclusions, payment terms, deposit and validity period. Accepting a quote creates a marketplace record of the parties’ agreement, but the parties remain responsible for the underlying work contract and any additional terms they agree.',
      'Users should keep material changes, approvals and payment arrangements in BuildPair messages where practical so there is a clear record.',
    ]} />

    <Section title="6. Payments and subscriptions" paragraphs={[
      'During the private beta, BuildPair may allow a homeowner to record that a milestone was paid directly to a tradesperson. That record is an acknowledgement entered by the homeowner, not proof that BuildPair moved or safeguarded funds.',
      'When Stripe payments or paid subscriptions are enabled, additional payment, cancellation, fee and refund terms will apply. BuildPair will not silently convert beta access into a paid subscription without an explicit user action authorising the paid service.',
    ]} />

    <Section title="7. Reviews" paragraphs={[
      'BuildPair is designed to allow verified reviews only after qualifying completed BuildPair work. Reviews must reflect a genuine experience and must not contain unlawful, threatening, discriminatory, knowingly false or privacy-invasive material.',
      'BuildPair may remove or restrict content where reasonably necessary for safety, legality, platform integrity or enforcement of these terms.',
    ]} />

    <Section title="8. Safety, disputes and prohibited work" paragraphs={[
      'Users remain responsible for complying with building regulations, licensing, health and safety obligations, planning requirements, consumer law and trade-specific legal duties that apply to their work.',
      'BuildPair may suspend accounts, remove listings, preserve relevant records or cooperate with lawful authorities where there is suspected fraud, abuse, dangerous conduct, serious misconduct or misuse of the platform.',
      'BuildPair may provide marketplace records to help users understand what was agreed, but it does not guarantee the outcome of a workmanship, payment or contractual dispute.',
    ]} />

    <Section title="9. Liability" paragraphs={[
      'Nothing in these terms excludes liability that cannot lawfully be excluded, including liability for fraud or fraudulent misrepresentation and any other liability that UK law requires to remain.',
      'To the extent permitted by law, BuildPair is responsible for operating the platform with reasonable care, but is not responsible for the quality, timing, safety or legality of work performed by independent users, or for losses caused by information another user supplied.',
    ]} />

    <Section title="10. Changes and governing law" paragraphs={[
      'We may update these terms as the beta develops. Material changes affecting paid services or important user rights should be made clear before they take effect.',
      'These terms are governed by the law of England and Wales. Consumers keep any mandatory rights they have to bring proceedings in another UK jurisdiction where applicable.',
      'Questions about these terms can be sent to info@buildpair.co.uk.',
    ]} />

    <View style={styles.links}>
      <Link href="/(public)/privacy" asChild><Button mode="outlined">Privacy notice</Button></Link>
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
