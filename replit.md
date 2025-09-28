# NutriSculpt

## Overview

NutriSculpt is a modern web application built with Next.js that provides nutrition and health calculators with social sharing capabilities. The application focuses on creating interactive health tools that users can use to calculate various nutritional metrics and share their results as visually appealing images on social media platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses Next.js 15 with the App Router architecture, providing server-side rendering and modern React features. The frontend is built with React 19 and styled using Tailwind CSS for responsive, utility-first styling. The application supports both light and dark themes through class-based dark mode configuration.

### Component Structure
The project follows a component-based architecture with reusable UI components. FontAwesome icons are integrated for consistent iconography throughout the application, with both solid and brand icon sets available for various UI elements.

### Animation and Interactivity
Framer Motion is implemented for smooth animations and transitions, enhancing the user experience with fluid interactions and engaging visual feedback.

### Image Generation and Sharing
A custom hook system (`useShareableImage`) handles the generation of shareable images from calculator results. This uses html2canvas to convert React components into high-quality images that users can share on social media platforms. The system supports customizable options for image quality, format, and styling.

### Styling and Theming
Tailwind CSS provides the styling foundation with custom CSS variables for theme colors. The application automatically adapts to user's system preferences for light/dark mode and includes manual theme switching capabilities.

### Development Tools
The project includes comprehensive linting with ESLint and Prettier for code quality and consistency. The development environment is optimized with Turbopack for faster build times and hot reloading.

## External Dependencies

### Analytics and Monitoring
- **Vercel Analytics**: Integrated for tracking user interactions and application performance metrics

### Social Media Integration
- **Environment-based Social Links**: WhatsApp, Instagram, and YouTube integration through environment variables for brand presence

### Image Processing
- **html2canvas**: Primary library for converting DOM elements to canvas for image generation
- **dom-to-image-more**: Alternative image generation library for enhanced compatibility

### UI and Animation
- **FontAwesome**: Icon library providing comprehensive iconography
- **Framer Motion**: Animation library for smooth transitions and interactive elements

### Development and Build Tools
- **Next.js**: Full-stack React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting tools
- **Turbopack**: Next-generation bundler for faster development builds