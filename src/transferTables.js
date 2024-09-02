import pLimit from "p-limit";
import { DictonaryDB2, DictonaryMariadb } from "./dictionary.js";

const translateDataType = (type, length) => {

}

export async function migrateTables({srcConn, srcSchema, srcName, destConn, destSchema, destName, arrTables, migrateData}){
  console.log({srcSchema, srcName, destSchema, destName, arrTables, migrateData});
  let stackInfo = [];
  let stackSucess = [];
  try{
    let sqlQueries = []
    const tables = await srcConn.getTables(srcSchema);

    for(const tableName of arrTables){
      let columns = tables[tableName];
      let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      columns.forEach((column, index) => {
        let columnDefinition = ` ${column.COLNAME} `;
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
            columnDefinition += column.TYPENAME;
        }

        if (column.DEFAULT !== null) {
          columnDefinition += ` DEFAULT ${column.DEFAULT}`;
        }

        if (column.NULLS === 'N') {
          columnDefinition += ' NOT NULL';
        }

        if (index < columns.length - 1) {
          columnDefinition += ',';
        }
        sql += `${columnDefinition}\n`;
      });
      sql += ');';
      sqlQueries.push(sql);
    }

    const limit = pLimit(5);

    await Promise.all(sqlQueries.map(sql => limit(async() =>{
      try {
        await destConn.query(sql);
      } catch (e) {
        stackInfo.push({ 
          Message: 'Erro ao criar tabela', 
          query: sql, error: e });

        console.log('Erro ao executar query: ', sql, '\nErro: ', e);
        return stackInfo;
      }
    })));

    const bairroName = 'BAIRRO';
    const data = await srcConn.getTableData('BAIRRO', srcSchema);
    const dataColumns = tables['BAIRRO'].map(column => column.COLNAME);
    console.log('DATA => ', data)
    console.log('dataColumns =>', dataColumns)

    const insertQuery = `INSERT INTO ${bairroName} (${dataColumns.map((colname, index) => {
      return index === dataColumns.length - 1 ? colname : colname + ',';
    }).join('')})
      VALUES (${dataColumns.map(() => '?').join(',')})
    `
    for(const item of data){
      const arrData = dataColumns.map(column => item[column]);
      console.log('arrData: => ', arrData)
      await destConn.query(insertQuery, arrData);
    }
    
  }catch(e){
    console.trace(e)
    return {error: e};
  }
}

export async function transferDB2toMariadb(db2Conn, db2Params, mariadbConn, schemamariadb){
  const stackErrs = [];
  try {
    const schema_db2 =  'DB2INST1';
  const tables = await db2.getTables(db2Conn, schema_db2);
  let sqlQueries = []


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
    try{
      const openConnectionMDB = await mariadbConn.connect();
      const querie = await mariadbConn.query(sql, schemamariadb);
    }catch(e){
      stackErrs.push({sql: e});
      console.log('erro na tabela:', e)
    }

  })

  for(const tableName in tables){
    db2.getTableContent(db2Conn, db2Params.schema, )
  }

  } catch (error) {
    console.log(error)
    return {error: error};
  }

  
};

export function transferMariadbToDB2(db2Conn, mariadbConn, tableColumns){

}