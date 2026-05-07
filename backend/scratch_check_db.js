const { Invoice } = require('./models');

async function check() {
  try {
    const invoices = await Invoice.findAll({ attributes: ['invoiceNumber', 'status'] });
    console.log('Invoices and their statuses:');
    invoices.forEach(inv => {
      console.log(`${inv.invoiceNumber}: ${inv.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
