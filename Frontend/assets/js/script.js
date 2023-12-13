// Click event for Search
document.getElementById('searchButton').addEventListener('click', function() {
    var searchValue = document.getElementById('searchInput').value;
    var body = {};
    var params = {q : searchValue};
    var additionalParams = {
        headers: {
            'Content-Type':"application/json"
        }
    };
    // Get this function from the generated apigClient.js 
    sdk.searchGet(params, body , additionalParams).then(function(result)
    {
        console.log(result);
        rdata  = result.data
        length_of_response = rdata.length;

        if(length_of_response == 0)
        {
          alert("Try with another keyword, no images found.")
        }
        

        var galleryWrapper = document.getElementById('finalview');
        rdata.forEach( function(obj) {
            // Format for img.src "data:image/" "png" ";base64," "copy-paste-Base64-data-here"
            var requestOptions = {
                method: 'GET',
                redirect: 'follow'
              };
              
            // fetch("https://bucket2photos.s3.amazonaws.com/" + obj.objectKey, requestOptions)
            // .then(response => response.text())
            // .then(result => 
            //     {
            //         // res = result.replace('\"','')
            //         var imageDiv = document.createElement('div');
            //         var image = document.createElement('img');

            //         mime_type = obj.objectKey.split('.')[1];
            //         var blob = base64ToBlob(result, 'image/'+mime_type); // Change MIME type if necessary
            //         var blobUrl = URL.createObjectURL(blob);
                    
            //         image.src = blobUrl;
            //         image.className = 'gallery__img';
            //         image.alt = 'Image_' + obj;
            //         imageDiv.appendChild(image);
            //         galleryWrapper.appendChild(imageDiv);
            //     })
            // .catch(error => console.log('error', error));
            mime_type = obj.objectKey.split('.')[1]
            fetch("https://bucket2photos.s3.amazonaws.com/"+ obj.objectKey, requestOptions)
            .then(result=>result.text())
            .then(response => {
                console.log(response);
                res = response.replace('\"','');
                res = res.slice(0,-1);
                var imageDiv = document.createElement('div');
                var image = document.createElement('img');
                image.src = "data:image/" + mime_type + ";base64," + res;
                console.log(image.src);
                image.className = 'gallery__img';
                image.alt = 'Image_' + obj.objectKey;
                imageDiv.appendChild(image);
                galleryWrapper.appendChild(imageDiv);

            })
            
        });
    })    
});

// Click event for Upload
document.getElementById('uploadButton').addEventListener('click', function() {
    var searchValue = document.getElementById('searchInput').value;
    var img_file = document.getElementById('uploadInput').files[0];
    var mlabels = searchValue;

    // Binary payload
    // const reader = new FileReader();

    // reader.onload = () => {
    //     console.log(reader.result);
    //     var request_body = reader.result;
    //     var params = {
    //         "object" : img_file.name,
    //         "bucket" : "bucket2photos",
    //         "Content-Type" : img_file.type,
    //         "x-amz-meta-customlabels": mlabels
    //     };
    //     console.log(params)
    //     var additionalParams = {};
   
    //     sdk.uploadObjectPut(params, request_body , additionalParams).then(function(res){
    //       if (res.status == 200)
    //       {  
    //         imgSuccess();
    //       }
    //       else{
    //        imgFail();
    //       }
    //     })
    // };

    // reader.readAsBinaryString(img_file);

    // Base64 payload
    var base64_image = convertImgBase64(img_file).then(
        promise_data => {
    
        var request_body = promise_data;
        var params = {
            "object" : img_file.name,
            "bucket" : "bucket2photos",
            "Content-Type" : img_file.type + ";base64",
            "x-amz-meta-customlabels": mlabels
        };
        
        console.log(params)
    
        var additionalParams = {};
   
        sdk.uploadObjectPut(params, request_body , additionalParams).then(function(res){
          if (res.status == 200)
          {  
            imgSuccess();
          }
          else{
           imgFail();
          }
        })
      });
});

function convertImgBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result.replace(/^data:(.*;base64,)?/, '');
      if ((encoded.length % 4) > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert Base64 string to a Blob
function base64ToBlob(base64, mimeType) {
    var byteCharacters = atob(base64);
    var byteArrays = [];
  
    for (var offset = 0; offset < byteCharacters.length; offset += 512) {
      var slice = byteCharacters.slice(offset, offset + 512);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: mimeType});
}

function imgSuccess() {
  alert("Image Uploaded Successfully");
}

function imgFail() {
  alert("Image Not Uploaded. Try Again!");
}


