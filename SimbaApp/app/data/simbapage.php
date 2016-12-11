<?php
$_SERVER['REMOTE_ADDR'] = 'localhost';
$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
chdir($documentRoot);
include_once "./includes/bootstrap.inc";

drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
require_once('simbaapp.inc');
global $user;

$controller = $_POST['controller'];
$typename = $_POST['typename'];
$control_id = $_POST['control_id'];
$filters = $_POST['filters'];
$filtersStr = $_POST['filters'];
$pagecid = $_POST['pagecid'];
$reportid = $_POST['reportid'];
$promptfilters = $_POST['promptfilters'];
$drillthroughfilters = $_POST['drillthroughfilters'];

if($user->uid != 0){
	if(strtolower($typename) == 'page'){
		if($controller === 'obiee10g' && $typename && $control_id ){
			simbaapp_obiee10gPageSimba($controller,$typename,$control_id,$filtersStr);
		} else if ($controller === 'sql' && $typename && $control_id ){
			simbaapp_sqlPageSimba($controller,$typename,$control_id,$filtersStr);
		} else if ($controller === 'file' && $typename && $control_id ){
			$sql = "SELECT filepath, simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
			$result = db_query($sql);
			while ($record = db_fetch_object($result)) {
				$simbaxmlRaw = $record->simbaxml;
				$filepath = $record->filepath;
			}
			$page = array();
			$simbaxml = new DOMDocument();
			$simbaxml -> loadXML($simbaxmlRaw);
			$page['filepath'] = $filepath;
			$page['simbaxmlRaw'] = $simbaxmlRaw;
			foreach($simbaxml -> getElementsByTagName('img') as $img){
				$imgInfo = array();
				$imgInfo['caption'] = $img->getAttribute('caption');
				$filename = $img->getAttribute('fileName');
				$imgInfo['filepath'] = $filepath."/".$filename;
				$imgfile = getcwd().$imgInfo['filepath'];
				if (file_exists($imgfile)){
					$imgbinary = fread(fopen($imgfile, "r"), filesize($imgfile));
					$imgInfo['imgdata'] = 'data:image/jpg;base64,' . base64_encode($imgbinary);
				} else {
					$imgInfo['imgdata'] = getcwd();
				}
				
				$page['imgs'][] = $imgInfo;
			}
			echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		} else {
			echo '{"success": false, "errorMessage": '.json_encode('The controller is not defined.')."}";
		}
	} else if (strtolower($typename) == 'report'){
		if($controller === 'obiee10g' ){
			simbaapp_obiee10gReportSimba($controller,$typename,$pagecid,$reportid,$promptfilters,$drillthroughfilters);
		} else if ($controller === 'sql'){
			simbaapp_sqlReportSimba($controller,$typename,$pagecid,$reportid,$promptfilters,$drillthroughfilters);
		} else {
			echo '{"success": false, "errorMessage": '.json_encode('The controller is not defined.')."}";
		}
	}
} else {
	echo '{"success": false, "errorMessage": '.json_encode('The loged in account was invalid. Please re-login.').',"errorCode":'.json_encode('InvalidAccount')."}";
} 