// src/scripts/routes/routes.js
import HomePage from '../views/pages/home-page';
import AddStoryPage from '../views/pages/add-story-page';
import AboutPage from '../views/pages/about-page';
import DetailPage from '../views/pages/detail-page';
import LoginPage from '../views/pages/login-page';
import RegisterPage from '../views/pages/register-page';
import SavedStoriesPage from '../views/pages/saved-stories-page'; // Import halaman baru

const routes = {
  '/': HomePage, // default page
  '/login': LoginPage,
  '/home': HomePage, // Duplikat rute untuk /
  '/add': AddStoryPage,
  '/about': AboutPage,
  '/detail/:id': DetailPage,
  '/register': RegisterPage,
  '/saved': SavedStoriesPage, // Menambahkan rute untuk Saved Stories
};

export default routes;
