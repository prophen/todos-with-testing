const pg = require('pg')
const dbConnectionSting = process.env.DB_CONNECTION_STRING
const dbPool = new pg.Pool({ connectionString: dbConnectionSting})
console.log(dbConnectionSting)

dbPool.on('error', (err, client) => {
  console.error('Unexpected error on client', err)
  process.exit(-1)
})

// Retrieve all todos as database records from postgresql and provide them to the passed in callback function

// load express
const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.json())

// the default endpoint will just return a JSON representation of the TODO items that we know about

app.get('/', (req, res) => {
  dbPool.query('SELECT id, entry FROM todo_items', (err, queryResult) => {
    const result = {
      error: !!err,
      todo: queryResult.rows,
    }

    const respCode = result.error ? 503 : 200
    res.send(respCode, JSON.stringify(result))
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