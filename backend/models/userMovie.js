
module.exports = (sequelize, DataTypes) => {
  const UserMovie = sequelize.define("UserMovie", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    movieId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ["userId", "movieId"]
      }
    ]
  });

  return UserMovie;
};
