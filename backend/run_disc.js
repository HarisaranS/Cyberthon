const mongoose = require('mongoose');
require('dotenv').config();
const { runEnterpriseDiscovery } = require('./src/services/networkDiscoveryService');

mongoose.connect('mongodb://mongodb:27017/datasentinel')
  .then(async () => {
    const User = require('./src/models/User');
    const user = await User.findOne({ email: 'test@test.com' });
    if (!user) {
        console.log('Test user not found.');
        process.exit(1);
    }
    console.log('Running enterprise discovery...');
    const result = await runEnterpriseDiscovery(user.organization, user._id);
    console.log('Discovery result:', result);
    const DataSource = require('./src/models/DataSource');
    const sources = await DataSource.find({ type: 'mongodb' });
    for (const s of sources) {
       console.log('Final Mongo Source:', s.name, s.healthStatus);
    }
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
