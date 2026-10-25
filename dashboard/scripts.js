// Author: Kondwani Phiri
$(document).ready(function() {
    const url = "/database/action";
    $(document).ajaxError(function(event, xhr) {
        alert(xhr.responseJSON && xhr.responseJSON.error || 'The request failed. Please reload and try again.');
    });

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
                            <td>${Number(item.id)}</td>
                            <td>${Content.escapeHtml(item.h1)}</td>
                            <td>
                                <button class="action-btn" onclick="editChillSpot(${Number(item.id)})">Edit</button>
                                <button class="action-btn" onclick="deleteChillSpot(${Number(item.id)})">Delete</button>
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
                            <td>${Number(item.id)}</td>
                            <td>${Content.escapeHtml(item.name)}</td>
                            <td>
                                <button class="action-btn" onclick="editAttraction(${Number(item.id)})">Edit</button>
                                <button class="action-btn" onclick="deleteAttraction(${Number(item.id)})">Delete</button>
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
                            <td>${Number(item.id)}</td>
                            <td>${Content.escapeHtml(item.headline)}</td>
                            <td>
                                <button class="action-btn" onclick="editNews(${Number(item.id)})">Edit</button>
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
                <label>Opening hours (leave blank if unknown)<input type="text" name="opening_hours" maxlength="255" placeholder="e.g. Mon-Fri 09:00-17:00"></label><br>
                <label>Activities (comma separated)<input type="text" name="activities" placeholder="Dining, Swimming"></label><br>
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
            data[field.name] = field.value.trim();
        });
        return data;
    }


    window.editChillSpot = function(id) {
        // Fetch the existing data and show the form for editing
        $.post(url, { action: 'getChillSpotById', id: id }, function(data) {
            let form = `
                <h2>Edit Chill Spot</h2>
                <form id="chillspot-form">
                    <input type="text" name="h1" value="${Content.escapeHtml(data.h1)}" required><br>
                    <input type="text" name="ln" value="${Content.escapeHtml(data.ln)}" required><br>
                    <input type="text" name="img" value="${Content.escapeHtml(data.img)}"><br>
                    <input type="text" name="h2" value="${Content.escapeHtml(data.h2)}"><br>
                    <input type="text" name="p" value="${Content.escapeHtml(data.p)}"><br>
                    <textarea name="details">${Content.escapeHtml(data.details)}</textarea><br>
                    <input type="text" name="img1" value="${Content.escapeHtml(data.img1)}"><br>
                    <input type="text" name="img2" value="${Content.escapeHtml(data.img2)}"><br>
                    <input type="text" name="img3" value="${Content.escapeHtml(data.img3)}"><br>
                    <input type="text" name="img4" value="${Content.escapeHtml(data.img4)}"><br>
                    <input type="text" name="map" value="${Content.escapeHtml(data.map)}"><br>
                    <input type="text" name="phone" value="${Content.escapeHtml(data.phone)}"><br>
                    <input type="text" name="address" value="${Content.escapeHtml(data.address)}"><br>
                    <input type="text" name="site" value="${Content.escapeHtml(data.site)}"><br>
                    <label>Opening hours<input type="text" name="opening_hours" maxlength="255" value="${Content.escapeHtml(data.opening_hours)}"></label><br>
                    <label>Activities (comma separated)<input type="text" name="activities" value="${Content.escapeHtml(data.activities)}"></label><br>
                    <button type="submit">Save</button>
                </form>
            `;
            $('#content').html(form);

            $('#chillspot-form').submit(function(e) {
                e.preventDefault();
                const formData = JSON.stringify(getFormData(this));
                // const formData = $(this).serialize();


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
                <label>Province (comma separated for multiple provinces)<input type="text" name="province" placeholder="Southern"></label><br>
                <label>Opening hours<input type="text" name="opening_hours" maxlength="255"></label><br>
                <label>Contact number<input type="text" name="phone" maxlength="64"></label><br>
                <label>Website<input type="text" name="site" placeholder="https://..."></label><br>
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
                    <input type="text" name="name" value="${Content.escapeHtml(data.name)}" required><br>
                    <input type="text" name="location" value="${Content.escapeHtml(data.location)}" required><br>
                    <label>Province (comma separated)<input type="text" name="province" value="${Content.escapeHtml(data.province)}"></label><br>
                    <label>Opening hours<input type="text" name="opening_hours" maxlength="255" value="${Content.escapeHtml(data.opening_hours)}"></label><br>
                    <label>Contact number<input type="text" name="phone" maxlength="64" value="${Content.escapeHtml(data.phone)}"></label><br>
                    <label>Website<input type="text" name="site" value="${Content.escapeHtml(data.site)}"></label><br>
                    <input type="text" name="description" value="${Content.escapeHtml(data.description)}"><br>
                    <input type="text" name="significant_features" value="${Content.escapeHtml(data.significant_features)}"><br>
                    <textarea name="activities">${Content.escapeHtml(data.activities)}</textarea><br>
                    <input type="text" name="img1" value="${Content.escapeHtml(data.img1)}"><br>
                    <input type="text" name="img2" value="${Content.escapeHtml(data.img2)}"><br>
                    <input type="text" name="img3" value="${Content.escapeHtml(data.img3)}"><br>
                    <input type="text" name="img4" value="${Content.escapeHtml(data.img4)}"><br>
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
                    <input type="text" name="img" value="${Content.escapeHtml(data.img)}" required><br>
                    <input type="text" name="headline" value="${Content.escapeHtml(data.headline)}" required><br>
                    <textarea name="news">${Content.escapeHtml(data.news)}</textarea><br>
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
