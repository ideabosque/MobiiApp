<?php

$postVars = $_POST;

if(!$postVars['username'] || !$postVars['oldpassword'] || !$postVars['newpassword']){
	echo '{"success":false, "errorMessage":'.json_encode('Username, Old Password and New Password are required!').'}';
} else {
	$_SERVER['REMOTE_ADDR'] = 'localhost';
	$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
	chdir($documentRoot);
	include_once "./includes/bootstrap.inc";
	drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
	
	global $user;
	
	if($user->name !== $postVars['username']){
		echo '{"success":false, "errorMessage":'.json_encode('You are not authorized to modify this user"s password!').'}';
	} else {
		$query = db_query("SELECT uid FROM {users} WHERE name LIKE '%s' AND pass LIKE '%s' AND status =1", $postVars['username'], md5($postVars['oldpassword']));
		$uid = db_result($query);
		if($uid){
			db_query("UPDATE {users} SET pass = '%s' WHERE uid = '%d'", md5($postVars['newpassword']),$uid);
			$private_key = drupal_get_private_key();
			$ptoken =  md5($postVars['newpassword'] . $private_key);
			$result = db_result(db_query("SELECT token FROM utoken WHERE uname = '%s'",$user->name));
			if(!$result){
				db_query("INSERT INTO utoken (uname, token) VALUES ('%s', '%s')",$user->name, $ptoken);
			} else if($ptoken !== $result){
				db_query("UPDATE utoken SET token = '%s' WHERE uname = '%s'", $ptoken,$user->name);
			}
			echo '{"success":true, "msg":'.json_encode('You are login successfully').',"ptoken":'.json_encode($ptoken).',"result":'.json_encode($result).'}';
		} else {
			echo '{"success":false, "errorMessage":'.json_encode('User Name or Old password is not correct!').'}';
		}
	}
}
