'use client'

import React from 'react'
import { SOLUTIONS_MODE_COUNT } from '@/lib/config/solutions'

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
      description: 'Free online tool to balance molecular chemical equations. Supports redox, combustion, synthesis and decomposition reactions written in molecular form.',
      url: 'https://verchem.xyz/tools/equation-balancer',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      // No aggregateRating: we have no review system, so any figure here would
      // be fabricated review data published as structured data.
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
      description: 'Calculate molar mass from supported fixed-composition formulas with an element breakdown, using standard atomic weights based on the IUPAC 2021 table.',
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
      description: 'Calculate molarity, strong- and weak-acid/base pH, buffer pH, and dilution with a declared ideal-dilute aqueous model at 25 °C.',
      url: 'https://verchem.xyz/solutions',
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
            text: 'Thermodynamic pH is defined from hydrogen-ion activity. This educational calculator uses hydrogen-ion molar concentration as an activity approximation for ideal-dilute aqueous solutions at 25 °C.'
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
      description: 'Explore all 118 elements with standard atomic weights based on IUPAC 2021 and selected properties citing NIST and CRC references.',
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

export function VerChemGlobalFAQSchema({ compoundCount }: { compoundCount: number }) {
  const formattedCompoundCount = compoundCount.toLocaleString('en-US')
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
          text: `VerChem is a free chemistry platform offering deterministic calculators, a 2D structure editor with substructure and similarity search, spectroscopy and lab-safety references, an interactive periodic table with all 118 elements, and a database of ${formattedCompoundCount} compounds. Published element references include IUPAC and NIST. Built for students, chemists, and engineers.`
        }
      },
      {
        '@type': 'Question',
        name: 'Is VerChem free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The chemistry tools are free to use, with no per-calculation charge and no paid tier gating the chemistry itself.'
        }
      },
      {
        '@type': 'Question',
        name: 'How accurate is VerChem data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem cites published reference sources: standard atomic weights are based on the IUPAC 2021 table, while selected physical properties cite NIST and the CRC Handbook. VerChem is not certified by those organizations, and property coverage varies by element.'
        }
      },
      // Calculator Questions
      {
        '@type': 'Question',
        name: 'What calculators does VerChem offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `VerChem offers 8 chemistry calculators: Molar Mass, Equation Balancer, Stoichiometry (8 modes), pH Calculator (${SOLUTIONS_MODE_COUNT} modes), Gas Laws (9 modes including Van der Waals), Thermodynamics, Chemical Kinetics, and Electrochemistry. Plus interactive tools: 3D Molecular Viewer, Lewis Structures, VSEPR Geometry, and a table covering all 118 elements.`
        }
      },
      {
        '@type': 'Question',
        name: 'How do I calculate molar mass?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter a supported chemical formula (e.g., H2SO4, NaCl, C6H12O6) into the Molar Mass Calculator. It calculates molar mass by summing standard atomic weights × subscripts. For H2O: (2 × 1.008) + (1 × 15.999) = 18.015 g/mol. The standard atomic weights are based on the IUPAC 2021 table.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I balance a chemical equation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter your unbalanced equation (e.g., H2 + O2 -> H2O) into the Equation Balancer. It uses algebraic matrix methods to find the smallest whole-number coefficients. The balanced result: 2H2 + O2 -> 2H2O. Works for redox, combustion, synthesis and decomposition reactions written in molecular form; ionic half-equations with charges are not supported.'
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
      // How VerChem differs from a language model answering the same question
      {
        '@type': 'Question',
        name: 'How is VerChem different from asking an AI chatbot for a chemistry calculation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'VerChem computes with deterministic engines rather than a language model. The same input always produces the same output. An optional Verified Answer Card records the exact inputs, semantic engine release, output, textbook citation, AI explanation, and a signature covering them so the engine fields can be replayed and compared later. Signature integrity and current-engine agreement are reported separately; cards from replaced releases are marked superseded or corrected instead of current VERIFIED. A chatbot writes its answer as text: it can vary between runs and leaves no record to re-check.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is a VerChem result guaranteed to be correct?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It is reproducible, not infallible. A VerChem calculation is deterministic — identical inputs always give identical output — and cites published element references including IUPAC and NIST. Required physical inputs such as solution density or a reaction-specific equivalents factor must be supplied; calculations that need a missing value are rejected rather than guessed. Any listed assumptions describe the declared model scope. Verified Answer Cards are tamper-evident: any later edit breaks the signature. That signature proves the signed record was not altered; current validity is a separate replay check, and neither property proves the chemistry model applies to your situation.'
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

export function VerChemSoftwareApplicationSchema({ compoundCount }: { compoundCount: number }) {
  const formattedCompoundCount = compoundCount.toLocaleString('en-US')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VerChem',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: 'https://verchem.xyz',
    description: `Free chemistry platform with 8 deterministic calculators, a 2D structure editor with substructure search, an interactive periodic table (118 elements), and a ${formattedCompoundCount}-compound database. Element data cites published IUPAC and NIST references.`,
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
      `pH Calculator (${SOLUTIONS_MODE_COUNT} modes)`,
      'Gas Laws Calculator (9 modes)',
      'Thermodynamics Calculator',
      'Chemical Kinetics Calculator',
      'Electrochemistry Calculator',
      'Interactive Periodic Table (118 elements)',
      `Compounds Database (${formattedCompoundCount} records)`,
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
