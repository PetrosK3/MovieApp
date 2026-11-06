
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Op } = require("sequelize");

const db = require("../models");

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

router.get("/", async (req, res) => {
  const search = req.query.search;

  if (!search || !search.trim()) {
    return res.json([]);
  }

  try {
    // Search actors directly in TMDb
    const response = await axios.get(
      `${TMDB_API_URL}/search/person`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: search.trim(),
          include_adult: false,
          language: "en-US",
          page: 1
        }
      }
    );

    const people = response.data.results || [];

    const result = [];

    // Process the first 10 matching actors
    for (const person of people.slice(0, 10)) {

      // Ignore results without a name
      if (!person.name) {
        continue;
      }

      // Find or create actor in db
      let actor = await db.Actor.findOne({
        where: {
          [Op.or]: [
            { tmdbId: person.id },
            { name: person.name }
          ]
        }
      });

      if (!actor) {
        actor = await db.Actor.create({
          name: person.name,
          tmdbId: person.id,
          profilePath: person.profile_path
        });
      } else {
        // Update existing actor with TMDb information
        await actor.update({
          name: person.name,
          tmdbId: person.id,
          profilePath: person.profile_path
        });
      }

      // Get actor's movie credits from TMDb
      const creditsResponse = await axios.get(
        `${TMDB_API_URL}/person/${person.id}/movie_credits`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: "en-US"
          }
        }
      );

      const movieCredits = creditsResponse.data.cast || [];

      // Associate only movies that already exist in our database
      for (const credit of movieCredits) {

        if (!credit.title) {
          continue;
        }

        const movie = await db.Movie.findOne({
          where: {
            title: {
              [Op.iLike]: credit.title
            }
          }
        });

        if (movie) {
          await actor.addMovie(movie);
        }
      }

      // Retrieve actor including associated movies
      const actorWithMovies = await db.Actor.findByPk(actor.id, {
        include: db.Movie
      });

      const actorData = actorWithMovies.toJSON();

      // Build full TMDb image URL
      actorData.profileUrl = person.profile_path
        ? `${TMDB_IMAGE_URL}${person.profile_path}`
        : null;

      result.push(actorData);
    }

    res.json(result);

  } catch (error) {

    console.error(
      "TMDb actor search failed:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Actor search failed"
    });
  }
});

module.exports = router;
