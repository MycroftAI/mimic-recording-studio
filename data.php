<?php

$cnt = 23320;	// Number of lines in the prompts.txt file.  Could calculate, but that'd be slower.

if (isset($_GET['phraseNo']))
{
	# Getting phrases to speak...
	$phraseNo = $_GET['phraseNo'];   # 1-based index
	if ($phraseNo < 1 || $phraseNo > $cnt) {
		http_response_code ( 416 );
		return;
	}

	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");

	$file = new SplFileObject("prompts.txt");
	if (!$file->eof()) {
		 $file->seek($phraseNo-1);
		 $line = $file->current(); // $contents would hold the data from line x
		 // Line = hash<TAB>style<TAB>prompt
		 $parts = explode("\t", $line);
	}

	$response = [];
	$response['total'] = $cnt;
	$response['hash'] = $parts[0];
	$response['style'] = $parts[1];
	$response['phrase'] = trim($parts[2]);
	
	echo json_encode($response);
}
else
{
	# Assume this is a PUT of WAV blob data

	# Get the username and phraseNo from the cookie data
	$username = $_POST["user"];
	$phraseNo = $_POST["phraseNo"];

	if ($phraseNo < 1 || $phraseNo > $cnt) {
		http_response_code ( 416 );
		return;
	}

	$files = incoming_files();
	
	if (count($files) == 1 && $files[0]['error'] == 0 && $files[0]['size'] > 0) {
		saveWAV($username, $phraseNo, $files[0]['tmp_name']);
	}
	else {
		http_response_code ( 500 );
	}
}


function saveWAV($username, $phraseNo, $tmpfile)
{
	$file = new SplFileObject("prompts.txt");
	if (!$file->eof()) {
		 $file->seek($phraseNo-1);
		 $line = $file->current(); // $contents would hold the data from line x

		 // Line = hash<TAB>style<TAB>prompt
		 $parts = explode("\t", $line);
	}
	$hash= $parts[0];
	$phrase = trim($parts[2]);

	$userpath = "voices/". $username;
	if (!file_exists($userpath)) {
		mkdir($userpath, 0777, true);
	}

	// Save as:
	//    username/username-hash-time.info   - contains the text version
	//    username/username-hash-time.wav    - contains the recording
	$filename = $userpath . "/" . $username . "-" . $hash . "-" .time();

	move_uploaded_file($tmpfile, $filename.".zip");

/*	$zip = new ZipArchive();
	if ($zip->open($tmpfile) === true) {
		// copy("zip://".$path."#".$filename, "/your/new/destination/".$fileinfo['basename']);

		// Extract to recording.wav and rename appropriately
		$zip->extractTo($userpath, array('recording.wav'));
		$zip->close();
		rename($userpath."/recording.wav", $filename)
		file_put_contents($filename . ".info", $phrase);
	} */
}

function incoming_files() {
    $files = $_FILES;
    $files2 = [];
    foreach ($files as $input => $infoArr) {
        $filesByInput = [];
        foreach ($infoArr as $key => $valueArr) {
            if (is_array($valueArr)) { // file input "multiple"
                foreach($valueArr as $i=>$value) {
                    $filesByInput[$i][$key] = $value;
                }
            }
            else { // -> string, normal file input
                $filesByInput[] = $infoArr;
                break;
            }
        }
        $files2 = array_merge($files2,$filesByInput);
    }
    $files3 = [];
    foreach($files2 as $file) { // let's filter empty & errors
        if (!$file['error']) $files3[] = $file;
    }
    return $files3;
}

?>