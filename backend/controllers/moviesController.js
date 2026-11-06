const { Movie } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.category) whereClause.category = req.query.category;
        if (req.query.search) {
            whereClause.title = { [Op.iLike]: `%${req.query.search}%` };
        }

        const movies = await Movie.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['title', 'ASC']]
        });

        res.json({
            total: movies.count,
            page,
            totalPages: Math.ceil(movies.count / limit),
            data: movies.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};