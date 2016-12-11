<?php

function is_xdata_interface_empty($interface_id) {
	$interface_query = 'SELECT count(c.id) 
					FROM {xdata_adaptor_dataset} c 
					WHERE c.interface_id = :interface_id';
	$interface_count = db_query($interface_query, array(':interface_id' => $interface_id))->fetchField();
	
	$empty = ($interface_count == 0)? true: false;
	
	return $empty;
}


function count_xdata_interface_by_unit_id($unit_id) {
	$interface_query = 'SELECT count(s.id) FROM {xdata_adaptor_interface} s WHERE s.unit_id = :unit_id';
	$interface_count = db_query($interface_query, array(':unit_id' => $unit_id))->fetchField();
	
	return $interface_count;
}


function connection_check_mysql($connection_string, $username, $password, $database) {	
	$link = mysql_connect($connection_string, $username, $password);
	if (!$link) {
		return "MySQL Connect Error: ". mysql_error();
	}
	else {
		if (!mysql_select_db($database, $link)) {
			return "MySQL Select DB Error: ". mysql_error();
		}
		else {
			mysql_close($link);
			return 'success';
		}
	}
}


function connection_check_oracle($connection_string, $username, $password) {
	$link = oci_connect($username, $password, $connection_string);
	if (!$link) {
		$e = oci_error();
		return "Oracle Connect Error: ". $e['message'];
	}
	else {
		oci_close($link);
		return 'success';
	}
}


function connection_check_mssql($connection_string, $username, $password, $database) {
	$link = mssql_connect($connection_string, $username, $password);
	if (!$link) {
		return "MSSQL Connect Error: Could not connect to the server!";
	}
	else {
		if (!mssql_select_db($database, $link)) {
			mssql_close($link);
			return "MSSQL Select DB Error: Could not select a database.";
		}
		else {
			mssql_close($link);
			return 'success';
		}
	}
}


function connection_check_ssh($connection_string, $username, $password) {
	$con = explode(":", $connection_string);
	$connection = ssh2_connect($con[0], $con[1]);	
	if (ssh2_auth_password($connection, $username, $password)) {
		return 'success';
	}
	else {
		return 'Authentication Failed...';		
	}
}


function xdata_interface_form($form, &$form_state) {
    global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}

	$header = array(
		'name' => array('field' => 'eai.name', 'data' => t('Name')),
		'type' => array('field' => 'eai.type', 'data' => t('Type')),
		'connection_string' => array('field' => 'eai.connection_string', 'data' => t('Connection String')),
	);
	if ($is_super_admin) {
		$header['unit_name'] = array('data' => t('Group'));
	}
	$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	

	$select = db_select('xdata_adaptor_interface', 'eai')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('eai');
	if (!$is_super_admin) {
		$select = $select->condition('unit_id', $unit_id, '=');
	}
	$select = $select->orderByHeader($header);
	$result = $select->execute();

	$disableds = array();
	$options = array();
	foreach ($result as $row) {
		$entry = serialize(array('id' => $row->id));
		$query = array('query' => array('entry' => $entry));
		
		$edit = l(t('edit'), 'xdata_adaptor/interface/edit/', $query);
		
		$options[$row->id] = array(
			'name' => array('data' => $row->name),
			'type' => array('data' => $row->type),
			'connection_string' => array('data' => $row->connection_string),
			'operations' => array('data' => $edit),			
		);
		
		$_unit = get_unit($row->unit_id);
		$unit_name = $_unit['unit_name'];
	
		if ($is_super_admin) {			
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['type']['width'] = '10%';
			$options[$row->id]['connection_string']['width'] = '40%';
			$options[$row->id]['unit_name'] = array('data' => $unit_name, 'width' => '20%');
			$options[$row->id]['operations']['width'] = '10%';
		}
		else {
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['type']['width'] = '10%';
			$options[$row->id]['connection_string']['width'] = '60%';
			$options[$row->id]['operations']['width'] = '10%';
		}
		
		if (!is_xdata_interface_empty($row->id)) {
			$disableds[] = $row->id;
		}
	}
         
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
		'#prefix' => '<div class="container-inline">',
	);

	$add = l(t('Add Interface'), 'xdata_adaptor/interface/add');		
	$form['add'] = array(
		'#type' => 'item',
		'#title' => "<b>$add</b>",
		'#suffix' => '</div>',
	);
	$form['xdata_interface_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	foreach ($disableds as $id) {
		$form['xdata_interface_table'][$id]['#disabled'] = true;
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function xdata_interface_form_validate($form, &$form_state) {
	$selected_count = count(array_filter($form_state['values']['xdata_interface_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please select the items to delete.'));
	}        
}


function xdata_interface_form_submit($form, &$form_state){
	$ids = array();
	foreach (array_filter($form_state['values']['xdata_interface_table']) as $id => $value){		       
		$ids[] = $id;;  	   
	} 
	drupal_goto('xdata_adaptor/interface/delete', array('query' => array('ids' => serialize($ids))));     
}


function xdata_interface_add($form, &$form_state){
    global $user;	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);	
	
	$form['add'] = array(
		'#title' => t('Interface Settings'),
		'#type' => 'fieldset',
	);
	$form['add']['name'] = array(
		'#title' => t('Connection Name'),
		'#type' => 'textfield',
		'#required' => TRUE,
	);
	$form['add']['type'] = array(
		'#title' => t('Type'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(array(t('ssh'), t('dropbox'), t('mysql'), t('oracle'), t('mssql'))),
		'#required' => TRUE,
	);	
	$form['add']['connection_string'] = array(
		'#title' => t('Connection String'),
		'#description' => "ssh/mysql/mssql <b>server:port</b></br>oracle <b>server:port/sid</b>",
		'#type' => 'textfield',
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['add']['username'] = array(
		'#title' => t('Username'),
		'#type' => 'textfield',
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['add']['passwd'] = array(
		'#title' => t('Password'),
		'#type' => 'password',
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['add']['conf-passwd'] = array(
		'#title' => t('Confirm password'),
		'#type' => 'password',
		'#description' => t('Provide a password for the new account in both fields.'),
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['add']['mysql_database'] = array(
		'#title' => t('Database'),
		'#type' => 'textfield',
		'#states' => array(
			'visible' => array( 
				':input[name="type"]' => array('value' => t('mysql')),
			),
		),	
	);
	$form['add']['mssql_database'] = array(
		'#title' => t('Database'),
		'#type' => 'textfield',
		'#states' => array(
			'visible' => array( 
				':input[name="type"]' => array('value' => t('mssql')),
			),
		),	
	);	
	
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
		
		$form['add']['unit'] = array(
			'#type' => 'value',
			'#value' => $unit_id,			
		);
	}
	else {	
		$units = get_units();
		
		if (count($units) == 0) {
			drupal_goto('mobiiapp/unit/add');
		}
		
		$selected = isset($form_state['values']['unit'])? $form_state['values']['unit']: key($units);
		
		$form['add']['unit'] = array(
			'#title' => t('Group'),
			'#type' => 'select',
			'#options' => $units,
			'#default_value' => $selected,			
		);
	}
	
	$form['submit'] = array(
		'#value' => t('Add Interface'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/interface');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	return $form;
}


function xdata_interface_add_validate($form, &$form_state) {
	$name = $form_state['values']['name'];
	$connection_string = $form_state['values']['connection_string'];
	$type = $form_state['values']['type'];
	$username = $form_state['values']['username'];
	$pwd = $form_state['values']['passwd'];
	$conf_pwd = $form_state['values']['conf-passwd'];
	$unit_id = $form_state['values']['unit'];
	
	$query = 'SELECT count(s.name) FROM {xdata_adaptor_interface} s WHERE name = :name AND unit_id = :unit_id';
	$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
	if ($name_existed != 0) {
		form_set_error('name', t('The connection name has been existed already.'));
	}
	if($pwd != $conf_pwd) {
		form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
	}
	
	switch ($type) {
			case 'ssh':
				$connect = connection_check_ssh($connection_string, $username, $pwd);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			// case 'dropbox':
				// break;
			case 'mysql':
				$database = $form_state['values']['mysql_database'];
				$connect = connection_check_mysql($connection_string, $username, $pwd, $database);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			case 'oracle':
				$connect = connection_check_oracle($connection_string, $username, $pwd);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			case 'mssql':
				$database = $form_state['values']['mssql_database'];
				$connect = connection_check_mssql($connection_string, $username, $pwd, $database);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
	}
}


function xdata_interface_add_submit($form, &$form_state) {   
	$fields = array();
	$fields['name'] = $name = $form_state['values']['name'];
	$fields['type'] = $form_state['values']['type'];
	$fields['unit_id'] = $form_state['values']['unit'];
	
	switch ($fields['type']) {
		case 'ssh':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);
			break;
		case 'dropbox':
			$fields['connection_string'] = 'www.dropbox.com';
			break;
		case 'oracle':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);
			break;
		case 'mysql':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['default_database'] = $form_state['values']['mysql_database'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);	
			break;
		case 'mssql':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['default_database'] = $form_state['values']['mssql_database'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);	
			break;
	}
	
	$id = db_insert('xdata_adaptor_interface')
			->fields($fields)
			->execute();
	
	if ($fields['type'] == 'dropbox') {
		$entry = serialize(array('id' => $id));
		$query = array('query' => array('entry' => $entry));
		drupal_goto('xdata_adaptor/interface/add_dropbox', $query);	
	}
	else {
		$form_state['redirect'] = 'xdata_adaptor/interface'; 
	}
}


function xdata_interface_add_dropbox() {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	global $xdata_key;
	global $xdata_secret;
	$protocol = (!empty($_SERVER['HTTPS'])) ? 'https' : 'http';
	$callback = $protocol . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
	try {
		$encrypter = new \Dropbox\OAuth\Storage\Encrypter('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
		$storage = new \Dropbox\OAuth\Storage\Session($encrypter);
		$OAuth = new \Dropbox\OAuth\Consumer\Curl($xdata_key, $xdata_secret, $storage, $callback);
		$access_token = serialize($storage->get('access_token'));
		
		// foreach ($_SESSION['dropbox_api'] as $key => $value) {
			// drupal_set_message($key.": ". serialize($value));
		// }
		
		$update = db_update('xdata_adaptor_interface')
			->fields(array('access_token' => $access_token))
			->condition('id', $id)
			->execute();
		
		unset($_SESSION['dropbox_api']);		
	}
	catch(\Dropbox\Exception $e) {
		$error_msg = $e->getMessage(). '<br/>'. 'Setup failed! Please try running setup again.';
		form_set_error('', $error_msg);
	}
	drupal_goto('xdata_adaptor/interface'); 
}


function xdata_interface_edit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$interface = db_query('SELECT s.name,
								s.type,
								s.connection_string,
								s.default_database,
								s.username,
								s.passwd,
								s.unit_id
							FROM {xdata_adaptor_interface} s 
							WHERE s.id = :id', 
							array(':id' => $id))->fetchAssoc();
	
	$form['edit'] = array(
		'#title' => t('Interface Settings'),
		'#type' => 'fieldset',
	);
	$form['edit']['name'] = array(
		'#title' => t('Connection Name'),
		'#type' => 'textfield',
		'#default_value' => $interface['name'],
		'#required' => TRUE,
	);
	$form['edit']['type'] = array(
		'#title' => t('Type'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(array(t('ssh'), t('dropbox'), t('mysql'), t('oracle'), t('mssql'))),
		'#default_value' => $interface['type'],
		'#required' => TRUE,
	);
	$form['edit']['connection_string'] = array(
		'#title' => t('Connection String'),
		'#description' => "ssh/mysql/mssql <b>server:port</b></br>oracle <b>server:port/sid</b>",
		'#type' => 'textfield',
		'#default_value' => $interface['connection_string'],
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['edit']['username'] = array(
		'#title' => t('Username'),
		'#type' => 'textfield',
		'#default_value' => $interface['username'],
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['edit']['passwd'] = array(
		'#title' => t('Password'),
		'#type' => 'password',
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['edit']['conf-passwd'] = array(
		'#title' => t('Confirm password'),
		'#type' => 'password',
		'#description' => t('Provide a password for the new account in both fields.'),
		'#states' => array(
			'invisible' => array(
				':input[name="type"]' => array('value' => t('dropbox')),
			),
		),
	);
	$form['edit']['mysql_database'] = array(
		'#title' => t('Database'),
		'#type' => 'textfield',
		'#default_value' => $interface['default_database'],
		'#states' => array(
			'visible' => array( 
				':input[name="type"]' => array('value' => t('mysql')),
			),
		),	
	);
	$form['edit']['mssql_database'] = array(
		'#title' => t('Database'),
		'#type' => 'textfield',
		'#default_value' => $interface['default_database'],
		'#states' => array(
			'visible' => array( 
				':input[name="type"]' => array('value' => t('mssql')),
			),
		),	
	);	
	$form['edit']['unit'] = array(
		'#type' => 'value',
		'#value' => $interface['unit_id'],
	);
	
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/interface');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


function xdata_interface_edit_validate($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];

	$name = $form_state['values']['name'];
	$connection_string = $form_state['values']['connection_string'];
	$type = $form_state['values']['type'];
	$username = $form_state['values']['username'];
	$pwd = $form_state['values']['passwd'];
	$conf_pwd = $form_state['values']['conf-passwd'];
	$unit_id = $form_state['values']['unit'];
	
	if ($form_state['values']['op'] == t('Save')) {
		$connection = db_query('SELECT s.name
								FROM {xdata_adaptor_interface} s 
								WHERE s.id = :id', 
								array(':id' => $id))->fetchAssoc();
		
		if ($name != $connection['name']) {
			$query = 'SELECT count(s.name) FROM {xdata_adaptor_interface} s WHERE name = :name AND unit_id = :unit_id';
			$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
			if ($name_existed != 0) {
				form_set_error('name', t('The connection name has been existed already.'));
			}
		}
		
		if($pwd != $conf_pwd) {
			form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
		}
		
		switch ($type) {
			case 'ssh':
				$connect = connection_check_ssh($connection_string, $username, $pwd);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			case 'dropbox':
				break;
			case 'mysql':
				$database = $form_state['values']['mysql_database'];
				$connect = connection_check_mysql($connection_string, $username, $pwd, $database);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			case 'oracle':
				$connect = connection_check_oracle($connection_string, $username, $pwd);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
			case 'mssql':
				$database = $form_state['values']['mssql_database'];
				$connect = connection_check_mssql($connection_string, $username, $pwd, $database);
				if ($connect != 'success') {
					form_set_error('', $connect);		
				}
				break;
		}
	}
}


function xdata_interface_edit_submit($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	$fields = array();
	$fields['name'] = $name = $form_state['values']['name'];
	$fields['type'] = $form_state['values']['type'];
	
	switch ($fields['type']) {
		case 'ssh':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);
			break;
		case 'dropbox':
			$fields['connection_string'] = 'www.dropbox.com';
			break;
		case 'oracle':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);
			break;
		case 'mysql':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['default_database'] = $form_state['values']['mysql_database'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);	
			break;
		case 'mssql':
			$fields['connection_string'] = $form_state['values']['connection_string'];
			$fields['default_database'] = $form_state['values']['mssql_database'];
			$fields['username'] = $form_state['values']['username'];
			$fields['passwd'] = base64_encode($form_state['values']['passwd']);	
			break;
	}
	
	$update = db_update('xdata_adaptor_interface')
		->fields($fields)
		->condition('id', $id)
		->execute();
	
	if ($fields['type'] == 'dropbox') {
		$entry = serialize(array('id' => $id));
		$query = array('query' => array('entry' => $entry));
		drupal_goto('xdata_adaptor/interface/add_dropbox', $query);	
	}
	else {
		$form_state['redirect'] = 'xdata_adaptor/interface'; 
	}
}


function xdata_interface_delete_confirm($form, &$form_state){
	$form['#submit'][] = 'xdata_interface_delete_confirm_submit';
	
	$output = confirm_form($form,
		t('Are you sure you want to delete these items?'),
		'xdata_adaptor/interface',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
	
	return $output; 
}


function xdata_interface_delete_confirm_submit($form, &$form_state) {
	$ids = unserialize($_GET['ids']);
	
	db_delete('xdata_adaptor_interface')
		->condition('id', $ids, 'IN')
		->execute();
	
	drupal_set_message(t('These interfaces have been successfully deleted.'));
	
	$form_state['redirect'] = 'xdata_adaptor/interface';       
}





