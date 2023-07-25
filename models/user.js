/** User class for message.ly */
const db = require('../db');
const bcrypt = require('bcrypt');
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require('../config')
const ExpressError = require('../expressError')

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    try{
      const hashed_password = bcrypt.hash(password, BCRYPT_WORK_FACTOR)
      const results = await db.query("INSERT INTO users(username, password, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING username, password, first_name, last_name, phone", [username, hashed_password, first_name, last_name, phone])
      return results.json(results.rows[0])
    }catch(e){
      return next(e)
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      if(!username || !password) throw new ExpressError("Enter a value", 400);
      const results = await db.query("SELECT username, password FROM users WHERE username = $1", [username]);
      const user = results.rows[0]
      if(user) {
        if(await bcrypt.check(password, user.password)) {
          const token = jwt.sign({username}, SECRET_KEY);
          return results.json("Verified", token)
        }
      }
      throw new ExpressError("User not found", 400)
    }catch(e){
      return next(e)
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      const user = await db.query("SELECT username, last_login_at FROM users WHERE username = $1", [username]);
      if(user) {
        const curr_timestamp = new Date()

        await db.query("UPDATE users SET last_login_at = $1 WHERE username = $2 RETURNING last_login_at", [curr_timestamp, username])
      }else{
        throw new ExpressError('User not found', 400)
      }
    }catch(e){
      return next(e)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;