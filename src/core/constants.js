const ZAKAT_RATE = 0.025;

const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;

const TROY_OZ_TO_GRAMS = 31.1035;

const GOLD_PURITIES = {
  '24k': 24 / 24,
  '22k': 22 / 24,
  '21k': 21 / 24,
  '18k': 18 / 24,
};

const SILVER_PURITIES = {
  '999': 0.999,
  '925': 0.925,
  '900': 0.900,
  '800': 0.800,
};

const SUPPORTED_CURRENCIES = [
  'USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD',
  'JOD', 'OMR', 'TRY', 'MYR', 'IDR', 'PKR', 'INR', 'BDT',
];

module.exports = {
  ZAKAT_RATE,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  TROY_OZ_TO_GRAMS,
  GOLD_PURITIES,
  SILVER_PURITIES,
  SUPPORTED_CURRENCIES,
};
