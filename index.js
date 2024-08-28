import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db2 } from './src/db2.js';
import { maria } from './src/mariadb.js'	
import { transferDB2toMariadb } from './src/transferTables.js';

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
  const { 'db2-host': host, 'db2-port': port, 'db2-user': user, 'db2-password':password, 'db2-database': database } = req.body;
  try {
    let promise = await db2.testConnection({database, host, port, user, password});
    if(promise) {
        db2Connection = await db2.setConnection({database, host, port, user, password});
        db2Params = {database, host, port, user, password};
        console.log(db2Params)
        await transferDB2toMariadb(db2Connection, db2Params, mariadbConnection, mariadbParams);
        res.status(200).send('conexão realizada com sucesso');
      } else {
        res.status(500).send('erro ao realizar conexão');
      }
  } catch (error) { 
    console.log(error)
    res.status(500).send(`erro ao realizar conexão: ${error} `)
  }

});

app.post('/test-mariadb-connection', async (req,res) => {
  try {
    const { 'mariadb-host': host, 'mariadb-user': user, 'mariadb-password':password, 'mariadb-database': database, 'mariadb-port': port } = req.body;

    mariadbParams = {database, host, port, user, password};
  

    const promise = await maria.testConnection({database, host, user, password, port});
    if(promise) {
      mariadbConnection = await maria.setConnection({database, host, user, password, port});
      console.log(mariadbConnection);
      res.send('conexão realizada com sucesso');
    } else {
      res.status(500).send('erro ao realizar conexão');
    }
  } catch (error) {
    console.log('erro ao realizar conexão com mariadb: ', error);
    res.status(500).send(`erro ao realizar conexão com mariadb: ${error}`)
  }

})

app.get('/tables-db2/:schema', async (req, res) => {
  let tabelas = []; 

  const schema = req.params.schema || 'DB2INST1';
  const listTables = await db2.getListTable(db2Connection, schema);
  
  for(let table of listTables) {
    let references = await db2.getTableReferences(db2Connection, schema, table);
    let referencieds = await db2.getTableReferencieds(db2Connection, schema, table);
    tabelas.push({table: table, references: references, referencieds: referencieds});
  }

  return res.json(tabelas);
})

app.get('/searchSchemas', (req,res) => {
  const schema = req.body.schema
})

app.get('/transfer', async (req, res) => {
  const tableColumns = await db2.getTables(db2Connection);
})

app.get('/db2-schema', async(req,res) => {
  try {
    const response = await db2.getSchemas(db2Connection);
    return res.send(response);
  } catch (error) {
    res.send('Erro ao buscar os schemas: ', error);
  }
})


app.listen(port, ()=> console.log('app listening on port ', port));


