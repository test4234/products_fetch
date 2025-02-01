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
  images: [String],  // Array of image URLs or file paths
  price: { default: Number },  // Default price for the product
  regional_prices: {
    AP: Number,  // Price for the Andhra Pradesh region
    TS: Number,  // Price for the Telangana region
  },
  availability: [String],  // Array of available locations or statuses
  tags: [String],  // Array of tags for categorization or features
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

// Define an endpoint to fetch products with optional category filter
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;  // Get category from the query parameters
    
    let filter = {};  // Default filter is an empty object, meaning no filter
    
    if (category) {
      filter.category = category;  // If category is provided, add it to the filter
    }

    const products = await Product.find(filter);  // Fetch products based on the filter
    console.log('Fetched Products:', products);  // Log the fetched products
    res.json(products);  // Send the data as JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
