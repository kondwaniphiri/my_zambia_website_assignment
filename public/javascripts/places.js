// Author: Kondwani Phiri
﻿// Small shared helpers used by the jQuery directory, migrations and tests.
(function(root) {
    var provinces = { c: 'Central', cb: 'Copperbelt', e: 'Eastern', l: 'Luapula', lsk: 'Lusaka', m: 'Muchinga', n: 'Northern', nw: 'North-Western', s: 'Southern', w: 'Western' };
    function list(value) {
        if (Array.isArray(value)) return value.filter(function(item) { return typeof item == 'string' && item.trim(); });
        if (typeof value != 'string' || !value.trim()) return [];
        try { var parsed = JSON.parse(value); if (Array.isArray(parsed)) return list(parsed); } catch (error) {}
        return value.split(',').map(function(item) { return item.trim(); }).filter(Boolean);
    }
    function provincesFromLocation(location) {
        var text = String(location || '').toLowerCase();
        var found = [];
        Object.keys(provinces).forEach(function(key) {
            var name = provinces[key];
            var expression = key == 'nw' ? /\bnorth[ -]?western\b/ : new RegExp('\\b' + name.toLowerCase() + '\\b');
            if (key == 'w' && /\bnorth[ -]?western\b/.test(text)) return;
            if (expression.test(text)) found.push(name);
        });
        return found;
    }
    function activitiesFromCategory(category) {
        var text = String(category || '').toLowerCase();
        var rules = [ [/restaurant|dining|grill|pizzeria|food|chicken|cuisine|delicacies/, 'Dining'], [/bar|pub|drinks/, 'Drinks'], [/coffee|dessert/, 'Coffee & dessert'], [/lodge|accommodation|stay|stopover/, 'Stays'], [/camping|campsite/, 'Camping'], [/pool|swimming/, 'Swimming'], [/national park|wildlife/, 'Wildlife'], [/gallery|museum|cultur/, 'Art & culture'], [/entertainment/, 'Entertainment'], [/leisure|outdoor/, 'Outdoor recreation'] ];
        return rules.filter(function(rule) { return rule[0].test(text); }).map(function(rule) { return rule[1]; });
    }
    function normalize(row, kind, reviews) {
        var attraction = kind == 'attractions';
        var ratings = attraction ? [] : (reviews || []).filter(function(review) { return String(review.locationId) == String(row.id) && Number(review.rating) >= 1 && Number(review.rating) <= 5; });
        var province = attraction ? list(row.province) : (provinces[row.ln] ? [provinces[row.ln]] : []);
        var activities = list(row.activities);
        if (!attraction && !activities.length) activities = activitiesFromCategory(row.h2);
        return { id: row.id, kind: kind, name: attraction ? row.name : row.h1, category: attraction ? 'Physical attraction' : row.h2,
            description: attraction ? row.description : row.p, details: attraction ? row.significant_features : row.details,
            location: attraction ? row.location : row.address, provinces: province, activities: activities,
            image: attraction ? row.img1 : row.img, photos: [row.img1, row.img2, row.img3, row.img4].filter(Boolean),
            hours: row.opening_hours || '', phone: row.phone || '', site: row.site || '',
            reviewCount: ratings.length, rating: ratings.length ? ratings.reduce(function(sum, review) { return sum + Number(review.rating); }, 0) / ratings.length : null };
    }
    function filter(places, selection) {
        var query = String(selection.query || '').trim().toLowerCase();
        return places.filter(function(place) {
            return (!selection.province || place.provinces.indexOf(selection.province) != -1) &&
                (!selection.activity || place.activities.indexOf(selection.activity) != -1) &&
                (!query || [place.name, place.category, place.location, place.description].join(' ').toLowerCase().indexOf(query) != -1);
        });
    }
    var helpers = { provinces: provinces, list: list, provincesFromLocation: provincesFromLocation, activitiesFromCategory: activitiesFromCategory, normalize: normalize, filter: filter };
    if (typeof module != 'undefined' && module.exports) module.exports = helpers;
    else root.Places = helpers;
})(typeof window != 'undefined' ? window : this);
