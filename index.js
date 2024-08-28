import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db2 } from './src/db2.js';
import { maria } from './src/mariadb.js'	

let db2Connection;
let mariadbConnection;

const app = express();
const port = 2202;

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false,
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


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
        db2Connection = db2.setConnection({database, host, port, user, password});
        res.status(200).send('conexão realizada com sucesso');
      } else {
        res.status(500).send('erro ao realizar conexão');
      }
  } catch (error) { 
    console.log(error)
    res.status(500).send("erro ao realizar conexão")
  }

});

app.post('/test-mariadb-connection', async (req,res) => {
  try {
    const { 'mariadb-host': host, 'mariadb-user': user, 'mariadb-password':password, 'mariadb-database': database } = req.body;
    const promise = await maria.testConnection({database, host, user, password});
    if(promise) {
      mariadbConnection = maria.setConnection({database, host, user, password});
      res.send('conexão realizada com sucesso');
    } else {
      res.status(500).send('erro ao realizar conexão');
    }
  } catch (error) {
    console.log('erro ao realizar conexão com mariadb: ', error);
    res.status(500).send('erro ao realizar conexão')
  }

})


app.listen(port, ()=> console.log('app listening on port ', port));

