<?php
function is_super_admin_mobiiapp($roles) {
	$perms = user_role_permissions($roles);
	
	$permissions = array();
	foreach ($perms as $perm) {
		foreach ($perm as $permission => $key) {
			$permissions[] = $permission;
		}
	}
	
	return (in_array("super admin mobiiapp", $permissions) || 
			in_array("administrator", $roles));
}


function is_admin_mobiiapp($roles) {
	return is_mobiiapp_permission($roles, "admin mobiiapp");
}


function is_design_mobiiapp($roles) {
	return is_mobiiapp_permission($roles, "design mobiiapp");
}


function is_mobiiapp_permission($roles, $mobiiapp_perm) {
	$perms = user_role_permissions($roles);
	
	$permissions = array();
	foreach ($perms as $perm) {
		foreach ($perm as $permission => $key) {
			$permissions[] = $permission;
		}
	}
	
	return in_array($mobiiapp_perm, $permissions);
}


function mobiiapp_security_user_form($form,&$form_state){
	global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}

	$header = array(
		'name' => array('field' => 'mcuv.name', 'data' => t('Username')),
		'mail' => array('field' => 'mcuv.mail', 'data' => t('Email')),
		'role' => array('data' => t('Role')),
	);
	if ($is_super_admin) {
		$header['unit_name'] = array('field' => 'mcuv.unit_name', 'data' => t('Group'));
		$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	}
	else {
		$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	}

	$select = db_select('mobiiapp_units_users_v', 'mcuv')	
				->extend('TableSort')
				->extend('PagerDefault')->limit(20)
				->fields('mcuv');
	if (!$is_super_admin) {
		$select = $select->condition('mcuv.unit_id', $unit_id, '=');
	}
	$select = $select->orderByHeader($header);
	$result = $select->execute();

	$disabled = false;
	$options = array();
	foreach ($result as $row) {
		$entry = serialize(array('uid' => $row->uid));
		$query = array('query' => array('entry' => $entry));
		
		$roles = array();
		foreach (user_load($row->uid)->roles as $role) {
			if ($role != 'authenticated user') {
				$roles[] = $role;
			}
		}
		
		$edit = l(t('edit'), 'mobiiapp/security/user/edit/', $query);
		
		$options[$row->uid] = array(
			'name' => array('data' => $row->name),
			'mail' => array('data' => $row->mail),
			'role' => array('data' => theme('item_list', array('items' => $roles))),
			'operations' => array('data' => $edit),			
		);
		
		if ($is_super_admin) {			
			$options[$row->uid]['name']['width'] = '10%';
			$options[$row->uid]['mail']['width'] = '25%';
			$options[$row->uid]['role']['width'] = '30%';
			$options[$row->uid]['unit_name'] = array('data' => $row->unit_name, 'width' => '20%');
			$options[$row->uid]['operations']['width'] = '10%';
		}
		else {
			$options[$row->uid]['name']['width'] = '15%';
			$options[$row->uid]['mail']['width'] = '25%';
			$options[$row->uid]['role']['width'] = '50%';
			$options[$row->uid]['operations']['width'] = '10%';
		}
		
		// The user cannot delete hisself/herself.
		if ($row->uid == $user->uid) {
			$disabled = true;
			// $options[$row->uid]['operations']['data'] = '';
		}
	}
         
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Remove'),
		'#prefix' => '<div class="container-inline">',
	);
	$add = l(t('Add User'), 'mobiiapp/security/user/add');		
	$form['add'] = array(
		'#type' => 'item',
		'#title' => "<b>$add</b>",
		'#suffix' => '</div>',
	);
	$form['mobiiapp_users_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	
	if ($disabled) { 
		$form['mobiiapp_users_table'][$user->uid]['#disabled'] = true;  //Disable the user his/herself.
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}
 
 
function mobiiapp_security_user_form_validate($form,&$form_state){
	$selected_count = count(array_filter($form_state['values']['mobiiapp_users_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please choose the items to delete.'));
	}        
}


function mobiiapp_security_user_form_submit($form, &$form_state){
	$uids = array();
	foreach (array_filter($form_state['values']['mobiiapp_users_table']) as $uid => $value){		       
		$uids[] = $uid;;  	   
	} 
	drupal_goto('mobiiapp/security/user/delete', array('query' => array('uids' => serialize($uids))));     
}


function mobiiapp_security_user_add($form, &$form_state) {
	global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);	
	
	$form['add'] = array(
		'#title' => t('Add User'),
		'#type' => 'fieldset',
	);
	$form['add']['name'] = array(
		'#title' => t('Username or Email'),
		'#type' => 'textfield',
		'#description' => t('Please input the username or email to add the user.'),
		'#required' => TRUE,
	);
		
	$units = get_units();
	
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
		'#ajax' => array(
			'callback' => 'roles_checkboxes_callback',
			'wrapper' => 'checkboxs_roles_replace',
		),			
	);
	
	$form['add']['roles'] = array(
		'#title' => t('Roles'),
		'#type' => 'checkboxes',
		'#options' => get_roles_by_unit_name($units[$selected]),
		'#prefix' => '<div id="checkboxs_roles_replace">',
		'#suffix' => '</div>',
	);	
	
	$form['submit'] = array(
		'#value' => t('Add User'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'mobiiapp/security/user');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	return $form;
}


function roles_checkboxes_callback($form, &$form_state) {
	return $form['add']['roles'];
}


function get_roles_by_unit_name($unit) {
	$unit = '%@'. $unit;
	$result = db_query("SELECT r.rid, r.name 
						FROM {role} r
						WHERE r.name like :unit
						OR (
						r.rid in (
								select p.rid 
								from (
									select rid, permission, count(*) 
									from role_permission 
									group by rid 
									having count(*) = 1
								) p 
								where p.permission in ('admin mobiiapp', 'design mobiiapp')							
							)
						)
						ORDER BY r.weight", array(':unit' => $unit));
	$roles = array();
	foreach($result as $row) {
		$roles[$row->rid] = $row->name;
	}
	
	return $roles;
}


/**
 * process mobiiapp_security_user_form submissions.
 */
function mobiiapp_security_user_add_validate($form, &$form_state) {
	$name = $form_state['values']['name'];

	$query = 'SELECT count(u.name) FROM {users} u WHERE name = :name and status = 1';
	$name_existed = db_query($query, array(':name' => $name))->fetchField();
	
	$query = 'SELECT count(u.mail) FROM {users} u WHERE mail = :mail and status = 1';
	$mail_existed = db_query($query, array(':mail' => $name))->fetchField();
	
	if (($name_existed == 0) && ($mail_existed == 0)) {
		form_set_error('name', t("The user doesn't register yet."));
	}
	else {
		$query = 'SELECT count(*) 
					FROM {mobiiapp_units_users_v} mcuv 
					WHERE mcuv.name = :name 
					OR mcuv.mail = :mail';
		$in_unit = db_query($query, array(':name' => $name, ':mail' => $name))->fetchField();
		if ($in_unit != 0) {
			form_set_error('name', t("The user has been assigned to a unit."));
		}
	}
}


function mobiiapp_security_user_add_submit($form, &$form_state) {    
	$name = $form_state['values']['name'];
	
	$uid = db_query(
				'SELECT uid FROM {users} WHERE name = :name OR mail = :mail',
				array(':name' => $name, ':mail' => $name)
				)->fetchField();
	$user = user_load($uid);
	
	$roles = array();
	foreach($form['add']['roles']['#value'] as $rid) {
		$roles[$rid] = $form['add']['roles']['#options'][$rid];
	}

	user_save($user, array('roles' => $roles), 'account');
			
	$unit_id = $form['add']['unit']['#value'];
	
	db_insert('mobiiapp_units_users')
		->fields(array(
			'unit_id' => $unit_id, 
			'uid' => $user->uid))
		->execute();
	
	mobiiapp_security_user_add_broadcast($user, $unit_id);
	
	$form_state['redirect'] = 'mobiiapp/security/user'; 
}


function mobiiapp_security_user_add_broadcast($receiver, $unit_id) {
	$_unit = get_unit($unit_id);
	$unit_name = $_unit['unit_name'];
	
	$module = 'mobiiapp';
	$key = 'user_add_message';
	$language = language_default();
	$send = true;
	
	$params = array();
	$params['name'] = $receiver->name;
	$params['mail'] = $receiver->mail;
	$params['unit_name'] = $unit_name;
	
	global $user;
	$from = $user->mail;

	$to = $receiver->mail;
	$delivered = drupal_mail($module, $key, $to, $language, $params, $from, $send);
	watchdog('mobiiapp', "User Added Broadcast: $receiver->name($receiver->mail) has beed added into unit($unit_name).");
	if ($delivered['result'] == false) {
			watchdog('mobiiapp', "User Added Broadcast: Fail to send the notice '$receiver->name($receiver->mail) has beed added into unit($unit_name)'.");
	}
	
}

  
function mobiiapp_security_user_edit($form, &$form_state){
	$entry = unserialize($_GET['entry']);
	$user = user_load($entry['uid']);	
	
	$form['edit'] = array(
		'#title' => t('User Information'),
		'#type' => 'fieldset',
	);
	$form['edit']['name_mail'] = array(
		'#type' => 'item',
		'#title' => t('Name & E-mail'),
		'#markup' => $user->name. ' &lt;'. $user->mail .'&gt;',
	);
	
	$units = get_units();
	
	if (count($units) == 0) {
		drupal_goto('mobiiapp/unit/add');
	}
	
	$unit = get_unit_by_uid($user->uid);
	$unit_id = $unit['unit_id'];
	$default_value = $unit_id;
			
	$selected = isset($form_state['values']['unit'])? $form_state['values']['unit']: $default_value;
	
	$form['edit']['unit'] = array(
		'#title' => t('Group'),
		'#type' => 'select',
		'#options' => $units,
		'#default_value' => $selected,
		'#disabled' => true,
		'#ajax' => array(
			'callback' => 'unit_dependent_checkboxes_callback',
			'wrapper' => 'checkboxs_roles_replace',
		),
	);
	
	$rids = array();
	foreach ($user->roles as $rid => $role) {
		if ($role != 'authenticated user') {
			array_push($rids, $rid);
		}
	}
	
	$form['edit']['roles'] = array(
		'#title' => t('Roles'),
		'#type' => 'checkboxes',
		'#options' => get_roles_by_unit_name($units[$selected]),
		'#default_value' => $rids,
		'#prefix' => '<div id="checkboxs_roles_replace">',
		'#suffix' => '</div>',
	);
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit', 
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = l(t('Cancel'), 'mobiiapp/security/user');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	return $form;
}


function mobiiapp_security_user_edit_submit($form, &$form_state){
	$entry = unserialize($_GET['entry']);
	$user = user_load($entry['uid']);

	$roles = array();
	foreach($form['edit']['roles']['#value'] as $rid) {
		$roles[$rid] = $form['edit']['roles']['#options'][$rid];
	}

	$user = user_save($user, array('roles' => $roles), 'account');
	
	$form_state['redirect'] = 'mobiiapp/security/user'; 
}
 

function mobiiapp_security_user_delete_confirm($form, &$form_state){
	
	$output = confirm_form($form,
		t('Are you sure you want to remove these users?'),
		'mobiiapp/security/user',
		t('This action cannot be undone.'),
		t('Remove'),
		t('Cancel'));
	
	return $output; 
}


function mobiiapp_security_user_delete_confirm_submit($form, &$form_state){
	$uids = unserialize($_GET['uids']);
	
	$user_names = array();
	foreach ($uids as $uid) {
		$user = user_load($uid);
		user_save($user, array('roles' => array()), 'account');
		$user_names[] = $user->name;
	}
	
	db_delete('mobiiapp_units_users')
		->condition('uid', $uids, 'IN')
		->execute();
	
	// user_delete_multiple($uids);
	
	foreach ($user_names as $user_name) {
		drupal_set_message(t('The user name = '. $user_name. ' has been successfully removed.'));
	}
		
	$form_state['redirect'] = 'mobiiapp/security/user';       
 }


/** 
 * Role management part
 */
function get_roles_by_user($user) {
	$is_super_admin = is_super_admin_mobiiapp($user->roles);	
	
	$roles = array();
	if ($is_super_admin) {
		$units = db_query('SELECT mc.unit_id, mc.unit_name 
							FROM {mobiiapp_unit} mc')->fetchAllAssoc('unit_id');
							
		foreach ($units as $unit) {
			$_roles = get_roles_by_unit_name($unit->unit_name);
			foreach ($_roles as $rid => $name) {
				$roles[$rid] = $name;
			}
		}
	}
	else {
		$unit = get_unit_by_uid($user->uid);
		$roles = get_roles_by_unit_name($unit['unit_name']);
	}

	return $roles;
}
 

function mobiiapp_security_role_form($form, $form_state){
	global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);

	$roles = get_roles_by_user($user);
	
	$form['roles'] = array(
		'#tree' => TRUE,
	);
	$order = 0;
    
	foreach ($roles as $rid => $name) {
		$form['roles'][$rid]['#role'] = (object) array(
			'rid' => $rid,
			'name' => $name,
			'weight' => $order,
		);
		$form['roles'][$rid]['#weight'] = $order;
		$form['roles'][$rid]['weight'] = array(
			'#type' => 'textfield',
			'#title' => t('Weight for @title', array('@title' => $name)),
			'#title_display' => 'invisible',
			'#size' => 4,
			'#default_value' => $order,
			'#attributes' => array('class' => array('role-weight')),
		);
		$order++;
	}
	
	$units = get_units();
	
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
	
	$form['name'] = array(
		'#type' => 'textfield',
		'#title' => t('Role Name'),
		'#title_display' => 'invisible',
		'#size' => 30,
		'#maxlength' => 60,
		'#prefix' => '<div class="container-inline">',
	);
	$form['@'] = array(
		'#type' => 'item',
		'#title' => t('@'),
	);
	$form['unit'] = array(
		'#title' => t('Group'),
		'#type' => 'select',
		'#options' => $units,
		'#default_value' => $selected,
		'#title_display' => 'invisible',
		'#disabled' => !$is_super_admin,			
	);	
	$form['add'] = array(
		'#type' => 'submit',
		'#value' => t('Add role'),
		'#suffix' => '</div>',
		'#validate' => array('mobiiapp_security_role_add_validate'),
		'#submit' => array('mobiiapp_security_role_add_submit'),
	);
	$form['actions'] = array('#type' => 'actions');
	$form['actions']['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Save order'),
		'#submit' => array('mobiiapp_security_role_order_submit'),
	);

	return $form;
}
 

 /**
 * Form submit function. Update the role weights.
 */
function mobiiapp_security_role_order_submit($form, &$form_state) {
	foreach ($form_state['values']['roles'] as $rid => $role_values) {
		$role = $form['roles'][$rid]['#role'];
		$role->weight = $role_values['weight'];
		user_role_save($role);
	}
	drupal_set_message(t('The role settings have been updated.'));
}

 
function theme_mobiiapp_security_role_form($variables){
	$form = $variables['form'];
	$header = array(t('Name'), t('Weight'), t('Operations'));
	$rows = array();
	foreach (element_children($form['roles']) as $rid) {
        $name = $form['roles'][$rid]['#role']->name;
		$entry = serialize(array('rid' => $rid));
		$query = array('query' => array('entry' => $entry));
        
		$row = array();
		
		$roles = array();
		$roles[$rid] = $name;
		if (is_admin_mobiiapp($roles) || is_design_mobiiapp($roles)) {
			$row[] = t('@name <em>(locked)</em>', array('@name' => $name));
			$row[] = drupal_render($form['roles'][$rid]['weight']);
			$row[] = '';
		}
		
		else {
			$row[] = check_plain($name);
			$row[] = drupal_render($form['roles'][$rid]['weight']);
			$row[] = l(t('edit role'), 'mobiiapp/security/roles/edit', $query);
		}
		$rows[] = array('data' => $row, 'class' => array('draggable'));
	}
	$rows[] = array(array('data' => drupal_render($form['name']). drupal_render($form['@']). drupal_render($form['unit']). drupal_render($form['add']), 'colspan' => 3));

	drupal_add_tabledrag('user-roles', 'order', 'sibling', 'role-weight');

	$output = theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'user-roles')));
	$output .= drupal_render_children($form);

	return $output;
}


function mobiiapp_security_role_add_validate($form, &$form_state) {
	$unit_id = $form_state['values']['unit'];
	$unit_name = $form['unit']['#options'][$unit_id];
	$name = $form_state['values']['name'];
	if ($name == '') {
		form_set_error('name', t('The name cannot be blank.'));
	}
	
	$name = $name.'@'.$unit_name;

	$query = 'SELECT count(r.name) FROM {role} r WHERE name = :name';	
	$existed = db_query($query, array(':name' => $name))->fetchField();
	if ($existed != 0) {
		form_set_error('name', t('The role name has been existed already.'));
	}

}
 

function mobiiapp_security_role_add_submit($form, &$form_state) {
	$unit_id = $form_state['values']['unit'];
	$unit_name = $form['unit']['#options'][$unit_id];
	$name = $form_state['values']['name'];
	$name = $name.'@'.$unit_name;

	$role = (object) array('name' => $name);
	user_role_save($role);
	
	$form_state['redirect'] = 'mobiiapp/security/roles'; 
}
 
 
function mobiiapp_security_role_edit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$role = user_role_load($entry['rid']);

	list($role_name, $unit_name) = explode("@", $role->name);

	$form['name'] = array(
		'#type' => 'textfield',
		'#default_value' => $role_name,
		'#required' => TRUE,
		'#prefix' => '<div class="container-inline">',
	);
	$form['@unit'] = array(
		'#type' => 'item',
		'#markup' => '@'. $unit_name,
		'#suffix' => '</div>',
	);
	$form['unit_name'] = array(
		'#type' => 'value',
		'#value' => $unit_name,
	);
	$form['rid'] = array(
		'#type' => 'value',
		'#value' => $role->rid,
	);
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Save role'),
		'#prefix' => '<div class="container-inline">',
	);
	
	$query = 'SELECT count(m.rid) FROM {mobiiapp_catalog_role} m WHERE rid = :rid';
	$role_in_used = (db_query($query, array(':rid' => $role->rid))->fetchField() > 0);
	
	$form['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete role'),
		'#disabled' => $role_in_used,  
		'#submit' => array('mobiiapp_security_role_delete_submit'),
	);
	
	$cancel = l(t('Cancel'), 'mobiiapp/security/roles');		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	); 
	
	return $form; 
}


function mobiiapp_security_role_edit_validate($form, &$form_state) {
	$name = $form_state['values']['name'].'@'.$form_state['values']['unit_name'];
	$rid = $form_state['values']['rid'];
	$role = user_role_load($rid);
	
	if ($name != $role->name) {	
		$query = 'SELECT count(r.name) FROM {role} r WHERE name = :name';	
		$existed = db_query($query, array(':name' => $name))->fetchField();
		if ($existed != 0) {
			form_set_error('name', t('The role name has been existed already.'));
		}
	}
}
 
 
function mobiiapp_security_role_edit_submit($form, &$form_state) {
	$name = $form_state['values']['name'].'@'.$form_state['values']['unit_name'];
	$rid = $form_state['values']['rid'];
	
	$role = (object) array('name' => $name, 'rid' => $rid);
	user_role_save($role);
	
	$form_state['redirect'] = 'mobiiapp/security/roles';
}

 
function mobiiapp_security_role_delete_submit($form, &$form_state) {
	$entry = serialize(array('rid' => $form_state['values']['rid']));
	$query = array('query' => array('entry' => $entry));

	drupal_goto('mobiiapp/security/roles/delete', $query);
}
 

function mobiiapp_security_role_delete_confirm($form, &$form_state){
	$entry = unserialize($_GET['entry']);
	$role = user_role_load($entry['rid']);
	
	return confirm_form($form, 
						t('Are you sure you want to delete the role %name ?', 
							array('%name' => $role->name)), 
						'mobiiapp/security/roles', 
						t('This action cannot be undone.'), 
						t('Delete'));
}


function mobiiapp_security_role_delete_confirm_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$rid = (int)$entry['rid'];
	user_role_delete($rid);
	 
	$form_state['redirect'] = 'mobiiapp/security/roles';       
}


function mobiiapp_security_roles_update($old_unit, $new_unit) {
	$unit = "%@$old_unit";
	$result = db_query("select * from role where name like :unit", array(':unit' => $unit));
	
	foreach ($result as $row) {
		$update = db_update('role')
			->fields(
				array(
					'name' => str_replace($old_unit, $new_unit, $row->name),
					)
				)
			->condition('rid', $row->rid)
			->execute();
	}
}


function mobiiapp_security_user_register_unit_access() {
	global $user;
	 
	if (!is_super_admin_mobiiapp($user->roles) && !in_array('anonymous user', $user->roles)) {
		$query = 'SELECT count(*) 
					FROM {mobiiapp_units_users_v} mcuv 
					WHERE mcuv.uid = :uid';
		$in_unit = db_query($query, array(':uid' => $user->uid))->fetchField();
		if ($in_unit != 0) {
			return false;
		}
		else {
			return true;
		}
	}
	else {
		return false;
	}
}


function mobiiapp_security_user_register_unit($form, &$form_state) {
	global $user;
	
	$register = drupal_map_assoc(array(t('Create New Group'), t('Join an Existed Group')));
	
	$form['unit_description'] = array(
		'#type' => 'item',
		'#markup' => '<h3>Users within a group would share data and information of reports and communicate between each other to speedup decision making. </h3>',
	);
	
	$form['register'] = array(
		'#type' => 'select',
		'#title' => t('Request To'),
		'#options' => $register,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		// '#description' => t('You do not belong to any group.  You can join an existed group or create a new group.'),
	);
		
	$form['join'] = array(
		'#title' => t('Join an Existed Group'),
		'#type' => 'fieldset',
		'#states' => array(
			'visible' => array(
				':input[name="register"]' => array('value' => t('Join an Existed Group')),
			),
		),
	);
	
	$form['join']['unit'] = array(
		'#title' => t('Group'),
		'#type' => 'textfield',
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	
	$form['create'] = array(
		'#title' => t('Create New Group'),
		'#type' => 'fieldset',
		'#states' => array(
			'visible' => array(
				':input[name="register"]' => array('value' => t('Create New Group')),
			),
		),
	);
	$form['create']['unit_name'] = array(
		'#title' => t('Group'),
		'#type' => 'textfield',
		'#description' => t('The group name is required and unique at system.'),
	);
	$form['create']['description'] = array(
		'#title' => t('Description (Optional)'),
		'#type' => 'textarea',
		'#rows' => 6,
		'#description' => t('Please describe the group.'),
	);
	// $form['create']['address'] = array(
		// '#title' => t('Address'),
		// '#type' => 'textarea',
		// '#rows' => 6,
		// '#description' => t('The address of the group.'),
	// );
	// $form['create']['web_site'] = array(
		// '#title' => t('Web Site'),
		// '#type' => 'textfield',
		// '#description' => t('The web site of the group.'),
	// );
	$form['submit'] = array(
		'#value' => t('Submit'),
		'#type' => 'submit',
	);
	
	return $form;
}


function mobiiapp_security_user_register_unit_validate($form, &$form_state) {	
	switch($form_state['values']['register']) {
		case t('Create New Group'): 	
			$unit_name = $form_state['values']['unit_name'];
			if ($unit_name == '') {
				form_set_error('unit_name', t('The group name can not be blank.'));
			}
			
			$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit_name';
			$existed = db_query($query, array(':unit_name' => $unit_name))->fetchField();
				
			if ($existed != 0) {
				form_set_error('unit_name', t('The group name has existed already.'));
			}
			break;
		case t('Join an Existed Group'):
			$unit = $form_state['values']['unit'];
			$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit';
			$existed = db_query($query, array(':unit' => $unit))->fetchField();
			if ($existed == 0) {
				form_set_error('unit', t('The group is not existed.  Please check the administrator of the group.'));
			}
			break;
	}
}


function mobiiapp_security_user_register_unit_submit($form, &$form_state) {
	global $user;
	if ($form_state['values']['register'] == t('Join an Existed Group')) {
		$unit = $form_state['values']['unit'];
		$_unit = get_unit(null, $unit);
		$unit_id = $_unit['unit_id'];
		mobiiapp_security_user_register_unit_broadcast($user, $unit_id);
	}
	else {	
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
		
		db_insert('mobiiapp_units_users')
			->fields(array(
				'unit_id' => $unit_id, 
				'uid' => $user->uid))
			->execute();
		
		$roles = get_roles_by_unit_name($unit_name);
		user_save($user, array('roles' => $roles), 'account');
				
		drupal_set_message(t($unit_name. '" has been added successfully.'));
	}
	
	$form_state['redirect'] = '/';
}


function mobiiapp_security_user_register_unit_broadcast($sender, $unit_id) {
	$unit_name = db_query('SELECT unit_name FROM {mobiiapp_unit} WHERE unit_id = :unit_id', 
							array(':unit_id' => $unit_id))->fetchField();
	
	$module = 'mobiiapp';
	$key = 'register_message';
	$language = language_default();
	$send = true;
	
	$params = array();
	$params['name'] = $sender->name;
	$params['mail'] = $sender->mail;
	$params['unit_name'] = $unit_name;
	
	$from = $sender->mail;
	
	$receivers = array();
	$result = db_query('SELECT uid FROM {mobiiapp_units_users} WHERE unit_id = :unit_id', array(':unit_id' => $unit_id));
	foreach ($result as $row) {
		$roles = isset(user_load($row->uid)->roles)? user_load($row->uid)->roles: array();
		if (is_admin_mobiiapp($roles)) {
			$receivers[] = user_load($row->uid);
		}
	}
	
	$emails = array();
	foreach ($receivers as $receiver) {
		if ($receiver->mail != $from) {
			$emails[] = $receiver->mail;
		}
	}
	
	if (count($emails) > 0) {
		$to = implode(', ', $emails);
		$delivered = drupal_mail($module, $key, $to, $language, $params, $from, $send);
		watchdog('mobiiapp', "Register Broadcast: The register request for unit($unit_name) from $sender->name is sent to $to.");
		drupal_set_message("The join request for unit($unit_name) has been broadcasted to the administrators.");
		if ($delivered['result'] == false) {
				watchdog('mobiiapp', "Register Broadcast: Fail to send the register request for unit($unit_name) from $sender->name to $to.");
		}
	}
	else {
		drupal_set_message(t('There is no administrator at the group.'));
	}
}
?>
