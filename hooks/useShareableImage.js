import { useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';

/**
 * Custom hook for generating shareable images from calculator results
 */
export const useShareableImage = (calculatorType) => {
  const shareableCardRef = useRef(null);

  const generateImage = useCallback(async (options = {}) => {
    if (!shareableCardRef.current) {
      throw new Error('Shareable card ref not found');
    }

    const {
      quality = 0.95,
      pixelRatio = 2, // For high-resolution images
      backgroundColor = '#0f172a'
    } = options;

    try {
      // Get actual dimensions for proper rendering
      const rect = shareableCardRef.current.getBoundingClientRect();
      
      const dataUrl = await toPng(shareableCardRef.current, {
        quality,
        pixelRatio: 1,
        backgroundColor,
        width: rect.width,
        height: rect.height,
        style: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      return blob;
    } catch (error) {
      console.error('Error generating shareable image:', error);
      throw error;
    }
  }, []);

  const generateShareData = useCallback((result, customMessage = '') => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const calculatorPath = `/${calculatorType}`;
    
    // Build UTM tracking URL
    const utmParams = new URLSearchParams({
      utm_source: 'share',
      utm_medium: 'social',
      utm_campaign: 'calculator_share',
      utm_content: calculatorType
    }).toString();
    
    const shareUrl = `${baseUrl}${calculatorPath}?${utmParams}`;
    
    // Generate appropriate share text based on calculator type
    let shareText = customMessage;
    
    if (!shareText) {
      switch (calculatorType) {
        case 'bmi':
          shareText = `My BMI is ${result.value} (${result.category}). Calculate yours with NutriSculpt!`;
          break;
        case 'calories':
          shareText = `My daily calorie target is ${result.value} calories. Find your perfect calorie goal!`;
          break;
        case 'macros':
          shareText = `Check out my macro breakdown: ${result.protein}g protein, ${result.carbs}g carbs, ${result.fat}g fat!`;
          break;
        case 'one-rm':
          shareText = `My estimated 1RM is ${result.value}${result.unit}! Calculate your one-rep max!`;
          break;
        case 'heart-rate':
          shareText = `Discovered my optimal heart rate zones! Find yours for better training!`;
          break;
        case 'ideal-weight':
          shareText = `Found my ideal weight range: ${result.value}${result.unit}. What's yours?`;
          break;
        case 'water-intake':
          shareText = `I should drink ${result.value}${result.unit} of water daily. Calculate your hydration needs!`;
          break;
        default:
          shareText = `Check out my fitness calculation results! Calculate yours with NutriSculpt!`;
      }
    }

    return {
      title: `NutriSculpt ${calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1)} Calculator Result`,
      text: shareText,
      url: shareUrl
    };
  }, [calculatorType]);

  const validateResultForPrivacy = useCallback((result, sensitiveFields = []) => {
    // Create a sanitized version of the result that excludes sensitive information
    const sanitizedResult = { ...result };
    
    // Remove any explicitly sensitive fields
    sensitiveFields.forEach(field => {
      delete sanitizedResult[field];
    });
    
    // Common sensitive fields to exclude
    const commonSensitiveFields = [
      'age', 'weight', 'height', 'gender', 'email', 'name', 
      'restingHeartRate', 'maxHeartRate', 'activityLevel'
    ];
    
    commonSensitiveFields.forEach(field => {
      delete sanitizedResult[field];
    });
    
    return sanitizedResult;
  }, []);

  return {
    shareableCardRef,
    generateImage,
    generateShareData,
    validateResultForPrivacy
  };
};