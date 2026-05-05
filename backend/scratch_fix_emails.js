const { User } = require('./models');
const { connectDB } = require('./config/db');

const fixEmails = async () => {
  try {
    await connectDB();
    const users = await User.findAll({ where: { isAdmin: true } });
    for (const user of users) {
      const lowerEmail = user.email.toLowerCase().trim();
      if (user.email !== lowerEmail) {
        console.log(`Fixing email for ${user.name}: ${user.email} -> ${lowerEmail}`);
        user.email = lowerEmail;
        await user.save();
      }
    }
    console.log('✅ All admin emails standardized to lowercase!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing emails:', error);
    process.exit(1);
  }
};

fixEmails();
