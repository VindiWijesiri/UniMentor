import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  materialPriceCap: number;
}

interface SettingsModel extends Model<ISettings> {
  getApp(): Promise<ISettings>;
}

const settingsSchema = new Schema<ISettings, SettingsModel>(
  {
    key: { type: String, unique: true, default: 'app' },
    materialPriceCap: { type: Number, default: 2500, min: 0 },
  },
  { timestamps: true }
);

settingsSchema.statics.getApp = async function getApp(): Promise<ISettings> {
  const existing = await this.findOne({ key: 'app' });
  if (existing) return existing;
  return this.create({ key: 'app', materialPriceCap: 2500 });
};

const Settings = mongoose.model<ISettings, SettingsModel>('Settings', settingsSchema);
export default Settings;
