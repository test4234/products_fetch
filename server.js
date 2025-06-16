require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  images: [String],
  price_by_pincode: {
    type: Map,
    of: {
      price: Number,
      currency: String,
      stock: Number,
      available: Boolean,
    },
  },
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
}).then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// GET all products for pincode
app.get('/api/products', async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode) return res.status(400).json({ message: 'Pincode is required' });

    const products = await Product.find({ [`price_by_pincode.${pincode}.available`]: true }).lean();

    if (!products.length) return res.status(404).json({ message: 'No products available for the selected pincode' });

    const filtered = products.map(product => {
      const priceData = product.price_by_pincode[pincode];
      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        images: product.images,
        tags: product.tags,
        created_at: product.created_at,
        updated_at: product.updated_at,
        price: priceData.price,
        currency: priceData.currency,
        stock: priceData.stock,
        available: priceData.available,
      };
    });
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// GET product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// GET products by category and pincode
app.get('/api/products/category', async (req, res) => {
  try {
    const { name, pincode } = req.query;
    if (!name || !pincode) return res.status(400).json({ message: 'Category and pincode are required' });

    const products = await Product.find({
      category: name,
      [`price_by_pincode.${pincode}.available`]: true,
    }).lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products by category', error: error.message });
  }
});

// GET categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// POST create a product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// PUT update a product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// GET pincodes for a product
app.get('/api/products/:id/pincodes', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(Object.keys(product.price_by_pincode || {}));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pincodes', error: error.message });
  }
});

// GET search by tag or name
app.get('/api/products/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Query is required' });

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
});

// TODO: Add GET /api/products/recommended when recommendation logic is ready

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
