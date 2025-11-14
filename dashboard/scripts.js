$(document).ready(function() {
    const url = "http://localhost:3000/database/action";

    // Load Chill Spots
    $('#chillspots-btn').click(function() {
        $.post(url, { action: 'getChillSpots' }, function(data) {
            displayChillSpots(data.result);
        });
    });

    // Load Physical Attractions
    $('#attractions-btn').click(function() {
        $.post(url, { action: 'getAttractions' }, function(data) {
            displayAttractions(data.result2);
        });
    });

    // Load News
    $('#news-btn').click(function() {
        $.post(url, { action: 'getNews' }, function(data) {
            displayNews(data.result3);
        });
    });



    
    // Functions to display data
    function displayChillSpots(data) {
        let content = '<h2>Chill Spots</h2><table><tr><th>ID</th><th>Name</th><th>Actions</th></tr>';
        data.forEach(item => {
            content += `<tr>
                            <td>${item.id}</td>
                            <td>${item.h1}</td>
                            <td>
                                <button class="action-btn" onclick="editChillSpot(${item.id})">Edit</button>
                                <button class="action-btn" onclick="deleteChillSpot(${item.id})">Delete</button>
                            </td>
                        </tr>`;
        });
        content += '</table><button class="action-btn" onclick="addChillSpot()">Add New Chill Spot</button>';
        $('#content').html(content);
    }

    function displayAttractions(data) {
        let content = '<h2>Physical Attractions</h2><table><tr><th>ID</th><th>Name</th><th>Actions</th></tr>';
        data.forEach(item => {
            content += `<tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>
                                <button class="action-btn" onclick="editAttraction(${item.id})">Edit</button>
                                <button class="action-btn" onclick="deleteAttraction(${item.id})">Delete</button>
                            </td>
                        </tr>`;
        });
        content += '</table><button class="action-btn" onclick="addAttraction()">Add New Attraction</button>';
        $('#content').html(content);
    }

    function displayNews(data) {
        let content = '<h2>News</h2><table><tr><th>ID</th><th>Headline</th><th>Actions</th></tr>';
        data.forEach(item => {
            content += `<tr>
                            <td>${item.id}</td>
                            <td>${item.headline}</td>
                            <td>
                                <button class="action-btn" onclick="editNews(${item.id})">Edit</button>
                            </td>
                        </tr>`;
        });
        content += '</table>';
        $('#content').html(content);
    }

    // Functions to handle CRUD operations (Add/Edit/Delete)
    window.addChillSpot = function() {
        // Complete form for adding a new Chill Spot
        let form = `
            <h2>Add New Chill Spot</h2>
            <form id="chillspot-form">
                <input type="text" name="h1" placeholder="Name" required><br>
                <input type="text" name="ln" placeholder="Location (lsk, cb, n, s, w, l, nw, e, c, m" required><br>
                <input type="text" name="img" placeholder="Main Image"><br>
                <input type="text" name="h2" placeholder="Subheading"><br>
                <input type="text" name="p" placeholder="Paragraph"><br>
                <textarea name="details" placeholder="Details"></textarea><br>
                <input type="text" name="img1" placeholder="Image 1"><br>
                <input type="text" name="img2" placeholder="Image 2"><br>
                <input type="text" name="img3" placeholder="Image 3"><br>
                <input type="text" name="img4" placeholder="Image 4"><br>
                <input type="text" name="map" placeholder="Map URL"><br>
                <input type="text" name="phone" placeholder="Phone Number"><br>
                <input type="text" name="address" placeholder="Address"><br>
                <input type="text" name="site" placeholder="Website"><br>
                <button type="submit">Save</button>
            </form>
        `;
        $('#content').html(form);

        $('#chillspot-form').submit(function(e) {
            e.preventDefault();
            const formData = JSON.stringify(getFormData(this));

            $.post(url, { action: 'addChillSpot', data: formData }, function(response) {
                alert('Chill Spot added successfully');
                $('#chillspots-btn').click(); // Refresh the list
            });
        });
    };

    function getFormData(form) {
        let data = {};
        $(form).serializeArray().forEach(field => {
            data[field.name] = field.value.trim() === '' ? null : field.value;
        });
        return data;
    }


    window.editChillSpot = function(id) {
        // Fetch the existing data and show the form for editing
        $.post(url, { action: 'getChillSpotById', id: id }, function(data) {
            let form = `
                <h2>Edit Chill Spot</h2>
                <form id="chillspot-form">
                    <input type="text" name="h1" value="${data.h1}" required><br>
                    <input type="text" name="ln" value="${data.ln}" required><br>
                    <input type="text" name="img" value="${data.img}"><br>
                    <input type="text" name="h2" value="${data.h2}"><br>
                    <input type="text" name="p" value="${data.p}"><br>
                    <textarea name="details">${data.details}</textarea><br>
                    <input type="text" name="img1" value="${data.img1}"><br>
                    <input type="text" name="img2" value="${data.img2}"><br>
                    <input type="text" name="img3" value="${data.img3}"><br>
                    <input type="text" name="img4" value="${data.img4}"><br>
                    <input type="text" name="map" value="${data.map}"><br>
                    <input type="text" name="phone" value="${data.phone}"><br>
                    <input type="text" name="address" value="${data.address}"><br>
                    <input type="text" name="site" value="${data.site}"><br>
                    <button type="submit">Save</button>
                </form>
            `;
            $('#content').html(form);

            $('#chillspot-form').submit(function(e) {
                e.preventDefault();
                const formData = JSON.stringify(getFormData(this));
                // const formData = $(this).serialize();
                console.log(formData)

                $.post(url, { action: 'updateChillSpot', id: id, data: formData }, function(response) {
                    alert('Chill Spot updated successfully');
                    $('#chillspots-btn').click(); // Refresh the list
                });
            });
        });
    };

    window.deleteChillSpot = function(id) {
        if (confirm('Are you sure you want to delete this Chill Spot?')) {
            $.post(url, { action: 'deleteChillSpot', id: id }, function(response) {
                alert('Chill Spot deleted successfully');
                $('#chillspots-btn').click(); // Refresh the list
            });
        }
    };

    window.addAttraction = function() {
        // Complete form for adding a new Attraction
        let form = `
            <h2>Add New Attraction</h2>
            <form id="attraction-form">
                <input type="text" name="name" placeholder="Name" required><br>
                <input type="text" name="location" placeholder="Location" required><br>
                <input type="text" name="description" placeholder="Description"><br>
                <input type="text" name="significant_features" placeholder="Significant Features"><br>
                <textarea name="activities" placeholder="Activities (Format: activity1, activity2, activity3, activity4)"></textarea><br>
                <input type="text" name="img1" placeholder="Image 1"><br>
                <input type="text" name="img2" placeholder="Image 2"><br>
                <input type="text" name="img3" placeholder="Image 3"><br>
                <input type="text" name="img4" placeholder="Image 4"><br>
                <button type="submit">Save</button>
            </form>
        `;
        $('#content').html(form);

        $('#attraction-form').submit(function(e) {
            e.preventDefault();
            const formData = JSON.stringify(getFormData(this));

            $.post(url, { action: 'addAttraction', data: formData }, function(response) {
                alert('Attraction added successfully');
                $('#attractions-btn').click(); // Refresh the list
            });
        });
    };



    window.editAttraction = function(id) {
        // Fetch the existing data and show the form for editing
        $.post(url, { action: 'getAttractionById', id: id }, function(data) {
            let form = `
                <h2>Edit Attraction</h2>
                <form id="attraction-form">
                    <input type="text" name="name" value="${data.name}" required><br>
                    <input type="text" name="location" value="${data.location}" required><br>
                    <input type="text" name="description" value="${data.description}"><br>
                    <input type="text" name="significant_features" value="${data.significant_features}"><br>
                    <textarea name="activities">${data.activities}</textarea><br>
                    <input type="text" name="img1" value="${data.img1}"><br>
                    <input type="text" name="img2" value="${data.img2}"><br>
                    <input type="text" name="img3" value="${data.img3}"><br>
                    <input type="text" name="img4" value="${data.img4}"><br>
                    <button type="submit">Save</button>
                </form>
            `;
            $('#content').html(form);

            $('#attraction-form').submit(function(e) {
                e.preventDefault();
                const formData = JSON.stringify(getFormData(this));
                console.log(formData)


                $.post(url, { action: 'updateAttraction', id: id, data: formData }, function(response) {
                    alert('Attraction updated successfully');
                    $('#attractions-btn').click(); // Refresh the list
                });
            });
        });
    };

    window.deleteAttraction = function(id) {
        if (confirm('Are you sure you want to delete this Attraction?')) {
            $.post(url, { action: 'deleteAttraction', id: id }, function(response) {
                alert('Attraction deleted successfully');
                $('#attractions-btn').click(); // Refresh the list
            });
        }
    };

    window.editNews = function(id) {
        // Fetch the existing data and show the form for editing
        $.post(url, { action: 'getNewsById', id: id }, function(data) {
            let form = `
                <h2>Edit News</h2>
                <form id="news-form">
                    <input type="text" name="img" value="${data.img}" required><br>
                    <input type="text" name="headline" value="${data.headline}" required><br>
                    <textarea name="news">${data.news}</textarea><br>
                    <button type="submit">Save</button>
                </form>
            `;
            $('#content').html(form);

            $('#news-form').submit(function(e) {
                e.preventDefault();
                const formData = JSON.stringify(getFormData(this));

                $.post(url, { action: 'updateNews', id: id, data: formData }, function(response) {
                    alert('News updated successfully');
                    $('#news-btn').click(); // Refresh the list
                });
            });
        });
    };
});
