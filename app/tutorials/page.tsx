import { TutorialDashboard } from '@/components/tutorials/tutorial-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorials - VerChem',
  description: 'Interactive tutorials and learning resources for VerChem chemistry platform',
};

export default function TutorialsPage() {
  return <TutorialDashboard />;
}