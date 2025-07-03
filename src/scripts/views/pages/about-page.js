const AboutPage = {
    async render() {
      return `
        <section class="card">
          <h2 class="text-xl font-semibold mb-4 text-gray-800">📖 StoryShare - Story App</h2>
          <p class="text-gray-700">StoryShare adalah aplikasi berbasis web untuk membagikan cerita pribadi dalam bentuk teks dan gambar. Aplikasi ini memungkinkan pengguna untuk menulis cerita, melihat cerita dari pengguna lain, dan membagikan pengalaman mereka secara interaktif dengan fitur lokasi dan notifikasi.</p>
          <p class="text-gray-700 mt-2">Dibuat untuk submission Dicoding Web Intermediate.</p>
        </section>
      `;
    },
  
    async afterRender() {
    },
  };
  
  export default AboutPage;