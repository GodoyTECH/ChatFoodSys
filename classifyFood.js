/**
 * classifyFood.js
 * Usa @xenova/transformers pipeline para classificar imagens com modelo Food-101.
 * Retorna array de labels ordenados por confiança (strings legíveis).
 *
 * OBS: O modelo será baixado na primeira execução. Requer Node 18+.
 */
const fs = require('fs');
const sharp = require('sharp');
const { pipeline } = require('@xenova/transformers');

let classifier = null;

async function loadClassifier() {
  if (classifier) return classifier;
  // "Xenova/food101" é o identificador utilizado aqui; pode ser substituído por outro modelo público.
  classifier = await pipeline('image-classification', 'Xenova/food101');
  return classifier;
}

async function detectFood(imagePath) {
  try {
    await loadClassifier();

    // normaliza imagem com sharp
    const buffer = await sharp(imagePath)
      .resize(384, 384, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // chama o classifier (top_k = 5)
    const result = await classifier(buffer, { top_k: 5 });
    // result: array [{label, score}, ...]
    const labels = result.map(r => r.label.toLowerCase().replace(/_/g, ' '));
    return labels;
  } catch (err) {
    console.error('detectFood error:', err);
    return [];
  }
}

module.exports = { detectFood };
