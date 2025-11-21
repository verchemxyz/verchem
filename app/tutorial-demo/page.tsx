'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';
import { InteractiveHotspot } from '@/components/tutorials/tutorial-spotlight';
import { Play, BookOpen, Award, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function TutorialDemoPage() {
  const { startTutorial, showHelp } = useTutorial();

  const demoTutorials = [
    {
      id: 'demo-navigation',
      title: 'Navigation Tutorial',
      description: 'Learn how to navigate through VerChem efficiently',
      icon: '🧭',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'demo-periodic-table',
      title: 'Periodic Table Basics',
      description: 'Master the interactive periodic table features',
      icon: '🧪',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'demo-3d-viewer',
      title: '3D Molecular Viewer',
      description: 'Explore molecules in three dimensions',
      icon: '🔬',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'demo-calculators',
      title: 'Chemistry Calculators',
      description: 'Use powerful calculation tools',
      icon: '🧮',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VerChem
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Your comprehensive chemistry platform with interactive tutorials, powerful calculators, 
              and immersive 3D molecular visualization.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => startTutorial({
                  id: 'getting-started-navigation',
                  title: 'Navigation Basics',
                  description: 'Learn how to navigate through VerChem platform efficiently',
                  category: 'getting-started',
                  difficulty: 'beginner',
                  estimatedTime: 5,
                  icon: '🧭',
                  featured: true,
                  tags: ['navigation', 'basics', 'interface'],
                  steps: [
                    {
                      id: 'welcome',
                      title: 'Welcome to VerChem!',
                      content: 'Let\'s start with a quick tour of the navigation system. You\'ll learn how to access all the powerful chemistry tools.',
                      target: 'body',
                      placement: 'center',
                      spotlight: true,
                    },
                    {
                      id: 'main-nav',
                      title: 'Main Navigation',
                      content: 'This is your main navigation bar. It contains links to all major sections of VerChem.',
                      target: '[data-tutorial="main-nav"]',
                      placement: 'bottom',
                      highlight: true,
                    },
                    {
                      id: 'help-button',
                      title: 'Help is Always Available',
                      content: 'Click this help button anytime to access tutorials, documentation, and support.',
                      target: '[data-tutorial="help-button"]',
                      placement: 'left',
                      action: 'click',
                      interactive: true,
                    },
                  ],
                })}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Tutorial
              </button>
              
              <button
                onClick={() => showHelp(true)}
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Help
              </button>
            </div>
          </motion.div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Learning Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive tutorial system helps you master chemistry concepts through interactive, 
              step-by-step guidance with real-time feedback and progress tracking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {demoTutorials.map((tutorial) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group"
              >
                <InteractiveHotspot
                  onClick={() => startTutorial({
                    id: tutorial.id,
                    title: tutorial.title,
                    description: tutorial.description,
                    category: 'demo',
                    difficulty: 'beginner',
                    estimatedTime: 3,
                    icon: tutorial.icon,
                    featured: true,
                    tags: ['demo', 'interactive'],
                    steps: [
                      {
                        id: 'demo-intro',
                        title: tutorial.title,
                        content: tutorial.description,
                        target: 'body',
                        placement: 'center',
                        spotlight: true,
                      },
                      {
                        id: 'demo-complete',
                        title: 'Demo Complete!',
                        content: 'This was a quick demo of our tutorial system. Try the full tutorial for comprehensive learning.',
                        target: 'body',
                        placement: 'center',
                      },
                    ],
                  })}
                >
                  <div className={`bg-gradient-to-br ${tutorial.color} p-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105`}>
                    <div className="text-4xl mb-4">{tutorial.icon}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {tutorial.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {tutorial.description}
                    </p>
                  </div>
                </InteractiveHotspot>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tutorial System Features */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Smart Tutorial System
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Interactive Step-by-Step Guidance</h3>
                    <p className="text-gray-600 dark:text-gray-300">Follow along with highlighted elements and clear instructions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Progress Tracking</h3>
                    <p className="text-gray-600 dark:text-gray-300">Monitor your learning progress across all tutorials and categories.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Achievement System</h3>
                    <p className="text-gray-600 dark:text-gray-300">Earn badges and certificates as you complete tutorials and assessments.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6"
            >
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600 dark:text-gray-300">Progress tracker coming soon!</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Help System Features */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Help System
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get help when you need it with our multi-layered support system including 
              contextual help, searchable documentation, and interactive tutorials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Contextual Help
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get relevant help based on what you&apos;re currently doing in the application.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Searchable Documentation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Quickly find answers with our comprehensive, searchable help documentation.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Progress Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your learning progress and identify areas for improvement.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Begin your chemistry journey with our interactive tutorials and comprehensive help system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => showHelp(true)}
                className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Tutorials
              </button>
              <Link
                href="/tutorials"
                className="inline-flex items-center px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Award className="w-5 h-5 mr-2" />
                View Learning Center
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
