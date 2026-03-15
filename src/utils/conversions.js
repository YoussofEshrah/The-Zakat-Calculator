const { TROY_OZ_TO_GRAMS } = require('./constants');

function ozToGrams(oz) {
  return oz * TROY_OZ_TO_GRAMS;
}

function gramsToOz(grams) {
  return grams / TROY_OZ_TO_GRAMS;
}

function toGrams(weight, unit) {
  return unit === 'oz' ? ozToGrams(weight) : weight;
}

module.exports = { ozToGrams, gramsToOz, toGrams };
