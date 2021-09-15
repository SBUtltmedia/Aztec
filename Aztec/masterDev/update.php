<?php
require("spreadsheet.php");
require("group.php");
$group = new Group();
$line= $group->group+1;
$spreadsheet=new Spreadsheet("1vkRW7B33edqK_tlkcMFeVsaZowG_7PnjAwBkb2LN9n8");
$values=$spreadsheet->updateRange("Game States!C$line",[[$_POST['val']]]);
print_r($_POST);
