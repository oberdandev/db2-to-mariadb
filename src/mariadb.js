import mariadb from 'mariadb';

export let mariadbConn;

export const maria = {
  testConnection: async (connectionParams) => {
    const { database, host, user, password, port } = connectionParams;
    const pool = mariadb.createPool({
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 10
    })

    let mariadbConn;
    try {
      mariadbConn = await pool.getConnection();
      console.log("Conexão bem-sucedida!");
      return true;
    } catch (err) {
      console.error("Erro na conexão:", err);
      return false;
    } finally {
      if (mariadbConn) mariadbConn.release();
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
    const pool = mariadb.createPool({
      ...connectionParams,
      connectionLimit: 10
    })
    let mariadbConn = pool.getConnection();
    return mariadbConn;
  }

}


async function tryConnectionMariaDB(database, host, user, password){
  const pool = mariadb.createPool({
    host,
    user,
    password,
    database,
    connectionLimit: 10
  })

  let mariadbConn;

  try {
    mariadbConn = await pool.getConnection();
    console.log("Conexão bem-sucedida!");
  } catch (err) {
    console.error("Erro na conexão:", err);
  } finally {
    if (mariadbConn) mariadbConn.release();
  }
}

async function createTablesOnMariaDB(connection, tableColumns) {
  let queryScript;

}

function mariadbConnection (connectionParamaters) {
  try{
    const pool = mariadb.createPool({
      ...connectionParamaters,
      connectionLimit: 10
    })
    let mariadbConn = pool.getConnection();
    return mariadbConn;
  }catch(e){
    console.log(e)
    return null;
  }
}


export {
  tryConnectionMariaDB, 
  createTablesOnMariaDB
}