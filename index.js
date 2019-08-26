const pg = require('pg')
const dbConnectionSting = process.env.DB_CONNECTION_STRING
const dbPool = new pg.Pool({ connectionString: dbConnectionSting})
console.log(dbConnectionSting)

dbPool.on('error', (err, client) => {
  console.error('Unexpected error on client', err)
  process.exit(-1)
})

// Retrieve all todos as database records from postgresql and provide them to the passed in callback function
const getTodos = (cb) => dbPool.query('SELECT id, entry FROM todo_items', cb)

// Save a todo to the postgresql database, and provide the resulting database record to a callback function
const saveTodo = (todo, cb) => dbPool.query('INSERT INTO todo_items (entry) VALUES($1)', [todo], cb)

// load express
const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.json())

// the default endpoint will just return a JSON representation of the TODO items that we know about

app.get('/', (req, res) => {
  getTodos((err, todoResult) => {
    const hasError = !!err
    const result = {
      error: hasError,
      // if we got a DB error return no data to avoid inconsistent results
      todo: hasError ? [] : todoResult.rows,
    }

    const respCode = hasError ? 503 : 200
    res.status(respCode).send(JSON.stringify(result))
  })
})

// register a route for GET requests to '/items' that loads all the todos and shows them to the user.
app.get('/items', (req, res) => {
  getTodos((err, todoResult) => {
    if (err) {
      res.status(503).send('<b>Error getting TODO list</b>')
      return
    }
    let items = ''
    todoResult.rows.forEach(row => items += `<li>${row.entry}</li>`)
    res.send(`<b>TODO list:</b><br/><ul>${items}</ul>`)
  })
})

// register a route to handle POST requests to '/' It creates a TODO in the database and redirects users

app.post('/', (req, res) => {
  if(!req.body || !req.body.todo) {
    res.status(400).send('Expected TODO item')
    return
  }

  saveTodo(req.body.todo, (err, dbRes) => {
    if (err) {
      res.status(503).send(`Unable to save new TODO item: ${req.body.todo}`)
      return
    }
    res.redirect('/')
  })
})

const port = 3000;
app.listen(port, () => console.log(`Todo app listening on port ${port}...`))