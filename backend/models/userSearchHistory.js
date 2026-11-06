
module.exports = (sequelize, DataTypes) => {
  const UserSearchHistory = sequelize.define("UserSearchHistory", {
    searchQuery: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    searchType: {
      type: DataTypes.ENUM("movie", "actor"),
      allowNull: false
    }
  });

  return UserSearchHistory;
};
