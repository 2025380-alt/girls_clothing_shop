/**
 * Bloom & Co. – Frontend JavaScript
 * Handles: product loading, cart, market price update, search, contact form
 */

const API_BASE = '/api';

// Helper: escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== CARD GENERATION ==========
function createProductCard(product) {
    const imgUrl = product.image_url || 'https://picsum.photos/id/1/400/300';
    return `
        <div class="product-card">
            <img class="product-image" src="${imgUrl}" alt="${escapeHtml(product.name)}" onerror="this.src='https://picsum.photos/id/20/400/300'">
            <div class="product-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-description">${escapeHtml(product.description || '')}</div>
                <div class="product-price">€${(+product.price).toFixed(2)}</div>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
}

// ========== CART COUNT BADGE ==========
async function updateCartCount() {
    try {
        const res = await fetch(`${API_BASE}/cart`);
        const cart = await res.json();
        const span = document.getElementById('cartCount');
        if (span) span.innerText = cart.length;
    } catch (err) { console.warn(err); }
}

// ========== FEATURED PRODUCTS (HOME) ==========
async function loadFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        const featured = products.slice(0, 6);
        grid.innerHTML = '';
        featured.forEach(p => grid.innerHTML += createProductCard(p));
        attachAddToCartEvents();
    } catch (err) {
        grid.innerHTML = '<p>Failed to load products. Is server running?</p>';
    }
}

// ========== ALL PRODUCTS (SHOP) ==========
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        grid.innerHTML = '';
        products.forEach(p => grid.innerHTML += createProductCard(p));
        attachAddToCartEvents();
    } catch (err) {
        grid.innerHTML = '<p>Error loading products.</p>';
    }
}

// ========== MINI CART SUMMARY (on shop page) ==========
async function updateCartSummary() {
    try {
        const res = await fetch(`${API_BASE}/cart`);
        const cart = await res.json();
        const summaryDiv = document.getElementById('cartSummary');
        const totalSpan = document.getElementById('cartPreviewTotal');
        if (!summaryDiv) return;
        if (cart.length === 0) {
            summaryDiv.innerHTML = '<p class="empty-cart-mini">Your cart is empty</p>';
            if (totalSpan) totalSpan.innerText = '€0.00';
            return;
        }
        let html = '<ul class="mini-cart-list" style="list-style:none;">';
        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `<li>${escapeHtml(item.name)} x${item.quantity} – €${itemTotal.toFixed(2)}</li>`;
        });
        html += '</ul>';
        summaryDiv.innerHTML = html;
        if (totalSpan) totalSpan.innerText = `€${total.toFixed(2)}`;
    } catch (err) { console.warn(err); }
}

// ========== ADD TO CART HANDLER ==========
function attachAddToCartEvents() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.removeEventListener('click', addToCartHandler);
        btn.addEventListener('click', addToCartHandler);
    });
}
async function addToCartHandler(e) {
    const id = e.currentTarget.dataset.id;
    try {
        const res = await fetch(`${API_BASE}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, quantity: 1 })
        });
        if (res.ok) {
            await updateCartCount();
            await updateCartSummary();
            if (!window.location.pathname.includes('cart.html')) alert('Added to cart');
            if (window.location.pathname.includes('cart.html')) loadCartPage();
        } else alert('Failed');
    } catch (err) { alert('Error'); }
}

// ========== REMOVE FROM CART ==========
async function removeFromCart(index) {
    try {
        const res = await fetch(`${API_BASE}/cart/remove/${index}`, { method: 'DELETE' });
        if (res.ok) {
            await updateCartCount();
            await updateCartSummary();
            loadCartPage();
        } else alert('Could not remove');
    } catch (err) { alert('Error'); }
}

// ========== FULL CART PAGE ==========
async function loadCartPage() {
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('cartTotal');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/cart`);
        const cart = await res.json();
        if (cart.length === 0) {
            container.innerHTML = '<p>Your cart is empty. <a href="shop.html">Shop now</a></p>';
            if (totalSpan) totalSpan.innerText = '€0.00';
            return;
        }
        let html = '', total = 0;
        cart.forEach((item, idx) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `<div class="cart-item">
                        <div><strong>${escapeHtml(item.name)}</strong> × ${item.quantity}</div>
                        <div>€${itemTotal.toFixed(2)} <button class="remove-cart-btn" data-index="${idx}">Remove</button></div>
                    </div>`;
        });
        container.innerHTML = html;
        totalSpan.innerText = `€${total.toFixed(2)}`;
        document.querySelectorAll('.remove-cart-btn').forEach(btn => {
            btn.onclick = () => removeFromCart(btn.dataset.index);
        });
    } catch (err) { container.innerHTML = '<p>Error loading cart</p>'; }
}

// ========== MARKET PRICE UPDATE ==========
async function updateMarketPrices() {
    const btn = document.getElementById('updateMarketBtn');
    if (!btn) return;
    const original = btn.innerText;
    btn.innerText = 'Updating...';
    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/update-prices`, { method: 'POST' });
        const data = await res.json();
        alert(`Prices updated! Multiplier: ${data.multiplier}x`);
        if (window.location.pathname.includes('shop.html')) loadProducts();
        if (window.location.pathname.includes('index.html')) loadFeaturedProducts();
    } catch (err) { alert('Error updating prices'); }
    finally { btn.innerText = original; btn.disabled = false; }
}

// ========== CHECKOUT ==========
async function checkout() {
    try {
        const res = await fetch(`${API_BASE}/checkout`, { method: 'POST' });
        const data = await res.json();
        alert(`Order placed! Total: €${data.total}`);
        await updateCartCount();
        await updateCartSummary();
        if (window.location.pathname.includes('cart.html')) loadCartPage();
        else window.location.href = 'cart.html';
    } catch (err) { alert('Checkout failed'); }
}

// ========== LIVE SEARCH FILTER ==========
function setupProductFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', async () => {
        const term = searchInput.value.toLowerCase();
        const res = await fetch(`${API_BASE}/products`);
        const all = await res.json();
        const filtered = all.filter(p => p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)));
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '';
            filtered.forEach(p => grid.innerHTML += createProductCard(p));
            attachAddToCartEvents();
        }
    });
}

// ========== CONTACT FORM VALIDATION ==========
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const msg = document.getElementById('message').value.trim();
        const fb = document.getElementById('formFeedback');
        if (!name || !email || !msg) {
            fb.innerText = 'Name, email and message are required.';
            fb.style.color = '#d9534f';
            return;
        }
        if (!email.includes('@')) {
            fb.innerText = 'Valid email required.';
            fb.style.color = '#d9534f';
            return;
        }
        fb.innerText = 'Thank you! We will reply soon.';
        fb.style.color = '#e85d8a';
        form.reset();
    };
}

// ========== NEWSLETTER (optional) ==========
function setupNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value.trim();
        const fb = document.getElementById('newsletterFeedback');
        if (!email || !email.includes('@')) {
            fb.innerText = 'Valid email required.';
            fb.style.color = '#d9534f';
        } else {
            fb.innerText = 'Subscribed! (demo)';
            fb.style.color = '#e85d8a';
            form.reset();
        }
    };
}

// ========== INITIALISE BASED ON PAGE ==========
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadFeaturedProducts();
        setupNewsletter();
    }
    if (window.location.pathname.includes('shop.html')) {
        loadProducts();
        setupProductFilter();
        updateCartSummary();
        document.getElementById('updateMarketBtn')?.addEventListener('click', updateMarketPrices);
    }
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
        document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    }
    setupContactForm();
});