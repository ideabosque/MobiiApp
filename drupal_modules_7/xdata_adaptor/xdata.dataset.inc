<?php


class TheReadFilter implements PHPExcel_Reader_IReadFilter {
	public function __construct($min, $max) {
		$this->min = $min;
		$this->max = $max;
	}
	
	public function readCell($column, $row, $worksheetName = '') {
		if ($row >= $this->min && $row <= $this->max) {
			return true;
		}

		return false;
	}
}


function is_xdata_dataset_empty($dataset_id) {
	$dataset_query = 'SELECT count(c.cid) 
					FROM {xdata_adaptor_page} c 
					WHERE c.dataset_id = :dataset_id';
	$dataset_count = db_query($dataset_query, array(':dataset_id' => $dataset_id))->fetchField();

	$empty = ($dataset_count == 0)? true: false;
	
	return $empty;
}


function get_excel_sheet($path, $min = 0, $max = 50000) {
	$data = array();
	$headers = array();
		
	try {
		$type = PHPExcel_IOFactory::identify($path);
		date_default_timezone_set('America/Los_Angeles');

		$objReader = PHPExcel_IOFactory::createReader($type);
		$objReader->setReadFilter(new TheReadFilter($min, $max));
		$objPHPExcel = $objReader->load($path);
		$objWorksheet = $objPHPExcel->getActiveSheet();
		$i = 0;
		
		foreach ($objWorksheet->getRowIterator() as $row) {
			$cellIterator = $row->getCellIterator();
			// if (!$i) {
				// $cellIterator->setIterateOnlyExistingCells(true);
			// }
			// else {
			$cellIterator->setIterateOnlyExistingCells(false);
			// }
			$j = 0;
			
			foreach ($cellIterator as $cell) {
							
				if (!$i) {
					$value = str_replace(' ', '_', trim($cell->getValue()));
					if ($value == '') {
						break;
					}
					$headers[] = array('name' => $value, 'type' => 'varchar,0');
				}
				else {
					if ($j == count($headers)) {
						break;
					}
					$type = $headers[$j]['type'];
					$value = trim($cell->getCalculatedValue());
					$value = ($value == '')? null: $value;
					$type = get_excel_cell_data_type($type, $value);
					$value = get_excel_cell_data_value($type, $value);
					$data[$i-1][$headers[$j]['name']] = $value;				
					$headers[$j]['type'] = $type;
				}
				$j++;
			}		
			$i++;
		}	
	}
	catch (Exception $e) {
		$headers = array();
		form_set_error('', t("The format of the file isn't correct.  Please check it.")); 
		//$e->getMessage());
	}
	
	$sheet = array('headers' => $headers, 'data' => $data);
	
	return $sheet;
}


function check_excel_sheet($path) {
	$sheet = get_excel_sheet($path, 0, 1);
	$headers = $sheet['headers'];
	$pass = true;
	
	foreach ($headers as $header) {
		if (!preg_match("/^[a-zA-Z]+\w*$/", $header['name'])) {
			$name = $header['name'];
			drupal_set_message(t("The format of the header ($name) is incorrect."));
			$pass = false;
		}
	}
	
	return $pass;
}


function get_excel_cell_data_type($type, $value) {
	$pieces = explode(',', $type);
	$len = (strlen($value) > $pieces[1])? strlen($value): $pieces[1];
	
	if (($pieces[0] == 'datetime') || ($pieces[0] == 'float') || ($pieces[0] == 'int') || ($type == 'varchar,0')) {
		if ((preg_match("/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}$/", $value) ||
			preg_match("/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}\s[0-9]{1,2}:[0-9]{2}$/", $value) ||
			preg_match("/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/", $value) ||
			preg_match("/^[0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}$/", $value)) &&
			($value != null)) {			
			$type = 'datetime,'. $len;               
		}
		elseif ((preg_match("/^[0-9]*\.[0-9]*$/", str_replace(',', '', $value))) && ($value != null)) {
			$len = (strlen($value) > $pieces[1])? strlen($value): $pieces[1]; 
			$type = 'float,'.$len;
		}
		elseif ((preg_match("/^-[0-9]*\.[0-9]*$/", str_replace(',', '', $value))) && ($value != null)) {
			$len = (strlen($value) > $pieces[1])? strlen($value): $pieces[1]; 
			$type = 'float,'.$len;
		}
		elseif ((preg_match("/^[0-9]*$/", str_replace(',', '', $value))) && ($value != null)) {
			$type = 'int,'.$len;
		}
		elseif ((preg_match("/^-[0-9]*$/", str_replace(',', '', $value))) && ($value != null)) {
			$type = 'int,'.$len;
		}
		else {
			if ($value != null) {
				$type = 'varchar,'. $len;
			}
		}
	}
	else {
		$type = 'varchar,'. $len;
	}
	
	return $type;
}


function get_excel_cell_data_value($type, $value) {
	$pieces = explode(',', $type);
	switch($pieces[0]) {
		case 'datetime':
			if (preg_match("/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}$/", $value)) {
				$date = date_parse_from_format('n/j/y', $value);
				$value = $date['year']. '-'. $date['month']. '-'. $date['day'];             
			}
			if (preg_match("/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}\s[0-9]{1,2}:[0-9]{2}$/", $value)) {
				$date = date_parse_from_format('n/j/y G:i', $value);
				$value = $date['year']. '-'. $date['month']. '-'. $date['day']. ' '. $date['hour']. ':'. $date['minute']. ':00';
			}
			if (preg_match("/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}\s[0-9]{1,2}:[0-9]{2}$/", $value)) {
				$date = date_parse_from_format('n/j/Y G:i', $value);
				$value = $date['year']. '-'. $date['month']. '-'. $date['day']. ' '. $date['hour']. ':'. $date['minute']. ':00';
			}
			break;
		case 'float':
			$value = ($value != null)? str_replace(',', '', $value): null;
			break;
		case 'int':
			$value = ($value != null)? str_replace(',', '', $value): null;
			break;
	}
	
	return $value;
}


function insert_excel_sheet($name, $unit_id, $sheet) {
	$table_name = $name.$unit_id;
	$headers = $sheet['headers'];
	$data = $sheet['data'];
	
	$fields = array(
				'id' => array(
					'type' => 'serial',
					'unsigned' => TRUE,
					'not null' => TRUE,
					'description' => t("Primary Key."),
				),
			);
	foreach ($headers as $header) {
		$col_name = $header['name'];
		$type = explode(',', $header['type']);
		switch ($type[0]) {
			case 'datetime':
				$fields[$col_name] = array('type' => 'datetime', 'mysql_type' => 'DATETIME');
				break;
			case 'float':
				$fields[$col_name] = array('type' => 'float', 'size' => 'big');
				break;
			case 'int':
				$fields[$col_name] = array('type' => 'int', 'size' => 'big');
				break;
			case 'varchar':
				$length = $type[1];
				$fields[$col_name] = array('type' => 'varchar', 'length' => $length);
				break;
		}		
	}
	
	$table = array('fields' => $fields, 'primary key' => array('id'));
	
	try {
		db_create_table($table_name, $table);	
		insert_excel_data($table_name, $data);
		return true;
	}
	catch (Exception $e) {
		db_drop_table($table_name);
		form_set_error('', t("The file cannot be imported due to '@message'.  Please check it.", array('@message' => $e->getMessage())));
		return false;
	}
}


function insert_excel_data($name, $data) {
	foreach ($data as $row) {
		$fields = array();
		
		$valid = false;
		foreach ($row as $key => $value) {
			$fields[$key] = $value;
			$valid = (($value != null) && ($valid == false))? true: $valid;
		}
		
		if ($valid) {
			db_insert($name)->fields($fields)->execute();
		}
	}
}


function refresh_excel_sheet($name, $unit_id, $sheet) {
	$table_name = $name.$unit_id;
	$headers = $sheet['headers'];
	$data = $sheet['data'];
	$query = 'show columns from {'.$table_name.'}';
	$result = db_query($query);
	
	$db_headers = array();
	foreach ($result as $row) {
		if ($row->Field != 'id') {
			$db_headers[] = array('name' => $row->Field, 'type' => $row->Type);
		}
	}
	
	$matched = false;
	foreach ($db_headers as $db_header) {
		$matched = false;
		foreach ($headers as $key => $header) {
			if ($header['name'] == $db_header['name']) {
				$pieces = explode(',', $headers[$key]['type']);
				if (($pieces[0] == 'int') && ($db_header['type'] != 'bigint(20)')) {
					$headers[$key]['type'] = 'bigint';
				}
				elseif (($pieces[0] == 'float') && ($db_header['type'] != 'double')) {
					$headers[$key]['type'] = 'double';
				}
				elseif (($pieces[0] == 'datetime') && ($db_header['type'] != 'datetime')) {
					$headers[$key]['type'] = 'datetime';
				}
				elseif ($pieces[0] == 'varchar') {
					$type = 'varchar('. $pieces[1]. ')';
					if ($type != $db_header['type']) {
						$headers[$key]['type'] = $type. ' character set utf8';
					}
					else {
						$headers[$key]['type'] = null;
					}
				}
				else {
					$headers[$key]['type'] = null;
				}
				
				$matched = true;
				break;
			}
		}
		
		if (!$matched) {
			break;
		}
	}
		
	if ($matched) {
		db_delete($table_name)->execute();
		
		foreach ($headers as $header) {
			if ($header['type'] != null) {
				$query = 'ALTER TABLE '. $table_name. ' MODIFY '. $header['name']. ' '. $header['type'];
				db_query($query);
			}
		}
		
		insert_excel_data($table_name, $data);
	}
	else {
		form_set_error('', t('The headers are mismatched with the table metadata.'));
	}
	
	return $matched;
}


function get_excel_sql_script($headers, $name, $unit_id) {
	$table_name = $name.$unit_id;
	$sql_select = "";
	
	$length = count($headers);
	foreach ($headers as $key => $header) {
		$sql_select = $sql_select. "$name.".  $header['name'];
		$sql_select = ($length == ($key+1))? $sql_select: $sql_select. ", ";
	}
	
	$sql_from = $table_name. " $name";
	
	$sql_script = array('select' => $sql_select, 'from' => $sql_from);
	
	return $sql_script;
}


function validate_database_sql_script($sql_script, $interface_id, $type) {
	if ($type != 'database') {
		global $databases;
		$db = $databases['default']['default'];
		$interface = array(
						'type' => $db['driver'],
						'connection_string' => $db['host']. ":". (($db['port'] == '')? '3306': $db['port']),
						'default_database' => $db['database'],
						'username' => $db['username'],
						'passwd' => base64_encode($db['password']),						
					);		
	}
	else {
		$interface = db_query('SELECT * FROM {xdata_adaptor_interface} WHERE id = :id', 
						array(':id' => $interface_id)
					)->fetchAssoc();
	}
	
	switch ($interface['type']) {
		case 'mysql':
			$connect = $interface['connection_string'];
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];
			$link = mysql_connect($connect, $username, $password);
			if (!$link) {
				return "MySQL Connect Error: ". mysql_error();
			}
			else {
				if (!mysql_select_db($database, $link)) {
					$error_msg = mysql_error();
					mysql_close($link);
					return "MySQL Select DB Error: ". $error_msg;
				}
				else {
					$result = mysql_query($sql_script, $link);
					if (!$result) {
						$error_msg = mysql_error();
						mysql_close($link);
						return "MySQL SQL Error: ". $error_msg;
					}
					else {
						mysql_close($link);
						return 'success';
					}
				}
			}
			break;
		case 'oracle':
			$connect = $interface['connection_string'];
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$link = oci_connect($username, $password, $connect);
			if (!$link) {
				$e = oci_error();
				return "Oracle Connect Error: ". $e['message'];
			}
			else {
				$stmt = oci_parse($link, $sql_script);
				$result = oci_execute($stmt);
				if (!$result) {
					$e = oci_error($stmt);
					$error_msg = $e['message'];
					oci_close($link);
					return "Oracle SQL Error: ". $error_msg;
				}
				else {
					oci_close($link);
					return 'success';
				}
			}
			break;
		case 'mssql':
			$connect = $interface['connection_string']; 
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];
			$link = mssql_connect($connect, $username, $password);
			if (!$link) {
				return "MSSQL Connect Error: Could not connect to the server!";
			}
			else {
				if (!mssql_select_db($database, $link)) {
					mssql_close($link);
					return "MSSQL Select DB Error: Could not select a database.";
				}
				else {
					$result = mssql_query($sql_script);
					if (!$result) {
						return "MySQL SQL Error: Please check your sql script.";
					}
					else {
						mssql_close($link);
						return 'success';
					}
				}
			}
			break;
	}
}


function get_database_sql_script($interface_id, $base_sql_script, $name) {
	$base_sql_script = str_replace(';', '', $base_sql_script);
	$sql_select = "";
	$sql_from = "";
	$interface = db_query('SELECT * FROM {xdata_adaptor_interface} WHERE id = :id', 
					array(':id' => $interface_id)
				)->fetchAssoc();
	switch ($interface['type']) {
		case 'mysql':
			$connect = $interface['connection_string']; 
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];			
			$link = mysql_connect($connect, $username, $password);
			mysql_select_db($database, $link);
			$result = mysql_query($base_sql_script, $link);
			
			$sql_select = "";
			$length = mysql_num_fields($result);
			for ($i = 0; $i < $length; $i++) { 
				$sql_select = $sql_select. "$name.". mysql_field_name($result, $i);
				$sql_select = ($length == ($i+1))? $sql_select: $sql_select. ", ";
			} 
			$sql_from = "(". trim($base_sql_script). ") $name";
	
			break;
		case 'oracle':
			$connect = $interface['connection_string'];
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$link = oci_connect($username, $password, $connect);
			$stmt = oci_parse($link, $base_sql_script); 
			oci_execute($stmt);
			
			$length = oci_num_fields($stmt);
			for ($i = 1; $i <= $length; $i++) { 
				$sql_select = $sql_select. "$name.". oci_field_name($stmt, $i);
				$sql_select = ($length == $i)? $sql_select: $sql_select. ", ";
			} 
			$sql_from = "(". trim($base_sql_script). ") $name";
			
			break;
		case 'mssql':
			$connect = $interface['connection_string']; 
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];
			$link = mssql_connect($connect, $username, $password);
			mssql_select_db($database, $link);
			$result = mssql_query($base_sql_script);
			
			$length = mssql_num_fields($result);
			for ($i = 0; $i < $length; ++$i) {
				$sql_select = $sql_select. "$name.". mssql_field_name($result, $i);
				$sql_select = ($length == ($i+1))? $sql_select: $sql_select. ", ";
			}
			$sql_from = "(". trim($base_sql_script). ") $name";
			
			break;
	}
	
	
	$sql_script = array('select' => $sql_select, 'from' => $sql_from);
	
	return $sql_script;
}


function get_excel_by_remote_interface($interface_id, $path, $tmp_path) {
	$interface = db_query('SELECT * FROM {xdata_adaptor_interface} WHERE id = :id', 
					array(':id' => $interface_id)
				)->fetchAssoc();
	switch ($interface['type']) {
		case 'ssh':
			$con = explode(":", $interface['connection_string']);
			$connection = ssh2_connect($con[0], $con[1]);	
			ssh2_auth_password($connection, $interface['username'], base64_decode($interface['passwd']));

			$pieces = explode("/", $path);
			$file_name = array_pop($pieces);
			$remote_dir = str_replace($file_name, '', $path);
			$stream = ssh2_exec($connection, "find $remote_dir -name $file_name -size -10M");
			stream_set_blocking($stream, true);
			$files = explode("\n", stream_get_contents($stream));
			
			if ($files[0] != '') {
				ssh2_scp_recv($connection, $path, $tmp_path);
			}
			else {
				drupal_set_message('Dataset Refresh:'. 'The file with path('. $path. ') exceeds the limit(25M).');
				watchdog('xdata_adaptor', 'Dataset Refresh:'. 'The file with path('. $path. ') exceeds the limit(25M).');
			}
			break;
		case 'dropbox':
			global $xdata_key;
			global $xdata_secret;
			$encrypter = new \Dropbox\OAuth\Storage\Encrypter('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
			$storage = new \Dropbox\OAuth\Storage\Session($encrypter);
			$access_token = unserialize($interface['access_token']);
			$storage->set($access_token, 'access_token');
			$OAuth = new \Dropbox\OAuth\Consumer\Curl($xdata_key, $xdata_secret, $storage);
			$dropbox = new \Dropbox\API($OAuth, 'dropbox');
			
			$metadata = $dropbox->metaData($path);
			$size = $metadata['body']->size;
			$pieces = explode(' ', $size);
			if (($pieces[0] > 10) && ($pieces[1] == 'MB')) {
				drupal_set_message('Dataset Refresh:'. 'The file with path('. $path. ') exceeds the limit(25M).');
				watchdog('xdata_adaptor', 'Dataset Refresh:'. 'The file with path('. $path. ') exceeds the limit(25M).');
			}
			else {
				$dropbox->getFile($path, $tmp_path);
				unset($_SESSION['dropbox_api']);
			}
			break;
	}
}


function get_excel_remote_interfaces_by_unit_id($unit_id) {
	$interfaces = array();
	
	$result = db_query("SELECT s.id, s.name  
						FROM {xdata_adaptor_interface} s 
						WHERE s.type in ('ssh', 'dropbox') 
						AND s.unit_id = :unit_id", 
						array(':unit_id' => $unit_id));
	
	foreach ($result as $record) {
		$interfaces[$record->id] = $record->name;
	}
	
	return $interfaces;
}


function get_xdata_database_interfaces_by_unit_id($unit_id) {
	$interfaces = array();
	
	$result = db_query("SELECT s.id, s.name  
						FROM {xdata_adaptor_interface} s 
						WHERE s.type in ('mysql', 'oracle', 'mssql') 
						AND s.unit_id = :unit_id", 
						array(':unit_id' => $unit_id));
	
	foreach ($result as $record) {
		$interfaces[$record->id] = $record->name;
	}
	
	return $interfaces;
}


function get_selected_columns_by_sql_where($columns, $sql_where) {
	$selected = array();
	$conditions = explode("\r\n", $sql_where);
	foreach ($conditions as $condition) {
		foreach ($columns as $key => $column) {
			if (preg_match("/\b$column\b/i", $condition)) {
				$selected[] = $key;
				break;
			}
		}
	}
	
	return $selected;
}


function xdata_dataset_form($form, &$form_state) {
    global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}

	$header = array(
		'name' => array('field' => 'ead.name', 'data' => t('Name')),
		'type' => array('field' => 'ead.type', 'data' => t('Type')),
		'interface_path' => array('data' => t('Interface/Path')),
	);
	if ($is_super_admin) {
		$header['unit_name'] = array('data' => t('Group'));
	}
	$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	

	$select = db_select('xdata_adaptor_dataset', 'ead')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('ead');
	
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
		
		$op = l(t('edit'), 'xdata_adaptor/dataset/edit', $query);	
		switch ($row->type) {
			case 'direct':
				$load_data = l(t('upload'), 'xdata_adaptor/dataset/upload', $query);
				$op = $op. '&nbsp;|&nbsp;'. $load_data;
				break;
			case 'remote':
				$load_data = l(t('refresh'), 'xdata_adaptor/dataset/refresh', $query);
				$schedule = l(t('schedule'), 'xdata_adaptor/dataset/schedule', $query);
				$op = $op. '&nbsp;|&nbsp;'. $load_data. '&nbsp;|&nbsp;'. $schedule;
				break;
		}
		
		$interface_name = ($row->type != 'direct')?
							db_query(
								'SELECT i.name 
								 FROM {xdata_adaptor_interface} i 
								 WHERE i.id = :interface_id;', 
								array(':interface_id' => $row->interface_id)
							)->fetchField(): '';
		
		$options[$row->id] = array(
			'name' => array('data' => $row->name. '</br>'. date('Y-m-d H:i:s', $row->timestamp)),
			'type' => array('data' => $row->type),
			'interface_path' => array('data' => $interface_name. '</br>'. $row->path),
			// 'path' => array('data' => $row->path),
			'operations' => array('data' => $op),			
		);		
		
		if ($row->type = 'remote') {
			$options[$row->id]['name']['data'] .= '</br>'. $row->schedule;
		}
		
		$_unit = get_unit($row->unit_id);
		$unit_name = $_unit['unit_name'];
	
		if ($is_super_admin) {			
			$options[$row->id]['name']['width'] = '20%';
			$options[$row->id]['type']['width'] = '10%';
			$options[$row->id]['interface_path']['width'] = '30%';
			// $options[$row->id]['path']['width'] = '30%';
			$options[$row->id]['unit_name'] = array('data' => $unit_name, 'width' => '20%');
			$options[$row->id]['operations']['width'] = '20%';
		}
		else {
			$options[$row->id]['name']['width'] = '30%';
			$options[$row->id]['type']['width'] = '10%';
			$options[$row->id]['interface_path']['width'] = '40%';
			// $options[$row->id]['path']['width'] = '40%';
			$options[$row->id]['operations']['width'] = '20%';
		}
		
		if (!is_xdata_dataset_empty($row->id)) {
			$disableds[] = $row->id;
		}
	}
         
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
		'#prefix' => '<div class="container-inline">',
	);

	$add = l(t('Add Dataset'), 'xdata_adaptor/dataset/add');		
	$form['add'] = array(
		'#type' => 'item',
		'#title' => "<b>$add</b>",
		'#suffix' => '</div>',
	);
	$form['xdata_dataset_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	foreach ($disableds as $id) {
		$form['xdata_dataset_table'][$id]['#disabled'] = true;
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function xdata_dataset_form_validate($form, &$form_state) {
	$selected_count = count(array_filter($form_state['values']['xdata_dataset_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please choose the items to delete.'));
	}        
}


function xdata_dataset_form_submit($form, &$form_state) {
	$ids = array();
	foreach (array_filter($form_state['values']['xdata_dataset_table']) as $id => $value){		       
		$ids[] = $id;;  	   
	} 
	drupal_goto('xdata_adaptor/dataset/delete', array('query' => array('ids' => serialize($ids))));     
}


function xdata_dataset_delete_confirm($form, &$form_state) {
	$form['#submit'][] = 'xdata_dataset_delete_confirm_submit';
	
	$output = confirm_form($form,
		t('Are you sure you want to delete these items?'),
		'xdata_adaptor/dataset',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
	
	return $output; 
}


function xdata_dataset_delete_confirm_submit($form, &$form_state) {
	$ids = unserialize($_GET['ids']);
	
	$result = db_select('xdata_adaptor_dataset', 'ead')
		->fields('ead')
		->condition('id', $ids,'IN')
		->execute();
	
	foreach ($result as $row) {
		$unit_id = $row->unit_id;
		$name = $row->name;
		$table = $name.$unit_id;
		db_drop_table($table);
	}
	
	db_delete('xdata_adaptor_dataset')
		->condition('id', $ids, 'IN')
		->execute();
	
	drupal_set_message(t('These datasets have been successfully deleted.'));
	
	$form_state['redirect'] = 'xdata_adaptor/dataset';       
}


function xdata_dataset_add($form, &$form_state){
	global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);

	$re = db_query('SELECT m.unit_id, m.unit_name FROM {mobiiapp_unit} m');		
	$units = array();
	foreach($re as $row) {
		$units[$row->unit_id] = $row->unit_name;
	}
	
	if (count($units) == 0) {
		drupal_goto('mobiiapp/unit/add');
	}
	
	if(isset($_GET['entry'])) {
	    $entry = unserialize($_GET['entry']);
		$unit_id = $entry['unit_id'];
	}
	else {
		if (!$is_super_admin) {
			$unit = get_unit_by_uid($user->uid);
			$unit_id = $unit['unit_id'];
		}
		else {
			$unit_id = key($units);
		}
	}	
		
	$form['unit_id'] = array(
		'#type' => 'value',
		'#value' => $unit_id,
	);

	if ($is_super_admin) {	
		$selected = isset($form_state['values']['unit'])? $form_state['values']['unit']: $unit_id;
		
		$form['select_unit'] = array(
			'#title' => t('Group: ').$units[$selected],
			'#type' => 'fieldset',   
			'#collapsible' => true,
			'#collapsed'   => true,
		);
		$form['select_unit']['unit'] = array(
			//'#title' => t('Group'),
			'#type' => 'select',
			'#options' => $units,
			'#default_value' => $selected,
			'#prefix' => '<div class="container-inline">',
		);
		
		$form['select_unit']['submit'] = array(
			'#type' => 'submit',
			'#value' => t('Go'),
			'#suffix' => '</div>',
			'#submit' => array('xdata_dataset_add_go'),
		);
	}	
	
	$form['add'] = array(
		'#title' => t('Dataset Settings'),
		'#type' => 'fieldset',
	);
	$form['add']['name'] = array(
		'#title' => t('Dataset Name'),
		'#type' => 'textfield',
		'#required' => true,
	);	
	
	$form['add']['type'] = array(
		'#title' => t('Type'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(array(t('direct'), t('remote'), t('database'))),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	
	$form['add']['xdata_dataset'] = array(
		'#type' => 'file',
		'#title' => t('Upload File'),
		'#size' => 40,
		'#description' => t('<b>Excel2007/Excel2010,Excel5,Excel2003XML,OOCalc,SYLK,Gnumeric,CSV</b> are supported.'),
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('direct')),
			),
		),
		
	);	
	
	$form['add']['remote_interface'] = array(
		'#title' => t('Interface'),
		'#type' => 'select',
		'#options' => get_excel_remote_interfaces_by_unit_id($unit_id),
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('remote')),
			),
		),
	);
	
	$form['add']['path'] = array(
		'#title' => t('File Path'),
		'#type' => 'textfield',
		'#description' => t('<b>Excel2007/Excel2010,Excel5,Excel2003XML,OOCalc,SYLK,Gnumeric,CSV</b> are supported.'),
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('remote')),
			),
		),
	);

	$form['add']['database_interface'] = array(
		'#title' => t('Interface'),
		'#type' => 'select',
		'#options' => get_xdata_database_interfaces_by_unit_id($unit_id),
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('database')),
			),
		),
	);
	
	$form['add']['sql_script'] = array(
		'#title' => t('SQL Script'),
		'#type' => 'textarea',
		'#rows' => 6,
		'#description' => t('The SQL Script for the database dataset.'),
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('database')),
			),
		),
		
	);
	
	$form['submit'] = array(
		'#value' => t('Add Dataset'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/dataset');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	$form['#attributes'] = array('enctype' => "multipart/form-data");
	
	return $form;
}


function xdata_dataset_add_go($form, &$form_state) {
	$unit_id = $form_state['values']['unit'];	
	
	$entry = serialize(array('unit_id' => $unit_id));
	$query = array('query' => array('entry' => $entry));
	drupal_goto('xdata_adaptor/dataset/add', $query);
}


function xdata_dataset_add_validate($form, &$form_state) {
	$unit_id = $form_state['values']['unit_id'];	
	$name = $form_state['values']['name'];
	$type = $form_state['values']['type'];
	
	$name = str_replace(' ', '_', $name);
	if (!preg_match("/^[a-zA-Z]+\w+$/i", $name)) {
		form_set_error('name', t('Special characters are not allowed.  Please file name starting with [a-zA-Z].'));
	}
			
	$query = 'SELECT count(s.name) 
				FROM {xdata_adaptor_dataset} s 
				WHERE unit_id = :unit_id
				AND name = :name';
	$name_existed = db_query($query, array(':unit_id' => $unit_id, ':name' => $name))->fetchField();
	if ($name_existed != 0) {
		form_set_error('name', t('The '.$type.' name has been existed already.'));
	}
	
	switch ($type) {			
		case 'remote':
			if ($form_state['values']['remote_interface'] == '') {
				form_set_error('remote_interface', t('The interface must be selected for remote dataset.'));
			}
			if (trim($form_state['values']['path']) == '') {
				form_set_error('path', t('The path must be input for remote dataset.'));
			}
			$path = $form_state['values']['path'];
			$format = strtolower(end(explode(".", $path)));
			$support_formats = array('xlsx', 'csv', 'xls', 'xml', 'ods', 'slk', 'gnumeric');
			if (!in_array($format, $support_formats)) {
				form_set_error('path', t('The file format is not supported.'));
			}
			break;
		case 'database':
			if ($form_state['values']['database_interface'] == '') {
				form_set_error('database_interface', t('The interface must be selected for database dataset.'));
			}
			else {
				$interface_id = $form_state['values']['database_interface'];
				$sql_script = $form_state['values']['sql_script'];
				
				$validate = validate_database_sql_script($sql_script, $interface_id, $type);
				if ($validate != 'success') {
					form_set_error('', $validate);		
				}
			}
			break;
	}
	
}


function xdata_dataset_add_submit($form, &$form_state) {
	$unit_id = $form_state['values']['unit_id'];	
	$name = str_replace(' ', '_', $form_state['values']['name']);
	$type = $form_state['values']['type'];
	$support_formats = array('xlsx', 'csv', 'xls', 'xml', 'ods', 'slk', 'gnumeric');
	
	switch ($type) {
		case 'direct':
			$file = file_save_upload('xdata_dataset', array('file_validate_extensions' => array()), 'temporary://');
			if (!empty($file)) {
				$path = str_replace("temporary://", "/tmp/", $file->uri);
				$format = strtolower(end(explode(".", $path)));				
				$check_format = in_array($format, $support_formats);
				$check_headers = check_excel_sheet($path);				
				if ($check_format && $check_headers) {				
					$sheet = get_excel_sheet($path);
					file_delete($file, true);
					
					$headers = $sheet['headers'];
					if (count($headers) > 0) {
						$sql_script = get_excel_sql_script($headers, $name, $unit_id); 
						
						if (insert_excel_sheet($name, $unit_id, $sheet)) {			
							db_insert('xdata_adaptor_dataset')
								->fields(
									array(
										'name' => $name,
										'type' => $type,
										'sql_select' => $sql_script['select'],
										'sql_from' => $sql_script['from'],
										'unit_id' => $unit_id,
										'timestamp' => time(),
									)
								)
								->execute();
						}
					}
				}
				else {
					file_delete($file, true);
					if (!$check_format) {
						form_set_error('', t('The file format is not supported.'));
					}
					if (!$check_headers) {
						form_set_error('', t('The headers have not supported format string.  The headers have to start with [a-zA-Z].  Special characters are not support.'));
					}
				}
			}
			else {
				form_set_error('', t('The file is empty.'));
			}
			break;
		case 'remote':	
			$interface_id = $form_state['values']['remote_interface'];
			$path = $form_state['values']['path'];
			$format = strtolower(end(explode(".", $path)));
			
			$tmp_path = '/tmp/'.$name.'.'.$format;
			get_excel_by_remote_interface($interface_id, $path, $tmp_path);
			
			if (file_exists($tmp_path)) {
				$check_format = in_array($format, $support_formats);
				$check_headers = check_excel_sheet($tmp_path);
				if ($check_format && $check_headers) {
					$sheet = get_excel_sheet($tmp_path);
					unlink($tmp_path);
					
					$headers = $sheet['headers'];
					if (count($headers) > 0) {
						$sql_script = get_excel_sql_script($headers, $name, $unit_id); 
						
						if (insert_excel_sheet($name, $unit_id, $sheet)) {
							db_insert('xdata_adaptor_dataset')
								->fields(
									array(
										'name' => $name,
										'type' => $type,
										'interface_id' => $interface_id,
										'path' => $path,
										'sql_select' => $sql_script['select'],
										'sql_from' => $sql_script['from'],
										'unit_id' => $unit_id,
										'timestamp' => time(),
									)
								)
								->execute();
						}
					}
				}
				else {
					unlink($tmp_path);
					if (!$check_format) {
						form_set_error('', t('The file format is not supported.'));
					}
					if (!$check_headers) {
						form_set_error('', t('The headers have not supported format string.  The headers have to start with [a-zA-Z].  Special characters are not support.'));
					}
				}
			}
			else {
				form_set_error('', t('The file does not exit.'));
			}
			break;
		case 'database':
			$interface_id = $form_state['values']['database_interface'];
			$base_sql_script = $form_state['values']['sql_script'];
			
			
			$sql_script = get_database_sql_script($interface_id, $base_sql_script, $name);
			
			db_insert('xdata_adaptor_dataset')
				->fields(
					array(
						'name' => $name,
						'type' => $type,
						'interface_id' => $interface_id,
						'sql_select' => $sql_script['select'],
						'sql_from' => $sql_script['from'],
						'unit_id' => $unit_id,
						'timestamp' => time(),
					)
				)
				->execute();
			break;		
	}
	
	drupal_goto('xdata_adaptor/dataset');
}


function xdata_dataset_upload($form, &$form_state) {
	$form['xdata_dataset'] = array(
		'#type' => 'file',
		'#title' => t('Upload File'),
		'#size' => 40,
		'#description' => t('<b>Excel2007/Excel2010,Excel5,Excel2003XML,OOCalc,SYLK,Gnumeric,CSV</b> are supported.'),
	);
	$form['upload'] = array(
		'#type' => 'submit',
		'#value' => t('Upload'),
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/dataset');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	$form['#attributes'] = array('enctype' => "multipart/form-data");	

	return $form;
}


function xdata_dataset_upload_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$dataset = db_query('SELECT * FROM {xdata_adaptor_dataset} WHERE id = :id', 
						array(':id' => $id)
				)->fetchAssoc();
	$name = $dataset['name'];
	$unit_id = $dataset['unit_id'];
	
	$file = file_save_upload('xdata_dataset', array('file_validate_extensions' => array()), 'temporary://');
	if (!empty($file)) {
		$path = str_replace("temporary://", "/tmp/", $file->uri);
		$format = strtolower(end(explode(".", $path)));
		$support_formats = array('xlsx', 'csv', 'xls', 'xml', 'ods', 'slk', 'gnumeric');
		
		if (in_array($format, $support_formats)) {	
			$sheet = get_excel_sheet($path);
			file_delete($file, true);
			
			if (refresh_excel_sheet($name, $unit_id, $sheet)) {			
				db_update('xdata_adaptor_dataset')
					->fields(
						array(
							'timestamp' => time(),
						)
					)
					->condition('id', $id, '=')
					->execute();
				
				drupal_set_message('The dataset '. $name. ' is refreshed successfully.');
			}
		}
		else {
			file_delete($file, true);
			form_set_error('', t('The file format is not supported.'));			
		}
	}
	else {
		form_set_error('', t('The file is empty.'));
	}
		
	drupal_goto('xdata_adaptor/dataset');
}


function xdata_dataset_schedule($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$schedule = db_query(
					'SELECT s.schedule FROM {xdata_adaptor_dataset} s WHERE s.id = :id', 
					array(':id' => $id)
				)->fetchField();
	if ($schedule != '') {
		$_schedule = explode(' ', $schedule);
		$routine = $_schedule[0];
	}
	else {
		$routine = 'no schedule';
	}
	$form['schedule'] = array(
		'#title' => t('Schedule to refresh remote dataset.'),
		'#type' => 'fieldset',
	);
	$form['schedule']['routine'] = array(
		'#title' => t('Routine'),
		'#type' => 'select',
		// '#options' => drupal_map_assoc(array(t('no schedule'), t('hourly'), t('daily'), t('weekly'), t('monthly'))),
		'#options' => drupal_map_assoc(array(t('no schedule'), t('daily'), t('weekly'), t('monthly'))),
		'#default_value' => $routine,
		'#prefix' => '<div class="container-inline">',
	);
	$form['schedule']['week_date'] = array(
		'#title' => t('Date'),
		'#title_display' => 'invisible',
		'#type' => 'select',
		'#options' => drupal_map_assoc(
						array(
							t('Sunday'), 
							t('Monday'), 
							t('Tuesday'), 
							t('Wednesday'), 
							t('Thursday'),
							t('Friday'),
							t('Saturday'),
						)
					),
		'#states' => array(
			'visible' => array(
				':input[name="routine"]' => array('value' => t('weekly')),
			),
		),
	);
	$form['schedule']['month_date'] = array(
		'#title' => t('Date'),
		'#title_display' => 'invisible',
		'#type' => 'select',
		'#options' => drupal_map_assoc(
						array(
							t('01'), t('02'), t('03'), t('04'), t('05'), t('06'), t('07'), t('08'), t('09'), t('10'),
							t('11'), t('12'), t('13'), t('14'), t('15'), t('16'), t('17'), t('18'), t('19'), t('20'), 
							t('21'), t('22'), t('23'), t('24'), t('25'), t('26'), t('27'), t('28'), t('29'), t('30'), 
							t('31'), 
						)
					),
		'#states' => array(
			'visible' => array(
				':input[name="routine"]' => array('value' => t('monthly')),
			),
		),
		'#suffix' => '</div>',
	);
	
	if ($routine == 'weekly') {
		$form['week_date']['#default_value'] = array_pop($_schedule);
	}
	if ($routine == 'monthly') {
		$form['month_date']['#default_value'] = array_pop($_schedule);
	}
	$form['save'] = array(
		'#type' => 'submit',
		'#value' => t('Save'),
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/dataset');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	return $form;
}


function xdata_dataset_schedule_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	$routine = $form_state['values']['routine'];
	switch($routine) {
		case 'no schedule':
			$schedule = '';
			break;
		case 'hourly':
			$schedule = $routine;
			break;
		case 'daily':
			$schedule = $routine;
			break;
		case 'weekly':
			$schedule = $routine. ' on '. $form_state['values']['week_date'];
			break;
		case 'monthly':
			$schedule = $routine. ' on '. $form_state['values']['month_date'];
			break;
	}
	
	db_update('xdata_adaptor_dataset')
		->fields(
			array(
				'schedule' => $schedule,
				'timestamp' => time(),
			)
		)
		->condition('id', $id, '=')
		->execute();
	
	drupal_goto('xdata_adaptor/dataset');
}


function xdata_dataset_refresh() {
	$entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	
	xdata_dataset_instantly_refresh($id);
	
	drupal_goto('xdata_adaptor/dataset');
}


function xdata_dataset_schedule_refresh($routine) {
	switch ($routine) {
		case 'hourly':
			$schedule = 'hourly';
			break;
		case 'daily':
			$schedule = 'daily';
			break;
		case 'weekly':
			$schedule = 'weekly on '. date('l', time());
			break;
		case 'monthly':
			$schedule = 'monthly on '. date('d', time());
			break;
	}

	$local_server = exec('hostname');
	$servers = get_servers();
	$servers_count = count($servers);
	
	$task_index = 0;
	$result = db_query('SELECT s.id FROM {xdata_adaptor_dataset} s WHERE s.schedule = :schedule',
					array('schedule' => $schedule)
				);		
	foreach($result as $row) {
		$server_index = ($task_index + 1) % $servers_count;
		$server_index = ($server_index == 0)? $servers_count: $server_index;
		$server_index = $server_index - 1;
		$server = $servers[$server_index];
		
		if ($local_server == $server) {
			$query = array('query' => array('id' => serialize($row->id)));
			$url = url("https://$server/xdata_adaptor/dataset/remote_refresh", $query);
			$cmd = 'curl --silent --compressed '. $url. ' &';
			exec($cmd);
			watchdog('xdata_adaptor', "Dataset Refresh: The dataset with id($row->id) is in freshing on $server.");
		}
	}
}


function xdata_dataset_remote_refresh() {
	$id = unserialize($_GET['id']);
	watchdog('xdata_adaptor', 'Dataset Refresh:'. 'The dataset with id('. $id. ') is in freshing.');
	xdata_dataset_instantly_refresh($id);
}


function xdata_dataset_remote_refresh_access() {
	if (!isset($_GET['id'])) {
		return false;
	}
	else {
		$id = unserialize($_GET['id']);
		$exited = db_query("SELECT count(*) 
							FROM {xdata_adaptor_dataset} 
							WHERE type = 'remote' 
							AND id = :id", 
						array(':id' => $id)
				)->fetchField();
		if ($exited > 0) {
			return true;
		}
			return false;
	}
}


function xdata_dataset_instantly_refresh($id) {
	$dataset = db_query('SELECT * FROM {xdata_adaptor_dataset} WHERE id = :id', 
						array(':id' => $id)
				)->fetchAssoc();
	$name = $dataset['name'];
	$unit_id = $dataset['unit_id'];
	$interface_id = $dataset['interface_id'];
	
	$path = $dataset['path'];
	$format = strtolower(end(explode(".", $path)));
	$tmp_path = '/tmp/'.$name.'.'.$format;

	get_excel_by_remote_interface($interface_id, $path, $tmp_path);
	
	if (file_exists($tmp_path)) {
		$sheet = get_excel_sheet($tmp_path);
		unlink($tmp_path);
		
		if (refresh_excel_sheet($name, $unit_id, $sheet)) {			
			db_update('xdata_adaptor_dataset')
				->fields(
					array(
						'timestamp' => time(),
					)
				)
				->condition('id', $id, '=')
				->execute();
			watchdog('xdata_adaptor', 'Dataset Refresh:'. 'The dataset '. $name. ' is refreshed successfully.');
			drupal_set_message('The dataset '. $name. ' is refreshed successfully.');
		}
	}
	else {
		watchdog('xdata_adaptor', 'Dataset Refresh:'. 'The file of the dataset '. $name. ' is not exited.');
		form_set_error('', t('The file does not exit.'));
	}
}


function xdata_dataset_edit($form, &$form_state){
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$dataset = db_query('SELECT s.name,								
								s.sql_select,
								s.sql_from,
								s.sql_where,
								s.type,
								s.interface_id
						FROM {xdata_adaptor_dataset} s 
						WHERE s.id = :id', 
						array(':id' => $id))->fetchAssoc();
	
	$form['type'] = array(
		'#type' => 'value',
		'#value' => $dataset['type'],
	);	
	$form['interface_id'] = array(
		'#type' => 'value',
		'#value' => $dataset['interface_id'],
	);	
	$form['sql_select'] = array(
		'#type' => 'value',
		'#value' => $dataset['sql_select'],
	);	
	$form['sql_from'] = array(
		'#type' => 'value',
		'#value' => $dataset['sql_from'],
	);
	
	$form['edit'] = array(
		'#title' => t('Edit condition for SQL Script'),
		'#type' => 'fieldset',
	);
	$form['edit']['sql_script'] = array(
		'#title' => t('SQL Script'),
		'#type' => 'fieldset',
	);
	$form['edit']['sql_script']['select'] = array(
		'#type' => 'item',
		'#title' => t('SELECT'),
		'#markup' => $dataset['sql_select'],
	);	
	$form['edit']['sql_script']['from'] = array(
		'#type' => 'item',
		'#title' => t('FROM'),
		'#markup' => str_replace("\r\n", "<br/>", $dataset['sql_from']),
	);	
	$form['edit']['sql_script']['where'] = array(
		'#type' => 'item',
		'#title' => t('WHERE'),
		'#markup' => str_replace("\r\n", "<br/>", $dataset['sql_where']),
	);
	$columns = explode(', ', $dataset['sql_select']);
	$form['edit']['is_prompted'] = array(
		'#title' => t('Is Prompted'),
		'#type' => 'checkboxes',
		'#options' => $columns,
		'#default_value' => get_selected_columns_by_sql_where($columns, $dataset['sql_where']),
	);
	
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'xdata_adaptor/dataset');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	
	return $form;
}


function xdata_dataset_edit_submit($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$id = $entry['id'];
	$sql_where = "";
	$length = count($form['edit']['is_prompted']['#value']);
	$i = 0;
	foreach ($form['edit']['is_prompted']['#value'] as $key) {
		$column = $form['edit']['is_prompted']['#options'][$key];
		$sql_where = $sql_where. $column;
		$i++;
		$sql_where = ($i < $length)? ($sql_where. " is_prompted AND\r\n"): ($sql_where. " is_prompted\r\n");
	} 
	
	db_update('xdata_adaptor_dataset')
		->fields(
			array(
				'sql_where' => $sql_where,
				'timestamp' => time(),
			)
		)
		->condition('id', $id, '=')
		->execute();
	
	xdata_page_update_reports_simbaxml_by_dataset($id);
	drupal_goto('xdata_adaptor/dataset');
}


function xdata_get_data_by_sql($sql_script,$dataset_id,$max_rows=1000){
	$data = array();
	$databaseInterfaces = array('mysql','oracle','mssql');
	$sql_script = str_replace(':PQ',"'%'",$sql_script);
	$interface = db_query('SELECT i.* 
			FROM {xdata_adaptor_interface} i,
			{xdata_adaptor_dataset} d
			WHERE i.id = d.interface_id AND 
			d.id = :dataset_id', 
		array(
			':dataset_id' => $dataset_id
		)
	)->fetchAssoc();
	if (empty($interface) || !in_array($interface['type'],$databaseInterfaces)) {
		global $databases;
		$db = $databases['default']['default'];
		$interface = array(
			'type' => $db['driver'],
			'connection_string' => $db['host']. ":". (($db['port'] == '')? '3306': $db['port']),
			'default_database' => $db['database'],
			'username' => $db['username'],
			'passwd' => base64_encode($db['password']),						
		);		
	}
	
	switch ($interface['type']) {
		case 'mysql':
			$connect = $interface['connection_string'];
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];
			$link = mysql_connect($connect, $username, $password);
			if (!$link) {
				return "MySQL Connect Error: ". mysql_error();
			}
			else {
				if (!mysql_select_db($database, $link)) {
					$error_msg = mysql_error();
					mysql_close($link);
					return "MySQL Select DB Error: ". $error_msg;
				}
				else {
					$result = mysql_query($sql_script, $link);
					if (!$result) {
						$error_msg = mysql_error();
						mysql_close($link);
						return "MySQL SQL Error: ". $error_msg;
					}
					else {
						$rows = array();
						$i = 0;
						while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
							$newRow = array();
							foreach($row as $k => $v){
								$k = strtolower(str_replace(' ','_',$k));
								if(is_null($v)) $v = '(NULL)';
								if($v=='') $v = '(BLANK)';
								$newRow[$k] = $v;
							}
							$rows[] = $newRow;
							if($i >= $max_rows) break;
							$i ++;
						}
						mysql_close($link);
						return $rows;
						// return 'success';
					}
				}
			}
			break;
		case 'oracle':
			$connect = $interface['connection_string'];
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$link = oci_connect($username, $password, $connect);
			if (!$link) {
				$e = oci_error();
				return "Oracle Connect Error: ". $e['message'];
			}
			else {
				$stmt = oci_parse($link, $sql_script);
				$result = oci_execute($stmt);
				if (!$result) {
					$e = oci_error($stmt);
					$error_msg = $e['message'];
					oci_close($link);
					return "Oracle SQL Error: ". $error_msg;
				}
				else {
					$nrows = oci_fetch_all($stmt, $result);
					oci_close($link);
					$keys = array_keys($result);
					for($i=0;$i<$nrows;$i++){
						foreach($keys as $k){
							$v = $result[$k][$i];
							if(is_null($v)) $v = '(NULL)';
							if($v=='') $v = '(BLANK)';
							$rows[$i][strtolower($k)] = $v;
							// $rows[$i][strtolower($k)] = $result[$k][$i];
						}
						if($i >= $max_rows) break;
					}
					return $rows;
					// return 'success';
				}
			}
			break;
		case 'mssql':
			$sql_script = str_replace(' TIMESTAMP ', ' ',$sql_script);
			$connect = $interface['connection_string']; 
			$username = $interface['username'];
			$password = base64_decode($interface['passwd']);
			$database = $interface['default_database'];
			$link = mssql_connect($connect, $username, $password);
			if (!$link) {
				return "MSSQL Connect Error: Could not connect to the server!";
			}
			else {
				if (!mssql_select_db($database, $link)) {
					mssql_close($link);
					return "MSSQL Select DB Error: Could not select a database.";
				}
				else {
					$result = mssql_query($sql_script,$link,$max_rows);
					if (!$result) {
						return "MySQL SQL Error: Please check your sql script.";
					}
					else {
						$rows = array();
						while ($row = mssql_fetch_assoc($result)) {
							$newRow = array();
							foreach($row as $k => $v){
								$k = strtolower(str_replace(' ','_',$k));
								if(is_null($v)) $v = '(NULL)';
								if(trim($v)=='') $v = '(BLANK)';
								$newRow[$k] = $v;
							}
							$rows[] = $newRow;
						}
						mssql_close($link);
						return $rows;
						// return 'success';
					}
				}
			}
			break;
	}
}
?>
