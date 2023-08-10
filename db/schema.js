const {gql} = require('apollo-server');

// Schema

//tipo DATE no existe en graphql, ID si existe, 
//ya que sera proporcionado por mongo a travez de mongoose
const typeDefs = gql`
    
    type Usuario {
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String  
    }
    
    type Token {
        token: String
    }

    type Producto {
        id: ID
        nombre: String
        existencia: Int
        precio: Float
        creado: String  
    }

    type Cliente {
        id: ID
        nombre: String
        apellido: String
        email: String
        empresa: String
        telefono: String
        creado: String
        vendedor: ID
    }

    type Pedido {
        id: ID
        pedido: [PedidoGrupo]
        total: Float
        cliente: ID
        vendedor: ID
        fecha: String
        estado: EstadoPedido
    }
    
    type PedidoGrupo {
        id: ID
        cantidad: Int
    }

    type TopCliente {
        total: Float
        cliente:[Cliente]
    }

    type TopVendedor {
        total: Float
        vendedor: [Usuario]
    }

    # -Inputs-

    input authUsuario {
        email: String!
        password: String!
    }

    input UsuarioInput {
        nombre: String!
        apellido: String
        email: String!
        password: String!
    }

    input ProductoInput {
        nombre: String!
        existencia: Int!
        precio: Float!
    }

    input ClienteInput {
        nombre: String!
        apellido: String!
        email: String!
        empresa: String!
        telefono: String!
    }

    input inputProductoPedido {
        id: ID!
        cantidad: Int!
    }

    input PedidoInput { 
        pedido: [inputProductoPedido]
        total: Float!
        cliente: ID!
        estado: EstadoPedido
    }

    enum EstadoPedido{
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query {
        # Usuarios
        obtenerUsuario(token: String!): Usuario 

        # Producto
        obtenerProductos: [Producto]
        obtenerProducto(id: ID!): Producto
        
        #Clientes
        obtenerClientes: [Cliente]
        obtenerClientesVendedor: [Cliente]
        obtenerCliente(id: ID!): Cliente

        #Pedido
        obtenerPedidos: [Pedido]
        obtenerPedidosVendedor: [Pedido]
        obtenerPedido(id: ID!): Pedido
        obtenerPedidoEstado(estado: EstadoPedido!): [Pedido]

        #Busquedas avanzadas
        mejoresClientes: [TopCliente]
        mejoresVendedores: [TopVendedor]
        buscarProducto(texto: String!): [Producto]
    }

    type Mutation {
        # Usuarios 

        nuevoUsuario(input: UsuarioInput) : Usuario
        autenticarUsuario(input: authUsuario): Token

        #Productos
        nuevoProducto(input: ProductoInput) : Producto
        actualizarProducto(id: ID!, input: ProductoInput! ): Producto
        eliminarProducto(id: ID!): String

        #Clientes
        nuevoCliente(input: ClienteInput): Cliente
        actualizarCliente(id: ID!, input: ClienteInput): Cliente
        eliminarCliente(id: ID!): String 

        #Pedidos
        nuevoPedido(input: PedidoInput): Pedido
        actualizarPedido(id: ID!, input: PedidoInput!): Pedido
        eliminarPedido(id: ID!): String
    }
`;


module.exports = typeDefs;