const PlatformSetting = require("../models/PlatformSetting");

async function getPlatformSetting(key, fallback = null) {
  const setting = await PlatformSetting.findOne({ key });
  if (setting) {
    return setting.value;
  }
  return fallback;
}

async function setPlatformSetting(key, value) {
  const setting = await PlatformSetting.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
  return setting;
}

module.exports = {
  getPlatformSetting,
  setPlatformSetting,
};
