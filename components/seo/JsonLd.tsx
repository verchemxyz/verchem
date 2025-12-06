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
