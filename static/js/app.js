/**
 * Book Catalog Frontend JavaScript Application
 */

const API_BASE = '';

// Application State
const state = {
  books: [],
  stats: null,
  viewMode: 'grid',
  searchQuery: '',
  selectedGenre: '',
  selectedStatus: '',
  sortBy: 'title',
  currentBookId: null,
};

// DOM Elements
const elements = {
  booksContainer: document.getElementById('books-container'),
  statsGrid: document.getElementById('stats-grid'),
  searchInput: document.getElementById('search-input'),
  genreFilter: document.getElementById('genre-filter'),
  statusFilter: document.getElementById('status-filter'),
  sortSelect: document.getElementById('sort-select'),
  viewGridBtn: document.getElementById('view-grid-btn'),
  viewListBtn: document.getElementById('view-list-btn'),
  addBookBtn: document.getElementById('add-book-btn'),
  
  // Modals
  bookModal: document.getElementById('book-modal'),
  modalTitle: document.getElementById('modal-title'),
  bookForm: document.getElementById('book-form'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),

  // Delete Modal
  deleteModal: document.getElementById('delete-modal'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  closeDeleteModalBtn: document.getElementById('close-delete-modal-btn'),

  // Detail Modal
  detailModal: document.getElementById('detail-modal'),
  detailContent: document.getElementById('detail-content'),
  closeDetailModalBtn: document.getElementById('close-detail-modal-btn'),

  toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadData();
});

function initEventListeners() {
  // Search & Filters
  elements.searchInput.addEventListener('input', debounce((e) => {
    state.searchQuery = e.target.value;
    loadBooks();
  }, 300));

  elements.genreFilter.addEventListener('change', (e) => {
    state.selectedGenre = e.target.value;
    loadBooks();
  });

  elements.statusFilter.addEventListener('change', (e) => {
    state.selectedStatus = e.target.value;
    loadBooks();
  });

  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    loadBooks();
  });

  // View Mode Toggles
  elements.viewGridBtn.addEventListener('click', () => setViewMode('grid'));
  elements.viewListBtn.addEventListener('click', () => setViewMode('list'));

  // Add Book Button
  elements.addBookBtn.addEventListener('click', openAddModal);

  // Form Submissions
  elements.bookForm.addEventListener('submit', handleFormSubmit);

  // Modal Closures
  elements.closeModalBtn.addEventListener('click', () => closeModal(elements.bookModal));
  elements.cancelFormBtn.addEventListener('click', () => closeModal(elements.bookModal));
  
  elements.closeDeleteModalBtn.addEventListener('click', () => closeModal(elements.deleteModal));
  elements.cancelDeleteBtn.addEventListener('click', () => closeModal(elements.deleteModal));
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  elements.closeDetailModalBtn.addEventListener('click', () => closeModal(elements.detailModal));

  // Close modals when clicking overlay
  [elements.bookModal, elements.deleteModal, elements.detailModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

function setViewMode(mode) {
  state.viewMode = mode;
  if (mode === 'grid') {
    elements.viewGridBtn.classList.add('active');
    elements.viewListBtn.classList.remove('active');
    elements.booksContainer.classList.remove('list-view');
    elements.booksContainer.classList.add('grid-view');
  } else {
    elements.viewListBtn.classList.add('active');
    elements.viewGridBtn.classList.remove('active');
    elements.booksContainer.classList.remove('grid-view');
    elements.booksContainer.classList.add('list-view');
  }
}

async function loadData() {
  await Promise.all([loadBooks(), loadStats()]);
}

async function loadBooks() {
  try {
    const params = new URLSearchParams({ limit: 100 });
    if (state.searchQuery) params.append('q', state.searchQuery);
    if (state.selectedGenre) params.append('genre', state.selectedGenre);
    if (state.selectedStatus) params.append('status', state.selectedStatus);
    if (state.sortBy) params.append('sort_by', state.sortBy);

    const response = await fetch(`${API_BASE}/books?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch books');
    
    const data = await response.json();
    state.books = data.books;
    renderBooks();
    populateGenreDropdown();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) return;
    state.stats = await response.json();
    renderStats();
  } catch (err) {
    console.error('Stats loading failed', err);
  }
}

function renderStats() {
  if (!state.stats) return;
  const s = state.stats;
  elements.statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon-wrapper" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">📚</div>
      <div>
        <div class="stat-val">${s.total_books}</div>
        <div class="stat-label">Total Books</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrapper" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">📖</div>
      <div>
        <div class="stat-val">${s.status_counts.Reading || 0}</div>
        <div class="stat-label">Currently Reading</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">⭐</div>
      <div>
        <div class="stat-val">${s.avg_rating ? s.avg_rating.toFixed(1) : '0.0'}</div>
        <div class="stat-label">Average Rating</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrapper" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">🏷️</div>
      <div>
        <div class="stat-val">${Object.keys(s.genres || {}).length}</div>
        <div class="stat-label">Unique Genres</div>
      </div>
    </div>
  `;
}

function renderBooks() {
  if (!state.books || state.books.length === 0) {
    elements.booksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No books found</div>
        <div class="empty-text">Try tweaking your search or filter parameters, or add a new book to your catalog.</div>
        <button class="btn btn-primary" onclick="openAddModal()">+ Add New Book</button>
      </div>
    `;
    return;
  }

  elements.booksContainer.innerHTML = state.books.map(book => {
    const statusClass = `status-${(book.status || 'Available').toLowerCase()}`;
    const coverImage = book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80';
    
    return `
      <div class="book-card" data-id="${book.id}">
        <div class="book-cover-container">
          <img src="${escapeHtml(coverImage)}" alt="${escapeHtml(book.title)}" class="book-cover" onerror="this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'">
          <span class="book-badge ${statusClass}">${escapeHtml(book.status || 'Available')}</span>
        </div>
        <div class="book-content">
          <div class="book-genre">${escapeHtml(book.genre || 'General')}</div>
          <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <div class="book-author">by ${escapeHtml(book.author)}</div>
          
          <div class="book-meta">
            <span class="book-rating">★ ${book.rating ? book.rating.toFixed(1) : 'N/A'}</span>
            <span>•</span>
            <span>${book.pages || 0} pages</span>
            <span>•</span>
            <span>${book.publication_year || ''}</span>
          </div>

          <p class="book-description">${escapeHtml(book.description || 'No description provided.')}</p>

          <div class="book-actions">
            <button class="btn btn-secondary" onclick="openDetailModal(${book.id})">View</button>
            <button class="btn btn-secondary" onclick="openEditModal(${book.id})">Edit</button>
            <button class="btn btn-danger" onclick="openDeleteModal(${book.id})">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateGenreDropdown() {
  const currentVal = state.selectedGenre;
  const genres = new Set();
  state.books.forEach(b => { if (b.genre) genres.add(b.genre); });

  let html = '<option value="">All Genres</option>';
  Array.from(genres).sort().forEach(g => {
    const selected = g === currentVal ? 'selected' : '';
    html += `<option value="${escapeHtml(g)}" ${selected}>${escapeHtml(g)}</option>`;
  });
  elements.genreFilter.innerHTML = html;
}

// Modal Handlers
function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function openAddModal() {
  state.currentBookId = null;
  elements.modalTitle.textContent = 'Add New Book';
  elements.bookForm.reset();
  document.getElementById('form-id').value = '';
  document.getElementById('form-status').value = 'Available';
  document.getElementById('form-rating').value = '4.5';
  openModal(elements.bookModal);
}

function openEditModal(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  state.currentBookId = id;
  elements.modalTitle.textContent = 'Edit Book';

  document.getElementById('form-id').value = book.id;
  document.getElementById('form-title').value = book.title || '';
  document.getElementById('form-author').value = book.author || '';
  document.getElementById('form-genre').value = book.genre || '';
  document.getElementById('form-year').value = book.publication_year || '';
  document.getElementById('form-pages').value = book.pages || '';
  document.getElementById('form-rating').value = book.rating || 4.5;
  document.getElementById('form-status').value = book.status || 'Available';
  document.getElementById('form-isbn').value = book.isbn || '';
  document.getElementById('form-cover').value = book.cover_url || '';
  document.getElementById('form-description').value = book.description || '';

  openModal(elements.bookModal);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const payload = {
    title: document.getElementById('form-title').value.trim(),
    author: document.getElementById('form-author').value.trim(),
    genre: document.getElementById('form-genre').value.trim() || 'General',
    publication_year: parseInt(document.getElementById('form-year').value) || 2024,
    pages: parseInt(document.getElementById('form-pages').value) || 100,
    rating: parseFloat(document.getElementById('form-rating').value) || 4.0,
    status: document.getElementById('form-status').value,
    isbn: document.getElementById('form-isbn').value.trim(),
    cover_url: document.getElementById('form-cover').value.trim() || null,
    description: document.getElementById('form-description').value.trim()
  };

  try {
    let response;
    if (state.currentBookId) {
      response = await fetch(`${API_BASE}/books/${state.currentBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Failed to save book');
    }

    closeModal(elements.bookModal);
    showToast(state.currentBookId ? 'Book updated successfully!' : 'Book added to catalog!', 'success');
    await loadData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openDeleteModal(id) {
  state.currentBookId = id;
  openModal(elements.deleteModal);
}

async function handleConfirmDelete() {
  if (!state.currentBookId) return;

  try {
    const response = await fetch(`${API_BASE}/books/${state.currentBookId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete book');

    closeModal(elements.deleteModal);
    showToast('Book removed from catalog', 'success');
    await loadData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openDetailModal(id) {
  const book = state.books.find(b => b.id === id);
  if (!book) return;

  const cover = book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80';
  
  elements.detailContent.innerHTML = `
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
      <img src="${escapeHtml(cover)}" alt="Cover" style="width: 140px; height: 190px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-md);">
      <div style="flex: 1; min-width: 200px;">
        <span class="book-genre">${escapeHtml(book.genre || 'General')}</span>
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(book.title)}</h2>
        <div style="color: var(--text-secondary); font-size: 1rem; margin-bottom: 1rem;">by ${escapeHtml(book.author)}</div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          <span style="color: var(--accent-amber); font-weight: 600;">★ ${book.rating ? book.rating.toFixed(1) : 'N/A'}</span>
          <span>•</span>
          <span>${book.pages || 0} Pages</span>
          <span>•</span>
          <span>Published ${book.publication_year || 'N/A'}</span>
          ${book.isbn ? `<span>• ISBN: ${escapeHtml(book.isbn)}</span>` : ''}
        </div>

        <span class="book-badge status-${(book.status || 'Available').toLowerCase()}" style="position: static; display: inline-block;">${escapeHtml(book.status || 'Available')}</span>
      </div>
    </div>
    
    <div>
      <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; letter-spacing: 0.05em;">Synopsis</h4>
      <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">${escapeHtml(book.description || 'No description provided.')}</p>
    </div>
  `;

  openModal(elements.detailModal);
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Utilities
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
