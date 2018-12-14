const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please Supply an Email Address'
  },

  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  }
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
  // return `https://scontent.fsac1-2.fna.fbcdn.net/v/t1.0-9/16939694_627536214120934_4815463030253037492_n.jpg?_nc_cat=107&_nc_ht=scontent.fsac1-2.fna&oh=1776b17f9e91f376ff318cf75a81914c&oe=5CA906CD`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
