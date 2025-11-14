let query;
let search;
$(".searchBar").keyup(function(){
let searchContent =  ``;
    search = $(".searchBar").val();
    for(let i=0; i<data.length; i++){
        let param = new URLSearchParams(data[i]).toString()
        let link = `/chilldetails?${param}`
        let comp1 = data[i].h1.toLowerCase();
        let comp2 = data[i].h2.toLowerCase();

        if(comp1.includes(search) || comp2.includes(search)){
            searchContent += `
                    <div class="searchCard">
                    <img src="${data[i].img}" alt="">
                    <div class="details">
                    <h1 class="searchName">${data[i].h1}</h1>
                    <p class="searchP">${data[i].p}</p>  
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