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

  // Lab-QC controlled preparation records
  lab: {
    title: string
    records: string
    templates: string
    members: string
    createLab: string
    createLabDescription: string
    labName: string
    country: string
    accreditationRef: string
    saveAndContinue: string
    loadingLab: string
    newPreparation: string
    manageTemplates: string
    recentRecords: string
    noRecords: string
    noApprovedTemplates: string
    newTemplate: string
    template: string
    version: string
    approved: string
    draft: string
    retired: string
    submitted: string
    released: string
    releasedWithDeviation: string
    rejected: string
    voided: string
    allStates: string
    createTemplate: string
    templateName: string
    targetConcentration: string
    targetVolume: string
    targetVolumeUnit: string
    concentrationUnit: string
    reagentForm: string
    solvent: string
    reagentPurity: string
    purityBasis: string
    preparationTemperature: string
    molarMass: string
    solutionDensity: string
    equivalentsFactor: string
    acceptanceLimit: string
    requiredFields: string
    instructions: string
    citations: string
    addItem: string
    removeItem: string
    create: string
    approve: string
    retire: string
    startPreparation: string
    measurements: string
    savePreview: string
    submitForReview: string
    withdraw: string
    release: string
    reject: string
    voidRecord: string
    reason: string
    deviationReason: string
    releaseApproval: string
    preview: string
    previewNotReleased: string
    asPrepared: string
    deviation: string
    uncertaintyBudget: string
    unavailable: string
    prepared: string
    reviewedReleased: string
    recordNumber: string
    issued: string
    eventHistory: string
    downloadPdf: string
    copyVerifyLink: string
    saveShareLink: string
    shareLinkUnavailable: string
    copied: string
    copyFailed: string
    requiredByTemplate: string
    requiredValueMissing: string
    errorPrefix: string
    legalSignature: string
    invitedEmail: string
    role: string
    noMembers: string
    createNewAttempt: string
    benchRecord: string
    reagentLot: string
    expiry: string
    coaAssay: string
    coaBasis: string
    actualNetMass: string
    deliveredVolume: string
    finalVolume: string
    balanceId: string
    flaskId: string
    temperature: string
    notes: string
    notesHelp: string
    equipmentUncertainty: string
    equipmentHelp: string
    roleRequired: string
    selectTemplate: string
    newestVersion: string
    declaredBenchInputs: string
    asPreparedResult: string
    withinAcceptance: string
    outsideAcceptance: string
    actualAmount: string
    noReasonRecorded: string
    evidenceRecord: string
    eventHashPrefix: string
    verificationQrCode: string
    verifyLinkUnavailable: string
    basisMass: string
    basisVolume: string
    unknownError: string
    requiredFieldsDisclaimer: string
    balanceStandardUncertainty: string
    flaskToleranceHalfWidth: string
    flaskCalibrationTemp: string
    fillRepeatabilitySd: string
    temperatureHalfWidth: string
    volumeExpansionCoefficient: string
    coaAssayToleranceHalfWidth: string
    uncertaintyTerm: string
    uncertaintyDistribution: string
    uncertaintyHalfWidthOrSd: string
    uncertaintyRelative: string
    uncertaintyBasis: string
    uncertaintyNotIncluded: string
    uncertaintySourceCoaAssay: string
    uncertaintySourceBalanceMass: string
    uncertaintySourceFlaskCalibration: string
    uncertaintySourceFillRepeatability: string
    uncertaintySourceTemperatureExpansion: string
    controlledPreparationLedger: string
    organizationAccess: string
    name: string
    preparationLedger: string
    selectApprovedTemplate: string
    versionedControlledSourceDocument: string
    molarMassHelp: string
    solutionDensityHelp: string
    equivalentsFactorHelp: string
    controlledSourceDocument: string
    target: string
    draftBelongsToAnotherPreparer: string
    roleOwner: string
    roleReviewer: string
    roleAnalyst: string
    roleViewer: string
    recordBenchMeasurements: string
    noRejectionReason: string
    storedEvidencePackUnavailable: string
    laboratoryNavigation: string
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

  lab: {
    title: 'Laboratory preparation records',
    records: 'Records',
    templates: 'Templates',
    members: 'Members',
    createLab: 'Create your laboratory',
    createLabDescription: 'Set up the organization that owns controlled preparation records.',
    labName: 'Laboratory name',
    country: 'Country (ISO 3166-1 alpha-2)',
    accreditationRef: 'Accreditation reference',
    saveAndContinue: 'Save and continue',
    loadingLab: 'Loading laboratory workspace…',
    newPreparation: 'New preparation',
    manageTemplates: 'Manage templates',
    recentRecords: 'Recent records',
    noRecords: 'No preparation records yet.',
    noApprovedTemplates: 'Approve a template before creating a preparation record.',
    newTemplate: 'New template',
    template: 'Template',
    version: 'Version',
    approved: 'Approved',
    draft: 'Draft',
    retired: 'Retired',
    submitted: 'Submitted',
    released: 'Released',
    releasedWithDeviation: 'Released with deviation',
    rejected: 'Rejected',
    voided: 'Voided',
    allStates: 'All states',
    createTemplate: 'Create template',
    templateName: 'Template name',
    targetConcentration: 'Target concentration',
    targetVolume: 'Target volume',
    targetVolumeUnit: 'Target volume unit',
    concentrationUnit: 'Concentration unit',
    reagentForm: 'Exact reagent form',
    solvent: 'Solvent',
    reagentPurity: 'Template reagent purity (%)',
    purityBasis: 'Purity basis',
    preparationTemperature: 'Preparation temperature (°C)',
    molarMass: 'Molar mass (g/mol)',
    solutionDensity: 'Solution density (g/mL)',
    equivalentsFactor: 'Equivalents factor',
    acceptanceLimit: 'Acceptance limit (± relative %)',
    requiredFields: 'Required preparation fields',
    instructions: 'Instructions',
    citations: 'Citations',
    addItem: 'Add item',
    removeItem: 'Remove',
    create: 'Create',
    approve: 'Approve',
    retire: 'Retire',
    startPreparation: 'Start preparation',
    measurements: 'Recorded measurements',
    savePreview: 'Save & refresh preview',
    submitForReview: 'Submit for review',
    withdraw: 'Withdraw to draft',
    release: 'Release',
    reject: 'Reject',
    voidRecord: 'Void record',
    reason: 'Reason',
    deviationReason: 'Deviation reason',
    releaseApproval: 'Release approval',
    preview: 'Preview',
    previewNotReleased: 'PREVIEW — not yet released',
    asPrepared: 'As-prepared concentration',
    deviation: 'Deviation from target',
    uncertaintyBudget: 'Uncertainty budget',
    unavailable: 'Unavailable',
    prepared: 'Prepared',
    reviewedReleased: 'Reviewed & released',
    recordNumber: 'Record number',
    issued: 'Issued',
    eventHistory: 'Record event history',
    downloadPdf: 'Download PDF',
    copyVerifyLink: 'Copy verify link',
    saveShareLink: 'Save this one-time share link',
    shareLinkUnavailable: 'The one-time public share token is unavailable in this browser. Members can still view the evidence pack.',
    copied: 'Copied',
    copyFailed: 'Could not copy the verify link.',
    requiredByTemplate: 'Required by this template',
    requiredValueMissing: 'A value is required by this template',
    errorPrefix: 'Server response:',
    legalSignature: 'This signature attests the integrity of this record as issued by VerChem; it does not attest the correctness of bench execution.',
    invitedEmail: 'Invited email',
    role: 'Role',
    noMembers: 'No active members found.',
    createNewAttempt: 'Create new attempt',
    benchRecord: 'Bench record',
    reagentLot: 'Reagent lot',
    expiry: 'Expiry',
    coaAssay: 'CoA assay (%)',
    coaBasis: 'CoA basis',
    actualNetMass: 'Actual net mass (g)',
    deliveredVolume: 'Delivered solute volume (mL)',
    finalVolume: 'Final volume (mL)',
    balanceId: 'Balance ID',
    flaskId: 'Flask ID',
    temperature: 'Temperature (°C)',
    notes: 'Notes',
    notesHelp: 'Notes are retained in the signed evidence pack after release.',
    equipmentUncertainty: 'Declared equipment uncertainty',
    equipmentHelp: 'Enter certified values where available. A blank optional term remains visibly not included; the engine will not infer it.',
    roleRequired: 'Reviewer role is required.',
    selectTemplate: 'Select template',
    newestVersion: 'newest',
    declaredBenchInputs: 'Declared bench inputs',
    asPreparedResult: 'As-prepared result',
    withinAcceptance: 'within acceptance',
    outsideAcceptance: 'outside acceptance',
    actualAmount: 'Actual amount',
    noReasonRecorded: 'No reason recorded.',
    evidenceRecord: 'Evidence record',
    eventHashPrefix: 'Event hash prefix',
    verificationQrCode: 'QR code for independent verification',
    verifyLinkUnavailable: 'Verify link unavailable',
    basisMass: 'mass',
    basisVolume: 'volume',
    unknownError: 'Something went wrong. Please try again.',
    requiredFieldsDisclaimer: 'Required-field indicators guide completion only; the server independently validates all transitions and calculations.',
    balanceStandardUncertainty: 'Balance standard uncertainty (g)',
    flaskToleranceHalfWidth: 'Flask tolerance half-width (mL)',
    flaskCalibrationTemp: 'Flask calibration temperature (°C)',
    fillRepeatabilitySd: 'Fill repeatability SD (mL)',
    temperatureHalfWidth: 'Temperature half-width (°C)',
    volumeExpansionCoefficient: 'Volume expansion coefficient (°C⁻¹)',
    coaAssayToleranceHalfWidth: 'CoA assay tolerance half-width (%)',
    uncertaintyTerm: 'Term',
    uncertaintyDistribution: 'Distribution',
    uncertaintyHalfWidthOrSd: 'Half-width / SD',
    uncertaintyRelative: 'u(x)/x',
    uncertaintyBasis: 'Basis',
    uncertaintyNotIncluded: 'not included',
    uncertaintySourceCoaAssay: 'CoA assay',
    uncertaintySourceBalanceMass: 'Balance mass',
    uncertaintySourceFlaskCalibration: 'Flask calibration',
    uncertaintySourceFillRepeatability: 'Fill repeatability',
    uncertaintySourceTemperatureExpansion: 'Temperature expansion',
    controlledPreparationLedger: 'Controlled preparation ledger',
    organizationAccess: 'Organization access',
    name: 'Name',
    preparationLedger: 'Preparation ledger',
    selectApprovedTemplate: 'Select an approved template to start a new controlled draft.',
    versionedControlledSourceDocument: 'Versioned controlled source document',
    molarMassHelp: 'Required by molar/normality targets.',
    solutionDensityHelp: 'Required for % w/w, ppm, and ppb mass-fraction targets.',
    equivalentsFactorHelp: 'Required for normality (N).',
    controlledSourceDocument: 'Controlled source document',
    target: 'Target',
    draftBelongsToAnotherPreparer: 'This draft belongs to another preparer and remains editable only by that preparer.',
    roleOwner: 'Owner',
    roleReviewer: 'Reviewer',
    roleAnalyst: 'Analyst',
    roleViewer: 'Viewer',
    recordBenchMeasurements: 'Record bench measurements to generate a server-calculated preview.',
    noRejectionReason: 'No rejection reason was returned.',
    storedEvidencePackUnavailable: 'Stored evidence pack is unavailable.',
    laboratoryNavigation: 'Laboratory navigation',
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

  lab: {
    title: 'บันทึกการเตรียมสารในห้องปฏิบัติการ',
    records: 'บันทึก',
    templates: 'แม่แบบ',
    members: 'สมาชิก',
    createLab: 'สร้างห้องปฏิบัติการของคุณ',
    createLabDescription: 'ตั้งค่าองค์กรที่เป็นเจ้าของบันทึกการเตรียมสารแบบควบคุม',
    labName: 'ชื่อห้องปฏิบัติการ',
    country: 'ประเทศ (ISO 3166-1 alpha-2)',
    accreditationRef: 'เลขอ้างอิงการรับรอง',
    saveAndContinue: 'บันทึกและดำเนินการต่อ',
    loadingLab: 'กำลังโหลดพื้นที่ทำงานห้องปฏิบัติการ…',
    newPreparation: 'เตรียมสารใหม่',
    manageTemplates: 'จัดการแม่แบบ',
    recentRecords: 'บันทึกล่าสุด',
    noRecords: 'ยังไม่มีบันทึกการเตรียมสาร',
    noApprovedTemplates: 'อนุมัติแม่แบบก่อนสร้างบันทึกการเตรียมสาร',
    newTemplate: 'แม่แบบใหม่',
    template: 'แม่แบบ',
    version: 'รุ่น',
    approved: 'อนุมัติแล้ว',
    draft: 'ฉบับร่าง',
    retired: 'เลิกใช้แล้ว',
    submitted: 'ส่งตรวจแล้ว',
    released: 'ออกบันทึกแล้ว',
    releasedWithDeviation: 'ออกบันทึกพร้อมข้อเบี่ยงเบน',
    rejected: 'ไม่อนุมัติ',
    voided: 'ยกเลิกแล้ว',
    allStates: 'ทุกสถานะ',
    createTemplate: 'สร้างแม่แบบ',
    templateName: 'ชื่อแม่แบบ',
    targetConcentration: 'ความเข้มข้นเป้าหมาย',
    targetVolume: 'ปริมาตรเป้าหมาย',
    targetVolumeUnit: 'หน่วยปริมาตรเป้าหมาย',
    concentrationUnit: 'หน่วยความเข้มข้น',
    reagentForm: 'รูปแบบสารรีเอเจนต์ที่แน่นอน',
    solvent: 'ตัวทำละลาย',
    reagentPurity: 'ความบริสุทธิ์สารในแม่แบบ (%)',
    purityBasis: 'ฐานความบริสุทธิ์',
    preparationTemperature: 'อุณหภูมิการเตรียม (°C)',
    molarMass: 'มวลโมลาร์ (g/mol)',
    solutionDensity: 'ความหนาแน่นสารละลาย (g/mL)',
    equivalentsFactor: 'ตัวคูณสมมูล',
    acceptanceLimit: 'เกณฑ์ยอมรับ (± ร้อยละสัมพัทธ์)',
    requiredFields: 'ข้อมูลการเตรียมที่ต้องระบุ',
    instructions: 'คำแนะนำ',
    citations: 'เอกสารอ้างอิง',
    addItem: 'เพิ่มรายการ',
    removeItem: 'ลบ',
    create: 'สร้าง',
    approve: 'อนุมัติ',
    retire: 'เลิกใช้',
    startPreparation: 'เริ่มเตรียมสาร',
    measurements: 'ค่าที่บันทึก',
    savePreview: 'บันทึกและอัปเดตตัวอย่าง',
    submitForReview: 'ส่งให้ตรวจทาน',
    withdraw: 'ถอนกลับเป็นฉบับร่าง',
    release: 'ออกบันทึก',
    reject: 'ไม่อนุมัติ',
    voidRecord: 'ยกเลิกบันทึก',
    reason: 'เหตุผล',
    deviationReason: 'เหตุผลของข้อเบี่ยงเบน',
    releaseApproval: 'การอนุมัติออกบันทึก',
    preview: 'ตัวอย่าง',
    previewNotReleased: 'ตัวอย่าง — ยังไม่ได้ออกบันทึก',
    asPrepared: 'ความเข้มข้นตามที่เตรียมจริง',
    deviation: 'ความเบี่ยงเบนจากเป้าหมาย',
    uncertaintyBudget: 'งบประมาณความไม่แน่นอน',
    unavailable: 'ไม่พร้อมใช้',
    prepared: 'ผู้เตรียม',
    reviewedReleased: 'ผู้ทบทวนและออกบันทึก',
    recordNumber: 'เลขบันทึก',
    issued: 'ออกเมื่อ',
    eventHistory: 'ประวัติเหตุการณ์บันทึก',
    downloadPdf: 'ดาวน์โหลด PDF',
    copyVerifyLink: 'คัดลอกลิงก์ตรวจสอบ',
    saveShareLink: 'บันทึกลิงก์แชร์แบบใช้ครั้งเดียวนี้',
    shareLinkUnavailable: 'ไม่พบโทเค็นลิงก์สาธารณะครั้งเดียวในเบราว์เซอร์นี้ สมาชิกยังเปิด evidence pack ได้',
    copied: 'คัดลอกแล้ว',
    copyFailed: 'ไม่สามารถคัดลอกลิงก์ตรวจสอบได้',
    requiredByTemplate: 'แม่แบบนี้กำหนดให้ระบุ',
    requiredValueMissing: 'แม่แบบนี้กำหนดให้ระบุค่า',
    errorPrefix: 'ข้อความจากเซิร์ฟเวอร์:',
    legalSignature: 'ลายเซ็นนี้รับรองความสมบูรณ์ของบันทึกตามที่ VerChem ออกให้ และไม่ได้รับรองความถูกต้องของการปฏิบัติงานบนโต๊ะปฏิบัติการ',
    invitedEmail: 'อีเมลที่เชิญ',
    role: 'บทบาท',
    noMembers: 'ไม่พบสมาชิกที่ยังใช้งาน',
    createNewAttempt: 'สร้างการเตรียมครั้งใหม่',
    benchRecord: 'บันทึกบนโต๊ะปฏิบัติการ',
    reagentLot: 'ล็อตสารรีเอเจนต์',
    expiry: 'วันหมดอายุ',
    coaAssay: 'ค่า CoA assay (%)',
    coaBasis: 'ฐาน CoA',
    actualNetMass: 'มวลสุทธิจริง (g)',
    deliveredVolume: 'ปริมาตรสารที่ตวงจริง (mL)',
    finalVolume: 'ปริมาตรสุดท้าย (mL)',
    balanceId: 'รหัสเครื่องชั่ง',
    flaskId: 'รหัสขวดวัดปริมาตร',
    temperature: 'อุณหภูมิ (°C)',
    notes: 'บันทึกเพิ่มเติม',
    notesHelp: 'บันทึกเพิ่มเติมจะอยู่ใน evidence pack ที่เซ็นแล้วหลังออกบันทึก',
    equipmentUncertainty: 'ความไม่แน่นอนของอุปกรณ์ที่ประกาศ',
    equipmentHelp: 'ระบุค่าจากใบรับรองเมื่อมี ช่องว่างของเทอมที่เลือกได้จะถูกแสดงว่าไม่รวม และ engine จะไม่อนุมานค่าให้',
    roleRequired: 'ต้องมีบทบาทผู้ตรวจทาน',
    selectTemplate: 'เลือกแม่แบบ',
    newestVersion: 'รุ่นล่าสุด',
    declaredBenchInputs: 'ข้อมูลการปฏิบัติงานที่ประกาศ',
    asPreparedResult: 'ผลการเตรียมจริง',
    withinAcceptance: 'อยู่ในเกณฑ์ยอมรับ',
    outsideAcceptance: 'นอกเกณฑ์ยอมรับ',
    actualAmount: 'ปริมาณที่ใช้จริง',
    noReasonRecorded: 'ไม่มีการบันทึกเหตุผล',
    evidenceRecord: 'บันทึกหลักฐาน',
    eventHashPrefix: 'คำนำหน้าแฮชเหตุการณ์',
    verificationQrCode: 'คิวอาร์โค้ดสำหรับการตรวจสอบอิสระ',
    verifyLinkUnavailable: 'ลิงก์ตรวจสอบไม่พร้อมใช้',
    basisMass: 'มวล',
    basisVolume: 'ปริมาตร',
    unknownError: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง',
    requiredFieldsDisclaimer: 'ตัวบ่งชี้ช่องบังคับมีไว้ช่วยตรวจความครบถ้วนเท่านั้น เซิร์ฟเวอร์จะตรวจสอบทุกการเปลี่ยนสถานะและการคำนวณโดยอิสระ',
    balanceStandardUncertainty: 'ความไม่แน่นอนมาตรฐานของเครื่องชั่ง (g)',
    flaskToleranceHalfWidth: 'ค่าครึ่งช่วงความคลาดเคลื่อนของขวดวัดปริมาตร (mL)',
    flaskCalibrationTemp: 'อุณหภูมิสอบเทียบขวดวัดปริมาตร (°C)',
    fillRepeatabilitySd: 'SD การเติมซ้ำ (mL)',
    temperatureHalfWidth: 'ค่าครึ่งช่วงอุณหภูมิ (°C)',
    volumeExpansionCoefficient: 'สัมประสิทธิ์การขยายตัวเชิงปริมาตร (°C⁻¹)',
    coaAssayToleranceHalfWidth: 'ค่าครึ่งช่วงความคลาดเคลื่อน CoA assay (%)',
    uncertaintyTerm: 'เทอม',
    uncertaintyDistribution: 'การแจกแจง',
    uncertaintyHalfWidthOrSd: 'ครึ่งช่วง / SD',
    uncertaintyRelative: 'u(x)/x',
    uncertaintyBasis: 'เกณฑ์อ้างอิง',
    uncertaintyNotIncluded: 'ไม่รวม',
    uncertaintySourceCoaAssay: 'CoA assay',
    uncertaintySourceBalanceMass: 'มวลจากเครื่องชั่ง',
    uncertaintySourceFlaskCalibration: 'การสอบเทียบขวดวัดปริมาตร',
    uncertaintySourceFillRepeatability: 'การเติมซ้ำ',
    uncertaintySourceTemperatureExpansion: 'การขยายตัวจากอุณหภูมิ',
    controlledPreparationLedger: 'ทะเบียนการเตรียมสารควบคุม',
    organizationAccess: 'สิทธิ์การเข้าถึงองค์กร',
    name: 'ชื่อ',
    preparationLedger: 'ทะเบียนการเตรียมสาร',
    selectApprovedTemplate: 'เลือกแม่แบบที่อนุมัติแล้วเพื่อเริ่มฉบับร่างการเตรียมสารใหม่',
    versionedControlledSourceDocument: 'เอกสารต้นทางควบคุมแบบมีรุ่น',
    molarMassHelp: 'จำเป็นสำหรับเป้าหมายแบบโมลาร์/นอร์มาลิตี',
    solutionDensityHelp: 'จำเป็นสำหรับเป้าหมาย % w/w, ppm และ ppb แบบเศษส่วนมวล',
    equivalentsFactorHelp: 'จำเป็นสำหรับนอร์มาลิตี (N)',
    controlledSourceDocument: 'เอกสารต้นทางควบคุม',
    target: 'เป้าหมาย',
    draftBelongsToAnotherPreparer: 'ฉบับร่างนี้เป็นของผู้เตรียมคนอื่น และแก้ไขได้โดยผู้เตรียมคนนั้นเท่านั้น',
    roleOwner: 'เจ้าของ',
    roleReviewer: 'ผู้ตรวจทาน',
    roleAnalyst: 'นักวิเคราะห์',
    roleViewer: 'ผู้ดู',
    recordBenchMeasurements: 'บันทึกค่าบนโต๊ะปฏิบัติการเพื่อสร้างตัวอย่างผลที่คำนวณโดยเซิร์ฟเวอร์',
    noRejectionReason: 'ไม่มีการส่งเหตุผลการไม่อนุมัติกลับมา',
    storedEvidencePackUnavailable: 'evidence pack ที่จัดเก็บไว้ไม่พร้อมใช้งาน',
    laboratoryNavigation: 'การนำทางห้องปฏิบัติการ',
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
