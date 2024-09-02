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
      }
    })));

    
    for(tableName of arrTables){
      const data = await srcConn 
    }
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