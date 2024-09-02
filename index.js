import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db2, DatabaseDB2 } from './src/db2.js';
import { maria } from './src/mariadb.js'	
import { migrateTables } from './src/transferTables.js';
import { DatabaseMariadb} from './src/mariadb.js';

let DB2;
let Mariadb;

let db2Connection;
let mariadbConnection;
let db2Params;
let mariadbParams;

const app = express();
const port = 2202;

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false,
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', './views');


app.use(cors({
    origin: '*',
    methods: 'GET, POST, PUT, DELETE, PATCH',
    allowedHeaders: 'Content-Type, Authorization',
}));
app.use(express.static(path.resolve('./public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.get('/', (req, res) => {
    res.render('home');
});

app.get('/connect', (req,res) => {
    res.render('connectionForm', {user: `oberdan`})
})

app.get('/transfer', (req,res) => {})

app.post('/test-db2-connection', async (req,res) => {
  console.log('req body', req.body);
  const { 'db2-host':  hostname, 'db2-port': port, 'db2-user': uuid, 'db2-password':pwd, 'db2-database': database } = req.body;

  DB2 = new DatabaseDB2({database, hostname, port, uuid, pwd});

  try {
    let promise = await DB2.testConnection();
    if(promise) {
        res.status(200).send('conexão realizada com sucesso');
      }
  } catch (error) { 
    console.log(error)
    res.status(500).send({
      message: 'Erro ao conectar ao banco de dados',
      error: error.message,
      code: error.code
    })
  }
});

app.post('/test-mariadb-connection', async (req,res) => {
  try {
    const { 'mariadb-host': host, 'mariadb-user': user, 'mariadb-password':password, 'mariadb-database': database, 'mariadb-port': port } = req.body;
    console.log(req.body)

    Mariadb = new DatabaseMariadb({host, user, password, database, port}); 
    //await DatabaseMariadb.setConfig({host, database, port, user, password});
    await Mariadb.testConnection();

    return res.status(200).send('Conexão realizada com sucesso');

  } catch (error) {
    return error;
  }
}
)

app.get('/tables-db2/:schema', async (req, res) => {
  try {
    let tabelas = []; 

    const schema = req.params.schema || 'DB2INST1';
    const listTables = await DB2.getTablesNameList(schema);

    const limit = pLimit(4);

    tabelas = await Promise.all(listTables.map(table => 
      limit(async () => {
        console.log(`Get references and referencieds tables for`, table.TABNAME);

        const [references, referencieds] = await Promise.all([
          DB2.getTableReferences(schema, table.TABNAME),
          DB2.getTableReferencieds(schema, table.TABNAME)
        ]);

        return { table: table.TABNAME, references: references, referencieds: referencieds };
      })
    ));
    
    return res.json(tabelas);
  } catch (error) {
    res.send({
      message: "Erro ao buscar as tabelas do db2 no schema",
      error: error.message
    })
  }
})

app.get('/searchSchemas/', (req,res) => {
  const schemas = DB2.getSchemas();


  res.json(schemas);
})

app.post('/migrate', async (req, res) => {
  try{
    const {srcConn, srcSchema, destConn, 
      destSchema, arrTables, migrateData} = req.body;
    
    if(srcConn == 'db2' && (destConn == 'mariadb' || destConn == 'mysql')){
      await migrateTables({
        srcConn: DB2, srcSchema, 
        srcName: srcConn, destConn: Mariadb, 
        destSchema, destName: destConn, arrTables, migrateData});
      return res.send('tabelas migradas com sucesso');
    }
    if(srcConn == 'mariadb' || srcConn == 'mysql' && destConn == 'db2'){
      await migrateTables({
        srcConn: Mariadb, srcSchema, srcName: srcConn, 
        destConn: DB2, destSchema, arrTables, migrateData});
      return res.send('tabelas migradas com sucesso');
    } 
  }catch(e){
    return res.status(500).send({error: e});
  }
})

app.get('/db2-schema', async(req,res) => {
  try {
    const response = await DB2.getSchemas();
    return res.send(response);
  } catch (error) {
    res.send('Erro ao buscar os schemas: ', error);
  }
})

app.get('/mariadb-schema'), async(req,res) => {
  try{
    const response = await Mariadb.getSchemas()
    return res.send(response);
  }catch(e){
    res.status(500).send('Erro ao buscar os schemas: ', error)
  }
}

app.listen(port, ()=> console.log('app listening on port ', port));


