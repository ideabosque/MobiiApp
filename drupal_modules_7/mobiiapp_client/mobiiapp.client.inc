<?php
require_once('mobiiapp.client.obiee10g.inc');
require_once('mobiiapp.client.xdata.inc');

function mobiiapp_client_login(){
	global $user;
	$username = strtolower($_POST['username']);
	$password = $_POST['password'];
	if($username == 'demo'){
		$password = 'M0b11App!@#';
	}
	if(!$username || !$password){
		echo '{"success":false, "errorMessage":'.json_encode('User Name and Password are required!').'}';
		return ;
	} else {
		$uid_query = 'SELECT count(u.uid) FROM {users} u WHERE u.name = :name';
		$uid_count = db_query($uid_query, array(':name' => $username))->fetchField();
		if($uid_count != 0){
			if($user->uid == 0 || strtolower($user->name) != $username){
				mobiiapp_client_login_register($username, 'mobiiapp_client');
			}
			$uid = user_authenticate($username, $password);
			if($user->uid == $uid){
				$existInUnit = db_query('SELECT count(u.uid) FROM {mobiiapp_units_users} u WHERE u.uid = :uid', array(':uid' => $uid))->fetchField();
				if($existInUnit == 0 && ! is_super_admin_mobiiapp($user->roles)){
					// $protocol = strpos(strtolower($_SERVER['SERVER_PROTOCOL']),'https') === FALSE ? 'http' : 'https';
					// $protocol = 'http';
					// if(isset($_SERVER['HTTPS']) && $_SERVER["HTTPS"] == "on"){
						// $protocol = 'https';
					// }
					// $host = $_SERVER['HTTP_HOST'];
					// $href = $protocol.'://'.$host.'/mobiiapp/security/user_register_unit';
					// $msg = 'You do not yet belong to any group!<br>Please request to <a style="color: limeGreen;" target="_blank" href="'.$href.'">join a group or create a group</a>.';
					// echo '{"success":false, "errorMessage":'.json_encode($msg).'}';
					$msg = 'You do not belong to any group. You can join a exited unit or create a group.';
					$output = array(
						'success' => false,
						'errorMessage' => $msg,
						'errorCode' => 'NoGroup'
					);
					echo json_encode($output);
					return;
				}
				$private_key = drupal_get_private_key();
				$ptoken =  md5($username.$password.$private_key);
				$token = db_query('SELECT token FROM mobiiapp_client_utoken WHERE name = :name', array(':name' => $user->name))->fetchField();
				if(!$token){
					$insert = db_insert('mobiiapp_client_utoken')
						->fields(array(
							'name' => $user->name,
							'token' => $ptoken,
						))
						->execute();
				} else if($token != $ptoken){
					$update = db_update('mobiiapp_client_utoken')
						->fields(array(
							'token' => $ptoken
						))
						->condition('name', $user->name, '=')
						->execute();
				}
				$userperm = mobiiapp_client_getUserPerm();
				echo '{"success":true, "msg":'.json_encode('You are login successfully').',"userperm":'.json_encode($userperm).',"ptoken":'.json_encode($ptoken).'}';
				return ;
			} else {
				echo '{"success":false, "errorMessage":'.json_encode('User Name or Password is not correct!').'}';
				return ;
			}
		} else {
			echo '{"success":false, "errorMessage":'.json_encode('User does not exist!').'}';
			return ;
		}
	}
}

function mobiiapp_client_signup(){
	global $user;
	$username = strtolower($_POST['username']);
	$email = $_POST['email'];
	if(!$username || !$email){
		echo '{"success":false, "errorMessage":'.json_encode('User Name and Email Address are required!').'}';
		return ;
		$output = array(
			'success' => false,
			'errorMessage' => 'User Name and Email Address are required!'
		);
		echo json_encode($output);
		return ;
	} else {
		$name_query = 'SELECT count(u.uid) FROM {users} u WHERE u.name = :name';
		$name_count = db_query($name_query, array(':name' => $username))->fetchField();
		$email_query = 'SELECT count(u.uid) FROM {users} u WHERE u.mail = :mail';
		$email_count = db_query($email_query, array(':mail' => $email))->fetchField();
		if($name_count != 0){
			$output = array(
				'success' => false,
				'errorMessage' => 'The name '.$username.' is already taken.'
			);
			echo json_encode($output);
			return ;
		} else if($email_count != 0) {
			$output = array(
				'success' => false,
				'errorMessage' => 'The name '.$email.' is already taken.'
			);
			echo json_encode($output);
			return ;
		} else {
			// mobiiapp_client_login_register($username, 'mobiiapp_client', $email, 0);
			$userinfo = array(
				'name' => $username, 
				'mail' => $email,
				'pass' => user_password(), 
				'init' => $email, 
				'status' => 1, 
				'access' => REQUEST_TIME,
			);
			$account = new stdClass();
			$account->is_new = True;
			$account = user_save($account, $userinfo);
			if (!$account) {
				$output = array(
					'success' => false,
					'errorMessage' => 'Error while sign up.'
				);
				echo json_encode($output);
				return ;
			} else {
				// $op = 'register_pending_approval';
				$op = 'register_no_approval_required';
				_user_mail_notify($op, $account);
				// $msg = 'Thank you for applying for an account. Your account is currently pending approval by the site administrator.In the meantime, a welcome message with further instructions has been sent to your e-mail address.';
				$msg = 'Thank you for applying for an account. A welcome message with further instructions has been sent to your e-mail address.';
				$output = array(
					'success' => true,
					'account' => $account,
					'msg' => $msg
				);
				echo json_encode($output);
				return ;
			}
		}
	}
}


function mobiiapp_client_joingroup(){
	global $user;
	$action = $_POST['action'];
	$unit_name = $_POST['groupname'];
	$description = $_POST['groupdesc'];
	
	if($action == 'create'){
		$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name';
		$existed = db_query($query, array(':unit_name' => $unit_name))->fetchField();
		if ($existed != 0) {
			form_set_error('unit_name', t('The group name has existed already.'));
			$output = array(
				'success' => false,
				'errorMessage' => 'The group name has existed already.'
			);
			echo json_encode($output);
			return ;
		} else {
			$unit_id = db_insert('mobiiapp_unit')
				->fields(array(
					'unit_name' => $unit_name, 
					'description' => $description))
				->execute();
			
			db_insert('mobiiapp_units_users')
				->fields(array(
					'unit_id' => $unit_id, 
					'uid' => $user->uid))
				->execute();
			
			$roles = get_roles_by_unit_name($unit_name);
			user_save($user, array('roles' => $roles), 'account');
			$output = array(
				'success' => true,
				'roles' => $roles,
				'user' => $user,
				'msg' => $unit_name. ' has been added successfully. Please publish your data from web admin console '.$_SERVER['HTTP_HOST'].'.'
			);
			echo json_encode($output);
			return ;
		}
	} else {
		$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name';
		$existed = db_query($query, array(':unit_name' => $unit_name))->fetchField();
		if ($existed == 0) {
			$output = array(
				'success' => false,
				'errorMessage' => 'The group is not existed.  Please check with the administrator of the group.'
			);
			echo json_encode($output);
			return ;
		} else {
			$_unit = get_unit(null, $unit_name);
			$unit_id = $_unit['unit_id'];
			mobiiapp_security_user_register_unit_broadcast($user, $unit_id);
			$output = array(
				'success' => true,
				'msg' => 'The join request for group ('.$unit_name.') has been broadcasted to the administrators.'
			);
			echo json_encode($output);
			return ;
		}
	}
	
	
}

function mobiiapp_client_logout(){
	global $user;
	watchdog('user', 'Session closed for %name.', array('%name' => $user->name));
	module_invoke_all('user_logout', $user);
	// Destroy the current session, and reset $user to the anonymous user.
	session_destroy();
	echo '{"success":true, "msg":'.json_encode('You are logout successfully!').'}';
	return;
}

function mobiiapp_client_validate(){
	global $user;
	$username = strtolower($_POST['username']);
	$password = $_POST['password'];
	if(!$username || !$password){
		echo '{"success":false, "errorMessage":'.json_encode('User Name and Password are required!').'}';
		return ;
	} else {
		$uid_count = db_query('SELECT count(u.uid) FROM {users} u WHERE u.name = :name', array(':name' => $username))->fetchField();
		if($uid_count != 0){
			if($user->uid == 0 || $username != $user->name){
				mobiiapp_client_login_register($username, 'mobiiapp_client');
			}
			$existInUnit = db_query('SELECT count(u.uid) FROM {mobiiapp_units_users} u WHERE u.uid = :uid', array(':uid' => $user->uid))->fetchField();
			if($existInUnit == 0 && ! is_super_admin_mobiiapp($user->roles)){
				$output = array(
					'success' => false,
					'errorMessage' => 'You do not belong to any group. You can join a exited unit or create a group.',
					'errorCode' => 'NoGroup'
				);
				echo json_encode($output);
				return ;
			}
			$token = db_query('SELECT token FROM mobiiapp_client_utoken WHERE name = :name', array(':name' => $username))->fetchField();
			if($token == $password){
				$userperm = mobiiapp_client_getUserPerm();
				echo '{"success":true, "msg":'.json_encode('your token is right,You are login successfully').',"userperm":'.json_encode($userperm).'}';
				return;
			} else {
				echo '{"success":false, "errorMessage":'.json_encode("Saved Password is not correct. Please re-login.").'}';
				return;
			}
		} else {
			$deleted = db_delete('mobiiapp_client_utoken')->condition('name', $username, '=')->execute();
			echo '{"success":false, "errorMessage":'.json_encode("Saved User Name does not exist. Please re-login.").'}';
			return ;
		}
	}
}

function mobiiapp_client_user_is_validate(){
	global $user;
	if($user->uid != 0) return true;
	$username = (isset($_POST['username'])) ? strtolower($_POST['username']) : strtolower($_GET['username']);
	$password = (isset($_POST['password'])) ? $_POST['password'] : $_GET['password'];
	if(isset($_POST['oldpassword'])) $password = $_POST['oldpassword'];
	if(!$username || ($username != 'demo' && !$password)){
		$output = array(
			'success' => false,
			'errorMessage' => 'Your login is invalid, please re-login!'
		);
		echo json_encode($output);
		exit();
	} else {
		$uid_count = db_query('SELECT count(u.uid) FROM {users} u WHERE u.name = :name', array(':name' => $username))->fetchField();
		if($uid_count != 0){
			if($user->uid == 0 || $username != $user->name){
				mobiiapp_client_login_register($username, 'mobiiapp_client');
			}
			$token = db_query('SELECT token FROM mobiiapp_client_utoken WHERE name = :name', array(':name' => $username))->fetchField();
			if($token == $password || $username == 'demo'){
				return true;
			} else {
				$output = array(
					'success' => false,
					'errorMessage' => 'Your login is invalid, please re-login!'
				);
				echo json_encode($output);
				exit();
			}
		} else {
			$output = array(
				'success' => false,
				'errorMessage' => 'Your login is invalid, please re-login!'
			);
			echo json_encode($output);
			exit();
		}
	}
}

function mobiiapp_client_passwordreset (){
	global $user;
	mobiiapp_client_user_is_validate();
	$username = strtolower($_POST['username']);
	$oldpassword = $_POST['oldpassword'];
	$newpassword = $_POST['newpassword'];
	if(!$username || !$oldpassword || !$newpassword){
		echo '{"success":false, "errorMessage":'.json_encode('Username, Old Password and New Password are required!').'}';
	} else {
		if($username != $user->name){
			echo '{"success":false, "errorMessage":'.json_encode('You are not authorized to modify this user"s password!').'}';
		} else {
			$uid = user_authenticate($username, $oldpassword);
			if($uid){
				require_once DRUPAL_ROOT . '/' . variable_get('password_inc', 'includes/password.inc');
				$pass = user_hash_password($newpassword);
				$update = db_update('users')->fields(array('pass' => $pass))->condition('uid', $uid, '=')->execute();
				$private_key = drupal_get_private_key();
				$ptoken =  md5($username.$newpassword.$private_key);
				$token = db_query('SELECT token FROM mobiiapp_client_utoken WHERE name = :name', array(':name' => $username))->fetchField();
				if(!$token){
					$insert = db_insert('mobiiapp_client_utoken')
						->fields(array(
							'name' => $username,
							'token' => $ptoken,
						))
						->execute();
				} else if($token != $ptoken){
					$update = db_update('mobiiapp_client_utoken')
						->fields(array(
							'token' => $ptoken
						))
						->condition('name', $username, '=')
						->execute();
				}
				echo '{"success":true, "msg":'.json_encode('You are login successfully').',"ptoken":'.json_encode($ptoken).'}';
				return;
			} else {
				echo '{"success":false, "errorMessage":'.json_encode('User Name or Old password is not correct!').'}';
				return;
			}
		}
	}
}

function mobiiapp_client_loadmenu(){
	global $user;
	mobiiapp_client_user_is_validate();
	if($user->uid !=0 ){
		$output = mobiiapp_client_getChildren(0, 0);
	} else {
		$output = array();
	}
	$tmpArray = array(
		'items' => $output,
		// 'user' => $user
	);
	echo json_encode($tmpArray);
	// echo '{"items":'.json_encode($output).'}';
	return;
}

function mobiiapp_client_load_comments() {
	global $user;
	mobiiapp_client_user_is_validate();
	$comments = array();
	$catalog_id = $_GET['catalog_id'];
	if($user->uid != 0){
		if($catalog_id){
			$result = db_query(
				"SELECT 
					id, 
					catalog_id, 
					name, 
					comment, 
					FROM_UNIXTIME(timestamp, '%Y-%m-%d %H:%i:%s') time,
					image
				FROM 
					mobiiapp_catalog_comment 
				WHERE 
					timestamp > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND
					catalog_id= :catalog_id 
				ORDER BY timestamp",
				array(':catalog_id' => $catalog_id)
			);
			foreach ($result as $record) {
				$comment = $record->comment;
				$comment = str_replace("\n","<br>",$comment);
				$comment = str_replace("\r","<br>",$comment);
				$comment = str_replace("\r\n","<br>",$comment);
				$record->comment = $comment;
				$comments[] = $record;
			}
			echo '{"comments":'.json_encode($comments).',"POST":'.json_encode($_GET).'}';
		} else {
			echo '{"comments":'.json_encode($comments).',"POST":'.json_encode($_GET).'}';
		}
	} else {
		echo '{"comments":'.json_encode($comments).',"POST":'.json_encode($_GET).'}';
	}
}


function mobiiapp_client_submit_comment() {
	global $user;
	mobiiapp_client_user_is_validate();
	$catalog_id = $_POST['catalog_id'];
	$comment = $_POST['comment'];
	if($user->uid != 0){
		if(isset($_POST['image']) && $_POST['image'] != ''){
			if($_FILES["file"]){
				if ($_FILES["file"]["error"] == 0){
					$targetFile = '/var/www/html/sites/default/files/comment_images/'. $_POST['image'];
					move_uploaded_file($_FILES["file"]["tmp_name"],$targetFile);
				}
			}
		}
		$recs = db_query(
			"select 
				id 
			from 
				mobiiapp_catalog 
			where 
				cid in (
					select 
						cid 
					from 
						mobiiapp_catalog
					where 
						id = :catalog_id
				)",
			array(":catalog_id" => $catalog_id)
		);
		foreach($recs as $rec){
			$insert = db_insert('mobiiapp_catalog_comment')
			->fields(array(
				// 'catalog_id' => $catalog_id,
				'catalog_id' => $rec->id,
				'uid' => $user->uid,
				'name' => $user->name,
				'comment' => $comment,
				'timestamp' => time(),
				'image' => isset($_POST['image']) ? $_POST['image'] : null
			))
			->execute();
			$image = isset($_POST['image']) ? $_POST['image'] : null;
			mobiiapp_catalog_comments_broadcast($user, $catalog_id, $comment,$image);
		}
		
		// if($insert){
			
			$result = db_query(
				"SELECT 
					id, 
					catalog_id, 
					name, 
					comment, 
					FROM_UNIXTIME(timestamp, '%Y-%m-%d %H:%i:%s') time,
					image
				FROM 
					mobiiapp_catalog_comment 
				WHERE 
					timestamp > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND
					catalog_id= :catalog_id 
				ORDER BY timestamp",
				array(':catalog_id' => $catalog_id)
			);
			$comments = array();
			foreach ($result as $record) {
				$comment = $record->comment;
				$comment = str_replace("\n","<br>",$comment);
				$comment = str_replace("\r","<br>",$comment);
				$comment = str_replace("\r\n","<br>",$comment);
				$record->comment = $comment;
				$comments[] = $record;
			}
			echo '{"success": true,"comments":'.json_encode($comments).',"Insert":'.json_encode($insert).'}';
		// } else {
			// echo '{"success": false,"errorMessage":'.json_encode('Error while save the comment').'}';
		// }
	} else {
		echo '{"success": false,"errorMessage":'.json_encode('Your login session is expired. Please re-login.').'}';
	}
}

function mobiiapp_client_load_tickets(){
	global $user;
	mobiiapp_client_user_is_validate();
	$tickets = array();
	if($user->uid != 0){
		$result = db_query(
			"SELECT 
				msi.id, 
				msi.status, 
				msi.subject, 
				msi.detail, 
				msi.solution,
				msi.comments,
				msi.history,
				ua.name assign_to,
				FROM_UNIXTIME(msi.created_date, '%Y-%m-%d %H:%i:%s') created_date,
				uc.name created_by,
				FROM_UNIXTIME(msi.updated_date, '%Y-%m-%d %H:%i:%s') updated_date,
				uu.name updated_by
			FROM 
				mobiiapp_support_info msi
			LEFT JOIN 
				users ua
			ON
				ua.uid = msi.assign_to
			LEFT JOIN 
				users uc
			ON 
				uc.uid = msi.created_by
			LEFT JOIN 
				users uu
			ON 
				uu.uid = msi.updated_by
			WHERE 
				msi.created_by = :created_by
			ORDER BY created_date",
			array(':created_by' => $user->uid)
		);
		foreach ($result as $record) {
			$solution = $record->solution;
			$solution = str_replace("<br>","\n",$solution);
			$record->solution = $solution;
			$comments = $record->comments;
			$comments = str_replace("<br>","\n",$comments);
			$record->comments = $comments;
			$history = $record->history;
			$history = str_replace("<br>","\n",$history);
			$record->history = $history;
			$tickets[] = $record;
		}
		echo '{"tickets":'.json_encode($tickets).',"POST":'.json_encode($_GET).'}';
	} else {
		echo '{"tickets":'.json_encode($tickets).',"POST":'.json_encode($_GET).'}';
	}
	

}

function mobiiapp_client_submit_ticket(){
	global $user;
	mobiiapp_client_user_is_validate();
	if($user->uid != 0){
		$tickets = array();
		$subject = $_POST['subject'];
		$detail = $_POST['detail'];
		$history = 'The subject '.$subject. ' was created by '.$user->name.' at  ' .date('Y-m-d H:i:s').'<br>';
		$insert = db_insert('mobiiapp_support_info')
			->fields(array(
				'subject' => $subject,
				'status' => 'New',
				'detail' => $detail,
				'created_date' => time(),
				'created_by' => $user->uid,
				'updated_date' => time(),
				'updated_by' => $user->uid,
				'history' => $history			
				))
			->execute();
		if($insert){
			$module = 'mobiiapp_support';
			$key = 'create';
			$language = language_default();
			$send = true;
			$params = array();
			$params['subject'] = $form_state['values']['subject'];
			$params['message'] = 'The subject (' . $subject.') was created by ' .$user->name;
			$from = $user->mail;
			$super_user_mails = get_super_user_mails();
			$to = implode(', ', $super_user_mails);
			
			drupal_mail($module, $key, $to, $language, $params, $from, $send);
			$result = db_query(
				"SELECT 
					msi.id, 
					msi.status, 
					msi.subject, 
					msi.detail, 
					msi.solution,
					msi.comments,
					msi.history,
					ua.name assign_to,
					FROM_UNIXTIME(msi.created_date, '%Y-%m-%d %H:%i:%s') created_date,
					uc.name created_by,
					FROM_UNIXTIME(msi.updated_date, '%Y-%m-%d %H:%i:%s') updated_date,
					uu.name updated_by
				FROM 
					mobiiapp_support_info msi
				LEFT JOIN 
					users ua
				ON
					ua.uid = msi.assign_to
				LEFT JOIN 
					users uc
				ON 
					uc.uid = msi.created_by
				LEFT JOIN 
					users uu
				ON 
					uu.uid = msi.updated_by
				WHERE 
					msi.created_by = :created_by
				ORDER BY created_date",
				array(':created_by' => $user->uid)
			);
			foreach ($result as $record) {
				$solution = $record->solution;
				$solution = str_replace("<br>","\n",$solution);
				$record->solution = $solution;
				$comments = $record->comments;
				$comments = str_replace("<br>","\n",$comments);
				$record->comments = $comments;
				$history = $record->history;
				$history = str_replace("<br>","\n",$history);
				$record->history = $history;
				$tickets[] = $record;
			}
			echo '{"success": true,"tickets":'.json_encode($tickets).',"Insert":'.json_encode($insert).'}';
		} else {
			echo '{"success": false,"errorMessage":'.json_encode('Error while save the ticket').'}';
		}
	} else {
		echo '{"success": false,"errorMessage":'.json_encode('Your login session is expired. Please re-login.').'}';
	}
}

function mobiiapp_client_submit_ticketcomment(){
	global $user;
	mobiiapp_client_user_is_validate();
	if($user->uid != 0){
		$ticket = array();
		$id = $_POST['id'];
		$comment = $_POST['comment'];
		$module = 'mobiiapp_support';
		$key = 'comment';
		$language = language_default();
		$send = true;
		
		$support = db_query('SELECT ms.subject,
									ms.status,
									ms.comments,
									ms.history,
									ms.created_by,
									ms.assign_to
								FROM {mobiiapp_support_info} ms
								WHERE ms.id = :id', 
								array(':id' => $id))->fetchAssoc();
			
		
		$history =  $support['history'].  '<br>' .'Comment posted by   '. $user->name . '  at  '.date('Y-m-d H:i:s');
		$comments = $support['comments'] . '<br>' .  $comment . '<br>'. 'By '.$user->name.'   at   '.date('Y-m-d H:i:s');
	
		$update = db_update('mobiiapp_support_info')
		->fields(array(
		    'comments' => $comments,
			'history' => $history,
			'updated_by' => $user->uid,
			'updated_date' => time()))
		->condition('id', $id)
		->execute();
	
		
		if($update){
			$params = array();
			$params['subject'] = $support['subject'];
			$params['message'] = $comment. "\n". 'The ticket (' . $support['subject'].') was commented by ' .$user->name;
			$from = $user->mail;
			if($support['status'] != 'New'){
				if($support['created_by'] != $user->uid){
					$creator = user_load($support['created_by']);
					$to = $creator->mail;
					drupal_mail($module, $key, $to, $language, $params, $from, $send);
				}
				if($support['assign_to'] != $user->uid){
					$assignee = user_load($support['assign_to']);
					$to =  $assignee->mail;
					drupal_mail($module, $key, $to, $language, $params, $from, $send);
				}
			} else{
				$super_user_mails = get_super_user_mails();
				$to = implode(', ', $super_user_mails);
				drupal_mail($module, $key, $to, $language, $params, $from, $send);
			}
			$ticket = db_query(
				"SELECT 
					msi.id, 
					msi.status, 
					msi.subject, 
					msi.detail, 
					msi.solution,
					msi.comments,
					msi.history,
					ua.name assign_to,
					FROM_UNIXTIME(msi.created_date, '%Y-%m-%d %H:%i:%s') created_date,
					uc.name created_by,
					FROM_UNIXTIME(msi.updated_date, '%Y-%m-%d %H:%i:%s') updated_date,
					uu.name updated_by
				FROM 
					mobiiapp_support_info msi
				LEFT JOIN 
					users ua
				ON
					ua.uid = msi.assign_to
				LEFT JOIN 
					users uc
				ON 
					uc.uid = msi.created_by
				LEFT JOIN 
					users uu
				ON 
					uu.uid = msi.updated_by
				WHERE 
					msi.id = :id 					
				ORDER BY created_date",
				array(':id' => $id)
			)->fetchObject();
			$solution = $ticket->solution;
			$solution = str_replace("<br>","\n",$solution);
			$ticket->solution = $solution;
			$comments = $ticket->comments;
			$comments = str_replace("<br>","\n",$comments);
			$ticket->comments = $comments;
			$history = $ticket->history;
			$history = str_replace("<br>","\n",$history);
			$ticket->history = $history;
			echo '{"success": true,"ticket":'.json_encode($ticket).',"Update":'.json_encode($update).'}';
		} else {
			echo '{"success": false,"errorMessage":'.json_encode('Error while comment the ticket').'}';
		}
	} else {
		echo '{"success": false,"errorMessage":'.json_encode('Your login session is expired. Please re-login.').'}';
	}
}

function mobiiapp_client_loaddata(){
	global $user;
	mobiiapp_client_user_is_validate();
	$controller = $_POST['controller'];
	$typename = $_POST['typename'];
	$control_id = $_POST['control_id'];
	$filters = $_POST['filters'];
	$filtersStr = $_POST['filters'];
	$pagecid = $_POST['pagecid'];
	$reportid = $_POST['reportid'];
	$promptfilters = $_POST['promptfilters'];
	$drillthroughfilters = $_POST['drillthroughfilters'];
	$reporteditorinfo = $_POST['reporteditorinfo'];
	$editoption = $_POST['editoption'];
	
	if($user->uid != 0){
		if(strtolower($typename) == 'page'){
			if($controller === 'obiee10g' && $typename && $control_id ){
				mobiiapp_client_obiee10g_getPageSimba($control_id,$filtersStr);
			} else if ($controller === 'xdata' && $typename && $control_id ){
				mobiiapp_client_xdata_getPageSimba($control_id,$filtersStr);
			} else if ($controller === 'file' && $typename && $control_id ){
				mobiiapp_client_file_getPageSimba($controller,$typename,$control_id,$filtersStr);
			} else {
				echo '{"success": false, "errorMessage": '.json_encode('The controller is not defined.')."}";
			}
		} else if (strtolower($typename) == 'report'){
			if($controller === 'obiee10g' ){
				mobiiapp_client_obiee10g_getReportSimba($pagecid,$reportid,$promptfilters,$drillthroughfilters);
			} else if ($controller === 'xdata'){
				if($reporteditorinfo){
					$simbaxmlRaw = mobiiapp_client_xdata_updateReportSimbaxml($reportid,$reporteditorinfo,$editoption);
					// echo '{"success": true, "updatedSmibaxmlRaw": '.json_encode($simbaxmlRaw)."}";
					// return;
				}
				mobiiapp_client_xdata_getReportSimba($pagecid,$reportid,$promptfilters,$drillthroughfilters,$simbaxmlRaw);
			} else {
				echo '{"success": false, "errorMessage": '.json_encode('The controller is not defined.')."}";
			}
		}
	} else {
		echo '{"success": false, "errorMessage": '.json_encode('The loged in account was invalid. Please re-login.').',"errorCode":'.json_encode('InvalidAccount')."}";
	}

}

function mobiiapp_client_load_units(){
	$units = array();
	$result = db_query(
		"SELECT 
			unit_id id, 
			unit_name name
		FROM 
			mobiiapp_unit 
		ORDER BY unit_id"
	);
	foreach ($result as $record) {
		$units[] = $record;
	}
	echo '{"success": true,"units":'.json_encode($units).'}';
}

function mobiiapp_client_login_register($name, $module, $mail='', $status= 1) {
	$uid = db_query("SELECT uid FROM {users} WHERE name = :name", array(':name' => $name))->fetchField();
	if($uid){
		$account = user_load($uid);
	} else {
		$account = false;
	}
	if (!$account) {
		$userinfo = array(
			'name' => $name, 
			'mail' => $mail,
			'pass' => user_password(), 
			'init' => $name, 
			'status' => $status, 
			'access' => REQUEST_TIME,
		);
		$account = user_save(drupal_anonymous_user(), $userinfo);
		if (!$account) {
			drupal_set_message(t("Error saving user account."), 'error');
			return;
		}
		user_set_authmaps($account, array("authname_$module" => $name));
	}
	$form_state['uid'] = $account->uid;
	user_login_submit(array(), $form_state);
}

function mobiiapp_client_hasRole($rids,$unit_id){
	global $user;
	$hasRole = false;
	if($user->uid == 1) return true;
	if($user->uid == 0){
		$hasRole = false;
	} else {
		$userRoles = $user->roles;
		$user_unit_id = db_query('SELECT unit_id FROM mobiiapp_units_users WHERE uid = :uid',array(':uid' => $user->uid))->fetchField();
		foreach($userRoles as $rid => $rname){
			if(strtolower($rname) == 'mobiiapp admin') return true;
			if(strtolower($rname) == 'super admin mobiiapp') return true;
		}
		if($rids == '0' || $rids == '' || empty($rids)){
			$hasRole = ($unit_id == $user_unit_id) ? true : false;
		} else {
			foreach($rids as $rid){
				if($userRoles[$rid] && $unit_id == $user_unit_id) {
					$hasRole = true;
					break;
				}
			}
		}
	}
	return $hasRole;
}

function mobiiapp_client_getUserPerm(){
	global $user;
	if($user->uid == 0) return 'anonymous user';
	if(is_super_admin_mobiiapp($user->roles)) return 'super admin mobiiapp';
	if(is_admin_mobiiapp($user->roles)) return 'admin mobiiapp';
	if(is_design_mobiiapp($user->roles)) return 'design mobiiapp';
	return 'authenticated user';
}

function mobiiapp_client_getUnitIdByUser($user){
	$result = db_query('select unit_id from mobiiapp_units_users where uid = :uid', array(':uid'=>$user->uid))->fetchField();
	return $result;
}

function mobiiapp_client_getChildren($parent_id, $level){
	global $user;
	// $unit_id = $_GET['unit_id'];
	$unit_id = (isset($_GET['unit_id'])) ? $_GET['unit_id'] : mobiiapp_client_getUnitIdByUser($user);
	$unit_id = ($unit_id == '0') ? "%" : $unit_id;
    $items = array();
	$editable = is_design_mobiiapp($user->roles);
    $result = db_query(
		'SELECT 
			id, 
			name, 
			parent_id, 
			cid, 
			adaptor, 
			type,
			unit_id
		FROM 
			mobiiapp_catalog 
		WHERE 
			status = 1 AND 
			parent_id= :parent_id AND 
			unit_id LIKE :unit_id
		ORDER BY weight',
		array(':parent_id' => $parent_id, ':unit_id' => $unit_id)
	);
	$i = 0;
	foreach ($result as $record) {
		$role_query = 'SELECT r.rid FROM mobiiapp_catalog l, mobiiapp_catalog_role r WHERE l.id = r.catalog_id and l.id= :id';
		$roleResult = db_query($role_query,array(':id' => $record->id));
		$rids = array();
		foreach ($roleResult as $roleRecord) {
			$rids[] = $roleRecord->rid;
		}
		$unit_id = $record->unit_id;
		$hasRole = mobiiapp_client_hasRole($rids,$unit_id);
		if($hasRole){
			$items[$i]['rids'] = $rids;
			$items[$i]['label'] = $record->name;
			$items[$i]['id'] = $record->id;
			$items[$i]['control_id'] = $record->cid;
			$items[$i]['controller'] = $record->adaptor;
			$items[$i]['type'] = $record->type;
			$subitems = mobiiapp_client_getChildren($record->id, $level+1);
			if(empty($subitems) && $items[$i]['type'] != 'folder'){
				$items[$i]['leaf'] = true;
				$items[$i]['editable'] = ($record->adaptor == 'xdata') ? $editable : false;
			} else {
				$items[$i]['items'] = $subitems;
			} 
			$i ++;
		}
	}  
    return $items;
}

function mobiiapp_client_file_getPageSimba($controller,$typename,$control_id,$filtersStr){
	$sql = "SELECT filepath, simbaxml FROM ".$controller."_adaptor_page WHERE typename = :typename AND cid = :cid";
	$record = db_query($query, array('typename' => $typename, ':cid' => $cid))->fetchField();
	$simbaxmlRaw = $record->simbaxml;
	$filepath = $record->filepath;
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
}

function mobiiapp_client_promptsInfoManager($filtersStr,$prompts){
	$srcPromptsSet = class_exists(contentService_srcPromptsSet) ? new contentService_srcPromptsSet() : new srcPromptsSet();
	$srcPromptsSet->prompts = $prompts;
    $srcPromptsSet->filters = $filtersStr;
	global $content_client;
    $result = $content_client->get_prompts_info($srcPromptsSet);
    return json_decode($result,true);
}

function mobiiapp_client_reportInfoManager($controller,$simbaxmlRaw,$requestxml=null){
	$srcReportSet = class_exists(contentService_srcReportSet) ? new contentService_srcReportSet() : new srcReportSet();
	$srcReportSet->controller = $controller;
    $srcReportSet->simbaxmlRaw = $simbaxmlRaw;
	$srcReportSet->requestxmlRaw = $requestxml;
	$srcReportSet->filterxmls = null;
	$srcReportSet->variables = null;
	global $content_client;
    $result = $content_client->get_report_info($srcReportSet);
    return json_decode($result,true);
}

function mobiiapp_client_dataConvertorManager($controller,$requestxmlRaw,$simbaxmlRaw,$viewName,$viewType,$dataxmlRaw){
	$srcDataset = class_exists(dataService_srcDataset) ? new dataService_srcDataset() : new srcDataset();
	$srcDataset->appName = $controller;
	$srcDataset->requestxmlRaw = $requestxmlRaw;
	$srcDataset->simbaxmlRaw = $simbaxmlRaw;
	$srcDataset->viewName = $viewName;
	$srcDataset->viewType = $viewType;
	$srcDataset->dataxmlRaw = $dataxmlRaw;
	global $data_client;
	$result = $data_client->convert_data($srcDataset);
	return json_decode($result,true);
}