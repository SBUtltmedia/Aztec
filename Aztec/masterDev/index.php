<?php

if(preg_match('/Dev/' ,$_SERVER['REQUEST_URI'],$matches)){
$html="AztecDev";
}
else 
{
$html="Aztec";
}
print(file_get_contents("../../userData/Aztec/$html.html"));
echo <<<EOT
<script>
var email="${_POST['email']}";
window.getEmail=function(){
return "${_POST['email']}";
}
</script>
EOT;

?>
