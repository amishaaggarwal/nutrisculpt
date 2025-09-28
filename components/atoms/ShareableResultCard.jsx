import React, { forwardRef } from 'react';

/**
 * ShareableResultCard component for generating branded shareable images
 * This component is designed to be captured by html2canvas for image generation
 */
const ShareableResultCard = forwardRef(({ 
  calculatorType,
  result,
  subtitle,
  brandColors = {
    primary: '#10b981', // emerald-500
    secondary: '#065f46', // emerald-800
    accent: '#f59e0b' // amber-500
  },
  utmParams = {}
}, ref) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const calculatorPath = `/${calculatorType}`;
  
  // Build UTM tracking URL
  const utmString = new URLSearchParams({
    utm_source: 'share',
    utm_medium: 'image',
    utm_campaign: 'calculator_share',
    utm_content: calculatorType,
    ...utmParams
  }).toString();
  
  const shareUrl = `${baseUrl}${calculatorPath}?${utmString}`;

  return (
    <div 
      ref={ref}
      data-shareable-card
      className="w-[600px] h-[600px] bg-gradient-to-br from-white to-gray-50 p-8 relative overflow-hidden"
      style={{ 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke={brandColors.primary} strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: brandColors.primary }}
          >
            NS
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">NutriSculpt</h1>
            <p className="text-sm text-gray-600">Fitness Calculator</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700 capitalize">
            {calculatorType.replace('-', ' ')} Calculator
          </p>
        </div>
      </div>

      {/* Main Result */}
      <div className="text-center mb-8">
        <div 
          className="text-6xl font-extrabold mb-4"
          style={{ color: brandColors.primary }}
        >
          {result.value}
        </div>
        {result.unit && (
          <div className="text-2xl font-semibold text-gray-600 mb-2">
            {result.unit}
          </div>
        )}
        {result.category && (
          <div 
            className="inline-block px-4 py-2 rounded-full text-white font-semibold text-lg"
            style={{ backgroundColor: brandColors.secondary }}
          >
            {result.category}
          </div>
        )}
        {subtitle && (
          <p className="text-lg text-gray-700 mt-4 max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <div 
          className="inline-block px-6 py-3 rounded-lg text-white font-semibold text-lg mb-4"
          style={{ backgroundColor: brandColors.accent }}
        >
          Calculate Yours Free
        </div>
        <p className="text-sm font-medium text-gray-700">
          {shareUrl.replace('https://', '').replace('http://', '')}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-8 right-8 text-center">
        <p className="text-sm text-gray-500">
          Calculated with NutriSculpt Fitness Calculator
        </p>
      </div>

      {/* Decorative elements */}
      <div 
        className="absolute top-4 right-4 w-16 h-16 rounded-full opacity-10"
        style={{ backgroundColor: brandColors.primary }}
      ></div>
      <div 
        className="absolute bottom-20 left-4 w-12 h-12 rounded-full opacity-10"
        style={{ backgroundColor: brandColors.accent }}
      ></div>
    </div>
  );
});

ShareableResultCard.displayName = 'ShareableResultCard';

export default ShareableResultCard;