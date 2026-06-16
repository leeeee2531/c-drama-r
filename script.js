const API_KEY = '737411a7f9cf0922590afe4cf38b0fd6';

const dramaGrid = document.getElementById('dramaGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sectionTitle = document.getElementById('sectionTitle');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const darkModeBtn = document.getElementById('darkModeBtn');

/* ==========================================
   [기능 1] UI 인터랙션
========================================== */

// 모바일 메뉴 토글
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
}

// 다크모드 저장/불러오기
const savedTheme = localStorage.getItem('theme') || 'light';

if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');

  if (darkModeBtn) {
    darkModeBtn.textContent = '☀️ 라이트모드';
  }
}

if (darkModeBtn) {
  darkModeBtn.addEventListener('click', () => {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'light' : 'dark'
    );

    darkModeBtn.textContent =
      isDark ? '🌙 다크모드' : '☀️ 라이트모드';

    localStorage.setItem(
      'theme',
      isDark ? 'light' : 'dark'
    );
  });
}

/* ==========================================
   [기능 2] 검색 + API 호출
========================================== */

async function fetchDramas(query = '') {

  if (!dramaGrid) return;

  if (!query) {
    sectionTitle.style.display = 'none';
    dramaGrid.innerHTML = '';
    return;
  }

  sectionTitle.style.display = 'block';

  let url =
    `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    let cDramas =
      data.results.filter(tv =>
        tv.original_language === 'zh'
      );

    // 한국어 검색 결과 없으면 중국어 재검색
    if (query && cDramas.length === 0) {

      const zhUrl =
        `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&language=zh-CN&query=${encodeURIComponent(query)}`;

      const zhResponse = await fetch(zhUrl);
      const zhData = await zhResponse.json();

      cDramas =
        zhData.results.filter(tv =>
          tv.original_language === 'zh'
        );
    }

  sectionTitle.textContent =
    `🔍 '${query}' 검색 결과 (${cDramas.length}건)`;

    document
      .getElementById('heroSection')
      .classList.add('search-mode');

    renderDramas(cDramas);

  } catch (error) {
    console.error(error);

    dramaGrid.innerHTML =
      '<p>데이터 로드에 실패했습니다.</p>';
  }
}

/* ==========================================
   [기능 3] 카드 렌더링
========================================== */

function renderDramas(dramas) {

  dramaGrid.innerHTML = '';

  if (dramas.length === 0) {

    dramaGrid.innerHTML =
      '<p style="color:gray;">검색된 중국 드라마가 없습니다.</p>';

    return;
  }

  dramas.forEach(async (drama) => {

    const posterUrl =
      drama.poster_path
        ? `https://image.tmdb.org/t/p/w300${drama.poster_path}`
        : 'https://via.placeholder.com/300x450?text=No+Image';

    const displayName =
      drama.name || drama.original_name;

    dramaGrid.innerHTML += `
      <div class="drama-card"
           onclick="goToDetail(${drama.id})">

        <img
          class="poster"
          src="${posterUrl}"
          alt="${displayName}">

        <div style="padding:15px; text-align:center;">

          <h3>${displayName}</h3>

          <p>
            ⭐
            ${
              drama.vote_average
                ? drama.vote_average.toFixed(1)
                : '평점 없음'
            }
          </p>

        </div>
      </div>
    `;    
  });
}

/* ==========================================
   [기능 4] 상세페이지 이동
========================================== */

function goToDetail(id) {
  window.location.href =
    `detail.html?id=${id}`;
}

/* ==========================================
   [기능 5] 상세페이지 데이터
========================================== */

async function fetchDramaDetail() {

  const detailWrapper =
    document.getElementById('detailWrapper');

  if (!detailWrapper) return;

  const params =
    new URLSearchParams(window.location.search);

  const id =
    params.get('id');

  if (!id) {

    detailWrapper.innerHTML =
      '<p>잘못된 접근입니다.</p>';

    return;
  }

  try {

    const url =
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=ko-KR`;

    const response =
      await fetch(url);

    const drama =
      await response.json();

    const providerUrl =
      `https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=${API_KEY}`;

    const providerResponse =
      await fetch(providerUrl);

    const providerData =
      await providerResponse.json();

    const providers =
      providerData.results?.KR?.flatrate || [];

    const posterUrl =
      drama.poster_path
        ? `https://image.tmdb.org/t/p/w500${drama.poster_path}`
        : 'https://via.placeholder.com/300x450?text=No+Image';

    const genres =
      drama.genres
        .map(g => g.name)
        .join(', ');

    let ottHtml = '';

    if (providers.length > 0) {
      
      ottHtml = `
        <div class="ott-box">
          <h3>📺 시청 가능 OTT</h3>

          <div class="ott-tags">
            ${providers
              .map(provider =>
                `<a
                    href="${getOttLink(provider.provider_name)}"
                    target="_blank"
                    class="ott-tag ${getOttClass(provider.provider_name)}"
                  >
                    ${provider.provider_name}
                  </a>`
              )
              .join('')}

          </div>
        </div>
      `;
    
    } else {

      ottHtml = `
        <div class="ott-box">
          <h3>📺 시청 가능 OTT</h3>
          <p>제공 정보 없음</p>
        </div>
      `;
    }

    detailWrapper.innerHTML = `
      <img
        class="detail-poster"
        src="${posterUrl}"
        alt="${drama.name}">

      <div class="detail-info">

        <h2>
          ${drama.name}
        </h2>

        <button
          class="favorite-btn"
          onclick="toggleFavorite(${drama.id}, '${drama.name.replace(/'/g, "\\'")}')"
        >
          ❤️
        </button>

        <p>
          <strong>장르:</strong>
          ${genres || '정보 없음'}
        </p>

        <p>
          <strong>첫 방영:</strong>
          ${drama.first_air_date || '정보 없음'}
        </p>

        <p>
          <strong>평점:</strong>
          ⭐ ${drama.vote_average || '없음'}
        </p>

        <p class="overview">
          ${drama.overview || '줄거리 정보가 없습니다.'}
        </p>

        ${ottHtml}

      </div>
    `;

    document.title =
      `${drama.name} | C-Drama Room`;

  } catch (error) {

    detailWrapper.innerHTML =
      '<p>드라마 정보를 불러오지 못했습니다.</p>';
  }
}

/* ==========================================
   [기능 6] 이벤트 연결
========================================== */

if (searchBtn) {
  searchBtn.addEventListener(
    'click',
    () => {

      const query =
        searchInput.value.trim();

      localStorage.setItem(
        'lastSearch',
        query
      );

      fetchDramas(query);
    }
  );
}

if (searchInput) {
  searchInput.addEventListener(
    'keyup',
    (e) => {
      if (e.key === 'Enter') {
        const query =
          searchInput.value.trim();

        localStorage.setItem(
          'lastSearch',
          query
        );

        fetchDramas(query);
      }
    }
  );
}

/* ==========================================
   [기능 7] 페이지 시작
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    if (
      document.getElementById(
        'detailWrapper'
      )
    ) {
      fetchDramaDetail();
      return;
    }

    if (
      document.getElementById(
        'favoriteGrid'
      )
    ) {
      loadFavorites();
      return;
    }

    const lastSearch =
      localStorage.getItem(
        'lastSearch'
      );

    if (lastSearch) {

      searchInput.value =
        lastSearch;

      fetchDramas(lastSearch);
    }

    if (
      document.getElementById(
        'favoriteGrid'
      )
    ) {
      loadFavorites();
      return;
    }
  }
);

/* ==========================================
   [기능 8] OTT
========================================== */

function getOttClass(name) {

  const ottName = name.toLowerCase();

  if (ottName.includes('netflix'))
    return 'netflix';

  if (ottName.includes('disney'))
    return 'disney';

  if (ottName.includes('wavve'))
    return 'wavve';

  if (ottName.includes('watcha'))
    return 'watcha';

  if (ottName.includes('tving'))
    return 'tving';

  if (ottName.includes('coupang'))
    return 'coupang';

  return 'default-ott';
}


function getOttLink(name) {

  const ottName = name.toLowerCase();

  if (ottName.includes('netflix'))
    return 'https://www.netflix.com';

  if (ottName.includes('disney'))
    return 'https://www.disneyplus.com';

  if (ottName.includes('wavve'))
    return 'https://www.wavve.com';

  if (ottName.includes('watcha'))
    return 'https://watcha.com';

  if (ottName.includes('tving'))
    return 'https://www.tving.com';

  if (ottName.includes('coupang'))
    return 'https://www.coupangplay.com';

  return '#';
}


function toggleFavorite(id, name) {

  let favorites =
    JSON.parse(
      localStorage.getItem('favorites')
    ) || [];

  const exists =
    favorites.find(
      drama => drama.id === id
    );

  if (exists) {

    favorites =
      favorites.filter(
        drama => drama.id !== id
      );

    alert('즐겨찾기에서 제거되었습니다.');

  } else {

    favorites.push({
      id,
      name
    });

    alert('즐겨찾기에 추가되었습니다.');
  }

  localStorage.setItem(
    'favorites',
    JSON.stringify(favorites)
  );
}


function clearSearch(){
  localStorage.removeItem('lastSearch');

  window.location.href =
    'index.html';
}

function goHome() {
  localStorage.removeItem('lastSearch');

  window.location.href = 'index.html';
}


async function loadFavorites() {

  const favoriteGrid =
    document.getElementById('favoriteGrid');

  if (!favoriteGrid) return;

  const favorites =
    JSON.parse(
      localStorage.getItem('favorites')
    ) || [];

  if (favorites.length === 0) {

    favoriteGrid.innerHTML = `
      <p style="text-align:center;">
        ❤️ 아직 즐겨찾기한 드라마가 없습니다.
      </p>
    `;

    return;
  }

  favoriteGrid.innerHTML = '';

  for (const favorite of favorites) {
    try {
      const response =
        await fetch(
          `https://api.themoviedb.org/3/tv/${favorite.id}?api_key=${API_KEY}&language=ko-KR`
        );

      const drama =
        await response.json();

      const posterUrl =
        drama.poster_path
          ? `https://image.tmdb.org/t/p/w300${drama.poster_path}`
          : 'https://via.placeholder.com/300x450?text=No+Image';

      favoriteGrid.innerHTML += `
        <div
          class="drama-card"
          onclick="goToDetail(${drama.id})"
        >

          <img
            class="poster"
            src="${posterUrl}"
            alt="${drama.name}"
          >

          <div
            style="
              padding:15px;
              text-align:center;
            "
          >

            <h3>
              ${drama.name}
            </h3>

            <p>
              ⭐ ${
                drama.vote_average
                  ? drama.vote_average.toFixed(1)
                  : '평점 없음'
              }
            </p>

          </div>

        </div>
      `;

    } catch(error) {

      console.error(error);
    }
  }
}