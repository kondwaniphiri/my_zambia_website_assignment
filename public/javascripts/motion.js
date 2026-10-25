// Author: Kondwani Phiri
﻿(function() {
    if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var selector = '.legacy-attractions .card, .legacy-chill .location';
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.05 });
    function observe(root) {
        if (root.nodeType != 1 && root.nodeType != 9) return;
        var nodes = root.matches && root.matches(selector) ? [root] : [];
        nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
        nodes.forEach(function(node) {
            if (node.classList.contains('motion-ready')) return;
            node.classList.add('motion-ready');
            observer.observe(node);
        });
    }
    observe(document);
    new MutationObserver(function(changes) {
        changes.forEach(function(change) { Array.prototype.forEach.call(change.addedNodes, observe); });
    }).observe(document.body, {childList:true,subtree:true});
})();
