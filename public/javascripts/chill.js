let data;
let attr;
let news;
$.ajax({
    url: "http://localhost:3000/database/action",
    method: "POST",
    data: { action: 'getData' },
    dataType: "json",
    success: function(result) {
        // Check if data is in expected format
        if (result && result.result) {
            data=result.result
            // console.log(result.result)
            // console.log(result.result2)
            // console.log(result.result3)
            news = result.result2
            attr = result.result3
            loadContent()
            loadattractions()
        } else {
            console.error('Unexpected response format:', data);
        }
    },
    error: function(jqXHR, textStatus, errorThrown) {
        // Log the error details
        console.error('AJAX request failed.');
        console.error('Status:', textStatus);
        console.error('Error:', errorThrown);
        console.error('Response:', jqXHR.responseText);
    }
});

let perView = 5;
    
function loadContent(){

    let cb = ``;
    let lsk =  ``;
    let s =  ``;
    let c =  ``;
    let e =  ``;
    let n =  ``;
    let l =  ``;
    let m =  ``;
    let w =  ``;
    let nw =  ``;



if($(window).width() <= "768"){
    perView = 2;
}

    for(let i=0; i<data.length; i++){
        switch(data[i].ln){
            case "cb": cb += `  <li class="glide__slide cb card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "lsk": lsk += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "s": s += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "c": c += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "e": e += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "n": n += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "l": l += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "m": m += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "w": w += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
            case "nw": nw += `<li class="glide__slide lsk card" id="${data[i].id}">
                                <img src="${data[i].img}" alt="">
                                </li>`;
                                break;
        }
    }
    $(".lsk").html(lsk);
    $(".cb").html(cb);
    $(".c").html(c);
    $(".s").html(s);
    $(".e").html(e);
    $(".n").html(n);
    $(".m").html(m);
    $(".nw").html(nw);
    $(".w").html(w);
    $(".l").html(l);
    $(".cardContainer ul").css("width", "100%");
    $("glide__slide").css("width", "100%");

    setTimeout(function() {
        const config = {
            type: "carousel",
            perView: perView
        };
        new Glide('.glide1', config).mount();
        new Glide('.glide2', config).mount();
        new Glide('.glide3', config).mount();
        new Glide('.glide4', config).mount();
        new Glide('.glide5', config).mount();
        new Glide('.glide6', config).mount();
        new Glide('.glide7', config).mount();
        new Glide('.glide8', config).mount();
        new Glide('.glide9', config).mount();
        new Glide('.glide10', config).mount();

    }, 600);

    $(".card").on("click",clickEvent);

    $.each($(".bigDetails"),function(){
        $id = $(this).attr("id");
        $param = data[$id-1];
        $(this).find("a").attr("href",`/chilldetails?${new URLSearchParams($param).toString()}`);
    });
};

function clickEvent() {

    let location;
    var id = $(this).attr("id");
    $bg = $(this).parent().parent().parent().parent().find(".bg").find("#bg");
    $h1 = $(this).parent().parent().parent().parent().find(".bg").find("h1");
    $h2 = $(this).parent().parent().parent().parent().find(".bg").find("h2");
    $p =  $(this).parent().parent().parent().parent().find(".bg").find("p");
    $b =  $(this).parent().parent().parent().parent().find(".bg").find("button").find("a");
    let param ;
    let link;

    for(let i=0; i<data.length; i++){
        if(data[i].id == id){
            location = data[i]
            param = new URLSearchParams(location).toString()
            link = `/chilldetails?${param}`;
        }
    }

    $bg.fadeOut(500, function() {
        $bg.attr('src', location.img);
        $bg.fadeIn(500);
    });
    $h1.slideUp(600, function() {
        $h1.text(location.h1);
        $h1.slideDown(600);
    });
    $h2.slideUp(700, function() {
        $h2.text(location.h2);
        $h2.slideDown(700);
    });
    $p.slideUp(800, function() {
        $p.text(location.p);
        $p.slideDown(800);
    });
    $b.attr("href",link);
}
