// Author: Kondwani Phiri
﻿var fs = require('fs');
var vm = require('vm');
var assert = require('assert');
var elements = {};
var nodes = [];
var requests = [];
var complete;
function element(key) {
    if (!elements[key]) elements[key] = new Element(key);
    return elements[key];
}
function Element(key) { this.key = key; this.handlers = {}; this.items = []; this.value = ''; this.textValue = ''; }
Element.prototype.hide = Element.prototype.show = Element.prototype.toggle = Element.prototype.prop = function() { return this; };
Element.prototype.first = function() { return this; };
Element.prototype.find = function(key) { return element(this.key + ' ' + key); };
Element.prototype.text = function(value) { if (!arguments.length) return this.textValue; this.textValue = value; return this; };
Element.prototype.val = function(value) { if (!arguments.length) return this.value; this.value = value; return this; };
Element.prototype.html = function(value) { this.htmlValue = value; return this; };
Element.prototype.empty = function() { this.items = []; return this; };
Element.prototype.children = function() { return this.items; };
Element.prototype.appendTo = function(parent) { parent.items.push(this); return this; };
Element.prototype.off = function(event) { delete this.handlers[event]; return this; };
Element.prototype.on = function(event, callback) { this.handlers[event] = callback; return this; };
function $(key) {
    if (key[0] == '<') { var node = new Element(key); nodes.push(node); return node; }
    return element(key);
}
$.trim = function(text) { return text.trim(); };
var malicious = '<img src=x onerror=alert(1)>';
$.ajax = function(options) { options.success({result4:[{locationId:1,userId:8,name:malicious,comment:malicious,rating:4}]}); };
$.post = function(url, data) {
    requests.push(data);
    return {done:function() {return this;},fail:function() {return this;},always:function(callback) {complete=callback;return this;}};
};
element('#locationId').textValue='1'; element('.userId').textValue='7';
var context = { $:$, alert:function(){},confirm:function(){return true;}, window:{location:{reload:function(){}}} };
vm.runInNewContext(fs.readFileSync('public/javascripts/reviews.js','utf8'),context);
assert(nodes.filter(function(n){return n.textValue==malicious;}).length == 2);
assert(!nodes.some(function(n){return n.htmlValue && n.htmlValue.includes(malicious);}));
var add=element('.addRating').handlers['click.reviews'];
for (var i=0;i<5;i++) add();
assert.equal(Object.keys(element('.addReview').handlers).length,1);
var submit=element('.addReview').handlers['submit.reviews'];
submit({preventDefault:function(){}}); submit({preventDefault:function(){}});
assert.equal(requests.length,1); assert.equal(requests[0].action,'addReview');
complete();
context.reviews.push({locationId:1,userId:7,name:'Me',comment:'Old',rating:3});
element('.editRating').handlers['click.reviews']();
submit({preventDefault:function(){}}); assert.equal(requests[1].action,'updateReview'); complete();
element('.deleteRating').handlers['click.reviews']();
submit({preventDefault:function(){}}); assert.equal(requests[2].action,'deleteReview');
assert.equal(context.reviewStars(999).match(/<i /g).length,5);
var prefilter;
var jq=function(){return {on:function(){}};}; jq.ajaxPrefilter=function(callback){prefilter=callback;};
vm.runInNewContext(fs.readFileSync('public/javascripts/security.js','utf8'),{$:jq,document:{querySelector:function(){return {content:'token'};}}});
var headers=[];var xhr={setRequestHeader:function(k,v){headers.push([k,v]);}};
prefilter({type:'POST',crossDomain:false},{},xhr);assert.deepEqual(headers,[['X-CSRF-Token','token']]);
prefilter({type:'POST',crossDomain:true},{},xhr);prefilter({type:'GET',crossDomain:false},{},xhr);assert.equal(headers.length,1);
console.log('PASS: review text nodes, repeated clicks, duplicate submit prevention, switching actions, bounded stars and same-origin CSRF headers.');
var securityModule = {exports:{}};
var now = 1000;
vm.runInNewContext(fs.readFileSync('middleware/security.js','utf8'), {module:securityModule,exports:securityModule.exports,require:require,Date:{now:function(){return now;}},Map:Map,Buffer:Buffer,process:{env:{SESSION_STORE:'memory'}}});
var limiter = securityModule.exports.loginLimiter({maximum:2,windowMs:1000});
var allowed = 0;
var response = {set:function(k,v){this[k]=v;},status:function(code){this.code=code;return this;},send:function(){}};
limiter({ip:'one'},response,function(){allowed++;});
limiter({ip:'one'},response,function(){allowed++;});
limiter({ip:'one'},response,function(){allowed++;});
assert.equal(allowed,2);assert.equal(response.code,429);assert.equal(response['Retry-After'],'1');
limiter({ip:'two'},response,function(){allowed++;});assert.equal(allowed,3);
now += 1001;
limiter({ip:'one'},response,function(){allowed++;});assert.equal(allowed,4);
console.log('PASS: login limiter isolates IPs, returns Retry-After and expires buckets.');
var Content = require('./public/javascripts/content');
assert.equal(Content.escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(Content.escapeHtml('</textarea><script>alert(1)</script>'), '&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
['javascript:alert(1)','data:text/html,test','//evil.example/picture','images/../secrets','images/%2e%2e/secret','https://example.com/" onerror="alert(1)','https://user:pass@example.com/'].forEach(function(value) {assert.equal(Content.safeUrl(value,'image'),'');});
assert.equal(Content.safeUrl('images/highlights/1.jpg','image'), '/images/highlights/1.jpg');
assert.equal(Content.safeUrl('https://example.com/site','site'), 'https://example.com/site');
assert.equal(Content.safeUrl('https://evil.example/maps/embed','map'),'');
assert.equal(Content.safeUrl('https://www.google.com/maps/embed?pb=test','map'),'https://www.google.com/maps/embed?pb=test');
console.log('PASS: HTML/attribute escaping and website/image/map URL restrictions.');
