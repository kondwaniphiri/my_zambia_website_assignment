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
            attr = result.result2
            console.log(result.result3)
            if($(window).width()<="768"){
              loadattractionsMobile()
            }else{
              loadattractions()
            }
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


function loadattractionsMobile(){
  AOS.init();
  $attractionCards = $(".attractions");
  let attsCards =``;

  for(let i=0; i<attr.length; i++){

    attsCards +=`
    <div class="card leftCard">
    <div class="imgContainer" >
      <img src="${attr[i].img1}" alt="">
    </div>
    <div class="details" >
      <h2>${attr[i].name}</h2>
      <p>${attr[i].description}</p>
      <h3>Activities To Do:</h3>
      <ul>
        <li>${attr[i].activities[0]}</li>
        <li>${attr[i].activities[1]}</li>
        <li>${attr[i].activities[2]}</li>
        <li>${attr[i].activities[3]}</li>
      </ul>
    </div>
    <div class="galleryContainer">
      <div class=""><img src="${attr[i].img2}" alt=""></div>
      <div class=""><img src="${attr[i].img3}" alt=""></div>
      <div class=""><img src="${attr[i].img4}" alt=""></div>
    </div>
  <div class="space"></div>
</div>
`;

}

console.log(attr)
$attractionCards.html(attsCards);
}






function loadattractions(){
    $attractionCards = $(".attractions");
    let attsCards =``;

    

    for(let i=0; i<attr.length; i+=2){

        if(attr[i]){
            attsCards +=`
            <div class="card leftCard">
            <div class="imgContainer" data-aos="fade-up" data-aos-delay="400">
              <img src="${attr[i].img1}" alt="">
            </div>
            <div class="details" data-aos="fade-right" data-aos-delay="400">
              <h2>${attr[i].name}</h2>
              <p>${attr[i].description}</p>
              <h3>Activities To Do:</h3>
              <ul>
                <li>${attr[i].activities[0]}</li>
                <li>${attr[i].activities[1]}</li>
                <li>${attr[i].activities[2]}</li>
                <li>${attr[i].activities[3]}</li>
              </ul>
            </div>
            <div class="galleryContainer">
              <div class=""><img src="${attr[i].img2}" alt=""></div>
              <div class=""><img src="${attr[i].img3}" alt=""></div>
              <div class=""><img src="${attr[i].img4}" alt=""></div>
            </div>
          <div class="space"></div>
        </div>
        `;
        }if(attr[i+1]){
            attsCards +=`
            <div class="card rightCard" data-aos="fade-right" data-aos-delay="500">
            <div class="details" data-aos="fade-up" data-aos-delay="500">
              <h2>${attr[i+1].name}</h2>
              <p>${attr[i+1].description}</p>
              <h3>Activities To Do:</h3>
              <ul>
                <li>${attr[i+1].activities[0]}</li>
                <li>${attr[i+1].activities[1]}</li>
                <li>${attr[i+1].activities[2]}</li>
                <li>${attr[i+1].activities[3]}</li>
              </ul>
            </div>
            <div class="imgContainer">
              <img src="${attr[i+1].img1}" alt="">
            </div>
            
            <div class="space"></div>
            <div class="galleryContainer">
              <div class=""><img src="${attr[i+1].img2}" alt=""></div>
              <div class=""><img src="${attr[i+1].img3}" alt=""></div>
              <div class=""><img src="${attr[i+1].img4}" alt=""></div>
            </div>
        </div>
        `
        }
    }

    // console.log(attr)
    $attractionCards.html(attsCards);


}