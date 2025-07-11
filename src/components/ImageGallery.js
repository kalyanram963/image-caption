// src/components/ImageGallery.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FiHash, FiClipboard, FiMeh, FiFrown, FiSlash (or FiCameraOff) are still useful for visual display
import { FiXCircle, FiCopy, FiCheckCircle, FiTag, FiGlobe, FiSmile, FiFileText, FiMessageCircle, FiTwitter, FiHash, FiCameraOff, FiEdit } from 'react-icons/fi';
import styles from './ImageGallery.module.css';

const ImageGallery = ({
  images,
  onRemoveImage,
  onGenerateCaptionForImage,
  selectedStyle,
  includeHashtags,
  onCopyCaption,
  onTranslateCaption,
  analyzeFaceAndEmotionForSingleImage,
  selectedTranslationLanguage,
  handleGenerateAltTextForSingleImage,
  setGlobalMessage,
}) => {
  const imageCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const handleShareWhatsApp = (caption) => {
    console.log("Attempting WhatsApp share for caption:", caption);
    const text = encodeURIComponent(caption);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = (caption, hashtags) => {
    console.log("Attempting Twitter share for caption:", caption, "hashtags:", hashtags);
    const text = encodeURIComponent(`${caption} ${hashtags || ''}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // Helper function to get emotion text with Unicode emoji
  // This will be used to update the 'faceEmotion' state in App.js directly
  // so the emoji is part of the string.
  const getEmotionTextWithEmoji = (emotionText) => {
    const lowerCaseEmotion = emotionText.toLowerCase();
    if (lowerCaseEmotion.includes('happy')) return `Happy 😄`;
    if (lowerCaseEmotion.includes('sad')) return `Sad 😢`;
    if (lowerCaseEmotion.includes('angry')) return `Angry 😠`;
    if (lowerCaseEmotion.includes('neutral')) return `Neutral 😐`;
    if (lowerCaseEmotion.includes('surprised')) return `Surprised 😮`;
    if (lowerCaseEmotion.includes('disgusted')) return `Disgusted 🤢`;
    if (lowerCaseEmotion.includes('fearful')) return `Fearful 😨`;
    if (lowerCaseEmotion.includes('contempt')) return `Contempt 😒`;
    if (lowerCaseEmotion.includes('no faces detected')) return `No faces detected. 🚫`; // Using a block emoji
    return emotionText; // Fallback
  };


  return (
    <div className={styles.imageGallery}>
      <AnimatePresence>
        {images.map((img) => (
          <motion.div
            key={img.id}
            className={`${styles.imageCard} glass-effect`}
            variants={imageCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              onClick={() => onRemoveImage(img.id)}
              className={styles.removeButton}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiXCircle size={20} />
            </motion.button>

            <div className={styles.imagePreviewContainer}>
              <img src={img.previewUrl} alt={img.file.name} className={styles.imagePreview} />
              <p className={styles.imageFileName}>{img.file.name}</p>
            </div>

            {/* Unified Analysis Section for Style and Face/Emotion */}
            <div className={styles.analysisSection}>
                {img.loadingStyle ? (
                    <div className={styles.analysisLoading}>
                        <div className={styles.loadingSpinnerSmall}></div>
                        <p>Recognizing style...</p>
                    </div>
                ) : img.styleError ? (
                    <div className={styles.analysisError}>
                        <p>Style Error: {img.styleError}</p>
                        <motion.button
                            onClick={() => analyzeFaceAndEmotionForSingleImage(img.id, img.file)}
                            className={styles.retryAnalysisButton}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : img.recognizedStyle ? (
                    <div className={styles.analysisDisplay}>
                        <FiTag className={styles.analysisIcon} /> {/* Keep generic icon for display */}
                        <p>{img.recognizedStyle}</p>
                    </div>
                ) : null}

                {img.loadingFaceEmotion ? (
                    <div className={styles.analysisLoading}>
                        <div className={styles.loadingSpinnerSmall}></div>
                        <p>Analyzing faces...</p>
                    </div>
                ) : img.faceEmotionError ? (
                    <div className={styles.analysisError}>
                        <p>Face Error: {img.faceEmotionError}</p>
                        <motion.button
                            onClick={() => analyzeFaceAndEmotionForSingleImage(img.id, img.file)}
                            className={styles.retryAnalysisButton}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : img.faceEmotion && img.faceEmotion !== 'N/A' ? (
                    <div className={styles.analysisDisplay}>
                        <FiSmile className={styles.analysisIcon} /> {/* Keep generic icon for display */}
                        <p>{img.faceEmotion}</p> {/* Now img.faceEmotion contains the emoji */}
                    </div>
                ) : (
                    <div className={styles.analysisDisplay}>
                        <FiCameraOff className={styles.analysisIcon} /> {/* Keep generic icon for display */}
                        <p>No faces detected. 🚫</p> {/* Hardcoded emoji for no faces */}
                    </div>
                )}
            </div>

            {/* SEO Alt-text Section */}
            <div className={styles.altTextSection}>
                {img.loadingAltText ? (
                    <div className={styles.altTextLoading}>
                        <div className={styles.loadingSpinnerSmall}></div>
                        <p>Generating Alt-text...</p>
                    </div>
                ) : img.altTextError ? (
                    <div className={styles.altTextError}>
                        <p>Alt-text Error: {img.altTextError}</p>
                        <motion.button
                            onClick={() => handleGenerateAltTextForSingleImage(img.id, img.file)}
                            className={styles.retryAnalysisButton}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            Retry
                        </motion.button>
                    </div>
                ) : img.altText && img.altText !== 'N/A' ? (
                    <div className={styles.altTextDisplay}>
                        <FiFileText className={styles.analysisIcon} /> {/* Kept FiFileText */}
                        <p>{img.altText}</p>
                        <motion.button
                            onClick={() => onCopyCaption(img.id, img.altText)}
                            className={`${styles.copyButtonSmall} ${img.copiedAltText ? styles.copied : ''}`}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            {img.copiedAltText ? <FiCheckCircle /> : <FiCopy />}
                        </motion.button>
                    </div>
                ) : (
                    <motion.button
                        onClick={() => handleGenerateAltTextForSingleImage(img.id, img.file)}
                        className={styles.generateAltTextButton}
                        disabled={img.loadingAltText}
                        whileHover={buttonVariants.hover}
                        whileTap={buttonVariants.tap}
                    >
                        <FiFileText className={styles.generateAltTextButtonIcon} /> Generate Alt-text
                    </motion.button>
                )}
            </div>


            <div className={styles.captionArea}>
              {img.loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingSpinner}></div>
                  <p className={styles.loadingText}>Generating caption...</p>
                </div>
              ) : img.error ? (
                <div className={styles.errorState}>
                  <p className={styles.errorTitle}>Error!</p>
                  <p className={styles.errorMessage}>{img.error}</p>
                  <motion.button
                      onClick={() => onGenerateCaptionForImage(img.id, selectedStyle, includeHashtags)}
                      className={styles.retryButton}
                      whileHover={buttonVariants.hover}
                      whileTap={buttonVariants.tap}
                  >
                      Retry Caption
                  </motion.button>
                </div>
              ) : img.caption ? (
                <div className={styles.captionContent}>
                  {/* Display translated caption if available and selected, else original */}
                  {selectedTranslationLanguage && img.translatedCaptions?.[selectedTranslationLanguage] ? (
                    <>
                      <div className={styles.translatedCaptionHeader}>
                        <FiGlobe className={styles.translateIcon} /> {/* Kept FiGlobe */}
                        <p className={styles.translatedCaptionLang}>({selectedTranslationLanguage})</p>
                      </div>
                      <p className={styles.translatedCaptionText}>
                        <FiEdit className={styles.inlineIcon} /> {/* Icon for translated text */}
                        {img.translatedCaptions[selectedTranslationLanguage]}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={styles.captionText}>
                        <FiEdit className={styles.inlineIcon} /> {/* Icon for original caption */}
                        {img.caption}
                      </p>
                      {img.hashtags && <p className={styles.hashtagsText}><FiHash className={styles.inlineIcon} />{img.hashtags}</p>} {/* Icon for hashtags */}
                    </>
                  )}

                  <motion.button
                    className={`${styles.copyButton} ${img.copied ? styles.copied : ''}`}
                    onClick={() => onCopyCaption(img.id)}
                    whileHover={buttonVariants.hover}
                    whileTap={buttonVariants.tap}
                  >
                    {img.copied ? <FiCheckCircle className={styles.copyButtonIcon} /> : <FiCopy className={styles.copyButtonIcon} />}
                    {img.copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => onGenerateCaptionForImage(img.id, selectedStyle, includeHashtags)}
                  disabled={img.loading}
                  className={styles.generateButton}
                  whileHover={buttonVariants.hover}
                  whileTap={buttonVariants.tap}
                >
                  Generate Caption
                </motion.button>
              )}
            </div>

            {/* Individual Translate Button (only if original caption exists and no active translation for selected lang) */}
            {img.caption && selectedTranslationLanguage && !img.translatedCaptions?.[selectedTranslationLanguage] && (
                <div className={styles.translationActionArea}>
                    {img.loadingTranslation ? (
                        <div className={styles.translationLoading}>
                            <div className={styles.loadingSpinnerSmall}></div>
                            <p>Translating...</p>
                        </div>
                    ) : img.translationError ? (
                        <div className={styles.translationError}>
                            <p>Translation Error: {img.translationError}</p>
                            <motion.button
                                onClick={() => onTranslateCaption(img.id, img.caption, selectedTranslationLanguage)}
                                className={styles.retryButton}
                                whileHover={buttonVariants.hover}
                                whileTap={buttonVariants.tap}
                            >
                                Retry Translate
                            </motion.button>
                        </div>
                    ) : (
                        <motion.button
                            onClick={() => onTranslateCaption(img.id, img.caption, selectedTranslationLanguage)}
                            className={styles.translateButton}
                            disabled={!img.caption || img.loadingTranslation}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <FiGlobe className={styles.translateButtonIcon} /> Translate to {selectedTranslationLanguage}
                        </motion.button>
                    )}
                </div>
            )}

            {/* Share Buttons */}
            {(img.caption || img.altText) && (
                <div className={styles.shareButtonsContainer}>
                    <p className={styles.shareTitle}>Share:</p>
                    <motion.button
                        onClick={() => handleShareWhatsApp(selectedTranslationLanguage && img.translatedCaptions?.[selectedTranslationLanguage] ? img.translatedCaptions[selectedTranslationLanguage] : img.caption)}
                        className={`${styles.shareButton} ${styles.whatsappButton}`}
                        whileHover={buttonVariants.hover}
                        whileTap={buttonVariants.tap}
                        disabled={!img.caption && !img.translatedCaptions?.[selectedTranslationLanguage]}
                    >
                        <FiMessageCircle className={styles.shareButtonIcon} /> WhatsApp
                    </motion.button>
                    <motion.button
                        onClick={() => handleShareTwitter(selectedTranslationLanguage && img.translatedCaptions?.[selectedTranslationLanguage] ? img.translatedCaptions[selectedTranslationLanguage] : img.caption, img.hashtags)}
                        className={`${styles.shareButton} ${styles.twitterButton}`}
                        whileHover={buttonVariants.hover}
                        whileTap={buttonVariants.tap}
                        disabled={!img.caption && !img.translatedCaptions?.[selectedTranslationLanguage]}
                    >
                        <FiTwitter className={styles.shareButtonIcon} /> Twitter
                    </motion.button>
                </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
