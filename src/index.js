const express= require("express")
const bodyParser= require("body-parser")
const route= require("../src/route/route")
const mongoose= require("mongoose")
const multer = require('multer');
const app= express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

mongoose.set('strictQuery', true);
mongoose.connect("put MongoDB string here", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});