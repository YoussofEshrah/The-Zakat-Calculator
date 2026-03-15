function formatCurrency(amount, currencyCode) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

function formatWeight(grams, unit) {
  if (unit === 'oz') {
    return `${formatNumber(grams / 31.1035, 4)} oz`;
  }
  return `${formatNumber(grams, 2)} g`;
}

module.exports = { formatCurrency, formatNumber, formatWeight };
