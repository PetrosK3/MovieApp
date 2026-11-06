
require("dotenv").config();

const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: process.env.DATABASE_DIALECT || "postgres",
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Existing models
db.Movie = require("./movie")(sequelize, DataTypes);
db.Actor = require("./actor")(sequelize, DataTypes);

// New user models
db.User = require("./user")(sequelize, DataTypes);
db.UserMovie = require("./userMovie")(sequelize, DataTypes);
db.UserSearchHistory = require("./userSearchHistory")(
  sequelize,
  DataTypes
);

// Existing Movie - Actor relationship
db.Movie.belongsToMany(db.Actor, {
  through: "MovieActors"
});

db.Actor.belongsToMany(db.Movie, {
  through: "MovieActors"
});

// User - Movie Favorites relationship
db.User.belongsToMany(db.Movie, {
  through: db.UserMovie,
  as: "FavoriteMovies",
  foreignKey: "userId",
  otherKey: "movieId"
});

db.Movie.belongsToMany(db.User, {
  through: db.UserMovie,
  as: "FavoritedByUsers",
  foreignKey: "movieId",
  otherKey: "userId"
});

// User - Search History relationship
db.User.hasMany(db.UserSearchHistory, {
  foreignKey: "userId",
  as: "SearchHistory",
  onDelete: "CASCADE"
});

db.UserSearchHistory.belongsTo(db.User, {
  foreignKey: "userId"
});

module.exports = db;
