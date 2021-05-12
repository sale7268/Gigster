
// ----- Zipcode Api to display Location -----
$("#zip").on("change", displayCity);
async function displayCity(){
    let zipCode = $("#zip").val();
    let url = `https://cst336.herokuapp.com/projects/api/cityInfoAPI.php?zip=${zipCode}`;
    let data = await getData(url);
    let c = data.available;
    if(data.zip) {
        $("#city").html(data.city);
        $("#state").html(data.state);
    } else {
        $("#zipCheck").html("Zip code not found");
    }
}
async function getData(url){
    let response = await fetch(url);
    let data = await response.json();
    return data;
}


 $(document).ready(function () {

     if(req.session.authenticated){
        var checkAlert = $(".checkAlert");
        $(checkAlert).hide();
     }
    

    $("#rePassword").bind("change paste keyup", function() {
        let password = $("#suPassword_").val();
        var rePassword = $("#suPasswordRepeat_").val();

        if (password != rePassword ) {
            alert("password don't match")
        }
        else {
            (checkAlert).hide();
            if(password.length >= 6){
                console.log(password.length)
                $( ".button-contact" ).removeAttr('disabled');
            }
        }
    });

 })
// //Display Modal with user/product information
// $("#infoBtn").on("click", displayInfo);
// async function displayInfo(){ 
//  var myModal = new bootstrap.Modal(document.getElementById('productModal'));
//  myModal.show();

//   let url = `/api/getproductPage?productId=<%=product[0].productId%>`;
//   let response = await fetch(url);
//   let data = await response.json();
//   //button info
//   $("#productInfo").html(`<h6> Name: ${data[0].firstName} ${data[0].lastName} </h6> <h6>Phone: ${data[0].userPhone}</h6> <h6>Email: ${data[0].userEmail}</h6>`);
// }