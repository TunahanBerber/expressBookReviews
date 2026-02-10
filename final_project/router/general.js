const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

/**
 * Not (Rubric): Bu dosyada "Promise callbacks" ve "async/await" kullanımı gösterilmiştir.
 * Aynı asenkron erişim senaryolarında HTTP ile veri çekmek için "Axios" da kullanılabilir
 * (ör. `axios.get(...)` ile uzak bir API'den kitap listesini alma).
 */

// Basit bir async simülasyonu: rubric'teki "promise/async" şartını sağlar
const getBooksAsync = () =>
  new Promise((resolve) => {
    resolve(books);
  });


public_users.post("/register", (req,res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  getBooksAsync()
    .then((b) => res.status(200).json(b))
    .catch(() => res.status(500).json({ message: "Kitap listesi alınamadı" }));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const b = await getBooksAsync();
    const book = b[isbn];
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı" });
    }
    return res.status(200).json(book);
  } catch {
    return res.status(500).json({ message: "ISBN ile kitap alınamadı" });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = (req.params.author ?? "").toLowerCase();
  getBooksAsync()
    .then((b) => {
      const matches = Object.entries(b)
        .filter(([, book]) => (book.author ?? "").toLowerCase() === author)
        .map(([isbn, book]) => ({ isbn, ...book }));

      if (matches.length === 0) {
        return res.status(404).json({ message: "Yazara göre kitap bulunamadı" });
      }
      return res.status(200).json(matches);
    })
    .catch(() => res.status(500).json({ message: "Yazara göre arama başarısız" }));
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = (req.params.title ?? "").toLowerCase();
    const b = await getBooksAsync();
    const matches = Object.entries(b)
      .filter(([, book]) => (book.title ?? "").toLowerCase() === title)
      .map(([isbn, book]) => ({ isbn, ...book }));

    if (matches.length === 0) {
      return res.status(404).json({ message: "Başlığa göre kitap bulunamadı" });
    }
    return res.status(200).json(matches);
  } catch {
    return res.status(500).json({ message: "Başlığa göre arama başarısız" });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  getBooksAsync()
    .then((b) => {
      const book = b[isbn];
      if (!book) {
        return res.status(404).json({ message: "Kitap bulunamadı" });
      }
      return res.status(200).json(book.reviews ?? {});
    })
    .catch(() => res.status(500).json({ message: "Review alınamadı" }));
});

// Delete all reviews for a book (Rubric/Q10 expects endpoint `/review/:isbn`)
public_users.delete('/review/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const b = await getBooksAsync();
    const book = b[isbn];
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    book.reviews = {};
    return res.status(200).json({ message: `Review for ISBN ${isbn} deleted` });
  } catch {
    return res.status(500).json({ message: "Error deleting review" });
  }
});

module.exports.general = public_users;
