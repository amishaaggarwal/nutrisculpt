"use client";

import React, { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable ResultCard component that adapts to different calculator types
 * Matches the BMI calculator design with animated progress rings and fitness aesthetics
 */
const ResultCard = forwardRef(({ 
  type = 'bmi',
  value,
  category,
  subtitle,
  aspectRatio = 'square',
  className = '',
  unit = null, // Override unit for specific cases (e.g., 1RM with lb/kg)
  ...props 
}, ref) => {
  const [progressValue, setProgressValue] = useState(0);

  // Calculator type configurations with unit mapping
  const calculatorConfigs = {
    bmi: {
      icon: '⚖️',
      label: 'BMI',
      color: '#00F5A0',
      maxValue: 40,
      unit: null, // BMI has no unit
      getProgress: (val) => Math.min((parseFloat(val) / 40) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 18.5) return '#3B82F6';
        if (numVal < 25) return '#00F5A0';
        if (numVal < 30) return '#F59E0B';
        return '#EF4444';
      }
    },
    calorie: {
      icon: '🔥',
      label: 'CALORIES',
      color: '#FF6B35',
      maxValue: 3000,
      unit: 'kcal/day',
      getProgress: (val) => Math.min((parseFloat(val) / 3000) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 1500) return '#3B82F6';
        if (numVal < 2500) return '#00F5A0';
        return '#F59E0B';
      }
    },
    tdee: {
      icon: '🔥',
      label: 'TDEE',
      color: '#FF6B35',
      maxValue: 3000,
      unit: 'kcal/day',
      getProgress: (val) => Math.min((parseFloat(val) / 3000) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 1500) return '#3B82F6';
        if (numVal < 2500) return '#00F5A0';
        return '#F59E0B';
      }
    },
    bmr: {
      icon: '🔥',
      label: 'BMR',
      color: '#FF6B35',
      maxValue: 2500,
      unit: 'kcal/day',
      getProgress: (val) => Math.min((parseFloat(val) / 2500) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 1200) return '#3B82F6';
        if (numVal < 2000) return '#00F5A0';
        return '#F59E0B';
      }
    },
    macro: {
      icon: '🥗',
      label: 'MACROS',
      color: '#00D9FF',
      maxValue: 100,
      unit: 'g', // For individual macro values (protein, carbs, fat)
      getProgress: (val) => 75, // Balanced macro split
      getColor: () => '#00F5A0'
    },
    water: {
      icon: '💧',
      label: 'WATER',
      color: '#00D9FF',
      maxValue: 4,
      unit: 'L/day',
      getProgress: (val) => Math.min((parseFloat(val) / 4) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 2) return '#F59E0B';
        if (numVal < 3.5) return '#00F5A0';
        return '#3B82F6';
      }
    },
    heart: {
      icon: '❤️',
      label: 'HEART RATE',
      color: '#EF4444',
      maxValue: 200,
      unit: 'bpm',
      getProgress: (val) => Math.min((parseFloat(val) / 200) * 100, 100),
      getColor: (val) => {
        const numVal = parseFloat(val);
        if (numVal < 100) return '#3B82F6';
        if (numVal < 160) return '#00F5A0';
        return '#EF4444';
      }
    },
    idealWeight: {
      icon: '🎯',
      label: 'IDEAL WEIGHT',
      color: '#8B5CF6',
      maxValue: 100,
      unit: 'kg',
      getProgress: () => 80, // Ideal weight achievement
      getColor: () => '#00F5A0'
    },
    oneRm: {
      icon: '💪',
      label: '1RM',
      color: '#F59E0B',
      maxValue: 200,
      unit: null, // Will be set dynamically based on weight system (kg/lb)
      getProgress: (val) => Math.min((parseFloat(val) / 200) * 100, 100),
      getColor: () => '#F59E0B'
    }
  };

  const config = calculatorConfigs[type] || calculatorConfigs.bmi;
  const currentValue = parseFloat(value || 0);
  const progressPercentage = config.getProgress(value || 0);
  const currentColor = config.getColor(value || 0);
  
  // Determine the unit to display (override takes precedence)
  const displayUnit = unit || config.unit;

  // Calculate dynamic layout properties
  const layoutProps = {
    hasUnit: !!displayUnit,
    hasCategory: !!category,
    hasSubtitle: !!subtitle,
    valueLength: String(value || '').length,
    categoryLength: String(category || '').length,
    subtitleLength: String(subtitle || '').length
  };

  // Dynamic font sizing based on content length
  const getValueFontSize = (valueStr) => {
    const length = String(valueStr || '').length;
    if (length <= 4) return '64px';
    if (length <= 6) return '56px';
    if (length <= 8) return '48px';
    return '40px';
  };

  const getCategoryFontSize = (categoryStr) => {
    const length = String(categoryStr || '').length;
    if (length <= 8) return 'text-xl';
    if (length <= 12) return 'text-lg';
    return 'text-base';
  };

  const getSubtitleFontSize = (subtitleStr) => {
    const length = String(subtitleStr || '').length;
    if (length <= 30) return 'font-semibold';
    if (length <= 50) return 'font-medium text-sm';
    return 'font-medium text-xs';
  };

  // Calculate vertical spacing based on content
  const getVerticalSpacing = () => {
    const elementCount = [layoutProps.hasUnit, layoutProps.hasCategory, layoutProps.hasSubtitle].filter(Boolean).length;
    const isPortrait = aspectRatio === 'portrait';
    
    if (elementCount === 0) return isPortrait ? 'py-20' : 'py-16';
    if (elementCount === 1) return isPortrait ? 'py-16' : 'py-12';
    if (elementCount === 2) return isPortrait ? 'py-12' : 'py-10';
    return isPortrait ? 'py-10' : 'py-8';
  };

  const getElementSpacing = () => {
    const elementCount = [layoutProps.hasUnit, layoutProps.hasCategory, layoutProps.hasSubtitle].filter(Boolean).length;
    if (elementCount <= 1) return 'space-y-6';
    if (elementCount === 2) return 'space-y-5';
    return 'space-y-4';
  };

  // Dynamic sizing values
  const valueFontSize = getValueFontSize(value);
  const categoryFontClass = getCategoryFontSize(category);
  const subtitleFontClass = getSubtitleFontSize(subtitle);
  const verticalSpacing = getVerticalSpacing();
  const elementSpacing = getElementSpacing();

  const dimensions = aspectRatio === 'portrait' 
    ? { width: 600, height: 750 } 
    : { width: 600, height: 600 };

  // Animate progress on mount and value change
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(progressPercentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  // Progress ring animation variants
  const ringVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: progressValue / 100, 
      opacity: 1,
      transition: { 
        pathLength: { duration: 2, ease: "easeOut" },
        opacity: { duration: 0.5 }
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      data-shareable-card
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      {...props}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-30"
            style={{ 
              backgroundColor: currentColor,
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}

        {/* Pulse wave background */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundImage: [
              `radial-gradient(circle at 20% 50%, ${currentColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 50%, ${currentColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${currentColor} 0%, transparent 50%)`
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 flex items-center justify-between p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div 
            className="relative"
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}80 100%)` 
              }}
            >
              {/* NutriSculpt Logo */}
              <svg width="28" height="28" viewBox="0 0 200 200" className="text-white relative z-10">
                <rect x="20" y="40" width="6" height="50" fill="currentColor"/>
                <rect x="30" y="30" width="6" height="70" fill="currentColor"/>
                <rect x="40" y="45" width="6" height="40" fill="currentColor"/>
                <rect x="60" y="20" width="8" height="80" fill="currentColor" transform="rotate(45 64 60)"/>
                <rect x="72" y="20" width="8" height="80" fill="currentColor" transform="rotate(45 76 60)"/>
                <rect x="84" y="20" width="8" height="80" fill="currentColor" transform="rotate(45 88 60)"/>
                <rect x="120" y="35" width="6" height="45" fill="currentColor"/>
                <rect x="130" y="25" width="6" height="65" fill="currentColor"/>
                <rect x="140" y="40" width="6" height="35" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Pulsing indicator */}
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
              style={{ backgroundColor: '#00F5A0' }}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          <div>
            <h1 className="text-xl font-bold text-white">NutriSculpt</h1>
            <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">
              FITNESS CALCULATOR
            </p>
          </div>
        </div>
        
        <motion.div 
          className="px-4 py-2 rounded-xl font-bold uppercase tracking-wide text-sm backdrop-blur-sm flex items-center space-x-2"
          style={{ 
            backgroundColor: `${currentColor}20`, 
            border: `1px solid ${currentColor}40`,
            color: '#FFFFFF'
          }}
          whileHover={{ scale: 1.05 }}
        >
          <span>{config.label}</span>
          <span>{config.icon}</span>
        </motion.div>
      </motion.div>

      {/* Main Result with Progress Ring */}
      <div className={`relative z-10 text-center px-8 ${verticalSpacing}`}>
        <div className={`flex flex-col items-center justify-center min-h-0 ${elementSpacing}`}>
        <motion.div className="relative inline-block flex-shrink-0">
          {/* Progress Ring */}
          <svg 
            width="200" 
            height="200" 
            className="absolute inset-0 -rotate-90"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)' }}
          >
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke={`${currentColor}20`}
              strokeWidth="8"
              fill="none"
            />
            
            {/* Progress ring */}
            <motion.circle
              cx="100"
              cy="100"
              r="85"
              stroke={currentColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 85}`}
              variants={ringVariants}
              initial="initial"
              animate="animate"
              style={{
                filter: `drop-shadow(0 0 10px ${currentColor}60)`
              }}
            />
            
            {/* Pulse ring */}
            <motion.circle
              cx="100"
              cy="100"
              r="85"
              stroke={currentColor}
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - progressValue / 100)}`}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>

          {/* Main Value with Unit */}
          <motion.div 
            className="relative z-10 py-12 flex flex-col items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="font-black tracking-tight relative text-center"
              style={{ 
                fontSize: valueFontSize,
                lineHeight: '1.1',
                color: currentColor,
                filter: `drop-shadow(0 0 20px ${currentColor}40)`,
                maxWidth: '180px',
                wordBreak: 'break-word'
              }}
            >
              {value}
              
              {/* Heartbeat glow effect */}
              <motion.div 
                className="absolute inset-0 font-black tracking-tight blur-sm"
                style={{ 
                  fontSize: valueFontSize,
                  lineHeight: '1.1',
                  color: currentColor,
                  opacity: 0.3
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            
            {/* Unit Display */}
            {displayUnit && (
              <motion.div 
                className="font-semibold tracking-wide mt-2 text-center"
                style={{ 
                  fontSize: layoutProps.valueLength > 6 ? '14px' : '18px',
                  color: currentColor,
                  opacity: 0.8,
                  filter: `drop-shadow(0 0 8px ${currentColor}30)`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                {displayUnit}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Category Badge */}
        {category && (
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div 
              className={`inline-block px-6 py-2.5 text-white font-bold ${categoryFontClass} rounded-2xl shadow-xl relative overflow-hidden max-w-xs text-center`}
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}80 100%)`,
                border: `2px solid ${currentColor}60`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 break-words">{category}</span>
            </motion.div>
          </motion.div>
        )}

        {/* Result Summary Box */}
        {subtitle && (
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div 
              className={`inline-block px-4 py-2.5 rounded-xl ${subtitleFontClass} backdrop-blur-sm border max-w-sm text-center`}
              style={{ 
                backgroundColor: `${currentColor}15`,
                borderColor: `${currentColor}30`,
                color: '#E2E8F0'
              }}
            >
              <span className="break-words">{subtitle}</span>
            </div>
          </motion.div>
        )}
        </div>
      </div>

      {/* Footer with Taglines */}
      <motion.div 
        className={`absolute left-0 right-0 text-center z-10 px-4 ${aspectRatio === 'portrait' ? 'bottom-6' : 'bottom-4'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center space-y-2">
          <div 
            className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border-0"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.8)', 
              color: '#94A3B8',
              border: `1px solid ${currentColor}20`
            }}
          >
            Calculated with NutriSculpt Fitness Calculator
          </div>
          
          <div 
            className="font-bold tracking-wide text-xs px-2 select-none bg-gradient-to-r from-current to-slate-400 bg-clip-text text-transparent"
            style={{ 
              '--tw-gradient-from': currentColor,
              '--tw-gradient-to': '#94A3B8',
              position: 'relative',
              zIndex: 20
            }}
          >
            NOURISHING BODIES • SCULPTING GREATNESS
          </div>
        </div>
      </motion.div>

      {/* Dynamic Corner Elements */}
      <motion.div 
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{ 
          backgroundImage: `conic-gradient(from 0deg, ${currentColor}, ${currentColor}80, ${currentColor}40, ${currentColor})`,
          clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div 
        className="absolute bottom-0 left-0 w-16 h-16 opacity-15"
        style={{ 
          backgroundImage: `linear-gradient(45deg, ${currentColor}, ${currentColor}60)`,
          clipPath: 'polygon(0% 50%, 0% 100%, 50% 100%)'
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
});

ResultCard.displayName = 'ResultCard';

export default ResultCard;