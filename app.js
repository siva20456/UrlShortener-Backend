const express = require('express');
const pool = require('./database');
require('dotenv').config()
const bcrypt = require('bcrypt')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const Authorization = require('./Middlewares/Authorizing')

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


const CheckValidity = async () => {
  const query = `SELECT * FROM urls WHERE EXTRACT(EPOCH FROM (NOW()::timestamp - createddate::timestamp))  >= EXTRACT(EPOCH FROM expirydate::timestamp);`
  const feed = await pool.query(query)
  console.log(feed)
  const urlNames = feed.rows.map(e => e.urllink)
  console.log(urlNames)
  urlNames.forEach(async(e) => {
    const q1 = `DELETE FROM urls WHERE urllink = '${e}';`
    const q2 = `DELETE FROM analytics WHERE urllink = '${e}';`
    await pool.query(q1)
    await pool.query(q2)
  })
}


app.get('/', (req, res, next) => {
  res.send('Hello World')
})

app.post('/register', async (req, res, next) => {
  try {
    console.log(req.body)
    const { username, password } = req.body
    console.log(username, password)
    const user_query = `SELECT * FROM users WHERE username='${username}';`
    const db_user = await pool.query(user_query)
    console.log(db_user, 'Res')

    if (db_user.rowCount == 0) {
      const hashed_password = await bcrypt.hash(password, 10)
      const append_user = `INSERT INTO users(username,hashed_password)
            VALUES('${username}','${hashed_password}');`
      const feed = await pool.query(append_user)
      console.log(feed, 'REs1')
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
      console.log(user, 'user')
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

app.post('/addUrl', Authorization, async (req, res, next) => {
  try {
    const { url, website } = req.body
    const { username } = req
    console.log(url, website, username)
    const query = `SELECT * FROM urls WHERE urllink = '${url}';`
    const data = await pool.query(query)
    // res.send(user_data)
    console.log(data)
    if (data.rowCount > 0) {
      res.status(400).send({
        error: "URL Already In Use..!"
      })
    } else {
      const user_data = await pool.query(`SELECT * FROM users WHERE username='${username}'`)
      const user = user_data.rows[0]
      const add_query_urls = `INSERT INTO urls(user_id,urllink,origin,createddate,expirydate)
      VALUES(${user.user_id},'${url}','${website}',NOW(),NOW() + INTERVAL '48 hour');`;
      const feed = await pool.query(add_query_urls)
      const added_url = await pool.query(`SELECT * FROM urls WHERE urllink = '${url}'`)
      const url_id = added_url.rows[0].url_id
      console.log(url_id)
      const add_query_analytics = `INSERT INTO analytics(urllink,user_id,clicks)
      VALUES('${url}','${user.user_id}',0);`
      const add_analytics = await pool.query(add_query_analytics)
      console.log(feed, add_analytics)
      res.send({ data: 'URL Added Successfully..!' })
    }

  } catch (e) {
    console.error(e)
  }
})

app.get('/analytics', Authorization, async (req, res, next) => {
  try {
    const { username } = req
    console.log(username)
    CheckValidity()
    const user_data = await pool.query(`SELECT * FROM users WHERE username='${username}'`)
    const user = user_data.rows[0]
    const query = `SELECT * FROM urls WHERE user_id = '${user.user_id}';`
    const url_data = await pool.query(query)

    const analytics_query = `SELECT * FROM analytics WHERE user_id = ${user.user_id}`
    const analytics = await pool.query(analytics_query)
    console.log(url_data, analytics)
    res.send({ data: { urls: [...url_data.rows], analytics: [...analytics.rows] } })

  } catch (e) {
    console.error(e)
    res.status(400).send({ error: 'Something went wrong..!' })
  }
})

app.post('/getOrigin', async (req, res, next) => {
  try {
    const { urllink } = req.body
    CheckValidity()
    const count_arr = await pool.query(`SELECT clicks FROM analytics WHERE urllink='${urllink}';`)
    console.log(count_arr)
    if (count_arr.rowCount === 0) {
      res.status(400).send({ error: 'Link is not valid' })
    } else {


      const count = count_arr.rows[0].clicks
      const feed = await pool.query(`UPDATE analytics SET clicks = ${count + 1} WHERE urllink = '${urllink}'`);
      const url_arr = await pool.query(`SELECT origin FROM urls WHERE urllink='${urllink}';`)
      const origin = url_arr.rows[0].origin
      console.log(origin, count, 'hi')
      res.send({ data: origin })
    }
  } catch (e) {
    console.log(e)
    res.status(400).send({ error: 'Something went wrong..!' })
  }
})

app.post('/addClick', Authorization, async (req, res, next) => {
  try {
    const { link } = req.body
    const count_arr = await pool.query(`SELECT clicks FROM analytics WHERE urllink='${link}';`)
    console.log(count_arr)
    const count = count_arr.rows[0].clicks
    const feed = await pool.query(`UPDATE analytics SET clicks = ${count + 1} WHERE urllink = '${link}'`);
    console.log(feed)
  } catch (e) {
    console.log(e)
    res.status(400).send({ error: 'Something went wrong..!' })
  }
})


app.listen(port, () => {
  console.log('Server is running on', port)
})

