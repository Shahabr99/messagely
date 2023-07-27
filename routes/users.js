const router = express.Router();
const ExpressError = require('../expressError');
const SECRET_KEY = require('../config');
const User = require('../models/user');
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth')
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    const results = await User.all();
    if(results.rows.length === 0) throw new ExpressError("nothing found", 404)
    return res.json({users: results.rows})
  }catch(e){
    return next(e)
  }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser,async function(req, res, next) {
  try {
    const {username} = req.params;
    const user = await User.get(username)
    if(user) {
      return res.json({user})
    }
  }catch(e){
    return next(e)
  }
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async function(req, res, next) {
  try{
    const {username} = req.body;
    const messages = await User.messagesTo(username);
    if(!messages) throw new ExpressError("No messages!💥", 404)
    return res.json({messages})
  }catch(e){
    return next(e)
  }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async function(req, res, next) {
  try {
    const {username} = req.params;
    const messages = await User.messagesFrom(username);
    return res.json({messages})
  }catch(e) {
    return next(e)
  }
})