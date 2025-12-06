// VerChem - Internationalization (i18n) Translations
// Currently supports: English (en), Thai (th)

export type Locale = 'en' | 'th'

export interface Translations {
  // Navigation
  nav: {
    home: string
    calculators: string
    periodicTable: string
    moleculeBuilder: string
    unitConverter: string
    backToHome: string
  }

  // Common
  common: {
    calculate: string
    clear: string
    result: string
    results: string
    example: string
    examples: string
    loading: string
    error: string
    success: string
    stepByStep: string
    formula: string
    value: string
    unit: string
    input: string
    output: string
    swap: string
    export: string
    copy: string
    copied: string
  }

  // Home Page
  home: {
    title: string
    subtitle: string
    description: string
    featuredTools: string
    allCalculators: string
    interactiveTools: string
    getStarted: string
  }

  // Equation Balancer
  equationBalancer: {
    title: string
    subtitle: string
    placeholder: string
    balance: string
    balanced: string
    unbalanced: string
    reactionType: string
    atomCount: string
    howItWorks: string
    tips: string
    examples: {
      synthesis: string
      decomposition: string
      combustion: string
      singleReplacement: string
      doubleReplacement: string
    }
  }

  // Stoichiometry
  stoichiometry: {
    title: string
    subtitle: string
    mode: {
      massToMass: string
      molesToMass: string
      massToMoles: string
      limitingReagent: string
      percentYield: string
    }
    molarMass: string
    amount: string
    moles: string
    mass: string
    limiting: string
    excess: string
    theoretical: string
    actual: string
    percentYield: string
  }

  // Solutions & pH
  solutions: {
    title: string
    subtitle: string
    mode: {
      pH: string
      pOH: string
      concentration: string
      dilution: string
      buffer: string
    }
    acidic: string
    neutral: string
    basic: string
    strong: string
    weak: string
    pKa: string
    pKb: string
    hendersonHasselbalch: string
  }

  // Gas Laws
  gasLaws: {
    title: string
    subtitle: string
    mode: {
      ideal: string
      combined: string
      boyle: string
      charles: string
      gayLussac: string
      dalton: string
      graham: string
      vanDerWaals: string
    }
    pressure: string
    volume: string
    temperature: string
    moles: string
    constant: string
  }

  // Kinetics
  kinetics: {
    title: string
    subtitle: string
    mode: {
      concentration: string
      rateConstant: string
      arrhenius: string
      activationEnergy: string
      reactionOrder: string
    }
    order: {
      zero: string
      first: string
      second: string
    }
    halfLife: string
    rate: string
    time: string
    initial: string
    final: string
  }

  // Thermodynamics
  thermodynamics: {
    title: string
    subtitle: string
    enthalpy: string
    entropy: string
    gibbsFreeEnergy: string
    spontaneous: string
    nonSpontaneous: string
    equilibrium: string
    exothermic: string
    endothermic: string
  }

  // Electrochemistry
  electrochemistry: {
    title: string
    subtitle: string
    cellPotential: string
    standardPotential: string
    nernstEquation: string
    anode: string
    cathode: string
    oxidation: string
    reduction: string
    faradaysLaw: string
  }

  // Unit Converter
  unitConverter: {
    title: string
    subtitle: string
    from: string
    to: string
    categories: {
      temperature: string
      pressure: string
      volume: string
      mass: string
      concentration: string
      energy: string
      amount: string
    }
    quickReference: string
  }

  // Periodic Table
  periodicTable: {
    title: string
    subtitle: string
    search: string
    filter: string
    categories: {
      all: string
      alkaliMetal: string
      alkalineEarth: string
      transitionMetal: string
      postTransitionMetal: string
      metalloid: string
      nonmetal: string
      halogen: string
      nobleGas: string
      lanthanide: string
      actinide: string
    }
    properties: {
      atomicNumber: string
      atomicMass: string
      electronConfig: string
      electronegativity: string
      ionizationEnergy: string
      meltingPoint: string
      boilingPoint: string
      density: string
      oxidationStates: string
    }
  }

  // Molecule Builder
  moleculeBuilder: {
    title: string
    subtitle: string
    mode: {
      addAtom: string
      addBond: string
      move: string
      delete: string
    }
    bondType: {
      single: string
      double: string
      triple: string
    }
    presets: string
    clearAll: string
    molecularFormula: string
    stable: string
    unstable: string
  }

  // Footer
  footer: {
    copyright: string
    builtWith: string
    educational: string
  }
}

// English translations
export const en: Translations = {
  nav: {
    home: 'Home',
    calculators: 'Calculators',
    periodicTable: 'Periodic Table',
    moleculeBuilder: 'Molecule Builder',
    unitConverter: 'Unit Converter',
    backToHome: '← Back to Home',
  },

  common: {
    calculate: 'Calculate',
    clear: 'Clear',
    result: 'Result',
    results: 'Results',
    example: 'Example',
    examples: 'Examples',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    stepByStep: 'Step-by-Step Solution',
    formula: 'Formula',
    value: 'Value',
    unit: 'Unit',
    input: 'Input',
    output: 'Output',
    swap: 'Swap',
    export: 'Export',
    copy: 'Copy',
    copied: 'Copied!',
  },

  home: {
    title: 'VerChem',
    subtitle: 'World-Class Chemistry Platform',
    description: 'Professional chemistry calculators, interactive periodic table, and molecule builder',
    featuredTools: 'Featured Tools',
    allCalculators: 'All Calculators',
    interactiveTools: 'Interactive Tools',
    getStarted: 'Get Started',
  },

  equationBalancer: {
    title: 'Equation Balancer',
    subtitle: 'Balance chemical equations automatically',
    placeholder: 'Enter equation (e.g., H2 + O2 -> H2O)',
    balance: 'Balance Equation',
    balanced: 'Balanced',
    unbalanced: 'Unbalanced',
    reactionType: 'Reaction Type',
    atomCount: 'Atom Count',
    howItWorks: 'How It Works',
    tips: 'Tips',
    examples: {
      synthesis: 'Synthesis',
      decomposition: 'Decomposition',
      combustion: 'Combustion',
      singleReplacement: 'Single Replacement',
      doubleReplacement: 'Double Replacement',
    },
  },

  stoichiometry: {
    title: 'Stoichiometry',
    subtitle: 'Calculate amounts of reactants and products',
    mode: {
      massToMass: 'Mass to Mass',
      molesToMass: 'Moles to Mass',
      massToMoles: 'Mass to Moles',
      limitingReagent: 'Limiting Reagent',
      percentYield: 'Percent Yield',
    },
    molarMass: 'Molar Mass',
    amount: 'Amount',
    moles: 'Moles',
    mass: 'Mass',
    limiting: 'Limiting',
    excess: 'Excess',
    theoretical: 'Theoretical Yield',
    actual: 'Actual Yield',
    percentYield: 'Percent Yield',
  },

  solutions: {
    title: 'Solutions & pH',
    subtitle: 'Calculate pH, pOH, and concentrations',
    mode: {
      pH: 'pH from [H⁺]',
      pOH: 'pOH from [OH⁻]',
      concentration: 'Concentration',
      dilution: 'Dilution',
      buffer: 'Buffer pH',
    },
    acidic: 'Acidic',
    neutral: 'Neutral',
    basic: 'Basic',
    strong: 'Strong',
    weak: 'Weak',
    pKa: 'pKa',
    pKb: 'pKb',
    hendersonHasselbalch: 'Henderson-Hasselbalch',
  },

  gasLaws: {
    title: 'Gas Laws',
    subtitle: 'Ideal gas, combined gas law, and more',
    mode: {
      ideal: 'Ideal Gas (PV=nRT)',
      combined: 'Combined Gas Law',
      boyle: "Boyle's Law",
      charles: "Charles's Law",
      gayLussac: "Gay-Lussac's Law",
      dalton: "Dalton's Law",
      graham: "Graham's Law",
      vanDerWaals: 'Van der Waals',
    },
    pressure: 'Pressure',
    volume: 'Volume',
    temperature: 'Temperature',
    moles: 'Moles',
    constant: 'Gas Constant (R)',
  },

  kinetics: {
    title: 'Chemical Kinetics',
    subtitle: 'Rate laws, Arrhenius, and half-life',
    mode: {
      concentration: 'Concentration',
      rateConstant: 'Rate Constant',
      arrhenius: 'Arrhenius Equation',
      activationEnergy: 'Activation Energy',
      reactionOrder: 'Reaction Order',
    },
    order: {
      zero: 'Zero Order',
      first: 'First Order',
      second: 'Second Order',
    },
    halfLife: 'Half-Life',
    rate: 'Rate',
    time: 'Time',
    initial: 'Initial',
    final: 'Final',
  },

  thermodynamics: {
    title: 'Thermodynamics',
    subtitle: 'ΔH, ΔS, ΔG calculations',
    enthalpy: 'Enthalpy (ΔH)',
    entropy: 'Entropy (ΔS)',
    gibbsFreeEnergy: "Gibbs Free Energy (ΔG)",
    spontaneous: 'Spontaneous',
    nonSpontaneous: 'Non-spontaneous',
    equilibrium: 'At Equilibrium',
    exothermic: 'Exothermic',
    endothermic: 'Endothermic',
  },

  electrochemistry: {
    title: 'Electrochemistry',
    subtitle: 'Cell potentials and redox reactions',
    cellPotential: 'Cell Potential',
    standardPotential: 'Standard Potential (E°)',
    nernstEquation: 'Nernst Equation',
    anode: 'Anode',
    cathode: 'Cathode',
    oxidation: 'Oxidation',
    reduction: 'Reduction',
    faradaysLaw: "Faraday's Law",
  },

  unitConverter: {
    title: 'Unit Converter',
    subtitle: 'Convert between chemistry units',
    from: 'From',
    to: 'To',
    categories: {
      temperature: 'Temperature',
      pressure: 'Pressure',
      volume: 'Volume',
      mass: 'Mass',
      concentration: 'Concentration',
      energy: 'Energy',
      amount: 'Amount (Moles)',
    },
    quickReference: 'Quick Reference',
  },

  periodicTable: {
    title: 'Interactive Periodic Table',
    subtitle: 'Explore all 118 elements',
    search: 'Search elements...',
    filter: 'Filter by category',
    categories: {
      all: 'All Elements',
      alkaliMetal: 'Alkali Metals',
      alkalineEarth: 'Alkaline Earth Metals',
      transitionMetal: 'Transition Metals',
      postTransitionMetal: 'Post-Transition Metals',
      metalloid: 'Metalloids',
      nonmetal: 'Nonmetals',
      halogen: 'Halogens',
      nobleGas: 'Noble Gases',
      lanthanide: 'Lanthanides',
      actinide: 'Actinides',
    },
    properties: {
      atomicNumber: 'Atomic Number',
      atomicMass: 'Atomic Mass',
      electronConfig: 'Electron Configuration',
      electronegativity: 'Electronegativity',
      ionizationEnergy: 'Ionization Energy',
      meltingPoint: 'Melting Point',
      boilingPoint: 'Boiling Point',
      density: 'Density',
      oxidationStates: 'Oxidation States',
    },
  },

  moleculeBuilder: {
    title: 'Molecule Builder',
    subtitle: 'Draw and build molecules',
    mode: {
      addAtom: 'Add Atom',
      addBond: 'Add Bond',
      move: 'Move',
      delete: 'Delete',
    },
    bondType: {
      single: 'Single',
      double: 'Double',
      triple: 'Triple',
    },
    presets: 'Preset Molecules',
    clearAll: 'Clear All',
    molecularFormula: 'Molecular Formula',
    stable: 'Stable',
    unstable: 'Unstable',
  },

  footer: {
    copyright: '© 2025 VerChem',
    builtWith: 'Built with Next.js & TypeScript',
    educational: 'Educational tool for students and researchers',
  },
}

// Thai translations
export const th: Translations = {
  nav: {
    home: 'หน้าแรก',
    calculators: 'เครื่องคำนวณ',
    periodicTable: 'ตารางธาตุ',
    moleculeBuilder: 'สร้างโมเลกุล',
    unitConverter: 'แปลงหน่วย',
    backToHome: '← กลับหน้าแรก',
  },

  common: {
    calculate: 'คำนวณ',
    clear: 'ล้าง',
    result: 'ผลลัพธ์',
    results: 'ผลลัพธ์',
    example: 'ตัวอย่าง',
    examples: 'ตัวอย่าง',
    loading: 'กำลังโหลด...',
    error: 'ข้อผิดพลาด',
    success: 'สำเร็จ',
    stepByStep: 'วิธีทำทีละขั้นตอน',
    formula: 'สูตร',
    value: 'ค่า',
    unit: 'หน่วย',
    input: 'ข้อมูลเข้า',
    output: 'ผลลัพธ์',
    swap: 'สลับ',
    export: 'ส่งออก',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว!',
  },

  home: {
    title: 'VerChem',
    subtitle: 'แพลตฟอร์มเคมีระดับโลก',
    description: 'เครื่องคำนวณเคมีระดับมืออาชีพ ตารางธาตุแบบโต้ตอบ และเครื่องมือสร้างโมเลกุล',
    featuredTools: 'เครื่องมือแนะนำ',
    allCalculators: 'เครื่องคำนวณทั้งหมด',
    interactiveTools: 'เครื่องมือแบบโต้ตอบ',
    getStarted: 'เริ่มต้นใช้งาน',
  },

  equationBalancer: {
    title: 'ดุลสมการเคมี',
    subtitle: 'ดุลสมการเคมีอัตโนมัติ',
    placeholder: 'ใส่สมการ (เช่น H2 + O2 -> H2O)',
    balance: 'ดุลสมการ',
    balanced: 'ดุลแล้ว',
    unbalanced: 'ยังไม่ดุล',
    reactionType: 'ประเภทปฏิกิริยา',
    atomCount: 'จำนวนอะตอม',
    howItWorks: 'วิธีการทำงาน',
    tips: 'เคล็ดลับ',
    examples: {
      synthesis: 'ปฏิกิริยาสังเคราะห์',
      decomposition: 'ปฏิกิริยาสลายตัว',
      combustion: 'ปฏิกิริยาการเผาไหม้',
      singleReplacement: 'ปฏิกิริยาแทนที่เดี่ยว',
      doubleReplacement: 'ปฏิกิริยาแทนที่คู่',
    },
  },

  stoichiometry: {
    title: 'สโตอิคิโอเมทรี',
    subtitle: 'คำนวณปริมาณสารตั้งต้นและผลิตภัณฑ์',
    mode: {
      massToMass: 'มวลเป็นมวล',
      molesToMass: 'โมลเป็นมวล',
      massToMoles: 'มวลเป็นโมล',
      limitingReagent: 'สารกำหนดปริมาณ',
      percentYield: 'ร้อยละผลได้',
    },
    molarMass: 'มวลโมลาร์',
    amount: 'ปริมาณ',
    moles: 'โมล',
    mass: 'มวล',
    limiting: 'สารกำหนดปริมาณ',
    excess: 'สารเกิน',
    theoretical: 'ผลได้ทางทฤษฎี',
    actual: 'ผลได้จริง',
    percentYield: 'ร้อยละผลได้',
  },

  solutions: {
    title: 'สารละลายและ pH',
    subtitle: 'คำนวณ pH, pOH และความเข้มข้น',
    mode: {
      pH: 'pH จาก [H⁺]',
      pOH: 'pOH จาก [OH⁻]',
      concentration: 'ความเข้มข้น',
      dilution: 'การเจือจาง',
      buffer: 'pH บัฟเฟอร์',
    },
    acidic: 'กรด',
    neutral: 'เป็นกลาง',
    basic: 'เบส',
    strong: 'แก่',
    weak: 'อ่อน',
    pKa: 'pKa',
    pKb: 'pKb',
    hendersonHasselbalch: 'สมการเฮนเดอร์สัน-แฮสเซลบาลค์',
  },

  gasLaws: {
    title: 'กฎของแก๊ส',
    subtitle: 'แก๊สอุดมคติ กฎรวมแก๊ส และอื่นๆ',
    mode: {
      ideal: 'แก๊สอุดมคติ (PV=nRT)',
      combined: 'กฎรวมแก๊ส',
      boyle: 'กฎของบอยล์',
      charles: 'กฎของชาร์ล',
      gayLussac: 'กฎของเกย์-ลูสแซก',
      dalton: 'กฎของดาลตัน',
      graham: 'กฎของเกรแฮม',
      vanDerWaals: 'สมการแวนเดอร์วาลส์',
    },
    pressure: 'ความดัน',
    volume: 'ปริมาตร',
    temperature: 'อุณหภูมิ',
    moles: 'จำนวนโมล',
    constant: 'ค่าคงที่แก๊ส (R)',
  },

  kinetics: {
    title: 'จลนพลศาสตร์เคมี',
    subtitle: 'กฎอัตรา อาร์รีเนียส และครึ่งชีวิต',
    mode: {
      concentration: 'ความเข้มข้น',
      rateConstant: 'ค่าคงที่อัตรา',
      arrhenius: 'สมการอาร์รีเนียส',
      activationEnergy: 'พลังงานกระตุ้น',
      reactionOrder: 'อันดับปฏิกิริยา',
    },
    order: {
      zero: 'อันดับศูนย์',
      first: 'อันดับหนึ่ง',
      second: 'อันดับสอง',
    },
    halfLife: 'ครึ่งชีวิต',
    rate: 'อัตรา',
    time: 'เวลา',
    initial: 'เริ่มต้น',
    final: 'สุดท้าย',
  },

  thermodynamics: {
    title: 'อุณหพลศาสตร์',
    subtitle: 'การคำนวณ ΔH, ΔS, ΔG',
    enthalpy: 'เอนทาลปี (ΔH)',
    entropy: 'เอนโทรปี (ΔS)',
    gibbsFreeEnergy: 'พลังงานเสรีกิบส์ (ΔG)',
    spontaneous: 'เกิดขึ้นเอง',
    nonSpontaneous: 'ไม่เกิดขึ้นเอง',
    equilibrium: 'อยู่ที่สมดุล',
    exothermic: 'คายความร้อน',
    endothermic: 'ดูดความร้อน',
  },

  electrochemistry: {
    title: 'เคมีไฟฟ้า',
    subtitle: 'ศักย์เซลล์และปฏิกิริยารีดอกซ์',
    cellPotential: 'ศักย์เซลล์',
    standardPotential: 'ศักย์มาตรฐาน (E°)',
    nernstEquation: 'สมการเนินสต์',
    anode: 'ขั้วแอโนด',
    cathode: 'ขั้วแคโทด',
    oxidation: 'ออกซิเดชัน',
    reduction: 'รีดักชัน',
    faradaysLaw: 'กฎของฟาราเดย์',
  },

  unitConverter: {
    title: 'แปลงหน่วย',
    subtitle: 'แปลงหน่วยที่ใช้ในเคมี',
    from: 'จาก',
    to: 'เป็น',
    categories: {
      temperature: 'อุณหภูมิ',
      pressure: 'ความดัน',
      volume: 'ปริมาตร',
      mass: 'มวล',
      concentration: 'ความเข้มข้น',
      energy: 'พลังงาน',
      amount: 'ปริมาณสาร (โมล)',
    },
    quickReference: 'อ้างอิงด่วน',
  },

  periodicTable: {
    title: 'ตารางธาตุแบบโต้ตอบ',
    subtitle: 'สำรวจธาตุทั้ง 118 ธาตุ',
    search: 'ค้นหาธาตุ...',
    filter: 'กรองตามประเภท',
    categories: {
      all: 'ธาตุทั้งหมด',
      alkaliMetal: 'โลหะอัลคาไล',
      alkalineEarth: 'โลหะอัลคาไลน์เอิร์ท',
      transitionMetal: 'โลหะแทรนซิชัน',
      postTransitionMetal: 'โลหะหลังแทรนซิชัน',
      metalloid: 'กึ่งโลหะ',
      nonmetal: 'อโลหะ',
      halogen: 'ธาตุหมู่แฮโลเจน',
      nobleGas: 'ก๊าซมีตระกูล',
      lanthanide: 'แลนทาไนด์',
      actinide: 'แอกทิไนด์',
    },
    properties: {
      atomicNumber: 'เลขอะตอม',
      atomicMass: 'มวลอะตอม',
      electronConfig: 'การจัดเรียงอิเล็กตรอน',
      electronegativity: 'อิเล็กโทรเนกาติวิตี',
      ionizationEnergy: 'พลังงานไอออไนเซชัน',
      meltingPoint: 'จุดหลอมเหลว',
      boilingPoint: 'จุดเดือด',
      density: 'ความหนาแน่น',
      oxidationStates: 'เลขออกซิเดชัน',
    },
  },

  moleculeBuilder: {
    title: 'สร้างโมเลกุล',
    subtitle: 'วาดและสร้างโมเลกุล',
    mode: {
      addAtom: 'เพิ่มอะตอม',
      addBond: 'เพิ่มพันธะ',
      move: 'เลื่อน',
      delete: 'ลบ',
    },
    bondType: {
      single: 'พันธะเดี่ยว',
      double: 'พันธะคู่',
      triple: 'พันธะสาม',
    },
    presets: 'โมเลกุลสำเร็จรูป',
    clearAll: 'ล้างทั้งหมด',
    molecularFormula: 'สูตรโมเลกุล',
    stable: 'เสถียร',
    unstable: 'ไม่เสถียร',
  },

  footer: {
    copyright: '© 2568 VerChem',
    builtWith: 'สร้างด้วย Next.js และ TypeScript',
    educational: 'เครื่องมือเพื่อการศึกษาสำหรับนักเรียนและนักวิจัย',
  },
}

// Translation lookup map
export const translations: Record<Locale, Translations> = {
  en,
  th,
}

// Get translation for locale
export function getTranslation(locale: Locale): Translations {
  return translations[locale] || translations.en
}

// Helper to get nested translation value
export function t(locale: Locale, path: string): string {
  const translation = getTranslation(locale)
  const keys = path.split('.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translation
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      console.warn(`Translation not found: ${path}`)
      return path
    }
  }

  return typeof value === 'string' ? value : path
}
