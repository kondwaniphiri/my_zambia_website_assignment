// Author: Kondwani Phiri
// Loaded immediately after jQuery, before any application requests.
(function() {
  var token = document.querySelector('meta[name="csrf-token"]').content;
  $.ajaxPrefilter(function(options, original, xhr) {
    if (!options.crossDomain && !/^(GET|HEAD|OPTIONS)$/i.test(options.type)) {
      xhr.setRequestHeader('X-CSRF-Token', token);
    }
  });
  $(document).on('click', 'a[href="logout"], a[href="/logout"]', function(event) {
    event.preventDefault();
    var form = $('<form>', { method: 'POST', action: '/logout' });
    $('<input>', { type: 'hidden', name: '_csrf', value: token }).appendTo(form);
    form.appendTo('body')[0].submit();
  });
})();
