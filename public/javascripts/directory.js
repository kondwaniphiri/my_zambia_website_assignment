// Author: Kondwani Phiri
﻿var data = [];
(function() {
    var page = $('.places-page');
    if (!page.length) return;
    var kind = page.attr('data-kind');
    var places = [];
    var grid = $('#place-grid');
    var filters = $('.place-filters');
    function escape(value) { return Content.escapeHtml(value); }
    function image(url, title) {
        url = Content.safeUrl(url, 'image');
        return url ? '<img src="' + escape(url) + '" alt="' + escape(title) + '" loading="lazy">' : '<span class="place-no-photo">Photo not available</span>';
    }
    function card(place) {
        var title = escape(place.name);
        var phone = String(place.phone).replace(/[^+0-9]/g, '');
        var site = Content.safeUrl(place.site, 'site');
        var rating = place.reviewCount ? '&#9733; ' + place.rating.toFixed(1) + ' <span>(' + place.reviewCount + (place.reviewCount == 1 ? ' review' : ' reviews') + ')</span>' : '<span>Not rated yet</span>';
        var photos = place.photos.filter(function(photo) { return !!Content.safeUrl(photo, 'image'); });
        var gallery = photos.map(function(photo) { return '<span class="place-thumbnail">' + image(photo, place.name) + '</span>'; }).join('');
        var activities = place.activities.map(function(activity) { return '<span>' + escape(activity) + '</span>'; }).join('');
        return '<article class="place-card card">' +
            '<div class="place-media">' + image(place.image, place.name) + '</div>' +
            '<div class="place-card-body"><div class="place-card-top"><span class="place-category">' + escape(place.category) + '</span><span class="place-rating">' + rating + '</span></div>' +
            '<h2>' + title + '</h2><p class="place-location">' + escape(place.location || 'Location not listed') + '</p>' +
            '<p class="place-provinces">' + escape(place.provinces.join(' / ') || 'Province not listed') + '</p>' +
            '<p class="place-description">' + escape(place.description) + '</p><div class="place-tags">' + activities + '</div>' +
            '<dl class="place-practical"><div><dt>Hours</dt><dd>' + escape(place.hours || 'Hours not listed') + '</dd></div><div><dt>Contact</dt><dd>' +
            (phone ? '<a href="tel:' + escape(phone) + '">' + escape(place.phone) + '</a>' : 'Phone not listed') +
            (site ? '<a class="place-website" href="' + escape(site) + '" target="_blank" rel="noopener noreferrer">Visit website &nearr;</a>' : '') + '</dd></div></dl>' +
            (place.kind == 'chill' ? '<a class="place-details-link" href="/chilldetails?id=' + encodeURIComponent(place.id) + '">View place &rarr;</a>' :
                '<details class="place-more"><summary>More about this attraction</summary><p>' + escape(place.description) + '</p><p>' + escape(place.details) + '</p><div class="place-thumbnails">' + gallery + '</div></details>') +
            '</div></article>';
    }
    function render() {
        var matches = Places.filter(places, { query: $('#place-query').val(), province: $('#place-province').val(), activity: $('#place-activity').val() });
        grid.html(page.attr('data-layout') == 'legacy' ? LegacyListings.render(matches, kind) : matches.map(card).join('')).attr('aria-busy', 'false');
        $('.places-empty').prop('hidden', matches.length > 0);
        $('#place-results').text(matches.length + (matches.length == 1 ? ' place' : ' places') + ' found');
    }
    function options(selector, values) {
        values.filter(function(value, index, array) { return array.indexOf(value) == index; }).sort().forEach(function(value) {
            $('<option>').val(value).text(value).appendTo(selector);
        });
    }
    grid.on('click', '.spot-select', function() {
        var id = $(this).attr('data-place-id');
        var place = places.filter(function(item) { return String(item.id) == id; })[0];
        if (place) LegacyListings.select($(this).closest('.location')[0], place);
    });
    grid.on('click', '.thumb-scroll', function() {
        var strip = $(this).closest('.cardContainer').find('.spot-strip')[0];
        var step = $(this).attr('data-direction') == 'next' ? 1 : -1;
        strip.scrollBy({ left: step * strip.clientWidth * 0.75, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    grid.on('keydown', '.spot-select', function(event) {
        if (event.key != 'ArrowLeft' && event.key != 'ArrowRight') return;
        var buttons = Array.prototype.slice.call($(this).closest('.spot-strip')[0].querySelectorAll('.spot-select'));
        var index = buttons.indexOf(this) + (event.key == 'ArrowRight' ? 1 : -1);
        if (buttons[index]) { event.preventDefault(); buttons[index].focus(); buttons[index].click(); }
    });
    filters.on('submit', function(event) { event.preventDefault(); render(); });
    filters.on('input change', 'input, select', render);
    filters.on('reset', function() { window.setTimeout(render, 0); });
    $('.empty-reset').on('click', function() { filters[0].reset(); $('#place-query').focus(); });
    $.ajax({
        url: '/database/action', method: 'POST', data: { action: 'getData' }, dataType: 'json',
        success: function(result) {
            data = result.result || [];
            var rows = kind == 'attractions' ? result.result2 || [] : data;
            places = rows.map(function(row) { return Places.normalize(row, kind, result.result4); });
            options('#place-province', [].concat.apply([], places.map(function(place) { return place.provinces; })));
            options('#place-activity', [].concat.apply([], places.map(function(place) { return place.activities; })));
            render();
        },
        error: function() { grid.attr('aria-busy', 'false'); $('#place-results').text('Could not load places. Please reload the page to try again.'); }
    });
})();
