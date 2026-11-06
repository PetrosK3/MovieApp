const express = require("express");
const axios = require("axios");
const { Op } = require("sequelize");

const router = express.Router();
const db = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

// All collection endpoints require authentication
router.use(authMiddleware);

//USER'S PERSONAL COLLECTION


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

    if (category && category !== "All Categories") {
      where.category = category;
    }

    if (search && search.trim()) {
      where.title = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const total = await user.countFavoriteMovies({
      where
    });

    const movies = await user.getFavoriteMovies({
      where,
      limit,
      offset,
      order: [["title", "ASC"]],
      joinTableAttributes: []
    });

    return res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: movies
    });

  } catch (error) {
    console.error("Collection fetch error:", error);

    return res.status(500).json({
      message: "Unable to fetch your movie collection."
    });
  }
});


//USER'S PERSONAL CATEGORIES

router.get("/categories", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const movies = await user.getFavoriteMovies({
      attributes: ["category"],
      joinTableAttributes: []
    });

    const categories = [
      ...new Set(
        movies
          .map(movie => movie.category)
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b));

    return res.json(categories);

  } catch (error) {
    console.error("Collection categories error:", error);

    return res.status(500).json({
      message: "Unable to fetch collection categories."
    });
  }
});


//ADD MOVIE TO USER'S COLLECTION

router.post("/", async (req, res) => {
  try {
    const { imdbID } = req.body;

    if (typeof imdbID !== "string" || !/^tt\d+$/.test(imdbID)) {
      return res.status(400).json({
        message: "A valid IMDb ID is required."
      });
    }

    if (!process.env.OMDB_API_KEY) {
      return res.status(500).json({
        message: "OMDb API configuration is missing."
      });
    }

    let movie = await db.Movie.findOne({
      where: { imdbID }
    });

    if (!movie) {
      const response = await axios.get(
        "https://www.omdbapi.com/",
        {
          params: {
            i: imdbID,
            apikey: process.env.OMDB_API_KEY
          }
        }
      );

      const data = response.data;

      if (data.Response !== "True") {
        return res.status(404).json({
          message: data.Error || "Movie not found."
        });
      }

      const rating = parseFloat(data.imdbRating);

      const movieData = {
        title: data.Title,
        category:
          data.Genre && data.Genre !== "N/A"
            ? data.Genre.split(",")[0].trim()
            : "Unknown",
        description:
          data.Plot && data.Plot !== "N/A"
            ? data.Plot
            : null,
        imageUrl:
          data.Poster && data.Poster !== "N/A"
            ? data.Poster
            : null,
        rating: Number.isFinite(rating) ? rating : null,
        imdbID: data.imdbID
      };

      try {
        movie = await db.Movie.create(movieData);

      } catch (createError) {
        if (createError.name !== "SequelizeUniqueConstraintError") {
          throw createError;
        }

        movie = await db.Movie.findOne({
          where: { imdbID }
        });

        if (!movie) {
          throw createError;
        }
      }
    }

    const [, created] = await db.UserMovie.findOrCreate({
      where: {
        userId: req.user.id,
        movieId: movie.id
      },
      defaults: {
        userId: req.user.id,
        movieId: movie.id
      }
    });

    if (!created) {
      return res.status(200).json({
        message: "This movie is already in your collection.",
        movie
      });
    }

    return res.status(201).json({
      message: "Movie added to your collection successfully.",
      movie
    });

  } catch (error) {
    console.error("Add movie error:", error);

    return res.status(500).json({
      message: "Unable to add movie to your collection."
    });
  }
});

//DELETE MOVIE FROM USER'S COLLECTION

router.delete("/:movieId", async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({
        message: "Invalid movie ID."
      });
    }

    const deletedRows = await db.UserMovie.destroy({
      where: {
        userId: req.user.id,
        movieId
      }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        message: "Movie not found in your collection."
      });
    }

    return res.json({
      message: "Movie removed from your collection successfully."
    });

  } catch (error) {
    console.error("Remove movie error:", error);

    return res.status(500).json({
      message: "Unable to remove movie from your collection."
    });
  }
});

module.exports = router;