import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVaultEntry extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  username: string;
  encrypted_password: string;
  url: string;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VaultEntrySchema: Schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    encrypted_password: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const VaultEntry: Model<IVaultEntry> =
  mongoose.models.VaultEntry || mongoose.model<IVaultEntry>('VaultEntry', VaultEntrySchema);

export default VaultEntry;
