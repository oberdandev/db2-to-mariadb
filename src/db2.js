import ibmdb from 'ibm_db';
import mariadb from 'mariadb';
//import { mariadbConn, createTablesOnMariaDB } from './mariadb.js';

let db2Conn;
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
          db2Conn = conn;
          resolve(true);
        }
      });
    });
   } catch (error) {
    return new Promise((resolve, reject) => reject(error));
   }
    
  },

};


const connectionString = "DATABASE=db2;HOSTNAME=138.197.98.40;PORT=50000;PROTOCOL=TCPIP;UID=DB2INST1;PWD=root;";

async function tryConnectionToDb2(database, host, port, user, password, schema) {
    const cn = `DATABASE=${database};HOSTNAME=${host};PORT=${port};PROTOCOL=TCPIP;UID=${user};PWD=${password};`;

    let tableNames = []
    const tableObj = {}

    try{
      let conn = await ibmdb.open(cn);
      await conn.query(`SELECT TABNAME FROM SYSCAT.TABLES WHERE TABSCHEMA = upper('${schema}')`)
        .then(t => t.map(t => tableNames.push(t.TABNAME)))
        .catch((e) => {console.log(e);});
      
    console.log(tableNames)

    for(let table of tableNames) {
      let q = query.getColumnsByTable(schema, table)
      console.log(`fazendo query da`, table)
      await conn.query(q)
        .then(r => {
          tableObj[table] = r; 
        })
        .catch(e => console.log(e))
    }

    
    console.log(tableObj['BAIRRO'])
    
    
  
    }catch(e) {
       console.log(e)
    }

}



//tryConnectionToDb2('db2', '138.197.98.40', 50000, 'DB2INST1', 'root', 'DB2INST1');



