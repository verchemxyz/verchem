export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'input';
  highlight?: boolean;
  spotlight?: boolean;
  interactive?: boolean;
  validation?: (element: HTMLElement) => boolean;
  beforeShow?: () => void;
  afterShow?: () => void;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  steps: TutorialStep[];
  prerequisites?: string[];
  tags: string[];
  icon?: string;
  featured?: boolean;
}

export type TutorialCategory =
  | 'getting-started'
  | 'periodic-table'
  | '3d-viewer'
  | 'molecule-builder'
  | 'calculators'
  | 'advanced-features'
  | 'chemistry-concepts'
  | 'demo';

export interface TutorialProgress {
  tutorialId: string;
  completedSteps: string[];
  currentStep: string | null;
  completedAt?: Date;
  startedAt: Date;
  lastAccessed: Date;
  score?: number;
  timeSpent: number; // in seconds
}

export interface UserTutorialData {
  userId: string;
  completedTutorials: string[];
  inProgressTutorials: TutorialProgress[];
  achievements: Achievement[];
  preferences: TutorialPreferences;
  totalTimeSpent: number;
  totalTutorialsCompleted: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'completion' | 'speed' | 'accuracy' | 'streak' | 'special';
}

export interface TutorialPreferences {
  autoStart: boolean;
  showTooltips: boolean;
  narration: boolean;
  language: string;
  difficulty: 'auto' | 'beginner' | 'intermediate' | 'advanced';
  skipCompleted: boolean;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: HelpCategory;
  tags: string[];
  relatedTutorials?: string[];
  relatedArticles?: string[];
  lastUpdated: Date;
  views: number;
  helpful: number;
  notHelpful: number;
}

export type HelpCategory =
  | 'getting-started'
  | 'features'
  | 'troubleshooting'
  | 'best-practices'
  | 'keyboard-shortcuts'
  | 'glossary'
  | 'faq';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: Date;
}

export type TutorialSearchResult = Tutorial | HelpArticle | FAQItem;

export interface SearchResult {
  id: string;
  type: 'tutorial' | 'article' | 'faq' | 'glossary';
  title: string;
  description: string;
  category: string;
  relevance: number;
  url?: string;
}

export interface TutorialAnalytics {
  tutorialId: string;
  starts: number;
  completions: number;
  dropOffSteps: { [stepId: string]: number };
  averageTime: number;
  satisfaction: number;
  feedback: TutorialFeedback[];
}

export interface TutorialFeedback {
  id: string;
  tutorialId: string;
  userId: string;
  rating: number;
  comment?: string;
  completed: boolean;
  createdAt: Date;
}

export interface SpotlightOptions {
  enabled: boolean;
  color?: string;
  opacity?: number;
  radius?: number;
  animate?: boolean;
}

export interface TooltipOptions {
  enabled: boolean;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  theme?: 'light' | 'dark';
}
