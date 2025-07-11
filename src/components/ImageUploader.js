// src/components/ImageUploader.js
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload } from 'react-icons/fi';
import Resizer from 'react-image-file-resizer';
import styles from './ImageUploader.module.css';

const ImageUploader = ({ onImagesUpload }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const resizeFile = (file) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        1200, // Max width
        1200, // Max height
        'WEBP', // Compress format
        80, // Quality
        0, // Rotation
        (uri) => {
          resolve(uri);
        },
        'blob' // Output type
      );
    });

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    const processedImages = [];
    setIsResizing(true);

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }
      try {
        const resizedFileBlob = await resizeFile(file);
        const resizedFile = new File([resizedFileBlob], file.name, {
          type: resizedFileBlob.type,
        });
        processedImages.push(resizedFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    setIsResizing(false);
    if (processedImages.length > 0) {
      onImagesUpload(processedImages);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className={`${styles.imageUploader} ${dragActive ? styles.dragActive : ''} glass-effect`} // Added glass-effect class
      onClick={() => fileInputRef.current.click()}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className={styles.hiddenInput}
        accept="image/*"
        multiple
      />
      <div className={styles.contentContainer}>
        {isResizing ? (
          <div className={styles.resizingLoader}>
            <div className={styles.spinner}></div>
            <p>Processing images...</p>
          </div>
        ) : (
          <>
            <FiUpload className={styles.uploadIcon} />
            <p className={styles.title}>Drag & Drop images here</p>
            <p className={styles.subtitle}>or click to browse</p>
            <p className={styles.formats}>(Supported formats: JPG, PNG, WEBP)</p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ImageUploader;
