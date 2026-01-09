// Ініціалізація Telegram Web App
    let tg = window.Telegram.WebApp;
    tg.expand(); // Розгортаємо на весь екран

    // --- ЛОГІКА ГРИ ---

    // Стан гри за замовчуванням
    let defaultState = {
        score: 0,
        power: 1,
        cost: 10
    };

    // Завантажуємо збережений стан з LocalStorage або беремо дефолтний
    let gameState = JSON.parse(localStorage.getItem('clickerData')) || defaultState;

    // Елементи інтерфейсу
    const scoreEl = document.getElementById('score');
    const powerEl = document.getElementById('power');
    const costEl = document.getElementById('cost');
    const upgradeBtn = document.getElementById('upgradeBtn');

    // Функція оновлення інтерфейсу
    function updateUI() {
        scoreEl.textContent = gameState.score;
        powerEl.textContent = gameState.power;
        costEl.textContent = gameState.cost;

        // Блокуємо кнопку покращення, якщо не вистачає грошей
        if (gameState.score < gameState.cost) {
            upgradeBtn.disabled = true;
        } else {
            upgradeBtn.disabled = false;
        }
    }

    // Функція збереження
    function saveState() {
        localStorage.setItem('clickerData', JSON.stringify(gameState));
    }

    // Обробник кліку
    function handleClick() {
        gameState.score += gameState.power;
        updateUI();
        saveState();
        // Вібрація при кліку (працює тільки на телефонах в ТГ)
        tg.HapticFeedback.impactOccurred('light');
    }

    // Обробник покращення
    function handleUpgrade() {
        if (gameState.score >= gameState.cost) {
            gameState.score -= gameState.cost;
            gameState.power += 1;
            // Ціна росте в 1.5 рази
            gameState.cost = Math.round(gameState.cost * 1.5);
            updateUI();
            saveState();
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // Запускаємо оновлення інтерфейсу при старті
    updateUI();