// Author: Kondwani Phiri
﻿var reviews = [];
var reviewAction = '';
var reviewBusy = false;
var reviewLocation = $.trim($('#locationId').text());
var reviewUser = $.trim($('.userId').first().text());
var reviewForm = $('.addReview');

reviewForm.hide();
if (!(Number(reviewUser) > 0)) $('.reviewActions').hide();

function reviewStars(value) {
    var rating = Math.max(0, Math.min(5, Number(value) || 0));
    var html = '';
    for (var i = 0; i < 5; i++) {
        var icon = rating >= i + 1 ? 'fa-solid fa-star' :
            (rating > i ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star');
        html += '<i class="' + icon + '"></i>';
    }
    return html;
}

function loadReviews() {
    var container = $('.ratingContainer').empty();
    for (var i = 0; i < reviews.length; i++) {
        if (String(reviews[i].locationId) != reviewLocation) continue;
        var card = $('<div>', { 'class': 'ratingCard' });
        // Text nodes keep names and comments from becoming executable HTML.
        $('<h3>', { 'class': 'name' }).text(reviews[i].name).appendTo(card);
        $('<div>', { 'class': 'stars' }).html(reviewStars(reviews[i].rating)).appendTo(card);
        $('<p>').text(reviews[i].comment).appendTo(card);
        card.appendTo(container);
    }
    if (!container.children().length) {
        $('<h1>').text(Number(reviewUser) > 0 ? "There aren't any reviews." :
            "There aren't any reviews. Please log in to add a review.").appendTo(container);
    }
}

function findOwnReview() {
    for (var i = 0; i < reviews.length; i++) {
        if (String(reviews[i].userId) == reviewUser && String(reviews[i].locationId) == reviewLocation) return reviews[i];
    }
    return null;
}

function openReview(action) {
    if (reviewBusy) return;
    var own = findOwnReview();
    if (action == 'addReview' && own) return alert('You have already reviewed this location. Try editing your review.');
    if (action != 'addReview' && !own) return alert('Add a review first.');
    reviewAction = action;
    $('#inputRating').val(own ? own.rating : 5);
    $('#inputComment').val(own ? own.comment : '');
    $('.stars2').html(reviewStars($('#inputRating').val()));
    $('.addButton').toggle(action == 'addReview');
    $('.editButton').toggle(action == 'updateReview');
    $('.deleteButton').toggle(action == 'deleteReview');
    reviewForm.show();
}

// Bind each handler once, outside the button callbacks.
$('.addRating').off('click.reviews').on('click.reviews', function() { openReview('addReview'); });
$('.editRating').off('click.reviews').on('click.reviews', function() { openReview('updateReview'); });
$('.deleteRating').off('click.reviews').on('click.reviews', function() { openReview('deleteReview'); });
$('#inputRating').off('input.reviews').on('input.reviews', function() {
    $('.stars2').html(reviewStars(this.value));
});
reviewForm.find('.close').off('click.reviews').on('click.reviews', function() {
    if (!reviewBusy) { reviewAction = ''; reviewForm.hide(); }
});
reviewForm.off('submit.reviews').on('submit.reviews', function(event) {
    event.preventDefault();
    if (reviewBusy || !reviewAction) return;
    if (reviewAction == 'deleteReview' && !confirm('Are you sure you want to delete this review?')) return;
    var data = { locId: reviewLocation, rating: $('#inputRating').val(), comment: $('#inputComment').val() };
    reviewBusy = true;
    reviewForm.find('button').prop('disabled', true);
    $.post('/database/action', { action: reviewAction, data: JSON.stringify(data) })
        .done(function() { window.location.reload(); })
        .fail(function(xhr) { alert(xhr.responseJSON && xhr.responseJSON.error || 'Could not save your review. Please try again.'); })
        .always(function() { reviewBusy = false; reviewForm.find('button').prop('disabled', false); });
});

$.ajax({
    url: '/database/action', method: 'POST', data: { action: 'getData' }, dataType: 'json',
    success: function(result) { reviews = result.result4 || []; loadReviews(); },
    error: function() { $('.ratingContainer').text('Could not load reviews. Please reload the page.'); }
});
