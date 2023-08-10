const {ApolloServer, gql} = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers')
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variable.env'});

const connectDB = require('./config/db');

//conectar a bd
connectDB();

//servidor apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => { // se ejecuta por cada resolver
        const token = req.headers['authorization'] || '';
        if (token.length > 0) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRET);
                return {
                    usuario
                }; // de esta forma el dato usuario sera accesible en los resolvers via context
            } catch (e) {
                console.log('Ocurrio un error con el token', e);
            }
        }
    }
});

//iniciar servidor
server.listen().then((conf) => {
    console.log(`Servidor listo en ${conf.url}`);
});