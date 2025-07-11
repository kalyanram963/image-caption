// src/components/CaptionOptions.js (example)
import React from 'react';

const CaptionOptions = ({ selectedStyle, onStyleChange, generateHashtags, onToggleHashtags }) => {
  return (
    <div className={styles.optionsContainer}>
      <label htmlFor="captionStyle">Caption Style:</label>
      <select
        id="captionStyle"
        value={selectedStyle}
        onChange={(e) => onStyleChange(e.target.value)}
        className={styles.selectInput}
      >
        <option value="detailed and creative">Detailed & Creative</option>
        <option value="short and punchy">Short & Punchy</option>
        <option value="funny">Funny</option>
        <option value="inspirational">Inspirational</option>
        <option value="professional">Professional</option>
        <option value="poetic">Poetic</option>
      </select>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={generateHashtags}
          onChange={onToggleHashtags}
        />
        Include Hashtags
      </label>
    </div>
  );
};

export default CaptionOptions;

// In your App.js:
// ... (imports)
import CaptionOptions from './components/CaptionOptions';

function App() {
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('detailed and creative');
  const [generateHashtags, setGenerateHashtags] = useState(false);
  const [hashtags, setHashtags] = useState('');

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaption('');
    setHashtags('');
    setError(null);
  };

  const handleGenerateCaption = async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setCaption('');
    setHashtags('');

    const { caption: generatedCaption, hashtags: generatedHashtags, error: apiError } = await generateImageCaption(
      imageFile,
      selectedStyle,
      generateHashtags
    ); // <-- Update API call to pass options

    setLoading(false);
    if (apiError) {
      setError(apiError);
    } else {
      setCaption(generatedCaption || 'No caption generated.');
      setHashtags(generatedHashtags || '');
    }
  };

  return (
    <div className={styles.container}>
      {/* ... existing header ... */}
      <div className={styles.contentArea}>
        <ImageUploader onImageSelect={handleImageSelect} previewUrl={previewUrl} />

        <CaptionOptions
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          generateHashtags={generateHashtags}
          onToggleHashtags={() => setGenerateHashtags(!generateHashtags)}
        />

        <button onClick={handleGenerateCaption} disabled={!imageFile || loading} className={styles.generateButton}>
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>

        {/* ... existing error/caption display ... */}
        {caption && (
          <div className={styles.captionDisplay}>
            <p className={styles.captionText}>{caption}</p>
            {hashtags && <p className={styles.hashtagsText}>{hashtags}</p>}
            <button
              className={styles.copyButton}
              onClick={() => {
                navigator.clipboard.writeText(`${caption}\n${hashtags}`);
                alert('Caption and hashtags copied!');
              }}
            >
              <FiCopy /> Copy All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// And then update your generateImageCaption in src/api.js to accept these:
// src/api.js
export const generateImageCaption = async (imageFile, style = "detailed and creative", includeHashtags = false) => {
  // ... existing code

  try {
    const base64Image = await fileToBase64(imageFile);

    let promptText = `Generate a ${style} caption for this image. Focus on key objects, colors, actions, and mood. Make it engaging and suitable for social media, around 20-30 words.`;

    if (includeHashtags) {
      promptText += "\nAlso, suggest 5-10 highly relevant and popular hashtags for this image. List them clearly with # symbols.";
    }

    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    let fullText = response.text();
    let caption = fullText;
    let hashtags = '';

    // Simple parsing for hashtags
    if (includeHashtags) {
      const hashtagRegex = /(#\w+)/g;
      const foundHashtags = fullText.match(hashtagRegex);
      if (foundHashtags) {
        hashtags = foundHashtags.join(' ');
        caption = fullText.replace(hashtags, '').trim(); // Remove hashtags from caption
      }
    }

    return { caption, hashtags }; // Return both
  } catch (error) {
    // ... existing error handling
  }
};