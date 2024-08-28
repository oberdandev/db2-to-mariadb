import {maria} from './mariadb.js'
import { db2 } from './db2.js';

export async function transferDB2toMariadb(db2Conn, db2Params, mariadbConn, schemamariadb){
  try {
    const schema_db2 =  'DB2INST1';
  const tables = await db2.getTables(db2Conn, schema_db2);
  let sqlQueries = []
/*   console.log(tabelasDB2)
  const tablesName = Object.keys(tabelasDB2); */

  for (const tableName in tables) {
    if (tables.hasOwnProperty(tableName)) {
      const columns = tables[tableName];
      let sql = `CREATE TABLE ${tableName} (\n`;

      columns.forEach((column, index) => {
        let columnDefinition = `  ${column.COLNAME} `;

        // Mapear os tipos de dados
        switch (column.TYPENAME) {
          case 'INTEGER':
            columnDefinition += 'INT';
            break;
          case 'VARCHAR':
            columnDefinition += `VARCHAR(${column.LENGTH})`;
            break;
          case 'DECIMAL':
            columnDefinition += `DECIMAL(${column.LENGTH}, ${column.SCALE})`;
            break;
          case 'CHARACTER':
            columnDefinition += `CHAR(${column.LENGTH})`;
            break;
          case 'DATE':
            columnDefinition += 'DATE';
            break;
          default:
            columnDefinition += column.TYPENAME; // fallback, no caso de um tipo não mapeado
        }

        // Adicionar DEFAULT, se existir
        if (column.DEFAULT !== null) {
          columnDefinition += ` DEFAULT ${column.DEFAULT}`;
        }

        // Adicionar NOT NULL, se especificado
        if (column.NULLS === 'N') {
          columnDefinition += ' NOT NULL';
        }

        // Adicionar vírgula no final de cada coluna, exceto a última
        if (index < columns.length - 1) {
          columnDefinition += ',';
        }

        sql += `${columnDefinition}\n`;
      });

      sql += ');';

      sqlQueries.push(sql);
    }
  }
  
  sqlQueries.forEach(async (sql) => {
    const querie = await mariadbConn.query(sql, schemamariadb);

  })

  } catch (error) {
    console.log(error)
    return {error: error};
  }
};

export function transferMariadbToDB2(db2Conn, mariadbConn, tableColumns){

}