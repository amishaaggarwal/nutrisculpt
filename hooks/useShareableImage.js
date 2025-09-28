import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

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
      format = 'png',
      scale = 2, // For high-resolution images
      backgroundColor = '#ffffff'
    } = options;

    try {
      // Use html2canvas to capture the component
      const canvas = await html2canvas(shareableCardRef.current, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor,
        width: 600,
        height: 600,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 600,
        windowHeight: 600,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the cloned document
          const shareableCard = clonedDoc.querySelector('[data-shareable-card]');
          if (shareableCard) {
            shareableCard.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
          }
        }
      });

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate image blob'));
            }
          },
          `image/${format}`,
          quality
        );
      });
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