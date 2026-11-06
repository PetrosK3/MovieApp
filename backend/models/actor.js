module.exports = (sequelize, DataTypes) => {
  const Actor = sequelize.define('Actor', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // TMDb unique person ID
    tmdbId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
    },

    // TMDb profile image path
    profilePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Actor;
};
