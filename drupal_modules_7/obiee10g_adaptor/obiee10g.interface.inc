<?php
function is_10ginterface_empty($interface_id) {
	$interface_query = 'SELECT count(c.cid) 
					FROM {obiee10g_adaptor_page} c 
					WHERE c.interface_id = :interface_id';
	$interface_count = db_query($interface_query, array(':interface_id' => $interface_id))->fetchField();
	
	$empty = ($interface_count == 0)? true: false;
	
	return $empty;	
}


function count_obiee10g_interface_by_unit_id($unit_id) {
	$interface_query = 'SELECT count(c.id) FROM {obiee10g_adaptor_interface} c WHERE c.unit_id = :unit_id';
	$interface_count = db_query($interface_query, array(':unit_id' => $unit_id))->fetchField();
	
	return $interface_count;
}


function obiee10g_interface_connection_check_server($url, $username, $password) {
	try{
		$obiee10gClient = new SoapClient($url);
	} catch (SoapFault $fault) {
		return "Connection Error: (Error Code: {$fault->faultcode}, Error String: {$fault->faultstring})";
	}
	$options = array(
		'name' => $username,
		'password' => $password
	);
	try{
		$session = $obiee10gClient->__call('logon',array($options)); 
		$cookies = $obiee10gClient->_cookies;
		$session_id = $cookies["nQuireID"][0];
		$obiee10gClient->__call('logoff',array($session_id));
		return 'success';
	} catch (SoapFault $fault) {
		return "Connection Error: (Error Code: {$fault->faultcode}, Error String: {$fault->faultstring})";
	}
}


function obiee10g_interface_form($form, &$form_state) {
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
	

	$select = db_select('obiee10g_adaptor_interface', 'sai');
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
		
		$edit = l(t('edit'), 'obiee10g_adaptor/interface/edit/', $query);
		
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
			$options[$row->id]['operations']['width'] = '10%';
		}
		else {
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['url']['width'] = '70%';
			$options[$row->id]['operations']['width'] = '10%';
		}
		
		if (!is_10ginterface_empty($row->id)) {
			$disableds[] = $row->id;
		}
	}
         
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
	);
	$form['obiee10g_interface_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	foreach ($disableds as $id) {
		$form['obiee10g_interface_table'][$id]['#disabled'] = true;
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function obiee10g_interface_form_validate($form, &$form_state) {
	$selected_count = count(array_filter($form_state['values']['obiee10g_interface_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please choose the items to delete.'));
	}        
}


function obiee10g_interface_form_submit($form, &$form_state){
	$ids = array();
	foreach (array_filter($form_state['values']['obiee10g_interface_table']) as $id => $value){		       
		$ids[] = $id;;  	   
	} 
	drupal_goto('obiee10g_adaptor/interface/delete', array('query' => array('ids' => serialize($ids))));     
}


function obiee10g_interface_add(){
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


function obiee10g_interface_add_validate($form, &$form_state) {
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = $form_state['values']['passwd'];
	$conf_pwd = $form_state['values']['conf-passwd'];
	$unit_id = $form_state['values']['unit'];
	
	$query = 'SELECT count(i.name) FROM {obiee10g_adaptor_interface} i WHERE name = :name AND unit_id = :unit_id';
	$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
	if ($name_existed != 0) {
		form_set_error('name', t('The connection name has been existed already.'));
	}
	if($pwd != $conf_pwd) {
		form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
	}
	
	$connect = obiee10g_interface_connection_check_server($url, $username, $pwd);
	if($connect != 'success'){
		form_set_error('', $connect);
	}
}


function obiee10g_interface_add_submit($form, &$form_state) {   
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = base64_encode($form_state['values']['passwd']);	
	$unit_id = $form_state['values']['unit'];
	
	db_insert('obiee10g_adaptor_interface')
		->fields(array(
		    'name' => $name,
			'url' => $url,
			'username' => $username,
			'passwd' => $pwd,
			'unit_id' => $unit_id, 
			))
		->execute();
	
	$form_state['redirect'] = 'obiee10g_adaptor/interface'; 

}


function obiee10g_interface_edit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$interface = db_query('SELECT i.name,
									i.url,  
									i.username,
									i.passwd,
									i.unit_id
							FROM {obiee10g_adaptor_interface} i
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
		'#submit' => array('obiee10g_interface_cancel'),	
	); 
	
	return $form;
}


function obiee10g_interface_edit_validate($form, &$form_state) {
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
								FROM {obiee10g_adaptor_interface} i 
								WHERE i.id = :id', 
								array(':id' => $id))->fetchAssoc();
		
		if ($name != $connection['name']) {
			$query = 'SELECT count(i.name) FROM {obiee10g_adaptor_interface} i WHERE name = :name AND unit_id = :unit_id';
			$name_existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
			if ($name_existed != 0) {
				form_set_error('name', t('The connection name has been existed already.'));
			}
		}
		
		if($pwd != $conf_pwd) {
			form_set_error('', t('Please make sure the confirm password is just keep same with the password.'));
		}
		$connect = obiee10g_interface_connection_check_server($url, $username, $pwd);
		if($connect != 'success'){
			form_set_error('', $connect);
		}
	}
}


function obiee10g_interface_edit_submit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	$name = $form_state['values']['name'];
	$url = $form_state['values']['url'];
	$username = $form_state['values']['username'];
	$pwd = base64_encode($form_state['values']['passwd']);
	
	$update = db_update('obiee10g_adaptor_interface')
		->fields(array(
			'name' => $name,
			'url' => $url,
			'username' => $username,
			'passwd' => $pwd))
		->condition('id', $id)
		->execute();
	
	$form_state['redirect'] = 'obiee10g_adaptor/interface';

}


function obiee10g_interface_cancel($form, &$form_state) {
	drupal_goto('obiee10g_adaptor/interface');

}


function obiee10g_interface_delete_confirm($form,&$form_state){
	$form['#submit'][] = 'obiee10g_interface_delete_confirm_submit';
	
	$output = confirm_form($form,
		t('Are you sure you want to delete these items?'),
		'obiee10g_adaptor/interface',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
	
	return $output; 
}


function obiee10g_interface_delete_confirm_submit($form,&$form_state){
	$ids = unserialize($_GET['ids']);
	
	db_delete('obiee10g_adaptor_interface')
		->condition('id', $ids, 'IN')
		->execute();
	
	drupal_set_message(t('These connction names has been successfully deleted.'));
	
	$form_state['redirect'] = 'obiee10g_adaptor/interface';       
 }

/**
 * Connect to OBIEE10g Servers by the different interface_id
**/
function obiee10g_interface_connect_interface($interface_id){
	$connection = db_query('SELECT i.url,
							i.username,
							i.passwd
							FROM {obiee10g_adaptor_interface} i 
							WHERE i.id = :id', 
							array(':id' => $interface_id))->fetchAssoc();
	$url = $connection['url'];
	$username = $connection['username'];
	$password = base64_decode($connection['passwd']);
	
	try {
		$obiee10gClient = new SoapClient($url);
	} catch (SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
	$options = array(
		'name' => $username,
		'password' => $password
	);
	try {
		$session = $obiee10gClient->__call('logon',array($options)); 
		return $obiee10gClient;
	} catch (SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
}


/**
 * Disconnect to OBIEE10g Server
**/
function obiee10g_interface_disconnect_interface($obiee10gClient){
	$cookies = $obiee10gClient->_cookies;
	$session_id = $cookies["nQuireID"][0];
	try {
		$obiee10gClient->__call('logoff',array($session_id));
		return true;
	} catch (SoapFault $fault) {
		return false;
	}
}


/**
 * Get OBIEE10g RequestXML by the path
**/
function obiee10g_interface_get_requestxml($obiee10gClient,$obiee10gPath){
	$cookies = $obiee10gClient->_cookies;
	$session_id = $cookies["nQuireID"][0];
	$options = array(
		'path' => $obiee10gPath,
		'resolveLinks' => true,
		'sessionID' => $session_id
	);
	try {
		$obj = $obiee10gClient->__call('readObject',array($options));
		$requestXML = $obj->return->catalogObject;
		return $requestXML; 
	} catch(SoapFault $fault) {
		//drupal_set_message($fault->faultstring);
		return false;
	}
}

/**
 * Get dataxml by excuting executeXMLQuery function.
**/
function obiee10g_interface_get_dataxml_by_requestxml($obiee10gClient, $reportPath, $reportXml = null, $viewName = null, $filterExpressions = null, $variables = null, $nameValues =null, $templateInfos = null ){
    $cookies = $obiee10gClient->_cookies;
	$session_id = $cookies["nQuireID"][0];
    if($reportXml){
        $reportRef = array('reportXml' => $reportXml);  
    } else {
        $reportRef = array('reportPath' => $reportPath);
    }
    $executionOptions = array(
        'async'=> false,
        'maxRowsPerPage'=> 100,
        'refresh'=> true,
        'presentationInfo'=> true,
        'type'=> 'foo'
    );
    $reportParams = array(
        'filterExpressions' => $filterExpressions,
        'variables' => $variables,
        'nameValues' => $nameValues,
        'templateInfos' => $templateInfos,
        'viewName' => $viewName,
    );
    $parameters = array(
        'report'=> $reportRef,
        'outputFormat'=> "SAWRowsetSchemaAndData",
        'executionOptions'=> $executionOptions,
        'reportParams' => $reportParams,
        'sessionID'=> $session_id
    );
    try {
        $result = $obiee10gClient -> __call ('executeXMLQuery', array($parameters));
        return $result->return->rowset;
    } catch (SoapFault $fault) {
        if (substr($fault->faultstring,0,21) ==="Authentication error.") drupal_goto("logout");
        else return "SOAP Fault";
    }
}


/**
 * Retrieve the result data to an array from the result rowset xml.
**/
function obiee10g_interface_get_data_by_sql($obiee10gClient,$reportSQL){
    $reportSQL = str_replace('&gt;',">",str_replace('&lt;','<',$reportSQL));
    $reportSQL = str_replace('&amp;gt;',">",str_replace('&amp;lt;','<',$reportSQL));
    $rowset = obiee10g_interface_get_dataxml_by_sql($obiee10gClient,$reportSQL);
    if($rowset==="SOAP Fault") return $rowset;
    $dataxml = new DOMDocument();
    $dataxml->loadxml($rowset);
    $dataxml = obiee10g_interface_add_null_nodes($dataxml);
    $columns = obiee10g_interface_get_meta_columns($reportSQL);
    foreach ($dataxml->getElementsByTagName('Row') as $row){$rows[] = $row;}
    if (!empty($rows)){
        foreach ($rows as $row){
  	        foreach ($row->childNodes as $column){
                foreach ($columns as $k => $v){
  	                if ($column->nodeName == $k) {
  	                    $obi_data[$v][] = $column->nodeValue;
  	                }
  	            }
            }
        }
    } else {
  	    return array();
    }
    unset($obi_data["' '"]);
    return $obi_data;
}


/**
 * Get the Result Set of OBIEE Report by the OBIEE Answer Logical SQL.
 * Use the SoapClient which rebuild from the array in the $_SESSION['obieeClientArray'] if it exists.
 * Else if it's logged in user, it will create a new OBIEE Web Service Session and store the info to Drupal Session.
**/    
function obiee10g_interface_get_dataxml_by_sql($obiee10gClient,$reportSQL){
    $reportSQL = str_replace('&gt;',">",str_replace('&lt;','<',$reportSQL));
    global $user;
    if (is_null($obiee10gClient)) {
		return array();
	} else {
        $cookies = $obiee10gClient->_cookies;
		$session_id = $cookies["nQuireID"][0];
        $executionOptions = array(
            'async'=> false,
            'maxRowsPerPage'=> 100,
            'refresh'=> true,
            'presentationInfo'=> true,
            'type'=> 'foo');
        $para = array(
            'sql'=> $reportSQL,
            'outputFormat'=> "SAWRowsetSchemaAndData",
            'executionOptions'=> $executionOptions,
            'sessionID'=> $session_id
        );
        try {
            $result = $obiee10gClient->__call('executeSQLQuery',array($para));
        } catch (SoapFault $fault) {
			if (substr($fault->faultstring,0,21) ==="Authentication error.") drupal_goto("logout");
			else return "SOAP Fault";
		}
		$obi_rowset = $result->return->rowset;
		return $obi_rowset;  
	}	
}


/**
 * This function is to add the empty nodes for the value is NULL in the database.
**/
function obiee10g_interface_add_null_nodes($dataxml){
    foreach ($dataxml->getElementsByTagName('element') as $element){$elements[] = $element;}
    foreach ($elements as $element){$columns[]=$element->getAttribute('name');}
    foreach ($dataxml->getElementsByTagName('Row') as $row){$rows[] = $row;}
    if (!empty($rows)){
        foreach ($rows as $row){
		    if($row->hasChildNodes()){
			    $names = array();
			    foreach ($row->childNodes as $col){$names[] = $col->nodeName;}
			        foreach ($columns as $column){
				        if (!in_array($column,$names)){
					        $missKey = $dataxml->createElement($column);
					        $row->appendChild($missKey);
				        }
			        }
		    }
        }
    }
  $output = new DOMDocument();
  $output->loadxml($dataxml->saveXML()); 
  return $output;	
}


/**
 * Get the table heading and column heading from the result set XML and combine them togeter.
**/
function obiee10g_interface_get_meta_columns($reportSQL){
	$reportSQL = str_replace('&gt;',">",str_replace('&lt;','<',$reportSQL));
    $columns = array();
	$delimiter = ' FROM "';
	$start = strpos($reportSQL,"SELECT ") + 7;
    $colsStr = substr($reportSQL,$start,(strpos($reportSQL,$delimiter)-$start));
	if (strripos($colsStr, "saw_")){
		$colsArray = preg_split('/saw_+[0-9]*,?/',$colsStr);
		array_pop($colsArray);
	}
	else{
		$colsArray  = array($colsStr);
	}
    for ($i=0;$i<(count($colsArray));$i++){
        $key = 'Column'.$i;
        $value = trim($colsArray[$i]);
        $columns[$key] = $value;
    }
    return $columns;  
}