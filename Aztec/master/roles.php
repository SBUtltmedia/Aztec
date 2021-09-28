<?php
require "spreadsheet.php";
require "group.php";
require "util.php";
$util = new Util();

$spreadsheet = new Spreadsheet("1TSv87oLukKBAgcEEto0HXrgsGmTbb3MAD6hUATlaGek");
$values      = $spreadsheet->getRange("Roles!A1:C1000");
$array       = $util->csvToAssociative($values);

$groupRoles = array_filter($array, function ($item) {
 $group = new Group();

 return $item["Group"] == $group->group;});


print_r($util->str_putcsv($groupRoles));
