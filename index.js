const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Schema } = mongoose;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define the Book Schema
const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String },
  publishedYear: { type: Number },
  status: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Book = mongoose.model('Book', bookSchema);

// GET /books - Retrieve all books
app.get('/books', async (req, res) => {
  const { status, sort, page = 1, limit = 10, search } = req.query;
  const filter = status ? { status } : {};
  const query = search ? { ...filter, title: new RegExp(search, 'i') } : filter;
  const sortOrder = sort ? { [sort]: 1 } : {};

  try {
    const books = await Book.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortOrder);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /books/:id - Retrieve a specific book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /books - Add a new book
app.post('/books', async (req, res) => {
  const { title, author, genre, publishedYear, status } = req.body;
  console.log("you got the request from the postman ",req.body)
  if (!title || !author || !status) {
    return res.status(400).json({ message: 'Title, author, and status are required' });
  }

  try {
    const newBook = new Book({
      title,
      author,
      genre,
      publishedYear,
      status,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /books/:id - Update an existing book
app.put('/books/:id', async (req, res) => {
  const { title, author, genre, publishedYear, status } = req.body;

  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, genre, publishedYear, status },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /books/:id - Delete a book
app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
