const axios = require("axios");
const { Movie } = require("../models");
require("dotenv").config();

async function seed() {
  try {
    console.log("Using API key:", process.env.OMDB_API_KEY);

    await Movie.destroy({ where: {}, truncate: true });

    const movies = [
      { title: "The Matrix", category: "Action" },
      { title: "Inception", category: "Sci-Fi" },
      { title: "The Godfather", category: "Crime" },
      { title: "Batman Begins", category: "Action" },
      { title: "The Dark Knight", category: "Action" },
      { title: "The Shawshank Redemption", category: "Drama" },
      {title: "Wedding Crashers", category: "Comedy"},
      {title: "Tron", category: "Sci-Fi"},
      {title:"Love Actually", category: "Romantic Comedy"}
    ];

    for (const m of movies) {
      console.log("Fetching:", m.title);

      const res = await axios.get(
        `http://www.omdbapi.com/?t=${encodeURIComponent(
          m.title
        )}&apikey=${process.env.OMDB_API_KEY}`
      );

      const data = res.data;

      if (data.Response === "True") {
        await Movie.create({
          title: data.Title,
          category: m.category,
          description: data.Plot,
          imageUrl: data.Poster,
          rating:
            data.imdbRating !== "N/A"
              ? parseFloat(data.imdbRating)
              : 0,
          imdbID: data.imdbID,
        });

        console.log(`✅ ${data.Title} added`);
      } else {
        console.warn(`⚠️ OMDb error for ${m.title}:`, data.Error);
      }
    }

    console.log("✅ Seeding completed");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    process.exit();
  }
}

seed();