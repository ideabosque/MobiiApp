<?php
function is_11ginterface_empty($interface_id) {
	$interface_query = 'SELECT count(c.cid) 
					FROM {obiee11g_adaptor_page} c 
					WHERE c.interface_id = :interface_id';
	$interface_count = db_query($interface_query, array(':interface_id' => $interface_id))->fetchField();
	
	$empty = ($interface_count == 0)? true: false;
	
	return $empty;	
}


function count_obiee11g_interface_by_unit_id($unit_id) {
	$interface_query = 'SELECT count(c.id) FROM {obiee11g_adaptor_interface} c WHERE c.unit_id = :unit_id';
	$interface_count = db_query($interface_query, array(':unit_id' => $unit_id))->fetchField();
	
	return $interface_count;
}


function obiee11g_interface_connection_check_server($url, $username, $password) {
	try{
		$obiee11gClient = new SoapClient($url);
	} catch (SoapFault $fault) {
		return "Connection Error: (Error Code: {$fault->faultcode}, Error String: {$fault->faultstring})";
	}
	$options = array(
		'name' => $username,
		'password' => $password
	);
	try{
		$session = $obiee11gClient->__call('logon',array($options));
		$session_id = $obiee11gClient->_cookies['ORA_BIPS_NQID'][0]; 
		$obiee11gClient->_cookies['ORA_BIPS_NQID'][1] = '/analytics'; 
		$obiee11gClient->__call('logoff',array($session_id));
		return 'success';
	} catch (SoapFault $fault) {
		return "Connection Error: (Error Code: {$fault->faultcode}, Error String: {$fault->faultstring})";
	}
}


function obiee11g_interface_form($form, &$form_state) {
    global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}

	$header = array(
		'name' => array('field' => 'sai.name', 'data' => t('Name')),
		'type' => array('field' => 'sai.url', 'data' => t('Url')),
	);
	if ($is_super_admin) {
		$header['unit_name'] = array('data' => t('Group'));
	}
	$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	

	$select = db_select('obiee11g_adaptor_interface', 'sai');
    $select = $select->extend('TableSort');
	$select = $select->extend('PagerDefault')->limit(20);
	$select = $select->fields('sai');
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
		
		$edit = l(t('edit'), 'obiee11g_adaptor/interface/edit/', $query);
		
		$options[$row->id] = array(
			'name' => array('data' => $row->name),
			'type' => array('data' => $row->url),
			'operations' => array('data' => $edit),			
		);
		$unit_name = db_query('SELECT m.unit_name FROM {mobiiapp_unit} m WHERE unit_id = :unit_id',array(':unit_id' => $row->unit_id))->fetchField();
	
		if ($is_super_admin) {			
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['url']['width'] = '50%';
			$options[$row->id]['unit_name'] = array('data' => $unit_name, 'width' => '20%');
			$options[$row->id]['operations']['width'] = '11%';
		}
		else {
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['url']['width'] = '70%';
			$options[$row->id]['operations']['width'] = '11%';
		}
		
		if (!is_11ginterface_empty($row->id)) {
			$disableds[] = $row->id;
		}
	}
         
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
	);
	$form['obiee11g_interface_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	foreach ($disableds as $id) {
		$form['obiee11g_interface_table'][$id]['#disabled'] = true;
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function obiee11g_interface_form_validate($form, &$form_state) {
	$selected_count = count(array_filter($form_state['values']['obiee11g_interface_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please choose the items to delete.'));
	}        
}


function obiee11g_interface_form_submit($form, &$form_state){
	$ids = array();
	foreach (array_filter($form_state['values']['obiee11g_interface_table']) as $id => $value){		       
		$ids[] = $id;;  	   
	} 
	drupal_goto('obiee11g_adaptor/interface/delete', array('query' => array('ids' => serialize($ids))));     
}


function obiee11g_interface_add(){
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
	$form['add']['url'] = array(
		'#title' => t('Url'),
		'#type' => 'textfield',
		'#required' => TRUE,
	);
	
	
	$form['add']['username'] = array(
		'#title' => t('Username'),
		'#type' => 'textfield',
		'#required' => TRUE,
	);
	$form['add']['passwd'] = array(
		'#title' => t('Password'),
		'#type' => 'password',
		'#required' => TRUE,
	);
	$form['add']['conf-passwd'] = array(
		'#title' => t('Confirm password'),
		'#type' => 'password',
		'#description' => t('Provide a password for the new account in both fields.'),	 
		'#required' => TRUE,
	);
	$re = db_query('SELECT m.unit_id, m.unit_name FROM {mobiiapp_unit} m');		
	$units = array();
	foreach($re as $row) {
		$units[$row->unit_id] = $row->unit_name;
	}
	
	if (count($units) == 0) {
		drupal_goto('mobiiapp/unit/add');
	}
	
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}
	$default_value = ($is_super_admin)? key($units): $unit_id;
			
	$selected = isset($form_state['values']['unit'])? $form_state['values']['unit']: $default_value;
	
	$form['add']['unit'] = array(
		'#title' => t('Group'),
		'#type' => 'select',
		'#options' => $units,
		'#default_value' => $selected,
		'#disabled' => !$is_super_admin,			
	);
	
	$form['submit'] = array(
		'#value' => t('Create New Interface'),
		'#type' => 'submit', 
	);
	return $form;
}


function obiee11g_interface_add_validate($form, &$form_state) {
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = $form_state['values']['passwd'];
	$conf_pwd = $form_state['values']['conf-passwd'];
	$unit_id = $form_state['values']['unit'];
	
	$query = 'SELECT count(i.name) FROM {obiee11g_adaptor_interface} i WHERE name = :name AND unit_id = :unit_id';
	$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
	if ($name_existed != 0) {
		form_set_error('name', t('The connection name has been existed already.'));
	}
	if($pwd != $conf_pwd) {
		form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
	}
	
	$connect = obiee11g_interface_connection_check_server($url, $username, $pwd);
	if($connect != 'success'){
		form_set_error('', $connect);
	}
}


function obiee11g_interface_add_submit($form, &$form_state) {   
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = base64_encode($form_state['values']['passwd']);	
	$unit_id = $form_state['values']['unit'];
	
	db_insert('obiee11g_adaptor_interface')
		->fields(array(
		    'name' => $name,
			'url' => $url,
			'username' => $username,
			'passwd' => $pwd,
			'unit_id' => $unit_id, 
			))
		->execute();
	
	$form_state['redirect'] = 'obiee11g_adaptor/interface'; 

}


function obiee11g_interface_edit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$interface = db_query('SELECT i.name,
									i.url,  
									i.username,
									i.passwd,
									i.unit_id
							FROM {obiee11g_adaptor_interface} i
							WHERE i.id = :id', 
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
	$form['edit']['url'] = array(
		'#title' => t('Url'),
		'#type' => 'textfield',
		'#default_value' => $interface['url'],
		'#required' => TRUE,
	);
	
	$form['edit']['username'] = array(
		'#title' => t('Username'),
		'#type' => 'textfield',
		'#default_value' => $interface['username'],
		'#required' => TRUE,
	);
	$form['edit']['passwd'] = array(
		'#title' => t('Password'),
		'#type' => 'password',		
	);
	$form['edit']['conf-passwd'] = array(
		'#title' => t('Confirm password'),
		'#type' => 'password',
		'#description' => t('Provide a password for the new account in both fields.'),	 	
	);
	$form['edit']['unit'] = array(
		'#type' => 'value',
		'#value' => $interface['unit_id'],
	);
	
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit', 
	);
	$form['cancel'] =array(
		'#value' => t('Cancel'),
		'#type' => 'submit', 
		'#submit' => array('obiee11g_interface_cancel'),	
	); 
	
	return $form;
}


function obiee11g_interface_edit_validate($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = $form_state['values']['passwd'];
	$conf_pwd = $form_state['values']['conf-passwd'];
	$unit_id = $form_state['values']['unit'];
	
	if ($form_state['values']['op'] == t('Save')) {
		$connection = db_query('SELECT i.name
								FROM {obiee11g_adaptor_interface} i 
								WHERE i.id = :id', 
								array(':id' => $id))->fetchAssoc();
		
		if ($name != $connection['name']) {
			$query = 'SELECT count(i.name) FROM {obiee11g_adaptor_interface} i WHERE name = :name AND unit_id = :unit_id';
			$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
			if ($name_existed != 0) {
				form_set_error('name', t('The connection name has been existed already.'));
			}
		}
		
		if($pwd != $conf_pwd) {
			form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
		}
		$connect = obiee11g_interface_connection_check_server($url, $username, $pwd);
		if($connect != 'success'){
			form_set_error('', $connect);
		}
	}
}


function obiee11g_interface_edit_submit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = base64_encode($form_state['values']['passwd']);
	
	$update = db_update('obiee11g_adaptor_interface')
		->fields(array(
			'name' => $name,
			'url' => $url,
			'username' => $username,
			'passwd' => $pwd))
		->condition('id', $id)
		->execute();
	
	$form_state['redirect'] = 'obiee11g_adaptor/interface';

}


function obiee11g_interface_cancel($form, &$form_state) {
	drupal_goto('obiee11g_adaptor/interface');

}


function obiee11g_interface_delete_confirm($form,&$form_state){
	$form['#submit'][] = 'obiee11g_interface_delete_confirm_submit';
	
	$output = confirm_form($form,
		t('Are you sure you want to delete these items?'),
		'obiee11g_adaptor/interface',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
	
	return $output; 
}


function obiee11g_interface_delete_confirm_submit($form,&$form_state){
	$ids = unserialize($_GET['ids']);
	
	db_delete('obiee11g_adaptor_interface')
		->condition('id', $ids, 'IN')
		->execute();
	
	drupal_set_message(t('These connction names has been successfully deleted.'));
	
	$form_state['redirect'] = 'obiee11g_adaptor/interface';       
 }

/**
 * Connect to OBIEE11g Servers by the different interface_id
**/
function obiee11g_interface_connect_interface($interface_id){
	$connection = db_query('SELECT i.url,
							i.username,
							i.passwd
							FROM {obiee11g_adaptor_interface} i 
							WHERE i.id = :id', 
							array(':id' => $interface_id))->fetchAssoc();
	$url = $connection['url'];
	$username = $connection['username'];
	$password = base64_decode($connection['passwd']);
	
	try {
		$obiee11gClient = new SoapClient($url);
	} catch (SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
	$options = array(
		'name' => $username,
		'password' => $password
	);
	try {
		$session = $obiee11gClient->__call('logon',array($options)); 
		$obiee11gClient->_cookies['ORA_BIPS_NQID'][1] = '/analytics'; 
		return $obiee11gClient;
	} catch (SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
}


/**
 * Disconnect to OBIEE11g Server
**/
function obiee11g_interface_disconnect_interface($obiee11gClient){
	$session_id = $obiee11gClient->_cookies['ORA_BIPS_NQID'][0]; 
	try {
		$obiee11gClient->__call('logoff',array($session_id));
		return true;
	} catch (SoapFault $fault) {
		return false;
	}
}

/**
 * Get OBIEE11g RequestXML by the path
**/
function obiee11g_interface_get_requestxml($obiee11gClient,$obiee11gPath){
	$session_id = $obiee11gClient->_cookies['ORA_BIPS_NQID'][0]; 
	$parameters = array(
	        'paths' => array($obiee11gPath),
        	'resolveLinks' => true,
	        'errorMode' => "FullDetails",
        	'returnOptions' => "ObjectAsString",
	        'sessionID' => $session_id
	);
	try {
		$result = $obiee11gClient -> __call ('readObjects', array($parameters)); 
		$requestXML = $result->catalogObject->catalogObject;
		return $requestXML; 
	} catch(SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
}
