import mysql from 'mysql';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({path: path.resolve('../.env')});

class DatabaseMariadb {
  constructor(){
    this.config = {host: '', user: '', password: '', database: '', port: ''};
  }

  getConfig(){
    return this.config;
  }

  setConfig(config){
    console.log('setando as configurações para mariadb')
    this.config = config;
  }

  async testConnection(){
    if(!this.config){
      throw new Error("Database configuration not set");
    }

    let connection;
    try {
      connection = await mysql.createConnection(this.config);
      await connection.ping();
      return "Connection successful!";
    } catch (error) {
      throw new Error("Connection failed: " + error.message);
    } finally {
      if(connection) connection.end();
    }
  }

}

async function teste () {

  if(fs.existsSync(path.resolve('../.env'))){
    const newMDB = new DatabaseMariadb();
  
    newMDB.setConfig({
      host: process.env.MARIADB_HOST,
      port: process.env.MARIADB_PORT,
      user: process.env.MARIADB_USER,
      password: process.env.MARIADB_PASSWORD,
      database: process.env.MARIADB_DATABASE
    })
  
    console.log(await newMDB.testConnection());
}
}

teste();