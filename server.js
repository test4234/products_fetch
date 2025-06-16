require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

// Load environment variables
const dbURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// Define the schema for product items
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

// Create a model based on the schema
const Product = mongoose.model('Product', productSchema, 'product_items');

// Connect to MongoDB
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

// Define an endpoint to fetch products based on pincode
app.get('/api/products', async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      return res.status(400).json({ message: 'Pincode is required' });
    }

    // Get raw JS objects with lean(), so bracket notation works
    const products = await Product.find({
      [`price_by_pincode.${pincode}.available`]: true,
    }).lean();

    if (!products.length) {
      return res.status(404).json({ message: 'No products available for the selected pincode' });
    }

    // Return only necessary data with selected pincode pricing
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


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
