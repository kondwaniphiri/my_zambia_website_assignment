// Author: Kondwani Phiri
﻿// Keep the existing jQuery interactions, with one accessible navigation disclosure.
$(document).on('scroll', function() { $('header').toggleClass('scrolled', window.scrollY > 0); });
(function() {
    var toggle = document.getElementById('navBarTrigger');
    var menu = document.getElementById('site-navigation');
    if (!toggle || !menu) return;
    var mobile = window.matchMedia('(max-width: 767px)');
    function setOpen(open, restoreFocus) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
        menu.classList.toggle('is-open', open);
        menu.hidden = mobile.matches && !open;
        if (restoreFocus) toggle.focus();
    }
    function sync() { setOpen(false, false); }
    toggle.addEventListener('click', function() {
        var open = toggle.getAttribute('aria-expanded') != 'true';
        setOpen(open, false);
        if (open) menu.querySelector('a').focus();
    });
    document.addEventListener('keydown', function(event) {
        if (event.key == 'Escape' && toggle.getAttribute('aria-expanded') == 'true') setOpen(false, true);
    });
    document.addEventListener('click', function(event) {
        if (!menu.contains(event.target) && !toggle.contains(event.target)) setOpen(false, false);
    });
    menu.addEventListener('click', function(event) {
        if (event.target.closest('a, button')) setOpen(false, false);
    });
    if (mobile.addEventListener) mobile.addEventListener('change', sync);
    else mobile.addListener(sync);
    menu.querySelectorAll('a').forEach(function(link) {
        if (new URL(link.href).pathname == window.location.pathname) link.setAttribute('aria-current', 'page');
    });
    sync();
})();
