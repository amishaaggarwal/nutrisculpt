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
      pixelRatio = 2,
      backgroundColor = '#0f172a'
    } = options;

    try {
      // Temporarily position the element for proper rendering
      const originalStyle = {
        position: shareableCardRef.current.style.position,
        top: shareableCardRef.current.style.top,
        left: shareableCardRef.current.style.left,
        width: shareableCardRef.current.style.width,
        height: shareableCardRef.current.style.height
      };

      // Set fixed dimensions for consistent rendering
      shareableCardRef.current.style.position = 'fixed';
      shareableCardRef.current.style.top = '0px';
      shareableCardRef.current.style.left = '0px';
      shareableCardRef.current.style.width = '320px';
      shareableCardRef.current.style.height = '320px';
      
      const dataUrl = await toPng(shareableCardRef.current, {
        quality,
        pixelRatio,
        backgroundColor,
        width: 320,
        height: 320,
        style: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }
      });

      // Restore original styles
      Object.assign(shareableCardRef.current.style, originalStyle);

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
          shareText = `My BMI is ${result.value} (${result.category}). Explore yours with NutriSculpt!`;
          break;
        case 'calories':
          shareText = `My estimated daily calorie target is ${result.value} calories. Explore your estimated daily calorie needs with NutriSculpt!`;
          break;
        case 'macros':
          shareText = `My macro split: ${result.protein}g protein, ${result.carbs}g carbs, ${result.fat}g fat. Explore your own with NutriSculpt!`;
          break;
        case 'one-rm':
          shareText = `My estimated 1RM is ${result.value} ${result.unit} (Brzycki estimate from ${result.repsUsed} reps). Explore your strength estimate with NutriSculpt!`;
          break;
        case 'heart-rate':
          shareText = `Explore an estimated maximum heart rate and training guidance with NutriSculpt!`;
          break;
        case 'ideal-weight':
          shareText = `Explore a weight-for-height reference: ${result.value}${result.unit}. Learn more with NutriSculpt!`;
          break;
        case 'water-intake':
          shareText = `General hydration reference: ${result.value} L/day total water (all beverages and food). Explore hydration guidance with NutriSculpt!`;
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
    // Shallow guard only: removes the named and common sensitive keys from the
    // top level of the object. This is NOT a full sanitizer - it does not
    // recurse into nested values and it cannot remove a value that a caller has
    // already interpolated into a display string.
    //
    // Privacy on the shareable card is enforced by the callers passing an
    // explicit allowlist of display-safe fields, and by rendering only those
    // fields into the preview and the exported PNG. Treat this helper as a
    // secondary check, not as proof that a result is safe to share.
    const sanitizedResult = { ...result };

    // Remove any explicitly sensitive fields
    sensitiveFields.forEach(field => {
      delete sanitizedResult[field];
    });

    // Common sensitive fields to exclude
    const commonSensitiveFields = [
      'age', 'weight', 'height', 'gender', 'email', 'name',
      'restingHeartRate', 'maxHeartRate', 'activityLevel', 'restingHR'
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