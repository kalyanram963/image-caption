// src/App.js
/* global THREE */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploader from './components/ImageUploader';
import ImageGallery from './components/ImageGallery';
import CameraCapture from './components/CameraCapture';
import {
  generateImageCaption,
  recognizeImageStyle,
  translateText,
  analyzeFaceAndEmotion,
  generateSeoAltText
} from './api';
import { FiSun, FiMoon, FiCamera, FiFolder, FiImage, FiGlobe, FiDownload, FiInfo, FiAlertCircle, FiCheckCircle, FiCopy } from 'react-icons/fi'; // FiCopy is used by ImageGallery for copy buttons
import jsPDF from 'jspdf';
import './index.css'; // Import global CSS
import styles from './components/ImageGallery.module.css'; // Import styles for global modal

// Ensure Three.js is loaded globally. For Canvas environment, it's typically available
// or loaded via a <script> tag in public/index.html.
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

function App() {
  const [images, setImages] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [errorAll, setErrorAll] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [selectedStyle, setSelectedStyle] = useState('detailed and creative');
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [viewMode, setViewMode] = useState('upload');
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState('');
  const [globalMessage, setGlobalMessage] = useState(null); // State for global message/modal

  const mountRef = useRef(null);

  // --- Three.js Background Animation Setup ---
  useEffect(() => {
    let scene, camera, renderer, particles, particleMaterial, lines, lineMaterial;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const init = () => {
      if (!mountRef.current) return;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 100;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);

      const particleCount = 500;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      const color1 = new THREE.Color(0x7B68EE);
      const color2 = new THREE.Color(0xA080FF);

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * 400 - 200;
        const y = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;
        positions.push(x, y, z);

        const color = new THREE.Color().lerpColors(color1, color2, Math.random());
        colors.push(color.r, color.g, color.b);
      }

      particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      particleMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8
      });
      particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      const lineGeometry = new THREE.BufferGeometry();
      const linePositions = [];
      const lineColors = [];
      const maxDistance = 50;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          const p2 = new THREE.Vector3(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
          if (p1.distanceTo(p2) < maxDistance) {
            linePositions.push(p1.x, p1.y, p1.z);
            linePositions.push(p2.x, p2.y, p2.z);
            lineColors.push(color1.r, color1.g, color1.b, color2.r, color2.g, color2.b);
          }
        }
      }
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
      lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.1
      });
      lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lines);

      document.addEventListener('mousemove', onDocumentMouseMove);
      window.addEventListener('resize', onWindowResize);
    };

    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };

    const onWindowResize = () => {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      requestAnimationFrame(animate);

      particles.rotation.y += 0.0005;
      lines.rotation.y += 0.0005;

      camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    if (typeof THREE === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        init();
        animate();
      };
      document.head.appendChild(script);
    } else {
      init();
      animate();
    }

    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
        if (particles) particles.geometry.dispose();
        if (lines) lines.geometry.dispose();
        if (particleMaterial) particleMaterial.dispose();
        if (lineMaterial) lineMaterial.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const recognizeStyleForSingleImage = useCallback(async (id, file) => {
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, loadingStyle: true, styleError: null, recognizedStyle: '' } : img
      )
    );

    try {
      const { style: recognizedStyle, error: styleApiError } = await recognizeImageStyle(file);

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? {
                ...img,
                loadingStyle: false,
                recognizedStyle: recognizedStyle || 'N/A',
                styleError: styleApiError || null,
              }
            : img
        )
      );
    } catch (err) {
      console.error("Error recognizing style for image:", id, err);
      setImages(prevImages =>
        prevImages.map(img => (img.id === id ? { ...img, loadingStyle: false, styleError: "Failed to recognize style." } : img))
      );
    }
  }, []);

  const analyzeFaceAndEmotionForSingleImage = useCallback(async (id, file) => {
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, loadingFaceEmotion: true, faceEmotionError: null, faceEmotion: '' } : img
      )
    );

    try {
      const { faceEmotion: detectedFaceEmotion, error: faceEmotionApiError } = await analyzeFaceAndEmotion(file);

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? {
                ...img,
                loadingFaceEmotion: false,
                faceEmotion: detectedFaceEmotion || 'N/A',
                faceEmotionError: faceEmotionApiError || null,
              }
            : img
        )
      );
    } catch (err) {
      console.error("Error analyzing face/emotion for image:", id, err);
      setImages(prevImages =>
        prevImages.map(img => (img.id === id ? { ...img, loadingFaceEmotion: false, faceEmotionError: "Failed to analyze face/emotion." } : img))
      );
    }
  }, []);

  const handleGenerateAltTextForSingleImage = useCallback(async (id, file) => {
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, loadingAltText: true, altTextError: null, altText: '' } : img
      )
    );

    try {
      const { altText: generatedAltText, error: altTextApiError } = await generateSeoAltText(file);

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? {
                ...img,
                loadingAltText: false,
                altText: generatedAltText || 'N/A',
                altTextError: altTextApiError || null,
              }
            : img
        )
      );
    } catch (err) {
      console.error("Error generating alt-text for image:", id, err);
      setImages(prevImages =>
        prevImages.map(img => (img.id === id ? { ...img, loadingAltText: false, altTextError: "Failed to generate alt-text." } : img))
      );
    }
  }, []);


  const handleImagesUpload = useCallback((uploadedFiles) => {
    const newImages = uploadedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      hashtags: '',
      loading: false,
      error: null,
      copied: false,
      copiedAltText: false,
      recognizedStyle: '',
      loadingStyle: false,
      styleError: null,
      faceEmotion: '',
      loadingFaceEmotion: false,
      faceEmotionError: null,
      altText: '',
      loadingAltText: false,
      altTextError: null,
      translatedCaptions: {},
      loadingTranslation: false,
      translationError: null,
    }));
    setImages(prevImages => [...prevImages, ...newImages]);
    setErrorAll(null);

    newImages.forEach(img => {
      recognizeStyleForSingleImage(img.id, img.file);
      analyzeFaceAndEmotionForSingleImage(img.id, img.file);
    });
  }, [recognizeStyleForSingleImage, analyzeFaceAndEmotionForSingleImage]);

  const handleRemoveImage = useCallback((idToRemove) => {
    setImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === idToRemove);
      if (imageToRemove && imageToRemove.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prevImages.filter(img => img.id !== idToRemove);
    });
  }, []);

  const generateCaptionForSingleImage = useCallback(async (id, style, includeHash) => {
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, loading: true, error: null, caption: '', hashtags: '', copied: false } : img
      )
    );

    const imageToCaption = images.find(img => img.id === id);
    if (!imageToCaption) return;

    try {
      const { caption: generatedCaption, hashtags: generatedHashtags, error: apiError } = await generateImageCaption(
        imageToCaption.file,
        style,
        includeHash
      );

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? {
                ...img,
                loading: false,
                caption: generatedCaption || '',
                hashtags: generatedHashtags || '',
                error: apiError || null,
                translatedCaptions: {},
                loadingTranslation: false,
                translationError: null,
              }
            : img
        )
      );
    } catch (err) {
      console.error("Error generating caption for image:", id, err);
      setImages(prevImages =>
        prevImages.map(img => (img.id === id ? { ...img, loading: false, error: "Failed to generate caption." } : img))
      );
    }
  }, [images]);

  const handleGenerateAllCaptions = async () => {
    if (images.length === 0) {
      setErrorAll("Please upload or capture images first!");
      return;
    }

    setLoadingAll(true);
    setErrorAll(null);

    const generationPromises = images.map(async (img) => {
        if (!img.loading && !img.caption && !img.error) {
            return generateCaptionForSingleImage(img.id, selectedStyle, includeHashtags);
        }
        return Promise.resolve();
    });

    await Promise.allSettled(generationPromises);

    setLoadingAll(false);
  };

  // MODIFIED: handleCopyCaption to accept optional specific text
  const handleCopyCaption = useCallback((idToCopy, specificText = null) => {
    const image = images.find(img => img.id === idToCopy);
    if (!image) return;

    let textToCopy = '';
    let isAltTextCopy = false;

    if (specificText !== null) { // If specific text is provided, use it
        textToCopy = specificText;
        isAltTextCopy = true;
    } else { // Otherwise, default to caption logic
        textToCopy = selectedTranslationLanguage && image.translatedCaptions?.[selectedTranslationLanguage]
            ? image.translatedCaptions[selectedTranslationLanguage]
            : image.caption + (image.hashtags ? `\n${image.hashtags}` : '');
    }

    if (!textToCopy) return; // Don't try to copy empty string

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);

    // Update the correct 'copied' state
    setImages(prevImages =>
      prevImages.map(img => {
        if (img.id === idToCopy) {
          return {
            ...img,
            copied: isAltTextCopy ? img.copied : true, // Only update 'copied' for caption
            copiedAltText: isAltTextCopy ? true : img.copiedAltText, // Only update 'copiedAltText' for alt-text
          };
        }
        return img;
      })
    );

    setTimeout(() => {
      setImages(prevImages =>
        prevImages.map(img => {
          if (img.id === idToCopy) {
            return {
              ...img,
              copied: isAltTextCopy ? img.copied : false,
              copiedAltText: isAltTextCopy ? false : img.copiedAltText,
            };
          }
          return img;
        })
      );
    }, 2000);
  }, [images, selectedTranslationLanguage]);


  const handleTranslateCaption = useCallback(async (id, originalCaption, targetLang) => {
    setImages(prevImages =>
      prevImages.map(img =>
        img.id === id ? { ...img, loadingTranslation: true, translationError: null } : img
      )
    );

    try {
      const { translatedText, error } = await translateText(originalCaption, targetLang);

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id
            ? {
                ...img,
                loadingTranslation: false,
                translationError: error,
                translatedCaptions: {
                  ...(img.translatedCaptions || {}),
                  [targetLang]: translatedText,
                },
              }
            : img
        )
      );
    } catch (err) {
      console.error("Error translating caption:", id, err);
      setImages(prevImages =>
        prevImages.map(img => (img.id === id ? { ...img, loadingTranslation: false, translationError: "Failed to translate." } : img))
      );
    }
  }, []);

  // Handle PDF Download
  const handleDownloadPdf = () => {
    if (images.length === 0) {
      setGlobalMessage({
        title: "No Content to Download",
        message: "Please generate captions or other content first!",
        type: "error"
      });
      return;
    }

    const doc = new jsPDF();
    let y = 10; // Initial Y position
    const lineHeight = 10;
    const margin = 10;
    const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;

    doc.setFontSize(18);
    doc.text("AI Image Captions Sheet", margin, y);
    y += lineHeight * 2;

    doc.setFontSize(12);

    images.forEach((img, index) => {
      // Check if enough space for next image + caption
      if (y + lineHeight * 5 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = 10; // Reset Y for new page
      }

      doc.setFontSize(14);
      doc.text(`Image ${index + 1}: ${img.file.name}`, margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50); // Darker text for content

      // Caption (original or translated)
      let captionText = img.caption || 'No caption generated.';
      if (selectedTranslationLanguage && img.translatedCaptions?.[selectedTranslationLanguage]) {
        captionText = `[${selectedTranslationLanguage}] ${img.translatedCaptions[selectedTranslationLanguage]}`;
      }

      const splitCaption = doc.splitTextToSize(`Caption: ${captionText}`, maxWidth);
      doc.text(splitCaption, margin, y);
      y += (splitCaption.length * lineHeight * 0.8); // Adjust line height for wrapped text

      // Hashtags
      if (img.hashtags) {
        const splitHashtags = doc.splitTextToSize(`Hashtags: ${img.hashtags}`, maxWidth);
        doc.text(splitHashtags, margin, y);
        y += (splitHashtags.length * lineHeight * 0.8);
      }

      // Image Style
      if (img.recognizedStyle) {
        const splitStyle = doc.splitTextToSize(`Style: ${img.recognizedStyle}`, maxWidth);
        doc.text(splitStyle, margin, y);
        y += (splitStyle.length * lineHeight * 0.8);
      }

      // Face/Emotion
      if (img.faceEmotion && img.faceEmotion !== 'N/A') {
        const splitFaceEmotion = doc.splitTextToSize(`Faces: ${img.faceEmotion}`, maxWidth);
        doc.text(splitFaceEmotion, margin, y);
        y += (splitFaceEmotion.length * lineHeight * 0.8);
      }

      // Alt-text to PDF generation
      if (img.altText && img.altText !== 'N/A') {
        const splitAltText = doc.splitTextToSize(`Alt-text: ${img.altText}`, maxWidth);
        doc.text(splitAltText, margin, y);
        y += (splitAltText.length * lineHeight * 0.8);
      }

      y += lineHeight; // Extra space between images
      doc.setTextColor(0, 0, 0); // Reset text color
    });

    doc.save('image_captions_sheet.pdf');
  };


  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring", stiffness: 100 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  // Icon mapping for global message types
  const getMessageIcon = (type) => {
    switch (type) {
      case 'info': return <FiInfo />;
      case 'success': return <FiCheckCircle />;
      case 'error': return <FiAlertCircle />;
      default: return <FiInfo />;
    }
  };

  // Color mapping for global message types
  const getMessageColorClass = (type) => {
    switch (type) {
      case 'info': return styles.infoMessage;
      case 'success': return styles.successMessage;
      case 'error': return styles.errorMessage;
      default: return styles.infoMessage;
    }
  };


  return (
    <div className="app-container">
      {/* Three.js Canvas Mount Point */}
      <div ref={mountRef} className="three-canvas-container"></div>

      <motion.header
        className="app-header glass-effect"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="app-title">AI Image Captioner</h1>
        <motion.button
          onClick={toggleDarkMode}
          className="theme-toggle-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
        </motion.button>
      </motion.header>

      <main className="main-content">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle glass-effect">
            <motion.button
                className={`tab-button ${viewMode === 'upload' ? 'active' : ''}`}
                onClick={() => setViewMode('upload')}
                whileHover={buttonVariants.hover}
                whileTap={buttonVariants.tap}
            >
                <FiFolder className="tab-icon" /> Upload Images
            </motion.button>
            <motion.button
                className={`tab-button ${viewMode === 'camera' ? 'active' : ''}`}
                onClick={() => setViewMode('camera')}
                whileHover={buttonVariants.hover}
                whileTap={buttonVariants.tap}
            >
                <FiCamera className="tab-icon" /> Take Snapshot
            </motion.button>
        </div>


        <AnimatePresence mode="wait">
          {viewMode === 'upload' && (
            <motion.div
              key="uploader-view"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="component-view"
            >
              <ImageUploader onImagesUpload={handleImagesUpload} />
            </motion.div>
          )}

          {viewMode === 'camera' && (
            <motion.div
              key="camera-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="component-view"
            >
              <CameraCapture onCapture={handleImagesUpload} />
            </motion.div>
          )}
        </AnimatePresence>


        {/* Caption Options Section (applies to all images for bulk) */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="caption-options-container glass-effect"
            >
              <div className="option-group">
                <label htmlFor="captionStyle" className="option-label">Caption Style:</label>
                <select
                  id="captionStyle"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="option-select"
                >
                  <option value="detailed and creative">Detailed & Creative</option>
                  <option value="short and punchy">Short & Punchy</option>
                  <option value="funny">Funny 😄</option>
                  <option value="poetic">Poetic ✍️</option>
                  <option value="professional">Professional 💼</option>
                  <option value="sarcastic">Sarcastic 😈</option>
                  <option value="inspirational">Inspirational ✨</option>
                  <option value="witty">Witty 😉</option>
                  <option value="informational">Informational ℹ️</option>
                  <option value="minimalist">Minimalist 🖼️</option>
                </select>
              </div>

              <div className="option-group checkbox-group">
                <input
                  type="checkbox"
                  id="includeHashtags"
                  checked={includeHashtags}
                  onChange={() => setIncludeHashtags(!includeHashtags)}
                  className="option-checkbox"
                />
                <label htmlFor="includeHashtags" className="option-label">Include Hashtags</label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation Options Section */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="translation-options-container glass-effect"
            >
              <div className="option-group">
                <label htmlFor="translationLang" className="option-label"><FiGlobe className="option-icon" /> Translate To:</label>
                <select
                  id="translationLang"
                  value={selectedTranslationLanguage}
                  onChange={(e) => setSelectedTranslationLanguage(e.target.value)}
                  className="option-select"
                >
                  <option value="">No Translation</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                </select>
              </div>
              <motion.button
                onClick={() => {
                  if (selectedTranslationLanguage) {
                    images.forEach(img => {
                      if (img.caption && !img.loadingTranslation && !img.translationError) {
                        handleTranslateCaption(img.id, img.caption, selectedTranslationLanguage);
                      }
                    });
                  } else {
                      setGlobalMessage({
                        title: "Translation Error",
                        message: "Please select a target language for translation.",
                        type: "error"
                      });
                  }
                }}
                disabled={!selectedTranslationLanguage || images.every(img => !img.caption || img.loadingTranslation)}
                className={`btn ${!selectedTranslationLanguage || images.every(img => !img.caption || img.loadingTranslation) ? 'disabled' : ''}`}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Translate All Captions
                <FiGlobe className="btn-icon-right" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Bulk Generate Button */}
        <AnimatePresence mode="wait">
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="generate-button-wrapper"
            >
              <motion.button
                onClick={handleGenerateAllCaptions}
                disabled={loadingAll || images.every(img => img.loading || img.caption || img.error)}
                className={`btn ${loadingAll ? 'disabled' : 'btn-pulse'}`}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {loadingAll ? (
                  <>
                    <motion.span
                      className="loading-spinner-small"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    ></motion.span>
                    Generating All...
                  </>
                ) : (
                  <>
                    Generate All Captions <span role="img" aria-label="sparkles" className="btn-icon-right">✨</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download PDF Button */}
        <AnimatePresence>
          {images.length > 0 && (images.some(img => img.caption || img.altText || img.recognizedStyle || img.faceEmotion)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="download-button-wrapper"
            >
              <motion.button
                onClick={handleDownloadPdf}
                className="btn"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Download Full Caption Sheet PDF <FiDownload className="btn-icon-right" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Overall Error Display (e.g., API key issue) */}
        <AnimatePresence>
          {errorAll && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="error-message-bar glass-effect"
            >
              <p>{errorAll}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Global Message/Modal */}
        <AnimatePresence>
          {globalMessage && (
            <motion.div
              className={styles.globalMessageModal}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`${styles.globalMessageContent} ${getMessageColorClass(globalMessage.type)}`}>
                <div className={styles.globalMessageHeader}>
                    {getMessageIcon(globalMessage.type)}
                    <h2>{globalMessage.title}</h2>
                </div>
                <p>{globalMessage.message}</p>
                {globalMessage.textToCopy && (
                  <div className={styles.textToCopyContainer}>
                    <textarea
                      readOnly
                      value={globalMessage.textToCopy}
                      className={styles.textToCopyArea}
                      onClick={(e) => e.target.select()} // Select all on click
                    />
                    {/* Removed the programmatic copy button from here as it's unreliable in iframe */}
                  </div>
                )}
                <motion.button
                  onClick={() => setGlobalMessage(null)}
                  className={styles.globalMessageOkButton}
                  whileHover={buttonVariants.hover}
                  whileTap={buttonVariants.tap}
                >
                  OK
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Image Gallery - MOVED INSIDE MAIN CONTENT AND CENTERED */}
        {images.length > 0 && (
          <motion.div
            key="image-gallery-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="image-gallery-wrapper"
          >
            <ImageGallery
              images={images}
              onRemoveImage={handleRemoveImage}
              onGenerateCaptionForImage={generateCaptionForSingleImage}
              selectedStyle={selectedStyle}
              includeHashtags={includeHashtags}
              onCopyCaption={handleCopyCaption}
              onTranslateCaption={handleTranslateCaption}
              selectedTranslationLanguage={selectedTranslationLanguage}
              analyzeFaceAndEmotionForSingleImage={analyzeFaceAndEmotionForSingleImage}
              handleGenerateAltTextForSingleImage={handleGenerateAltTextForSingleImage}
              setGlobalMessage={setGlobalMessage} // Pass the global message setter
            />
          </motion.div>
        )}
      </main>

      <footer className="app-footer">
        {/* Removed text content from footer */}
      </footer>
    </div>
  );
}

export default App;
