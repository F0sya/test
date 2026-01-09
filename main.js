let tg = window.Telegram.WebApp;
tg.expand();

// --- КОНФІГУРАЦІЯ МАГАЗИНУ ---
const shopItems = [
    // type: 'click' - додає до кліку
    // type: 'auto' - додає до пасивного доходу
    { id: 'click1', type: 'click', name: 'Сильний палець', baseCost: 15, increase: 1 },
    { id: 'click2', type: 'click', name: 'Молот', baseCost: 100, increase: 5 },
    { id: 'auto1', type: 'auto', name: 'Студент', baseCost: 50, increase: 1 },
    { id: 'auto2', type: 'auto', name: 'Відеокарта', baseCost: 200, increase: 5 },
    { id: 'auto3', type: 'auto', name: 'Ферма', baseCost: 1000, increase: 25 },
];

// --- СТАН ГРИ ---
let defaultState = {
    score: 0,
    clickPower: 1,
    autoProfit: 0,
    levels: {} // Зберігаємо рівні куплених товарів: { 'click1': 2, 'auto1': 0 }
};

// Завантаження або ініціалізація
let gameState = JSON.parse(localStorage.getItem('clickerDataV2')) || defaultState;

// Заповнюємо рівні нулями, якщо це нова гра
shopItems.forEach(item => {
    if (!gameState.levels[item.id]) {
        gameState.levels[item.id] = 0;
    }
});

// Елементи DOM
const scoreEl = document.getElementById('score');
const profitEl = document.getElementById('profit');
const menuEl = document.getElementById('upgradeMenu');
const arrowIcon = document.getElementById('arrowIcon');

// --- ЛОГІКА ---

function saveState() {
    localStorage.setItem('clickerDataV2', JSON.stringify(gameState));
}

function updateUI() {
    scoreEl.textContent = Math.floor(gameState.score); // Округляємо, бо авто-фарм може давати дробові
    profitEl.textContent = gameState.autoProfit;

    // Оновлюємо кнопки магазину (вкл/викл якщо вистачає грошей)
    renderShop();
}

// Клік
function handleClick(event) {
    gameState.score += gameState.clickPower;
    updateUI();
    saveState();
    tg.HapticFeedback.impactOccurred('light');

    // Анімація зменшення кнопки (візуальний ефект робимо через CSS active, тут логіка)
    createFloatingText(event.clientX, event.clientY, gameState.clickPower);
}

function createFloatingText(x, y, amount) {
    // Створюємо елемент span
    const textEl = document.createElement('span');
    // Додаємо клас для стилів та анімації
    textEl.className = 'floating-text';
    // Встановлюємо текст (наприклад, "+5")
    textEl.textContent = `+${amount}`;

    // Встановлюємо позицію там, де був клік
    // Віднімаємо трохи пікселів, щоб центрувати текст відносно пальця
    textEl.style.left = `${x - 20}px`;
    textEl.style.top = `${y - 30}px`;

    // Додаємо елемент на сторінку (прямо в body)
    document.body.appendChild(textEl);

    // ВАЖЛИВО: Видаляємо елемент після завершення анімації (0.8 секунд),
    // щоб не засмічувати пам'ять браузера тисячами невидимих елементів.
    setTimeout(() => {
        textEl.remove();
    }, 800); // Час має співпадати з тривалістю анімації в CSS
}

// ПАСИВНИЙ ДОХІД (Кожну секунду)
setInterval(() => {
    if (gameState.autoProfit > 0) {
        gameState.score += gameState.autoProfit;
        updateUI();
        saveState();
    }
}, 1000);

// --- МАГАЗИН ---

// Розрахунок поточної ціни: Базова * (1.5 ^ рівень)
function getCost(item) {
    const level = gameState.levels[item.id];
    return Math.floor(item.baseCost * Math.pow(1.5, level));
}

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    const cost = getCost(item);

    if (gameState.score >= cost) {
        gameState.score -= cost;
        gameState.levels[item.id]++;

        if (item.type === 'click') {
            gameState.clickPower += item.increase;
        } else {
            gameState.autoProfit += item.increase;
        }

        updateUI();
        saveState();
        tg.HapticFeedback.notificationOccurred('success');
    } else {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

// Малювання магазину
function renderShop() {
    const clickContainer = document.getElementById('clickUpgrades');
    const autoContainer = document.getElementById('autoUpgrades');

    // Очищаємо, щоб не дублювати (простий варіант)
    clickContainer.innerHTML = '';
    autoContainer.innerHTML = '';

    shopItems.forEach(item => {
        const currentCost = getCost(item);
        const currentLevel = gameState.levels[item.id];
        const canBuy = gameState.score >= currentCost;

        const btnHTML = `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-name">${item.name} (Рівень ${currentLevel})</span>
                    <span class="upgrade-desc">+${item.increase} ${item.type === 'click' ? 'до кліку' : '/ сек'}</span>
                </div>
                <button class="upgrade-btn" 
                        onclick="buyItem('${item.id}')" 
                        ${!canBuy ? 'disabled' : ''}>
                    💰 ${currentCost}
                </button>
            </div>
        `;

        if (item.type === 'click') {
            clickContainer.innerHTML += btnHTML;
        } else {
            autoContainer.innerHTML += btnHTML;
        }
    });
}

// --- МЕНЮ (Шторка) ---
let isMenuOpen = false;

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        menuEl.classList.add('open');
        arrowIcon.textContent = '🔽';
    } else {
        menuEl.classList.remove('open');
        arrowIcon.textContent = '🔼';
    }
}

// Перший запуск
updateUI();