const { Settings } = require('./models');
const { connectDB } = require('./config/db');

const consolidateSettings = async () => {
  try {
    await connectDB();
    const allSettings = await Settings.findAll({ order: [['createdAt', 'ASC']] });
    
    if (allSettings.length <= 1) {
      console.log('✅ Only one settings record found. No consolidation needed.');
      process.exit(0);
    }

    console.log(`Found ${allSettings.length} settings records. Consolidating into the first one...`);
    
    const master = allSettings[0];
    console.log(`Master record: ${master.businessName} (ID: ${master.id})`);

    // Delete all other settings records
    for (let i = 1; i < allSettings.length; i++) {
      const extra = allSettings[i];
      console.log(`Deleting redundant record: ${extra.businessName} (ID: ${extra.id})`);
      await extra.destroy();
    }

    console.log('✅ Database consolidated to a single shared business profile!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error consolidating settings:', error);
    process.exit(1);
  }
};

consolidateSettings();
