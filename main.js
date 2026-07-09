/* ============================================
   CS2 Skin Upgrade Simulator — Логика
   ============================================ */

// ---- Конфигурация ----
const API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const STARTING_BALANCE = 1000;
const STORAGE_KEY = 'cs2_upgrade_sim';

// Цвета редкостей CS2
const RARITY_COLORS = {
  'Consumer Grade':         '#b0c3d9',
  'Industrial Grade':       '#5e98d9',
  'Mil-Spec':               '#4b69ff',
  'Restricted':             '#8847ff',
  'Classified':             '#d32ce6',
  'Covert':                 '#eb4b4b',
  'Extraordinary':          '#ffd700',
  'Contraband':             '#e4ae39',
  'Default':                '#b0c3d9',
};

// Приоритет редкости (для сортировки)
const RARITY_ORDER = [
  'Consumer Grade', 'Industrial Grade', 'Mil-Spec',
  'Restricted', 'Classified', 'Covert', 'Extraordinary', 'Contraband'
];

// Оружия для фильтра (популярные)
const WEAPON_FILTER = [
  'AK-47', 'M4A4', 'M4A1-S', 'AWP', 'Desert Eagle',
  'USP-S', 'Glock-18', 'P250', 'Five-SeveN', 'CZ75-Auto',
  'MP9', 'MAC-10', 'UMP-45', 'P90', 'PP-Bizon',
  'FAMAS', 'Galil AR', 'SG 553', 'AUG',
  'SSG 08', 'SCAR-20', 'G3SG1',
  'Nova', 'Sawed-Off', 'MAG-7', 'XM1014',
  'Tec-9', 'R8 Revolver', 'Dual Berettas',
  'Knife', 'Gloves', 'M4A1 | Mildly Threatening'
];

// ---- Состояние приложения ----
let state = {
  balance: STARTING_BALANCE,
  inventory: [],      // Массив объектов скинов (из API)
  allSkins: [],        // Все загруженные скины
  selectedInput: null,  // Индекс в inventory
  selectedTarget: null, // Объект скина (из allSkins)
  activeTab: 'inventory',
  slotMode: null,       // 'input' | 'target' | null
  filters: { weapon: '', rarity: '', search: '' }
};

// ---- Инициализация ----
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderBalance();
  generateAsciiTitle();
  setupEventListeners();
  fetchSkins();
  initBackgroundBlobs();
});

// ---- localStorage ----
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.balance = parsed.balance ?? STARTING_BALANCE;
      state.inventory = parsed.inventory ?? [];
    }
  } catch (e) {
    console.warn('Ошибка загрузки состояния:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      balance: state.balance,
      inventory: state.inventory
    }));
  } catch (e) {
    console.warn('Ошибка сохранения состояния:', e);
  }
}

// ---- ASCII-заголовок ----
function generateAsciiTitle() {
  const lines = [
    '███████╗███████╗███╗   ██╗███████╗ ██████╗ ██████╗ ████████╗',
    '██╔════╝██╔════╝████╗  ██║██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝',
    '█████╗  ███████╗██╔██╗ ██║█████╗  ██║   ██║██████╔╝   ██║   ',
    '██╔══╝  ╚════██║██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗   ██║   ',
    '███████╗███████║██║ ╚████║███████╗╚██████╔╝██║  ██║   ██║   ',
    '╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ',
    '',
    '██████╗ ███████╗ ██████╗     ██████╗  ██████╗ ███╗   ██╗ ██████╗',
    '██╔══██╗██╔════╝██╔════╝     ██╔══██╗██╔═══██╗████╗  ██║██╔════╝',
    '██║  ██║█████╗  ██║  ███╗    ██████╔╝██║   ██║██╔██╗ ██║██║  ███╗',
    '██║  ██║██╔══╝  ██║   ██║    ██╔══██╗██║   ██║██║╚██╗██║██║   ██║',
    '██████╔╝███████╗╚██████╔╝    ██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝',
    '╚═════╝ ╚══════╝ ╚═════╝     ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ '
  ];
  document.querySelector('.ascii-title').textContent = lines.join('\n');
}

// ---- Фоновые блобы (Color Bends эффект) ----
function initBackgroundBlobs() {
  const container = document.getElementById('bg-container');
  for (let i = 1; i <= 5; i++) {
    const blob = document.createElement('div');
    blob.className = `bg-blob bg-blob--${i}`;
    container.appendChild(blob);
  }

  // Интерактивность — блобы следуют за курсором
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Плавное следование с помощью requestAnimationFrame
  function animateBlobs() {
    currentX += (mouseX - currentX) * 0.02;
    currentY += (mouseY - currentY) * 0.02;

    const blobs = container.querySelectorAll('.bg-blob');
    const offsets = [
      { x: -0.05, y: -0.03 },
      { x: 0.04, y: 0.05 },
      { x: -0.03, y: 0.04 },
      { x: 0.05, y: -0.04 },
      { x: -0.02, y: -0.05 },
    ];
    blobs.forEach((blob, i) => {
      const ox = offsets[i]?.x || 0;
      const oy = offsets[i]?.y || 0;
      const dx = (currentX - window.innerWidth / 2) * ox;
      const dy = (currentY - window.innerHeight / 2) * oy;
      blob.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    requestAnimationFrame(animateBlobs);
  }
  animateBlobs();
}

// ---- Загрузка данных ----
async function fetchSkins() {
  const loadingEl = document.getElementById('loading-state');
  const gridEl = document.getElementById('skin-grid');

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Фильтруем: только с ценой, изображением, без ножей/перчаток (слишком дорогие)
    state.allSkins = data.filter(s =>
      s.price && s.price > 0.01 &&
      s.image &&
      !s.weapon?.includes('Knife') &&
      !s.weapon?.includes('Gloves') &&
      !s.weapon?.includes('Sticker') &&
      !s.weapon?.includes('Key') &&
      !s.weapon?.includes('Case') &&
      !s.weapon?.includes('Capsule') &&
      !s.weapon?.includes('Music Kit') &&
      !s.weapon?.includes('Agent') &&
      !s.weapon?.includes('Patch')
    );

    // Сортируем по цене (дешёвые первыми)
    state.allSkins.sort((a, b) => a.price - b.price);

    // Ограничиваем до 600 скинов для производительности
    state.allSkins = state.allSkins.slice(0, 600);

    // Заполняем фильтры
    populateFilters();

    // Скрываем загрузку, показываем контент
    loadingEl.classList.add('hidden');
    renderCurrentTab();

  } catch (err) {
    console.error('Ошибка загрузки:', err);
    loadingEl.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation text-3xl text-amber-500/50 mb-4"></i>
      <p class="text-white/40 text-sm mb-2">Не удалось загрузить данные о скинах</p>
      <button onclick="fetchSkins()" class="text-amber-400 text-sm hover:underline">Попробовать снова</button>
    `;
  }
}

// ---- Заполнение фильтров ----
function populateFilters() {
  const weaponSelect = document.getElementById('filter-weapon');
  const raritySelect = document.getElementById('filter-rarity');

  // Собираем уникальные оружия из загруженных скинов
  const weapons = [...new Set(state.allSkins.map(s => s.weapon).filter(Boolean))].sort();
  weapons.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    weaponSelect.appendChild(opt);
  });

  // Собираем уникальные редкости
  const rarities = RARITY_ORDER.filter(r => state.allSkins.some(s => s.rarity?.name === r));
  rarities.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    raritySelect.appendChild(opt);
  });
}

// ---- Обработчики событий ----
function setupEventListeners() {
  // Пополнение баланса
  document.getElementById('btn-deposit').addEventListener('click', openDepositModal);
  document.getElementById('modal-close').addEventListener('click', closeDepositModal);
  document.getElementById('modal-deposit').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDepositModal();
  });

  // Быстрые суммы
  document.querySelectorAll('.deposit-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.deposit-amount').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('custom-amount').value = btn.dataset.amount;
      document.getElementById('btn-google-pay').disabled = false;
    });
  });

  // Произвольная сумма
  document.getElementById('custom-amount').addEventListener('input', (e) => {
    document.querySelectorAll('.deposit-amount').forEach(b => b.classList.remove('selected'));
    document.getElementById('btn-google-pay').disabled = !e.target.value || Number(e.target.value) <= 0;
  });

  // Кнопка Google Pay (фейковая)
  document.getElementById('btn-google-pay').addEventListener('click', processDeposit);

  // Вкладки
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Фильтры
  document.getElementById('filter-weapon').addEventListener('change', (e) => {
    state.filters.weapon = e.target.value;
    renderShop();
  });
  document.getElementById('filter-rarity').addEventListener('change', (e) => {
    state.filters.rarity = e.target.value;
    renderShop();
  });
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.filters.search = e.target.value.toLowerCase();
    renderShop();
  });

  // Слоты апгрейдера
  document.getElementById('slot-input').addEventListener('click', () => handleSlotClick('input'));
  document.getElementById('slot-target').addEventListener('click', () => handleSlotClick('target'));

  // Кнопка апгрейда
  document.getElementById('btn-upgrade').addEventListener('click', performUpgrade);

  // Закрытие модалки результата
  document.getElementById('modal-result').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeResultModal();
  });

  // Клавиша Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDepositModal();
      closeResultModal();
      if (state.slotMode) {
        state.slotMode = null;
        updateSlotIndicators();
        renderCurrentTab();
      }
    }
  });
}

// ---- Вкладки ----
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.getElementById('shop-filters').classList.toggle('hidden', tab !== 'shop');
  renderCurrentTab();
}

function renderCurrentTab() {
  if (state.activeTab === 'inventory') {
    renderInventory();
  } else {
    renderShop();
  }
}

// ---- Рендер инвентаря ----
function renderInventory() {
  const grid = document.getElementById('skin-grid');
  const empty = document.getElementById('empty-state');

  document.getElementById('inv-count').textContent = state.inventory.length;

  if (state.inventory.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = state.inventory.map((skin, index) => createSkinCardHTML(skin, 'inventory', index)).join('');

  // Анимация появления
  gsap.fromTo(grid.children,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out' }
  );

  // Навешиваем обработчики
  attachCardListeners(grid);
}

// ---- Рендер магазина ----
function renderShop() {
  const grid = document.getElementById('skin-grid');
  const empty = document.getElementById('empty-state');

  let filtered = [...state.allSkins];

  // Применяем фильтры
  if (state.filters.weapon) {
    filtered = filtered.filter(s => s.weapon === state.filters.weapon);
  }
  if (state.filters.rarity) {
    filtered = filtered.filter(s => s.rarity?.name === state.filters.rarity);
  }
  if (state.filters.search) {
    filtered = filtered.filter(s =>
      (s.name?.toLowerCase().includes(state.filters.search)) ||
      (s.weapon?.toLowerCase().includes(state.filters.search)) ||
      (s.rarity?.name?.toLowerCase().includes(state.filters.search))
    );
  }

  // Ограничиваем вывод для производительности
  filtered = filtered.slice(0, 120);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    empty.querySelector('p').textContent = 'Ничего не найдено. Попробуйте другие фильтры.';
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = filtered.map(skin => createSkinCardHTML(skin, 'shop')).join('');

  gsap.fromTo(grid.children,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.02, ease: 'power2.out' }
  );

  attachCardListeners(grid);
}

// ---- HTML карточки скина ----
function createSkinCardHTML(skin, context, invIndex) {
  const rarityName = skin.rarity?.name || 'Default';
  const rarityColor = RARITY_COLORS[rarityName] || '#b0c3d9';
  const price = skin.price ? `$${skin.price.toFixed(2)}` : 'N/A';
  const isSelected = context === 'inventory' && state.selectedInput === invIndex;

  let actionBtn = '';
  if (context === 'shop') {
    const canAfford = skin.price <= state.balance;
    actionBtn = `<button class="skin-card__action skin-card__action--buy" data-action="buy" ${canAfford ? '' : 'disabled'}>
      ${canAfford ? 'КУПИТЬ' : 'НЕДОСТАТОЧНО'}
    </button>`;
  } else {
    actionBtn = `<button class="skin-card__action skin-card__action--select" data-action="select" data-inv-index="${invIndex}">
      ВЫБРАТЬ
    </button>`;
  }

  return `
    <div class="skin-card ${isSelected ? 'is-selected' : ''}"
         data-skin-id="${skin.id || ''}"
         data-context="${context}"
         data-inv-index="${invIndex !== undefined ? invIndex : ''}">
      <img class="skin-card__image" src="${skin.image}" alt="${skin.name}" loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22125%22><rect fill=%22%230a0a10%22 width=%22200%22 height=%22125%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23333%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2212%22>No Image</text></svg>'">
      <div class="skin-card__rarity-bar" style="background:${rarityColor}"></div>
      <div class="skin-card__info">
        <div class="skin-card__name">${skin.name || 'Unknown'}</div>
        <div class="skin-card__weapon">${skin.weapon || ''}</div>
        <div class="skin-card__price">${price}</div>
        ${actionBtn}
      </div>
    </div>
  `;
}

// ---- Обработчики кликов по карточкам ----
function attachCardListeners(container) {
  container.querySelectorAll('.skin-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Если клик по кнопке действия
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        if (action === 'buy') handleBuy(card);
        if (action === 'select') handleSelectFromInventory(card);
        return;
      }

      // Если активен режим выбора для слота
      if (state.slotMode === 'input') {
        handleSelectFromInventory(card);
      } else if (state.slotMode === 'target') {
        // Целевой скин выбирается из магазина
        handleSelectTargetFromShop(card);
      }
    });
  });
}

// ---- Покупка скина ----
function handleBuy(card) {
  const skinId = card.dataset.skinId;
  const skin = state.allSkins.find(s => String(s.id) === String(skinId));
  if (!skin) return;

  if (skin.price > state.balance) {
    showToast('Недостаточно средств', 'error');
    return;
  }

  state.balance -= skin.price;
  state.inventory.push({ ...skin });
  saveState();
  renderBalance();

  // Анимация карточки
  gsap.to(card, {
    scale: 0.9, opacity: 0.5, duration: 0.15,
    yoyo: true, repeat: 1, ease: 'power2.inOut'
  });

  // Обновляем кнопку
  const btn = card.querySelector('[data-action="buy"]');
  if (btn) {
    btn.textContent = 'НЕДОСТАТОЧНО';
    btn.disabled = true;
  }

  showToast(`${skin.name} добавлен в инвентарь`, 'success');
  document.getElementById('inv-count').textContent = state.inventory.length;
}

// ---- Выбор из инвентаря (для входящего слота) ----
function handleSelectFromInventory(card) {
  const invIndex = parseInt(card.dataset.invIndex);
  if (isNaN(invIndex) || invIndex >= state.inventory.length) return;

  state.selectedInput = invIndex;
  state.slotMode = null;
  updateSlotIndicators();
  renderSlots();
  renderCurrentTab();
  updateUpgradeButton();
}

// ---- Выбор целевого скина из магазина ----
function handleSelectTargetFromShop(card) {
  const skinId = card.dataset.skinId;
  const skin = state.allSkins.find(s => String(s.id) === String(skinId));
  if (!skin) return;

  state.selectedTarget = skin;
  state.slotMode = null;
  updateSlotIndicators();
  renderSlots();
  renderCurrentTab();
  updateUpgradeButton();
}

// ---- Клик по слотам ----
function handleSlotClick(type) {
  // Если слот заполнен — очистить
  if (type === 'input' && state.selectedInput !== null) {
    state.selectedInput = null;
    renderSlots();
    updateUpgradeButton();
    renderCurrentTab();
    return;
  }
  if (type === 'target' && state.selectedTarget !== null) {
    state.selectedTarget = null;
    renderSlots();
    updateUpgradeButton();
    renderCurrentTab();
    return;
  }

  // Активируем режим выбора
  if (state.slotMode === type) {
    state.slotMode = null;
  } else {
    state.slotMode = type;
    // Переключаемся на нужную вкладку
    if (type === 'input' && state.activeTab !== 'inventory') {
      switchTab('inventory');
    } else if (type === 'target' && state.activeTab !== 'shop') {
      switchTab('shop');
    }
  }
  updateSlotIndicators();
  renderCurrentTab();
}

// ---- Индикаторы режима выбора ----
function updateSlotIndicators() {
  // Удаляем старые индикаторы
  document.querySelectorAll('.slot-mode-indicator').forEach(el => el.remove());

  if (state.slotMode === 'input') {
    const slot = document.getElementById('slot-input');
    const ind = document.createElement('div');
    ind.className = 'slot-mode-indicator bg-amber-500/20 text-amber-400 border border-amber-500/30';
    ind.textContent = 'ВЫБЕРИТЕ ИЗ ИНВЕНТАРЯ';
    slot.appendChild(ind);
    slot.classList.add('selected-input');
    slot.classList.remove('selected-target');
  } else if (state.slotMode === 'target') {
    const slot = document.getElementById('slot-target');
    const ind = document.createElement('div');
    ind.className = 'slot-mode-indicator bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    ind.textContent = 'ВЫБЕРИТЕ ИЗ МАГАЗИНА';
    slot.appendChild(ind);
    slot.classList.add('selected-target');
    slot.classList.remove('selected-input');
  } else {
    document.getElementById('slot-input').classList.remove('selected-input', 'selected-target');
    document.getElementById('slot-target').classList.remove('selected-input', 'selected-target');
  }
}

// ---- Рендер слотов ----
function renderSlots() {
  renderSingleSlot('slot-input', state.selectedInput !== null ? state.inventory[state.selectedInput] : null, 'input');
  renderSingleSlot('slot-target', state.selectedTarget, 'target');
  updateProbability();
}

function renderSingleSlot(slotId, skin, type) {
  const slot = document.getElementById(slotId);
  const placeholder = slot.querySelector('.slot-placeholder');
  const content = slot.querySelector('.slot-content');

  if (!skin) {
    placeholder.classList.remove('hidden');
    content.classList.add('hidden');
    content.innerHTML = '';
    slot.classList.remove('filled');
    return;
  }

  placeholder.classList.add('hidden');
  content.classList.remove('hidden');
  content.style.display = 'flex';
  slot.classList.add('filled');

  const rarityColor = RARITY_COLORS[skin.rarity?.name] || '#b0c3d9';

  content.innerHTML = `
    <button class="slot-clear" data-slot-type="${type}"><i class="fa-solid fa-xmark"></i></button>
    <img src="${skin.image}" alt="${skin.name}" class="w-full h-28 object-cover rounded-lg mb-1"
         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22112%22><rect fill=%22%230a0a10%22 width=%22160%22 height=%22112%22/></svg>'">
    <div class="w-full h-0.5 rounded mb-1" style="background:${rarityColor}"></div>
    <p class="text-[10px] text-center leading-tight px-1 line-clamp-2 flex-1">${skin.name}</p>
    <p class="font-mono text-xs font-bold mt-1" style="color:${rarityColor}">$${skin.price?.toFixed(2) || '0.00'}</p>
  `;

  // Обработчик очистки
  content.querySelector('.slot-clear').addEventListener('click', (e) => {
    e.stopPropagation();
    if (type === 'input') state.selectedInput = null;
    if (type === 'target') state.selectedTarget = null;
    renderSlots();
    updateUpgradeButton();
    renderCurrentTab();
  });

  // Анимация появления
  gsap.fromTo(content, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
}

// ---- Вероятность ----
function updateProbability() {
  const display = document.getElementById('probability-display');
  const valueEl = document.getElementById('prob-value');

  if (!state.selectedInput || !state.selectedTarget) {
    display.classList.add('hidden');
    return;
  }

  const inputSkin = state.inventory[state.selectedInput];
  const targetSkin = state.selectedTarget;
  if (!inputSkin || !targetSkin) return;

  let prob = (inputSkin.price / targetSkin.price) * 0.9;
  prob = Math.min(prob, 0.9);
  prob = Math.max(prob, 0.001);

  display.classList.remove('hidden');
  const pct = (prob * 100).toFixed(1);
  valueEl.textContent = `${pct}%`;

  // Цвет в зависимости от вероятности
  if (prob >= 0.5) {
    valueEl.style.color = '#22c55e';
  } else if (prob >= 0.2) {
    valueEl.style.color = '#eab308';
  } else if (prob >= 0.05) {
    valueEl.style.color = '#f97316';
  } else {
    valueEl.style.color = '#ef4444';
  }

  gsap.fromTo(valueEl, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: 'power2.out' });
}

// ---- Кнопка апгрейда ----
function updateUpgradeButton() {
  const btn = document.getElementById('btn-upgrade');
  const hint = document.getElementById('upgrade-hint');

  const ready = state.selectedInput !== null && state.selectedTarget !== null;
  btn.disabled = !ready;

  if (ready) {
    hint.textContent = 'Нажмите для попытки апгрейда';
    hint.style.color = 'rgba(232, 160, 35, 0.4)';
  } else if (state.selectedInput !== null) {
    hint.textContent = 'Теперь выберите целевой скин из магазина';
    hint.style.color = 'rgba(255,255,255,0.25)';
  } else if (state.selectedTarget !== null) {
    hint.textContent = 'Выберите входящий скин из инвентаря';
    hint.style.color = 'rgba(255,255,255,0.25)';
  } else {
    hint.textContent = 'Выберите входящий и целевой скин из инвентаря ниже';
    hint.style.color = 'rgba(255,255,255,0.25)';
  }
}

// ---- Апгрейд ----
function performUpgrade() {
  if (state.selectedInput === null || !state.selectedTarget) return;

  const inputSkin = state.inventory[state.selectedInput];
  const targetSkin = state.selectedTarget;

  let prob = (inputSkin.price / targetSkin.price) * 0.9;
  prob = Math.min(prob, 0.9);
  prob = Math.max(prob, 0.001);

  const success = Math.random() < prob;

  // Анимация: стрелка крутится
  const arrow = document.getElementById('upgrade-arrow');
  arrow.classList.add('arrow-spinning');

  // Анимация: слоты мерцают
  const slotInput = document.getElementById('slot-input');
  const slotTarget = document.getElementById('slot-target');
  slotInput.classList.add('slot-flashing');
  slotTarget.classList.add('slot-flashing');

  // Блокируем кнопку
  const btn = document.getElementById('btn-upgrade');
  btn.disabled = true;

  // Через 1 секунду показываем результат
  setTimeout(() => {
    arrow.classList.remove('arrow-spinning');
    slotInput.classList.remove('slot-flashing');
    slotTarget.classList.remove('slot-flashing');

    if (success) {
      // Удаляем входящий скин из инвентаря
      state.inventory.splice(state.selectedInput, 1);
      // Добавляем целевой
      state.inventory.push({ ...targetSkin });
      saveState();

      showResultModal(true, inputSkin, targetSkin, prob);
      launchConfetti();
      showToast(`Апгрейд успешен! Получен ${targetSkin.name}`, 'success');
    } else {
      // Удаляем входящий скин
      state.inventory.splice(state.selectedInput, 1);
      saveState();

      showResultModal(false, inputSkin, targetSkin, prob);
      showToast('Апгрейд провален. Скин потерян.', 'error');
    }

    // Сброс слотов
    state.selectedInput = null;
    state.selectedTarget = null;
    renderSlots();
    updateUpgradeButton();
    renderBalance();
    document.getElementById('inv-count').textContent = state.inventory.length;

  }, 1000);
}

// ---- Модальное окно результата ----
function showResultModal(success, inputSkin, targetSkin, probability) {
  const modal = document.getElementById('modal-result');
  const content = document.getElementById('result-content');

  const probPct = (probability * 100).toFixed(1);
  const rarityColor = RARITY_COLORS[targetSkin.rarity?.name] || '#b0c3d9';

  if (success) {
    content.className = 'modal-content result-success rounded-2xl p-8 w-full max-w-md mx-4 text-center';
    content.innerHTML = `
      <div class="text-5xl mb-4"><i class="fa-solid fa-check-circle text-emerald-400"></i></div>
      <h2 class="text-2xl font-black text-emerald-400 mb-2">УСПЕХ!</h2>
      <p class="text-white/50 text-sm mb-6">Шанс: ${probPct}%</p>
      <div class="bg-black/30 rounded-xl p-4 mb-6">
        <img src="${targetSkin.image}" alt="${targetSkin.name}" class="w-48 h-28 object-cover mx-auto rounded-lg mb-3"
             onerror="this.style.display='none'">
        <div class="w-16 h-0.5 mx-auto rounded mb-2" style="background:${rarityColor}"></div>
        <p class="font-bold text-sm">${targetSkin.name}</p>
        <p class="font-mono text-lg font-bold mt-1" style="color:${rarityColor}">$${targetSkin.price?.toFixed(2)}</p>
      </div>
      <button onclick="closeResultModal()" class="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-8 py-3 rounded-xl font-bold hover:bg-emerald-500/30 transition-colors">
        ЗАКРЫТЬ
      </button>
    `;
  } else {
    content.className = 'modal-content result-fail rounded-2xl p-8 w-full max-w-md mx-4 text-center';
    content.innerHTML = `
      <div class="text-5xl mb-4"><i class="fa-solid fa-times-circle text-red-400"></i></div>
      <h2 class="text-2xl font-black text-red-400 mb-2">ПРОВАЛ</h2>
      <p class="text-white/50 text-sm mb-6">Шанс: ${probPct}%</p>
      <div class="bg-black/30 rounded-xl p-4 mb-4">
        <p class="text-xs text-white/40 mb-2">Потерянный скин:</p>
        <img src="${inputSkin.image}" alt="${inputSkin.name}" class="w-32 h-20 object-cover mx-auto rounded-lg mb-2 opacity-50"
             onerror="this.style.display='none'">
        <p class="text-sm text-white/50">${inputSkin.name}</p>
      </div>
      <div class="bg-black/30 rounded-xl p-4 mb-6">
        <p class="text-xs text-white/40 mb-2">Целевой скин:</p>
        <img src="${targetSkin.image}" alt="${targetSkin.name}" class="w-32 h-20 object-cover mx-auto rounded-lg mb-2"
             onerror="this.style.display='none'">
        <p class="text-sm">${targetSkin.name}</p>
        <p class="font-mono font-bold" style="color:${rarityColor}">$${targetSkin.price?.toFixed(2)}</p>
      </div>
      <button onclick="closeResultModal()" class="bg-red-500/20 border border-red-500/40 text-red-400 px-8 py-3 rounded-xl font-bold hover:bg-red-500/30 transition-colors">
        ЗАКРЫТЬ
      </button>
    `;
  }

  modal.classList.remove('hidden');
  gsap.fromTo(content, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
}

function closeResultModal() {
  const modal = document.getElementById('modal-result');
  gsap.to(modal.querySelector('.modal-content'), {
    scale: 0.8, opacity: 0, duration: 0.25, ease: 'power2.in',
    onComplete: () => modal.classList.add('hidden')
  });
  renderCurrentTab();
}

// ---- Модальное окно пополнения ----
function openDepositModal() {
  const modal = document.getElementById('modal-deposit');
  modal.classList.remove('hidden');
  // Сброс
  document.querySelectorAll('.deposit-amount').forEach(b => b.classList.remove('selected'));
  document.getElementById('custom-amount').value = '';
  document.getElementById('btn-google-pay').disabled = true;

  gsap.fromTo(modal.querySelector('.modal-content'),
    { scale: 0.9, y: 30, opacity: 0 },
    { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
  );
}

function closeDepositModal() {
  const modal = document.getElementById('modal-deposit');
  gsap.to(modal.querySelector('.modal-content'), {
    scale: 0.9, y: 30, opacity: 0, duration: 0.25, ease: 'power2.in',
    onComplete: () => modal.classList.add('hidden')
  });
}

function processDeposit() {
  const amount = parseFloat(document.getElementById('custom-amount').value);
  if (!amount || amount <= 0 || amount > 99999) {
    showToast('Введите корректную сумму', 'error');
    return;
  }

  // Имитация обработки платежа
  const btn = document.getElementById('btn-google-pay');
  btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div> Обработка...';
  btn.disabled = true;

  setTimeout(() => {
    state.balance += amount;
    saveState();
    renderBalance();

    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/><path d="M5.795 7.095L2.543 4.773C.915 7.072 0 9.86 0 12c0 2.14.915 4.928 2.543 7.227l3.252-2.322C4.613 15.395 4.017 13.812 4.017 12s.596-3.395 1.778-4.905z" fill="#FBBC05"/><path d="M12.24 0C15.48 0 18.19 1.186 20.28 3.074L17.025 6.212C16.131 5.352 14.57 4.363 12.24 4.363c-4.095 0-7.439 3.389-7.439 7.574h-3.806c0-6.635 5.365-11.937 11.745-11.937z" fill="#EA4335"/></svg>
      Оплатить через Google Pay
    `;

    closeDepositModal();
    showToast(`Баланс пополнен на $${amount.toFixed(2)}`, 'success');
  }, 1500);
}

// ---- Баланс ----
function renderBalance() {
  const el = document.getElementById('balance-display');
  const newText = `$${state.balance.toFixed(2)}`;
  if (el.textContent !== newText) {
    gsap.to(el, {
      scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut',
      onComplete: () => { el.textContent = newText; }
    });
    // Обновляем сразу, чтобы не было задержки
    setTimeout(() => { el.textContent = newText; }, 200);
  }
}

// ---- Тосты ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  gsap.fromTo(toast,
    { x: 80, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
  );

  setTimeout(() => {
    gsap.to(toast, {
      x: 80, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => toast.remove()
    });
  }, 3500);
}

// ---- Конфетти при успехе ----
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#e8a023', '#22c55e', '#fbbf24', '#f97316', '#ffffff'];

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1) * 14 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.25 + Math.random() * 0.15,
      opacity: 1,
      decay: 0.008 + Math.random() * 0.008
    });
  }

  let frameId;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      if (p.opacity <= 0) return;
      alive = true;

      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rotation += p.rotSpeed;
      p.opacity -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    });

    if (alive) {
      frameId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(frameId);
    }
  }
  animate();
}

// Ресайз canvas
window.addEventListener('resize', () => {
  const canvas = document.getElementById('confetti-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
