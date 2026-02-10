const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // username daha önce kayıtlı değilse "geçerli" sayalım
  if (!username) return false;
  return users.findIndex((u) => u.username === username) === -1;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  if (!username || !password) return false;
  return users.some((u) => u.username === username && u.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ message: "username ve password zorunludur" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
  req.session.authorization = { accessToken, username };
  // Grader örnek çıktısı ile uyumlu mesaj
  return res.status(200).json({ message: "Login successful" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;
  const review = req.body?.review ?? req.query?.review;

  if (!username) {
    return res.status(401).json({ message: "Giriş gerekli" });
  }
  if (!review) {
    return res.status(400).json({ message: "review zorunludur" });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: "Kitap bulunamadı" });
  }

  books[isbn].reviews[username] = review;
  return res
    .status(200)
    .json({
      message: "Review added/modified successfully",
      isbn,
      reviews: books[isbn].reviews,
    });
});

// Delete a book review (only for the logged-in user)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "Giriş gerekli" });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: "Kitap bulunamadı" });
  }

  const reviews = books[isbn].reviews ?? {};
  if (!Object.prototype.hasOwnProperty.call(reviews, username)) {
    return res.status(404).json({ message: "Silinecek review bulunamadı", isbn });
  }

  delete reviews[username];
  books[isbn].reviews = reviews;
  return res.status(200).json({ message: "Review deleted successfully", isbn, reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
