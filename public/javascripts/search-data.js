// Author: Kondwani Phiri
var data = [];
$.post('/database/action', { action: 'getChillSpots' }, function(result) { data = result.result || []; });
