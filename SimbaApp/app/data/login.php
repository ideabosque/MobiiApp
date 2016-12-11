<?php

$postVars = $_POST;

if(!$postVars['username'] || !$postVars['password']){
	echo '{"success":false, "errorMessage":'.json_encode('User Name and Password are required!').'}';
} else {
	$_SERVER['REMOTE_ADDR'] = 'localhost';
	$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
	chdir($documentRoot);
	include_once "./includes/bootstrap.inc";
	drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
	
	$uid = db_result(db_query("SELECT uid FROM {users} WHERE name = '%s'", $postVars['username']));
	if($uid){
		user_external_login_register($postVars['username'], 'user');
		user_authenticate_finalize(&$edit);
		if($user){
			$query = db_query("SELECT uid FROM {users} WHERE name LIKE '%s' AND pass LIKE '%s' AND status =1", $postVars['username'], md5($postVars['password']));
			$uid = db_result($query);
			if($uid){
				$private_key = drupal_get_private_key();
				$ptoken =  md5($postVars['password'] . $private_key);
				$result = db_result(db_query("SELECT token FROM utoken WHERE uname = '%s'",$user->name));
				if(!$result){
					db_query("INSERT INTO utoken (uname, token) VALUES ('%s', '%s')",$user->name, $ptoken);
				} else if($ptoken !== $result){
					db_query("UPDATE utoken SET token = '%s' WHERE uname = '%s'", $ptoken,$user->name);
				}
				// echo '{"success":true, "msg":'.json_encode('You are login successfully').',"ptoken":'.json_encode($ptoken).',"result":'.json_encode($result).'}';
				echo '{"success":true, "msg":'.json_encode('You are login successfully').',"ptoken":'.json_encode($ptoken).'}';
			} else {
				echo '{"success":false, "errorMessage":'.json_encode('User Name or Password is not correct!').'}';
			}
		} else {
			echo '{"success":false, "errorMessage":'.json_encode('User Name or Password is not correct!').'}';
		}
	} else {
		echo '{"success":false, "errorMessage":'.json_encode('User does not exist!').'}';
	}
}
