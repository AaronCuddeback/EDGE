const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype is not allowed' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Subject' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); //skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  //resize image
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once written photo to filesystem, keep going
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  await store.save();
  res.flash('success', `Successfully Created ${store.name}.`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  //1. Query the database for a list of all stores
  const stores = await Store.find();
  console.log(stores);
  res.render('stores', { title: 'Subjects', stores });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error(
      'Only the person that entered the subject may edit their entry'
    );
  }
};

exports.editStore = async (req, res) => {
  //1. find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  //2. confirm they are the owner of the store
  confirmOwner(store, req.user);
  //3. render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  //set the location data to be a point
  req.body.location.type = 'Point';
  //find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, //return the new store instead of the old one
    runValidators: true
  }).exec();
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${
      store.slug
    }">View Subject -></a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  //redirect them to the store and tell them it works
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    'author'
  );
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    // first find stores that match
    .find(
      {
        $text: {
          $search: req.query.q
        }
      },
      {
        score: { $meta: 'textScore' }
      }
    )
    // sort the stores
    .sort({
      score: { $meta: 'textScore' }
    })
    //limit to 5 results
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 120000 //120km
      }
    }
  };

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      [operator]: { hearts: req.params.id }
    },
    { new: true }
  );
  res.json(user);
};
