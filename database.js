import mongoose from 'mongoose';

const URI = 'mongodb+srv://Moizez:JJxO8hNDgPGCrVgu@dev.qlw4l.mongodb.net/my-friend-running?retryWrites=true&w=majority';
//JJxO8hNDgPGCrVgu
let options = {};

// mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
// mongoose.set('useCreateIndex', true);
// mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(URI, options)
  .then(() => console.log('DB is Up!'))
  .catch((err) => console.log(err));