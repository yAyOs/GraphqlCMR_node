const mongoose = require('mongoose');

const ProductosSchema = mongoose.Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },
    existencia: {
        type: Number, //mongoose aplica tipo Number para int, float y todo tipo de numero.
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    }
});

ProductosSchema.index({nombre: 'text'});

module.exports = mongoose.model('Producto', ProductosSchema);