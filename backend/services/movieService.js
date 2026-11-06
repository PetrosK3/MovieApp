const fetchMovieByImdbID = async (imdbID) => {
  const existing = await Movie.findOne({ where: { imdbID } });

  if (existing) return existing;

  const response = await axios.get(
    `http://www.omdbapi.com/?i=${imdbID}&apikey=${process.env.OMDB_API_KEY}`
  );

  const data = response.data;

  const movie = await Movie.create({
    title: data.Title,
    imdbID: data.imdbID,
    imageUrl: data.Poster,
    rating: data.imdbRating,
    category: data.Genre,
  });

  return movie;
};

module.exports = {
  fetchMovieByImdbID,
};