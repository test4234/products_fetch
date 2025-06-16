require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

const dbURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// 🔁 Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  images: [String],
  tags: [String],
  price_by_pincode: {
    type: Map,
    of: new mongoose.Schema({
      price: Number,
      currency: { type: String, default: 'INR' },
      stock: Number,
      available: Boolean
    }, { _id: false })
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Create model
const Product = mongoose.model('Product', productSchema, 'product_items');

// 🧠 Connect to MongoDB
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  bufferCommands: false,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// 🚀 API: Fetch Products with Filters
app.get('/api/products', async (req, res) => {
  try {
    const { pincode, category, availableOnly } = req.query;

    const filter = {};

    // Optional category filter
    if (category) {
      filter.category = category;
    }

    // Filter by availability and stock at a given pincode
    if (pincode) {
      const availabilityPath = `price_by_pincode.${pincode}.available`;
      filter[availabilityPath] = true;

      if (availableOnly === 'true') {
        const stockPath = `price_by_pincode.${pincode}.stock`;
        filter[stockPath] = { $gt: 0 };
      }
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// 🟢 Server Start
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
