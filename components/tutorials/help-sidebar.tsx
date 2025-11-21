'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';
import { 
  X, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Keyboard, 
  FileText,
  ChevronRight,
  Star,
  Clock,
  Award,
  Play
} from 'lucide-react';
import { helpArticles, faqData } from '@/lib/tutorials/data';
import type { HelpArticle, FAQItem, Tutorial } from '@/lib/tutorials/types';

export function HelpSidebar() {
  const { state, showHelp, searchHelp } = useTutorial();
  const [activeTab, setActiveTab] = useState<'tutorials' | 'articles' | 'faq' | 'shortcuts'>('tutorials');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { showHelp: isOpen, availableTutorials } = state;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchHelp(query);
  };

  const getFilteredTutorials = () => {
    let tutorials = availableTutorials;
    
    if (selectedCategory !== 'all') {
      tutorials = tutorials.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      tutorials = tutorials.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return tutorials;
  };

  const getFilteredArticles = () => {
    let articles = helpArticles;
    
    if (selectedCategory !== 'all') {
      articles = articles.filter(a => a.category === selectedCategory);
    }
    
    if (searchQuery) {
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return articles;
  };

  const getFilteredFAQ = () => {
    return faqData.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const categories = [
    { id: 'all', name: 'All Categories', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: Play },
    { id: 'periodic-table', name: 'Periodic Table', icon: '🧪' },
    { id: '3d-viewer', name: '3D Viewer', icon: '🔬' },
    { id: 'molecule-builder', name: 'Molecule Builder', icon: '🏗️' },
    { id: 'calculators', name: 'Calculators', icon: '🧮' },
    { id: 'advanced-features', name: 'Advanced Features', icon: '⚙️' },
    { id: 'chemistry-concepts', name: 'Chemistry Concepts', icon: '⚛️' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => showHelp(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help & Tutorials</h2>
              <button
                onClick={() => showHelp(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close help"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help, tutorials, FAQ..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'tutorials', name: 'Tutorials', icon: Play },
                { id: 'articles', name: 'Articles', icon: FileText },
                { id: 'faq', name: 'FAQ', icon: MessageCircle },
                { id: 'shortcuts', name: 'Shortcuts', icon: Keyboard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'tutorials' | 'articles' | 'faq' | 'shortcuts')}
                  className={`flex-1 flex items-center justify-center py-3 px-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-1" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {(activeTab === 'tutorials' || activeTab === 'articles') && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'tutorials' && (
                <div className="p-4 space-y-3">
                  {getFilteredTutorials().map((tutorial) => (
                    <TutorialCard key={tutorial.id} tutorial={tutorial} />
                  ))}
                  {getFilteredTutorials().length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No tutorials found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'articles' && (
                <div className="p-4 space-y-3">
                  {getFilteredArticles().map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                  {getFilteredArticles().length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No articles found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="p-4 space-y-3">
                  {getFilteredFAQ().map((faq) => (
                    <FAQCard key={faq.id} faq={faq} />
                  ))}
                  {getFilteredFAQ().length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No FAQ items found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shortcuts' && <KeyboardShortcuts />}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Need more help?</span>
                <button className="text-blue-600 dark:text-blue-400 hover:underline">
                  Contact Support
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const { startTutorial } = useTutorial();
  const { isTutorialCompleted } = useTutorial();
  const isCompleted = isTutorialCompleted(tutorial.id);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
         onClick={() => startTutorial(tutorial)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{tutorial.icon}</span>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {tutorial.title}
            </h3>
            {isCompleted && (
              <Award className="w-4 h-4 text-green-500" />
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            {tutorial.description}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {tutorial.estimatedTime} min
            </span>
            <span className="capitalize">
              {tutorial.difficulty}
            </span>
            {tutorial.featured && (
              <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
            {article.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
            {article.content.substring(0, 100)}...
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="capitalize">{article.category.replace('-', ' ')}</span>
            <span>•</span>
            <span>{article.views} views</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
      </div>
    </div>
  );
}

function FAQCard({ faq }: { faq: FAQItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {faq.question}
          </h3>
          <ChevronRight 
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} 
          />
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

function KeyboardShortcuts() {
  const shortcuts = [
    { category: 'Global', shortcuts: [
      { key: 'Ctrl+/', description: 'Show keyboard shortcuts' },
      { key: 'Ctrl+K', description: 'Open search' },
      { key: 'Ctrl+H', description: 'Toggle help sidebar' },
    ]},
    { category: 'Tutorials', shortcuts: [
      { key: 'Space', description: 'Next tutorial step' },
      { key: 'Backspace', description: 'Previous tutorial step' },
      { key: 'Escape', description: 'Exit tutorial' },
    ]},
    { category: '3D Viewer', shortcuts: [
      { key: 'R', description: 'Reset view' },
      { key: 'F', description: 'Focus on selection' },
      { key: 'L', description: 'Toggle labels' },
    ]},
  ];

  return (
    <div className="p-4 space-y-4">
      {shortcuts.map((group) => (
        <div key={group.category}>
          <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
            {group.category}
          </h3>
          <div className="space-y-2">
            {group.shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
