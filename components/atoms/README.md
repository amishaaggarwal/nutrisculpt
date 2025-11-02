# Enhanced NutriSculpt Result Cards

## Overview

The enhanced result card system provides fitness-inspired, interactive calculator result cards with dynamic animations, progress rings, and athletic aesthetics. Built with React, Tailwind CSS, and Framer Motion.

## Components

### 1. ShareableResultCard
The main component with full fitness-inspired design and animations.

```jsx
import ShareableResultCard from '@/components/atoms/ShareableResultCard';

<ShareableResultCard
  calculatorType="bmi"
  result={{ value: "24.2", category: "Normal" }}
  subtitle="Healthy range: 18.5 - 24.9"
  theme="dark"
  aspectRatio="square"
/>
```

### 2. ResultCard
Simplified wrapper component for easy integration.

```jsx
import ResultCard from '@/components/atoms/ResultCard';

<ResultCard 
  type="bmi" 
  value="24.2" 
  category="Normal" 
  theme="dark"
/>
```

## Features

### 🎯 Dynamic Progress Rings
- **Color-coded animations** based on result values
- **Smooth loading animations** with Framer Motion
- **Pulsing effects** for fitness-tracker vibe
- **Range-based coloring**: Green (normal), Yellow (moderate), Red (high)

### ✨ Interactive Animations
- **Hover effects** with scale and glow animations
- **Tooltip displays** on hover/tap
- **Particle animations** in background
- **Pulse wave effects** for energy

### 🎨 Fitness-Inspired Design
- **Athletic color schemes** with neon accents
- **Muscle fiber patterns** in background
- **Geometric elements** with conic gradients
- **Heartbeat glow effects** on main values

### 🌓 Theme Support
- **Dark mode**: Deep navy gradients with neon accents
- **Light mode**: Clean whites with subtle colors
- **Seamless switching** between themes
- **Optimized contrast** for readability

### 📱 Multi-Format Export
- **Square format**: 600×600px (1080×1080 equivalent)
- **Portrait format**: 600×750px (1080×1350 equivalent)
- **Social media optimized** for sharing
- **High-resolution export** with 2x pixel ratio

## Calculator Types

### BMI Calculator
```jsx
<ResultCard 
  type="bmi" 
  value="24.2" 
  category="Normal" 
  subtitle="Healthy range: 18.5 - 24.9"
/>
```
- **Color ranges**: Blue (underweight), Green (normal), Yellow (overweight), Red (obese)
- **Icon**: ⚖️ Scale
- **Max value**: 40 for progress ring

### Calorie Calculator
```jsx
<ResultCard 
  type="calorie" 
  value="2258" 
  category="Maintain Weight" 
  subtitle="Goal: Maintain Weight | BMR: 1643 | TDEE: 2258"
/>
```
- **Color ranges**: Blue (low), Green (normal), Yellow (high)
- **Icon**: 🔥 Fire
- **Max value**: 3000 for progress ring

### Macro Calculator
```jsx
<ResultCard 
  type="macro" 
  value="141g • 254g • 75g" 
  category="Balanced" 
  subtitle="Protein • Carbs • Fat | 2258 calories/day"
/>
```
- **Color ranges**: Blue (low), Green (balanced), Yellow (high)
- **Icon**: 🥗 Salad
- **Max value**: 300 for progress ring

### Heart Rate Calculator
```jsx
<ResultCard 
  type="heart-rate" 
  value="150" 
  category="Zone 3" 
  subtitle="Aerobic training zone"
/>
```

### Ideal Weight Calculator
```jsx
<ResultCard 
  type="ideal-weight" 
  value="68.5" 
  category="Medium Frame" 
  subtitle="Healthy range: 60.2kg - 76.8kg"
/>
```

### Water Intake Calculator
```jsx
<ResultCard 
  type="water-intake" 
  value="2.8" 
  category="Optimal" 
  subtitle="2800ml | 94oz | 11.8 cups"
/>
```

### One-RM Calculator
```jsx
<ResultCard 
  type="one-rm" 
  value="125" 
  category="Bench Press" 
  subtitle="1RM from 5 reps"
/>
```

## Animation Details

### Progress Ring Animation
- **Duration**: 2 seconds with easeOut timing
- **Delay**: 500ms after component mount
- **Pulse effect**: Continuous 2-second cycle
- **Glow effect**: Drop shadow with calculator color

### Background Elements
- **Pulse waves**: 4-second radial gradient animation
- **Floating particles**: 6 particles with staggered delays
- **Muscle fiber pattern**: SVG pattern with wave paths
- **Corner elements**: Rotating conic gradients

### Interactive Effects
- **Hover scale**: 1.02x scale with spring animation
- **Logo rotation**: 5-degree rotation on hover
- **Tooltip**: Fade in/out with backdrop blur
- **Badge pulse**: Scale and opacity animation

## Customization

### Brand Colors
```jsx
const brandColors = {
  primary: '#FF6B35',   // Energetic Orange
  accent: '#00D9FF',    // Electric Blue  
  success: '#00F5A0',   // Neon Green
  dark: '#0F172A',      // Deep Navy
  text: '#1E293B',      // Text Dark
  textLight: '#64748B'  // Text Light
};
```

### Theme Configuration
```jsx
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
```

## Performance Considerations

### Optimization
- **Framer Motion**: Optimized animations with hardware acceleration
- **SVG patterns**: Lightweight vector graphics for backgrounds
- **Conditional rendering**: Animations only when visible
- **Memoized calculations**: Prevent unnecessary re-renders

### Bundle Size
- **Tree shaking**: Import only used Framer Motion components
- **CSS-in-JS**: Minimal runtime styles with Tailwind
- **Component splitting**: Separate demo from production components

## Integration Guide

### 1. Install Dependencies
```bash
npm install framer-motion
```

### 2. Import Components
```jsx
import ResultCard from '@/components/atoms/ResultCard';
// or
import ShareableResultCard from '@/components/atoms/ShareableResultCard';
```

### 3. Use in Calculator Pages
```jsx
// Replace existing result display with:
<ResultCard 
  type="bmi" 
  value={bmiValue} 
  category={bmiCategory} 
  subtitle={healthyRange}
  theme="dark"
/>
```

### 4. Image Generation
```jsx
// For sharing functionality:
<ShareableResultCard
  ref={shareableCardRef}
  calculatorType="bmi"
  result={{ value, category }}
  subtitle={subtitle}
/>
```

## Browser Support

- **Modern browsers**: Chrome 88+, Firefox 87+, Safari 14+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 88+
- **Framer Motion**: Hardware-accelerated animations
- **CSS Grid/Flexbox**: Full layout support

## Accessibility

- **Keyboard navigation**: Focus management for interactive elements
- **Screen readers**: Proper ARIA labels and descriptions
- **Reduced motion**: Respects `prefers-reduced-motion` setting
- **Color contrast**: WCAG AA compliant color combinations
- **Focus indicators**: Visible focus states for all interactive elements

## Demo

View the interactive demo at `/components/demo/ResultCardDemo.jsx` to see all calculator types, themes, and aspect ratios in action.