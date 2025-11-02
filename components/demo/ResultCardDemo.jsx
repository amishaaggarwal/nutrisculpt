"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ResultCard from '../atoms/ResultCard';

/**
 * Demo component showcasing all ResultCard variations
 * Demonstrates different calculator types, themes, and aspect ratios
 */
const ResultCardDemo = () => {
  const [selectedType, setSelectedType] = useState('bmi');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedRatio, setSelectedRatio] = useState('square');

  const calculatorExamples = {
    bmi: {
      value: '24.2',
      category: 'Normal',
      subtitle: 'Healthy range: 18.5 - 24.9'
    },
    calorie: {
      value: '2258',
      category: 'Maintain Weight',
      subtitle: 'Goal: Maintain Weight | BMR: 1643 | TDEE: 2258'
    },
    macro: {
      value: '141g • 254g • 75g',
      category: 'Balanced',
      subtitle: 'Protein • Carbs • Fat | 2258 calories/day'
    },
    'heart-rate': {
      value: '150',
      category: 'Zone 3',
      subtitle: 'Aerobic training zone'
    },
    'ideal-weight': {
      value: '68.5',
      category: 'Medium Frame',
      subtitle: 'Healthy range: 60.2kg - 76.8kg'
    },
    'water-intake': {
      value: '2.8',
      category: 'Optimal',
      subtitle: '2800ml | 94oz | 11.8 cups'
    },
    'one-rm': {
      value: '125',
      category: 'Bench Press',
      subtitle: '1RM from 5 reps'
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
            NutriSculpt Result Cards
          </h1>
          <p className="text-xl text-slate-300">
            Interactive, fitness-inspired calculator result cards
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {type.replace('-', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Theme
              </label>
              <div className="flex gap-2">
                {['dark', 'light'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSelectedTheme(theme)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTheme === theme
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
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
                    {ratio === 'square' ? '1:1' : '4:5'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Result Card Display */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          key={`${selectedType}-${selectedTheme}-${selectedRatio}`}
        >
          <ResultCard
            type={selectedType}
            value={calculatorExamples[selectedType].value}
            category={calculatorExamples[selectedType].category}
            subtitle={calculatorExamples[selectedType].subtitle}
            theme={selectedTheme}
            aspectRatio={selectedRatio}
            className="transform hover:scale-105 transition-transform duration-300"
          />
        </motion.div>

        {/* Features List */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            {
              icon: '🎯',
              title: 'Dynamic Progress Rings',
              description: 'Color-coded circular progress animations that adapt to result values'
            },
            {
              icon: '✨',
              title: 'Interactive Animations',
              description: 'Hover effects, pulse animations, and smooth transitions using Framer Motion'
            },
            {
              icon: '🎨',
              title: 'Fitness-Inspired Design',
              description: 'Athletic aesthetics with pulse waves, particles, and muscle fiber patterns'
            },
            {
              icon: '🌓',
              title: 'Dark & Light Modes',
              description: 'Seamless theme switching optimized for both dark and light environments'
            },
            {
              icon: '📱',
              title: 'Multi-Format Export',
              description: 'Optimized for 1080×1080 and 1080×1350 social media formats'
            },
            {
              icon: '🔧',
              title: 'Reusable Components',
              description: 'Type-based configuration for BMI, calories, macros, and more'
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

        {/* Usage Example */}
        <motion.div 
          className="mt-16 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Usage Example</h3>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto">
            <pre>{`// Basic usage
<ResultCard 
  type="bmi" 
  value="24.2" 
  category="Normal" 
/>

// Advanced usage with custom props
<ResultCard 
  type="calorie" 
  value="2258" 
  category="Maintain Weight"
  subtitle="Goal: Maintain Weight | BMR: 1643 | TDEE: 2258"
  theme="dark"
  aspectRatio="portrait"
/>`}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultCardDemo;