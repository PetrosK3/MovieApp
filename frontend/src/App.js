import { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

const API_URL = "http://localhost:4000/api";

function Home() {
  const { user, loading } = useAuth();
  const [movies, setMovies] = useState([]);
  const [actors, setActors] = useState([]);

  const [movieSearch, setMovieSearch] = useState("");
  const [actorSearch, setActorSearch] = useState("");

  const [movieSuggestions, setMovieSuggestions] = useState([]);

  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingActors, setLoadingActors] = useState(false);

  const [movieSearched, setMovieSearched] = useState(false);
  const [actorSearched, setActorSearched] = useState(false);

  const [error, setError] = useState("");
  const actorsSectionRef = useRef(null);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  const [activeMovieSearch, setActiveMovieSearch] = useState("");
  const MOVIES_PER_PAGE = 12;
  const [movieToRemove, setMovieToRemove] = useState(null);

  //INITIAL LOAD

	  useEffect(() => {
	  fetchMovies("", "All Categories", 1);
	  fetchCategories();
	}, []);
	
  const fetchCategories = async () => {
	try {
  const res = await fetch(`${API_URL}/collection/categories`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Could not fetch categories");
    }

  const data = await res.json();

    setCategories(Array.isArray(data) ? data : []);

  } catch (err) {
    console.error("Categories fetch error:", err);
  }
	};

  // MOVIE AUTOCOMPLETE (OMDb)

  useEffect(() => {
    if (!movieSearch.trim()) {
      setMovieSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = encodeURIComponent(movieSearch.trim());

        const res = await fetch(
          `${API_URL}/movies/search-list?query=${query}`
        );

        if (!res.ok) {
          throw new Error("Movie suggestions failed");
        }

        const data = await res.json();

        setMovieSuggestions(
          Array.isArray(data) ? data : data.Search || []
        );
      } catch (err) {
        console.error("Movie suggestions error:", err);
        setMovieSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [movieSearch]);

  // FETCH MOVIES

  const fetchMovies = async (
  searchTerm = "",
  category = selectedCategory,
  pageNumber = 1
) => {
  try {
    setLoadingMovies(true);
    setError("");

    const params = new URLSearchParams();

    params.append("page", pageNumber);
    params.append("limit", MOVIES_PER_PAGE);

    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    if (category && category !== "All Categories") {
      params.append("category", category);
    }

    const res = await fetch(
      `${API_URL}/collection?${params.toString()}`,
      {
        credentials: "include"
      }
    );

    if (!res.ok) {
      throw new Error("Could not fetch your collection");
    }

    const data = await res.json();

    setMovies(Array.isArray(data.data) ? data.data : []);

    setTotalMovies(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setCurrentPage(data.page || 1);

    setActiveMovieSearch(searchTerm.trim());
    setMovieSearched(Boolean(searchTerm.trim()));

  } catch (err) {
    console.error("Collection fetch error:", err);
    setError("Unable to load your movie collection. Please try again.");
  } finally {
    setLoadingMovies(false);
  }
};

  
  //Διαλέγω ταινία από IMDb ID
 

  const fetchMovieById = async (imdbID) => {
  try {
    setLoadingMovies(true);
    setError("");

    const res = await fetch(`${API_URL}/collection`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imdbID })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Could not add movie to collection"
      );
    }

    console.log(data.message);

    // Clear search field and suggestions
    setMovieSearch("");
    setMovieSuggestions([]);

    // Return to all categories
    setSelectedCategory("All Categories");

    // Reload the user's personal collection
    await fetchMovies("", "All Categories", 1);

    // Refresh categories
    await fetchCategories();

  } catch (err) {
    console.error("Add movie error:", err);
    setError(err.message || "Unable to add movie to your collection.");
  } finally {
    setLoadingMovies(false);
  }
};
	const removeMovie = async (movieId) => {
    try {
        const response = await fetch(`${API_URL}/collection/${movieId}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not remove movie.");
        }

        // Refresh the user's collection
        await fetchMovies("", selectedCategory, 1);
        await fetchCategories();

    } catch (error) {
        console.error("Error removing movie:", error);
        setError(error.message);
    }
};

  // MOVIE SEARCH BUTTON

	const handleMovieSearch = () => {
	  if (!movieSearch.trim()) {
		return;
	  }

	  fetchMovies(movieSearch, selectedCategory, 1);

	  setMovieSearch("");
	  setMovieSuggestions([]);
	};
	
	const handleCategoryChange = (e) => {
	const category = e.target.value;

	  setSelectedCategory(category);
	  setMovieSearch("");
	  setMovieSuggestions([]);

	  fetchMovies("", category, 1);
	};

	const handlePageChange = (page) => {
	  if (
		page < 1 ||
		page > totalPages ||
		page === currentPage
	  ) {
		return;
	  }

	  fetchMovies(activeMovieSearch, selectedCategory, page);
	};

  //FETCH ACTORS

  const fetchActors = async () => {
    if (!actorSearch.trim()) {
      return;
    }

    try {
      setLoadingActors(true);
      setError("");
      setActorSearched(true);

      const query = encodeURIComponent(actorSearch.trim());

      const res = await fetch(
        `${API_URL}/actors?search=${query}`
      );

      if (!res.ok) {
        throw new Error("Could not fetch actors");
      }

      const data = await res.json();

      setActors(Array.isArray(data) ? data : []);
		setActorSearch("");

		// Scroll to actors section after results are rendered
		setTimeout(() => {
		  actorsSectionRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		  });
		}, 100);

    } catch (err) {
      console.error("Actor search error:", err);
      setError("Unable to search actors. Please try again.");
      setActors([]);
    } finally {
      setLoadingActors(false);
    }
  };


  // HOME / RESET

	const resetAll = () => {
	  setMovieSearch("");
	  setActorSearch("");
	  setMovieSuggestions([]);

	  setActors([]);
	  setActorSearched(false);

	  setSelectedCategory("All Categories");
	  setMovieSearched(false);
	  setActiveMovieSearch("");

	  setError("");

	  fetchMovies("", "All Categories", 1);
	};

  // RENDER

  return (
    <div className="app-container">

      {/* HEADER */}

      <header className="app-header">
        <h1>🎬 Movie App</h1>

        <p className="header-subtitle">
          Discover movies. Explore actors. Build your collection.
        </p>
      </header>

      {/* SEARCH SECTION */}

      <section className="search-section">

        {/* MOVIE SEARCH */}

        <div className="search-group">

          <div className="search-input-wrapper">

            <input
              type="text"
              placeholder="Search movies..."
              value={movieSearch}
              onChange={(e) => setMovieSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleMovieSearch();
                }
              }}
            />

            {/* MOVIE SUGGESTIONS */}

            {movieSuggestions.length > 0 && (
              <div className="suggestions">

                {movieSuggestions.map((movie) => (
                  <div
                    key={movie.imdbID}
                    className="suggestion-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => fetchMovieById(movie.imdbID)}
                  >
                    <span>{movie.Title}</span>
                    <span className="suggestion-year">
                      ({movie.Year})
                    </span>
                  </div>
                ))}

              </div>
            )}

          </div>

          <button
            className="search-button"
            onClick={handleMovieSearch}
          >
            Search Movies
          </button>

        </div>

        {/* ACTOR SEARCH */}

        <div className="search-group">

          <input
            type="text"
            placeholder="Search actors..."
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchActors();
              }
            }}
          />

          <button
            className="search-button"
            onClick={fetchActors}
            disabled={loadingActors}
          >
            {loadingActors ? "Searching..." : "Search Actors"}
          </button>

        </div>

        {/* HOME BUTTON */}

        <button
          className="home-button"
          onClick={resetAll}
        >
          🏠 Home
        </button>

      </section>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* MOVIES SECTION */}


<section className="movies-section">

  <div className="section-header">
    <h2>🎬 Movies</h2>
    <span>{totalMovies} movies</span>
  </div>

  {/* CATEGORY DROPDOWN */}

  <div className="category-filter">

    <label htmlFor="category-select">
      Browse by category:
    </label>

    <select
      id="category-select"
      value={selectedCategory}
      onChange={handleCategoryChange}
    >
      <option value="All Categories">
        All Categories
      </option>

      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}

    </select>

  </div>

  {loadingMovies && (
    <p className="loading-message">
      Loading movies...
    </p>
  )}

  {!loadingMovies && movies.length === 0 && (
    <p className="empty-message">
      {movieSearched
        ? "No movies found."
        : "No movies available in this category."}
    </p>
  )}

  {/* MOVIE GRID */}

  {!loadingMovies && movies.length > 0 && (

    <div className="movie-grid">

      {movies.map((movie) => (

    <div
      key={movie.imdbID || movie.id}
      className="movie-card"
      onClick={() => {
        if (movie.imdbID) {
          window.open(
            `https://www.imdb.com/title/${movie.imdbID}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }}
    >

      <img
        src={
          movie.imageUrl &&
          movie.imageUrl !== "N/A"
            ? movie.imageUrl
            : "/no-poster.png"
        }
        alt={movie.title || "Movie poster"}
        loading="lazy"
      />

      <div className="movie-overlay">

        <p className="movie-title">
          {movie.title}
        </p>

        <p className="rating">
          ⭐ {
            movie.rating && movie.rating !== "N/A"
              ? movie.rating
              : "N/A"
          }
        </p>

        <button
			  className="remove-button"
			  onClick={(e) => {
				e.stopPropagation();
				setMovieToRemove(movie);
			  }}
			>
			  Remove
		</button>

      </div>

    </div>

))}

    </div>

  )}

  {/* PAGINATION */}

  {!loadingMovies && totalPages > 1 && (

    <div className="pagination">

      <button
        className="pagination-button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1
      ).map((page) => (

        <button
          key={page}
          className={`pagination-number ${
            currentPage === page ? "active" : ""
          }`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>

      ))}

      <button
        className="pagination-button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>

    </div>

  )}

  {!loadingMovies && movies.length > 0 && (
    <p className="pagination-info">
      Showing {((currentPage - 1) * MOVIES_PER_PAGE) + 1}
      {" - "}
      {Math.min(currentPage * MOVIES_PER_PAGE, totalMovies)}
      {" of "}
      {totalMovies} movies
    </p>
  )}

</section>
		{/* REMOVE MOVIE CONFIRMATION MODAL */}

{movieToRemove && (
  <div
    className="modal-backdrop"
    onClick={() => setMovieToRemove(null)}
  >
    <div
      className="remove-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="remove-modal-icon">
        🗑️
      </div>

      <h2>Remove Movie?</h2>

      <p>
        Are you sure you want to remove
        <strong> {movieToRemove.title} </strong>
        from your collection?
      </p>

      <p className="remove-modal-warning">
        This action will remove the movie from your personal collection.
      </p>

      <div className="remove-modal-actions">

        <button
          className="cancel-remove-button"
          onClick={() => setMovieToRemove(null)}
        >
          Cancel
        </button>

        <button
          className="confirm-remove-button"
          onClick={async () => {
            const movieId = movieToRemove.id;

            setMovieToRemove(null);

            await removeMovie(movieId);
          }}
        >
          Remove Movie
        </button>

      </div>
    </div>
  </div>
)}

      {/* ACTORS SECTION */}

      <section className="actors-section" ref={actorsSectionRef}>

        <div className="section-header">
          <h2>👤 Actors</h2>
          <span>{actors.length} actors</span>
        </div>

        {loadingActors && (
          <p className="loading-message">
            Searching actors...
          </p>
        )}

        {!loadingActors && actorSearched && actors.length === 0 && (
          <p className="empty-message">
            No actors found.
          </p>
        )}

        {!actorSearched && actors.length === 0 && (
          <p className="empty-message">
            Search for an actor to see the results here.
          </p>
        )}

        <div className="actor-grid">

          {actors.map((actor) => (

            <div className="actor-card" key={actor.id}>

			  <img
				className="actor-image"
				src={actor.profileUrl || "/no-actor.png"}
				alt={actor.name}
				loading="lazy"
			  />

			  <h3
				onClick={() =>
				  window.open(
					`https://www.imdb.com/find?q=${encodeURIComponent(actor.name)}`,
					"_blank",
					"noopener,noreferrer"
				  )
				}
			  >
				{actor.name}
			  </h3>

              <p className="actor-movies-title">
                Movies
              </p>

              <ul>

                {(actor.Movies || []).map((movie) => (

                  <li
                    key={movie.id}
                    onClick={() => {
                      if (movie.imdbID) {
                        window.open(
                          `https://www.imdb.com/title/${movie.imdbID}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    {movie.title}
                  </li>

                ))}

              </ul>

            </div>

          ))}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="app-footer">
        <p>🎬 Movie App | Discover your next favorite movie</p>
      </footer>

    </div>
  );
}

// PROTECTED HOME PAGE

function ProtectedHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="loading-message">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Home />;
}


// APPLICATION ROUTING

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <p className="loading-message">Loading Movie App...</p>;
  }

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<ProtectedHome />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;