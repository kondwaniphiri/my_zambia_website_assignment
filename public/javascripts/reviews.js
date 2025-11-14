let reviews;
let loc = $("#locationId").text();
if($(".useruser").text()=='Guest'|| $(".useruser").text()==''){
    $(".reviewActions").hide();
}
$(".addReview").hide();
$.ajax({
    url: "http://localhost:3000/database/action",
    method: "POST",
    data: { action: 'getData' },
    dataType: "json",
    success: function(result) {
        // Check if data is in expected format
        if (result && result.result) {
            data=result.result
            reviews = result.result4;
            loadReviews()
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

function loadReviews(){

    let content = ``
    for(let i = 0; i<reviews.length; i++){
        if(reviews[i].locationId == loc){
            content += `
            <div class="ratingCard">
           <h3 class="name"> ${reviews[i].name}</h3>
     <div class="stars">
       ${stars(reviews[i].rating)}
     </div>
     <p>${reviews[i].comment}</p>
    </div>
       `
        }

    }

    if(content==""){
        if($(".useruser").text()=='Guest'|| $(".useruser").text()==''){
        content += `<h1> There aren't any Reviews. Please login to add a Review. <a href="logout">Login <i class="fa-solid fa-right-from-bracket"></i></a></h1>`
        }else{
        content += "<h1> There aren't any Reviews </h1>"
        }
    }

    $(".ratingContainer").html(content);

    function stars(n){
        let stars= ``;

        if((n%1)>0){
            let nn = Math.floor(n);
            for(let i=0; i<nn; i++){
                stars += `
                <i class="fa-solid fa-star"></i>
              `
            }
            stars += `
                <i class="fa-solid fa-star-half-stroke"></i>
              `
            for(let i=0; i<(5-(nn+1)); i++){
                stars += `
                <i class="fa-regular fa-star"></i>
              `
            }
        }else{
            for(let i=0; i<n; i++){
                stars += `
                <i class="fa-solid fa-star"></i>
                `
            }
            for(let i=0; i<5-n;i++){
                stars += `
                <i class="fa-regular fa-star"></i>
                `
            }
        }

        return stars;
        
    }

    $(".addRating").click(function(){
        let status = false;
        let uId = $(".userId").text();
        let locId = $(".locId").text();
        let sendData = {};

        for(let i = 0; i<reviews.length; i++){
            if(reviews[i].userId == uId && reviews[i].locationId == locId){
                alert("you have already rated this chill spot, try editing")
                status = false;
                break;
            }else{
                status = true;
            }
        }

        if(status){
            $(".addReview").show();
            $(".addButton").show();
            $(".editButton").hide();
            $(".deleteButton").hide();

            $(".addReview").submit(function(e){
                e.preventDefault();
                sendData.uId = uId;
                sendData.locId = locId;
                sendData.rating = $("#inputRating").val();
                sendData.comment = $("#inputComment").val();

                send = JSON.stringify(sendData);
                console.log(sendData);

                $.post("http://localhost:3000/database/action", { action: 'addReview',data: send}, function(response) {
                    alert('review updated successfully');
                    $(".addReview").hide();
                    location.reload();
                });

            })
        }


        $("#inputRating").keyup(function (e) { 
            $(".stars2").html(stars($("#inputRating").val()))
        });
    })


    $(".editRating").click(function(){
        let status;
        let uId = $(".userId").text();
        let locId = $(".locId").text();
        let rating, comment;
        let sendData = {};

        for(let i = 0; i<reviews.length; i++){
            if(reviews[i].userId == uId && reviews[i].locationId == locId){
                status = true;
                rating = reviews[i].rating;
                comment = reviews[i].comment;
                break;
            }else{
                status = false;
            }
        }
        if(!status){
            alert("There isn't any review for you to edit. Add one review!")
        }else{
            $(".addReview").show();
            $(".addButton").hide();
            $(".editButton").show();
            $(".deleteButton").hide();
            $("#inputRating").val(rating);
            $(".stars2").html(stars(rating));
            $("#inputComment").val(comment);

            $(".addReview").submit(function(e){
                e.preventDefault();
                sendData.uId = uId;
                sendData.locId = locId;
                sendData.rating = $("#inputRating").val();
                sendData.comment = $("#inputComment").val();

                send = JSON.stringify(sendData);
                console.log(sendData);

                $.post("http://localhost:3000/database/action", { action: 'updateReview',data: send}, function(response) {
                    alert('review updated successfully');
                    $(".addReview").hide();
                    location.reload();
                });

            })

    }
    })


    $(".deleteRating").click(function(){


        let status;
        let uId = $(".userId").text();
        let locId = $(".locId").text();
        let rating, comment;
        let sendData = {};

        for(let i = 0; i<reviews.length; i++){
            if(reviews[i].userId == uId && reviews[i].locationId == locId){
                status = true;
                rating = reviews[i].rating;
                comment = reviews[i].comment;
                break;
            }else{
                status = false;
            }
        }
        if(!status){
            alert("There isn't any review for you to delete. Add one review!")
        }else{
            $(".addReview").show();
            $(".addButton").hide();
            $(".editButton").hide();
            $(".deleteButton").show();
            $("#inputRating").val(rating);
            $(".stars2").html(stars(rating));
            $("#inputComment").val(comment);

            $(".addReview").submit(function(e){
                e.preventDefault();
                sendData.uId = uId;
                sendData.locId = locId;

                send = JSON.stringify(sendData);
                console.log(sendData);

                if(confirm("Are you sure you want to delete this review?")){
                    $.post("http://localhost:3000/database/action", { action: 'deleteReview',data: send}, function(response) {
                        alert('review Deleted successfully');
                        $(".addReview").hide();
                        location.reload();
                    });
                }else{
                    $(".addReview").hide();

                }

            })
        }
    })

    $(".close").click(function(){
        $(".addReview").hide();
    })
}