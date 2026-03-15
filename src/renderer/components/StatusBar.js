export class StatusBar {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'status-bar';
    this._render('', 'Ready');
    container.appendChild(this.el);
  }

  setStatus(status, message, onRetry = null) {
    this._render(status, message, onRetry);
  }

  _render(status, message, onRetry) {
    const dotClass = status ? `status-bar__dot--${status}` : '';
    const retryHtml = onRetry ? `<button class="status-bar__retry">Retry</button>` : '';

    this.el.innerHTML = `
      <span class="status-bar__dot ${dotClass}"></span>
      <span class="status-bar__text">${message}</span>
      ${retryHtml}
    `;

    if (onRetry) {
      this.el.querySelector('.status-bar__retry').addEventListener('click', onRetry);
    }
  }
}
