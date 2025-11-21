'use client';

import React, { useState } from 'react';
import { useTutorial } from '@/lib/tutorials/context';
import { HelpCircle, PlayCircle, BookOpen, Award, Settings } from 'lucide-react';

export function HelpButton() {
  const { state, showHelp, startTutorial, getRecommendedTutorials } = useTutorial();
  const [showMenu, setShowMenu] = useState(false);
  
  const { userData, isActive, availableTutorials } = state;
  const recommendedTutorials = getRecommendedTutorials();

  const handleHelpClick = () => {
    if (isActive) {
      // If tutorial is active, open help sidebar
      showHelp(true);
    } else {
      // Otherwise toggle the quick menu
      setShowMenu(!showMenu);
    }
  };

  const quickActions = [
    {
      id: 'start-tutorial',
      name: 'Start Tutorial',
      icon: PlayCircle,
      description: 'Begin interactive tutorial',
      action: () => {
        if (recommendedTutorials.length > 0) {
          startTutorial(recommendedTutorials[0]);
        }
        setShowMenu(false);
      },
      show: recommendedTutorials.length > 0 && !isActive,
    },
    {
      id: 'help-center',
      name: 'Help Center',
      icon: BookOpen,
      description: 'Browse help articles',
      action: () => {
        showHelp(true);
        setShowMenu(false);
      },
      show: true,
    },
    {
      id: 'achievements',
      name: 'Achievements',
      icon: Award,
      description: `${userData?.achievements.length || 0} unlocked`,
      action: () => {
        showHelp(true, 'achievements');
        setShowMenu(false);
      },
      show: true,
    },
    {
      id: 'tutorial-settings',
      name: 'Tutorial Settings',
      icon: Settings,
      description: 'Configure preferences',
      action: () => {
        showHelp(true, 'settings');
        setShowMenu(false);
      },
      show: true,
    },
  ].filter(action => action.show);

  return (
    <div className="fixed top-4 right-4 z-30">
      {/* Main Help Button */}
      <button
        onClick={handleHelpClick}
        className={`group relative p-3 rounded-full shadow-lg transition-all duration-200 ${
          isActive 
            ? 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        aria-label="Help and tutorials"
        data-tutorial="help-button"
      >
        {isActive ? (
          <div className="relative">
            <HelpCircle className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
        ) : (
          <HelpCircle className="w-5 h-5" />
        )}
        
        {/* Tooltip */}
        <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {isActive ? 'Tutorial in progress - click for help' : 'Help & Tutorials'}
          </div>
        </div>
      </button>

      {/* Quick Actions Menu */}
      {showMenu && !isActive && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
          </div>
          
          <div className="py-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <action.icon className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tutorial Progress Indicator */}
          {userData && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{userData.totalTutorialsCompleted} completed</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (userData.totalTutorialsCompleted / Math.max(1, availableTutorials.length)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tutorial Status Indicator */}
      {isActive && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Tutorial Active
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            {state.currentTutorial?.title}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Step {state.currentStep + 1} of {state.currentTutorial?.steps.length}</span>
            <button
              onClick={() => showHelp(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Get Help
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
