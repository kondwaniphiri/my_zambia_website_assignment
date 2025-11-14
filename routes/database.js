const express = require('express');
const cors = require('cors');
const router = express.Router();
const connectToDatabase = require('../db');

// Use CORS
router.use(cors());

router.post('/action', async (req, res) => {
    const action = req.body.action;

    let connection;

    try {
        connection = await connectToDatabase();

        let query, rows;

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
                    img1 = ?, img2 = ?, img3 = ?, img4 = ?, map = ?, phone = ?, address = ?, site = ? 
                    WHERE id = ?`;
                await connection.execute(query, [
                    fetched.ln, fetched.img, fetched.h1, fetched.h2, 
                    fetched.p, fetched.details, fetched.img1, fetched.img2, 
                    fetched.img3, fetched.img4, fetched.map, fetched.phone, 
                    fetched.address, fetched.site, req.body.id
                ]);
                res.json({ success: true });
                break;

            // Update Attraction
            case 'updateAttraction':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                console.log(fetched)

                var featuresArray = fetched.activities.split(', ').map(feature => feature.trim());
                console.log(featuresArray);

                query = `
                    UPDATE attractions SET name = ?, location = ?, description = ?, significant_features = ?, 
                    activities = ?, img1 = ?, img2 = ?, img3 = ?, img4 = ? WHERE id = ?`;
                await connection.execute(query, [
                    fetched.name, fetched.location, fetched.description, 
                    fetched.significant_features, featuresArray, fetched.img1, 
                    fetched.img2, fetched.img3, fetched.img4, req.body.id
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
                console.log(fetched)
                console.log(req.body.data.name, req.body.data.location,)
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
                console.log(req.body.data.name, req.body.data.location,)
                query = `
                    INSERT INTO chillspots (ln, img, h1, h2, p, details, img1, img2, img3, img4, 
                    map, phone, address, site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await connection.execute(query, [
                    fetched.ln, fetched.img, fetched.h1, fetched.h2, 
                    fetched.p, fetched.details, fetched.img1, fetched.img2, 
                    fetched.img3, fetched.img4, fetched.map, fetched.phone, 
                    fetched.address, fetched.site
                ]);
                res.json({ success: true });
                break;

            // Add Attraction
            case 'addAttraction':
                var queryData = req.body.data;
                var fetched = JSON.parse(queryData);
                
                var featuresArray = fetched.activities.split(', ').map(feature => feature.trim());

                query = `
                    INSERT INTO attractions (name, location, description, significant_features, 
                    activities, img1, img2, img3, img4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await connection.execute(query, [
                    fetched.name, fetched.location, fetched.description, 
                    fetched.significant_features, featuresArray, fetched.img1, 
                    fetched.img2, fetched.img3, fetched.img4
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
