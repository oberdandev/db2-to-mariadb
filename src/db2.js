import ibmdb from 'ibm_db';
import mariadb from 'mariadb';
import { maria } from './mariadb.js';
import pLimit from 'p-limit';

const query = {
  getTablesName: (schema) =>  `SELECT TABNAME FROM SYSCAT.TABLES WHERE TABSCHEMA = upper('${schema}')`,
  getColumns: (schema) => `SELECT COLNAME, TYPENAME, LENGTH, COLNO,  "SCALE", "DEFAULT", "NULLS" FROM SYSCAT.COLUMNS WHERE TABSCHEMA = upper('${schema}')`,
  getColumnsByTable: (schema, table) => `SELECT COLNAME, TYPENAME, LENGTH, COLNO,  "SCALE", "DEFAULT", "NULLS" FROM SYSCAT.COLUMNS WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}') ORDER BY COLNO`,

  getColumnsPrimaryKey: (schema, table) => `SELECT COLNAME FROM SYSCAT.COLUMNS WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}') AND KEYSEQ = 1`,
  getColumnsForeignKey: (schema, table) => `SELECT COLNAME, TABNAME, CONSTNAME FROM SYSCAT.REFERENCES WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}')`,
  
  
  getColumnsCheck: (schema, table) => `SELECT COLNAME, TEXT FROM SYSCAT.CHECKS WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}')`,
  getColumnsUnique: (schema, table) => `SELECT COLNAME FROM SYSCAT.INDEXES WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}') AND UNIQUERULE = 'U'`,
  getColumnsIndex: (schema, table) => `SELECT COLNAMES FROM SYSCAT.INDEXES WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}')`,
  getColumnsView: (schema, table) => `SELECT TEXT FROM SYSCAT.VIEWS WHERE TABSCHEMA = upper('${schema}') AND TABNAME = upper('${table}')`,
  getColumnsProcedure: (schema, table) => `SELECT TEXT FROM SYSCAT.PROCEDURES WHERE PROCSCHEMA = upper('${schema}') AND PROCNAME = upper('${table}')`,
  getColumnsFunction: (schema, table) => `SELECT TEXT FROM SYSCAT.FUNCTIONS WHERE FUNCSCHEMA = upper('${schema}') AND FUNCNAME = upper('${table}')`,
  getColumnsTrigger: (schema, table) => `SELECT TEXT FROM SYSCAT.TRIGGERS WHERE TRIGSCHEMA = upper('${schema}') AND TRIGNAME = upper('${table}')`,
}

export class DatabaseDB2 {
  constructor(config) {
    this.config = config;
    this.connectionString = `DATABASE=${config.database};HOSTNAME=${config.hostname};PORT=${config.port};PROTOCOL=TCPIP;UID=${config.uuid};PWD=${config.pwd};`;
    this.schemas = [];
  };

  setConfig(config) {
    this.config = config;
  }

  getSchemas(){
    return this.schemas;
  }

  getConfig(config){
    return this.config;
  }

  async testConnection () {
    if(!this.config) {
      throw new Error('Database configuration not set');
    }

    let connection;
    try {
      connection = await ibmdb.open(this.connectionString);
      const schemasNames = await connection.query(`SELECT SCHEMANAME FROM SYSCAT.SCHEMATA WHERE OWNERTYPE = 'U'`)
      this.schemas = schemasNames;
      return 'Connection successful!';
    } catch (error) {
      throw new Error('Connection failed: ' + error);
    } finally {
      if(connection) connection.close();
    }
  }

  async query(sql, params = []) {
    if (!this.config || !this.connectionString) {
      throw new Error("Configuração não definida para o banco de dados db2.");
    }

    let connection;
    try {
      connection = await ibmdb.open(this.connectionString);
      const result = await connection.query(sql, params);

      return result;
    } catch (err) {
      throw err;
    } finally {
      if (connection) connection.close();
    }
  }

  async getTablesNameList(schema) {
    try {
      const res = await this.query(query.getTablesName(schema));
      return res;
    } catch (error) {
      throw new Error('Could not get tables: ' + error.message);
    }
  }

  async getTables(schema) {
    try{
      const tableObj = {}

      const res = await this.query(query.getTablesName(schema))
      const tableNames = res.map(table => table.TABNAME);

      //##IMPORTANTE -> Limita as conexões paralelas para não ter erro do driver
     // Falha de segmentação (imagem do núcleo gravada)
      const limit = pLimit(5);

      const promises = tableNames.map(table =>  limit(async () => {
        const q = query.getColumnsByTable(schema, table);
        const columns = await this.query(q);
        tableObj[table] = columns;
      }));

      await Promise.all(promises);

      return tableObj;
    }catch(e){
      throw new Error('Could not get tables: ' + e.message);
    }
  }

  async getTableData(table, schema) {
    try {
      const q = `SELECT * FROM ${schema}.${table}`;
      const data = await this.query(q);
      return data;
    } catch (error) {
      throw new Error(`Não foi possível pegar os dados da tabela: ${table} no schema: ${schema}` + error.message);
    }
  }
  
  async getTableReferencieds (schema, table){
    try {
      const qReferencieds = `SELECT TABNAME 
        FROM SYSCAT.REFERENCES WHERE REFTABNAME = upper('${table}') AND REFTABSCHEMA = upper('${schema}')`
      const referencieds = await this.query(qReferencieds);
      return referencieds;  
    } catch (error) {
      return {error: error.message}
    }
  }

  async getTableReferences(schema, table){
    try{
      const q =  `SELECT REFTABNAME FROM SYSCAT.REFERENCES WHERE TABNAME = upper('${table}') AND TABSCHEMA = upper('${schema}')`
      const references = await this.query(q);

      return references;
    } catch (e) {
      return {error: e.message}
    }
  }

}

export const db2 = {
  testConnection: async (connectionParams) => {
   try {
    const { database, host, port, user, password } = connectionParams;
    
    const cn = `DATABASE=${database};HOSTNAME=${host};PORT=${port};PROTOCOL=TCPIP;UID=${user};PWD=${password};`;
    return new Promise((resolve, reject) => {
      ibmdb.open(cn, (err, conn) => {
        if(err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
   } catch (error) {
    return new Promise((resolve, reject) => reject(error));
   }
    
  },
  setConnection: async (connectionParams) => {
    const { database, host, port, user, password } = connectionParams;
    const cn = `DATABASE=${database};HOSTNAME=${host};PORT=${port};PROTOCOL=TCPIP;UID=${user};PWD=${password};`;
    const connection = await ibmdb.open(cn);
    return connection;
  },
  getTables: async (connection, schema) => {
    try {
      let tableNames = []
      const tableObj = {}
  
      await connection.query(query.getTablesName(schema))
        .then(t => t.map(t => tableNames.push(t.TABNAME)))
        .catch((e) => {console.log(e);});
      
      console.log(tableNames)
  
      for(let table of tableNames) {
        let q = query.getColumnsByTable(schema, table)
        console.log(`fazendo query da`, table)
        await connection.query(q)
          .then(r => {
            tableObj[table] = r; 
          })
          .catch(e => console.log(e))
      }
  
      return tableObj;
    } catch (error) {
      console.log(error);
    }
  },
  getListTable: async (connection, schema) => {
    try {
      let tableNames = []
      await connection.query(query.getTablesName(schema))
        .then(t => t.map(t => tableNames.push(t.TABNAME)))
        .catch((e) => {console.log(e);});
      
      console.log(tableNames)
      return tableNames;
    } catch (error) {
      console.log(error)
      return []
    }
  },
  getSchemas: async(connection) => {
    try {
      const schema = await connection.query(`SELECT SCHEMANAME FROM SYSCAT.SCHEMATA WHERE OWNERTYPE = 'U'`)
      return schema;
    } catch (error) {
      console.log('errro ao buscar schemas do db2: ', error)
      return {error: error.message}
    }
  },
  getColumnsPrimaryKey: async(connection, schema, table) => {},
  getTableReferences: async(connection, schema, table) => {
    try{
      const q =  `SELECT REFTABNAME FROM SYSCAT.REFERENCES WHERE TABNAME = upper('${table}') AND TABSCHEMA = upper('${schema}')`
      const references = await connection.query(q);

      return references;
    } catch (e) {
      console.log(e)
    }
  },
  getTableContent: async (connection, schema, table) => {
    try {
      const q = await connection.query(`SELECT * FROM ${schema}.${table}`);
      return q;
    } catch (error) {
      return {error: error.message}
    }
  },
  getTableReferencieds: async(connection, schema, table) => {
    try {
      const qReferencieds = `SELECT TABNAME 
        FROM SYSCAT.REFERENCES WHERE REFTABNAME = upper('${table}') AND REFTABSCHEMA = upper('${schema}')`
      const referencieds = await connection.query(qReferencieds);
      return referencieds;  
    } catch (error) {
      return {error: error.message}
    }
  }
};

const dbDb2conn = new DatabaseDB2({
  database: 'db2',
  hostname: '138.197.98.40',
  port: 50000,
  uuid: 'DB2INST1',
  pwd: 'root',
});

async function tF() {
  await dbDb2conn.testConnection();
  await dbDb2conn.getTables('DB2INST1');
  await dbDb2conn.getTablesNameList('DB2INST1');
  //const bairros =  await dbDb2conn.getTableData('BAIRRO', 'DB2INST1');
}


