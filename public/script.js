// --- HTML ELEMENTLERİNİ SEÇME ---
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const productsGrid = document.getElementById('productsGrid');
const totalPriceContainer = document.getElementById('totalPriceContainer');
const totalPriceSpan = document.getElementById('totalPrice');

// Backend'den dinamik olarak çekeceğimiz ürün havuzu
let allProducts = [];

const categoryTranslations = {
    "CPU": "İşlemci (CPU)",
    "GPU": "Ekran Kartı (GPU)",
    "Motherboard": "Anakart",
    "RAM": "Bellek (RAM)",
    "Power": "Güç Kaynağı (PSU)",
    "SSD": "Depolama (SSD)",
    "Case": "Kasa (Case)"
};

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        allProducts = data.map(product => ({
            ...product,
            category: categoryTranslations[product.category] || product.category
        }));
    } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
    }
}

// Sayfa yüklendiğinde ürünleri yükle
loadProducts();

// --- GÖNDERME FONKSİYONU ---
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';

    const loadingMessageId = appendMessage('🤖 Yapay zeka düşünüyor, lütfen bekleyin...', 'ai-message');

    try {
        const response = await fetch('/api/recommend-pc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: text })
        });

        const data = await response.json();
        document.getElementById(loadingMessageId).remove();

        if (data.error) {
            appendMessage("Bir hata oluştu: " + data.error, 'ai-message');
            return;
        }

        // AI mesajındaki markdown (**) işaretlerini temizleyip ekrana bas
        const cleanedText = data.ai_explanation.replace(/\*\*/g, '');
        appendMessage(cleanedText, 'ai-message');

        // Gerçek fiyatları da renderProducts'a gönder
        renderProducts(data.recommended_product_ids, data.total_price, data.price_overrides || {});

    } catch (error) {
        console.error("Hata:", error);
        document.getElementById(loadingMessageId).remove();
        appendMessage("Sunucuya bağlanılamadı. Lütfen backend'in çalıştığından emin olun.", 'ai-message');
    }
}

// --- MESAJ BALONU OLUŞTURMA ---
function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    const id = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    msgDiv.id = id;
    msgDiv.className = `message ${className}`;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
}

// --- ÖNERİLEN ÜRÜNLERİ DİNAMİK OLARAK BASMA ---
// priceOverrides: { productId: gercekFiyat } — gerçek piyasa fiyatları
function renderProducts(productIds, totalPrice, priceOverrides = {}) {
    productsGrid.innerHTML = '';

    const categories = new Set();
    productIds.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) categories.add(product.category);
    });

    const hasCPU = [...categories].some(c => c.includes("İşlemci") || c.includes("CPU"));
    const hasGPU = [...categories].some(c => c.includes("Ekran Kartı") || c.includes("GPU"));
    const hasMB = [...categories].some(c => c.includes("Anakart"));
    const hasRAM = [...categories].some(c => c.includes("Bellek") || c.includes("RAM"));
    const hasPSU = [...categories].some(c => c.includes("Güç Kaynağı") || c.includes("PSU"));
    const hasSSD = [...categories].some(c => c.includes("Depolama") || c.includes("SSD"));
    const hasCase = [...categories].some(c => c.includes("Kasa") || c.includes("Case"));

    const isFullSystem = hasCPU && hasGPU && hasMB && hasRAM && hasPSU && hasSSD && hasCase;

    if (isFullSystem) {
        totalPriceContainer.style.display = 'block';
        totalPriceSpan.innerText = totalPrice.toLocaleString('tr-TR');
    } else {
        totalPriceContainer.style.display = 'none';
    }

    productIds.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) {
            // Gerçek piyasa fiyatı varsa onu kullan, yoksa veritabanı fiyatını kullan
            const displayPrice = priceOverrides[id] || product.price;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div>
                    <div class="product-badge">${product.category}</div>
                    <div class="product-title">${product.model}</div>
                    <div class="product-brand">${product.brand}</div>
                </div>
                <div>
                    <div class="product-price">${displayPrice.toLocaleString('tr-TR')} TL</div>
                    <button class="buy-btn" data-id="${product.id}">Sepete Ekle</button>
                </div>
            `;
            productsGrid.appendChild(card);
        }
    });
}

// --- EVENT LISTENERS ---
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

// =========================================================
// --- ÜYELİK VE SEPET SİSTEMİ (LOCAL STORAGE DESTEKLİ) ---
// =========================================================

const loginBtn = document.getElementById('loginBtn');
const authArea = document.getElementById('authArea');
const welcomeMsg = document.getElementById('welcomeMsg');
const loggedInUserSpan = document.getElementById('loggedInUser');
const cartCountSpan = document.getElementById('cartCount');
const cartBtn = document.getElementById('cartBtn');

// Modal Elementleri
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');

// Yeni Eklenen Elementler
const nameGroup = document.getElementById('nameGroup');
const nameInput = document.getElementById('nameInput');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const authMessage = document.getElementById('authMessage');
const emailLabel = document.getElementById('emailLabel');

// Sayfa yüklendiğinde tarayıcı hafızasından verileri çek
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Arayüzü hafızadaki verilere göre güncelle
function updateAuthUI() {
    const ordersBtn = document.getElementById('ordersBtn');
    if (currentUser) {
        loginBtn.innerText = "Çıkış Yap";
        loginBtn.style.backgroundColor = "#ef4444";
        welcomeMsg.style.display = "inline";
        loggedInUserSpan.innerText = currentUser.name || currentUser.email.split('@')[0];
        if (ordersBtn) ordersBtn.style.display = "inline-block";
    } else {
        loginBtn.innerText = "Giriş Yap";
        loginBtn.style.backgroundColor = "#3b82f6";
        welcomeMsg.style.display = "none";
        if (ordersBtn) ordersBtn.style.display = "none";
    }
    cartCountSpan.innerText = cart.length;
}
updateAuthUI();

// Özel Bildirim/Hata Mesajı Yönetimi
function showAuthMessage(msg, type = 'error') {
    if (!authMessage) return;
    authMessage.innerText = msg;
    authMessage.style.display = 'block';
    if (type === 'success') {
        authMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        authMessage.style.color = '#10b981';
        authMessage.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else {
        authMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        authMessage.style.color = '#f87171';
        authMessage.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    }
}

function clearAuthMessage() {
    if (authMessage) {
        authMessage.style.display = 'none';
        authMessage.innerText = '';
    }
}

// Modal Aç / Kapat / Çıkış Yap
let authMode = 'login';

function toggleAuth() {
    const modalTitle = loginModal.querySelector('h2');
    const authToggleText = document.getElementById('authToggleText');

    clearAuthMessage();

    if (authMode === 'login') {
        authMode = 'signup';
        if (modalTitle) modalTitle.innerText = "Kayıt Ol";
        submitLoginBtn.innerText = "Kayıt Ol";
        if (nameGroup) nameGroup.style.display = 'flex';
        if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'flex';
        if (emailLabel) emailLabel.innerText = "E-posta";
        if (authToggleText) {
            authToggleText.innerHTML = `Zaten hesabınız var mı? <a href="#" id="toggleAuthBtn" style="color: #10b981; text-decoration: none; font-weight: 600;">Giriş Yap</a>`;
        }
    } else {
        authMode = 'login';
        if (modalTitle) modalTitle.innerText = "Kullanıcı Girişi";
        submitLoginBtn.innerText = "Giriş Yap";
        if (nameGroup) nameGroup.style.display = 'none';
        if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        if (emailLabel) emailLabel.innerText = "E-posta veya Kullanıcı Adı";
        if (authToggleText) {
            authToggleText.innerHTML = `Hesabınız yok mu? <a href="#" id="toggleAuthBtn" style="color: #10b981; text-decoration: none; font-weight: 600;">Kayıt Ol</a>`;
        }
    }
}

// Modal içi tıklamalar için delegasyon
loginModal.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'toggleAuthBtn') {
        e.preventDefault();
        toggleAuth();
    }
});

loginBtn.addEventListener('click', () => {
    if (!currentUser) {
        authMode = 'signup';
        toggleAuth();
        loginModal.style.display = 'flex';
    } else {
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        currentUser = null;
        cart = [];
        updateAuthUI();
    }
});

closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
    if (nameInput) nameInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    clearAuthMessage();
});

// Form Gönderimi (Giriş Yap veya Kayıt Ol)
submitLoginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();

    clearAuthMessage();

    if (authMode === 'signup') {
        const name = nameInput.value.trim();
        const confirmPass = confirmPasswordInput.value.trim();

        if (!name || !email || !pass || !confirmPass) { showAuthMessage("Lütfen tüm alanları doldurun!"); return; }
        if (name.length < 3) { showAuthMessage("Ad Soyad en az 3 karakter olmalıdır!"); return; }
        if (!email.includes('@')) { showAuthMessage("Lütfen geçerli bir e-posta adresi girin!"); return; }
        if (pass.length < 6) { showAuthMessage("Şifreniz en az 6 karakter olmalıdır!"); return; }
        if (pass !== confirmPass) { showAuthMessage("Şifreler uyuşmuyor!"); return; }

        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const userExists = registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase());

        if (userExists) { showAuthMessage("Bu e-posta adresi zaten kayıtlı!"); return; }

        registeredUsers.push({ name, email, password: pass });
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        showAuthMessage("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...", "success");

        setTimeout(() => {
            toggleAuth();
            emailInput.value = email;
            passwordInput.value = '';
            if (nameInput) nameInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        }, 1500);

    } else {
        if (!email || !pass) { showAuthMessage("Lütfen e-posta ve şifrenizi girin!"); return; }

        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

        if (user) {
            currentUser = { email: user.email, name: user.name };
            localStorage.setItem('user', JSON.stringify(currentUser));
            loginModal.style.display = 'none';
            emailInput.value = '';
            passwordInput.value = '';
            updateAuthUI();
        } else {
            showAuthMessage("E-posta veya şifre hatalı!");
        }
    }
});

// Ürün Sepete Ekleme
productsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('buy-btn')) {
        if (!currentUser) {
            loginModal.style.display = 'flex';
            return;
        }

        const productId = parseInt(e.target.getAttribute('data-id'));
        const product = allProducts.find(p => p.id === productId);

        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateAuthUI();

        const originalText = e.target.innerText;
        e.target.innerText = "✓ Eklendi";
        e.target.style.backgroundColor = "#10b981";
        e.target.disabled = true;
        setTimeout(() => {
            e.target.innerText = originalText;
            e.target.style.backgroundColor = "#3b82f6";
            e.target.disabled = false;
        }, 1000);
    }
});

// Sepet Butonuna Tıklayınca Checkout Sayfasına Git
cartBtn.addEventListener('click', () => {
    if (!currentUser) {
        loginModal.style.display = 'flex';
        return;
    }
    window.location.href = '/cart.html';
});

// --- SİPARİŞ GEÇMİŞİ MODAL VE LİSTELEME MANTIĞI ---
const ordersBtn = document.getElementById('ordersBtn');
const ordersModal = document.getElementById('ordersModal');
const closeOrdersModal = document.getElementById('closeOrdersModal');
const ordersList = document.getElementById('ordersList');

if (ordersBtn) {
    ordersBtn.addEventListener('click', () => {
        renderOrders();
        ordersModal.style.display = 'flex';
    });
}

if (closeOrdersModal) {
    closeOrdersModal.addEventListener('click', () => {
        ordersModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === ordersModal) ordersModal.style.display = 'none';
    if (e.target === loginModal) loginModal.style.display = 'none';
});

function renderOrders() {
    if (!ordersList || !currentUser) return;

    ordersList.innerHTML = '';
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(o => o.userEmail === currentUser.email);

    if (userOrders.length === 0) {
        ordersList.innerHTML = '<p style="color: #94a3b8; text-align: center; margin-top: 20px;">Henüz hiç siparişiniz bulunmuyor.</p>';
        return;
    }

    userOrders.reverse().forEach(order => {
        const orderBox = document.createElement('div');
        orderBox.style.cssText = 'background-color: rgba(35, 40, 64, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); padding: 15px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);';

        const itemsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #cbd5e1;">
                <span>• ${item.brand} ${item.model}</span>
                <span style="font-weight: 600; color: #10b981;">${item.price.toLocaleString('tr-TR')} TL</span>
            </div>
        `).join('');

        orderBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #10b981; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px; margin-bottom: 10px; font-size: 0.95rem;">
                <span>Sipariş No: ${order.id}</span>
                <span style="color: #94a3b8; font-weight: normal;">${order.date} ${order.time}</span>
            </div>
            <div style="margin-bottom: 10px;">${itemsHtml}</div>
            <div style="border-top: 1px dashed rgba(255, 255, 255, 0.08); padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="max-width: 65%; text-align: left; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
                    <div><strong>Tel:</strong> ${order.phone}</div>
                    <div style="margin-top: 2px; word-break: break-word;"><strong>Adres:</strong> ${order.address}</div>
                </div>
                <div style="font-size: 1.15rem; font-weight: bold; color: #10b981;">
                    Toplam: ${order.total.toLocaleString('tr-TR')} TL
                </div>
            </div>
        `;
        ordersList.appendChild(orderBox);
    });
}