const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    content: String,
    date: Date
})

module.exports = mongoose.model("Message", messageSchema)