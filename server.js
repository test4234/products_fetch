require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

// Load environment variables
const dbURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  images: [String],
  price: { default: Number },
  regional_prices: { AP: Number, TS: Number },
  availability: [String],
  tags: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema, 'product_items');

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  bufferCommands: false,
})
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    console.log('Fetched Products:', products);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
