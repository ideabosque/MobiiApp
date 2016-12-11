<?php

$postVars = $_POST;

if(!$postVars['username'] || !$postVars['password']){
	echo '{"success":false, "errorMessage":'.json_encode('User Name and Password are required!').'}';
} else {
	// if($_SESSION){
		$_SERVER['REMOTE_ADDR'] = 'localhost';
		$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
		chdir($documentRoot);
		include_once "./includes/bootstrap.inc";
		drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
		global $user;
		
		$uid = db_result(db_query("SELECT uid FROM {users} WHERE name = '%s'", $postVars['username']));
		
		if($uid){
			if ($user->name != $postVars['username']){
				user_external_login_register($postVars['username'], 'user');
				user_authenticate_finalize(&$edit);
				// echo '{"success":false, "errorMessage":'.json_encode('Session Expired. Please re-login.').',"user":'.json_encode($user).'}';
			} 
			$password = db_result(db_query("SELECT token FROM {utoken} WHERE uname = '%s'", $postVars['username']));
			if($password == $postVars['password']){
				echo '{"success":true, "msg":'.json_encode('your token is right,You are login successfully').'}';
			} else {
				echo '{"success":false, "errorMessage":'.json_encode("Saved Password is not correct. Please re-login.").'}';
			}
		} else {
			db_result(db_query("DELETE FROM {utoken} WHERE uname = '%s'", $postVars['username']));
			echo '{"success":false, "errorMessage":'.json_encode("Saved User Name does not exist. Please re-login.").'}';
		}
	// } else {
		// echo '{"success":false, "errorMessage":'.json_encode("Session is expired!").',"errorCode":'.json_encode('404').'}';
	// }
}
