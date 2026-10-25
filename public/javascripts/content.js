// Author: Kondwani Phiri
// Shared by EJS pages, the dashboard and server-side URL checks.
(function(root) {
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function safeUrl(value, kind) {
    if (value == null || value === '') return '';
    if (typeof value != 'string') return '';
    value = value.trim();
    if (!value || /[\s\x00-\x20\x7f<>"\\]/.test(value)) return '';
    if (kind == 'image' && /^\/?images\/[A-Za-z0-9_./%()@+-]+$/.test(value) &&
        !/(^|\/)\.\.(\/|$)|%2e|%2f|%5c/i.test(value)) return '/' + value.replace(/^\//, '');
    try {
      var url = new URL(value);
      if (url.username || url.password || !url.hostname) return '';
      if (kind == 'map') {
        if (url.protocol != 'https:' || !/^(www\.)?google\.com$/.test(url.hostname) ||
            !(url.pathname == '/maps' || url.pathname.indexOf('/maps/') == 0)) return '';
      } else if (url.protocol != 'https:' && url.protocol != 'http:') return '';
      return url.href;
    } catch (error) { return ''; }
  }
  var helpers = { escapeHtml: escapeHtml, safeUrl: safeUrl };
  if (typeof module != 'undefined' && module.exports) module.exports = helpers;
  else root.Content = helpers;
})(typeof window != 'undefined' ? window : this);
