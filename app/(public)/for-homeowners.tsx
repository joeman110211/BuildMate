import { Text, View } from 'react-native';
import { PublicInfoPage, infoStyles } from '@/components/PublicInfoPage';

export default function ForHomeownersPage() {
  return <PublicInfoPage
    eyebrow="For homeowners"
    title="Explain the job once. Compare the right people properly."
    intro="BuildPair helps homeowners move from a problem or project idea to relevant local trades without needing to know the exact industry terminology first."
    sections={[
      { title: 'Search by the job you actually have', body: 'Type “tiler”, “bathroom”, “sink”, “roof leak”, “boiler”, “kitchen” or another normal description. Related-trade matching broadens the search intelligently rather than relying on one exact word.' },
      { title: 'Post a useful job', body: 'Add the job description, property type, location, timing, budget and photos so tradespeople can judge whether the work is a good fit before everybody wastes time.' },
      { title: 'Compare with more context', body: <View style={infoStyles.list}><Text style={infoStyles.item}>• Trade and service information</Text><Text style={infoStyles.item}>• Work galleries and project examples</Text><Text style={infoStyles.item}>• Ratings and customer reviews</Text><Text style={infoStyles.item}>• Location and working radius</Text><Text style={infoStyles.item}>• Quotes and job communication</Text></View> },
      { title: 'Stay in control', body: 'BuildPair gives you tools to compare and communicate, but you remain responsible for choosing who you appoint. For regulated work, check the relevant registrations, qualifications, insurance and documentation before work starts.' },
    ]}
  />;
}
