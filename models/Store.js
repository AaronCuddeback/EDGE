const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a subject name.'
  },
  phone: {
    type: Number,
    trim: true,
    required: 'Please enter a subjects last known phone number.'
  },
  birthday: {
    type: String,
    trim: true,
    required: 'Please enter subjects birthday.'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [
      {
        type: Number,
        required: 'Please enter coordinates!'
      }
    ],
    address: {
      type: String,
      required: 'You must supply and address!'
    }
  },
  photo: String
});

storeSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  next();
  //TODO make more resiliant so slugs are unique
});

module.exports = mongoose.model('Store', storeSchema);
