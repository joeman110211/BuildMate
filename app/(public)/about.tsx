import { Text, View } from 'react-native';
import { PublicInfoPage, infoStyles } from '@/components/PublicInfoPage';

export default function AboutPage() {
  return <PublicInfoPage
    eyebrow="About BuildPair"
    title="A better way to connect homeowners and tradespeople."
    intro="BuildPair is being built around a simple idea: finding reliable local work and finding the right person for a home project should both be much less painful than they are now."
    sections={[
      { title: 'What BuildPair is', body: 'BuildPair is a UK-focused marketplace and work-management platform. Homeowners can search trades, post jobs, compare profiles and quotes, while tradespeople can find work, present their business and manage customer jobs from the same account identity.' },
      { title: 'Why we are building it', body: 'Traditional trade directories often stop at discovery. BuildPair is designed to keep the useful parts together: matching, job details, profiles, reviews, messages, quotes and business paperwork.' },
      { title: 'Built around both sides', body: <View style={infoStyles.list}><Text style={infoStyles.item}>• Homeowners need clarity, confidence and an easier way to explain the job.</Text><Text style={infoStyles.item}>• Tradespeople need relevant local work, a strong public profile and less admin.</Text><Text style={infoStyles.item}>• Good matches matter more than simply producing the longest possible list of names.</Text></View> },
      { title: 'What we will not pretend', body: 'BuildPair is a platform, not the contractor carrying out the work. We can provide useful information, tools and marketplace signals, but customers must still make sensible checks for qualifications, insurance, registrations and suitability where those matter for a particular job.' },
    ]}
  />;
}
