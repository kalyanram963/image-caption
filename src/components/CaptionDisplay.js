import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiCheckCircle, FiImage } from 'react-icons/fi';
import styles from './CaptionDisplay.module.css'; // Import CSS Module

const CaptionDisplay = ({ caption, loading, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } },
  };

  return (
    <motion.div
      className={styles.captionDisplay}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {loading && (
        <div className={styles.loadingState}>
          <motion.div
            className={styles.loadingSpinner}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <p className={styles.loadingText}>Generating caption...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>Oops! Something went wrong.</p>
          <p className={styles.errorMessage}>{error}</p>
          <span role="img" aria-label="sad-face" className={styles.emoji}>😔</span>
        </div>
      )}

      {!loading && !error && caption && (
        <motion.div className={styles.captionContent} variants={textVariants}>
          <p className={styles.captionText}>{caption}</p>
          <motion.button
            onClick={handleCopyClick}
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? (
              <>
                <FiCheckCircle className={styles.copyButtonIcon} size={20} /> Copied!
              </>
            ) : (
              <>
                <FiCopy className={styles.copyButtonIcon} size={20} /> Copy Caption
              </>
            )}
            <span role="img" aria-label="sparkles" className={styles.emoji}>✨</span>
          </motion.button>
        </motion.div>
      )}

      {!loading && !error && !caption && (
        <div className={styles.placeholder}>
          <FiImage className={styles.placeholderIcon} />
          <p className={styles.title}>Your caption will appear here</p>
          <span role="img" aria-label="point-up" className={styles.emoji}>👆</span>
        </div>
      )}
    </motion.div>
  );
};

export default CaptionDisplay;