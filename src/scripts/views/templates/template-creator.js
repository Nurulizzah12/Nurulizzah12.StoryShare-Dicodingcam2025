// src/scripts/templates/template-creator.js

// Helper function untuk format tanggal
const formatDate = (dateString) => {
  if (!dateString) return 'Tanggal tidak diketahui';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tanggal tidak valid';
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tanggal tidak diketahui';
  }
};

const createStoryItemTemplate = (story) => {
  // Debug log untuk melihat data yang masuk ke template
  console.log('🔍 Template: Creating story item for:', story);
  
  return `
    <div class="story-item">
      <img class="story-item__header__poster" 
           src="${story.image || 'https://placehold.co/400x300/333/ffffff/png?text=No+Image'}" 
           alt="${story.title || 'Untitled Story'}" 
           onerror="this.src='https://placehold.co/400x300/333/ffffff/png?text=No+Image'; this.alt='No Image Available';">
      <div class="story-item__content">
        <h3 class="story-item__title">
          <a href="#/detail/${story.id}">${story.title || 'Untitled Story'}</a>
        </h3>
        <p class="story-item__description">${(story.description || 'No description available').substring(0, 100)}...</p>
        <p class="story-item__date">
          <i class="fas fa-calendar-alt"></i> ${formatDate(story.date)}
          <br>
          <i class="fas fa-map-marker-alt"></i> ${story.location || 'Lokasi tidak diketahui'}
          <br>
          <i class="fas fa-user"></i> ${story.author || 'Anonim'}
        </p>
        <div class="story-item__actions">
          <a href="#/detail/${story.id}" class="btn-detail">Lihat Selengkapnya <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
    </div>
  `;
};

const createStoryDetailTemplate = (story) => {
  console.log('🔍 Template: Creating story detail for:', story);
  
  return `
    <div class="story-detail">
      <h2 class="story__title">${story.title || 'Untitled Story'}</h2>
      <img class="story__poster" 
           src="${story.image || 'https://placehold.co/600x400/333/ffffff/png?text=No+Image'}" 
           alt="${story.title || 'Untitled Story'}" 
           onerror="this.src='https://placehold.co/600x400/333/ffffff/png?text=No+Image'; this.alt='No Image Available';">
      <div class="story__info">
        <p class="story__date"><i class="fas fa-calendar-alt"></i> Tanggal: ${formatDate(story.date)}</p>
        <p class="story__location"><i class="fas fa-map-marker-alt"></i> Lokasi: ${story.location || 'Tidak diketahui'}</p>
        <p class="story__author"><i class="fas fa-user"></i> Penulis: ${story.author || 'Anonim'}</p>
      </div>
      <p class="story__overview">${story.content || story.description || 'No content available'}</p>
    </div>
    <div class="action-buttons mt-4 flex justify-center gap-4">
      <button id="saveStoryBtn" class="btn-primary"><i class="fas fa-bookmark"></i> Simpan Story</button>
      <button id="tryNotificationBtn" class="btn-primary"><i class="fas fa-bell"></i> Coba Notifikasi</button>
      <button id="backToListBtn" class="btn-secondary"><i class="fas fa-arrow-left"></i> Kembali</button>
    </div>
  `;
};

const createSavedStoryItemTemplate = (story) => {
  console.log('🔍 Template: Creating saved story item for:', story);
  
  return `
    <div class="story-item">
      <img class="story-item__header__poster" 
           src="${story.image || 'https://placehold.co/400x300/333/ffffff/png?text=No+Image'}" 
           alt="${story.title || 'Untitled Story'}" 
           onerror="this.src='https://placehold.co/400x300/333/ffffff/png?text=No+Image'; this.alt='No Image Available';">
      <div class="story-item__content">
        <h3 class="story-item__title">
          <a href="#/detail/${story.id}">${story.title || 'Untitled Story'}</a>
        </h3>
        <p class="story-item__description">${(story.description || 'No description available').substring(0, 100)}...</p>
        <p class="story-item__date">
          <i class="fas fa-calendar-alt"></i> ${formatDate(story.date)}
          <br>
          <i class="fas fa-map-marker-alt"></i> ${story.location || 'Lokasi tidak diketahui'}
          <br>
          <i class="fas fa-user"></i> ${story.author || 'Anonim'}
        </p>
        <div class="story-item__actions">
          <a href="#/detail/${story.id}" class="btn-detail">Lihat Detail <i class="fas fa-arrow-right"></i></a>
          <button class="btn-delete" data-id="${story.id}"><i class="fas fa-trash"></i> Hapus</button>
        </div>
      </div>
    </div>
  `;
};

export {
  createStoryItemTemplate,
  createStoryDetailTemplate,
  createSavedStoryItemTemplate
};