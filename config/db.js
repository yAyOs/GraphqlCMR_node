const mongoose = require('mongoose');
require('dotenv').config({path: 'variable.env'});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {

        });
        console.log('db conected! :D');
    } catch (e) {
        console.log('Ocurrio un error', e);
        process.exit(1); // detener app
    }
}

module.exports = connectDB;