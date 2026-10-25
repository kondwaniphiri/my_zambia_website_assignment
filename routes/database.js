// Author: Kondwani Phiri
const express = require('express');

const router = express.Router();
const connectToDatabase = require('../db');

// No administrators are enabled until ADMIN_USER_IDS is configured.
router.use(function(req, res, next) {
    var action = req.body.action;
    var ids = (process.env.ADMIN_USER_IDS || '').split(',');
    var contentActions = ['updateChillSpot', 'updateAttraction', 'updateNews', 'addChillSpot', 'addAttraction', 'deleteChillSpot', 'deleteAttraction'];
    if (contentActions.indexOf(action) != -1 &&
        (!(Number(req.session.uId) > 0) || ids.indexOf(String(req.session.uId)) == -1)) {
        return res.status(403).json({ error: 'Administrator access required.' });
    }
    if (['addReview', 'updateReview', 'deleteReview'].indexOf(action) != -1) {
        if (!(Number(req.session.uId) > 0)) return res.status(401).json({ error: 'Please log in to manage reviews.' });
        try {
            var data = JSON.parse(req.body.data);
            if (!data || typeof data != 'object' || Array.isArray(data)) throw new Error('Invalid review');
            data.uId = req.session.uId;
            if (!Number.isInteger(Number(data.locId)) || Number(data.locId) <= 0) throw new Error('Invalid location');
            if (action != 'deleteReview' && (typeof data.comment != 'string' || !data.comment.trim() ||
                !Number.isFinite(Number(data.rating)) || Number(data.rating) < 1 || Number(data.rating) > 5)) throw new Error('Invalid review');
            req.body.data = JSON.stringify(data);
        } catch (error) {
            return res.status(400).json({ error: 'Enter a valid location, rating (1-5) and comment.' });
        }
    }
    if (contentActions.indexOf(action) != -1 && !/^delete/.test(action)) {
        try {
            var content = JSON.parse(req.body.data);
            if (!content || typeof content != 'object' || Array.isArray(content)) throw new Error('Invalid content');
            var safeUrl = require('../public/javascripts/content').safeUrl;
            Object.keys(content).forEach(function(field) {
                var value = content[field];
                if (value != null && typeof value != 'string') throw new Error('Invalid content field');
                if (typeof value == 'string' && value.length > 65535) throw new Error('Content field is too long');
                var kind = /^img[0-4]?$/.test(field) ? 'image' : (field == 'map' ? 'map' : (field == 'site' ? 'site' : ''));
                if (kind && value) {
                    var valid = safeUrl(value, kind);
                    if (!valid) throw new Error('Invalid ' + field + ' URL');
                    content[field] = valid;
                }
            });
            var required = /ChillSpot$/.test(action) ? ['h1', 'ln'] : (/Attraction$/.test(action) ? ['name', 'location'] : ['headline', 'news']);
            required.forEach(function(field) {
                if (typeof content[field] != 'string' || !content[field].trim()) throw new Error('Missing ' + field);
            });
            if (/ChillSpot$|Attraction$/.test(action)) {
                content.activities = content.activities || '';
                if (content.opening_hours && content.opening_hours.length > 255) throw new Error('Opening hours must be 255 characters or fewer');
                if (content.phone && content.phone.length > 64) throw new Error('Phone number must be 64 characters or fewer');
                if (content.activities.split(',').length > 20 || content.activities.split(',').some(function(activity) { return activity.trim().length > 80; })) throw new Error('Use up to 20 activities of 80 characters each');
                var provinceNames = Object.values(require('../public/javascripts/places').provinces);
                if (content.province && content.province.split(',').some(function(province) { return provinceNames.indexOf(province.trim()) == -1; })) throw new Error('Choose a valid province name');
            }
            req.body.data = JSON.stringify(content);
        } catch (error) {
            return res.status(400).json({ error: error.message || 'Invalid content.' });
        }
    }
    if (/^(update|delete)/.test(action) && contentActions.indexOf(action) != -1 &&
        (typeof req.body.id != 'string' || !/^[1-9][0-9]*$/.test(req.body.id))) {
        return res.status(400).json({ error: 'Invalid content ID.' });
    }
    next();
});

router.post('/action', async (req, res) => {
    const action = req.body.action;

    let connection;

    try {
        connection = await connectToDatabase();

        let query, rows, rows2, rows3, rows4;

        switch(action) {
            case 'getData':
                [rows] = await connection.execute('SELECT * FROM chillspots');
                [rows2] = await connection.execute('SELECT * FROM attractions');
                [rows3] = await connection.execute('SELECT * FROM news');
                [rows4] = await connection.execute('select users.id as userId, users.name, chillspots.id as locationId, review.rating, review.comment from review join users on users.id = review.userId join chillspots on chillspots.id = review.locationId;');

                res.json({ result: rows,result2: rows2,result3: rows3,result4: rows4});
                break;

            // Retrieve Chill Spots
            case 'getChillSpots':
                query = 'SELECT * FROM chillspots';
                [rows] = await connection.execute(query);
                res.json({ result: rows });
                break;

            // Retrieve Physical Attractions
            case 'getAttractions':
                query = 'SELECT * FROM attractions';
                [rows] = await connection.execute(query);
                res.json({ result2: rows });
                break;

            // Retrieve News
            case 'getNews':
                query = 'SELECT * FROM news';
                [rows] = await connection.execute(query);
                res.json({ result3: rows });
                break;

            // Get Chill Spot by ID
            case 'getChillSpotById':
                query = 'SELECT * FROM chillspots WHERE id = ?';
                [rows] = await connection.execute(query, [req.body.id]);
                res.json(rows[0]);
                break;

            // Get Attraction by ID
            case 'getAttractionById':
                query = 'SELECT * FROM attractions WHERE id = ?';
                [rows] = await connection.execute(query, [req.body.id]);
                res.json(rows[0]);
                break;

            // Get News by ID
            case 'getNewsById':
                query = 'SELECT * FROM news WHERE id = ?';
                [rows] = await connection.execute(query, [req.body.id]);
                res.json(rows[0]);
                break;

            // Update Chill Spot
            case 'updateChillSpot':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);

                query = `
                    UPDATE chillspots SET ln = ?, img = ?, h1 = ?, h2 = ?, p = ?, details = ?,
                    img1 = ?, img2 = ?, img3 = ?, img4 = ?, map = ?, phone = ?, address = ?, site = ?, opening_hours = ?, activities = ?
                    WHERE id = ?`;
                await connection.execute(query, [
                    fetched.ln, fetched.img, fetched.h1, fetched.h2,
                    fetched.p, fetched.details, fetched.img1, fetched.img2,
                    fetched.img3, fetched.img4, fetched.map, fetched.phone,
                    fetched.address, fetched.site, fetched.opening_hours || null, JSON.stringify((fetched.activities || '').split(',').map(function(activity) { return activity.trim(); }).filter(Boolean)), req.body.id
                ]);
                res.json({ success: true });
                break;

            // Update Attraction
            case 'updateAttraction':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                var featuresArray = fetched.activities.split(',').map(function(feature) { return feature.trim(); }).filter(Boolean);

                query = `
                    UPDATE attractions SET name = ?, location = ?, description = ?, significant_features = ?,
                    activities = ?, img1 = ?, img2 = ?, img3 = ?, img4 = ?, province = ?, opening_hours = ?, phone = ?, site = ? WHERE id = ?`;
                await connection.execute(query, [
                    fetched.name, fetched.location, fetched.description,
                    fetched.significant_features, JSON.stringify(featuresArray), fetched.img1,
                    fetched.img2, fetched.img3, fetched.img4, fetched.province || null, fetched.opening_hours || null, fetched.phone || null, fetched.site || null, req.body.id
                ]);
                res.json({ success: true });
                break;

            // Update News
            case 'updateNews':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                query = 'UPDATE news SET headline = ?, news = ?, img = ? WHERE id = ?';
                await connection.execute(query, [
                    fetched.headline, fetched.news, fetched.img, req.body.id
                ]);
                res.json({ success: true });
                break;

                //update Review
                case 'updateReview':
                    var queryData = req.body.data;
                    var fetched = JSON.parse(queryData);
                    query = 'UPDATE review SET rating = ?, comment = ? WHERE userId = ? and locationId =?';
                    await connection.execute(query, [
                        fetched.rating, fetched.comment, fetched.uId, fetched.locId
                    ]);
                    res.json({ success: true });
                    break;





                // Add Review
            case 'addReview':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);

                query = `
                    INSERT INTO review (userId, locationId, rating, comment) VALUES (?, ?, ?, ?)`;
                await connection.execute(query, [
                    fetched.uId, fetched.locId, fetched.rating, fetched.comment
                ]);
                res.json({ success: true });
                break;


            // Add Chill Spot
            case 'addChillSpot':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                query = `
                    INSERT INTO chillspots (ln, img, h1, h2, p, details, img1, img2, img3, img4,
                    map, phone, address, site, opening_hours, activities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await connection.execute(query, [
                    fetched.ln, fetched.img, fetched.h1, fetched.h2,
                    fetched.p, fetched.details, fetched.img1, fetched.img2,
                    fetched.img3, fetched.img4, fetched.map, fetched.phone,
                    fetched.address, fetched.site, fetched.opening_hours || null, JSON.stringify((fetched.activities || '').split(',').map(function(activity) { return activity.trim(); }).filter(Boolean))
                ]);
                res.json({ success: true });
                break;

            // Add Attraction
            case 'addAttraction':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);

                var featuresArray = fetched.activities.split(',').map(function(feature) { return feature.trim(); }).filter(Boolean);

                query = `
                    INSERT INTO attractions (name, location, description, significant_features,
                    activities, img1, img2, img3, img4, province, opening_hours, phone, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await connection.execute(query, [
                    fetched.name, fetched.location, fetched.description,
                    fetched.significant_features, JSON.stringify(featuresArray), fetched.img1,
                    fetched.img2, fetched.img3, fetched.img4, fetched.province || null, fetched.opening_hours || null, fetched.phone || null, fetched.site || null
                ]);
                res.json({ success: true });
                break;

            // Delete Chill Spot
            case 'deleteChillSpot':
                query = 'DELETE FROM chillspots WHERE id = ?';
                await connection.execute(query, [req.body.id]);
                res.json({ success: true });
                break;

            //delete review
            case 'deleteReview':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                query = 'DELETE FROM review WHERE userId = ? and locationId = ?';
                await connection.execute(query, [fetched.uId, fetched.locId]);
                res.json({ success: true });
                break;

            // Delete Attraction
            case 'deleteAttraction':
                query = 'DELETE FROM attractions WHERE id = ?';
                await connection.execute(query, [req.body.id]);
                res.json({ success: true });
                break;

            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'An error occurred while querying the database' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;
