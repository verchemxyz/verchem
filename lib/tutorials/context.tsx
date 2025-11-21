'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Tutorial, TutorialProgress, UserTutorialData, TutorialPreferences, Achievement, HelpArticle, FAQItem, TutorialSearchResult } from './types';
import { tutorialData } from './data';

interface TutorialState {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  currentStep: number;
  isPaused: boolean;
  showSpotlight: boolean;
  showHelp: boolean;
  helpCategory: string | null;
  searchQuery: string;
  searchResults: TutorialSearchResult[];
  userData: UserTutorialData | null;
  preferences: TutorialPreferences;
  achievements: Achievement[];
  availableTutorials: Tutorial[];
  helpArticles: HelpArticle[];
  faqItems: FAQItem[];
  isLoading: boolean;
  error: string | null;
}

type TutorialAction =
  | { type: 'START_TUTORIAL'; payload: Tutorial }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'PAUSE_TUTORIAL' }
  | { type: 'RESUME_TUTORIAL' }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SHOW_SPOTLIGHT'; payload: boolean }
  | { type: 'SHOW_HELP'; payload: { show: boolean; category?: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: TutorialSearchResult[] }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<TutorialPreferences> }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'SET_USER_DATA'; payload: UserTutorialData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: TutorialState = {
  isActive: false,
  currentTutorial: null,
  currentStep: 0,
  isPaused: false,
  showSpotlight: false,
  showHelp: false,
  helpCategory: null,
  searchQuery: '',
  searchResults: [],
  userData: null,
  preferences: {
    autoStart: true,
    showTooltips: true,
    narration: false,
    language: 'en',
    difficulty: 'auto',
    skipCompleted: true,
  },
  achievements: [],
  availableTutorials: tutorialData,
  helpArticles: [],
  faqItems: [],
  isLoading: false,
  error: null,
};

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case 'START_TUTORIAL':
      return {
        ...state,
        isActive: true,
        currentTutorial: action.payload,
        currentStep: 0,
        isPaused: false,
        showSpotlight: true,
      };

    case 'NEXT_STEP':
      if (!state.currentTutorial) return state;
      const nextStep = state.currentStep + 1;
      if (nextStep >= state.currentTutorial.steps.length) {
        return {
          ...state,
          currentStep: nextStep,
        };
      }
      return {
        ...state,
        currentStep: nextStep,
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };

    case 'SKIP_TUTORIAL':
    case 'COMPLETE_TUTORIAL':
      return {
        ...state,
        isActive: false,
        currentTutorial: null,
        currentStep: 0,
        isPaused: false,
        showSpotlight: false,
      };

    case 'PAUSE_TUTORIAL':
      return {
        ...state,
        isPaused: true,
      };

    case 'RESUME_TUTORIAL':
      return {
        ...state,
        isPaused: false,
      };

    case 'SHOW_SPOTLIGHT':
      return {
        ...state,
        showSpotlight: action.payload,
      };

    case 'SHOW_HELP':
      return {
        ...state,
        showHelp: action.payload.show,
        helpCategory: action.payload.category || null,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
      };

    case 'SET_USER_DATA':
      return {
        ...state,
        userData: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

interface TutorialContextType {
  state: TutorialState;
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  completeTutorial: () => void;
  showSpotlight: (show: boolean) => void;
  showHelp: (show: boolean, category?: string) => void;
  searchHelp: (query: string) => void;
  updatePreferences: (preferences: Partial<TutorialPreferences>) => void;
  getTutorialProgress: (tutorialId: string) => TutorialProgress | undefined;
  isTutorialCompleted: (tutorialId: string) => boolean;
  getRecommendedTutorials: () => Tutorial[];
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Simulate loading from localStorage or API
        const stored = localStorage.getItem('verchem-tutorial-data');
        if (stored) {
          const userData = JSON.parse(stored);
          dispatch({ type: 'SET_USER_DATA', payload: userData });
        }

        // Load preferences
        const storedPrefs = localStorage.getItem('verchem-tutorial-preferences');
        if (storedPrefs) {
          const preferences = JSON.parse(storedPrefs);
          dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
        }
      } catch (error) {
        console.error('Error loading tutorial data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUserData();
  }, []);

  // Save user data to localStorage when it changes
  useEffect(() => {
    if (state.userData) {
      localStorage.setItem('verchem-tutorial-data', JSON.stringify(state.userData));
    }
  }, [state.userData]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('verchem-tutorial-preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  const startTutorial = (tutorial: Tutorial) => {
    dispatch({ type: 'START_TUTORIAL', payload: tutorial });
  };

  const nextStep = () => {
    dispatch({ type: 'NEXT_STEP' });
  };

  const previousStep = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
  };

  const skipTutorial = () => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  };

  const pauseTutorial = () => {
    dispatch({ type: 'PAUSE_TUTORIAL' });
  };

  const resumeTutorial = () => {
    dispatch({ type: 'RESUME_TUTORIAL' });
  };

  const completeTutorial = () => {
    dispatch({ type: 'COMPLETE_TUTORIAL' });
    // Here you would typically save completion data to your backend
  };

  const showSpotlight = (show: boolean) => {
    dispatch({ type: 'SHOW_SPOTLIGHT', payload: show });
  };

  const showHelp = (show: boolean, category?: string) => {
    dispatch({ type: 'SHOW_HELP', payload: { show, category } });
  };

  const searchHelp = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    
    // Search tutorials
    const tutorialResults: Tutorial[] = state.availableTutorials.filter(tutorial =>
      tutorial.title.toLowerCase().includes(query.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(query.toLowerCase()) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Search help articles
    const articleResults: HelpArticle[] = state.helpArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [...tutorialResults, ...articleResults] });
  };

  const updatePreferences = (preferences: Partial<TutorialPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const getTutorialProgress = (tutorialId: string): TutorialProgress | undefined => {
    return state.userData?.inProgressTutorials.find(progress => progress.tutorialId === tutorialId);
  };

  const isTutorialCompleted = (tutorialId: string): boolean => {
    return state.userData?.completedTutorials.includes(tutorialId) || false;
  };

  const getRecommendedTutorials = (): Tutorial[] => {
    // Simple recommendation logic based on completed tutorials and difficulty
    const completed = state.userData?.completedTutorials || [];
    
    return state.availableTutorials.filter(tutorial => {
      if (completed.includes(tutorial.id)) return false;
      
      // Recommend based on difficulty progression
      const beginnerCompleted = completed.filter(id => {
        const tut = state.availableTutorials.find(t => t.id === id);
        return tut?.difficulty === 'beginner';
      }).length;
      
      const intermediateCompleted = completed.filter(id => {
        const tut = state.availableTutorials.find(t => t.id === id);
        return tut?.difficulty === 'intermediate';
      }).length;
      
      if (tutorial.difficulty === 'beginner') return true;
      if (tutorial.difficulty === 'intermediate') return beginnerCompleted >= 2;
      if (tutorial.difficulty === 'advanced') return intermediateCompleted >= 2;
      
      return false;
    }).slice(0, 5);
  };

  const contextValue: TutorialContextType = {
    state,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    pauseTutorial,
    resumeTutorial,
    completeTutorial,
    showSpotlight,
    showHelp,
    searchHelp,
    updatePreferences,
    getTutorialProgress,
    isTutorialCompleted,
    getRecommendedTutorials,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
