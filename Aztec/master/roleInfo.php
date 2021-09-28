<?php
require "spreadsheet.php";
require "group.php";
require "util.php";
$util = new Util();

$spreadsheet = new Spreadsheet("1TSv87oLukKBAgcEEto0HXrgsGmTbb3MAD6hUATlaGek");
$values      = $spreadsheet->getRange("Role Info!A1:D122");
print($values);