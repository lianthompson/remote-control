const jwt = require("jsonwebtoken");
const db = require("../services/db");
const { makeId, hash, createTimeStamp } = require("../modules/utilities");

module.exports.createAuthToken = user => {
  return jwt.sign({ user }, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: "HS256"
  });
};

module.exports.createUser = async user => {
  //Does this username or email exist?
  let result = await this.checkUsername(user);
  let emailResult = await this.checkEmail(user);
  if (result === false)
    return {
      username_status:
        "This username already exists, please try a different one"
    };
  if (emailResult === false)
    return {
      email_status: "This email is already in use, unique email is required"
    };

  //Generate UUID, PW Hash
  user.id = makeId();
  user.password = await hash(user.password);
  user.created = createTimeStamp();

  const { username, id, password, email, created } = user;
  const dbPut = `INSERT INTO test (username, id, password, email, created) VALUES($1, $2, $3, $4, $5) RETURNING *`;
  try {
    const res = await db.query(dbPut, [username, id, password, email, created]);
    console.log("db insertion result: ", res.rows[0]);
    return { status: "New account created!" };
  } catch (err) {
    console.log(err.stack);
  }
};

/* note from Gedd: 
CREATE UNIQUE INDEX username_idx ON test (username);
Gedyy: would prevent i dont know time attacks if thats what you can call them
Gedyy: 2 requests happening at the same time so they both check past the username exists check adding the user twice
Gedyy: in pgadmin query tool
*/

//Check for duplicate usernames
module.exports.checkUsername = async user => {
  const { username } = user;
  const checkName = `SELECT COUNT(*) FROM test WHERE username = $1 LIMIT 1`;
  const checkRes = await db.query(checkName, [username]);
  console.log(checkRes.rows[0].count);
  if (checkRes.rows[0].count > 0) {
    return false;
  } else {
    return true;
  }
};

//Check for duplicate emails
module.exports.checkEmail = async user => {
  const { email } = user;
  const checkName = `SELECT COUNT(*) FROM test WHERE email = $1 LIMIT 1`;
  const checkRes = await db.query(checkName, [email]);
  console.log(checkRes.rows[0].count);
  if (checkRes.rows[0].count > 0) {
    return false;
  } else {
    return true;
  }
};
