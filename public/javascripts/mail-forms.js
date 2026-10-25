// Author: Kondwani Phiri
﻿(function() {
    $('.mail-form').on('submit',function(event) {
        event.preventDefault();
        var form=$(this);
        var button=form.find('button[type=submit]');
        if(button.prop('disabled'))return;
        button.prop('disabled',true);
        form.find('.mail-status').text('Please wait...');
        $.ajax({url:form.attr('action'),method:'POST',data:form.serialize(),dataType:'json'})
            .done(function(result){form[0].reset();form.find('.mail-status').text(result.message);})
            .fail(function(xhr){form.find('.mail-status').text(xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message) || (xhr.status == 429 ? 'Too many requests. Please try again later.' : 'Could not send your request. Please try again.'));})
            .always(function(){button.prop('disabled',false);});
    });
})();
