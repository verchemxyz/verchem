import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Air Quality Calculator - AQI, Thai Standards, Dispersion Model | VerChem',
  description: 'Calculate Air Quality Index (AQI), convert pollutant concentrations, check Thai PCD compliance, and model air pollutant dispersion. Free professional-grade air quality tools.',
  keywords: [
    'AQI calculator',
    'air quality index',
    'PM2.5 calculator',
    'Thai air quality standards',
    'กรมควบคุมมลพิษ',
    'ค่ามาตรฐานคุณภาพอากาศ',
    'ppm to µg/m³',
    'concentration conversion',
    'Gaussian dispersion',
    'plume rise',
    'Briggs equation',
    'emission rate',
    'air pollution',
    'environmental engineering',
  ],
  openGraph: {
    title: 'Air Quality Calculator | VerChem',
    description: 'Professional air quality tools: AQI calculation, unit conversion, Thai PCD standards compliance, and Gaussian dispersion modeling.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Air Quality Calculator | VerChem',
    description: 'Calculate AQI, convert concentrations, check Thai air quality standards compliance.',
  },
}

export default function AirQualityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
