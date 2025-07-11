// src/components/CameraCapture.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiVideoOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import styles from './CameraCapture.module.css';

const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [captureConfirmed, setCaptureConfirmed] = useState(false);
  const [cameraError, setCameraError] = useState(null); // New state for camera errors

  const getMediaStream = useCallback(async () => {
    setCameraError(null); // Clear previous errors
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
      setIsCameraActive(true); // Set active only if stream is successfully obtained
    } catch (err) {
      console.error("Error accessing camera:", err);
      // More specific error messages for the user
      let errorMessage = "Could not access camera. ";
      if (err.name === "NotAllowedError") {
        errorMessage += "Permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += `Details: ${err.message}`;
      }
      setCameraError(errorMessage);
      setStream(null);
      setIsCameraActive(false);
    }
  }, [facingMode]);

  const stopMediaStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    // This useEffect ensures the stream is managed based on isCameraActive state
    if (isCameraActive && !stream) { // If camera is supposed to be active but no stream
      getMediaStream();
    } else if (!isCameraActive && stream) { // If camera is not supposed to be active but stream exists
      stopMediaStream();
    }

    return () => {
      stopMediaStream();
    };
  }, [isCameraActive, stream, getMediaStream, stopMediaStream]);

  // This useEffect ensures stream is re-obtained when facingMode changes (only if camera is active)
  useEffect(() => {
    if (isCameraActive) { // Only re-get stream if camera is already active
      stopMediaStream(); // Stop current stream before getting new one
      getMediaStream();
    }
  }, [facingMode]); // Dependency on facingMode

  const handleStartCamera = () => {
    setIsCameraActive(true);
    setCapturedBlob(null);
    setCaptureConfirmed(false);
    setCameraError(null); // Clear error on start attempt
  };

  const handleStopCamera = () => {
    setIsCameraActive(false);
    setCapturedBlob(null);
    setCameraError(null); // Clear error on stop
  };

  const handleCapture = async () => {
    if (!stream || !videoRef.current || !canvasRef.current) {
        setCameraError("Camera not ready for capture.");
        return;
    }

    stopMediaStream(); // Stop the live stream after capturing

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ensure canvas dimensions match video dimensions for proper capture
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
      setCaptureConfirmed(true);
      setTimeout(() => setCaptureConfirmed(false), 1500);
    }, 'image/webp', 0.9);
  };

  const handleUseCapturedImage = () => {
    if (capturedBlob) {
      const fileName = `snapshot_${Date.now()}.webp`;
      const capturedFile = new File([capturedBlob], fileName, { type: 'image/webp' });
      onCapture([capturedFile]);
      setCapturedBlob(null);
      setCameraError(null); // Clear error after successful use
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCameraError(null); // Clear error on retake
    handleStartCamera(); // Restart camera
  };

  const toggleFacingMode = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      className={`${styles.cameraContainer} glass-effect`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.videoWrapper}>
        {!isCameraActive && !capturedBlob && (
          <div className={styles.noCamera}>
            <FiVideoOff className={styles.cameraIconPlaceholder} />
            <p>Camera not active</p>
            {cameraError && <p className={styles.cameraErrorMessage}>{cameraError}</p>} {/* Display camera error */}
          </div>
        )}
        {isCameraActive && !capturedBlob && (
            <video ref={videoRef} autoPlay playsInline className={styles.videoElement}></video>
        )}
        {capturedBlob && (
            <img src={URL.createObjectURL(capturedBlob)} alt="Captured" className={styles.videoElement} />
        )}

        <AnimatePresence>
          {captureConfirmed && (
            <motion.div
              className={`${styles.captureConfirmation} ${styles.show}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiCheckCircle className={styles.confirmationIcon} />
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className={styles.hiddenCanvas}></canvas>
      </div>

      <div className={styles.controls}>
        {!isCameraActive && !capturedBlob && (
          <motion.button
            onClick={handleStartCamera}
            className={styles.controlButton}
            whileHover={buttonVariants.hover}
            whileTap={buttonVariants.tap}
          >
            <FiCamera className={styles.controlButtonIcon} /> Start Camera
          </motion.button>
        )}

        {isCameraActive && (
          <>
            <motion.button
              onClick={handleCapture}
              className={styles.controlButton}
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <FiCamera className={styles.controlButtonIcon} /> Take Photo
            </motion.button>
            <motion.button
              onClick={toggleFacingMode}
              className={styles.controlButton}
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <FiRefreshCw className={styles.controlButtonIcon} /> Switch Camera
            </motion.button>
             <motion.button
              onClick={handleStopCamera}
              className={styles.controlButton}
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <FiVideoOff className={styles.controlButtonIcon} /> Stop Camera
            </motion.button>
          </>
        )}

        {capturedBlob && (
          <>
            <motion.button
              onClick={handleUseCapturedImage}
              className={`${styles.controlButton} ${styles.useButton}`}
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <FiCheckCircle className={styles.controlButtonIcon} /> Use Photo
            </motion.button>
            <motion.button
              onClick={handleRetake}
              className={`${styles.controlButton} ${styles.retakeButton}`}
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <FiRefreshCw className={styles.controlButtonIcon} /> Retake
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CameraCapture;
