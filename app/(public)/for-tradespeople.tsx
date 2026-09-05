import { Text, View } from 'react-native';
import { PublicInfoPage, infoStyles } from '@/components/PublicInfoPage';

export default function ForTradespeoplePage() {
  return <PublicInfoPage
    eyebrow="For tradespeople"
    title="A public profile, relevant local work and less admin nonsense."
    intro="BuildPair is built to help tradespeople show what they actually do, find suitable jobs and manage customer work without stitching together a directory, WhatsApp, notes and spreadsheets."
    sections={[
      { title: 'Build a profile that sells the work properly', body: 'Show your main trade, services, experience, service area, project photos, qualifications and customer reviews in one public profile.' },
      { title: 'Find more relevant jobs', body: 'Jobs are organised by category, location and customer requirements. The wider search taxonomy also helps homeowners find you when they describe the work rather than typing your exact trade title.' },
      { title: 'Keep the business side together', body: <View style={infoStyles.list}><Text style={infoStyles.item}>• Job leads and job board</Text><Text style={infoStyles.item}>• Customer messaging</Text><Text style={infoStyles.item}>• Quotes and quote comparison workflow</Text><Text style={infoStyles.item}>• Invoices and payment records</Text><Text style={infoStyles.item}>• Reviews that build your reputation</Text></View> },
      { title: 'Trial access', body: 'New tradespeople currently receive trial access while BuildPair is being prepared for full commercial launch. Paid subscription features and pricing can be introduced without changing the core profile and marketplace structure.' },
      { title: 'Your responsibility', body: 'You are responsible for keeping profile claims accurate and for holding any registrations, qualifications, licences and insurance required for the work you offer. BuildPair may moderate misleading or unsafe listings.' },
    ]}
  />;
}
