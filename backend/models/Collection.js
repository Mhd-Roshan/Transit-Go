import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle', 
    required: true,
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  collectionDate: {
    type: Date,
    required: true,
  },
});

const Collection = mongoose.model('Collection', CollectionSchema);
export default Collection;