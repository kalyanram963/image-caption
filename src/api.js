// src/api.js
import Resizer from 'react-image-file-resizer';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// Using gemini-2.0-flash for ALL API calls (vision and text)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Helper to convert File to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to resize image (same as in ImageUploader)
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

/**
 * Generates an image caption using the Gemini API.
 * @param {File} imageFile - The image file to caption.
 * @param {string} style - The desired caption style (e.g., "funny", "poetic").
 * @param {boolean} includeHashtags - Whether to include hashtags in the caption.
 * @returns {Promise<{caption: string, hashtags: string, error: string|null}>}
 */
export const generateImageCaption = async (imageFile, style, includeHashtags) => {
  if (!API_KEY) {
    return {
      caption: '',
      hashtags: '',
      error: 'API Key not set. Please set REACT_APP_GEMINI_API_KEY in your .env file.'
    };
  }

  try {
    const processedImageBlob = await resizeFile(imageFile);
    const base64Image = await fileToBase64(processedImageBlob);

    let prompt = `Generate a single, ${style} caption for this image. Do NOT provide multiple options or numbered lists. Just give me one caption.`;
    if (includeHashtags) {
      prompt += ` Also, suggest 5-10 relevant and trending hashtags.`;
    }

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: processedImageBlob.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      let errorMessage = `API request failed with status ${response.status}.`;
      if (errorData && errorData.error && errorData.error.message) {
        errorMessage += ` Details: ${errorData.error.message}`;
      }
      return { caption: '', hashtags: '', error: errorMessage };
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let caption = '';
    let hashtags = '';

    if (includeHashtags) {
      const hashtagRegex = /(#\w+\b(?:\s#\w+\b)*)$/m;
      const hashtagMatch = generatedText.match(hashtagRegex);

      if (hashtagMatch) {
        hashtags = hashtagMatch[0].trim();
        caption = generatedText.replace(hashtagRegex, '').trim();
      } else {
        caption = generatedText.trim();
      }
    } else {
      caption = generatedText.trim();
    }

    return { caption: caption, hashtags: hashtags, error: null };

  } catch (error) {
    console.error('Error generating caption:', error);
    return { caption: '', hashtags: '', error: `Failed to generate caption: ${error.message}` };
  }
};

/**
 * Recognizes the primary style/genre of an image using the Gemini API.
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<{style: string, error: string|null}>}
 */
export const recognizeImageStyle = async (imageFile) => {
  if (!API_KEY) {
    return { style: '', error: 'API Key not set for style recognition.' };
  }

  try {
    const processedImageBlob = await resizeFile(imageFile);
    const base64Image = await fileToBase64(processedImageBlob);

    const prompt = `Analyze this image and identify its primary style or genre. Choose only one from the following options: landscape, portrait, art (e.g., painting, drawing), selfie, abstract, macro, candid, cityscape, nature, architecture, food, fashion, sports, event, product. Provide ONLY the chosen style name, nothing else.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: processedImageBlob.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Style Recognition API Error Response:", errorData);
      return { style: '', error: `Style recognition failed: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const recognizedStyle = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleanStyle = recognizedStyle.toLowerCase().replace(/style:|genre:|this image is a |this is a |an |image|./g, '').trim();

    return { style: cleanStyle, error: null };

  } catch (error) {
    console.error('Error recognizing image style:', error);
    return { style: '', error: `Failed to recognize style: ${error.message}` };
  }
};

/**
 * Translates text to a target language using the Gemini API.
 * @param {string} text - The text to translate.
 * @param {string} targetLanguage - The target language (e.g., "Hindi", "Spanish").
 * @returns {Promise<{translatedText: string, error: string|null}>}
 */
export const translateText = async (text, targetLanguage) => {
  if (!API_KEY) {
    return { translatedText: '', error: 'API Key not set for translation.' };
  }
  if (!text) {
      return { translatedText: '', error: 'No text provided for translation.' };
  }

  const prompt = `Translate the following text into ${targetLanguage}. Provide ONLY the translated text, nothing else:\n\n"${text}"`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Translation API Error Response:", errorData);
      return { translatedText: '', error: `Translation failed: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { translatedText: translatedText.trim(), error: null };

  } catch (error) {
    console.error('Error translating text:', error);
    return { translatedText: '', error: `Failed to translate: ${error.message}` };
  }
};

/**
 * Analyzes an image for human faces and their apparent emotions using the Gemini API.
 * Provides a textual description.
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<{faceEmotion: string, error: string|null}>}
 */
export const analyzeFaceAndEmotion = async (imageFile) => {
  if (!API_KEY) {
    return { faceEmotion: '', error: 'API Key not set for face/emotion analysis.' };
  }

  try {
    const processedImageBlob = await resizeFile(imageFile);
    const base64Image = await fileToBase64(processedImageBlob);

    // Prompt engineered to get a descriptive text output
    const prompt = `Analyze this image for human faces. If faces are present, describe their approximate number and their most prominent emotions (e.g., happy, sad, neutral, surprised, angry, confused, disgusted, fearful). If no faces are clearly visible, state 'No faces detected.' Be concise and provide only the description.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: processedImageBlob.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Face/Emotion Analysis API Error Response:", errorData);
      return { faceEmotion: '', error: `Face/Emotion analysis failed: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { faceEmotion: generatedText.trim(), error: null };

  } catch (error) {
    console.error('Error analyzing face/emotion:', error);
    return { faceEmotion: '', error: `Failed to analyze face/emotion: ${error.message}` };
  }
};

/**
 * Generates SEO-optimized alt-text for an image using the Gemini API.
 * @param {File} imageFile - The image file to generate alt-text for.
 * @returns {Promise<{altText: string, error: string|null}>}
 */
export const generateSeoAltText = async (imageFile) => {
  if (!API_KEY) {
    return { altText: '', error: 'API Key not set for SEO alt-text generation.' };
  }

  try {
    const processedImageBlob = await resizeFile(imageFile);
    const base64Image = await fileToBase64(processedImageBlob);

    // Prompt engineered for SEO-optimized alt-text
    const prompt = `Generate a concise, descriptive, and SEO-optimized alt-text (alternative text) for this image. Focus on relevant keywords and describe the image content accurately for accessibility and search engines. Provide ONLY the alt-text, nothing else. Max 125 characters.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: processedImageBlob.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("SEO Alt-text API Error Response:", errorData);
      return { altText: '', error: `SEO alt-text generation failed: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Ensure alt-text is concise and trim any excess
    const cleanAltText = generatedText.trim().substring(0, 125);

    return { altText: cleanAltText, error: null };

  } catch (error) {
    console.error('Error generating SEO alt-text:', error);
    return { altText: '', error: `Failed to generate SEO alt-text: ${error.message}` };
  }
};
