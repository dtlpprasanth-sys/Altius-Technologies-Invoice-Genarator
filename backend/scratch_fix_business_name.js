const { Settings } = require('./models');
const { connectDB } = require('./config/db');

const fixBusinessName = async () => {
  try {
    await connectDB();
    const settings = await Settings.findOne();
    if (settings) {
      console.log('Current Business Name:', settings.businessName);
      if (settings.businessName === 'AltiusNxt Technologies (P) Lt') {
        settings.businessName = 'AltiusNxt Technologies (P) Ltd';
        await settings.save();
        console.log('✅ Business Name updated to: AltiusNxt Technologies (P) Ltd');
      } else {
        console.log('❌ Business Name does not match "AltiusNxt Technologies (P) Lt". No changes made.');
      }
    } else {
      console.log('❌ No settings found.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing business name:', error);
    process.exit(1);
  }
};

fixBusinessName();
