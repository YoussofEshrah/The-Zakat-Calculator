import { CalculatorView } from './views/CalculatorView.js';

document.addEventListener('DOMContentLoaded', () => {
  const appEl = document.getElementById('app');
  new CalculatorView(appEl);
});
