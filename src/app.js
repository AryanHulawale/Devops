import { configDotenv } from "dotenv"
import express from "express"
configDotenv()

const app = express()

app.use("/",(req,res)=>{
    res.send("Hello from aquizitions api")
})

export default app