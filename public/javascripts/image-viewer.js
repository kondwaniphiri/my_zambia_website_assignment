// Author: Kondwani Phiri
﻿(function() {
    'use strict';
    var selector = '.province-image img, .place-media img, .place-thumbnails img, .attractions .imgContainer img, .attractions .galleryContainer img, .main > img, .gallery img, .destCard img, .newsCard img';
    var viewer = document.createElement('dialog');
    viewer.className = 'image-viewer';
    viewer.setAttribute('aria-label', 'Photo viewer');
    viewer.innerHTML = '<div class="viewer-toolbar"><span class="viewer-count" aria-live="polite"></span><button type="button" class="viewer-close" aria-label="Close image viewer">&times;</button></div><figure class="viewer-figure"><img class="viewer-image" alt=""><figcaption class="viewer-caption" aria-live="polite"></figcaption></figure><div class="viewer-controls"><button type="button" class="viewer-prev" aria-label="Previous image">&#8249;</button><button type="button" class="viewer-next" aria-label="Next image">&#8250;</button></div>';
    document.body.appendChild(viewer);
    var fullImage = viewer.querySelector('.viewer-image');
    var caption = viewer.querySelector('.viewer-caption');
    var count = viewer.querySelector('.viewer-count');
    var previous = viewer.querySelector('.viewer-prev');
    var next = viewer.querySelector('.viewer-next');
    var photos = [];
    var index = 0;
    var opener;
    var oldOverflow;

    function imageTitle(image) {
        var card = image.closest('.card, .destCard, .newsCard');
        var heading = card ? card.querySelector('h2, h1, h3') : document.querySelector('.det h1');
        return image.alt || (heading && heading.textContent.trim()) || 'Discover Zambia';
    }
    function showPhoto() {
        var photo = photos[index];
        fullImage.hidden = false;
        fullImage.src = Content.safeUrl(photo.getAttribute('src'), 'image');
        fullImage.alt = imageTitle(photo);
        caption.textContent = imageTitle(photo);
        count.textContent = 'Photo ' + (index + 1) + ' of ' + photos.length;
        previous.disabled = next.disabled = photos.length < 2;
    }
    function move(step) {
        if (photos.length < 2) return;
        index = (index + step + photos.length) % photos.length;
        showPhoto();
    }
    function open(image, button) {
        var group = image.closest('.card, .location, .destination, .newsFeed');
        if (!group) group = document;
        photos = Array.prototype.filter.call(group.querySelectorAll('.photo-frame > img'), function(photo) {
            return !!Content.safeUrl(photo.getAttribute('src'), 'image');
        });
        index = photos.indexOf(image);
        if (index < 0) return;
        opener = button;
        showPhoto();
        oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        viewer.showModal();
        viewer.querySelector('.viewer-close').focus();
    }
    viewer.querySelector('.viewer-close').addEventListener('click', function() { viewer.close(); });
    previous.addEventListener('click', function() { move(-1); });
    next.addEventListener('click', function() { move(1); });
    viewer.addEventListener('keydown', function(event) {
        if (event.key == 'ArrowRight' || event.key == 'ArrowLeft') {
            event.preventDefault();
            move(event.key == 'ArrowRight' ? 1 : -1);
        }
    });
    viewer.addEventListener('click', function(event) { if (event.target == viewer) viewer.close(); });
    viewer.addEventListener('close', function() {
        document.body.style.overflow = oldOverflow;
        fullImage.removeAttribute('src');
        if (opener && opener.isConnected) opener.focus();
    });
    fullImage.addEventListener('error', function() {
        fullImage.hidden = true;
        caption.textContent = 'This photo could not be loaded. Try another image.';
    });

    function enhance(root) {
        var images = [];
        if (root.nodeType != 1 && root.nodeType != 9) return;
        if (root.matches && root.matches(selector)) images.push(root);
        images = images.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
        images.forEach(function(image) {
            if (image.dataset.viewerReady || !Content.safeUrl(image.getAttribute('src'), 'image')) return;
            image.dataset.viewerReady = 'true';
            var frame = document.createElement('span');
            frame.className = 'photo-frame';
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'photo-open';
            button.setAttribute('aria-label', 'View image: ' + imageTitle(image));
            button.setAttribute('aria-haspopup', 'dialog');
            var label = document.createElement('span');
            label.className = 'photo-hint';
            label.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
            button.title = 'View image';
            button.appendChild(label);
            image.parentNode.insertBefore(frame, image);
            frame.appendChild(image);
            frame.appendChild(button);
            if (!image.alt) image.alt = imageTitle(image);
            button.addEventListener('click', function(event) { event.stopPropagation(); open(image, button); });
        });
    }
    // Attraction cards, news and galleries arrive through the existing AJAX calls.
    if (typeof viewer.showModal != 'function') { viewer.remove(); return; }
    enhance(document);
    new MutationObserver(function(changes) {
        changes.forEach(function(change) {
            Array.prototype.forEach.call(change.addedNodes, enhance);
        });
    }).observe(document.body, { childList: true, subtree: true });
})();
