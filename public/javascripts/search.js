// Author: Kondwani Phiri
let query;
let search;
$(".searchBar").keyup(function(){
let searchContent =  ``;
    search = $(".searchBar").val().toLowerCase();
    for(let i=0; i<data.length; i++){
        let param = new URLSearchParams({ id: data[i].id }).toString()
        let link = `/chilldetails?${param}`
        let comp1 = String(data[i].h1 || '').toLowerCase();
        let comp2 = String(data[i].h2 || '').toLowerCase();

        if(comp1.includes(search) || comp2.includes(search)){
            searchContent += `
                    <div class="searchCard">
                    <img src="${Content.escapeHtml(Content.safeUrl(data[i].img, 'image'))}" alt="">
                    <div class="details">
                    <h1 class="searchName">${Content.escapeHtml(data[i].h1)}</h1>
                    <p class="searchP">${Content.escapeHtml(data[i].p)}</p>
                    <a href="${link}">See More</a>
                    </div>
                    </div>
            `
        }
    }

    $(".searchContent").html(searchContent)
})
$(".search").hide();
$(".close").on("click",function(){
    $(".search").fadeOut(200);
})
$("#search").on("click",function(){
    $(".search").fadeIn(200);
})

$(".close").on("click",function(){
    $(".search").fadeOut(200);
})
$("#search2").on("click",function(){
    $(".search").fadeIn(200);
})