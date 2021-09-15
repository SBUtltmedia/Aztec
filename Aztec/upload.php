<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Test file upload.</title>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    </head>
    <body>
        <form method="post" enctype="multipart/form-data" action="upload.php">
    
            <input type="file" name="fileToUpload" id="fileToUpload" >
            <button type="submit" name="submit" class="btn btn-primary">Upload</button>
        </form>
        <!--
        If you want to upload single file, use this input form
        <input type="file" name="filename">
        -->
    </body>
</html>



<?php
//$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);

if(isset($_POST["submit"])) {
    print_r($_FILES);
    if (strpos(basename($_FILES["fileToUpload"]["name"]),".mp3") )
  
{
    print "audio";
$fileName="audio/".$_FILES["fileToUpload"]["name"];
print $fileName;
}
else if (strpos(basename($_FILES["fileToUpload"]["name"]),".png") )
{
    $fileName="images/".$_FILES["fileToUpload"]["name"];
}
else if (strpos(basename($_FILES["fileToUpload"]["name"]),".html") )
{
    $fileName="Aztec.html";

}

$target_file = "/home/tltsecure/apache2/htdocs/userData/Aztec/$fileName";
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
        echo "The file ". htmlspecialchars( basename( $_FILES["fileToUpload"]["name"])). " has been uploaded.";
      }
      else {
          echo "/home/tltsecure/apache2/htdocs/userData/Aztec/$fileName";
        echo "Not uploaded because of error #".$_FILES["fileToUpload"]["error"];

      }
}
?>
