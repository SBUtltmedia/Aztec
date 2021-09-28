<?php
require("spreadsheet.php");
require("group.php");
$group = new Group();
$line= $group->group+1;
$spreadsheet=new Spreadsheet("1TSv87oLukKBAgcEEto0HXrgsGmTbb3MAD6hUATlaGek");
$values=$spreadsheet->updateRange("Game States!C$line",[[$_POST['val']]]);
print_r($_POST);
