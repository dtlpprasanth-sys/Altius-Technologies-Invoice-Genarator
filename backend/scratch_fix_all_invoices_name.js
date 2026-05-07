const { Invoice, Settings } = require('./models');
const { connectDB } = require('./config/db');

const fixAllInvoices = async () => {
  try {
    await connectDB();
    
    // Fix Settings first just in case
    const settings = await Settings.findOne();
    if (settings && settings.businessName.trim() === 'AltiusNxt Technologies (P) Lt') {
      settings.businessName = 'AltiusNxt Technologies (P) Ltd';
      await settings.save();
      console.log('✅ Settings businessName fixed.');
    }

    // Fix all Invoices
    const invoices = await Invoice.findAll();
    let fixedCount = 0;
    for (const inv of invoices) {
      let changed = false;
      if (inv.businessName === 'AltiusNxt Technologies (P) Lt') {
        inv.businessName = 'AltiusNxt Technologies (P) Ltd';
        changed = true;
      }
      
      // Also check businessDetails JSON
      if (inv.businessDetails && inv.businessDetails.businessName === 'AltiusNxt Technologies (P) Lt') {
        inv.businessDetails = { ...inv.businessDetails, businessName: 'AltiusNxt Technologies (P) Ltd' };
        changed = true;
      }

      if (changed) {
        await inv.save();
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} invoices.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing invoices:', error);
    process.exit(1);
  }
};

fixAllInvoices();
