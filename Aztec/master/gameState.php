<?php
require("spreadsheet.php");
require("group.php");
$group = new Group();

 
$spreadsheet=new Spreadsheet("1vkRW7B33edqK_tlkcMFeVsaZowG_7PnjAwBkb2LN9n8");
$values=$spreadsheet->getRange("Game States!A1:5000");
$lines= preg_split('/\n/',$values);
print_r($lines[0]."\n".$lines[$group->group]);
