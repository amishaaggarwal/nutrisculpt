"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ResultCard from '@/components/atoms/ResultCard';

/**
 * Demo page showcasing the unified ResultCard system across all calculator types
 */
export default function DemoPage() {
  const [selectedType, setSelectedType] = useState('bmi');
  const [selectedRatio, setSelectedRatio] = useState('square');

  const calculatorExamples = {
    bmi: {
      value: '24.2',
      category: 'Normal',
      subtitle: 'Healthy range: 53.5kg - 72kg'
    },
    calorie: {
      value: '2258',
      category: 'Maintain Weight',
      subtitle: 'BMR: 1643 | TDEE: 2258'
    },
    macro: {
      value: '141g • 254g • 75g',
      category: 'Balanced Distribution',
      subtitle: 'Protein • Carbs • Fat | 2258 calories/day for optimal performance'
    },
    water: {
      value: '2.8',
      category: 'Optimal Hydration',
      subtitle: '2800ml | 94oz | 11.8 cups based on activity level'
    },
    heart: {
      value: '150',
      category: 'Aerobic Training Zone',
      subtitle: 'Max HR calculated | Resting: 65 bpm'
    },
    idealWeight: {
      value: '68.5',
      category: 'Medium Frame Body Type',
      subtitle: 'Healthy range calculated using multiple scientific formulas'
    },
    oneRm: {
      value: '125.5',
      category: 'Overhead Press',
      subtitle: '1RM calculated from 5 reps with proper form'
    }
  };

  const calculatorTypes = Object.keys(calculatorExamples);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            NutriSculpt Unified Result Cards
          </h1>
          <p className="text-xl text-slate-300">
            Consistent fitness-inspired design across all calculators
          </p>
        </motion.div>

        {/* Layout Test Notice */}
        <motion.div 
          className="bg-emerald-900/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-emerald-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">✨</div>
            <div>
              <h3 className="text-emerald-400 font-semibold">Layout Improvements Active</h3>
              <p className="text-emerald-300 text-sm">
                Dynamic spacing, font scaling, and overflow prevention now handle long content gracefully.
                <a href="/layout-test" className="ml-2 underline hover:text-emerald-200">
                  View detailed tests →
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calculator Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Calculator Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {calculatorTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType === type
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Aspect Ratio
              </label>
              <div className="flex gap-2">
                {['square', 'portrait'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRatio === ratio
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {ratio === 'square' ? '1:1 (1080×1080)' : '4:5 (1080×1350)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Result Card Display */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          key={`${selectedType}-${selectedRatio}`}
        >
          <ResultCard
            type={selectedType}
            value={calculatorExamples[selectedType].value}
            category={calculatorExamples[selectedType].category}
            subtitle={calculatorExamples[selectedType].subtitle}
            aspectRatio={selectedRatio}
            className="transform hover:scale-105 transition-transform duration-300"
          />
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            {
              icon: '🎯',
              title: 'Unified Design System',
              description: 'Consistent visual language across all calculator types with automatic theming'
            },
            {
              icon: '⚡',
              title: 'Dynamic Progress Rings',
              description: 'Color-coded animated rings that adapt to each calculator\'s value ranges'
            },
            {
              icon: '🎨',
              title: 'Fitness Aesthetics',
              description: 'Athletic-inspired design with pulse effects, particles, and energy flows'
            },
            {
              icon: '📱',
              title: 'Social Media Ready',
              description: 'Optimized for 1080×1080 and 1080×1350 formats with export functionality'
            },
            {
              icon: '🔧',
              title: 'Type-Based Configuration',
              description: 'Automatic adaptation of colors, icons, and progress calculations per calculator'
            },
            {
              icon: '✨',
              title: 'Smooth Animations',
              description: 'Framer Motion powered animations with loading states and hover effects'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Implementation Guide */}
        <motion.div 
          className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Implementation Guide</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-emerald-400 mb-3">Basic Usage</h4>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                <pre>{`<ResultCard 
  type="bmi" 
  value="24.2" 
  category="Normal" 
  subtitle="Healthy range: 18.5 - 24.9"
/>`}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-purple-400 mb-3">Advanced Usage</h4>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                <pre>{`<ResultCard 
  type="calorie" 
  value="2258" 
  category="Maintain Weight"
  subtitle="BMR: 1643 | TDEE: 2258"
  aspectRatio="portrait"
  ref={shareableCardRef}
/>`}</pre>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg font-medium text-blue-400 mb-3">Supported Calculator Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {calculatorTypes.map((type) => (
                <div key={type} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <code className="text-emerald-400 text-sm">{type}</code>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}