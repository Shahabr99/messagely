const ExpressError = require('../expressError');
const router = new ExpressError.Router();
const Message = require('../models/message')
const {ensureLoggedIn} = require('../middleware/auth')



/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn,async function(req, res, next) {
  try {
    const {id} = req.params;
    const user = req.user;
    const message = await Message.get(id);
    if(message.from_user.username !== user.username || message.to_user.username !== user.username){
      throw new ExpressError("Access denied", 403)
    }
    return res.json({message})
  }catch(e){
    return next(e)
  }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
  try{
    const username = req.user.username;
    const {to_username, body} = req.body;
    const message = await Message.create({username, to_username, body})
    return res.json(message.rows[0])
  }catch(e){
    return next(e)
  }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
  try {
    const {id} = req.params;
    const user = req.user.username;
    const message = await Message.get(id);
    if(!message.to_user.username === user) {
      throw new ExpressError("access Denied", 403)
    }
    const read = await Message.markRead(id);
    return res.json({read})
  }catch(e){
    return next(e)
  }
});
  