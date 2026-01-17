'use client'

import React from 'react'

interface WebApplicationSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  applicationCategory: string
  operatingSystem: string
  offers?: {
    '@type': string
    price: string
    priceCurrency: string
  }
  aggregateRating?: {
    '@type': string
    ratingValue: string
    ratingCount: string
  }
}

interface FAQSchema {
  '@context': string
  '@type': string
  mainEntity: Array<{
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }>
}

interface HowToSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  step: Array<{
    '@type': string
    name: string
    text: string
    position: number
  }>
}

interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  logo: string
  sameAs?: string[]
}

interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item: string
  }>
}

type SchemaType = WebApplicationSchema | FAQSchema | HowToSchema | OrganizationSchema | BreadcrumbSchema

interface JsonLdProps {
  schema: SchemaType | SchemaType[]
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Pre-built schemas for common tools

export function EquationBalancerSchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Chemical Equation Balancer',
      description: 'Free online tool to balance any chemical equation instantly. Supports redox, combustion, and synthesis reactions.',
      url: 'https://verchem.xyz/tools/equation-balancer',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '1250'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do you balance a chemical equation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'To balance a chemical equation: 1) Write the unbalanced equation, 2) Count atoms of each element on both sides, 3) Add coefficients to balance atoms, starting with the most complex molecule, 4) Verify all atoms are balanced.'
          }
        },
        {
          '@type': 'Question',
          name: 'Why must chemical equations be balanced?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Chemical equations must be balanced to satisfy the Law of Conservation of Mass, which states that matter cannot be created or destroyed. The number of atoms of each element must be the same on both sides of the equation.'
          }
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Balance Chemical Equations',
      description: 'Step-by-step guide to balancing chemical equations',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Write the unbalanced equation', text: 'Write reactants on the left and products on the right, separated by an arrow' },
        { '@type': 'HowToStep', position: 2, name: 'Count atoms', text: 'Count the number of atoms of each element on both sides' },
        { '@type': 'HowToStep', position: 3, name: 'Add coefficients', text: 'Add coefficients (numbers in front of formulas) to balance atoms' },
        { '@type': 'HowToStep', position: 4, name: 'Verify balance', text: 'Double-check that all atoms are balanced on both sides' }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function MolarMassSchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Molar Mass Calculator',
      description: 'Calculate molecular weight of any compound with element breakdown. Uses NIST atomic masses.',
      url: 'https://verchem.xyz/tools/molar-mass',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is molar mass?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Molar mass is the mass of one mole of a substance, expressed in grams per mole (g/mol). It equals the sum of the atomic masses of all atoms in the molecular formula.'
          }
        },
        {
          '@type': 'Question',
          name: 'How do I calculate molar mass?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Multiply the atomic mass of each element by its subscript (number of atoms), then add all values together. For H2O: (2 × 1.008) + (1 × 15.999) = 18.015 g/mol'
          }
        }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function PHCalculatorSchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'pH Calculator',
      description: 'Calculate pH, pOH, and ion concentrations. Visual pH scale included.',
      url: 'https://verchem.xyz/tools/ph-calculator',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is pH?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'pH is a measure of how acidic or basic a solution is, on a scale from 0 to 14. pH 7 is neutral, below 7 is acidic, and above 7 is basic. It is defined as the negative logarithm of hydrogen ion concentration: pH = -log[H+].'
          }
        },
        {
          '@type': 'Question',
          name: 'What is the relationship between pH and pOH?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'pH and pOH are complementary. At 25°C: pH + pOH = 14. If you know one value, you can calculate the other by subtracting from 14.'
          }
        }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function GasLawsSchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gas Laws Calculator',
      description: 'Calculate gas properties using Ideal Gas Law, Boyle\'s Law, Charles\'s Law, and more.',
      url: 'https://verchem.xyz/tools/gas-laws',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the Ideal Gas Law?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Ideal Gas Law (PV = nRT) relates pressure (P), volume (V), amount of gas in moles (n), and temperature (T). R is the universal gas constant (8.314 J/mol·K).'
          }
        }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function StoichiometrySchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Stoichiometry Calculator',
      description: 'Solve stoichiometry problems with step-by-step solutions. Mass-mole conversions, limiting reagent, percent yield.',
      url: 'https://verchem.xyz/tools/stoichiometry',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is stoichiometry?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Stoichiometry is the calculation of quantities of reactants and products in chemical reactions. It uses mole ratios from balanced equations to convert between masses, moles, and particles.'
          }
        }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function PeriodicTableSchema() {
  const schema: SchemaType[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Interactive Periodic Table',
      description: 'Explore all 118 elements with detailed properties. NIST/IUPAC certified data.',
      url: 'https://verchem.xyz/tools/periodic-table',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How many elements are in the periodic table?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'There are 118 confirmed elements. Elements 1-94 occur naturally, while 95-118 are synthetic. The latest additions (113-118) were confirmed by IUPAC in 2016.'
          }
        }
      ]
    }
  ]

  return <JsonLd schema={schema} />
}

export function VerChemOrganizationSchema() {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VerChem',
    url: 'https://verchem.xyz',
    logo: 'https://verchem.xyz/logo.png',
    sameAs: [
      'https://twitter.com/verchem',
      'https://github.com/verchemxyz'
    ]
  }

  return <JsonLd schema={schema} />
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <JsonLd schema={schema} />
}

// ============================================
// Global FAQ Schema for AI Discoverability
// ============================================

export function VerChemGlobalFAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      // General Questions
      {
        '@type': 'Question',
        name: 'What is VerChem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem is a free, professional-grade chemistry platform offering 8 chemistry calculators, 3 environmental engineering tools, an interactive periodic table with all 118 elements (NIST/IUPAC certified), and a database of 1,000+ compounds. Built for students, chemists, and engineers.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is VerChem free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! All VerChem features are completely free for AIVerID members. We follow a "Free First" strategy to make world-class chemistry tools accessible to everyone worldwide.'
        }
      },
      {
        '@type': 'Question',
        name: 'How accurate is VerChem data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem uses NIST (National Institute of Standards and Technology) and IUPAC (International Union of Pure and Applied Chemistry) as authoritative data sources. All 118 elements have certified atomic masses and properties updated to 2021 standards.'
        }
      },
      // Calculator Questions
      {
        '@type': 'Question',
        name: 'What calculators does VerChem offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem offers 8 chemistry calculators: Molar Mass, Equation Balancer, Stoichiometry (8 modes), pH Calculator (7 modes), Gas Laws (9 modes including Van der Waals), Thermodynamics, Chemical Kinetics, and Electrochemistry. Plus 3 environmental tools: Water Quality, Air Quality, and Soil Quality.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I calculate molar mass?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter a chemical formula (e.g., H2SO4, NaCl, C6H12O6) into the Molar Mass Calculator. It automatically calculates molecular weight by summing atomic masses × subscripts. For H2O: (2 × 1.008) + (1 × 15.999) = 18.015 g/mol. Uses NIST atomic masses.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I balance a chemical equation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter your unbalanced equation (e.g., H2 + O2 -> H2O) into the Equation Balancer. It uses algebraic matrix methods to find the smallest whole-number coefficients. The balanced result: 2H2 + O2 -> 2H2O. Works for redox, combustion, and synthesis reactions.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the Ideal Gas Law formula?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Ideal Gas Law is PV = nRT, where P = pressure, V = volume, n = moles of gas, R = gas constant (8.314 J/mol·K or 0.0821 L·atm/mol·K), and T = temperature in Kelvin. VerChem Gas Laws Calculator supports 9 modes including Combined Gas Law and Van der Waals equation.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I calculate pH from concentration?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'pH = -log[H+]. For a 0.01 M HCl solution: pH = -log(0.01) = 2. For bases, calculate pOH first, then pH = 14 - pOH. VerChem pH Calculator handles strong/weak acids and bases, buffer solutions, and shows visual pH scale.'
        }
      },
      // Environmental Engineering
      {
        '@type': 'Question',
        name: 'What is BOD and COD in water quality?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BOD (Biochemical Oxygen Demand) measures oxygen consumed by microorganisms decomposing organic matter over 5 days at 20°C. COD (Chemical Oxygen Demand) measures total oxygen needed to chemically oxidize all organic matter. BOD/COD ratio indicates biodegradability: <0.3 = non-biodegradable, 0.3-0.6 = moderately biodegradable, >0.6 = highly biodegradable.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are Thai water quality standards?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Thai PCD (Pollution Control Department) standards: Type ก (Industrial): BOD ≤20, COD ≤120, SS ≤50 mg/L. Type ข (Relaxed Industrial): BOD ≤60, COD ≤400, SS ≤150 mg/L. Type ค (Community): BOD ≤40, COD ≤200, SS ≤70 mg/L. VerChem Water Quality Calculator includes Thai standards compliance checker.'
        }
      },
      // Periodic Table
      {
        '@type': 'Question',
        name: 'How many elements are in the periodic table?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'There are 118 confirmed elements. Elements 1-94 occur naturally (though some like Technetium and Promethium are extremely rare). Elements 95-118 are synthetic, created in laboratories. The latest additions (Nihonium, Moscovium, Tennessine, Oganesson) were confirmed by IUPAC in 2016.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are rare earth elements?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Rare earth elements include 17 elements: Scandium (Sc), Yttrium (Y), and the 15 Lanthanides (La-Lu: Lanthanum, Cerium, Praseodymium, Neodymium, Promethium, Samarium, Europium, Gadolinium, Terbium, Dysprosium, Holmium, Erbium, Thulium, Ytterbium, Lutetium). Despite the name, most are not rare but are difficult to separate from each other.'
        }
      },
      // Stoichiometry
      {
        '@type': 'Question',
        name: 'What is a limiting reagent?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A limiting reagent is the reactant that is completely consumed first in a chemical reaction, determining the maximum amount of product that can be formed. VerChem Stoichiometry Calculator identifies the limiting reagent and calculates theoretical yield, actual yield, and percent yield.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I convert moles to grams?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mass (g) = Moles × Molar Mass (g/mol). For example, 2 moles of water: 2 mol × 18.015 g/mol = 36.03 g. To convert grams to moles, divide: Moles = Mass / Molar Mass.'
        }
      },
      // VerChem vs AI Comparison
      {
        '@type': 'Question',
        name: 'What is the difference between VerChem and asking AI like ChatGPT for chemistry calculations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem and AI chatbots serve different purposes. VerChem provides 100% accurate calculations every time using verified formulas and NIST/IUPAC certified data - the same result guaranteed on every calculation. AI chatbots like ChatGPT are excellent for explanations and learning concepts, but may occasionally make calculation errors (hallucination), give inconsistent results, or use outdated atomic masses. For critical calculations (lab work, exams, engineering), use VerChem. For understanding concepts and getting explanations, AI chatbots are great companions. Best practice: Use both together - VerChem for accurate calculations, AI for deeper understanding.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can AI chatbots replace chemistry calculators like VerChem?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, they serve complementary roles. AI chatbots may: 1) Calculate atomic masses incorrectly (off by 1-2 decimal places), 2) Make errors in complex equation balancing, 3) Give different answers each time you ask, 4) Not know specialized standards like Thai PCD water quality limits. VerChem guarantees: 1) NIST-certified atomic masses for all 118 elements, 2) Deterministic results (same input = same output, always), 3) Calculation speed under 50ms, 4) Thai regulatory standards built-in. Use VerChem when accuracy matters, AI when you need explanations or learning support.'
        }
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================
// SoftwareApplication Schema for AI Discovery
// ============================================

export function VerChemSoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VerChem',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: 'https://verchem.xyz',
    description: 'Free professional-grade chemistry platform with 8 calculators, 3 environmental tools, periodic table (118 elements), and 1,000+ compounds database. NIST/IUPAC certified data.',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free for all AIVerID members'
      }
    ],
    featureList: [
      'Molar Mass Calculator',
      'Chemical Equation Balancer',
      'Stoichiometry Calculator (8 modes)',
      'pH Calculator (7 modes)',
      'Gas Laws Calculator (9 modes)',
      'Thermodynamics Calculator',
      'Chemical Kinetics Calculator',
      'Electrochemistry Calculator',
      'Water Quality Calculator (BOD/COD, Thai PCD Standards)',
      'Air Quality Calculator (AQI)',
      'Soil Quality Calculator',
      'Interactive Periodic Table (118 elements)',
      'Compounds Database (1,000+ chemicals)',
      'Step-by-step Solutions',
      'Uncertainty Analysis'
    ],
    availableLanguage: ['en'],
    screenshot: 'https://verchem.xyz/og-image.png'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================
// Environmental Engineering Tool Schemas
// ============================================

export function WaterQualitySchema() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Water Quality Calculator',
      description: 'Calculate BOD5, BODu, COD, BOD/COD ratio, organic loading, treatment efficiency. Includes Thai PCD standards compliance checker.',
      url: 'https://verchem.xyz/tools/water-quality',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is BOD5?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'BOD5 (5-day Biochemical Oxygen Demand) measures the oxygen consumed by microorganisms while decomposing organic matter in water over 5 days at 20°C. It indicates the biodegradable organic pollution level. Standard formula: BOD5 = BODu × (1 - e^(-k×t)) where k is the decay rate.'
          }
        },
        {
          '@type': 'Question',
          name: 'What does the BOD/COD ratio indicate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'BOD/COD ratio indicates biodegradability: <0.3 = non-biodegradable (needs chemical treatment), 0.3-0.6 = moderately biodegradable (biological treatment possible), >0.6 = highly biodegradable (ideal for biological treatment). Domestic wastewater typically has ratio 0.4-0.8.'
          }
        },
        {
          '@type': 'Question',
          name: 'What are Thai industrial wastewater standards?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Thai PCD Type ก (Standard Industrial): BOD ≤20 mg/L, COD ≤120 mg/L, SS ≤50 mg/L, TDS ≤3,000 mg/L, pH 5.5-9.0. These are discharge standards for industrial effluent to public water bodies per Ministry of Industry regulations.'
          }
        }
      ]
    }
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function AirQualitySchema() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Air Quality Calculator',
      description: 'Calculate Air Quality Index (AQI), pollutant concentrations, and health impact assessment for PM2.5, PM10, O3, NO2, SO2, CO.',
      url: 'https://verchem.xyz/tools/air-quality',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is AQI (Air Quality Index)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AQI is a scale from 0-500 measuring air pollution levels. 0-50: Good (green), 51-100: Moderate (yellow), 101-150: Unhealthy for sensitive groups (orange), 151-200: Unhealthy (red), 201-300: Very unhealthy (purple), 301-500: Hazardous (maroon).'
          }
        },
        {
          '@type': 'Question',
          name: 'What is PM2.5?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PM2.5 refers to particulate matter with diameter ≤2.5 micrometers. These fine particles can penetrate deep into lungs and bloodstream. WHO guideline: 24-hour mean ≤15 μg/m³, annual mean ≤5 μg/m³. Thailand standard: 24-hour ≤50 μg/m³.'
          }
        }
      ]
    }
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoilQualitySchema() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Soil Quality Calculator',
      description: 'Analyze soil composition, texture classification, contamination assessment, nutrient levels, and CEC calculations.',
      url: 'https://verchem.xyz/tools/soil-quality',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is soil texture?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Soil texture is determined by the proportion of sand (0.05-2mm), silt (0.002-0.05mm), and clay (<0.002mm) particles. The USDA soil texture triangle classifies soils into 12 classes: sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, and clay.'
          }
        },
        {
          '@type': 'Question',
          name: 'What is CEC in soil?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CEC (Cation Exchange Capacity) measures soil ability to hold positively charged ions (Ca²⁺, Mg²⁺, K⁺, Na⁺). Expressed in meq/100g or cmol/kg. Low CEC (<10): sandy soils, poor nutrient retention. Medium (10-20): loamy soils. High (>20): clay soils, good nutrient retention.'
          }
        }
      ]
    }
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
