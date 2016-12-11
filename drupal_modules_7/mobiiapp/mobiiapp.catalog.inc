<?php
function back_to_parent_folder($parent_id, $unit_id) {
	$entry = serialize(array('parent_id' => $parent_id, 'unit_id' => $unit_id));
	$query = array('query' => array('entry' => $entry));
	drupal_goto('mobiiapp/catalog/', $query);
}


function is_page_published($adaptor, $cid) {
	$query = 'SELECT count(m.cid) FROM {mobiiapp_catalog} m WHERE adaptor = :adaptor AND cid = :cid';	
	$existed = db_query($query, array(':adaptor' => $adaptor, ':cid' => $cid))->fetchField();
	
	$published = ($existed > 0)? true: false;
	
	return $published;
}


function is_page_active($adaptor, $cid) {
	$query = 'SELECT count(m.cid) FROM {mobiiapp_catalog} m WHERE adaptor = :adaptor AND cid = :cid AND status = 1';	
	$existed = db_query($query, array(':adaptor' => $adaptor, ':cid' => $cid))->fetchField();
	
	$active = ($existed > 0)? true: false;
	
	return $active;
}


function mobiiapp_catalog_form($form, &$form_state) {
    global $user;	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
    
	$units = get_units();
	
	if (count($units) == 0) {
		drupal_goto('mobiiapp/unit/add');
	}
	
	$parent_id = 0;
	$unit_id = '';
	if(isset($_GET['entry'])) {
	    $entry = unserialize($_GET['entry']);
		$parent_id = $entry['parent_id'];
		$unit_id = $entry['unit_id'];
	}
	else {
		if (isset($form_state['values']['parent_id']) && 
				isset($form_state['values']['unit_id'])) {
			$parent_id = $form_state['values']['parent_id'];
			$unit_id = $form_state['values']['unit_id'];
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
	}
	
	$form['parent_id'] = array(
		'#type' => 'value',
		'#value' => $parent_id,
	);
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
			'#prefix' => '<div class="container-inline">',
			'#options' => $units,
			'#default_value' => $selected,
		);
		$form['select_unit']['go'] = array(
			'#type' => 'submit',
			'#value' => t('Go'),
			'#suffix' => '</div>',
			'#submit' => array('mobiiapp_catalog_unit_submit'),
		);
	}	

	$form['table'] = mobiiapp_catalog_list_form($form, $form_state);
	
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Save'),
		'#submit' => array('mobiiapp_catalog_submit'),
	);
	
    return $form;
}


function mobiiapp_catalog_unit_submit($form, &$form_state) {
	$parent_id = 0;
	$unit_id = $form_state['values']['unit'];
	
	back_to_parent_folder($parent_id, $unit_id);
}


function mobiiapp_catalog_submit($form, &$form_state) {
	$parent_id = $form_state['values']['parent_id'];
	$unit_id = $form_state['values']['unit_id'];	
	
	if (isset($form_state['values']['list'])) {
		foreach ($form_state['values']['list'] as $id => $catalog_values) {
			$catalog = $form['table']['list'][$id]['#catalog'];
			$catalog->weight = $catalog_values['weight'];
			$catalog->status = $catalog_values['status'];
			db_update('mobiiapp_catalog')
				->fields(
					array(
						'weight' => $catalog->weight,
						'status' => $catalog->status,
					)
				)
				->condition('id', $id, '=')
				->execute();
			
			//If the status of the folder is changed, 
			//all of its children will be changed as well.
			if ($catalog->type == 'folder') {
				$ids = get_children($id);
				if (count($ids) > 0) {
					db_update('mobiiapp_catalog')
						->fields(
							array(
								'status' => $catalog->status,
							)
						)
						->condition('id', $ids, 'IN')
						->execute();
				}
			}
		}
		drupal_set_message(t('The catalog settings have been updated.'));
	}
	
	back_to_parent_folder($parent_id, $unit_id);
}


function get_directory_path($parent_id, $unit_id, $link = true) {
    $path = '';
	$in_path = true;
	
	do {
		$entry = serialize(array('parent_id' => $parent_id, 'unit_id' => $unit_id));
		$query = array('query' => array('entry' => $entry));
		if ($parent_id == 0) {
			$name = 'Home';
			$folder = ($link)? l(t($name), 'mobiiapp/catalog/', $query): $name;
			$path = $folder. $path;
			$in_path = false;
		}
		else {
			$dir = db_query('SELECT mcl.name, mcl.parent_id 
							FROM {mobiiapp_catalog} mcl 
							WHERE mcl.id = :id', array(':id' => $parent_id))->fetchAssoc();
			
			$name = $dir['name'];
			$folder = ($link)? l(t($name), 'mobiiapp/catalog/', $query): $name;
			$path = '>'. $folder. $path;
			$parent_id = $dir['parent_id'];
		}
	} while ($in_path);
	
	return $path;
}


function mobiiapp_catalog_list_form($form, &$form_state) {    
	if(isset($_GET['entry'])) {
	    $entry = unserialize($_GET['entry']);
		$parent_id = $entry['parent_id'];
		$unit_id = $entry['unit_id'];
	}
	else {
		$parent_id = $form['parent_id']['#value'];
		$unit_id = $form['unit_id']['#value'];
	}
	
	$form['directory'] = array(
		'#type' => 'fieldset',
		'#title' => t('Directory'),
		'#id' => 'directory',	   
	);	
	$form['path'] = array(
		'#type' => 'item',
		'#title' => get_directory_path($parent_id, $unit_id),
		'#id' => 'path',	   
	);					
	
	$catalogs = db_select('mobiiapp_catalog', 'c')
		//->extend('PagerDefault')->limit(10)
		->fields('c')
		->condition('unit_id', $unit_id, '=')
		->condition('parent_id', $parent_id, '=')
		->orderBy('weight')
		->execute();
	
	$form['list'] = array(
		'#tree' => TRUE,
	);
	
	$order = 0;
	foreach ($catalogs as $catalog) {
		$id = $catalog->id;
		$page = ($catalog->type == 'page')? get_page_by_adaptor_cid($catalog->adaptor, $catalog->cid): null;
		$form['list'][$id]['#catalog'] = (object) array(
			'id' => $catalog->id,
			'weight' => $order,
			'name' => $catalog->name,
			'type' => $catalog->type,
			'adaptor' => $catalog->adaptor,
			'cid' => $catalog->cid,
			'page_name' => ($catalog->type == 'page')? $page['name']: '',
			'page_unit_id' => ($catalog->type == 'page')? $page['unit_id']: 0,
			'status' => $catalog->status,			
		);
		$form['list'][$id]['#weight'] = $order;
		$form['list'][$id]['weight'] = array(
			'#type' => 'textfield',
			'#title' => t('Weight for @title', array('@title' => $catalog->name)),
			'#title_display' => 'invisible',
			'#size' => 4,
			'#default_value' => $order,
			'#attributes' => array('class' => array('list-weight')),
		);
		
		//It can be activated only if the page is generated.
		// $disabled = false;
		// if ($catalog->type == 'page') {
			// $generated = is_page_generated_by_adaptor($catalog->adaptor, $catalog->cid);
			// $disabled = !$generated;
		// }
		$options = array('blocked', 'active');
		$form['list'][$id]['status'] = array(
			'#title' => t('Status'),
			'#title_display' => 'invisible',
			'#type' => 'radios',
			'#options' => $options,
			// '#disabled' => $disabled,
			'#default_value' => variable_get('type', $catalog->status),
		);		
		$order++;
	}
	
	$form['type'] = array(
		'#title' => t('Type'),
		'#type' => 'select',
		'#options' => (($parent_id != 0)? drupal_map_assoc(array(t('folder'), t('page'))): drupal_map_assoc(array(t('folder')))),
		'#title_display' => 'invisible',
		'#prefix' => '<div class="container-inline">',
	);
	
	$adaptors = get_adaptors();
	if (count($adaptors) > 0) {
		$default_value = key($adaptors);			
		$selected = isset($form_state['values']['adaptor'])? $form_state['values']['adaptor']: $default_value;	
		$form['adaptor'] = array(
			'#title' => t('Adaptor'),
			'#type' => 'select',
			//'#title_display' => 'invisible',
			'#options' =>$adaptors,
			'#default_value' => $selected,
			'#states' => array(
				'visible' => array(
					':input[name="type"]' => array('value' => t('page')),
				),
			),
			'#ajax' => array(
				'callback' => 'adaptor_select_callback',
				'wrapper' => 'select_pages_replace',
			),
		);
		
		$form['page'] = array(
			'#title' => t('Page'),
			'#type' => 'select',
			//'#title_display' => 'invisible',
			'#options' => get_pages_by_adaptor_unit_id($adaptors[$selected], $unit_id),
			'#states' => array(
				'visible' => array(
					':input[name="type"]' => array('value' => t('page')),
				),
			),
			'#prefix' => '<div id="select_pages_replace">',
			'#suffix' => '</div>',
		);
	}
	
	$form['name'] = array(
		'#type' => 'textfield',
		'#title' => t('Name'),
		'#title_display' => 'invisible',
		'#size' => 30,
		'#maxlength' => 60,
		'#states' => array(
			'visible' => array(
				':input[name="type"]' => array('value' => t('folder')),
			),
		),
	);
	$form['add'] = array(
		'#type' => 'submit',
		'#value' => t('Add'),
		'#suffix' => '</div>',
		'#validate' => array('mobiiapp_catalog_add_validate'),
		'#submit' => array('mobiiapp_catalog_add_submit'),
	);

	$form['#theme'] = 'mobiiapp_catalog_list_form';
	
	return $form;
}


function adaptor_select_callback($form, &$form_state) {
	return $form['table']['page'];
}


function get_pages_by_adaptor_unit_id($adaptor, $unit_id) {	
	$get_pages_by_unit_id = 'get_'. $adaptor. '_pages_by_unit_id';
	$pages = $get_pages_by_unit_id($unit_id);
	return $pages;
}


function get_page_by_adaptor_cid($adaptor, $cid) {	
	$get_page_by_cid = 'get_'. $adaptor. '_page_by_cid';
	$page = $get_page_by_cid($cid);

	return $page;
}


function is_page_generated_by_adaptor($adaptor, $cid) {
	$is_page_generated = 'is_'. $adaptor. '_page_generated';
	$generated = $is_page_generated($cid);

	return $generated;
}


function theme_mobiiapp_catalog_list_form($variables) {
	$form = $variables['form'];
	$header = array(
		'name' => array('data' => t('Name')),
		'weight' => array('data' => t('Weight')),
		'status' => array('data' => t('Status')),
		'roles' => array('data' => t('Roles')),
		'operations' => array('data' => t('Operations'), 'colspan' => 1),
	);
	$parent_id = $form['parent_id']['#value'];
	$unit_id = $form['unit_id']['#value'];
	
	$rows = array();
	foreach (element_children($form['list']) as $id) {
        $name = $form['list'][$id]['#catalog']->name;
        $type = $form['list'][$id]['#catalog']->type;
		$adaptor = $form['list'][$id]['#catalog']->adaptor;
		$cid = $form['list'][$id]['#catalog']->cid;
		$page_name = $form['list'][$id]['#catalog']->page_name;
		$page_unit_id = $form['list'][$id]['#catalog']->page_unit_id;
		$status = $form['list'][$id]['#catalog']->status;
		
		$row = array();	
        if($type == 'folder') {
			$entry = serialize(array('parent_id' => $id, 'unit_id' => $unit_id));
			$query = array('query' => array('entry' => $entry));		
			$row[] = array('data' => l(t($name), 'mobiiapp/catalog/', $query), 'width' => '30%');
		}
		else {
			if ($unit_id == $page_unit_id) {
				$entry = serialize(array('cid' => $cid, 'name' => $page_name));
				$query = array('query' => array('entry' => $entry));
				$row[] = array(
							'data' => check_plain($name). 
										'</br>Adaptor: '. 
										l(t($adaptor), $adaptor.'_adaptor/page/display', $query), 
							'width' => '25%',
						);
			}
			else {
				$_unit = get_unit($page_unit_id);
				$unit_name = $_unit['unit_name'];
				
				$row[] = array(
							'data' => check_plain($name). '</br>Shared by Unit ('. $unit_name. ').', 
							'width' => '25%',
						);
			}
		}
		$row[] = array('data' => drupal_render($form['list'][$id]['weight']), 'width' => '10%');
		$row[] = array('data' => drupal_render($form['list'][$id]['status']), 'width' => '10%');
		$row[] = array('data' => theme('item_list', array('items' => get_roles_by_catalog_id($id))), 'width' => '30%');
		
		$entry = serialize(
						array(
							'parent_id' => $parent_id,
							'unit_id' => $unit_id,
							'name' => $name,
							'id' => $id,
							'type' => $type,
							'adaptor' => $adaptor,
							'cid' => $cid,
						)
					);
		$query = array('query' => array('entry' => $entry));
		$edit = l(t('edit'), 'mobiiapp/catalog/edit', $query);
		$roles = l(t('roles'), 'mobiiapp/catalog/roles', $query);		
		$ops = $edit. '&nbsp;|&nbsp;'. $roles;
		if($type == 'page') {
			$comments = l(t('comments'), 'mobiiapp/catalog/comments', $query);
			$ops .= '&nbsp;|&nbsp;'. $comments;
		}
		
		$row[] = array('data' => $ops, 'width' => '20%');
		
		$rows[] = array('data' => $row, 'class' => array('draggable'));
	}
	
	$rows[] = array(
				array(
					'data' => drupal_render($form['type']).
							drupal_render($form['adaptor']).
							drupal_render($form['page']).
							drupal_render($form['name']). 
							drupal_render($form['add']), 
					'colspan' => 5));	

	drupal_add_tabledrag('catalog-list', 'order', 'sibling', 'list-weight');
	$table = theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'catalog-list')));
	
	$form['directory']['#children'] = drupal_render($form['path']). $table;
	$output = drupal_render($form['directory']);

	return $output;
}


function mobiiapp_catalog_add_validate($form, &$form_state) {
	if(isset($_GET['entry'])) {
	    $entry = unserialize($_GET['entry']);
		$parent_id = $entry['parent_id'];
		$unit_id = $entry['unit_id'];
	}
	else {
		$parent_id = $form_state['values']['parent_id'];
		$unit_id = $form_state['values']['unit_id'];
	}
	
	$type = $form_state['values']['type'];
	
	switch ($type) {
		case 'folder':
			$name = $form_state['values']['name'];
			if ($name == '') {
				form_set_error('name', t('The name cannot be blank.'));
			}
			break;
		case 'page':
			$cid = $form_state['values']['page'];
			$name = $form['table']['page']['#options'][$cid];
			break;
	}
	
	$query = 'SELECT count(*)
				FROM {mobiiapp_catalog} mcl
				WHERE mcl.parent_id = :parent_id
				AND mcl.unit_id = :unit_id
				AND mcl.name = :name
				AND mcl.type = :type';
	$existed = db_query($query, array(':parent_id' => $parent_id, 
										':unit_id' => $unit_id,
										':name' => $name,
										':type' => $type))->fetchField();
	if ($existed != 0) {
		switch ($type) {
			case 'folder':
				form_set_error('name', t("The folder name has been existed already."));
				break;
			case 'page':
				form_set_error('page', t("The page has been published already."));
				break;
		}
	}
}


function mobiiapp_catalog_add_submit($form, &$form_state) {
	if(isset($_GET['entry'])) {
	    $entry = unserialize($_GET['entry']);
		$parent_id = $entry['parent_id'];
		$unit_id = $entry['unit_id'];
	}
	else {
		$parent_id = $form_state['values']['parent_id'];
		$unit_id = $form_state['values']['unit_id'];
	}
	
	$type = $form_state['values']['type'];
	
	switch ($type) {
		case 'folder':
			$name = $form_state['values']['name'];
			db_insert('mobiiapp_catalog')
				->fields(
					array(
						'name' => $name,
						'parent_id' => $parent_id,
						'unit_id' => $unit_id,
						'type' => $type,
						'status' => 1,
						'weight' => 0,
						'timestamp' => time(),
					))
				->execute();
			break;
		case 'page':
			$adaptors = get_adaptors();
			$adaptor = $adaptors[$form_state['values']['adaptor']];
			$cid = $form_state['values']['page'];
			$name = $form['table']['page']['#options'][$cid];
			db_insert('mobiiapp_catalog')
				->fields(
					array(
						'name' => $name,
						'parent_id' => $parent_id,
						'unit_id' => $unit_id,
						'type' => $type,
						'status' => 1,
						'weight' => 0,
						'adaptor' => $adaptor,
						'cid' => $cid,
						'timestamp' => time(),
					))
				->execute();
			break;
	}	
	
	back_to_parent_folder($parent_id, $unit_id);
}


function mobiiapp_catalog_edit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];
	$id = $entry['id'];
	$name = $entry['name'];
	$type = $entry['type'];
	$adaptor = $entry['adaptor'];
	$cid = $entry['cid'];
	
	switch ($type) {
		case 'folder':
			$form['name'] = array(
				'#title' => t('Folder'),
				'#type' => 'textfield',
				'#default_value' => $name,
				'#size' => 30,
				'#required' => TRUE,
				'#maxlength' => 64,
				'#description' => t('The name for the folder.'),
			);
			break;
		case 'page':
			$form['page'] = array(
				'#title' => t('Page'),
				'#type' => 'select',
				'#options' => get_pages_by_adaptor_unit_id($adaptor, $unit_id),
				'#default_value' => $cid,
				'#description' => t('The name for the page.'),
			);
			break;
	}	
	
	$form['submit'] = array(
		'#type' => 'submit',
		'#value' => t('Save'),
		'#prefix' => '<div class="container-inline">',
	);
	$form['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
		'#submit' => array('mobiiapp_catalog_delete_submit'),
	);	
	$cancel = mobiiapp_catalog_cancel($parent_id, $unit_id);		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);

	return $form; 
}


function mobiiapp_catalog_edit_validate($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];
	$id = $entry['id'];
	$type = $entry['type'];
	
	if ($form_state['values']['op'] == t('Save')) {	
		switch ($type) {
			case 'folder':
				$name = $form_state['values']['name'];
				// if ($name == '') {
					// form_set_error('name', t('The name cannot be blank.'));
				// }
				break;
			case 'page':
				$cid = $form_state['values']['page'];
				$name = $form['page']['#options'][$cid];
				break;
		}
		
		$catalog = db_query('SELECT mcl.name, mcl.type 
							FROM {mobiiapp_catalog} mcl 
							WHERE mcl.id = :id', array(':id' => $id))->fetchAssoc();
		
		if ($catalog['name'] != $name) {	
			$query = 'SELECT count(*)
						FROM {mobiiapp_catalog} mcl
						WHERE mcl.parent_id = :parent_id
						AND mcl.unit_id = :unit_id
						AND mcl.name = :name
						AND mcl.type = :type';
			$existed = db_query($query, array(':parent_id' => $parent_id, 
												':unit_id' => $unit_id,
												':name' => $name,
												':type' => $catalog['type']))->fetchField();
			if ($existed != 0) {	
				switch ($type) {
					case 'folder':
						form_set_error('name', t("The folder name has been existed already."));
						break;
					case 'page':
						form_set_error('page', t("The page has been published already."));
						break;
				}
			}
		}
	}
}


function mobiiapp_catalog_cancel($parent_id, $unit_id) {
	$entry = serialize(
				array(
					'parent_id' => $parent_id, 
					'unit_id' => $unit_id
				)
			);
	$query = array('query' => array('entry' => $entry));
	$cancel = l(t('Cancel'), 'mobiiapp/catalog', $query);
	
	return $cancel;
}


function mobiiapp_catalog_edit_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];
	$id = $entry['id'];
	$type = $entry['type'];
	
	switch ($type) {
		case 'folder':
			$name = $form_state['values']['name'];
			$update = db_update('mobiiapp_catalog')
				->fields(
					array(
						'name' => $name, 
						'timestamp' => time(),
					))
				->condition('id', $id)->execute();
			break;
		case 'page':
			$cid = $form_state['values']['page'];
			$name = $form['page']['#options'][$cid];		
			$update = db_update('mobiiapp_catalog')
				->fields(
					array(
						'name' => $name,
						'cid' => $cid,
						'timestamp' => time(),
					))
				->condition('id', $id)->execute();			
			break;
	}	
	
	back_to_parent_folder($parent_id, $unit_id);
}


function mobiiapp_catalog_delete_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];
	$id = $entry['id'];
	$type = $entry['type'];
	
	switch ($type) {
		case 'folder':
			$name = $form_state['values']['name'];
			if ($name == '') {
				form_set_error('name', t('The name cannot be blank.'));
			}
			break;
		case 'page':
			$cid = $form_state['values']['page'];
			$name = $form['page']['#options'][$cid];
			break;
	}
	
	$entry = serialize(
				array(
					'parent_id' => $parent_id,
					'unit_id' => $unit_id,
					'name' => $name,
					'type' => $type,
					'id' => $id,
				)
			);

	$query = array('query' => array('entry' => $entry));
	drupal_goto('mobiiapp/catalog/delete', $query);
}


function mobiiapp_catalog_delete_confirm($form, &$form_state){
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];	
	$name = $entry['name'];
	$type = $entry['type'];
	
	$entry = serialize(array('parent_id' => $parent_id, 'unit_id' => $unit_id));
	
	return confirm_form($form, 
						t('Are you sure you want to delete the %type "%name" ?', 
							array('%type' => $type, '%name' => $name)), 
						array('path' => 'mobiiapp/catalog/', 'query' => array('entry' => $entry)), 
						t('This action cannot be undone.'), 
						t('Delete'));
}


function mobiiapp_catalog_delete_confirm_submit($form, &$form_state){
	$entry = unserialize($_GET['entry']);
	$parent_id = $entry['parent_id'];
	$unit_id = $entry['unit_id'];
	$id = $entry['id'];
	
	$catalog_ids = array();
	if (has_child($id)) {
		$child_ids = get_children($id);
		$catalog_ids = $child_ids;
	}	
	$catalog_ids[] = $id;
	
	foreach ($catalog_ids as $catalog_id) {
		db_delete('mobiiapp_catalog_comment')->condition('catalog_id', $catalog_id)->execute();
		db_delete('mobiiapp_catalog_role')->condition('catalog_id', $catalog_id)->execute();
		db_delete('mobiiapp_catalog')->condition('id', $catalog_id)->execute();
	}
	
	back_to_parent_folder($parent_id, $unit_id);   
}


function mobiiapp_catalog_roles($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];	
	
	// $rids = array();
	// foreach (get_roles_by_catalog_id($id) as $rid => $role) {
		// array_push($rids, $rid);
	// }
	
	$form['roles'] = array(
		'#title' => t('Roles'),
		'#type' => 'checkboxes',
		'#options' => get_optional_roles_by_catalog_id($id),
		'#default_value' => array_keys(get_roles_by_catalog_id($id)),
	);
	$options = array('No', 'Yes');
	$form['apply'] = array(
		'#type' => 'radios',
		'#options' => $options,  
		'#title' => t('Apply roles to children.'),
		'#default_value' => variable_get('type', 0),
	);
	$form['submit'] = array(
		'#value' => t('Save'),
		'#type' => 'submit',
		'#prefix' => '<div class="container-inline">',
	);
	$cancel = mobiiapp_catalog_cancel($parent_id, $unit_id);		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


function mobiiapp_catalog_roles_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];	
	
	// $selected_roles = array();
	// foreach ($form['roles']['#value'] as $rid) {
		// $selected_roles[] = $rid;
	// }
	
	// $unselected_roles = array();
	// foreach (array_keys($form['roles']['#options']) as $rid) {
		// if (!in_array($rid, $selected_roles)) {
			// $unselected_roles[] = $rid;
		// }
	// }
	$selected_roles = $form['roles']['#value'];
	$roles = array_keys($form['roles']['#options']);
	$unselected_roles = array_diff($roles, $selected_roles);
	
	$child_ids = array();
	if (has_child($id)) {
		$child_ids = get_children($id);
	}
	
	$apply_to_children = $form_state['values']['apply'];
	
	// If appy_to_children is true, the folder's children will be applied the same security as the folder.
	if ($apply_to_children) {
		$catalog_ids = $child_ids;
		array_push($catalog_ids, $id);
		
		db_delete('mobiiapp_catalog_role') 
			->condition('catalog_id', $catalog_ids, 'IN')
			->execute();
		
		if (count($selected_roles) > 0) {	
			foreach ($selected_roles as $rid) {
				foreach ($catalog_ids as $catalog_id) {
					db_insert('mobiiapp_catalog_role') 
						->fields(array('catalog_id' => $catalog_id, 'rid' => $rid))
						->execute();
				}
			}
		}
	}
	else {
		db_delete('mobiiapp_catalog_role') 
			->condition('catalog_id', $id, '=')
			->execute();
		
		// If appy_to_children is false and any role is removed at the folder, 
		// the same role need to be removed from its children as well.
		if (count($selected_roles) > 0) {
			if (has_child($id)) {
				$catalog_ids = $child_ids;
				db_delete('mobiiapp_catalog_role') 
					->condition('catalog_id', $catalog_ids, 'IN')
					->condition('rid', $unselected_roles, 'IN')
					->execute();
			}
					
			foreach ($selected_roles as $rid) {
				db_insert('mobiiapp_catalog_role') 
						->fields(array('catalog_id' => $id, 'rid' => $rid))
						->execute();
			}
		}
		
	}
	
	back_to_parent_folder($parent_id, $unit_id); 	
}


function mobiiapp_catalog_comments($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];
	$name = $entry['name'];
	
	$header = array(
		'name' => array('field' => 'name', 'data' => t('Name')),
		'mail' => array('data' => t('Email')),
		'timestamp' => array('field' => 'timestamp', 'data' => t('Timestamp')),
		'comment' => array('field' => 'comment', 'data' => t('Comment')),
	);
	
	$result = db_select('mobiiapp_catalog_comment', 's')
				->extend('TableSort')
				->extend('PagerDefault')->limit(20)
				->fields('s')
				->orderByHeader($header)
				->condition('catalog_id', $id, '=')
				->orderBy('id')
				->execute();
		
	$options = array();
	foreach ($result as $row) {
		$user = user_load($row->uid);
		if ($row->image != null) {
			$entry = serialize(
				array(
					'unit_id' => $unit_id,
					'parent_id' => $parent_id, 
					'id' => $id,
					'name' => $name,
					'comment_id' => $row->id,
				)
			);
			$query = array('query' => array('entry' => $entry));
			$comment = l($row->comment, 'mobiiapp/catalog/comments/image', $query);
		}
		else {
			$comment = $row->comment;
		}
		$options[$row->id] = array(
			'name' => array('data' => $row->name, 'width' => '15%'),
			'mail' => array('data' => $user->mail, 'width' => '20%'),
			'timestamp' => array('data' => date('Y-m-d H:i:s', $row->timestamp), 'width' => '15%'),
			'comment' => array('data' => $comment, 'width' => '50%'),
		);
	}
	
	$form['comment'] = array(
		'#title' => t('Page: '). $name,
		'#type' => 'fieldset',
	);
	$form['comment']['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
	);	
	$form['comment']['mobiiapp_catalog_comment_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No records found'),
	);
	$form['comment']['pager'] = array('#theme' => 'pager');
	
	$form['back'] = array(
		'#type' => 'submit',
		'#value' => t('Back'),
	);	
	return $form;
}


function mobiiapp_catalog_comments_validate($form, &$form_state) {
	if ($form_state['values']['op'] == t('Delete')) {	
		$selected_count = count(array_filter($form_state['values']['mobiiapp_catalog_comment_table']));
		
		if ($selected_count == 0) {
			form_set_error('', t('Please choose the operation.'));
		}
	}
}


function mobiiapp_catalog_comments_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$page_id = $entry['id'];
	$name = $entry['name'];
	
	switch($form_state['values']['op']) {
		case t('Delete'):
			$ids = array();
			foreach (array_filter($form_state['values']['mobiiapp_catalog_comment_table']) as $id => $value) {
				$ids[] = $id;
			}			
			$entry = serialize(
				array(
					'parent_id' => $parent_id,
					'unit_id' => $unit_id,
					'id' => $page_id,
					'name' => $name,
					'ids' => $ids,
				)
			);
			$query = array('query' => array('entry' => $entry));			
			drupal_goto('mobiiapp/catalog/comments/delete', $query);
			break;
		case t('Back'):
			back_to_parent_folder($parent_id, $unit_id);
			break;
	}
}


function mobiiapp_catalog_comments_delete_confirm($form, &$form_state) {
	$form['#submit'][] = 'mobiiapp_catalog_comments_delete_confirm_submit';
	
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];
	$name = $entry['name'];
	
	$entry = serialize(
		array(
			'parent_id' => $parent_id,
			'unit_id' => $unit_id,
			'id' => $id,
			'name' => $name,
		)
	);
	$query = array('query' => array('entry' => $entry));			
	return confirm_form($form,
		t('Are you sure you want to delete these items?'),
		array('path' => 'mobiiapp/catalog/comments', 'query' => array('entry' => $entry)), 
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
}


function mobiiapp_catalog_comments_delete_confirm_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];
	$name = $entry['name'];
	$ids = $entry['ids'];
	
	foreach ($ids as $comment_id) {
		$comment = db_query(
						'SELECT * FROM {mobiiapp_catalog_comment} WHERE id = :id', 
						array(':id' => $comment_id)
					)->fetchAssoc();
	
		db_delete('mobiiapp_catalog_comment')
			->condition('id', $comment_id, '=')
			->execute();
			
		if ($comment['image'] != null) {
			$path = '/var/www/html/sites/default/files/comment_images/'. $comment['image'];
			unlink($path);
		}
	}
	
	drupal_set_message(t('The comments have been successfully deleted'));
	
	$entry = serialize(
		array(
			'parent_id' => $parent_id,
			'unit_id' => $unit_id,
			'id' => $id,
			'name' => $name,
		)
	);
	$query = array('query' => array('entry' => $entry));
	
	drupal_goto('mobiiapp/catalog/comments', $query);
}


function mobiiapp_catalog_comments_image($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$parent_id = $entry['parent_id'];
	$id = $entry['id'];
	$name = $entry['name'];
	$comment_id = $entry['comment_id'];
	
	$comment = db_query(
					'SELECT * FROM {mobiiapp_catalog_comment} WHERE id = :id', 
					array(':id' => $comment_id)
				)->fetchAssoc();
	
	$server = $_SERVER['SERVER_NAME'];
	$comment_image = "https://$server/sites/default/files/comment_images/". $comment['image'];	
	$form['comment_image'] = array(
		'#type' => 'item',
		'#title' => t('Comment: '). $comment['comment']. ' by '. $comment['name'],
		'#markup' => "<img src='$comment_image'/>",
	);
	
	$entry = serialize(
				array(
					'unit_id' => $unit_id,
					'parent_id' => $parent_id, 
					'id' => $id,
					'name' => $name
				)
			);
	$query = array('query' => array('entry' => $entry));
	$back = l(t('Back'), 'mobiiapp/catalog/comments', $query);
	$form['back'] = array(
		'#type' => 'item',
		'#title' => "<b>$back</b>",
	);
	
	return $form;
}


function get_child($parent_id) {	
	$catalogs = db_query('SELECT c.id, c.name 
							FROM {mobiiapp_catalog} c
							WHERE parent_id = :parent_id', 
						array(':parent_id' => $parent_id))->fetchAllAssoc('id');
	
	return $catalogs;	
}


function has_child($parent_id) {
	$query = 'SELECT count(c.id) 
				FROM {mobiiapp_catalog} c 
				WHERE c.parent_id = :parent_id';
	$count = db_query($query, array(':parent_id' => $parent_id))->fetchField();
	
	return ($count > 0);
}


function get_children($parent_id) {	
	$catalogs = get_child($parent_id);
	
	$ids = array();
	foreach ($catalogs as $catalog) {
		$ids[] = $catalog->id;
		if (has_child($catalog->id)) {
			$branch_ids = trace_branch($catalog->id);
			$ids = array_merge($ids, $branch_ids);
		}
	}
	
	return $ids;
}


function trace_branch($parent_id) {	
	$catalogs = get_child($parent_id);
	
	$ids = array();
	foreach ($catalogs as $catalog) {
		$ids[] = $catalog->id;
		if (has_child($catalog->id)) {
			$branch_ids = trace_branch($catalog->id);
			$ids = array_merge($ids, $branch_ids);
		}
	}
	
	return $ids;
}


function get_roles_by_catalog_id($catalog_id) {
	$result = db_query('SELECT cr.rid 
							FROM {mobiiapp_catalog_role} cr 
							WHERE cr.catalog_id = :catalog_id', 
						array(':catalog_id' => $catalog_id));
	$roles = array();
	
	foreach ($result as $record) {
		$role = user_role_load($record->rid);
		$roles[$role->rid] = $role->name;
	}
	
	return $roles;
}


function get_optional_roles_by_catalog_id($catalog_id) {
	global $user;
	$unit = db_query('SELECT co.unit_name 
						FROM {mobiiapp_unit} co, {mobiiapp_catalog} ca     
						WHERE co.unit_id = ca.unit_id
						AND ca.id = :id', 
						array(':id' => $catalog_id))->fetchAssoc();
	$unit_name = $unit['unit_name'];
	
	$in_loop = true;
	
	$roles = array();
	do {
		$catalog = db_query('SELECT c.parent_id 
							FROM {mobiiapp_catalog} c 
							WHERE c.id = :id', array(':id' => $catalog_id))->fetchAssoc();
		$parent_id = $catalog['parent_id'];
		
		$roles = get_roles_by_catalog_id($parent_id);
		
		if (count($roles) > 0) {
			$in_loop = false;
		}
		else if ((count($roles) == 0) && ($parent_id == 0)) {
			$roles = get_roles_by_unit_name($unit_name);
			$in_loop = false;
		}
		else {
			$catalog_id = $parent_id;
		}
	} while ($in_loop);
	
	return $roles;
}  	


function get_comment_broadcast_list_by_catalog_id($catalog_id) {
	$in_loop = true;
	$unit_id = 0;
	
	$roles = array();
	$users = array();
	do {
		$catalog = db_query('SELECT c.parent_id, c.unit_id 
				FROM {mobiiapp_catalog} c 
				WHERE c.id = :id', array(':id' => $catalog_id))->fetchAssoc();
		$parent_id = $catalog['parent_id'];
		$unit_id = $catalog['unit_id'];
		
		$roles = get_roles_by_catalog_id($catalog_id);
		
		if (count($roles) > 0) {
			$rids = array_keys($roles);
			$result = db_query(
						'SELECT s1.uid 
						FROM {users_roles} s1, {mobiiapp_units_users} s2 
						WHERE s1.uid = s2.uid
						AND s1.rid in (:rids)
						AND s2.unit_id = :unit_id', 
						array(
							':rids' => implode(', ', $rids), 
							':unit_id' => $unit_id
						)
					);
			foreach ($result as $row) {
				$user = user_load($row->uid);
				$users[] = $user;
			}
			$in_loop = false;
		}
		else if ((count($roles) == 0) && ($parent_id == 0)) {
			$result = db_query('SELECT s.uid FROM {mobiiapp_units_users} s WHERE s.unit_id = :unit_id', 
						array(':unit_id' => $unit_id));
			foreach ($result as $row) {
				$user = user_load($row->uid);
				$users[] = $user;
			}
			$in_loop = false;
		}
		else {
			$catalog_id = $parent_id;
		}
	} while ($in_loop);
	
	return $users;
} 


function mobiiapp_catalog_comments_broadcast($sender, $catalog_id, $comment, $image = null) {
	$module = 'mobiiapp';
	$key = 'comment_message';
	$language = language_default();
	$send = true;
	
	$catalog = db_query('SELECT c.name, c.parent_id, c.unit_id 
							FROM {mobiiapp_catalog} c 
							WHERE c.id = :id', array(':id' => $catalog_id))->fetchAssoc();
	
	$params = array();
	$params['name'] = $sender->name;
	$params['page'] = $catalog['name'];
	$params['directory_path'] = get_directory_path($catalog['parent_id'], $catalog['unit_id'], false);
	$params['message'] = $comment;
	$params['image'] = $image;
	
	// $from = $sender->mail;
	$from = 'NoReply@mobiiapp.com';
	$receivers = get_comment_broadcast_list_by_catalog_id($catalog_id);
	
	$emails = array();
	foreach ($receivers as $receiver) {
		if (!in_array($receiver->mail, $emails)) {
			$emails[] = $receiver->mail;
		}
	}
	
	if (count($emails) > 0) {
		$to = implode(', ', $emails);
		$delivered = drupal_mail($module, $key, $to, $language, $params, $from, $send);
		watchdog('mobiiapp', "Comment Broadcast: The message ($comment) is sent to $to.");
		if ($delivered['result'] == false) {
				watchdog('mobiiapp', "Comment Broadcast: Fail to send the message ($comment) to $to.");
		}
	}
}
?>
