"use client";

import React, { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Fitness-Inspired ShareableResultCard for NutriSculpt
 * Interactive, animated design with progress rings and fitness aesthetics
 */
const ShareableResultCard = forwardRef(({ 
  calculatorType = 'bmi',
  result,
  subtitle,
  aspectRatio = 'square',
  theme = 'dark', // 'dark' or 'light'
  utmParams = {}
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  // Calculator type configurations
  const calculatorConfigs = {
    bmi: {
      icon: '⚖️',
      color: '#00F5A0',
      unit: '',
      maxValue: 40,
      ranges: [
        { min: 0, max: 18.5, color: '#3B82F6', label: 'Underweight' },
        { min: 18.5, max: 25, color: '#00F5A0', label: 'Normal' },
        { min: 25, max: 30, color: '#F59E0B', label: 'Overweight' },
        { min: 30, max: 40, color: '#EF4444', label: 'Obese' }
      ]
    },
    calories: {
      icon: '🔥',
      color: '#FF6B35',
      unit: 'cal',
      maxValue: 3000,
      ranges: [
        { min: 0, max: 1500, color: '#3B82F6', label: 'Low' },
        { min: 1500, max: 2500, color: '#00F5A0', label: 'Normal' },
        { min: 2500, max: 3000, color: '#F59E0B', label: 'High' }
      ]
    },
    macros: {
      icon: '🥗',
      color: '#00D9FF',
      unit: 'g',
      maxValue: 300,
      ranges: [
        { min: 0, max: 100, color: '#3B82F6', label: 'Low' },
        { min: 100, max: 200, color: '#00F5A0', label: 'Balanced' },
        { min: 200, max: 300, color: '#F59E0B', label: 'High' }
      ]
    }
  };

  const config = calculatorConfigs[calculatorType];
  const currentValue = parseFloat(result?.value || 0);
  
  // Determine color based on value ranges
  const getCurrentColor = () => {
    const range = config.ranges.find(r => currentValue >= r.min && currentValue < r.max);
    return range?.color || config.color;
  };

  const currentColor = getCurrentColor();
  const progressPercentage = Math.min((currentValue / config.maxValue) * 100, 100);

  // Theme configurations
  const themes = {
    dark: {
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      cardBg: 'rgba(15, 23, 42, 0.8)',
      text: '#FFFFFF',
      textSecondary: '#94A3B8',
      accent: currentColor
    },
    light: {
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      text: '#1E293B',
      textSecondary: '#64748B',
      accent: currentColor
    }
  };

  const currentTheme = themes[theme];
  const dimensions = aspectRatio === 'portrait' ? { width: 600, height: 750 } : { width: 600, height: 600 };

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressValue(progressPercentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  // Floating particles animation variants
  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      opacity: [0.3, 0.7, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Progress ring animation
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

  // Pulse animation for the ring
  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      data-shareable-card
      className="relative overflow-hidden cursor-pointer"
      style={{ 
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: currentTheme.background
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Pulse Wave Background */}
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
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-30"
            style={{ 
              backgroundColor: currentColor,
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`
            }}
            variants={particleVariants}
            animate="animate"
            transition={{ delay: i * 0.5 }}
          />
        ))}

        {/* Muscle Fiber Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 600 600">
          <defs>
            <pattern id="fibers" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path 
                d="M0,30 Q15,20 30,30 T60,30" 
                stroke={currentColor} 
                strokeWidth="1" 
                fill="none" 
                opacity="0.3"
              />
              <path 
                d="M0,45 Q15,35 30,45 T60,45" 
                stroke={currentColor} 
                strokeWidth="0.5" 
                fill="none" 
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fibers)"/>
        </svg>
      </div>

      {/* Header with Enhanced Logo */}
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
              {/* Animated gradient overlay */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  backgroundImage: [
                    `linear-gradient(45deg, transparent 0%, ${currentColor}40 50%, transparent 100%)`,
                    `linear-gradient(225deg, transparent 0%, ${currentColor}40 50%, transparent 100%)`,
                    `linear-gradient(45deg, transparent 0%, ${currentColor}40 50%, transparent 100%)`
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
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
            <motion.h1 
              className="text-xl font-bold"
              style={{ color: currentTheme.text }}
              animate={isHovered ? { 
                backgroundImage: `linear-gradient(135deg, ${currentColor} 0%, ${currentTheme.text} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              } : {}}
            >
              NutriSculpt
            </motion.h1>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.textSecondary }}>
              FITNESS CALCULATOR
            </p>
          </div>
        </div>
        
        <motion.div 
          className="px-4 py-2 rounded-xl font-bold uppercase tracking-wide text-sm backdrop-blur-sm"
          style={{ 
            backgroundColor: `${currentColor}20`, 
            border: `1px solid ${currentColor}40`,
            color: currentTheme.text
          }}
          whileHover={{ scale: 1.05 }}
        >
          {calculatorType} {config.icon}
        </motion.div>
      </motion.div>

      {/* Main Result with Progress Ring */}
      <div className={`relative z-10 text-center px-8 ${aspectRatio === 'portrait' ? 'py-16' : 'py-12'}`}>
        <motion.div 
          className="relative inline-block"
          onHoverStart={() => setShowTooltip(true)}
          onHoverEnd={() => setShowTooltip(false)}
        >
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
              variants={pulseVariants}
              animate="animate"
              opacity="0.5"
            />
          </svg>

          {/* Main Value with Glow */}
          <motion.div 
            className="relative z-10 py-16"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="font-black tracking-tight relative"
              style={{ 
                fontSize: '64px',
                lineHeight: '1',
                color: currentColor,
                filter: `drop-shadow(0 0 20px ${currentColor}40)`
              }}
              animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {result?.value}
              
              {/* Heartbeat glow effect */}
              <motion.div 
                className="absolute inset-0 font-black tracking-tight blur-sm"
                style={{ 
                  fontSize: '64px',
                  lineHeight: '1',
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
            
            {/* Unit */}
            {config.unit && (
              <motion.div 
                className="text-lg font-semibold mt-2"
                style={{ color: currentTheme.textSecondary }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {config.unit}
              </motion.div>
            )}
          </motion.div>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm z-20"
                style={{ 
                  backgroundColor: currentTheme.cardBg,
                  color: currentTheme.text,
                  border: `1px solid ${currentColor}40`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                Calculated with NutriSculpt Fitness Calculator
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${currentColor}40`
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category Badge */}
        {result?.category && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div 
              className="inline-block px-8 py-3 text-white font-bold text-lg rounded-2xl shadow-xl relative overflow-hidden"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}80 100%)`,
                border: `2px solid ${currentColor}60`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundImage: [
                    `linear-gradient(45deg, transparent 0%, white 50%, transparent 100%)`,
                    `linear-gradient(225deg, transparent 0%, white 50%, transparent 100%)`,
                    `linear-gradient(45deg, transparent 0%, white 50%, transparent 100%)`
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative z-10">{result.category}</span>
            </motion.div>
          </motion.div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div 
              className="inline-block px-6 py-3 rounded-xl font-semibold backdrop-blur-sm"
              style={{ 
                backgroundColor: `${currentColor}15`,
                border: `1px solid ${currentColor}30`,
                color: currentTheme.text
              }}
            >
              {subtitle}
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Footer */}
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
              backgroundColor: currentTheme.cardBg, 
              color: currentTheme.textSecondary,
              border: `1px solid ${currentColor}20`
            }}
          >
            Calculated with NutriSculpt Fitness Calculator
          </div>
          
          <motion.div 
            className="font-bold tracking-wide text-xs px-2 select-none"
            animate={isHovered ? {
              backgroundImage: `linear-gradient(135deg, ${currentColor} 0%, ${currentTheme.accent} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            } : {
              color: currentTheme.textSecondary
            }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'inline-block',
              position: 'relative',
              zIndex: 20
            }}
          >
            NOURISHING BODIES • SCULPTING GREATNESS
          </motion.div>
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

ShareableResultCard.displayName = 'ShareableResultCard';

export default ShareableResultCard;