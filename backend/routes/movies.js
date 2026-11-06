
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Movie, Actor } = require("../models");
const { Op, Sequelize } = require("sequelize");
const db = require("../models");

//MOVIE AUTOCOMPLETE --Get movie from omdb

router.get("/search-list", async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.json([]);
    }

    const response = await axios.get(
      `http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${process.env.OMDB_API_KEY}`
    );

    if (response.data.Response === "True") {
      return res.json(response.data.Search);
    }

    return res.json([]);

  } catch (error) {
    console.error("Movie suggestions error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

//GET MOVIES WITH SEARCH, CATEGORY FROM DB

router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 12, 1),
      50
    );

    const offset = (page - 1) * limit;
    const { search, category } = req.query;

    const where = {};

    // Filter by category
    if (category && category !== "All Categories") {
      where.category = category;
    }

    // Search by movie title
    if (search && search.trim()) {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    let result = await Movie.findAndCountAll({
      where,
      limit,
      offset,
      order: [["title", "ASC"]]
    });

    // If movie is not in DB, search OMDb

    if (
      search &&
      search.trim() &&
      result.count === 0 &&
      !category
    ) {
      console.log("Movie not found in DB. Fetching from OMDb...");

      const response = await axios.get(
        `http://www.omdbapi.com/?t=${encodeURIComponent(search.trim())}&apikey=${process.env.OMDB_API_KEY}`
      );

      const data = response.data;

      if (data.Response === "True") {

        let movie = await Movie.findOne({
          where: { imdbID: data.imdbID }
        });

        if (!movie) {
          movie = await Movie.create({
            title: data.Title,
            description: data.Plot,
            imageUrl: data.Poster,
            rating:
              data.imdbRating && data.imdbRating !== "N/A"
                ? parseFloat(data.imdbRating)
                : null,
            imdbID: data.imdbID,
            category: data.Genre
              ? data.Genre.split(",")[0].trim()
              : "Unknown"
          });
        }

        // Add actors and associate them with the movie
        if (data.Actors && data.Actors !== "N/A") {
          const actorNames = data.Actors.split(",");

          for (const name of actorNames) {
            const trimmedName = name.trim();

            const [actor] = await Actor.findOrCreate({
              where: { name: trimmedName }
            });

            await movie.addActor(actor);
          }
        }

        // Fetch the results again after inserting the movie
        result = await Movie.findAndCountAll({
          where,
          limit,
          offset,
          order: [["title", "ASC"]]
        });
      }
    }

    // PAGINATION RESPONSE

    res.json({
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
      data: result.rows
    });

  } catch (err) {
    console.error("Movie fetch error:", err);
    res.status(500).json({
      error: "Something went wrong"
    });
  }
});

// SELECT ALL MOVIE CATEGORIES

router.get("/categories", async (req, res) => {
  try {
    const categories = await Movie.findAll({
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col("category")),
          "category"
        ]
      ],
      order: [["category", "ASC"]]
    });

    res.json(
      categories
        .map((item) => item.category)
        .filter(Boolean)
    );

  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({
      error: "Failed to fetch categories"
    });
  }
});

// GET MOVIE BY IMDb ID

router.get("/imdb/:id", async (req, res) => {
  const imdbID = req.params.id;

  try {
    const existing = await db.Movie.findOne({
      where: { imdbID }
    });

    if (existing) {
      return res.json(existing);
    }

    console.log("Fetching movie from OMDb:", imdbID);

    const response = await axios.get(
      `http://www.omdbapi.com/?i=${encodeURIComponent(imdbID)}&apikey=${process.env.OMDB_API_KEY}`
    );

    const data = response.data;

    if (data.Response !== "True") {
      return res.status(404).json({
        error: "Movie not found"
      });
    }

    const movie = await db.Movie.create({
      title: data.Title,
      imdbID: data.imdbID,
      imageUrl:
        data.Poster && data.Poster !== "N/A"
          ? data.Poster
          : null,
      description:
        data.Plot && data.Plot !== "N/A"
          ? data.Plot
          : null,
      rating:
        data.imdbRating && data.imdbRating !== "N/A"
          ? parseFloat(data.imdbRating)
          : null,
      category: data.Genre
        ? data.Genre.split(",")[0].trim()
        : "Unknown"
    });

    return res.json(movie);

  } catch (error) {
    console.error("MOVIE FETCH ERROR:", error.message);

    res.status(500).json({
      error: "Movie fetch failed"
    });
  }
});

module.exports = router;
