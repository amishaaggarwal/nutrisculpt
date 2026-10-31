import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShare, 
  faDownload, 
  faPinterest, 
  faFacebook, 
  faWhatsapp,
  faInstagram,
  faSnapchat,
  faCopy,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { 
  faPinterest as faPinterestBrand,
  faFacebookF,
  faWhatsapp as faWhatsappBrand,
  faInstagram as faInstagramBrand,
  faSnapchatGhost
} from '@fortawesome/free-brands-svg-icons';

const ShareButton = ({ 
  onGenerateImage, 
  shareData,
  className = "",
  variant = "primary" // primary, secondary, icon-only
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = async (platform = 'native') => {
    setIsGenerating(true);
    
    try {
      const imageBlob = await onGenerateImage();
      
      if (platform === 'native' && navigator.share) {
        // Use native sharing when available
        const sharePayload = {
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        };

        // Try to share with image if supported
        if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'result.png', { type: 'image/png' })] })) {
          sharePayload.files = [new File([imageBlob], 'result.png', { type: 'image/png' })];
        }

        await navigator.share(sharePayload);
      } else {
        // Fallback to platform-specific sharing or download
        await handlePlatformShare(platform, imageBlob);
      }
      
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error sharing:', error);
      // On error, try to download the image
      if (error.name !== 'AbortError') {
        try {
          const imageBlob = await onGenerateImage();
          downloadImage(imageBlob);
        } catch (downloadError) {
          console.error('Error downloading image:', downloadError);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlatformShare = async (platform, imageBlob) => {
    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);
    
    switch (platform) {
      case 'pinterest':
        // Pinterest doesn't reliably support data URLs, so just use the calculator URL
        window.open(`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`, '_blank', 'width=750,height=750');
        break;
        
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'width=600,height=400');
        break;
        
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
        break;
        
      case 'instagram':
        downloadImage(imageBlob, 'Image saved! Open Instagram → New Post/Story → Select from Photos to share your result.');
        break;
        
      case 'snapchat':
        downloadImage(imageBlob, 'Image saved! Open Snapchat → Camera → Upload from Gallery to share your result.');
        break;
        
      case 'copy':
        await copyToClipboard();
        break;
        
      case 'download':
      default:
        downloadImage(imageBlob);
        break;
    }
  };

  const blobToDataUrl = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const downloadImage = (blob, message = null) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shareData.title.replace(/\s+/g, '_').toLowerCase()}_result.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (message) {
      // Could show a toast notification here
      console.info(message);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;
  
  const shareOptions = [
    ...(hasNativeShare ? [{ id: 'native', label: 'Share', icon: faShare, color: 'text-blue-600' }] : []),
    { id: 'copy', label: copySuccess ? 'Copied!' : 'Copy Link', icon: faCopy, color: 'text-gray-600' },
    { id: 'download', label: 'Download Image', icon: faDownload, color: 'text-gray-600' },
    { id: 'pinterest', label: 'Pinterest', icon: faPinterestBrand, color: 'text-red-600' },
    { id: 'facebook', label: 'Facebook', icon: faFacebookF, color: 'text-blue-600' },
    { id: 'whatsapp', label: 'WhatsApp', icon: faWhatsappBrand, color: 'text-green-600' },
    { id: 'instagram', label: 'Instagram', icon: faInstagramBrand, color: 'text-pink-600' },
    { id: 'snapchat', label: 'Snapchat', icon: faSnapchatGhost, color: 'text-yellow-400' }
  ];

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
    
    switch (variant) {
      case 'secondary':
        return `${baseClasses} px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`;
      case 'icon-only':
        return `${baseClasses} p-2 bg-blue-600 text-white hover:bg-blue-700`;
      default:
        return `${baseClasses} px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        disabled={isGenerating}
        className={getButtonClasses()}
      >
        {isGenerating ? (
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faShare} className={variant === 'icon-only' ? '' : 'mr-2'} />
        )}
        {variant !== 'icon-only' && (
          <span>{isGenerating ? 'Generating...' : 'Share Result'}</span>
        )}
      </button>

      {/* Share Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowShareMenu(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Share Your Result</h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleShare(option.id)}
                  disabled={isGenerating}
                  className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors duration-150 border border-gray-200"
                >
                  <FontAwesomeIcon icon={option.icon} className={`w-6 h-6 mb-2 ${option.color}`} />
                  <span className="text-sm text-gray-700 text-center">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;