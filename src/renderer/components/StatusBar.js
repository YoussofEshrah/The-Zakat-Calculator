export class StatusBar {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'status-bar';
    this.el.innerHTML = `
      <span class="status-bar__dot"></span>
      <span class="status-bar__text">Ready</span>
    `;
    container.appendChild(this.el);
  }

  setStatus(status, message) {
    const dot = this.el.querySelector('.status-bar__dot');
    const text = this.el.querySelector('.status-bar__text');

    dot.className = 'status-bar__dot';
    if (status === 'live') dot.classList.add('status-bar__dot--live');
    else if (status === 'stale') dot.classList.add('status-bar__dot--stale');
    else if (status === 'error') dot.classList.add('status-bar__dot--error');

    text.textContent = message;
  }
}
