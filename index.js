const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require('dotenv').config()

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// DATA BASE

mongoose.connect(process.env.MONGO_DB_URI);

const userSchema = new mongoose.Schema({
  username:String
});

const User = mongoose.model("User",userSchema);

const excerciseSchema = new mongoose.Schema({
  userId:mongoose.Types.ObjectId,
  description:String,
  duration:Number,
  date:Date
});

const Excercise = mongoose.model("Excercise",excerciseSchema);

// Route

app.post("/api/users",async (req, res) => {
  const username = req.body.username;
  const userObj = new User({username});
  const data = await userObj.save();
  res.json(data);
})

app.get("/api/users", async (req, res)=>{
  const data = await User.find().select(" _id username");
  res.json(data);
})

app.post("/api/users/:_id/exercises", async (req, res)=>{
  const {description, duration, date} = req.body;
  const exerciseObj = new Excercise({
    userId:req.params._id,
    description,
    duration:parseInt(duration),
    date:date?new Date(date):new Date()
  });
  await exerciseObj.save();
  const user = await User.findOne({_id:req.params._id});
  if(!user) {
    res.json("Invalid id");
    return;
  }
  res.json({
    _id:user._id,
    username:user.username,
    description:exerciseObj.description,
    duration:exerciseObj.duration,
    date:exerciseObj.date.toDateString()
  })
})

app.get("/api/users/:_id/logs", async (req, res)=>{
  const _id = req.params._id;
  let filter = {
    userId:_id,
  }
  let {from, to, limit} = req.query;
  let Obj = {}
  if(from) {
    Obj["$gte"] = new Date(from);
  }
  if(to) {
    Obj["$lte"] = new Date(to);
  }
  if(from||to) {
    filter.date = Obj;
  }
  const userObj = await User.findOne({_id});
  const username = userObj.username;
  const data = await Excercise.find(filter).limit(limit).select("-_id -userId -__v");
  const log = data.map((val)=>{
    return ({
      description: val.description,
      duration: val.duration,
      date: String(val.date.toDateString())
    })
  })
  res.json({
    _id,
    username,
    count:data.length,
    log
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
