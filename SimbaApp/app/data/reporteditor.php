<?php
$_SERVER['REMOTE_ADDR'] = 'localhost';
$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
chdir($documentRoot);
include_once "./includes/bootstrap.inc";

drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
// require_once('simbaapp.inc');
global $user;

$controller = $_POST['controller'];
$simbapageid = $_POST['simbapageid'];
$pagecid = $_POST['pagecid'];
$reportcid = $_POST['reportcid'];
$promptfilters = $_POST['promptfilters'];
$editorinfo = $_POST['editorinfo'];

if($user->uid != 0){
	echo '{"success": true, "reportsimba": '.json_encode($_POST).',"editorinfo":'.json_encode($editorinfo)."}";
} else {
	echo '{"success": false, "errorMessage": '.json_encode('The loged in account was invalid. Please re-login.').',"errorCode":'.json_encode('InvalidAccount')."}";
}
