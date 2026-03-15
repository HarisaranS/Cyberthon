const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  content: String,
  author: { name: String, role: String },
  category: String,
  tags: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  readTimeMinutes: { type: Number, default: 5 },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);
