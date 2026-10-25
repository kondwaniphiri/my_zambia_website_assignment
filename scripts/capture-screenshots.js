// Author: Kondwani Phiri
﻿// Capture this local project in an isolated browser, without touching personal tabs.
var fs = require('fs');
var path = require('path');
var chromium = require('playwright').chromium;
var base = 'http://127.0.0.1:3001';
var output = path.join(__dirname, '../screenshots');
var shots = [];
var errors = [];
async function context(browser, options) {
    var ctx = await browser.newContext(Object.assign({viewport:{width:1440,height:960},reducedMotion:'reduce'},options));
    await ctx.route('**/*',function(route) {
        var url = new URL(route.request().url());
        return url.origin == base ? route.continue() : route.abort();
    });
    return ctx;
}
async function ready(page) {
    await page.waitForLoadState('networkidle');
    await page.evaluate(function(){return document.fonts.ready;});
    await page.waitForTimeout(250);
}
async function go(page, route) {
    await page.goto(base+route,{waitUntil:'networkidle'});
    await ready(page);
}
async function capture(page,name,title,fullPage) {
    await ready(page);
    if(fullPage) {
        var height = await page.evaluate(function(){return document.documentElement.scrollHeight;});
        for(var y=0;y<height;y+=700) {
            await page.evaluate(function(y){window.scrollTo(0,y);},y);
            await page.waitForTimeout(80);
        }
        await page.evaluate(function(){window.scrollTo(0,0);});
        await ready(page);
    }
    await page.screenshot({path:path.join(output,name+'.png'),fullPage:!!fullPage,animations:'disabled'});
    shots.push({file:name+'.png',title:title,viewport:page.viewportSize(),fullPage:!!fullPage});
    console.log('Saved '+name+'.png');
}
async function run() {
    fs.mkdirSync(output,{recursive:true});
    var browser=await chromium.launch({channel:'chrome',headless:true});
    try {
        var ctx=await context(browser);
        var page=await ctx.newPage();
        page.on('pageerror',function(error){errors.push({page:page.url(),message:error.message});});
        await go(page,'/login');
        await capture(page,'01-login','Login',false);
        await go(page,'/signup');
        await capture(page,'02-signup','Create account',true);
        await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
        await page.waitForURL('**/guest');
        await capture(page,'03-homepage','Homepage',true);
        await page.locator('.destination').scrollIntoViewIfNeeded();
        await capture(page,'04-destination-highlights','Destination highlights',false);
        await go(page,'/attractions');
        await page.locator('.legacy-attractions .card').first().waitFor();
        await capture(page,'05-physical-attractions','Physical Attractions full page',true);
        await page.locator('.legacy-attractions .card').first().scrollIntoViewIfNeeded();
        await capture(page,'06-attraction-gallery','Attraction information and gallery',false);
        await page.locator('.legacy-attractions .photo-open').first().click();
        await page.locator('.image-viewer[open]').waitFor();
        await capture(page,'07-image-viewer','Image viewer',false);
        await page.getByRole('button',{name:'Close image viewer',exact:true}).click();
        await page.selectOption('#place-province','Southern');
        await capture(page,'08-attraction-filters','Filtered attractions',false);
        await go(page,'/chill');
        await page.locator('.legacy-chill .location').first().waitFor();
        await capture(page,'09-chill-spots','Chill Spots full page',true);
        await page.locator('.spot-select').nth(1).click();
        await capture(page,'10-chill-spot-selection','Province thumbnail selection',false);
        await go(page,'/chilldetails?id=1');
        await page.locator('.ratingCard').first().waitFor();
        await capture(page,'11-location-details','Location details',true);
        await page.locator('.ratings').scrollIntoViewIfNeeded();
        await capture(page,'12-location-reviews','Location reviews',false);
        await page.locator('#search').click();
        await page.locator('.searchBar').fill('Cross');
        await page.locator('.searchBar').press('s');
        await page.locator('.searchBar').fill('Cross');
        await page.locator('.searchBar').press('ArrowLeft');
        await page.locator('.searchCard').first().waitFor();
        await capture(page,'13-place-search','Search overlay',false);
        await go(page,'/contact');
        await capture(page,'14-contact','Contact page',true);
        await go(page,'/');
        await page.locator('footer').scrollIntoViewIfNeeded();
        await capture(page,'15-newsletter-footer','Footer and newsletter form',false);
        var credentials=fs.readFileSync(path.join(__dirname,'../.local/admin-account.txt'),'utf8');
        await go(page,'/login');
        await page.fill('#email',credentials.match(/^Email: (.*)$/m)[1].trim());
        await page.fill('#password',credentials.match(/^Password: (.*)$/m)[1].trim());
        await page.getByRole('button',{name:'Log in',exact:true}).click();
        await page.waitForURL(base+'/');
        await go(page,'/dashboard/');
        await page.locator('.admin-access summary').click();
        await capture(page,'16-admin-dashboard','Administrator access summary',false);
        await page.locator('#chillspots-btn').click();
        await page.locator('#content table').waitFor();
        await capture(page,'17-admin-chill-spots','Admin Chill Spots management',false);
        await page.locator('#attractions-btn').click();
        await page.waitForFunction(function(){return document.querySelector('#content h2')?.textContent=='Physical Attractions';});
        await capture(page,'18-admin-attractions','Admin attraction management',false);
        await page.locator('#news-btn').click();
        await page.waitForFunction(function(){return document.querySelector('#content h2')?.textContent=='News';});
        await capture(page,'19-admin-news','Admin news management',false);
        await page.locator('#email-btn').click();
        await page.locator('#newsletter-editor').waitFor();
        await capture(page,'20-admin-email','Contact inbox and newsletter drafts',false);
        await page.locator('#chillspots-btn').click();
        await page.locator('#content table').waitFor();
        await page.setViewportSize({width:390,height:844});
        await capture(page,'25-mobile-dashboard','Mobile dashboard',false);
        if(await page.evaluate(function(){return document.documentElement.scrollWidth > innerWidth;})) throw new Error('Dashboard overflows mobile viewport');
        await page.setViewportSize({width:1440,height:960});
        await page.locator('#content .action-btn').first().click();
        await page.locator('#chillspot-form').waitFor();
        await capture(page,'26-admin-edit-form','Administrator edit form',true);
        if(await page.locator('#content input').evaluateAll(function(fields){return fields.some(function(field){return !field.labels.length;});})) throw new Error('An edit field has no label');
        var mobile=await context(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
        var phone=await mobile.newPage();
        await go(phone,'/login');
        await capture(phone,'21-mobile-login','Mobile login',true);
        await phone.getByRole('button',{name:'Continue as guest',exact:true}).click();
        await phone.waitForURL('**/guest');
        await phone.locator('#navBarTrigger').click();
        await capture(phone,'22-mobile-navigation','Mobile navigation menu',false);
        await go(phone,'/attractions');
        await phone.locator('.legacy-attractions .card').first().waitFor();
        await phone.locator('.legacy-attractions .card').first().scrollIntoViewIfNeeded();
        await capture(phone,'23-mobile-attractions','Mobile attraction layout',false);
        await go(phone,'/chill');
        await phone.locator('.legacy-chill .location').first().waitFor();
        await phone.locator('.legacy-chill .location').first().scrollIntoViewIfNeeded();
        await capture(phone,'24-mobile-chill-spots','Mobile Chill Spots layout',false);
    } finally {
        await browser.close();
        fs.writeFileSync(path.join(output,'capture-report.json'),JSON.stringify({generated:new Date().toISOString(),screenshots:shots,scriptErrors:errors},null,2));
        fs.writeFileSync(path.join(output,'README.md'),'# MyZambia screenshots\n\nAuthor: Kondwani Phiri\n\nCaptured from the local app using an isolated Chrome session.\nNo messages, reviews or newsletters were submitted.\nExternal embeds are excluded from this local capture.\n\n'+shots.map(function(shot){return '- ['+shot.title+']('+shot.file+')';}).join('\n')+'\n');
    }
    if(errors.length)console.log('Browser script errors: '+JSON.stringify(errors));
    console.log('Completed '+shots.length+' screenshots.');
}
run().catch(function(error){console.error(error);process.exitCode=1;});
