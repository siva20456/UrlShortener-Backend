const express = require('express');
const pool = require('./database');
require('dotenv').config()
const bcrypt = require('bcrypt')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const port = process.env.PORT || 3005

pool.connect((err) => {
    if (err) throw err
    console.log('Connected PostgreSQL')
});

const app = express()

app.use(cors())
app.use(express.json())

// pool.query(`create table analytics(user_id INT REFERENCES users(user_id),urllink VARCHAR(255) NOT NULL,clicks INT,CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id));
// `,(err,result) => {
//     if(err){
//         console.log(err)
//     }
//     console.log(result)
// })

// fun = async() => {
//     const username = 'peter'
//     const password = 'peter123'
//     const user = await pool.query(`delete from users where username='${username}';`)
//     console.log(user,'hello')
//     if(user.rows.length == 0){
//         console.log('possible')
//     }else if(user.rows.length > 0){
//         console.log('not possible')
//     }
// }

app.get('/',(req,res,next) => {
    res.send('Hello World')
})

app.post('/register', async (req, res, next) => {
    try {
        console.log(req.body)
        const { username,password } = req.body
        console.log(username, password)
        const user_query = `SELECT * FROM users WHERE username='${username}';`
        const db_user = await pool.query(user_query)
        console.log(db_user,'Res')

        if (db_user.rowCount == 0) {
            const hashed_password = await bcrypt.hash(password, 10)
            const append_user = `INSERT INTO users(username,hashed_password)
            VALUES('${username}','${hashed_password}');`
            const feed = await pool.query(append_user)
            console.log(feed,'REs1')
            // res.status(200).send({data:'Registered Successfully'})
            const payload = {
                username: username
            }
            const jwt_token = jwt.sign(payload, `Secret Token`)
            res.send({ jwt_token })
        } else if (db_user.rowCount > 0) {
            res.status(400).send({ error: 'User is already in use' })
        } 
        else {
            res.status(400).send({ error: 'Try again with different values' })
        }
        // console.log(params.details)



    } catch (e) {
        console.error(e)
    }
})

app.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body
      const user_query = `SELECT * FROM users WHERE username = '${username}';`
      const user_data = await pool.query(user_query)
      // res.send(user_data)
      console.log(user_data)
      if (user_data.rowCount == 0) {
        res.status(400).send({
          error: "User Not Found"
        })
      } else {
        const user = user_data.rows[0]
        console.log(user,'user')
        const is_password_true = await bcrypt.compare(password, user.hashed_password)
        if (is_password_true === true) {
          const payload = {
            username
          }
          const jwt_token = jwt.sign(payload, `Secret Token`)
          res.send({ jwt_token })
          console.log(username)
        } else {
          res.status(400).send({
            error: "Incorrect Password"
          })
        }
      }
  
    } catch (e) {
      console.error(e)
    }
})




app.listen(port, () => {
    console.log('Server is running on', port)
})
