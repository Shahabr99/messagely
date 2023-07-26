const router = express.Router();
const ExpressError = require('../expressError');
const User = require('../models');
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken')
const authenticateJWT = require('../middleware/auth')
const SECRET_KEY = require('../config')


/** POST /login - login: {username, password} => {token}
 * 
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function(req, res, next) {
  try{
    const {username, password} = req.body
    if(!username || !password) throw new ExpressError("Username/password missing", 400)
    const result = await User.authenticate(username, password);
    if(result) {
      User.updateLoginTimestamp(username)
      const token = jwt.sign({username}, SECRET_KEY)
      return res.json({token})
    }
    throw new ExpressError("Authentication failed", 400)
  }catch(e){
    return next(e)
  }
})




/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async function(req, res, next) {
  try {
    const {username, password, first_name, last_name, phone} = req.body;
    const user = await User.register(username, password, first_name, last_name, phone);
    const token = jwt.sign(user.username, SECRET_KEY);
    User.updateLoginTimestamp(user.username)
    return res.json([token])

  }catch(e) {
    return next(e)
  }
})