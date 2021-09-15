<?php

require __DIR__ . '/vendor/autoload.php';
class Spreadsheet{


	public function __construct($sheetId)
	{

		$this->sheetId=$sheetId;
		$this->service=$this->getService();
	}



	public function getService(){

		$client = new \Google_Client();

		$client->setApplicationName('Google Sheets and PHP');

		$client->setScopes([\Google_Service_Sheets::SPREADSHEETS]);

		$client->setAccessType('offline');

		$client->setAuthConfig(__DIR__ . '/credentials.json');

		return new Google_Service_Sheets($client);
	}
	// 1jyaBTo3epk45RvWj5o22ILE12Byxby64XlPY89A49QM

	public function getRange($range){



		$response = $this->service->spreadsheets_values->get($this->sheetId, $range);

		$values = $response->getValues();

		return $this->csv($values);
	}
	public function updateRange($range,$data){
		$body = new Google_Service_Sheets_ValueRange([

				'values' => $data

		]);

		$params = [

			'valueInputOption' => 'RAW'

		];

		$update_sheet = $this->service->spreadsheets_values->update($this->sheetId, $range, $body, $params);


	}


	public function csv($data) {
		$fh = fopen('php://temp', 'rw'); # don't create a file, attempt
			foreach ( $data as $row ) {
				fputcsv($fh, $row);
			}
		rewind($fh);
		$csv = stream_get_contents($fh);
		fclose($fh);

		return $csv;
	}

}
