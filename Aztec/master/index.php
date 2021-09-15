<?php
if(!key_exists('email',$_POST)){
print(file_get_contents("login/index.php"));  

}
else{
 
print(file_get_contents("../../userData/Aztec/Aztec.html"));
echo <<<EOT
<script>
var email="${_POST['email']}";
window.getEmail=function(){
return "${_POST['email']}";
}
</script>

EOT;

}
?>
