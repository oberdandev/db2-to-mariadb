import {maria} from './mariadb.js'
import { db2 } from './db2.js';

export async function transferDB2toMariadb(db2Conn, schemaDB2, mariadbConn, schemamariadb){
  const schema_db2 = schemaDB2 || 'DB2INST1';

  const tabelasDB2 = await db2.getTables(db2Conn, schema_db2);

  console.log(tabelasDB2)


  
};

export function transferMariadbToDB2(db2Conn, mariadbConn, tableColumns){

}