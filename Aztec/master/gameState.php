<?php
require("spreadsheet.php");
require("group.php");
$group = new Group();

 
$spreadsheet=new Spreadsheet("1TSv87oLukKBAgcEEto0HXrgsGmTbb3MAD6hUATlaGek");
$values=$spreadsheet->getRange("Game States!A1:5000");
$lines= preg_split('/\n/',$values);
print_r($lines[0]."\n".$lines[$group->group]);
