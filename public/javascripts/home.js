// Author: Kondwani Phiri
let data;
let attr;
let news;
$.ajax({
    url: "/database/action",
    method: "POST",
    data: { action: 'getData' },
    dataType: "json",
    success: function(result) {
        // Check if data is in expected format
        if (result && result.result) {
            news = result.result3;
            data = result.result;
            loadNews()
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

function loadNews(){
    let updatedNews =  `
  <h1 class="newCard" data-aos="fade-down" data-aos-delay="300">News Feed</h1>
    
    `;
    for(let i=0; i<news.length; i++){
        updatedNews += `<div class="newsCard" data-aos="fade-down" data-aos-delay="400">
                        <div class="imgCont"><img src="${Content.escapeHtml(Content.safeUrl(news[i].img, 'image'))}" alt=""> </div>
                        <h3>${Content.escapeHtml(news[i].headline)}</h3>
                        <p>${Content.escapeHtml(news[i].news)}</p>
                        </div>`
    }

    $(".newsFeed").html(updatedNews);
}