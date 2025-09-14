const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies and allow cross-origin requests
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
const dbURI = 'process.env.MONGODB_URI;';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Define the schema for a Product
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: String,
    image: String,
    description: String,
});
const Product = mongoose.model('Product', productSchema);

// Define a schema for site settings (like logo and shop name)
const settingsSchema = new mongoose.Schema({
  key: String,
  value: String
});
const Setting = mongoose.model('Setting', settingsSchema);

// --- New Order Schema and Model ---
const orderSchema = new mongoose.Schema({
  customerName: String,
  phoneNumber: String,
  address: String,
  paymentMethod: String,
  upiScreenshot: String, // Store the base64 string
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }, // E.g., Pending, Approved, Cancelled
  products: [
    {
      id: Number,
      name: String,
      price: String,
      quantity: Number,
    },
  ],
  total: Number,
});
const Order = mongoose.model('Order', orderSchema);

// --- API ENDPOINTS ---

// GET /products: Fetch all products
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.send(products);
});

// POST /products: Add a new product
app.post('/products', async (req, res) => {
    const product = new Product({
        id: Date.now(), // Create a unique ID
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        description: req.body.description,
    });
    await product.save();
    res.status(201).send(product);
});

// DELETE /products/:id: Delete a product
app.delete('/products/:id', async (req, res) => {
    const result = await Product.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Product not found.' });
    }
    res.send({ message: 'Product deleted successfully.' });
});

// GET /settings: Fetch all settings
app.get('/settings', async (req, res) => {
  const settings = await Setting.find();
  const settingsObject = {};
  settings.forEach(setting => {
    settingsObject[setting.key] = setting.value;
  });
  res.send(settingsObject);
});

// POST /settings/logo: Update the shop logo
app.post('/settings/logo', async (req, res) => {
    const logo = await Setting.findOneAndUpdate(
        { key: 'shopLogo' },
        { value: req.body.logoUrl },
        { upsert: true, new: true }
    );
    res.send(logo);
});

// POST /settings/name: Update the shop name
app.post('/settings/name', async (req, res) => {
    const name = await Setting.findOneAndUpdate(
        { key: 'shopName' },
        { value: req.body.name },
        { upsert: true, new: true }
    );
    res.send(name);
});

// --- New Order Endpoints ---

// POST /orders: Create a new order
app.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).send(newOrder);
    } catch (error) {
        res.status(400).send({ message: "Failed to create order.", error: error.message });
    }
});

// GET /orders: Fetch all orders for the admin panel
app.get('/orders', async (req, res) => {
    const orders = await Order.find();
    res.send(orders);
});

// POST /orders/:id/status: Update the status of an order
app.post('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).send({ message: 'Order not found.' });
        }
        res.send(updatedOrder);
    } catch (error) {
        res.status(400).send({ message: "Failed to update order status.", error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});