// Инициализация Three.js (простой шейдер для фона)
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Логика загрузки данных
async function loadSkins() {
    const res = await fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
    const data = await res.json();
    renderSkins(data.slice(0, 6)); // Берем первые 6 для теста
}

function renderSkins(skins) {
    const container = document.getElementById('skins-container');
    skins.forEach(skin => {
        const div = document.createElement('div');
        div.className = 'glass-card border-glow p-4 cursor-pointer';
        div.innerHTML = `<img src="${skin.image}" class="w-full"> <p>${skin.name}</p>`;
        div.onclick = () => performUpgrade(skin);
        container.appendChild(div);
    });
}

function performUpgrade(skin) {
    const priceInput = 50; // Пример цены
    const targetPrice = 100;
    const chance = (priceInput / targetPrice) * 0.9;
    
    if (Math.random() < chance) {
        alert("Успех! Скин добавлен в инвентарь.");
        // Сохранение в localStorage
        const inv = JSON.parse(localStorage.getItem('inventory') || '[]');
        inv.push(skin);
        localStorage.setItem('inventory', JSON.stringify(inv));
    } else {
        alert("Неудача!");
    }
}

document.getElementById('add-funds').onclick = () => document.getElementById('modal').classList.remove('hidden');
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

loadSkins();
