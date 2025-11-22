# WhatsApp FoodBot (Gratuito) - README rápido

Este projeto recebe fotos via WhatsApp Cloud API, identifica alimentos usando um modelo gratuito (Food-101 via @xenova/transformers) rodando no servidor (Render) e consulta a USDA FoodData Central para estimativas nutricionais.

## Arquivos principais
- index.js         -> servidor Express + webhook + fluxo principal
- classifyFood.js  -> carrega pipeline @xenova/transformers (Food-101)
- nutrition.js     -> consulta USDA FoodData Central e extrai macros
- package.json
- .env.example

## Variáveis de ambiente (configure no Render ou em .env local)
- WHATSAPP_TOKEN = token do WhatsApp Cloud API (Meta)
- WHATSAPP_NUMBER_ID = ID do número (Meta)
- VERIFY_TOKEN = token de verificação do webhook (qualquer string)
- USDA_API_KEY = sua chave da USDA FoodData Central
- PORT = opcional (padrão 3000)

## Como obter as chaves (passo-a-passo)
1. WhatsApp Cloud API (Meta)
   - Acesse https://developers.facebook.com/
   - Crie um App -> WhatsApp -> Configure um número de teste
   - Pegue: `WHATSAPP_TOKEN` e `WHATSAPP_NUMBER_ID`
   - Em Webhooks -> Configure Callback URL: https://<seu-servico>.onrender.com/webhook
     e Verify token: o mesmo `VERIFY_TOKEN` que você colocar no Render.

2. USDA FoodData Central (gratuito)
   - Acesse: https://fdc.nal.usda.gov/api-key-signup.html
   - Solicite sua API Key (gratuita). Coloque em `USDA_API_KEY`.

## Deploy no Render (resumo)
1. Suba o repositório no GitHub.
2. No Render: New -> Web Service -> Conecte ao repo.
3. Start Command: `node index.js`
4. Configure Environment Variables (WHATSAPP_TOKEN, WHATSAPP_NUMBER_ID, VERIFY_TOKEN, USDA_API_KEY).
5. Deploy e copie a URL para Webhook no Facebook Developers.

## Observações
- O modelo Food-101 será baixado na primeira execução (pode demorar).
- Ajustes de labels e limpeza são recomendados para melhorar matching com USDA.
- Use logs do Render para debug.

