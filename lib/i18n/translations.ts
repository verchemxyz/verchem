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
    beforeYouBegin: string
    beforeYouBeginTeam: string
    beforeYouBeginTemplateReview: string
    beforeYouBeginRecordRelease: string
    labName: string
    country: string
    accreditationRef: string
    saveAndContinue: string
    loadingLab: string
    newPreparation: string
    manageTemplates: string
    recentRecords: string
    noRecords: string
    noRecordsInSelectedState: string
    noApprovedTemplates: string
    noTemplatesYet: string
    noApprovedTemplatesCreate: string
    noApprovedTemplatesReview: string
    ownerReviewerTemplateRequired: string
    newTemplate: string
    viewTemplate: string
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
    recordEventCreated: string
    recordEventEdited: string
    recordEventSubmitted: string
    recordEventWithdrawn: string
    recordEventReleased: string
    recordEventRejected: string
    recordEventVoided: string
    recordEventShareLinkRotated: string
    recordEventUpdated: string
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
    inviteColleague: string
    inviteColleagueHelp: string
    emailAddress: string
    displayNameOptional: string
    sendInvitation: string
    invitationSent: string
    memberStatus: string
    statusPending: string
    statusActive: string
    reasonRequired: string
    emailFormatHint: string
    createNewAttempt: string
    labWorkspace: string
    whatToDoNext: string
    nextCreateFirstTemplate: string
    nextCreateFirstTemplateHelp: string
    nextInviteColleague: string
    nextInviteColleagueHelp: string
    nextPendingReviewerSignIn: string
    nextPendingReviewerSignInHelp: string
    nextApproveTemplate: string
    nextApproveTemplateHelp: string
    nextReviewSubmittedHelp: string
    nextAwaitTemplateApproval: string
    nextAwaitTemplateApprovalHelp: string
    nextResumeDraft: string
    nextResumeDraftHelp: string
    nextStartPreparation: string
    nextStartPreparationHelp: string
    nextRequestPreparation: string
    nextRequestPreparationHelp: string
    waitingForYourReview: string
    myDrafts: string
    recentlyReleasedEvidence: string
    templateCreatorCannotApprove: string
    templateCreatorCannotApproveHelp: string
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
    viewerCannotStartPreparation: string
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
    verifierCompactJwsArtifact: string
    verifierMalformedEvidenceLink: string
    verifierEvidencePackLoadFailed: string
    verifierPublicKeysLoadFailed: string
    verifierUnexpectedFailure: string
    verifierFileTooLarge: string
    verifierVerifying: string
    verifierVerifyButton: string
    verifierLoadJws: string
    verifierInspectJwks: string
    verifierLocalChecksHelp: string
    verifierCurrentHeadline: string
    verifierNotCurrentHeadline: string
    verifierVoidedHeadline: string
    verifierCurrentDetail: string
    verifierVoidedDetail: string
    verifierReviewDetail: string
    verifierSignatureAuthenticity: string
    verifierSignaturePass: string
    verifierSignatureFail: string
    verifierProvenanceIntegrity: string
    verifierProvenancePass: string
    verifierProvenanceFail: string
    verifierProvenanceHistorical: string
    verifierReleaseManifest: string
    verifierManifestCurrent: string
    verifierManifestSuperseded: string
    verifierManifestMismatch: string
    verifierManifestUnavailable: string
    verifierManifestHistorical: string
    verifierCurrentEngineReplay: string
    verifierReplayNotAttempted: string
    verifierApplicability: string
    verifierNoApplicability: string
    verifierLiveStatus: string
    verifierLiveReleased: string
    verifierLiveVoided: string
    verifierLiveUnavailable: string
    verifierDecodedPayload: string
    verifierStatePass: string
    verifierStateWarn: string
    verifierStateFail: string
    compactJwsTitle: string
    compactJwsHelp: string
    copyJws: string
    copyJwsFailed: string
    jwsCopied: string
    downloadJws: string
    requestNewShareLink: string
    rotatingShareLink: string
    shareLinkRotated: string
    shareLinkRotationFailed: string
    recordChangedReloaded: string
    legalPrivacyLabOverview: string
    legalPrivacyLabData: string
    legalPrivacyRetentionGeneral: string
    legalPrivacyRetentionLab: string
    legalTermsEducationSurface: string
    legalTermsLabSurface: string
    legalTermsLabVerified: string
    legalTermsYourContent: string
    legalTermsDonations: string
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
    beforeYouBegin: 'Before you begin',
    beforeYouBeginTeam: 'At least two AIVerID users are required to complete the controlled workflow.',
    beforeYouBeginTemplateReview: 'A template creator cannot approve their own template.',
    beforeYouBeginRecordRelease: 'A preparer cannot release their own preparation record.',
    labName: 'Laboratory name',
    country: 'Country (ISO 3166-1 alpha-2)',
    accreditationRef: 'Accreditation reference',
    saveAndContinue: 'Save and continue',
    loadingLab: 'Loading laboratory workspace…',
    newPreparation: 'New preparation',
    manageTemplates: 'Manage templates',
    recentRecords: 'Recent records',
    noRecords: 'No preparation records yet. Start a new preparation from an approved template.',
    noRecordsInSelectedState: 'No preparation records match this filter. Choose another state to see other records.',
    noApprovedTemplates: 'Approve a template before creating a preparation record.',
    noTemplatesYet: 'No templates yet. Create the first template to begin controlled preparation.',
    noApprovedTemplatesCreate: 'No approved templates are available. Create a template, then have a different owner or reviewer approve it.',
    noApprovedTemplatesReview: 'No approved templates are available. A draft template is awaiting review.',
    ownerReviewerTemplateRequired: 'An owner or reviewer must create the first template, and a different owner or reviewer must approve it before a preparation can start.',
    newTemplate: 'New template',
    viewTemplate: 'View template',
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
    recordEventCreated: 'Record created',
    recordEventEdited: 'Measurements saved',
    recordEventSubmitted: 'Submitted for review',
    recordEventWithdrawn: 'Withdrawn to draft',
    recordEventReleased: 'Released',
    recordEventRejected: 'Rejected',
    recordEventVoided: 'Voided',
    recordEventShareLinkRotated: 'Verification link replaced',
    recordEventUpdated: 'Record updated',
    downloadPdf: 'Download PDF',
    copyVerifyLink: 'Copy verify link',
    saveShareLink: 'Save this one-time share link',
    shareLinkUnavailable: 'The one-time public share token is unavailable in this browser. Members can still view the evidence pack.',
    copied: 'Copied',
    copyFailed: 'The verify link was not copied. Copy it manually from the field below.',
    requiredByTemplate: 'Required by this template',
    requiredValueMissing: 'A value is required by this template',
    errorPrefix: 'Server response:',
    legalSignature: 'This signature attests the integrity of this record as issued by VerChem; it does not attest the correctness of bench execution.',
    invitedEmail: 'Invited email',
    role: 'Role',
    noMembers: 'No members have joined this laboratory yet. Ask an owner to invite a colleague.',
    inviteColleague: 'Invite a colleague',
    inviteColleagueHelp: 'A preparation is released by someone other than the person who prepared it, so a laboratory needs at least two people. The invitation activates when they sign in with AIVerID using this address.',
    emailAddress: 'Email address',
    displayNameOptional: 'Display name (optional)',
    sendInvitation: 'Send invitation',
    invitationSent: 'Invitation recorded. It activates when they sign in with this email address.',
    memberStatus: 'Status',
    statusPending: 'Awaiting first sign-in',
    statusActive: 'Active',
    reasonRequired: 'Write a reason of at least 3 characters before this action.',
    emailFormatHint: 'Enter a full address, for example name@laboratory.co.th',
    createNewAttempt: 'Create new attempt',
    labWorkspace: 'Laboratory workspace',
    whatToDoNext: 'What to do next',
    nextCreateFirstTemplate: 'Create your first controlled template',
    nextCreateFirstTemplateHelp: 'Define the target, acceptance criteria, required bench fields, instructions, and citations before preparation begins.',
    nextInviteColleague: 'Invite a colleague before a template can be approved',
    nextInviteColleagueHelp: 'The template creator cannot approve their own template. Add a second active owner or reviewer to provide independent approval.',
    nextPendingReviewerSignIn: 'Ask the invited reviewer to sign in before a template can be approved',
    nextPendingReviewerSignInHelp: 'The invitation is still pending. It becomes an active laboratory membership when the colleague signs in with AIVerID using the invited email address.',
    nextApproveTemplate: 'Approve a draft template',
    nextApproveTemplateHelp: 'An independent owner or reviewer must approve the controlled template before anyone can start a preparation.',
    nextReviewSubmittedHelp: 'A submitted preparation needs an independent owner or reviewer to release or reject it.',
    nextAwaitTemplateApproval: 'Ask another owner or reviewer to approve your draft template',
    nextAwaitTemplateApprovalHelp: 'The creator cannot approve the template they wrote.',
    nextResumeDraft: 'Continue your draft preparation',
    nextResumeDraftHelp: 'Record the actual bench measurements, preview the result, then submit it for independent release.',
    nextStartPreparation: 'Start a preparation from an approved template',
    nextStartPreparationHelp: 'Approved templates are ready for a new controlled preparation record.',
    nextRequestPreparation: 'Ask an owner, reviewer, or analyst to start a preparation',
    nextRequestPreparationHelp: 'Your current role can view controlled records but cannot create a preparation.',
    waitingForYourReview: 'Waiting for your review',
    myDrafts: 'My drafts',
    recentlyReleasedEvidence: 'Recently released evidence',
    templateCreatorCannotApprove: 'This template awaits independent approval.',
    templateCreatorCannotApproveHelp: 'The template creator cannot approve their own template. Ask an owner to invite or assign another reviewer.',
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
    roleRequired: 'Only an owner or reviewer can create a template. Ask an owner to invite or assign a reviewer.',
    viewerCannotStartPreparation: 'Your viewer role can view records but cannot start a preparation. Ask a preparer, reviewer, or owner to start one.',
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
    verifyLinkUnavailable: 'A verification link is unavailable. Ask a reviewer to create a new link from the record.',
    basisMass: 'mass',
    basisVolume: 'volume',
    unknownError: 'We could not complete your request. Check your connection and try again.',
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
    storedEvidencePackUnavailable: 'The stored evidence pack is unavailable. Reload the record; if it remains unavailable, contact your laboratory administrator.',
    laboratoryNavigation: 'Laboratory navigation',
    verifierCompactJwsArtifact: 'Compact JWS artifact',
    verifierMalformedEvidenceLink: 'This verification link is invalid. Check the complete link and try again.',
    verifierEvidencePackLoadFailed: 'We could not load this evidence pack. Check the verification link and try again.',
    verifierPublicKeysLoadFailed: 'We could not load VerChem’s published public keys. Check your connection and try again.',
    verifierUnexpectedFailure: 'We could not verify this artifact. Check the artifact and try again.',
    verifierFileTooLarge: 'The selected artifact exceeds the 256 KiB verifier limit.',
    verifierVerifying: 'Verifying in this browser…',
    verifierVerifyButton: 'Verify in this browser',
    verifierLoadJws: 'Load .jws file',
    verifierInspectJwks: 'Inspect published JWKS',
    verifierLocalChecksHelp: 'Signature and provenance checks run locally with Web Crypto. The artifact is not uploaded. Current-engine replay runs from the calculation code bundled with this page.',
    verifierCurrentHeadline: 'CURRENT VERIFIED ARTIFACT',
    verifierNotCurrentHeadline: 'NOT CURRENTLY VERIFIED',
    verifierVoidedHeadline: 'RELEASED THEN VOIDED — NO LONGER CURRENT',
    verifierCurrentDetail: 'The signature is authentic, provenance matches the current release, the deterministic engine reproduces the result, and the Lab record remains released when applicable.',
    verifierVoidedDetail: 'The signed artifact remains authentic historical evidence, but the live Lab record has been voided and must not be treated as current.',
    verifierReviewDetail: 'Review the independent checks below before relying on this artifact.',
    verifierSignatureAuthenticity: 'Signature authenticity',
    verifierSignaturePass: 'Ed25519 signature matches the published key',
    verifierSignatureFail: 'Signature verification failed.',
    verifierProvenanceIntegrity: 'Provenance integrity',
    verifierProvenancePass: 'The SHA-256 artifact hash matches the signed deterministic tool calls.',
    verifierProvenanceFail: 'The provenance hash does not match the signed tool calls.',
    verifierProvenanceHistorical: 'This historical artifact predates the provenance envelope.',
    verifierReleaseManifest: 'Release manifest',
    verifierManifestCurrent: 'Engine and data content hashes at issue time match the current published release manifest.',
    verifierManifestSuperseded: 'Issued under an earlier published release; a newer release is now current.',
    verifierManifestMismatch: 'The signed card does not match a valid published release manifest.',
    verifierManifestUnavailable: 'The published release manifest could not be fetched. This does not change signature authenticity.',
    verifierManifestHistorical: 'This historical artifact predates release-manifest provenance.',
    verifierCurrentEngineReplay: 'Current engine replay',
    verifierReplayNotAttempted: 'Replay was not attempted because no valid supported payload was decoded.',
    verifierApplicability: 'Applicability declaration',
    verifierNoApplicability: 'No machine-readable applicability declaration is present. Scientific applicability requires human review.',
    verifierLiveStatus: 'Live Lab record status',
    verifierLiveReleased: 'The public status endpoint confirms that this record remains released.',
    verifierLiveVoided: 'The public status endpoint confirms that this record was released and later voided.',
    verifierLiveUnavailable: 'The current Lab record status could not be confirmed. Signature authenticity is unaffected, but current use is not established.',
    verifierDecodedPayload: 'Decoded signed payload',
    verifierStatePass: 'pass',
    verifierStateWarn: 'warning',
    verifierStateFail: 'fail',
    compactJwsTitle: 'Compact JWS — independently verifiable artifact',
    compactJwsHelp: 'Copy this complete value into /verify or save the .jws file. It is the signed source of truth for this certificate.',
    copyJws: 'Copy JWS',
    copyJwsFailed: 'The compact JWS was not copied. Select and copy the complete value below.',
    jwsCopied: 'JWS copied',
    downloadJws: 'Download signed JWS',
    requestNewShareLink: 'Request a new verification link',
    rotatingShareLink: 'Creating a new link…',
    shareLinkRotated: 'A new verification link was created. Any previous link no longer works.',
    shareLinkRotationFailed: 'The verification link could not be replaced. Reload the record and try again.',
    recordChangedReloaded: 'Someone changed this record after you opened it. The latest saved version has been reloaded.',
    legalPrivacyLabOverview: 'VerChem Lab is a separate controlled-record surface for laboratory preparation, review, release, and external verification.',
    legalPrivacyLabData: 'VerChem Lab stores the organization, preparation template, declared measurements, actor identity and verification level, audit events, release or void status, and the signed evidence pack needed to operate and verify the record.',
    legalPrivacyRetentionGeneral: 'Saved educational content remains until you delete it where a deletion control is available, or until you ask us to close your account. Contact us at the address below to request deletion of account data that is not part of a VerChem Lab audit record.',
    legalPrivacyRetentionLab: 'VerChem Lab preparation records and their audit events cannot be deleted once created. This append-only history is what allows an external auditor to test the integrity of an evidence pack. A released record may later be marked void, but neither the record nor its audit events are erased.',
    legalTermsEducationSurface: 'VerChem provides free chemistry education and reference tools, including calculators, chemical data, structure tools, search, and AI Verified Answer Cards.',
    legalTermsLabSurface: 'VerChem Lab provides controlled preparation records for laboratories. Lab records use append-only audit events so later changes remain detectable and released evidence can be checked by an external auditor.',
    legalTermsLabVerified: 'For VerChem Lab evidence packs, a valid signature means the signed payload has not changed and was issued with a published VerChem signing key. It does not certify that the declared bench work was performed correctly, and a separately authentic record may later be voided.',
    legalTermsYourContent: 'You retain ownership of content you create. Educational content that has a deletion control may be deleted through that control. VerChem Lab preparation records and audit events are different: once created they are append-only and cannot be deleted, although a released record may be marked void. By choosing to make an item public through a share link, you permit us to store and display it as needed to provide that feature.',
    legalTermsDonations: 'VerChem’s chemistry education tools are free. Donations are voluntary, are processed by Stripe, and support continued development. Because no goods or services are exchanged for a donation, donations are generally non-refundable except where required by law.',
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
    beforeYouBegin: 'ก่อนเริ่มต้น',
    beforeYouBeginTeam: 'ต้องมีผู้ใช้ AIVerID อย่างน้อย 2 คนจึงจะทำ workflow แบบควบคุมได้ครบ',
    beforeYouBeginTemplateReview: 'ผู้สร้างแม่แบบไม่สามารถอนุมัติแม่แบบของตนเองได้',
    beforeYouBeginRecordRelease: 'ผู้เตรียมไม่สามารถปล่อยผลในบันทึกการเตรียมของตนเองได้',
    labName: 'ชื่อห้องปฏิบัติการ',
    country: 'ประเทศ (ISO 3166-1 alpha-2)',
    accreditationRef: 'เลขอ้างอิงการรับรอง',
    saveAndContinue: 'บันทึกและดำเนินการต่อ',
    loadingLab: 'กำลังโหลดพื้นที่ทำงานห้องปฏิบัติการ…',
    newPreparation: 'เตรียมสารใหม่',
    manageTemplates: 'จัดการแม่แบบ',
    recentRecords: 'บันทึกล่าสุด',
    noRecords: 'ยังไม่มีบันทึกการเตรียมสาร เริ่มการเตรียมสารใหม่จากแม่แบบที่อนุมัติแล้ว',
    noRecordsInSelectedState: 'ไม่พบบันทึกการเตรียมสารตามตัวกรองนี้ เลือกสถานะอื่นเพื่อดูบันทึกอื่น',
    noApprovedTemplates: 'อนุมัติแม่แบบก่อนสร้างบันทึกการเตรียมสาร',
    noTemplatesYet: 'ยังไม่มีแม่แบบ สร้างแม่แบบฉบับแรกเพื่อเริ่มการเตรียมสารแบบควบคุม',
    noApprovedTemplatesCreate: 'ยังไม่มีแม่แบบที่อนุมัติแล้ว สร้างแม่แบบ แล้วให้ owner หรือ reviewer คนอื่นอนุมัติ',
    noApprovedTemplatesReview: 'ยังไม่มีแม่แบบที่อนุมัติแล้ว มีแม่แบบฉบับร่างรอการตรวจทานอยู่',
    ownerReviewerTemplateRequired: 'owner หรือ reviewer ต้องสร้างแม่แบบฉบับแรก และ owner หรือ reviewer คนอื่นต้องอนุมัติก่อนจึงจะเริ่มเตรียมสารได้',
    newTemplate: 'แม่แบบใหม่',
    viewTemplate: 'ดูแม่แบบ',
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
    recordEventCreated: 'สร้างบันทึกแล้ว',
    recordEventEdited: 'บันทึกค่าที่วัดแล้ว',
    recordEventSubmitted: 'ส่งตรวจทานแล้ว',
    recordEventWithdrawn: 'ถอนกลับเป็นฉบับร่างแล้ว',
    recordEventReleased: 'ออกบันทึกแล้ว',
    recordEventRejected: 'ไม่อนุมัติแล้ว',
    recordEventVoided: 'ยกเลิกบันทึกแล้ว',
    recordEventShareLinkRotated: 'เปลี่ยนลิงก์ตรวจสอบแล้ว',
    recordEventUpdated: 'อัปเดตบันทึกแล้ว',
    downloadPdf: 'ดาวน์โหลด PDF',
    copyVerifyLink: 'คัดลอกลิงก์ตรวจสอบ',
    saveShareLink: 'บันทึกลิงก์แชร์แบบใช้ครั้งเดียวนี้',
    shareLinkUnavailable: 'ไม่พบโทเค็นลิงก์สาธารณะครั้งเดียวในเบราว์เซอร์นี้ สมาชิกยังเปิด evidence pack ได้',
    copied: 'คัดลอกแล้ว',
    copyFailed: 'คัดลอกลิงก์ตรวจสอบไม่สำเร็จ คัดลอกเองจากช่องด้านล่าง',
    requiredByTemplate: 'แม่แบบนี้กำหนดให้ระบุ',
    requiredValueMissing: 'แม่แบบนี้กำหนดให้ระบุค่า',
    errorPrefix: 'ข้อความจากเซิร์ฟเวอร์:',
    legalSignature: 'ลายเซ็นนี้รับรองความสมบูรณ์ของบันทึกตามที่ VerChem ออกให้ และไม่ได้รับรองความถูกต้องของการปฏิบัติงานบนโต๊ะปฏิบัติการ',
    invitedEmail: 'อีเมลที่เชิญ',
    role: 'บทบาท',
    noMembers: 'ยังไม่มีสมาชิกเข้าร่วมห้องปฏิบัติการนี้ ขอให้ owner เชิญเพื่อนร่วมงาน',
    inviteColleague: 'เชิญเพื่อนร่วมงาน',
    inviteColleagueHelp: 'ผู้ปล่อยผลต้องไม่ใช่คนเดียวกับผู้เตรียม แลบหนึ่งแห่งจึงต้องมีอย่างน้อยสองคน คำเชิญจะมีผลเมื่อผู้รับเข้าสู่ระบบด้วย AIVerID โดยใช้อีเมลนี้',
    emailAddress: 'อีเมล',
    displayNameOptional: 'ชื่อที่แสดง (ไม่บังคับ)',
    sendInvitation: 'ส่งคำเชิญ',
    invitationSent: 'บันทึกคำเชิญแล้ว จะมีผลเมื่อผู้รับเข้าสู่ระบบด้วยอีเมลนี้',
    memberStatus: 'สถานะ',
    statusPending: 'รอเข้าสู่ระบบครั้งแรก',
    statusActive: 'ใช้งานอยู่',
    reasonRequired: 'ต้องเขียนเหตุผลอย่างน้อย 3 ตัวอักษรก่อนทำรายการนี้',
    emailFormatHint: 'กรอกอีเมลเต็มรูปแบบ เช่น name@laboratory.co.th',
    createNewAttempt: 'สร้างการเตรียมครั้งใหม่',
    labWorkspace: 'พื้นที่ทำงานห้องปฏิบัติการ',
    whatToDoNext: 'สิ่งที่ต้องทำต่อ',
    nextCreateFirstTemplate: 'สร้างแม่แบบควบคุมฉบับแรก',
    nextCreateFirstTemplateHelp: 'กำหนดค่าเป้าหมาย เกณฑ์ยอมรับ ข้อมูลหน้างานที่ต้องระบุ คำแนะนำ และเอกสารอ้างอิงก่อนเริ่มเตรียมสาร',
    nextInviteColleague: 'เชิญเพื่อนร่วมงานก่อนจึงจะอนุมัติแม่แบบได้',
    nextInviteColleagueHelp: 'ผู้สร้างแม่แบบอนุมัติแม่แบบของตนเองไม่ได้ ต้องมี owner หรือ reviewer ที่ใช้งานอยู่คนที่สองเพื่ออนุมัติอย่างอิสระ',
    nextPendingReviewerSignIn: 'ขอให้ reviewer ที่เชิญเข้าสู่ระบบก่อนจึงจะอนุมัติแม่แบบได้',
    nextPendingReviewerSignInHelp: 'คำเชิญยังรอการเปิดใช้ จะกลายเป็นสมาชิกห้องปฏิบัติการที่ใช้งานอยู่เมื่อเพื่อนร่วมงานเข้าสู่ระบบด้วย AIVerID โดยใช้อีเมลที่เชิญ',
    nextApproveTemplate: 'อนุมัติแม่แบบฉบับร่าง',
    nextApproveTemplateHelp: 'owner หรือ reviewer ที่เป็นอิสระต้องอนุมัติแม่แบบควบคุมก่อนจึงจะเริ่มเตรียมสารได้',
    nextReviewSubmittedHelp: 'การเตรียมสารที่ส่งตรวจแล้วต้องให้ owner หรือ reviewer ที่เป็นอิสระปล่อยผลหรือไม่อนุมัติ',
    nextAwaitTemplateApproval: 'ขอให้ owner หรือ reviewer คนอื่นอนุมัติแม่แบบฉบับร่างของคุณ',
    nextAwaitTemplateApprovalHelp: 'ผู้สร้างไม่สามารถอนุมัติแม่แบบที่ตนเขียนได้',
    nextResumeDraft: 'ทำการเตรียมสารฉบับร่างของคุณต่อ',
    nextResumeDraftHelp: 'บันทึกค่าที่วัดจริงบนโต๊ะแลบ ดูตัวอย่างผล แล้วส่งให้ปล่อยผลอย่างอิสระ',
    nextStartPreparation: 'เริ่มเตรียมสารจากแม่แบบที่อนุมัติแล้ว',
    nextStartPreparationHelp: 'แม่แบบที่อนุมัติแล้วพร้อมใช้สร้างบันทึกการเตรียมสารแบบควบคุมใหม่',
    nextRequestPreparation: 'ขอให้ owner, reviewer หรือ analyst เริ่มการเตรียมสาร',
    nextRequestPreparationHelp: 'บทบาทปัจจุบันของคุณดูบันทึกแบบควบคุมได้ แต่สร้างการเตรียมสารไม่ได้',
    waitingForYourReview: 'รอการตรวจทานของคุณ',
    myDrafts: 'ฉบับร่างของฉัน',
    recentlyReleasedEvidence: 'หลักฐานที่เพิ่งปล่อยผล',
    templateCreatorCannotApprove: 'แม่แบบนี้รอการอนุมัติอย่างอิสระ',
    templateCreatorCannotApproveHelp: 'ผู้สร้างแม่แบบไม่สามารถอนุมัติแม่แบบของตนเองได้ ขอให้ owner เชิญหรือกำหนด reviewer คนอื่น',
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
    roleRequired: 'เฉพาะ owner หรือ reviewer เท่านั้นที่สร้างแม่แบบได้ ขอให้ owner เชิญหรือกำหนด reviewer',
    viewerCannotStartPreparation: 'บทบาทผู้ดูของคุณเปิดดูบันทึกได้ แต่เริ่มการเตรียมสารไม่ได้ ขอให้ preparer, reviewer หรือ owner เริ่มรายการให้',
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
    verifyLinkUnavailable: 'ลิงก์ตรวจสอบไม่พร้อมใช้ ขอให้ reviewer สร้างลิงก์ใหม่จากบันทึกนี้',
    basisMass: 'มวล',
    basisVolume: 'ปริมาตร',
    unknownError: 'ดำเนินการตามคำขอไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
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
    storedEvidencePackUnavailable: 'evidence pack ที่จัดเก็บไว้ไม่พร้อมใช้งาน โหลดบันทึกใหม่ และหากยังพบปัญหาให้ติดต่อผู้ดูแลห้องปฏิบัติการ',
    laboratoryNavigation: 'การนำทางห้องปฏิบัติการ',
    verifierCompactJwsArtifact: 'อาร์ติแฟกต์ Compact JWS',
    verifierMalformedEvidenceLink: 'ลิงก์ตรวจสอบนี้ไม่ถูกต้อง ตรวจสอบว่าคัดลอกลิงก์มาครบแล้วลองอีกครั้ง',
    verifierEvidencePackLoadFailed: 'โหลด evidence pack นี้ไม่สำเร็จ ตรวจสอบลิงก์ตรวจสอบแล้วลองอีกครั้ง',
    verifierPublicKeysLoadFailed: 'โหลดกุญแจสาธารณะที่ VerChem เผยแพร่ไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
    verifierUnexpectedFailure: 'ตรวจสอบอาร์ติแฟกต์นี้ไม่สำเร็จ ตรวจสอบอาร์ติแฟกต์แล้วลองอีกครั้ง',
    verifierFileTooLarge: 'อาร์ติแฟกต์ที่เลือกมีขนาดเกินขีดจำกัด 256 KiB ของตัวตรวจสอบ',
    verifierVerifying: 'กำลังตรวจสอบในเบราว์เซอร์นี้…',
    verifierVerifyButton: 'ตรวจสอบในเบราว์เซอร์นี้',
    verifierLoadJws: 'โหลดไฟล์ .jws',
    verifierInspectJwks: 'ตรวจดูกุญแจ JWKS ที่เผยแพร่',
    verifierLocalChecksHelp: 'การตรวจลายเซ็นและ provenance ทำในเครื่องด้วย Web Crypto โดยไม่อัปโหลดอาร์ติแฟกต์ และ replay ด้วย engine ปัจจุบันที่อยู่ในหน้านี้',
    verifierCurrentHeadline: 'อาร์ติแฟกต์ที่ตรวจสอบแล้วและยังเป็นปัจจุบัน',
    verifierNotCurrentHeadline: 'ไม่ใช่อาร์ติแฟกต์ที่ตรวจสอบแล้วในสถานะปัจจุบัน',
    verifierVoidedHeadline: 'เคยออกบันทึกแล้วแต่ถูกยกเลิก — ไม่เป็นปัจจุบันอีกต่อไป',
    verifierCurrentDetail: 'ลายเซ็นแท้ provenance ตรงกับรุ่นปัจจุบัน engine ให้ผลซ้ำตรงกัน และบันทึก Lab ยังคงอยู่ในสถานะออกบันทึกเมื่อเกี่ยวข้อง',
    verifierVoidedDetail: 'อาร์ติแฟกต์ที่เซ็นแล้วยังคงเป็นหลักฐานประวัติที่แท้ แต่บันทึก Lab ปัจจุบันถูกยกเลิกแล้วและห้ามถือว่ายังใช้ได้',
    verifierReviewDetail: 'โปรดตรวจผลการตรวจสอบอิสระด้านล่างก่อนนำอาร์ติแฟกต์นี้ไปใช้',
    verifierSignatureAuthenticity: 'ความแท้ของลายเซ็น',
    verifierSignaturePass: 'ลายเซ็น Ed25519 ตรงกับกุญแจสาธารณะ',
    verifierSignatureFail: 'การตรวจสอบลายเซ็นไม่ผ่าน',
    verifierProvenanceIntegrity: 'ความสมบูรณ์ของ provenance',
    verifierProvenancePass: 'แฮช SHA-256 ของอาร์ติแฟกต์ตรงกับ tool call แบบกำหนดผลแน่นอนที่เซ็นไว้',
    verifierProvenanceFail: 'แฮช provenance ไม่ตรงกับ tool call ที่เซ็นไว้',
    verifierProvenanceHistorical: 'อาร์ติแฟกต์เก่านี้สร้างก่อนมี provenance envelope',
    verifierReleaseManifest: 'Release manifest',
    verifierManifestCurrent: 'แฮชเนื้อหา engine และข้อมูล ณ เวลาออกบันทึกตรงกับ release manifest ปัจจุบันที่เผยแพร่',
    verifierManifestSuperseded: 'ออกด้วย release ที่เผยแพร่ก่อนหน้า และขณะนี้มี release ใหม่กว่าแล้ว',
    verifierManifestMismatch: 'การ์ดที่เซ็นไว้ไม่ตรงกับ release manifest ที่เผยแพร่และตรวจสอบได้',
    verifierManifestUnavailable: 'ไม่สามารถดึง release manifest ที่เผยแพร่ได้ แต่ไม่กระทบความแท้ของลายเซ็น',
    verifierManifestHistorical: 'อาร์ติแฟกต์เก่านี้สร้างก่อนมี release-manifest provenance',
    verifierCurrentEngineReplay: 'Replay ด้วย engine ปัจจุบัน',
    verifierReplayNotAttempted: 'ไม่ได้ทำ replay เพราะถอดรหัส payload ที่ระบบรองรับไม่ได้',
    verifierApplicability: 'คำประกาศขอบเขตการใช้งาน',
    verifierNoApplicability: 'ไม่มีคำประกาศขอบเขตการใช้งานที่เครื่องอ่านได้ การประเมินความเหมาะสมทางวิทยาศาสตร์ยังต้องใช้มนุษย์ตรวจ',
    verifierLiveStatus: 'สถานะสดของบันทึก Lab',
    verifierLiveReleased: 'public status endpoint ยืนยันว่าบันทึกนี้ยังอยู่ในสถานะออกบันทึก',
    verifierLiveVoided: 'public status endpoint ยืนยันว่าบันทึกนี้เคยออกแล้วและถูกยกเลิกภายหลัง',
    verifierLiveUnavailable: 'ไม่สามารถยืนยันสถานะปัจจุบันของบันทึก Lab ได้ ความแท้ของลายเซ็นไม่เปลี่ยน แต่ยังยืนยันการใช้ในปัจจุบันไม่ได้',
    verifierDecodedPayload: 'Payload ที่เซ็นแล้วและถอดรหัส',
    verifierStatePass: 'ผ่าน',
    verifierStateWarn: 'คำเตือน',
    verifierStateFail: 'ไม่ผ่าน',
    compactJwsTitle: 'Compact JWS — อาร์ติแฟกต์ที่ตรวจสอบได้อย่างอิสระ',
    compactJwsHelp: 'คัดลอกค่าฉบับเต็มนี้ไปวางใน /verify หรือบันทึกเป็นไฟล์ .jws ค่านี้คือต้นฉบับที่เซ็นแล้วของใบรับรองนี้',
    copyJws: 'คัดลอก JWS',
    copyJwsFailed: 'คัดลอก Compact JWS ไม่สำเร็จ เลือกและคัดลอกค่าฉบับเต็มจากด้านล่าง',
    jwsCopied: 'คัดลอก JWS แล้ว',
    downloadJws: 'ดาวน์โหลด JWS ที่เซ็นแล้ว',
    requestNewShareLink: 'ขอลิงก์ตรวจสอบใหม่',
    rotatingShareLink: 'กำลังสร้างลิงก์ใหม่…',
    shareLinkRotated: 'สร้างลิงก์ตรวจสอบใหม่แล้ว ลิงก์ก่อนหน้าจะใช้ไม่ได้อีกต่อไป',
    shareLinkRotationFailed: 'ไม่สามารถเปลี่ยนลิงก์ตรวจสอบได้ โปรดโหลดบันทึกใหม่แล้วลองอีกครั้ง',
    recordChangedReloaded: 'มีผู้อื่นแก้บันทึกนี้หลังจากคุณเปิดหน้า ระบบโหลดข้อมูลล่าสุดที่บันทึกไว้แล้ว',
    legalPrivacyLabOverview: 'VerChem Lab เป็นพื้นผิวแยกสำหรับการควบคุมบันทึกการเตรียม การทบทวน การออกบันทึก และการตรวจสอบโดยบุคคลภายนอก',
    legalPrivacyLabData: 'VerChem Lab จัดเก็บข้อมูลองค์กร แม่แบบการเตรียม ค่าที่ผู้ใช้ประกาศ ตัวตนและระดับการยืนยันของผู้ดำเนินการ เหตุการณ์ audit สถานะออกบันทึกหรือยกเลิก และ evidence pack ที่เซ็นแล้วเท่าที่จำเป็นต่อการทำงานและตรวจสอบบันทึก',
    legalPrivacyRetentionGeneral: 'เนื้อหาด้านการศึกษาที่บันทึกไว้จะคงอยู่จนกว่าคุณจะลบผ่านตัวควบคุมการลบที่มีให้ หรือขอให้เราปิดบัญชี โปรดติดต่อเราตามที่อยู่ด้านล่างเพื่อขอลบข้อมูลบัญชีที่ไม่เป็นส่วนหนึ่งของ audit record ของ VerChem Lab',
    legalPrivacyRetentionLab: 'บันทึกการเตรียมของ VerChem Lab และเหตุการณ์ audit ของบันทึกนั้นไม่สามารถลบได้หลังสร้าง ประวัติแบบ append-only นี้ทำให้ผู้ตรวจประเมินภายนอกตรวจความสมบูรณ์ของ evidence pack ได้ บันทึกที่ออกแล้วสามารถเปลี่ยนสถานะเป็นยกเลิกได้ภายหลัง แต่ตัวบันทึกและเหตุการณ์ audit จะไม่ถูกลบ',
    legalTermsEducationSurface: 'VerChem ให้บริการเครื่องมือการศึกษาและอ้างอิงด้านเคมีโดยไม่คิดค่าใช้จ่าย รวมถึงเครื่องคำนวณ ข้อมูลเคมี เครื่องมือโครงสร้าง การค้นหา และ AI Verified Answer Cards',
    legalTermsLabSurface: 'VerChem Lab ให้บริการบันทึกการเตรียมสารแบบควบคุมสำหรับห้องปฏิบัติการ โดยใช้เหตุการณ์ audit แบบ append-only เพื่อให้ตรวจพบการเปลี่ยนแปลงภายหลังและให้ผู้ตรวจประเมินภายนอกตรวจหลักฐานที่ออกแล้วได้',
    legalTermsLabVerified: 'สำหรับ evidence pack ของ VerChem Lab ลายเซ็นที่ผ่านหมายความว่า payload ที่เซ็นไม่ถูกเปลี่ยนและออกด้วยกุญแจลงนามของ VerChem ที่เผยแพร่ ไม่ได้รับรองว่าการปฏิบัติงานบนโต๊ะที่ประกาศไว้ทำอย่างถูกต้อง และบันทึกที่ลายเซ็นแท้อาจถูกยกเลิกภายหลังได้',
    legalTermsYourContent: 'คุณยังคงเป็นเจ้าของเนื้อหาที่สร้าง เนื้อหาด้านการศึกษาที่มีตัวควบคุมการลบสามารถลบผ่านตัวควบคุมนั้นได้ ส่วนบันทึกการเตรียมและเหตุการณ์ audit ของ VerChem Lab เมื่อสร้างแล้วจะเป็นแบบ append-only และลบไม่ได้ แม้บันทึกที่ออกแล้วจะเปลี่ยนสถานะเป็นยกเลิกได้ เมื่อคุณเลือกเผยแพร่รายการผ่านลิงก์แชร์ คุณอนุญาตให้เราจัดเก็บและแสดงรายการนั้นเท่าที่จำเป็นต่อการให้บริการฟีเจอร์ดังกล่าว',
    legalTermsDonations: 'เครื่องมือการศึกษาด้านเคมีของ VerChem ให้บริการโดยไม่คิดค่าใช้จ่าย การบริจาคเป็นความสมัครใจ ประมวลผลโดย Stripe และสนับสนุนการพัฒนาต่อ เนื่องจากไม่มีสินค้าหรือบริการแลกกับการบริจาค โดยทั่วไปการบริจาคจึงไม่คืนเงิน เว้นแต่กฎหมายกำหนด',
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
