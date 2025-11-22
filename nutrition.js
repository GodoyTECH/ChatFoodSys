/**
 * nutrition.js
 * Consulta USDA FoodData Central para obter macros básicos por 100g.
 */
const axios = require('axios');

async function getNutritionByQuery(query, grams = 100, apiKey) {
  try {
    if (!apiKey) {
      console.warn('USDA_API_KEY não definida.');
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const searchUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search';
    const resp = await axios.get(searchUrl, {
      params: { query: query, pageSize: 2, api_key: apiKey }
    });

    const foods = resp.data.foods;
    if (!foods || foods.length === 0) return null;

    const food = foods[0];
    const nutr = food.foodNutrients || [];

    const findVal = (terms) => {
      for (const n of nutr) {
        if (!n.nutrientName) continue;
        const name = n.nutrientName.toLowerCase();
        for (const t of terms) {
          if (name.includes(t)) return n.value || 0;
        }
      }
      return 0;
    };

    let calories = findVal(['energy', 'calories']) || 0;
    let protein = findVal(['protein']) || 0;
    let carbs = findVal(['carbohydrate']) || 0;
    let fat = findVal(['total lipid', 'total fat', 'lipid']) || 0;

    const factor = grams / 100;
    calories = +(calories * factor).toFixed(1);
    protein = +(protein * factor).toFixed(1);
    carbs = +(carbs * factor).toFixed(1);
    fat = +(fat * factor).toFixed(1);

    return { calories, protein, carbs, fat };
  } catch (err) {
    console.error('getNutrition error:', err?.response?.data || err.message || err);
    return null;
  }
}

module.exports = { getNutritionByQuery };
