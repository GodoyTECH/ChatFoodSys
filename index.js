/**
 * index.js
 * Servidor Express que recebe webhook do WhatsApp, baixa imagem, classifica com classifyFood.js,
 * consulta USDA via nutrition.js e responde ao usuário.
 *
 * IMPORTANTE: preencha as variáveis de ambiente (veja .env.example)
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { detectFood } = require('./classifyFood');
const { getNutritionByQuery } = require('./nutrition');

const app = express();
app.use(express.json({ limit: '50mb' }));

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.get('/', (req, res) => res.send('WhatsApp FoodBot - online'));

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// Webhook receiver
app.post('/webhook', async (req, res) => {
  try {
    if (!req.body.entry) return res.sendStatus(200);

    const entry = req.body.entry[0];
    const changes = entry.changes && entry.changes[0];
    const value = changes && changes.value;
    const messages = value && value.messages;
    if (!messages || !messages[0]) return res.sendStatus(200);

    const message = messages[0];
    const from = message.from;
    const type = message.type;

    console.log('Mensagem recebida de', from, 'tipo', type);

    if (type !== 'image') {
      await sendText(from, 'Olá! Envie uma foto do prato para eu analisar calorias e nutrientes 🍽️');
      return res.sendStatus(200);
    }

    const mediaId = message.image.id;

    // 1) obter URL do media
    const mediaInfo = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
      params: { access_token: WHATSAPP_TOKEN }
    });
    const mediaUrl = mediaInfo.data.url;
    if (!mediaUrl) {
      await sendText(from, 'Erro ao obter URL da imagem. Tente novamente.');
      return res.sendStatus(200);
    }

    // 2) baixar imagem (autenticada)
    const imgResp = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });

    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const localPath = path.join(tmpDir, `${Date.now()}.jpg`);
    fs.writeFileSync(localPath, imgResp.data);

    // 3) detectar alimentos (top 3)
    await sendText(from, 'Recebi sua foto — analisando agora 🔎');
    const labels = await detectFood(localPath); // ex: ['fried rice','grilled chicken']

    if (!labels || labels.length === 0) {
      await sendText(from, 'Não consegui identificar alimentos. Tente uma foto mais nítida.');
      fs.unlinkSync(localPath);
      return res.sendStatus(200);
    }

    // 4) para cada label consultar USDA (por 100g)
    const top = labels.slice(0, 3);
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const parts = [];

    for (const label of top) {
      const nut = await getNutritionByQuery(label, 100, process.env.USDA_API_KEY);
      if (!nut) continue;
      parts.push({ label, nut });
      total.calories += nut.calories;
      total.protein += nut.protein;
      total.carbs += nut.carbs;
      total.fat += nut.fat;
    }

    // montar resposta
    let text = '🍽 *Análise do prato*\n\n';
    for (const p of parts) {
      text += `• ${capitalize(p.label)} (100 g)\n  - 🔥 ${p.nut.calories} kcal\n  - 💪 ${p.nut.protein} g proteína\n  - 🍞 ${p.nut.carbs} g carboidrato\n  - 🥑 ${p.nut.fat} g gordura\n\n`;
    }
    text += `*Total aproximado:* 🔥 ${Math.round(total.calories)} kcal | 💪 ${Math.round(total.protein)} g | 🍞 ${Math.round(total.carbs)} g | 🥑 ${Math.round(total.fat)} g\n\n_Estimativas baseadas em 100g por item._`;

    await sendText(from, text);

    // cleanup
    fs.unlinkSync(localPath);

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err?.response?.data || err.message || err);
    return res.sendStatus(500);
  }
});

// helper: send simple text
async function sendText(to, body) {
  try {
    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_NUMBER_ID}/messages`;
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      text: { body }
    }, {
      params: { access_token: WHATSAPP_TOKEN }
    });
  } catch (e) {
    console.error('Erro enviando texto:', e?.response?.data || e.message || e);
  }
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
