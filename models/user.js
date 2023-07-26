/** User class for message.ly */
const db = require('../db');
const bcrypt = require('bcrypt');
const {BCRYPT_WORK_FACTOR} = require('../config')
const ExpressError = require('../expressError')

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
      const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
      const results = await db.query("INSERT INTO users(username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp) RETURNING username, password, first_name, last_name, phone", [username, hashed_password, first_name, last_name, phone])
      return results.rows[0]
    }
  

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
      if(!username || !password) throw new ExpressError("Enter a value", 400);
      const results = await db.query("SELECT username, password FROM users WHERE username = $1", [username]);
      const user = results.rows[0]
      if(user) {
        const result = await bcrypt.compare(password, user.password);
        return result
        }
      throw new ExpressError("User not found", 400)
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
      const results = await db.query("UPDATE users SET last_login_at = current_timestamp WHERE username = $1 RETURNING username", [username]);
      if(!results.rows[0]) throw new ExpressError('User not found', 404)
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
      const results = await db.query("SELECT username, first_name, last_name, phone FROM users");
      if(results.rows.length === 0) throw new ExpressError("Data not found", 404)
      return results.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
      const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`, [username]);
      if(!results.rows[0]) throw new ExpressError(`No such user: ${username}`, 404);
      return results.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
      const results = await db.query('SELECT messages.id, messages.to_username, messages.body, messages.sent_at, messages.read_at, users.first_name, users.last_name, users.phone FROM messages JOIN users ON messages.to_username = users.username WHERE from_username = $1', [username]);
      return results.rows.map(m => ({
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
      const results = await db.query("SELECT messages.id, messages.from_username, messages.body, messages.sent_at, messages.read_at, users.first_name, users.last_name, users.phone FROM messages JOIN users ON messages.from_username = users.username WHERE to_username = $1", [username]);
      
      return results.rows.map(m => ({
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }));
  }
}


module.exports = User;