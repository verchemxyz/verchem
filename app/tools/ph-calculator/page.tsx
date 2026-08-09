import { permanentRedirect } from 'next/navigation'

/** Legacy route retained only as a permanent in-app redirect to the canonical calculator. */
export default function LegacyPHCalculatorPage() {
  permanentRedirect('/solutions')
}
