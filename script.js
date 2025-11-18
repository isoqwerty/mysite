// Основной модуль приложения
const FlowerShop = (function() {
    // Конфигурация
    const config = {
        storageKeys: {
            cart: 'flowerShop_cart',
            user: 'flowerShop_user'
        },
        selectors: {
            // Основные элементы
            cartIcon: '#cartIcon',
            cartCount: '#cartCount',
            cartModal: '#cartModal',
            cartItems: '#cartItems',
            cartTotal: '#cartTotal',
            authModal: '#authModal',
            userMenu: '#userMenu',
            userAvatar: '#userAvatar',
            userDropdown: '#userDropdown',
            mobileMenu: '#mobileMenu',
            nav: '#nav',
            
            // Прокрутка товаров
            productsScroll: '#productsScroll',
            scrollPrev: '#scrollPrev',
            scrollNext: '#scrollNext',
            
            // Кнопки
            closeCart: '#closeCart',
            closeAuth: '#closeAuth',
            continueShopping: '#continueShopping',
            checkoutBtn: '#checkoutBtn',
            loginBtn: '#loginBtn',
            registerBtn: '#registerBtn',
            logoutBtn: '#logoutBtn',
            
            // Формы
            loginForm: '#loginForm',
            registerForm: '#registerForm',
            goToRegister: '#goToRegister',
            goToLogin: '#goToLogin',
            
            // Товары
            addToCartButtons: '.product-actions .btn:first-child'
        }
    };

    // Состояние приложения
    let state = {
        cart: [],
        user: null,
        scrollState: {
            isDragging: false,
            startX: 0,
            scrollLeft: 0
        }
    };

    // DOM элементы
    let elements = {};

    // Инициализация приложения
    function init() {
        cacheElements();
        loadFromStorage();
        bindEvents();
        updateUI();
        initHorizontalScroll();
    }

    // Кэширование DOM элементов
    function cacheElements() {
        for (const [key, selector] of Object.entries(config.selectors)) {
            if (selector.startsWith('.')) {
                elements[key] = document.querySelectorAll(selector);
            } else {
                elements[key] = document.querySelector(selector);
            }
        }
    }

    // Загрузка данных из localStorage
    function loadFromStorage() {
        const cartData = localStorage.getItem(config.storageKeys.cart);
        const userData = localStorage.getItem(config.storageKeys.user);
        
        if (cartData) {
            state.cart = JSON.parse(cartData);
        }
        
        if (userData) {
            state.user = JSON.parse(userData);
        }
    }

    // Сохранение данных в localStorage
    function saveToStorage() {
        localStorage.setItem(config.storageKeys.cart, JSON.stringify(state.cart));
        if (state.user) {
            localStorage.setItem(config.storageKeys.user, JSON.stringify(state.user));
        }
    }

    // Привязка событий
    function bindEvents() {
        // Корзина
        elements.cartIcon.addEventListener('click', openCart);
        elements.closeCart.addEventListener('click', closeCart);
        elements.continueShopping.addEventListener('click', closeCart);
        elements.checkoutBtn.addEventListener('click', checkout);
        
        // Авторизация
        elements.loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('login');
        });
        
        elements.registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('register');
        });
        
        elements.logoutBtn.addEventListener('click', logout);
        
        elements.closeAuth.addEventListener('click', closeAuthModal);
        
        // Формы
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.registerForm.addEventListener('submit', handleRegister);
        
        elements.goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('register');
        });
        
        elements.goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('login');
        });
        
        // Навигация
        elements.mobileMenu.addEventListener('click', toggleMobileMenu);
        
        // Выпадающее меню пользователя
        elements.userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
        
        // Закрытие выпадающего меню при клике вне его
        document.addEventListener('click', () => {
            if (elements.userDropdown.classList.contains('active')) {
                elements.userDropdown.classList.remove('active');
            }
        });
        
        // Добавление товаров в корзину
        document.querySelectorAll(config.selectors.addToCartButtons).forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const price = parseInt(this.getAttribute('data-price'));
                addToCart(id, name, price);
            });
        });

        // Плавная прокрутка для якорных ссылок
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    closeMobileMenu();
                }
            });
        });
    }

    // ===== ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА ТОВАРОВ =====
    function initHorizontalScroll() {
        const scroll = elements.productsScroll;
        const prevBtn = elements.scrollPrev;
        const nextBtn = elements.scrollNext;

        // Функция обновления видимости кнопок
        function updateScrollButtons() {
            const maxScroll = scroll.scrollWidth - scroll.clientWidth;
            
            prevBtn.classList.toggle('hidden', scroll.scrollLeft <= 0);
            nextBtn.classList.toggle('hidden', scroll.scrollLeft >= maxScroll - 5);
        }

        // Обработчики для кнопок прокрутки
        prevBtn.addEventListener('click', () => {
            scroll.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            scroll.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });

        // Drag-прокрутка
        let isDown = false;
        let startX;
        let scrollLeft;

        scroll.addEventListener('mousedown', (e) => {
            isDown = true;
            scroll.classList.add('active');
            startX = e.pageX - scroll.offsetLeft;
            scrollLeft = scroll.scrollLeft;
        });

        scroll.addEventListener('mouseleave', () => {
            isDown = false;
            scroll.classList.remove('active');
        });

        scroll.addEventListener('mouseup', () => {
            isDown = false;
            scroll.classList.remove('active');
        });

        scroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scroll.offsetLeft;
            const walk = (x - startX) * 2;
            scroll.scrollLeft = scrollLeft - walk;
        });

        // Touch events для мобильных устройств
        scroll.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - scroll.offsetLeft;
            scrollLeft = scroll.scrollLeft;
        });

        scroll.addEventListener('touchend', () => {
            isDown = false;
        });

        scroll.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - scroll.offsetLeft;
            const walk = (x - startX) * 2;
            scroll.scrollLeft = scrollLeft - walk;
        });

        // Обновление кнопок при прокрутке
        scroll.addEventListener('scroll', updateScrollButtons);

        // Инициализация кнопок
        updateScrollButtons();
    }

    // ===== КОРЗИНА =====
    function openCart() {
        renderCartItems();
        elements.cartModal.classList.add('active');
    }

    function closeCart() {
        elements.cartModal.classList.remove('active');
    }

    function addToCart(id, name, price) {
        const existingItem = state.cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({
                id,
                name,
                price,
                quantity: 1
            });
        }
        
        updateCartCount();
        saveToStorage();
        showNotification('Товар добавлен в корзину!', 'success');
    }

    function removeFromCart(productId) {
        state.cart = state.cart.filter(item => item.id !== productId);
        updateCartCount();
        saveToStorage();
        
        if (elements.cartModal.classList.contains('active')) {
            renderCartItems();
        }
        
        showNotification('Товар удален из корзины', 'error');
    }

    function updateCartItemQuantity(productId, newQuantity) {
        const item = state.cart.find(item => item.id === productId);
        if (item && newQuantity > 0) {
            item.quantity = newQuantity;
            updateCartCount();
            saveToStorage();
            
            if (elements.cartModal.classList.contains('active')) {
                renderCartItems();
            }
        }
    }

    function renderCartItems() {
        if (state.cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Ваша корзина пуста</p>
                </div>
            `;
            elements.cartTotal.textContent = '0 ₽';
            return;
        }
        
        let total = 0;
        const cartItemsHTML = state.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            return `
                <div class="cart-item">
                    <div class="cart-item-img" style="background-color: #ff6b8b;">
                        <i class="fas fa-${getProductIcon(item.id)}"></i>
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${item.price} ₽</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" onclick="FlowerShop.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                               onchange="FlowerShop.updateQuantity('${item.id}', parseInt(this.value))">
                        <button class="quantity-btn plus" onclick="FlowerShop.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">${itemTotal} ₽</div>
                    <div class="remove-item" onclick="FlowerShop.removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `;
        }).join('');
        
        elements.cartItems.innerHTML = cartItemsHTML;
        elements.cartTotal.textContent = `${total} ₽`;
    }

    function getProductIcon(productId) {
        const icons = {
            '1': 'rose',
            '2': 'spa',
            '3': 'seedling',
            '4': 'gift',
            '5': 'tulip',
            '6': 'feather-alt',
            '7': 'tree',
            '8': 'sun'
        };
        return icons[productId] || 'shopping-bag';
    }

    function updateCartCount() {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        elements.cartCount.textContent = totalItems;
    }

    function checkout() {
        if (state.cart.length === 0) {
            showNotification('Ваша корзина пуста!', 'error');
            return;
        }
        
        if (!state.user) {
            showNotification('Для оформления заказа необходимо войти в систему', 'error');
            closeCart();
            openAuthModal('login');
            return;
        }
        
        // В реальном приложении здесь был бы запрос к серверу
        showNotification('Заказ успешно оформлен! С вами свяжутся для подтверждения.', 'success');
        
        // Очищаем корзину после успешного заказа
        state.cart = [];
        updateCartCount();
        saveToStorage();
        renderCartItems();
        closeCart();
    }

    // ===== АВТОРИЗАЦИЯ =====
    function openAuthModal(tab = 'login') {
        elements.authModal.classList.add('active');
        switchAuthTab(tab);
    }

    function closeAuthModal() {
        elements.authModal.classList.remove('active');
        // Очищаем формы
        elements.loginForm.reset();
        elements.registerForm.reset();
    }

    function switchAuthTab(tab) {
        // Обновляем активные табы
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // В реальном приложении здесь была бы проверка на сервере
        if (email && password) {
            state.user = {
                email,
                name: email.split('@')[0],
                isLoggedIn: true
            };
            
            saveToStorage();
            updateUserUI();
            closeAuthModal();
            showNotification(`Добро пожаловать, ${state.user.name}!`, 'success');
        } else {
            showNotification('Пожалуйста, заполните все поля', 'error');
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают!', 'error');
            return;
        }
        
        if (name && email && password) {
            state.user = {
                email,
                name,
                isLoggedIn: true
            };
            
            saveToStorage();
            updateUserUI();
            closeAuthModal();
            showNotification(`Регистрация успешна! Добро пожаловать, ${state.user.name}!`, 'success');
        } else {
            showNotification('Пожалуйста, заполните все поля', 'error');
        }
    }

    function logout() {
        state.user = null;
        saveToStorage();
        updateUserUI();
        elements.userDropdown.classList.remove('active');
        showNotification('Вы успешно вышли из системы.', 'success');
    }

    function updateUserUI() {
        if (state.user && state.user.isLoggedIn) {
            elements.userAvatar.innerHTML = state.user.name.charAt(0).toUpperCase();
            elements.loginBtn.style.display = 'none';
            elements.registerBtn.style.display = 'none';
            elements.logoutBtn.style.display = 'block';
        } else {
            elements.userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            elements.loginBtn.style.display = 'block';
            elements.registerBtn.style.display = 'block';
            elements.logoutBtn.style.display = 'none';
        }
    }

    // ===== УТИЛИТЫ =====
    function toggleMobileMenu() {
        elements.nav.classList.toggle('active');
    }

    function closeMobileMenu() {
        elements.nav.classList.remove('active');
    }

    function toggleUserDropdown() {
        elements.userDropdown.classList.toggle('active');
    }

    function showNotification(message, type = 'success') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function updateUI() {
        updateCartCount();
        updateUserUI();
    }

    // Публичные методы
    return {
        init,
        addToCart,
        removeFromCart,
        updateQuantity: updateCartItemQuantity,
        openAuthModal,
        closeAuthModal
    };
})();

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    FlowerShop.init();
});

// Глобальные функции для обработки событий из HTML
window.FlowerShop = FlowerShop;