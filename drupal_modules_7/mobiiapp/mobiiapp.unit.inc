<?php
function get_units() {
	$re = db_query('SELECT m.unit_id, m.unit_name FROM {mobiiapp_unit} m');		
	$units = array();
	foreach($re as $row) {
		$units[$row->unit_id] = $row->unit_name;
	}
	
	return $units;	
}


function get_unit($unit_id = null, $unit_name = null) {
	if ($unit_id != null) {
		$unit = db_query(
					'SELECT * FROM {mobiiapp_unit} WHERE unit_id = :unit_id', 
					array(':unit_id' => $unit_id)
				)->fetchAssoc();
		return $unit;
	}
	else if ($unit_name != null) {
		$unit = db_query(
					'SELECT * FROM {mobiiapp_unit} WHERE unit_name = :unit_name', 
					array(':unit_name' => $unit_name)
				)->fetchAssoc();
		return $unit;
	}
	else {
		return null;
	}
}


function get_unit_by_uid($uid) {
	$unit = db_query('SELECT mc.* 
							FROM {mobiiapp_unit} mc 
								INNER JOIN {mobiiapp_units_users} mcu 
								ON mcu.unit_id = mc.unit_id 
							WHERE mcu.uid = :uid', array(':uid' => $uid))->fetchAssoc();
	return $unit;
}


function is_unit_empty($unit_id, $unit_name, $self = false) {
	$user_query = 'SELECT count(mcu.uid) 
					FROM {mobiiapp_units_users} mcu 
					WHERE mcu.unit_id = :unit_id';
	$user_count = db_query($user_query, array(':unit_id' => $unit_id))->fetchField();
	
	$unit_name = '%@'. $unit_name;
	$role_query = 'SELECT count(r.rid)  
					FROM {role} r 
					WHERE r.name like :unit_name';
	$role_count = db_query($role_query, array(':unit_name' => $unit_name))->fetchField();
	
	$catalog_query = 'SELECT count(c.id) 
						FROM {mobiiapp_catalog} c 
						WHERE c.unit_id = :unit_id';
	$catalog_count = db_query($catalog_query, array(':unit_id' => $unit_id))->fetchField();
	
	$membership_query = 'SELECT count(m.membership_no) 
						FROM {mobiiapp_membership} m
						WHERE m.unit_id = :unit_id';
	$membership_count = db_query($membership_query, array(':unit_id' => $unit_id))->fetchField();
	
	$bill_query = 'SELECT count(b.bill_no) 
					FROM {mobiiapp_bill} b
					WHERE b.unit_id = :unit_id';
	$bill_count = db_query($bill_query, array(':unit_id' => $unit_id))->fetchField();
	
	$interface_count = 0;
	$adaptors = get_adaptors();
	foreach ($adaptors as $adaptor) {
		$count_interface_funct = 'count_'. $adaptor. '_interface_by_unit_id';
		$count = $count_interface_funct($unit_id);
		$interface_count = $interface_count + $count;
	}
	
	if (!$self) {
		$empty = (($user_count == 0) && 
					($role_count == 0) && 
					($catalog_count == 0) &&
					($membership_count == 0) &&
					($bill_count == 0) &&	
					($interface_count == 0))? true: false;
	}
	else {
		$empty = (($role_count == 0) && 
					($catalog_count == 0) &&
					($membership_count == 0) &&
					($bill_count == 0) &&	
					($interface_count == 0))? true: false;
	}
	
	return $empty;	
}


/**
 * List mobiiapp_unit_form.
 *
 */
function mobiiapp_unit_form($form, &$form_state) {
	global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);

	if ($is_super_admin) {
		$header = array(
			'unit_name' => array('field' => 'unit_name', 'data' => t('Group')),
			// 'address' => array('field' => 'address', 'data' => t('Address')),
			// 'web_site' => array('field' => 'web_site', 'data' => t('Web Site')),
			'description' => array('field' => 'description', 'data' => t('Description')),
			'operations' => array('data' => t('Operations'), 'colspan' => 2),
		);

		$result = db_select('mobiiapp_unit', 's')
			->extend('TableSort')
			->extend('PagerDefault')->limit(20)
			->fields('s')
			->orderByHeader($header)
			->execute();
		
		$disableds = array();
		$options = array();
		foreach ($result as $row) {
			$entry = serialize(
						array(
							'unit_id' => $row->unit_id, 
							'unit_name' => $row->unit_name,
							'description' => $row->description,
							// 'address' => $row->address,
							// 'web_site' => $row->web_site,
						)
					);
			$query = array('query' => array('entry' => $entry));
			
			$edit = l(t('edit'), 'mobiiapp/unit/edit', $query);

			$options[$row->unit_id] = array(
				'unit_name' => array('data' => $row->unit_name, 'width' => '30%'),
				// 'address' => array('data' => $row->address, 'width' => '20%'),
				// 'web_site' => array('data' => $row->web_site, 'width' => '20%'),
				'description' => array('data' => $row->description, 'width' => '60%'),
				'operations' => array('data' => $edit, 'width' => '10%'),
			);
			
			if (!is_unit_empty($row->unit_id, $row->unit_name)) {
				$disableds[] = $row->unit_id;
			}
		}

		$form['submit'] = array(
			'#type' => 'submit',
			'#value' => t('Delete'),
			'#prefix' => '<div class="container-inline">',
		);

		$add = l(t('Add Group'), 'mobiiapp/unit/add');		
		$form['add'] = array(
			'#type' => 'item',
			'#title' => "<b>$add</b>",
			'#suffix' => '</div>',
		);

		$form['mobiiapp_unit_table'] = array(
			'#type' => 'tableselect',
			'#header' => $header,
			'#options' => $options,
			'#empty' => t('No records found'),
		);
		
		foreach ($disableds as $unit_id) {
			$form['mobiiapp_unit_table'][$unit_id]['#disabled'] = true;
		}
		
		$form['pager'] = array('#theme' => 'pager');
		return $form;
	}
	else {
		$unit = get_unit_by_uid($user->uid);
		
		$form['edit'] = array(
			'#type' => 'fieldset',
			'#title' => t('Edit Group Information'),
		);
		$form['edit']['unit_id'] = array(
			'#type' => 'value',
			'#value' => $unit['unit_id'],
		);
		$form['edit']['unit_name'] = array(
			'#title' => t('Group'),
			'#type' => 'textfield',
			'#description' => t('The group name of the list/form.'),
			'#default_value' => $unit['unit_name'],		
			'#required' => TRUE,
		);
		$form['edit']['description'] = array(
			'#title' => t('Description'),
			'#type' => 'textarea',
			'#rows' => 6,
			'#description' => t('Please describe the group.'),
			'#default_value' => $unit['description'],
		);
		// $form['edit']['address'] = array(
			// '#title' => t('Address'),
			// '#type' => 'textarea',
			// '#rows' => 6,
			// '#description' => t('The address of the group.'),
			// '#default_value' => $unit['address'],
		// );
		// $form['edit']['web_site'] = array(
			// '#title' => t('Web Site'),
			// '#type' => 'textfield',
			// '#description' => t('The web site of the group.'),
			// '#default_value' => $unit['web_site'],	
		// );
		$form['submit'] = array(
			'#value' => t('Save'),
			'#type' => 'submit',
		);
		$form['delete'] = array(
			'#value' => t('Delete'),
			'#type' => 'submit',
			'#disabled' => !is_unit_empty($unit['unit_id'], $unit['unit_name'], true),
		);

		return $form;
	}
}


/**
 * Validate mobiiapp_unit_form submissions.
 *
 */
function mobiiapp_unit_form_validate($form, &$form_state) {
	global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	
	if ($is_super_admin) {
		$selected_count = count(array_filter($form_state['values']['mobiiapp_unit_table']));
		
		if ($selected_count == 0) {
			form_set_error('', t('Please choose the operation.'));
		}
	}
	else {
		$unit = get_unit_by_uid($user->uid);
		$name = $form_state['values']['unit_name'];
		if ($name != $unit['unit_name']){
			$unit_id = $form_state['values']['unit_id'];
			$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name and unit_id <> :unit_id';
			$existed = db_query($query, array(':unit_name' => $name, ':unit_id' => $unit_id))->fetchField();

			if ($existed != 0) {
				form_set_error('name', t('The group name has existed already.'));
			}
		}
	}
}


/**
 * process mobiiapp_unit_form submissions.
 */
function mobiiapp_unit_form_submit($form, &$form_state) {
	global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	
	if ($is_super_admin) {
		$cids = array();

		foreach (array_filter($form_state['values']['mobiiapp_unit_table']) as $unit_id => $value) {
			$cids[] = $unit_id;
		}

		drupal_goto('mobiiapp/unit/delete', array('query' => array('cids' => serialize($cids))));
	}
	else {
		$unit_id = $form_state['values']['unit_id'];
		$name = $form_state['values']['unit_name'];
		// $address = $form_state['values']['address'];
		// $web_site = $form_state['values']['web_site'];
		$description = $form_state['values']['description'];
		
		switch($form_state['values']['op']) {
			case t('Save'):
				$update = db_update('mobiiapp_unit')
					->fields(array(
							'unit_name' => $name, 
							// 'address' => $address,
							// 'web_site' => $web_site, 
							'description' => $description))
					->condition('unit_id', $unit_id)
					->execute();
					
				$form_state['redirect'] = 'mobiiapp/unit';
				break;
			case t('Delete'):
				db_delete('mobiiapp_units_users')
					->condition('unit_id', $unit_id, '=')
					->execute();
				
				db_delete('mobiiapp_unit')
					->condition('unit_id', $unit_id, '=')
					->execute();
				
				$roles = array();
				user_save($user, array('roles' => $roles), 'account');
				
				$form_state['redirect'] = '/';
				break;
		}
	}
}


function mobiiapp_unit_delete_confirm($form, &$form_state) {
	$form['#submit'][] = 'mobiiapp_unit_delete_confirm_submit';
	return confirm_form($form,
		t('Are you sure you want to delete these items?'),
		'mantis_adaptor/controller',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
}


function mobiiapp_unit_delete_confirm_submit($form, &$form_state) {	
	$unit_ids = unserialize($_GET['cids']);

	foreach ($unit_ids as $unit_id) {
		$query = 'SELECT s.unit_name FROM {mobiiapp_unit} s WHERE unit_id = :unit_id';
		$unit_name = db_query($query, array(':unit_id' => $unit_id))->fetchField();
		
		db_delete('mobiiapp_unit')
		  ->condition('unit_id', $unit_id, '=')
		  ->execute();

		drupal_set_message(t('The item "unit = '. $unit_name. '" has been successfully deleted'));
	}
	
	$form_state['redirect'] = 'mobiiapp/unit';
}


function mobiiapp_unit_add($form, &$form_state) {
	$form['add'] = array(
		'#type' => 'fieldset',
		'#title' => t('Group Information'),
	);
	$form['add']['unit_name'] = array(
		'#title' => t('Group'),
		'#type' => 'textfield',
		'#required' => TRUE,
	);
	$form['add']['description'] = array(
		'#title' => t('Description'),
		'#type' => 'textarea',
		'#rows' => 6,
		'#description' => t('Please describe the group.'),
	);
	// $form['add']['address'] = array(
		// '#title' => t('Address'),
		// '#type' => 'textarea',
		// '#rows' => 6,
		// '#description' => t('The address of the group.'),
	// );
	// $form['add']['web_site'] = array(
		// '#title' => t('Web Site'),
		// '#type' => 'textfield',
		// '#description' => t('The web site of the group.'),
	// );
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit',
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'mobiiapp/unit');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


/**
 * mobiiapp_unit_add form submissions.
 *
 */
function mobiiapp_unit_add_validate($form, &$form_state) {
	$unit_name = $form_state['values']['unit_name'];
	
	$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name';
	$existed = db_query($query, array(':unit_name' => $unit_name))->fetchField();
		
	if ($existed != 0) {
		form_set_error('unit_name', t('The group name has existed already.'));
	}
}


function mobiiapp_unit_add_submit($form, &$form_state) {
	$unit_name = $form_state['values']['unit_name'];
	// $address = $form_state['values']['address'];
	// $web_site = $form_state['values']['web_site'];
	$description = $form_state['values']['description'];

	$unit_id = db_insert('mobiiapp_unit')
		->fields(array(
			'unit_name' => $unit_name, 
			// 'address' => $address,
			// 'web_site' => $web_site,
			'description' => $description))
		->execute();

	drupal_set_message(t($unit_name. '" has been added successfully.'));

	$form_state['redirect'] = 'mobiiapp/unit';

}


function mobiiapp_unit_edit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
		
	$form['edit'] = array(
		'#type' => 'fieldset',
		'#title' => t('Group Information'),
	);
	$form['edit']['unit_id'] = array(
		'#type' => 'value',
		'#value' => $entry['unit_id'],
	);
	$form['edit']['unit_name'] = array(
		'#title' => t('Group'),
		'#type' => 'textfield',
		'#description' => t('The group name of the list/form.'),
		'#default_value' => $entry['unit_name'],		
		'#required' => TRUE,
	);
	$form['edit']['description'] = array(
		'#title' => t('Description'),
		'#type' => 'textarea',
		'#rows' => 6,
		'#description' => t('Please describe the group.'),
		'#default_value' => $entry['description'],
	);
	// $form['edit']['address'] = array(
		// '#title' => t('Address'),
		// '#type' => 'textarea',
		// '#rows' => 6,
		// '#description' => t('The address of the group.'),
		// '#default_value' => $entry['description'],
	// );
	// $form['edit']['web_site'] = array(
		// '#title' => t('Web Site'),
		// '#type' => 'textfield',
		// '#description' => t('The web site of the group.'),
		// '#default_value' => $entry['web_site'],	
	// );
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit',
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'mobiiapp/unit');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


/**
 * mobiiapp_unit_edit form submissions.
 *
 */
function mobiiapp_unit_edit_validate($form, &$form_state) {
	$name = $form_state['values']['unit_name'];
	$unit_id = $form_state['values']['unit_id'];
	$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name and unit_id <> :unit_id';
	$existed = db_query($query, array(':unit_name' => $name, ':unit_id' => $unit_id))->fetchField();

	if ($existed != 0) {
		form_set_error('name', t('The group name has existed already.'));
	}
}


function mobiiapp_unit_edit_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	
	$name = $form_state['values']['unit_name'];
	// $address = $form_state['values']['address'];
	// $web_site = $form_state['values']['web_site'];
	$description = $form_state['values']['description'];
	
	$unit = db_query(
				'SELECT * FROM {mobiiapp_unit} WHERE unit_id = :unit_id', 
				array(':unit_id' => $unit_id)
			)->fetchAssoc();
	
	$update = db_update('mobiiapp_unit')
		->fields(array(
				'unit_name' => $name, 
				// 'address' => $address,
				// 'web_site' => $web_site, 
				'description' => $description))
		->condition('unit_id', $unit_id)
		->execute();
	
	if ($unit['unit_name'] != $name) {
		mobiiapp_security_roles_update($unit['unit_name'], $name);
	}
	
	$form_state['redirect'] = 'mobiiapp/unit';
 }


?>
