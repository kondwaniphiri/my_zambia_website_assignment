$(document).on("scroll", function(){
    if(window.scrollY>0){
        $('header').addClass('scrolled');
        $('#navBarTrigger i').css("color","white");
        $('#navBarTrigger span').css("color","white");
    }else{
        $('header').removeClass('scrolled');
    } 
});

$(".newsLetterButton").on("click",function(){

    if($(".newsLetter").val().includes("@")){
        $(".newsLetter").val("");
        alert("Thank you for Subscribing!")
    }else{
        alert("Please enter a valid email")
        $(".newsLetter").val("");
    }
})

// navbar functionality
$(".links2").hide();
$("#navBarTrigger span").hide();


$("#navBarTrigger").on("click", function(){
    $("#navBarTrigger i").toggleClass("fas fa-bars", "");
    $("#navBarTrigger span").toggle();
    $(".links2").toggle(200);
});
