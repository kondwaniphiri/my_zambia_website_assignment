// Author: Kondwani Phiri
// Keep presentation separate from the existing jQuery content handlers.
$(document).ready(function() {
    $('#sections button').on('click', function() {
        $('#sections button').attr('aria-pressed', 'false');
        $(this).attr('aria-pressed', 'true');
    });
    var names = {
        h1: 'Name', ln: 'Province code', img: 'Main image', h2: 'Subheading',
        p: 'Short description', details: 'Details', img1: 'Image 1', img2: 'Image 2',
        img3: 'Image 3', img4: 'Image 4', map: 'Map URL', phone: 'Contact number',
        address: 'Address', site: 'Website', name: 'Name', location: 'Location',
        description: 'Description', significant_features: 'Significant features',
        activities: 'Activities', headline: 'Headline', news: 'Article'
    };
    function labelFields() {
        $('#content input, #content textarea').each(function() {
            if (this.type == 'hidden' || this.closest('label') || this.labels.length) return;
            var name = this.name;
            if (!names[name]) return;
            this.id = 'admin-field-' + name;
            $('<label>', {for: this.id}).text(names[name]).insertBefore(this);
        });
    }
    new MutationObserver(labelFields).observe(document.getElementById('content'), {childList: true, subtree: true});
    $('#chillspots-btn').click();
});
