  import mariadb from 'mariadb';
  import mysql from 'mysql'

  export class DatabaseMariadb {
    constructor(config) {
      this.config = config || {host: '', user: '', password: '', database: '', port: ''};
    }

    getconfig() {
      return this.config;
    }

    getSchemas() {
      try {
        const q = `SELECT SCHEMA_NAME
        FROM information_schema.SCHEMATA
        WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys');`
        const response = this.query(q);
        const schemaName = response.map(schema => {SCHEMANAME: schema})
        return schemaName;
      } catch (error) {
        throw new Error('Error ao buscar os esquemas do mariadb: ', error)  
      }
    }

    setConfig(config) {
      console.log('mariadb.js - 14: setando configurações para a database Mariadb');
      this.config = config;
    }

    async testConnection() {
      if (!this.config) {
        throw new Error("Database configuration not set");
      }

      let connection;
      try {
        connection = await mysql.createConnection(this.config);
        console.log(connection);
        await connection.ping(); // Verifica se a conexão está ativa
        return "Connection successful!";
      } catch (err) {
        throw new Error("Connection failed: " + err.message);
      } finally {
        if (connection) connection.end();
      }
    }

    async query(sql, params = []) {
      if (!this.config) {
       return '';
      }

      let connection;
      try {
        connection = await mysql.createConnection(this.config);
        const result = await connection.query(sql, params);
        return result;
      } catch (err) {
        console.log(err);
      } finally {
        if (connection) connection.end();
      }
    }
    
    async getTables() {
      if (!this.config) {
        throw new Error("Configuração não definida para o banco de dados mariadb.");
      }

      let connection;
      try {
        connection = await mysql.createConnection(this.config);
        const result = await connection.query('SHOW TABLES');
        return result;
      } catch (err) {
        console.log(err)
      } finally {
        if (connection) connection.end();
      }
    }
}

export const maria = {
  testConnection: async (connectionParams) => {
    const { database, host, user, password, port } = connectionParams;
    const pool = mariadb.createPool({
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 1
    })

    let mariadbConn;
    try {
      mariadbConn = await pool.getConnection();
      console.log("Conexão bem-sucedida!");
      return true;
    } catch (err) {
      console.error("Erro na conexão:", err);
      return false;
    } 
  },
  connection: async (connectionParams) => {
    try{
      const pool = mariadb.createPool({
        ...connectionParams,
        connectionLimit: 10
      })
      let mariadbConn = pool.getConnection();
      return mariadbConn;
    }catch(e){
      console.log(e)
      return null;
    }
  },
  setConnection: async(connectionParams) => {
    const pool = mariadb.createConnection({
      ...connectionParams,
      connectionLimit: 1
    })
    
    return pool;
  }

}

