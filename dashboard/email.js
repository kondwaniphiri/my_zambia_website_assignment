// Author: Kondwani Phiri
﻿$(document).ready(function() {
    $('#email-btn').on('click',loadEmail);
    function loadEmail() {
        $('#content').empty().append($('<p>').text('Loading messages...'));
        $.getJSON('/email/admin/overview').done(function(data) {
            var root=$('#content').empty();
            $('<h2>').text('Email and newsletter').appendTo(root);
            $('<p>').text(data.configured ? 'Email delivery is configured.' : 'Email delivery is disabled. Fill in the email settings in .env and restart the app.').appendTo(root);
            $('<p>').text(data.subscribers+' confirmed newsletter subscribers.').appendTo(root);
            var form=$('<form>',{id:'newsletter-editor'}).appendTo(root);
            $('<h3>').text('Write a newsletter').appendTo(form);
            $('<label>',{for:'campaign-subject'}).text('Subject').appendTo(form);
            $('<input>',{type:'text',id:'campaign-subject',name:'subject',maxlength:150,required:true}).appendTo(form);
            $('<label>',{for:'campaign-body'}).text('Message').appendTo(form);
            $('<textarea>',{id:'campaign-body',name:'body',rows:8,maxlength:20000,required:true}).appendTo(form);
            $('<button>',{type:'submit'}).text('Save draft').appendTo(form);
            form.on('submit',function(event) {
                event.preventDefault();
                var button=form.find('button').prop('disabled',true);
                $.post('/email/admin/campaigns',form.serialize()).done(loadEmail).always(function(){button.prop('disabled',false);});
            });
            $('<h3>').text('Drafts and delivery').appendTo(root);
            if(!data.campaigns.length)$('<p>').text('No newsletter drafts yet.').appendTo(root);
            data.campaigns.forEach(function(campaign) {
                var block=$('<section>',{'class':'email-admin-item'}).appendTo(root);
                $('<h4>').text(campaign.subject).appendTo(block);
                $('<pre>',{'class':'email-preview'}).text(campaign.body).appendTo(block);
                $('<p>').text(campaign.status+' | Recipients: '+campaign.recipients+' | Sent: '+Number(campaign.sent || 0)+' | Failed: '+Number(campaign.failed || 0)).appendTo(block);
                if(campaign.status=='draft')$('<button>',{type:'button',disabled:!data.configured || !Number(data.subscribers)}).text('Send newsletter').appendTo(block).on('click',function() {
                    if(!confirm('Send "'+campaign.subject+'" to '+data.subscribers+' confirmed subscribers?'))return;
                    var button=$(this).prop('disabled',true);
                    $.post('/email/admin/campaigns/'+encodeURIComponent(campaign.id)+'/send').done(function(result){alert(result.message);loadEmail();}).always(function(){button.prop('disabled',false);});
                });
            });
            $('<h3>').text('Contact messages').appendTo(root);
            $('<p>').text(data.contactForwarding?'New messages are also forwarded to your configured inbox.':'Messages are stored here. Fill in CONTACT_TO and SMTP settings to forward new messages to your inbox.').appendTo(root);
            if(!data.contacts.length)$('<p>').text('No contact messages yet.').appendTo(root);
            data.contacts.forEach(function(contact) {
                var block=$('<section>',{'class':'email-admin-item'}).appendTo(root);
                $('<h4>').text(contact.subject).appendTo(block);
                $('<p>').text(contact.name+' <'+contact.email+'> | '+new Date(contact.created_at).toLocaleString()).appendTo(block);
                $('<pre>',{'class':'email-preview'}).text(contact.message).appendTo(block);
            });
            $('<button>',{type:'button'}).text('Refresh status').appendTo(root).on('click',loadEmail);
        });
    }
});
