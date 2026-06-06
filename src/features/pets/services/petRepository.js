const dbModule = require('../../database/db');
const { criarRepositorioPets } = require('./petRepositoryCore');

const db = dbModule.default || dbModule;

module.exports = criarRepositorioPets(db);
