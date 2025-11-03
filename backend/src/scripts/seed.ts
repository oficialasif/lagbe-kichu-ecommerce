import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Product from '../models/Product.model';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lagbe-kichu');
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - uncomment if you want fresh seed)
    // await User.deleteMany({});
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    // console.log('🗑️  Cleared existing data\n');

    // Create sample users
    console.log('📝 Creating sample users...');
    
    const seller = await User.findOne({ email: 'seller@example.com' });
    if (!seller) {
      const newSeller = await User.create({
        name: 'John Seller',
        email: 'seller@example.com',
        password: 'seller123',
        role: 'seller',
        phone: '+1234567890',
        address: '123 Seller Street, City',
      });
      console.log(`✅ Created seller: ${newSeller.email}`);
    } else {
      console.log(`ℹ️  Seller already exists: ${seller.email}`);
    }

    const buyer = await User.findOne({ email: 'buyer@example.com' });
    if (!buyer) {
      const newBuyer = await User.create({
        name: 'Jane Buyer',
        email: 'buyer@example.com',
        password: 'buyer123',
        role: 'buyer',
        phone: '+0987654321',
        address: '456 Buyer Avenue, City',
      });
      console.log(`✅ Created buyer: ${newBuyer.email}`);
    } else {
      console.log(`ℹ️  Buyer already exists: ${buyer.email}`);
    }

    const sellerUser = seller || await User.findOne({ email: 'seller@example.com' });
    const buyerUser = buyer || await User.findOne({ email: 'buyer@example.com' });

    // Create sample categories
    console.log('\n📝 Creating sample categories...');
    
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true },
      { name: 'Clothing', description: 'Apparel and fashion items', isActive: true },
      { name: 'Books', description: 'Books and literature', isActive: true },
      { name: 'Home & Kitchen', description: 'Home and kitchen products', isActive: true },
      { name: 'Sports', description: 'Sports and fitness equipment', isActive: true },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const category = await Category.create({
          ...cat,
          createdBy: sellerUser?._id,
        });
        createdCategories.push(category);
        console.log(`✅ Created category: ${category.name}`);
      } else {
        createdCategories.push(existing);
        console.log(`ℹ️  Category already exists: ${existing.name}`);
      }
    }

    // Create sample products
    console.log('\n📝 Creating sample products...');
    
    const sampleProducts = [
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
        category: 'Electronics',
        price: 2999,
        discountPrice: 2499,
        discountEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        stock: 50,
        images: ['https://via.placeholder.com/500x500?text=Headphones'],
        features: ['Noise Cancellation', '30hr Battery', 'Wireless', 'Bluetooth 5.0'],
        isHotCollection: true,
        brand: 'TechBrand',
        isActive: true,
      },
      {
        title: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors. Perfect for casual wear.',
        category: 'Clothing',
        price: 599,
        stock: 100,
        images: ['https://via.placeholder.com/500x500?text=T-Shirt'],
        features: ['100% Cotton', 'Machine Washable', 'Multiple Colors'],
        isActive: true,
      },
      {
        title: 'Programming Book - Learn JavaScript',
        description: 'Comprehensive guide to JavaScript programming for beginners and advanced developers.',
        category: 'Books',
        price: 899,
        discountPrice: 749,
        stock: 30,
        images: ['https://via.placeholder.com/500x500?text=Book'],
        features: ['500+ Pages', 'Examples Included', 'Beginner Friendly'],
        isActive: true,
      },
      {
        title: 'Smart Coffee Maker',
        description: 'Automated coffee maker with app control and scheduling features.',
        category: 'Home & Kitchen',
        price: 4999,
        discountPrice: 3999,
        discountEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        stock: 25,
        images: ['https://via.placeholder.com/500x500?text=Coffee+Maker'],
        features: ['App Control', 'Scheduling', 'Auto Brew'],
        isHotCollection: true,
        brand: 'HomeTech',
        weight: 5.2,
        dimensions: '30x25x40 cm',
        warranty: '1 Year Warranty',
        isActive: true,
      },
      {
        title: 'Yoga Mat Premium',
        description: 'Premium quality yoga mat with non-slip surface. Perfect for yoga and fitness.',
        category: 'Sports',
        price: 1299,
        stock: 75,
        images: ['https://via.placeholder.com/500x500?text=Yoga+Mat'],
        features: ['Non-Slip', 'Eco-Friendly', 'Thick Padding'],
        isActive: true,
      },
    ];

    let productsCreated = 0;
    let productsSkipped = 0;
    
    for (const productData of sampleProducts) {
      const existing = await Product.findOne({ title: productData.title });
      if (!existing && sellerUser) {
        await Product.create({
          ...productData,
          seller: sellerUser._id,
        });
        productsCreated++;
        console.log(`✅ Created product: ${productData.title}`);
      } else {
        productsSkipped++;
        console.log(`ℹ️  Product already exists: ${productData.title}`);
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   Users: Seller and Buyer accounts`);
    console.log(`   Categories: ${createdCategories.length} categories`);
    console.log(`   Products: ${productsCreated} created, ${productsSkipped} skipped`);
    console.log('\n✅ Database seeding completed!');
    console.log('\n📋 Test Credentials:');
    console.log('   Seller: seller@example.com / seller123');
    console.log('   Buyer: buyer@example.com / buyer123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding database:', error.message || error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();

