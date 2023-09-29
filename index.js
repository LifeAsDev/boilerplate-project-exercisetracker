const express = require('express')
const app = express()
const cors = require('cors')

const mongoose = require("mongoose");
const mySecret = process.env.MONGO_URI;

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });



const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }, log: [{
    description: {
      type: String,
      required: true
    }
    , duration: {
      type: Number,
      required: true
    }
    , date: {
      type: String,
      required: true
    }
  }],
})
let User = mongoose.model("User", userSchema);


require('dotenv').config()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const morgan = require("morgan");

app.use(
  morgan(":method ':url' :status - :response-time ms")
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.get("/api/users", (req, res) => { User.find({}).then(result => { res.send([...result]) }) });

app.get("/api/users/:_id/logs", (req, res) => {
  let { from, to, limit } = req.query;

  // Verificar si from existe en req.query y es una fecha válida
  if (from && !isValidDate(from)) {
    res.status(400).json({ error: "from date is invalid" }); // "¡De vuelta al futuro!" - Back to the Future
    return;
  }

  // Verificar si to existe en req.query y es una fecha válida
  if (to && !isValidDate(to)) {
    res.status(400).json({ error: "to date is invalid" }); // "¡De vuelta al futuro!" - Back to the Future
    return;
  }

  // Formatear fechas a "Mon Jan 01 1990"
  if (from) {
    from = new Date(from).toDateString();
  }

  if (to) {
    to = new Date(to).toDateString();
  }

  User.findOne({ _id: req.params._id })
    .then(result => {
      let logsWithoutId = result.log.map(({ _id, description, duration, date }) => ({
        description,
        duration,
        date
      }));
      if (from) {
        logsWithoutId = logsWithoutId.filter(log => {
          const dateFrom = new Date(from)
          const logDate = new Date(log.date)
          return logDate >= dateFrom
        })
      }
      if (to) {
        logsWithoutId = logsWithoutId.filter(log => {
          const dateFrom = new Date(to)
          const logDate = new Date(log.date)
          return logDate <= dateFrom
        })
      }


      if (limit) {
        logsWithoutId = logsWithoutId.slice(0, parseInt(limit));
      }
      console.log({
        _id: result._id,
        username: result.username,
        count: logsWithoutId.length,
        log: logsWithoutId
      })
      res.json({
        _id: result._id,
        username: result.username,
        count: logsWithoutId.length,
        log: logsWithoutId
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// Función para verificar si es una fecha válida
function isValidDate(dateString) {
  return !isNaN(Date.parse(dateString));
}

function checkDate(cadena) {
  const fecha = new Date(cadena);

  return !isNaN(fecha) && fecha.toString() !== 'Invalid Date';
}

app.post("/api/users/:_id/exercises", (req, res) => {

  //The FORCE is strong with him
  if (isNaN(req.body.duration)) {
    console.log({ duration: req.body.duration, error: "ValidationError: Exercises validation failed: duration: Cast to Number failed" })
    return res.send('ValidationError: Exercises validation failed: duration: Cast to Number failed')
  } //The force is weak with this one, can be converted to NUMBERSIDE
  else {
    req.body.duration = parseInt(req.body.duration, 10)
  }
  console.log(req.body)
  if (req.body.date === "" || req.body.date === undefined) {
    req.body.date = new Date().toDateString();
  }
  else if (!checkDate(req.body.date)) {
    // Referencia a "The Matrix" XD is a joke bro
    console.log({ error: "Invalid Date. There is no spoon.", date: req.body.date });

    return res.send("Invalid Date. There is no spoon.");
  } else {
    /*Formatting is like a box of chocolates, you never know what you're gonna get.*/
    req.body.date = new Date(req.body.date).toDateString()
  }

  req.body
  const objLog = { description: req.body.description, duration: req.body.duration, date: req.body.date };

  User.findOneAndUpdate(
    { _id: req.params._id },
    { $push: { log: objLog } }, {
    new: true
  }
  )
    .then((result) => {
      console.log({
        _id: result._id, username: result.username, date: objLog.date, duration: objLog.duration, description: objLog.description
      });
      res.json({
        _id: result._id, username: result.username, date: objLog.date, duration: objLog.duration, description: objLog.description
      });
    })
    .catch((err) => {
      console.log("errorcirijillo" + err);
      res.send(err);
    });
});

app.post("/api/users", (req, res) => {
  User.create({
    username: req.body.username, log: []
  })
    .then((result) => {
      console.log({ username: req.body.username, _id: result._id });
      res.json({ username: req.body.username, _id: result._id })
    })
    .catch((err) => {
      res.send(err)
    })
});