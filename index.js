const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const GEMINI_API_KEY = 'AQ.Ab8RN6Kv7QTlOb8Eep9STJKTP5eKlGgcIdQ-PJtB3BwPytsSzQ';

app.post('/generate', async (req, res) => {
  try {
    const { imageBase64, mimeType, style } = req.body;

    const prompt = `Apply a "${style}" makeup look to the face in this photo. Keep the exact same face, identity, facial features, face shape, eyes, nose, and background unchanged. Only add realistic makeup: foundation, eyeshadow, eyeliner, mascara, eyebrows, blush, highlighter, and lipstick appropriate for "${style}" style. Return only the edited photo.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } }
            ]
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      const textPart = parts.find(p => p.text);
      return res.status(400).json({ 
        error: textPart ? `الموديل رد بنص: ${textPart.text.slice(0,200)}` : 'لم يتم إرجاع صورة'
      });
    }

    res.json({
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mime_type
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('لمسة شغّالة على المنفذ 3000'));
