class Spinner {
    constructor() {
      this._spinnerTemplate = `
        <div class="spinner">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;
    }
  
    show(container) {
      if (container) {
        container.innerHTML = this._spinnerTemplate;
      }
    }
  
    hide() {
      const spinner = document.querySelector('.spinner');
      if (spinner) {
        spinner.remove();
      }
    }
  }
  
  export default Spinner;