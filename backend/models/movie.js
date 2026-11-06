module.exports = (sequelize, DataTypes) => {
    const Movie = sequelize.define('Movie', {
        title: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        imageUrl: { type: DataTypes.STRING },
        rating: { type: DataTypes.FLOAT },
         imdbID:{type: DataTypes.STRING, unique:true},
    });
   
    return Movie;
};