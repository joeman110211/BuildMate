import { Text, View } from 'react-native';
import { PublicInfoPage, infoStyles } from '@/components/PublicInfoPage';

export default function HowItWorksPage() {
  return <PublicInfoPage
    eyebrow="How it works"
    title="From ‘I need this fixed’ to the right person for the job."
    intro="BuildPair is designed to work even when you know what the problem is but have no idea what the proper trade name is."
    sections={[
      { title: '1. Search or post the job', body: 'Search by trade, service or plain-English problem. You can also create a fuller job post with location, budget, urgency, description and photos.' },
      { title: '2. BuildPair finds related trades', body: 'The search checks trade categories, services, skills and related terms. A search for “bathroom”, for example, can sensibly surface bathroom fitters, tilers and plumbers instead of demanding one exact keyword.' },
      { title: '3. Compare before you choose', body: <View style={infoStyles.list}><Text style={infoStyles.item}>• Business profile and main trade</Text><Text style={infoStyles.item}>• Skills and services</Text><Text style={infoStyles.item}>• Work gallery and project examples</Text><Text style={infoStyles.item}>• Customer reviews and ratings</Text><Text style={infoStyles.item}>• Service area and experience information</Text></View> },
      { title: '4. Keep the job organised', body: 'Once connected, BuildPair is intended to keep messages, quotes, job progress and business paperwork together so neither side has to piece the project together from five different apps.' },
      { title: '5. Leave useful feedback', body: 'Reviews help future homeowners make better choices and help good tradespeople build a reputation that reflects completed work rather than who shouts loudest in an advert.' },
    ]}
  />;
}
