const mongoose = require('mongoose');

const seenCelebritySchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    ref: 'User'
  },
  celebrity_name: {
    type: String,
    required: true
  },
  seen_date: {
    type: Date,
    default: Date.now
  },
  found: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index composé pour éviter les doublons
seenCelebritySchema.index({ user_id: 1, celebrity_name: 1 }, { unique: true });

module.exports = mongoose.model('SeenCelebrity', seenCelebritySchema); 