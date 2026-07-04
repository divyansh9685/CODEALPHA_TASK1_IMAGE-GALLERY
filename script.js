/**
 * ============================================================
 *  IMAGE DATA – 5 high‑quality photos (paths replaced with img1.jpeg … img5.jpeg)
 *  Categories: nature, animals, cities, food, travel
 * ============================================================
 */
const imageData = [
    {
        id: 1,
        src: 'img1.jpeg',
        srcLarge: 'img1.jpeg',
        alt: 'Misty forest with sunbeams',
        title: 'Enchanted Forest',
        caption: 'moon piercing ancient trees',
        category: 'nature'
    },
    {
        id: 2,
        src: 'img2.jpeg',
        srcLarge: 'img2.jpeg',
        alt: 'Mountain peak with snow',
        title: 'Alpine Majesty',
        caption: 'peaks at golden hour',
        category: 'nature'
    },
    {
        id: 3,
        src: 'img3.jpeg',
        srcLarge: 'img3.jpeg',
        alt: 'Sunset over the hills',
        title: 'Sunset',
        caption: 'Golden skies melting into the land',
        category: 'cities'
    },
    {
        id: 4,
        src: 'img4.jpeg',
        srcLarge: 'img4.jpeg',
        alt: 'City skyline at dusk',
        title: 'City Lights',
        caption: 'Urban landscape at twilight',
        category: 'cities'
    },
    {
        id: 5,
        src: 'img5.jpeg',
        srcLarge: 'img5.jpeg',
        alt: 'Tropical beach with bike',
        title: 'Beach Bike',
        caption: 'Crystal bike on a tropical beach',
        category: 'cities'
    }
];

// ============================================================
//  STATE
// ============================================================
const state = {
    category: 'all',
    query: '',
    index: 0,
    favorites: new Set(),
    isDark: false,
    isOpen: false,
};

// ============================================================
//  DOM REFS
// ============================================================
const grid = document.getElementById('galleryGrid');
const filterContainer = document.getElementById('filterButtons');
const loaderWrap = document.getElementById('loaderWrap');
const resultCount = document.getElementById('resultCount');
const searchInput = document.getElementById('searchInput');

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbTitle = document.getElementById('lbTitle');
const lbCaption = document.getElementById('lbCaption');
const lbCounter = document.getElementById('lbCounter');
const lbFav = document.getElementById('lbFav');
const lbDownload = document.getElementById('lbDownload');
const lbFullscreen = document.getElementById('lbFullscreen');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const scrollTopBtn = document.getElementById('scrollTop');

// ============================================================
//  HELPERS
// ============================================================
function getFiltered() {
    let result = imageData;
    if (state.category !== 'all') {
        result = result.filter(img => img.category === state.category);
    }
    if (state.query.trim()) {
        const q = state.query.toLowerCase().trim();
        result = result.filter(img =>
            img.title.toLowerCase().includes(q) ||
            img.caption.toLowerCase().includes(q) ||
            img.alt.toLowerCase().includes(q)
        );
    }
    return result;
}

function findIndex(id) {
    const filtered = getFiltered();
    return filtered.findIndex(img => img.id === id);
}

// ============================================================
//  RENDER GALLERY
// ============================================================
function render() {
    const filtered = getFiltered();
    const total = filtered.length;

    if (total === 0) {
        resultCount.textContent = 'No images found. Try a different search or filter.';
    } else {
        resultCount.textContent = `Showing ${total} image${total > 1 ? 's' : ''}`;
    }

    let html = '';
    if (total === 0) {
        html = `
            <div class="empty-state">
                <i class="fas fa-search" aria-hidden="true"></i>
                <h3>No results</h3>
                <p>Try adjusting your search or filter to find what you're looking for.</p>
            </div>
        `;
    } else {
        filtered.forEach((img, idx) => {
            const fav = state.favorites.has(img.id);
            html += `
                <div class="gallery-item" data-id="${img.id}" role="listitem">
                    <img src="${img.src}" alt="${img.alt}" loading="lazy" width="600" height="400" />
                    <div class="overlay">
                        <span class="badge">${img.category}</span>
                        <span class="title">${img.title}</span>
                        <span class="caption">${img.caption}</span>
                    </div>
                    <button class="fav-btn ${fav ? 'liked' : ''}" data-id="${img.id}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites" title="Favorite">
                        <i class="${fav ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>
                    </button>
                </div>
            `;
        });
    }

    grid.innerHTML = html;
    loaderWrap.style.display = 'none';

    // Events
    document.querySelectorAll('.gallery-item').forEach(el => {
        const id = parseInt(el.dataset.id);
        el.addEventListener('click', e => {
            if (e.target.closest('.fav-btn')) return;
            const idx = findIndex(id);
            if (idx !== -1) openLightbox(idx);
        });
        const favBtn = el.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener('click', e => {
                e.stopPropagation();
                toggleFav(parseInt(favBtn.dataset.id));
                render();
                searchInput.focus();
            });
        }
    });

    // Update filter buttons
    updateFilters();
}

// ============================================================
//  FILTERS – ONLY "All", "Nature", "Cities"
// ============================================================
function updateFilters() {
    const list = ['all', 'nature', 'cities'];
    let html = '';
    list.forEach(cat => {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        const active = state.category === cat ? 'active' : '';
        html += `
            <button class="filter-btn ${active}" data-cat="${cat}" role="tab" aria-selected="${active ? 'true' : 'false'}">
                ${label}
            </button>
        `;
    });
    filterContainer.innerHTML = html;
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.cat;
            state.category = cat;
            filterContainer.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.cat === cat);
                b.setAttribute('aria-selected', b.dataset.cat === cat ? 'true' : 'false');
            });
            render();
        });
    });
}

// ============================================================
//  LIGHTBOX
// ============================================================
function openLightbox(index) {
    const filtered = getFiltered();
    if (filtered.length === 0) return;
    state.index = Math.max(0, Math.min(index, filtered.length - 1));
    state.isOpen = true;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
}

function closeLightbox() {
    state.isOpen = false;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    const filtered = getFiltered();
    if (filtered.length > 0 && state.index < filtered.length) {
        const img = filtered[state.index];
        const el = document.querySelector(`.gallery-item[data-id="${img.id}"]`);
        if (el) el.focus();
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function updateLightbox() {
    const filtered = getFiltered();
    if (filtered.length === 0) return;
    const img = filtered[state.index];
    if (!img) return;
    lbImg.src = img.srcLarge;
    lbImg.alt = img.alt;
    lbTitle.textContent = img.title;
    lbCaption.textContent = img.caption || '';
    lbCounter.textContent = `${state.index + 1} of ${filtered.length}`;

    const fav = state.favorites.has(img.id);
    lbFav.innerHTML = `<i class="${fav ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>`;
    lbFav.classList.toggle('liked', fav);
    lbFav.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Add to favorites');

    lbDownload.onclick = () => {
        const a = document.createElement('a');
        a.href = img.srcLarge;
        a.download = `${img.title.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

function navigate(direction) {
    const filtered = getFiltered();
    if (filtered.length === 0) return;
    const next = state.index + direction;
    if (next < 0 || next >= filtered.length) return;
    state.index = next;
    lbImg.style.opacity = '0';
    setTimeout(() => {
        updateLightbox();
        lbImg.style.opacity = '1';
    }, 150);
}

// ============================================================
//  FAVORITES
// ============================================================
function toggleFav(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    if (state.isOpen) {
        const filtered = getFiltered();
        if (filtered.length > 0 && state.index < filtered.length) {
            const img = filtered[state.index];
            if (img.id === id) {
                const fav = state.favorites.has(id);
                lbFav.innerHTML = `<i class="${fav ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>`;
                lbFav.classList.toggle('liked', fav);
                lbFav.setAttribute('aria-label', fav ? 'Remove from favorites' : 'Add to favorites');
            }
        }
    }
}

// ============================================================
//  THEME
// ============================================================
function toggleTheme() {
    state.isDark = !state.isDark;
    document.documentElement.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
    themeIcon.className = state.isDark ? 'fas fa-sun' : 'fas fa-moon';
    themeToggle.setAttribute('aria-label', state.isDark ? 'Switch to light' : 'Switch to dark');
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        state.isDark = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        themeToggle.setAttribute('aria-label', 'Switch to light');
    }
}

// ============================================================
//  FULLSCREEN
// ============================================================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        lbFullscreen.innerHTML = '<i class="fas fa-compress" aria-hidden="true"></i>';
    } else {
        document.exitFullscreen().catch(() => {});
        lbFullscreen.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
    }
}
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        lbFullscreen.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i>';
    }
});

// ============================================================
//  SCROLL
// ============================================================
function handleScroll() {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}

// ============================================================
//  SEARCH
// ============================================================
let searchTimer;

function handleSearch(e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.query = e.target.value;
        render();
    }, 280);
}

// ============================================================
//  KEYBOARD
// ============================================================
document.addEventListener('keydown', e => {
    if (state.isOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); return; }
    }
    if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
        if (e.key === '/') e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
});

// ============================================================
//  LIGHTBOX EVENTS
// ============================================================
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => navigate(-1));
lbNext.addEventListener('click', () => navigate(1));

lbFav.addEventListener('click', () => {
    const filtered = getFiltered();
    if (filtered.length === 0) return;
    const img = filtered[state.index];
    if (img) {
        toggleFav(img.id);
        render();
        updateLightbox();
    }
});

lbFullscreen.addEventListener('click', toggleFullscreen);

// ============================================================
//  INIT
// ============================================================
function init() {
    loadTheme();
    render();
    searchInput.addEventListener('input', handleSearch);
    themeToggle.addEventListener('click', toggleTheme);
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', handleScroll);
    searchInput.setAttribute('placeholder', 'Search images... (/)');
    setTimeout(() => { loaderWrap.style.display = 'none'; }, 500);
    console.log('✨ Gallery ready! Filter options: All, Nature, Cities.');
}

init();