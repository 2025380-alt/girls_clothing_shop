// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const db = require('./database'); // our connection pool

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve frontend files

// ---------- API ENDPOINTS (Criteria 2) ----------

// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET products by category
app.get('/api/products/category/:cat', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE category = ?', [req.params.cat]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST update market prices (random multiplier 0.9 - 1.1)
app.post('/api/update-prices', async (req, res) => {
    try {
        const multiplier = 0.9 + (Math.random() * 0.2);
        await db.query('UPDATE products SET price = ROUND(price * ?, 2)', [multiplier]);
        res.json({ message: 'Prices updated to market rate', multiplier: multiplier.toFixed(2) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------- Shopping cart (in-memory for demo) ----------
let cart = [];

app.get('/api/cart', (req, res) => {
    res.json(cart);
});

app.post('/api/cart/add', async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    try {
        const [productRows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (productRows.length === 0) return res.status(404).json({ error: 'Product not found' });
        const product = productRows[0];
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity
        });
        res.json({ message: 'Item added', cart });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cart/remove/:index', (req, res) => {
    const idx = parseInt(req.params.index);
    if (idx >= 0 && idx < cart.length) {
        cart.splice(idx, 1);
        res.json({ message: 'Item removed', cart });
    } else {
        res.status(400).json({ error: 'Invalid index' });
    }
});

app.post('/api/checkout', (req, res) => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart = [];
    res.json({ message: 'Order placed successfully!', total: total.toFixed(2) });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📦 API ready: /api/products, /api/update-prices, /api/cart`);
});