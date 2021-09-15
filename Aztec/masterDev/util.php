<?php
class Util
{

    public function str_putcsv($data)
    {
        # Generate CSV data from array
        $fh = fopen('php://temp', 'rw'); # don't create a file, attempt
        # to use memory instead

        # write out the headers
        fputcsv($fh, array_keys(current($data)));

        # write out the data
        foreach ($data as $row) {
            fputcsv($fh, $row);
        }
        rewind($fh);
        $csv = stream_get_contents($fh);
        fclose($fh);

        return $csv;
    }
    public function csvToAssociative($values)
    {
        function _combine_array(&$row, $key, $header)
        {
            $row = array_combine($header, $row);
        }
        $array = array_map('str_getcsv', str_getcsv($values, "\n"));

        $header = array_shift($array);

        array_walk($array, '_combine_array', $header);

        return $array;
    }

    public function numberToColumnName($number)
    {
        $abc     = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        $abc_len = strlen($abc);
        $result  = "";
        $tmp     = $number;
        while ($number > $abc_len) {$remainder = $number % $abc_len;
            $result                               = $abc[$remainder - 1] . $result;
            $number                               = floor($number / $abc_len);}
        return $abc[$number - 1];
    }

}
