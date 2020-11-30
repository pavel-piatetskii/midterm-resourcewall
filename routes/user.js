/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {

  const login = (email, password) => {
    //^^ log the user into the system with a given email/password, using getUserWithEmail to find the given user in the DB
    // use bcrypt.compareSync to compare passwords, return user object upon successful validation

    return db.findUserByEmail(email)
      .then(user => {
        if (bcrypt.compareSync(password, user.password)) {
          return user;
        }
        return null;
      });
  };

  router.get('/login', (req, res) => {
    const { email, password } = req.body;
    login(email, password)
      .then(user => {
        if (!user) {
          res.error(401).render('error', { error: "Unauthorized" });
        }
        req.session.userid = user.id;
        res.redirect('/user/:id', user);
      });
  });
  // ^^ more complicated user login, with given email/password, using hashed password and a redirection to the user/:id page.

  router.get('/login/:id', (req, res) => {
    req.session.userid = req.params.id;
    res.redirect('/');
  });
  // very simple user login, input ID and submit to login, set cookie to the ID of user
  // redirect to home page upon success


  router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
  });
  // clear cookies in session upon logout, redirect to home page -> should this be a POST?


  router.post('/register', (req, res) => {
    // register a new user, recieve a user object from the request and pass it thru newUser helper function to add to database
    // return with the new user row from database, set cookie to new user.id and redirect to newly created user/:id page

    const userObj = req.body;
    db.newUser(userObj)
      .then(user => {
        if (!user) {
          res.status(404).render('error', { error: "User not found!" });
        }
        req.session.userid = user.id;
        res.redirect('user', user);
      })
      .catch((err) => {
        console.error('Query error', err.stack);
      });
  });


  router.get('/user/:id', (req, res) => {
    const userID = req.session.user_id;

    if (!userID) {
      res.redirect('/');
    }
    // if no user logged in, redirect to home page

    if (userID !== req.params.id) {
      res.status(401).render('error', { error: "Unauthorized!" });
    }
    // if current active user is not the user/:id in question, set status to 401 and render the 'error' page

    // when it is determined that active user is authorized to view page, use ID to return the user object from the DB
    // pass it into the res.render fn
    db.findUserByID(userID)
      .then(user => {
        if (!user) {
          res.status(404).render('error', { error: "No user with that ID!" });
        }
        res.render('user', user);
      });
  });


  router.post('/user/:id', (req, res) => {
    // check if active user is the user/:id in question by comparing to session.user_id

    if (req.session.user_id !== req.params.id) {
      res.statusCode(401).render('error', { error: "Unauthorized!"});
    }

    const { name, password, email } = req.body;
    const userDetails = [name, password, email, req.session.user_id];

    // update the user row within the database, and render user/:id with the updated information
    db.editUser(userDetails)
      .then(user => {
        res.render('user', user);
      });
  });

  return router;
};