const Usuario = require('../models/Usuarios');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variable.env'});


const crearToken = (usuario, secret, expiresIn) => {

    const {id, email, nombre, apellido} = usuario
    return jwt.sign({id, email, nombre, apellido}, secret, {expiresIn});
}


//Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, {token}) => {
            const usuarioID = await jwt.verify(token, process.env.SECRET);
            return usuarioID
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (e) {
                console.log(e);
            }
        },
        obtenerProducto: async (_, {id}) => {
            if (id.length != 24) {
                throw new Error('parametro de peticion invalido');
            }
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('producto no existente');
            }
            return producto;
        },
        obtenerClientesVendedor: async(_, {}, ctx) => {
            try {
                return await Cliente.find({vendedor: ctx.usuario.id.toString()});   
            } catch (e) {
                console.log('Ocurrio un error', e);
            }
        },
        obtenerCliente: async (_, {id}, ctx) => {
            // checar si existe Cliente
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('cliente no existe');
            }
            if (cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('no tienes acceso');
            }

            return cliente;
        },
        obtenerPedidos: async () => {
            try {
                const pedidos =  await Pedido.find();
                return pedidos;
            } catch (e) {
                console.log(e);
            }
        },
        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos =  await Pedido.find({vendedor: ctx.usuario.id});
                return pedidos;
            } catch (e) {
                console.log(e);
            }
        },
        obtenerPedido: async (_, {id}, ctx) => {
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes acceso');
            }
            return pedido;
        },
        obtenerPedidoEstado: async (_, {estado}, ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});
                return pedidos
            } catch (e) {
                console.log(e)
            }
        },

        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                {$match: {estado: "COMPLETADO"}},
                {$group: {
                    _id: "$cliente", //nombre del modelo?
                    total: { $sum: '$total'}
                }},
                {$lookup: {
                    from: 'clientes',
                    localField: '_id',
                    foreignField: "_id",
                    as: "cliente"
                }},
                {$sort: {
                    total: -1
                }}
            ]);
            return clientes;
        },
        mejoresVendedores : async () => {
            const vendedores = await Pedido.aggregate([
                {$match: {estado: "COMPLETADO"}},
                {$group: {
                    _id: "$vendedor",
                    total: { $sum: '$total'}
                }},
                {$lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: "_id",
                    as: "vendedor"
                }},
                {$limit: 3},
                {$sort: {
                    total: -1
                }}
            ]);
            return vendedores;
        },
        buscarProducto: async (_, {texto}) => {
            const productos = await Producto.find({$text: {$search: texto}}).limit(10);
            return productos
        }
    },
    Mutation: {
        // Usuarios
        nuevoUsuario: async (_, {input}) => {
            const {email, password} = input;
            
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }

            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            try{
                const usuario = new Usuario(input);
                usuario.save() //instancia de modelo Usuario, salva en la DB
                return usuario // regresa el usuario ya registrado
            } catch (e) {
                console.log('Error al intentar registrar nuevo usuario', e);
            }
        },
        autenticarUsuario: async(_, {input}) => {
            const {email, password} = input;
            
            const existeUsuario = await Usuario.findOne({email});
            if (!existeUsuario) {
                throw new Error('El usuario no esta registrado');
            }

            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if(!passwordCorrecto) {
                throw new Error('El pass es incorrecto');
            }

            return {
                token: crearToken(existeUsuario, process.env.SECRET, '24h')
            }
        },
        // Productos
        nuevoProducto: async (_, {input}) => {
            try {
                const nuevoRegistro = new Producto(input);
                const producto = await nuevoRegistro.save();
                return producto
            } catch (e) {
                console.log('ocurrio un error al tratar de registrar nuevo producto', e);
            }
        },
        actualizarProducto: async (_, {id, input}) => { 
            console.log(input)
            if (id.length != 24) {
                throw new Error('parametro id invalido');
            }
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('producto no existente');
            }

            const productoActualizado = await Producto.findOneAndUpdate({_id: id}, input, {new: true});
            return productoActualizado;
        },
        eliminarProducto: async(_, {id}) => {
            if (id.length != 24) {
                throw new Error('parametro de peticion invalido');
            }
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('producto no existente');
            }
            await Producto.findOneAndDelete({_id: id});
            return "producto eliminado";
        },
        //Clientes
        nuevoCliente: async (_, {input}, ctx) => {

            // revisar si el cliente ya existe
            const { email } = input;
            const existeCliente = await Cliente.findOne({email});
            if( existeCliente ) {
                throw new Error('El cliente ya existe');
            }
            const nuevoCliente = new Cliente(input);
            // asignar el cliente al usuario
            nuevoCliente.vendedor = ctx.usuario.id;
            // registrar nuevo cliente
            try {
                const resultado = await nuevoCliente.save();
                return resultado;
            } catch (e) {
                console.log(e);
            }
        },
        actualizarCliente: async (_, {id, input}, ctx) => {
            const cliente = await Cliente.findById(id);
            if ( !cliente ) {
                throw new Error('El cliente no existe');
            }
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('no tienes acceso');
            }
            const actualizadocliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return actualizadocliente;
        },
        eliminarCliente: async (_, {id}, ctx) => {
            if (id.length != 24) {
                throw new Error('parametro de peticion invalido');
            }
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('cliente no existente');
            }

            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('no tienes acceso');
            }

            await Cliente.findOneAndDelete({_id: id});
            return "Cliente eliminado";
        },
        //Pedidos
        nuevoPedido: async (_, {input}, ctx) => {
            // solo el cliente puede hacer pedido, checar si existe
            const {cliente} = input;
            let clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('cliente no existe');
            }
            // si el cliente es de vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('no tienes acceso');
            }

            // revisar que el stock este disponible
            for await (const articulo of input.pedido) {
                const {id} = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El producto ${producto.nombre} excede la capacidad`);
                } else {
                    producto.existencia = producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }

            const pedido = new Pedido(input);
            pedido.vendedor = ctx.usuario.id
            const creado = pedido.save();
            return creado;
        },
        actualizarPedido : async (_, {id, input}, ctx) => {

            const pedidoExiste = await Pedido.findById(id);
            const clienteExiste = await Cliente.findById(input.cliente)
            if (!pedidoExiste) {
                throw new Error('Pedido no encontrado');
            }
            if (!clienteExiste) {
                throw new Error('Cliente no encontrado');
            }
            if (pedidoExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes acceso');
            }

            //revisar stock
            // TODO: si la cantidad del pedido disminuye
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const {id} = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El producto ${producto.nombre} excede la capacidad`);
                    } else {
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
            }

            //guardar
            const pedidoActualizado = await Pedido.findOneAndUpdate({_id: id},input, {new: true});
            return pedidoActualizado;

        },
        eliminarPedido: async (_, {id}, ctx) => {
            // TODO: devolver todo al stock original
            if (id.length != 24) {
                throw new Error('parametro de peticion invalido');
            }

            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }

            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes acceso');
            }

            await Pedido.findOneAndDelete({_id: id});
            return 'Pedido eliminado'
        }
    }
}

module.exports = resolvers;