// Author: Kondwani Phiri
﻿(function(root) {
    var Content = typeof module != 'undefined' && module.exports ? require('./content') : root.Content;
    var provinces = typeof module != 'undefined' && module.exports ? require('./places').provinces : root.Places.provinces;
    function escape(value) { return Content.escapeHtml(value); }
    function photo(src, name, className) { return '<img class="' + (className || '') + '" src="' + escape(Content.safeUrl(src, 'image')) + '" alt="' + escape(name) + '" loading="lazy">'; }
    function practical(place) {
        var phone = String(place.phone || '').replace(/[^+0-9]/g, '');
        var site = Content.safeUrl(place.site, 'site');
        return '<dl class="place-practical"><div><dt>Hours</dt><dd>' + escape(place.hours || 'Hours not listed') + '</dd></div><div><dt>Contact</dt><dd>' + (phone ? '<a href="tel:' + escape(phone) + '">' + escape(place.phone) + '</a>' : 'Phone not listed') + (site ? '<a class="place-website" href="' + escape(site) + '" target="_blank" rel="noopener noreferrer">Visit website</a>' : '') + '</dd></div></dl>';
    }
    function rating(place) { return '<p class="legacy-rating">' + (place.reviewCount ? '&#9733; ' + place.rating.toFixed(1) + ' (' + place.reviewCount + (place.reviewCount == 1 ? ' review)' : ' reviews)') : 'Not rated yet') + '</p>'; }
    function spotDetails(place) {
        return '<h1>' + escape(place.name) + '</h1><h2>' + escape(place.category) + '</h2>' + rating(place) + '<p>' + escape(place.description) + '</p>' + practical(place) + '<a class="place-details-link" href="/chilldetails?id=' + encodeURIComponent(place.id) + '">View place</a>';
    }
    function render(places, kind) {
        if (kind == 'attractions') return places.map(function(place, index) {
            var gallery = place.photos.slice(1).map(function(src) { return '<div>' + photo(src, place.name) + '</div>'; }).join('');
            return '<article class="card ' + (index % 2 ? 'rightCard' : 'leftCard') + '"><div class="imgContainer">' + photo(place.image, place.name) + '</div><div class="details"><h2>' + escape(place.name) + '</h2><p class="legacy-location">' + escape(place.location) + '</p>' + rating(place) + '<p>' + escape(place.description) + '</p><h3>Activities</h3><ul>' + place.activities.map(function(activity) {return '<li>' + escape(activity) + '</li>';}).join('') + '</ul>' + practical(place) + '</div><div class="galleryContainer">' + gallery + '</div></article>';
        }).join('');
        var groups = {};
        places.forEach(function(place) { var province=place.provinces[0] || 'Other locations'; (groups[province] || (groups[province]=[])).push(place); });
        return Object.keys(groups).map(function(province, index) {
            var rows=groups[province];var first=rows[0];
            var key=Object.keys(provinces).filter(function(key){return provinces[key]==province;})[0];
            var thumbs=rows.map(function(place, i) { return '<li><button class="spot-select" type="button" data-place-id="' + escape(place.id) + '" aria-pressed="' + (i==0) + '" aria-label="Select ' + escape(place.name) + '">' + photo(place.image, place.name) + '<span>' + escape(place.name) + '</span></button></li>'; }).join('');
            return '<section class="location" aria-label="' + escape(province) + ' places"><div class="bg"><div class="province-image">' + photo(first.image, first.name) + '</div><div class="detailsContainer"><div class="bigDetails">' + spotDetails(first) + '</div><aside class="province-map">' + (key ? '<img src="/images/map/' + key + '.png" alt="' + escape(province) + ' province map">' : '') + '<h3>' + escape(province) + '</h3></aside></div></div><div class="cardContainer"><div class="strip-heading"><h2>' + escape(province) + ' places</h2><div><button type="button" class="thumb-scroll" data-direction="previous" aria-label="Previous places in ' + escape(province) + '">&#8249;</button><button type="button" class="thumb-scroll" data-direction="next" aria-label="Next places in ' + escape(province) + '">&#8250;</button></div></div><ul class="spot-strip">' + thumbs + '</ul></div></section>';
        }).join('');
    }
    function select(section, place) {
        var image=section.querySelector('.province-image img');
        image.src=Content.safeUrl(place.image,'image'); image.alt=place.name;
        var reduced = typeof window != 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced && image.animate) image.animate([{opacity:0.35,transform:'scale(1.02)'},{opacity:1,transform:'scale(1)'}],{duration:400,easing:'ease-out'});
        var button=section.querySelector('.province-image .photo-open');
        if(button) button.setAttribute('aria-label','View image: '+place.name);
        var details=section.querySelector('.bigDetails');
        details.innerHTML=spotDetails(place);
        if (!reduced && details.animate) details.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
        section.querySelectorAll('.spot-select').forEach(function(button){button.setAttribute('aria-pressed',String(button.getAttribute('data-place-id')==place.id));});
    }
    var helpers={render:render,select:select};
    if(typeof module!='undefined' && module.exports) module.exports=helpers;
    else root.LegacyListings=helpers;
})(typeof window!='undefined' ? window : this);
