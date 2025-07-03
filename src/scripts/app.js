import routes from './routes/routes';
import UrlParser from './utils/url-parser';
import { startViewTransition } from './utils/view-transition';

class App {
  constructor({ content }) {
    this._content = content;
    this._publicRoutes = ['/login', '/register', '/about']; // Halaman yang bisa diakses tanpa login
  }

  async renderPage() {
    try {
      // Ambil URL aktif
      const url = UrlParser.parseActiveUrlWithCombiner();
      const urlWithId = UrlParser.parseActiveUrlWithoutCombiner();
      
      // 🔍 DEBUG: Log URL parsing
      console.log('🐛 App renderPage:', {
        currentHash: window.location.hash,
        parsedUrl: url,
        urlWithId: urlWithId,
        rawId: urlWithId.id
      });
      
      // Ambil constructor halaman dari routes
      let pageClass = routes[url];

      // Untuk URL dengan parameter seperti /detail/:id
      if (!pageClass && url.includes('/detail/')) {
        pageClass = routes['/detail/:id'];
      } else if (!pageClass) {
        pageClass = routes['/'];
      }

      // Cek jika halaman tidak ditemukan
      if (!pageClass) {
        console.error('Page not found for URL:', url);
        this._content.innerHTML = '<div class="error-page">Halaman tidak ditemukan</div>';
        return;
      }

      // Buat instance dari kelas halaman
      let page;
      try {
        if (url.includes('/detail/')) {
          // 🔧 PERBAIKAN: Pastikan ID bersih dari karakter aneh
          const cleanId = urlWithId.id ? urlWithId.id.trim() : null;
          console.log('🔧 App: Creating detail page with cleaned ID:', cleanId);
          page = typeof pageClass === 'function' ? new pageClass(cleanId) : pageClass;
        } else {
          page = typeof pageClass === 'function' ? new pageClass() : pageClass;
        }
        if (!page.render && pageClass.render) {
          page = pageClass;
        }
      } catch (error) {
        console.error('Error creating page instance:', error);
        this._content.innerHTML = `<div class="error-page">
          <h2>Terjadi kesalahan pada aplikasi</h2>
          <p>Tidak dapat membuat instance halaman: ${error.message}</p>
          <button onclick="window.location.reload()">Coba Lagi</button>
        </div>`;
        return;
      }

      // Cek jika page instance tidak memiliki fungsi render
      if (typeof page.render !== 'function') {
        console.error('Page does not have render function:', url);
        this._content.innerHTML = '<div class="error-page">Halaman tidak valid</div>';
        return;
      }

      console.log('Page found:', pageClass.name || 'unnamed');

      // Cek autentikasi user
      const token = localStorage.getItem('token');
      const isPublicRoute = this._publicRoutes.includes(url);

      console.log('Auth check:', { token: !!token, isPublicRoute });

      // Redirect ke login jika belum login dan mencoba akses halaman yang perlu autentikasi
      if (!token && !isPublicRoute) {
        console.log('Redirecting to login page (not authenticated)');
        window.location.hash = '#/login';
        return;
      }

      // Redirect ke home jika sudah login tapi mencoba akses halaman login atau register
      if (token && (url === '/login' || url === '/register')) {
        console.log('Redirecting to home page (already authenticated)');
        window.location.hash = '#/';
        return;
      }

      try {
        // Render halaman dengan transisi
        await startViewTransition(async () => {
          try {
            console.log('Rendering page content...');
            
            // Render halaman
            this._content.innerHTML = await page.render();
            
            // Execute afterRender
            if (page.afterRender) {
              console.log('Executing afterRender...');
              await page.afterRender();
            }

            if (typeof window.initLogoutButton === 'function') {
              window.initLogoutButton();
            }
            
            // Focus the main content for accessibility
            this._content.focus();
            console.log('Page rendered successfully');
            
          } catch (renderError) {
            console.error('Error rendering page:', renderError);
            this._content.innerHTML = `<div class="error-page">
              <h2>Terjadi kesalahan saat memuat halaman</h2>
              <p>${renderError.message}</p>
              <button onclick="window.location.reload()">Coba Lagi</button>
            </div>`;
          }
        });
      } catch (error) {
        console.error('Error in page rendering:', error);
        this._content.innerHTML = `<div class="error-page">
          <h2>Terjadi kesalahan pada halaman</h2>
          <p>${error.message}</p>
          <button onclick="window.location.reload()">Coba Lagi</button>
        </div>`;
      }
    } catch (error) {
      console.error('Fatal error in app rendering:', error);
      this._content.innerHTML = `<div class="error-page">
        <h2>Terjadi kesalahan pada aplikasi</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Coba Lagi</button>
      </div>`;
    }
  }
}

export default App;