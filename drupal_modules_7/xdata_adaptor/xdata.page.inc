<?php
function back_xdata_page($unit_id) {
	$entry = serialize(array('unit_id' => $unit_id));
	$query = array('query' => array('entry' => $entry));
	drupal_goto('xdata_adaptor/page', $query);
}


// Pages can be published only when they are generated.
function get_xdata_pages_by_unit_id($unit_id) {
	// $result = db_query("SELECT s.cid, s.name 
						// FROM {xdata_adaptor_page} s 
						// WHERE s.status = 1
						// AND s.type = 'page'
						// AND s.unit_id = :unit_id", array(':unit_id' => $unit_id));
	
	$result = db_query("SELECT cid, name 
						FROM {xdata_adaptor_page} 
						WHERE status = 1 
						AND type = 'page' 
						AND (unit_id = :unit_id 
							or cid in 
							(SELECT cid 
							FROM {xdata_adaptor_pages_units} 
							WHERE unit_id = :share_unit_id))",
						array(':unit_id' => $unit_id, ':share_unit_id' => $unit_id)
						);
	
	$pages = array();
	foreach($result as $row) {
		$pages[$row->cid] = $row->name;
	}
	return $pages;
}


function get_xdata_page_by_cid($cid) {
	$page = db_query('SELECT s.* 
						FROM {xdata_adaptor_page} s
						WHERE s.cid = :cid', array(':cid' => $cid))->fetchAssoc();
	return $page;
}


function get_xdata_units_by_cid($cid) {
	$result = db_query('SELECT u.unit_id, u.unit_name 
						FROM {mobiiapp_unit} u, {xdata_adaptor_pages_units} pu 
						WHERE u.unit_id = pu.unit_id
						AND pu.cid = :cid', array(':cid' => $cid));
	
	$units = array();
	foreach ($result as $row) {
		$units[$row->unit_id] = $row->unit_name;
	}
	
	return $units;
}


function is_xdata_page_generated($cid) {
	$page = get_xdata_page_by_cid($cid);
	$status = $page['status'];
	$generated = ($status == 1)? true: false;
	
	return $generated;
}


function get_sql_script_by_dataset($dataset_id, $type = 'report', $column_name = '', $condition = '') {
	$dataset = db_query('SELECT * FROM {xdata_adaptor_dataset} WHERE id = :id', array(':id' => $dataset_id))->fetchAssoc();
	$select = $dataset['sql_select'];
	$from = $dataset['sql_from'];
	$where = $dataset['sql_where'];	
	
	if ($type == 'report') {
		$columns = explode(',', $select);
		
		$select = "";
		$length = count($columns);
		foreach ($columns as $key => $column) {
			$select .= trim($column);
			$select = ($length == ($key+1))? $select. " c". $key. "\r\n": $select. " c". $key. ",\r\n";
		}	
	}
	else {
		$columns = explode(',', $select);
		foreach ($columns as $column) {
			if (preg_match("/.$column_name/i", $column)) {
				$distinct_column = $column;
				break;
			}
		}
	
		$select = "DISTINCT $distinct_column\r\n";
	}
	
	$sql_script = "SELECT\r\n". $select. "FROM\r\n". $from;
	
	switch($type) {
		case 'filter_default':
			if (trim($condition) != '') {
				$sql_script = $sql_script. "\r\nWHERE\r\n". $condition;
			}
			break;
		case 'filter_value':
			break;
		case 'report':
			if ($where != '') {
				$where = str_replace("is_prompted", "LIKE :PQ", $where);
				$sql_script = $sql_script. "\r\nWHERE\r\n". $where;
			}
			break;
	}
	
	return $sql_script;
}


function get_prompt_filter_columns_by_page_cid($page_cid) {
	$result = db_query(
					"SELECT d.sql_select
					FROM {xdata_adaptor_page} p, {xdata_adaptor_dataset} d
					WHERE p.fid = :fid
					AND p.type = 'report'
					AND p.dataset_id = d.id",
					array(':fid' => $page_cid)
				);
	
	$columns = array();
	foreach($result as $row) {
		$pieces = explode(',', $row->sql_select);
		foreach ($pieces as $piece) {
			$items = explode('.', $piece);
			$columns[] = trim($items[1]);
		}
	}
	
	return array_unique($columns);
}


function get_xdata_datasets_by_unit_id($unit_id) {
	$datasets = array();
	
	$result = db_query('SELECT s.id, s.name  
						FROM {xdata_adaptor_dataset} s 
						WHERE s.unit_id = :unit_id', 
						array(':unit_id' => $unit_id));
	
	foreach ($result as $record) {
		$datasets[$record->id] = $record->name;
	}
	
	return $datasets;
}

/*
function get_xdata_datasets_by_unit_id_column_name($unit_id, $column_name) {
	$column_name = "%.$column_name,%";
	$datasets = array();	
	$result = db_query("SELECT s.id, s.name  
						FROM {xdata_adaptor_dataset} s 
						WHERE s.unit_id = :unit_id
						AND s.sql_select like '$column_name'", 
						array(':unit_id' => $unit_id));
	foreach ($result as $record) {
		$datasets[$record->id] = $record->name;
	}	
	
	return $datasets;
}
*/
function get_xdata_datasets_by_unit_id_column_name($unit_id, $column_name) {
	$datasets = array();	
	$result = db_query("SELECT s.id, s.name, s.sql_select
						FROM {xdata_adaptor_dataset} s 
						WHERE s.unit_id = :unit_id",
						array(':unit_id' => $unit_id));
	foreach ($result as $record) {
		$sql_selects = explode(',',$record->sql_select);
		foreach($sql_selects as $sql_select){
			$dot_index = strrpos($sql_select,'.');
			if($dot_index !== false){
				$sql_select = substr($sql_select,$dot_index+1);
			}
			if($sql_select == $column_name){
				$datasets[$record->id] = $record->name;
			}
		}
	}	
	
	return $datasets;
}


function get_xdata_prompts_by_page_cid($page_cid) {
	$prompts = array();
	
	$result = db_query("SELECT s.cid, s.name  
						FROM {xdata_adaptor_page} s
						WHERE type = 'prompt'
						AND s.fid = :page_cid",
						array(':page_cid' => $page_cid));
	
	foreach ($result as $record) {
		$prompts[$record->cid] = $record->name;
	}
	
	return $prompts;
}


function get_xdata_prompt_filters_by_prompt($prompt_cid, $constrainChoices = FALSE) {
	$result = db_query(
					"SELECT * 
					FROM {xdata_adaptor_page} p
					WHERE p.fid = :fid
					AND p.type = 'prompt_filter'",
					array(':fid' => $prompt_cid)
				);
	
	$prompt_filters = array();
	foreach($result as $row) {
		if ($constrainChoices) {
			$simbaxml = new DOMDocument();
			$simbaxml->formatOutput = true;
			$simbaxml->loadXML($row->simbaxml);
			$promptFilterNode = $simbaxml->getElementsByTagName('promptFilter')->item(0);
			
			if (($promptFilterNode->getAttribute('control') == 'drop') || 
				($promptFilterNode->getAttribute('control') == 'multi')) {
				$prompt_filters[$row->cid] = $row->name;
			}
		}
		else {
			$prompt_filters[$row->cid] = $row->name;
		}
	}
	
	return $prompt_filters;
}


function get_xdata_prompt_filters_by_page_cid($page_cid) {
	$prompts = get_xdata_prompts_by_page_cid($page_cid);
	
	$prompt_filters = array();
	foreach (array_keys($prompts) as $prompt_cid) {
		if (count($prompt_filters) == 0) {
			$prompt_filters = get_xdata_prompt_filters_by_prompt($prompt_cid);
		}
		else {
			array_merge($prompt_filters, get_xdata_prompt_filters_by_prompt($prompt_cid));
		}
	}
	
	return $prompt_filters;
}


function get_prompt_filter_simbaxml($attributes) {
	$simbaxml = new DOMDocument();
	$simbaxml->formatOutput = true;
	$promptFilter = $simbaxml->createElement('promptFilter');
	
	$formula = $simbaxml->createAttribute('formula');
	$op = $simbaxml->createAttribute('op');
	$default = $simbaxml->createAttribute('default');
	$defaultValue = $simbaxml->createAttribute('defaultValue');
	$defaultValue2 = $simbaxml->createAttribute('defaultValue2');
	$control = $simbaxml->createAttribute('control');
	$values = $simbaxml->createAttribute('values');	
	$includeAllChoices = $simbaxml->createAttribute('includeAllChoices');
	$constrainChoices = $simbaxml->createAttribute('constrainChoices');
	$setVariable = $simbaxml->createAttribute('setVariable');
	$setVariableValue = $simbaxml->createAttribute('setVariableValue');
	$caption = $simbaxml->createAttribute('caption');
	
	$formula->value = $attributes['formula'];
	$op->value = $attributes['op'];
	$default->value = $attributes['default'];
	$defaultValue->value = $attributes['defaultValue'];
	$defaultValue2->value = $attributes['defaultValue2'];;
	$control->value = $attributes['control'];
	$values->value = $attributes['values'];	
	$includeAllChoices->value = $attributes['includeAllChoices'];
	$constrainChoices->value = $attributes['constrainChoices'];
	$setVariable->value = '';
	$setVariableValue->value = ''; 
	$caption->value = $attributes['caption'];
	
	$promptFilter->appendChild($formula);
	$promptFilter->appendChild($op);
	$promptFilter->appendChild($default);
	$promptFilter->appendChild($defaultValue);
	$promptFilter->appendChild($defaultValue2);
	$promptFilter->appendChild($control);
	$promptFilter->appendChild($values);
	$promptFilter->appendChild($includeAllChoices);
	$promptFilter->appendChild($constrainChoices);
	$promptFilter->appendChild($setVariableValue);
	$promptFilter->appendChild($caption);
	
	$simbaxml->appendChild($promptFilter);
	
	return str_replace("&#13;&#10;", "\r\n", $simbaxml->saveXML());
}


function xdata_page_update_status($cid) {
	$query = 'SELECT count(s.status) FROM {xdata_adaptor_page} s WHERE s.status = 0 AND s.fid = :fid;';	
	$fail_count = db_query($query, array(':fid' => $cid))->fetchField();
	
	//...if one of page's prompts or reports is not generated, the page's status will not be generated.
	$status = ($fail_count > 0)? 0: 1;
	
	db_update('xdata_adaptor_page')
		->fields(array('status' => $status))
		->condition('cid', $cid)
		->execute();		   
}


function xdata_page_update_simbaxml($name, $cid) {
	global $metadata_client; 
	$gener_simba = new srcMetadataset();

	$page = new Page();
	$page->pageName = $name;

	$result = db_query(
					'SELECT s.* 
					FROM {xdata_adaptor_page} s 
					WHERE in_page = 1
					AND fid = :fid',
					array(':fid' => $cid)
				);

	$prompts = array();
	$reports = array();
	
	foreach($result as $row) {
		if($row->type == 'prompt')  $prompts[$row->name] = $row->cid;
		if($row->type == 'report')  $reports[$row->name] = $row->cid;
	}
	
	$page->prompts = $prompts;
	$page->reports = $reports;
	$gener_simba->page = $page;
	$gener_simba->cid =  $cid;
	$gener_simba->style = 'page';
	$gener_simba->appName = 'sql';
	$simbaxml = $metadata_client->convert_metadata($gener_simba);
	db_update('xdata_adaptor_page')
		->fields(array('simbaxml' => $simbaxml))
		->condition('cid', $cid)
		->execute();
       
}


//If a prompt filter is added, edited or deleted, 
//the functon will update its related prompt.
function xdata_page_update_prompt_simbaxml($name, $cid, $deleted_prompt_filter = null) {
	$prompt = new Prompt();
	$prompt->promptName = $name;
	
	$prompt_filters = db_query(
						"SELECT s.* 
						FROM {xdata_adaptor_page} s 
						WHERE type = 'prompt_filter'
						AND fid = :fid",
						array(':fid' => $cid)
					);
	
	$promptFilters = array();
	foreach ($prompt_filters as $prompt_filter) {
		$simbaxml = new DOMDocument();
		$simbaxml->formatOutput = true;
		$simbaxml->loadXML($prompt_filter->simbaxml);
		$promptFilterNode = $simbaxml->getElementsByTagName('promptFilter')->item(0);
		
		$promptFilter = new PromptFilter();
		$promptFilter->formula = $promptFilterNode->getAttribute('formula');
		$promptFilter->op = $promptFilterNode->getAttribute('op');
		$promptFilter->defaultOn = $promptFilterNode->getAttribute('default');
		
		if ($promptFilter->defaultOn == 'sqlExpression') {
			$promptFilter->defaultValue = get_sql_script_by_dataset(
											$prompt_filter->dataset_id, 
											'filter_default',
											$prompt_filter->name,											
											$promptFilterNode->getAttribute('defaultValue')
										);
			if ($promptFilter->op == 'between') {
				$promptFilter->defaultValue2 = get_sql_script_by_dataset(
												$prompt_filter->dataset_id, 
												'filter_default',
												$prompt_filter->name,
												$promptFilterNode->getAttribute('defaultValue2')
											);
			}
		}
		else {
			$promptFilter->defaultValue = $promptFilterNode->getAttribute('defaultValue');
			if ($promptFilter->op == 'between') {
				$promptFilter->defaultValue2 = $promptFilterNode->getAttribute('defaultValue2');
			}
		}		
		
		$promptFilter->control = $promptFilterNode->getAttribute('control');
		$promptFilter->values = $promptFilterNode->getAttribute('values');	
		$promptFilter->includeAllChoices = $promptFilterNode->getAttribute('includeAllChoices');
		
		//If the deleted prompt filter is associated with any prompt file as constrainChoices, 
		//the process need to reset it back for all related prompt filters and its prompt.
		if (($deleted_prompt_filter != null) && 
			($promptFilterNode->getAttribute('constrainChoices') == $deleted_prompt_filter)) {
			$promptFilter->constrainChoices = "";
			$prompt_filter->simbaxml = str_replace(
											'constrainChoices="'. $deleted_prompt_filter. '"',
											'constrainChoices=""', 
											$prompt_filter->simbaxml
										);
			db_update('xdata_adaptor_page')
				->fields(array('simbaxml' => $prompt_filter->simbaxml))
				->condition('cid', $prompt_filter->cid)
				->execute();
		}
		else {
			$promptFilter->constrainChoices = $promptFilterNode->getAttribute('constrainChoices');
		}
		$promptFilter->setVariable = $promptFilterNode->getAttribute('setVariable');
		$promptFilter->setVariableValue = $promptFilterNode->getAttribute('setVariableValue'); 
		$promptFilter->caption = $promptFilterNode->getAttribute('caption');
		
		$promptFilters[] = $promptFilter;
	}
	
	if (count($promptFilters) > 0) {
		$prompt->promptFilters = $promptFilters;
	}
	
	global $metadata_client; 
    $gener_simba = new srcMetadataset();
	 
	$gener_simba->prompt = $prompt;
	$gener_simba->style = 'prompt';
	$gener_simba->cid =  $cid;
	$gener_simba->appName = 'sql';
	$simbaxml = $metadata_client->convert_metadata($gener_simba);
	
	db_update('xdata_adaptor_page')
		->fields(array('simbaxml' => $simbaxml))
		->condition('cid', $cid)
		->execute();
}


//If a dataset is updated, the function will refresh the sql node of all related reports.
function xdata_page_update_reports_simbaxml_by_dataset($dataset_id) {	
	$reports = db_query(
					"SELECT s.* 
					FROM {xdata_adaptor_page} s 
					WHERE type = 'report'
					AND dataset_id = :dataset_id",
					array(':dataset_id' => $dataset_id)
				);
		
	foreach ($reports as $report) {
		$simbaxml = new DOMDocument();
		$simbaxml->formatOutput = true;
		$simbaxml->loadXML($report->simbaxml);
		$sql_script = get_sql_script_by_dataset($dataset_id);
		$simbaxml->getElementsByTagName('sql')->item(0)->nodeValue = $sql_script;
		$report->simbaxml = str_replace("&#13;", "", $simbaxml->saveXML());
		db_update('xdata_adaptor_page')
			->fields(
				array(
		    	'simbaxml' => $report->simbaxml,
		    	'timestamp' => time(),
				)
			)
			->condition('cid', $report->cid)
			->execute();
	}
}


//If a report is removed, the function will identify and remove the prompt filers 
//which are not associated with any column in the reports under the same page.
function xdata_page_update_prompts_simbaxml_by_page_cid($page_cid) {
	$prompt_filters = db_query(
						"SELECT s.* 
						FROM {xdata_adaptor_page} s 
						WHERE type = 'prompt_filter'
						AND fid in 
							(SELECT cid 
							FROM {xdata_adaptor_page} s 
							WHERE type = 'prompt' 
							AND fid = :page_cid)",
						array(':page_cid' => $page_cid)
					);
	
	$columns = get_prompt_filter_columns_by_page_cid($page_cid);
	
	foreach ($prompt_filters as $prompt_filter) {
		if (!in_array($prompt_filter->name, $columns)) {
			db_delete('xdata_adaptor_page')
				->condition('cid', $prompt_filter->cid)
				->execute();
			$prompt = get_xdata_page_by_cid($prompt_filter->fid);;
			xdata_page_update_prompt_simbaxml($prompt['name'], $prompt_filter->fid);
		}
	}
}


function back_xdata_page_display($page_cid, $page_name) {
	$entry = serialize(
				array(
					'cid' => $page_cid, 
					'name' => $page_name, 
				)
			);
	$query = array('query' => array('entry' => $entry)); 
	drupal_goto('xdata_adaptor/page/display', $query);
}


function xdata_page_form($form, &$form_state) {
    global $user;
	$is_super_admin = is_super_admin_mobiiapp($user->roles);

	$units = get_units();
	
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
			'#submit' => array('xdata_page_form_submit'),
		);
	}
	
	$form['table'] = xdata_page_list_form($form, $form_state);	

	return $form;
}


function xdata_page_form_submit($form, &$form_state) {
	$unit_id = $form_state['values']['unit'];
	back_xdata_page($unit_id);
}


function xdata_page_list_form($form, &$form_state) {
	$unit_id = $form['unit_id']['#value']; 
	
	$result = db_select('xdata_adaptor_page', 'c')
		->extend('PagerDefault')->limit(20)
		->fields('c')
		->condition('unit_id', $unit_id, '=')
		->condition('type', 'page', '=')
		->execute();
	
	$form['pages'] = array(
		'#tree' => TRUE,
	);
	
	foreach($result as $row) {
		$form['pages'][$row->cid]['#page'] = (object) array(
			'cid' => $row->cid,
			'name' => $row->name,
			'status' => $row->status,
			'unit_id' => $row->unit_id,
		);
		
	}
	
	$form['name'] = array(
		'#type' => 'textfield',
		'#title' => t('Page Name'),
		'#title_display' => 'invisible',
		'#size' => 30,
		'#maxlength' => 60,
		'#prefix' => '<div class="container-inline">',
	);
	$form['add'] = array(
		'#type' => 'submit',
		'#value' => t('Add page'),
		'#suffix' => '</div>',
		'#validate' => array('xdata_page_add_validate'),
		'#submit' => array('xdata_page_add_submit'),
	);
	
	$form['#theme'] = 'xdata_page_list_form';
	
	return $form;
}


function theme_xdata_page_list_form($variables) {
	$form = $variables['form'];
	$header = array(t('Name'), t('Shared w/ Groups'), t('Status'), t('Operations'));
	
	$rows = array();	
	foreach (element_children($form['pages']) as $cid) {
        $name = $form['pages'][$cid]['#page']->name;
		
		$published = is_page_published('xdata', $cid);
		$status_ = ($published)? t('published'): t('generated');
		
		$active = is_page_active('xdata', $cid);
		$status_ = ($published && !$active)? t('editable'): $status_;
			
		
		$status = ($form['pages'][$cid]['#page']->status == 0)? t('new'): $status_;
		$unit_id = $form['pages'][$cid]['#page']->unit_id;
		
		$entry = serialize(
					array(
						'cid' => $cid, 
						'name' => $name, 
						'unit_id' => $unit_id
					)
				);
		$query = array('query' => array('entry' => $entry));    
		
		$row = array();
		$row[] = array('data' => l(t($name), 'xdata_adaptor/page/display', $query), 'width' => '60%');
		$row[] = array('data' => theme('item_list', array('items' => get_xdata_units_by_cid($cid))), 'width' => '20%');
		$row[] = array('data' => check_plain($status), 'width' => '10%');
		
		$edit = l(t('edit'), 'xdata_adaptor/page/edit', $query);
		if ($form['pages'][$cid]['#page']->status == 0) {
			$clone = l(t('clone'), 'xdata_adaptor/page/clone', $query);
			$ops = $edit. '&nbsp;|&nbsp;'. $clone;
		}
		else {
			$ops = $edit;
		}
		$row[] = array('data' => $ops, 'width' => '10%');
		
		$rows[] = array('data' => $row);
	}
	$rows[] = array(array('data' => drupal_render($form['name']). drupal_render($form['add']), 'colspan' => 4, 'class' => 'edit-name'));
    
	$output = theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'page-list')));
	$output .= theme('pager');

	return $output;
}


function xdata_page_add_validate($form, &$form_state) {   
	$name = $form_state['values']['name'];
	$unit_id = $form_state['values']['unit_id'];
	
	if (trim($form_state['values']['name']) == '') {
		form_set_error('name', t('The page name cannot be blank.'));
	}
	
	$query = "SELECT count(s.name) 
				FROM {xdata_adaptor_page} s 
				WHERE type = 'page' 
				AND name = :name 
				AND unit_id = :unit_id;";	
	$existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
	if ($existed != 0) {
		form_set_error('name', t('The page name has been existed already.'));
	}
}


function xdata_page_add_submit($form, &$form_state){ 
	$name = $form_state['values']['name'];
	$unit_id = $form_state['values']['unit_id'];

	$cid = db_insert('xdata_adaptor_page')
		->fields(
				array(
					'name' => $name,
					'type' => 'page',
					'unit_id' => $unit_id, 					
					'timestamp' => time(),
				)
			)
		->execute();
		
	global $metadata_client; 
	$gener_simba = new srcMetadataset();
	$page = new Page();
	$page->pageName = $name;
	$gener_simba->page = $page;
	$gener_simba->cid =  $cid;
	$gener_simba->style = 'page';
	$gener_simba->appName = 'sql';   
	$simbaxml = $metadata_client->convert_metadata($gener_simba);
		
	db_update('xdata_adaptor_page')
		->fields(array('simbaxml' => $simbaxml))
		->condition('cid', $cid)
		->execute();
		
	back_xdata_page($unit_id); 
}


function xdata_page_edit($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	
	//If a page is published, it cannot be edited or removed.
	$published = is_page_published('xdata', $cid);
	$active = is_page_active('xdata', $cid);
	$editable = (!$published  || ($published && !$active));
	
	$form['cid'] = array(
		'#type' => 'value',
		'#value' => $entry['cid'],
	);
	$form['unit_id'] = array(
		'#type' => 'value',
		'#value' => $entry['unit_id'],
	);
	$form['name'] = array(
		'#title' => t('Name'),
		'#type' => 'textfield',
		'#default_value' => $entry['name'],
		'#size' => 30,
		'#required' => TRUE,
		'#maxlength' => 64,
		'#disabled' => $published,  
	);
	
	if ($published) {
		$options = array('No', 'Yes');
		$form['active'] = array(
			'#type' => 'radios',
			'#options' => $options,  
			'#title' => t('Active'),
			'#default_value' => (is_page_active('xdata', $cid))? 1: 0,
			'#prefix' => '<div class="container-inline">',
			'#suffix' => '</div>',
		);
	}
	
	$form['shared_with_units'] = array(
		'#title' => t('Shared with Groups'),
		'#type' => 'fieldset',
		'#description' => t('The page is shared with the groups.  Unchecked groups will be removed from the share list of the page.'),	
	);
	$units = get_xdata_units_by_cid($cid);
	if (count($units) > 0) {
		$form['shared_with_units']['units'] = array(
			'#title' => t('Groups'),
			'#type' => 'checkboxes',
			'#options' => $units,
			'#default_value' => array_keys($units),
		);
	}
	$form['shared_with_units']['unit'] = array(
		'#title' => t('Group'),
		'#type' => 'textfield',
		'#description' => t('Input the group name to share the page with the group.'),
	);	
	$form['save'] = array(
		'#type' => 'submit',
		'#value' => t('Save'),
		// '#disabled' => $published,
		'#prefix' => '<div class="container-inline">',
	);	
	$form['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
		'#disabled' => !$editable,  
		'#submit' => array('xdata_page_delete_submit'),
	);
	
	$cancel = xdata_page_cancel($entry['unit_id']);		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);

	return $form; 
}


function xdata_page_edit_validate($form, &$form_state) {
	$name = $form_state['values']['name'];
	$cid = $form_state['values']['cid'];
	$unit_id = $form_state['values']['unit_id'];
	
	//Only if the page is not published, its name can be changed.
	if (!is_page_published('xdata', $cid)) {
		$raw_name = db_query('SELECT s.name FROM {xdata_adaptor_page} s WHERE cid = :cid',array(':cid' => $cid))->fetchField();
		if ($name != $raw_name) {	
			$query = "SELECT count(s.name) 
						FROM {xdata_adaptor_page} s 
						WHERE type = 'page'
						AND s.name = :name 
						AND s.unit_id = :unit_id";	
			$existed = db_query($query, array(':name' => $name, ':unit_id' => $unit_id))->fetchField();
			if ($existed != 0) {
				form_set_error('name', t('The page name has been existed already.'));
			}
		}
	}
	
	//Check whether the group is exited.
	$unit = trim($form_state['values']['unit']);
	if ($unit != '') {
		$query = 'SELECT count(m.unit_name) FROM {mobiiapp_unit} m WHERE unit_name = :unit';
		$existed = db_query($query, array(':unit' => $unit))->fetchField();
		if ($existed == 0) {
			form_set_error('unit', t('The group is not existed.  Please check the administrator of the group.'));
		}
		
		$_unit = get_unit(null, $unit);
		$unit_id_for_share = $_unit['unit_id'];
		if ($unit_id == $unit_id_for_share) {
			form_set_error('unit', t('The group is the owner of the page.'));
		}
	}
}


function xdata_page_edit_submit($form, &$form_state) {    
    $name = $form_state['values']['name'];
	$cid = $form_state['values']['cid'];
	$unit_id = $form_state['values']['unit_id'];
	
	//Only if the page is not published, its name can be changed.
	if (!is_page_published('xdata', $cid)) {
		db_update('xdata_adaptor_page')
			->fields(
				array(
					'name' => $name, 
					'timestamp' => time(),
				)
			)
			->condition('cid', $cid)
			->execute();

		xdata_page_update_simbaxml($name, $cid);
	}
	else {
		$active = $form_state['values']['active'];
		if ($active != is_page_active('xdata', $cid)) {
			db_update('mobiiapp_catalog')
				->fields(
					array(
						'status' => $active,
					)
				)
				->condition('cid', $cid, '=')
				->condition('adaptor', 'xdata', '=')
				->execute();
		}
	}
	
	//Remove the unchecked units from the share list.
	$units = get_xdata_units_by_cid($cid);
	if (count($units) > 0) {
		$selected_unit_ids = $form['shared_with_units']['units']['#value'];
		$unit_ids = array_keys($form['shared_with_units']['units']['#options']);
		$unselected_unit_ids = array_diff($unit_ids, $selected_unit_ids);
		
		foreach ($unselected_unit_ids as $unselected_unit_id) {
			db_delete('xdata_adaptor_pages_units')
				->condition('cid', $cid)
				->condition('unit_id', $unselected_unit_id)
				->execute();
			
			db_delete('mobiiapp_catalog')
				->condition('cid', $cid)
				->condition('unit_id', $unselected_unit_id)
				->condition('adaptor', 'xdata')
				->execute();
		}
	}
	
	//Insert the share unit.
	$unit = trim($form_state['values']['unit']);
	if ($unit != '') {
		$_unit = get_unit(null, $unit);
		$unit_id_for_share = $_unit['unit_id'];
		db_insert('xdata_adaptor_pages_units')
			->fields(array(
				'cid' => $cid,
				'unit_id' => $unit_id_for_share,
			))
			->execute();
	}
	
    back_xdata_page($unit_id);  
}


function xdata_page_cancel($unit_id) {    
	$entry = serialize(array('unit_id' => $unit_id));
	$query = array('query' => array('entry' => $entry));
	$cancel = l(t('Cancel'), 'xdata_adaptor/page', $query);
	
	return $cancel;
}


function xdata_page_delete_submit($form, &$form_state) {
	$entry = serialize(array('cid' => $form_state['values']['cid'],'unit_id' => $form_state['values']['unit_id']));
	$query = array('query' => array('entry' => $entry));

	drupal_goto('xdata_adaptor/page/delete', $query);
}


function xdata_page_delete_confirm($form, &$form_state){
    $entry = unserialize($_GET['entry']);
    $name = db_query('SELECT s.name FROM {xdata_adaptor_page} s WHERE cid = :cid',
						array(':cid' => $entry['cid'])
					)->fetchField();

	return confirm_form($form, 
						t('Are you sure you want to delete the page %name ?', 
							array('%name' => $name)), 
						'xdata_adaptor/page', 
						t('This action cannot be undone.'), 
						t('Delete'));

}


function xdata_page_clone($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$pages = get_xdata_pages_by_unit_id($entry['unit_id']);
	unset($pages[$entry['cid']]);
	
	$form['name'] = array(
		'#type' => 'value',
		'#value' => $entry['name'],
	);
	$form['cid'] = array(
		'#type' => 'value',
		'#value' => $entry['cid'],
	);
	$form['unit_id'] = array(
		'#type' => 'value',
		'#value' => $entry['unit_id'],
	);
	$form['page'] = array(
		'#title' => t('Page'),
		'#type' => 'select',
		'#options' => $pages,
		'#description' => t('Please select the page to clone.'),
	);
	$form['save'] = array(
		'#type' => 'submit',
		'#value' => t('Save'),
		'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_cancel($entry['unit_id']);		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);

	return $form; 
}


function xdata_page_clone_submit($form, &$form_state) {
	$name = $form_state['values']['name'];
	$cid = $form_state['values']['cid'];
	$unit_id = $form_state['values']['unit_id'];
	$page_cid = $form_state['values']['page'];
	
	$result = db_query("SELECT s.* 
						FROM {xdata_adaptor_page} s
						WHERE type in ('report', 'prompt')
						AND s.fid = :fid",
						array(':fid' => $page_cid));
	
	foreach ($result as $row) {
		switch($row->type) {
			case 'report':
				$report_cid = db_insert('xdata_adaptor_page')
								->fields(array(
									'fid' => $cid,
									'name' => $row->name,
									'type' => $row->type,
									'status' => $row->status,
									'dataset_id' => $row->dataset_id,
									'in_page' => $row->in_page,
									'unit_id' => $row->unit_id,
									'timestamp' => time(),
								))
								->execute();
				$search = 'cid="'. $row->cid. '"';
				$replace = 'cid="'. $report_cid. '"';
				$simbaxml = str_replace($search, $replace, $row->simbaxml);
				db_update('xdata_adaptor_page')
					->fields(array('simbaxml' => $simbaxml))
					->condition('cid', $report_cid)
					->execute();				
				break;
			case 'prompt':
				$search = 'cid="'. $page_cid. '"';
				$replace = 'cid="'. $cid. '"';
				$simbaxml = str_replace($search, $replace, $row->simbaxml);
				$prompt_cid = db_insert('xdata_adaptor_page')
								->fields(array(
									'fid' => $cid,
									'name' => $row->name,
									'type' => $row->type,
									'status' => $row->status,
									'unit_id' => $row->unit_id,
									'timestamp' => time(),
								))
								->execute();
				$search = 'cid="'. $row->cid. '"';
				$replace = 'cid="'. $prompt_cid. '"';
				$simbaxml = str_replace($search, $replace, $row->simbaxml);
				db_update('xdata_adaptor_page')
					->fields(array('simbaxml' => $simbaxml))
					->condition('cid', $prompt_cid)
					->execute();
				
				$prompt_filters = db_query("SELECT s.* 
											FROM {xdata_adaptor_page} s
											WHERE type = 'prompt_filter'
											AND s.fid = :fid",
											array(':fid' => $row->cid));
				foreach ($prompt_filters as $prompt_filter) {
					db_insert('xdata_adaptor_page')
						->fields(array(
							'fid' => $prompt_cid,
							'name' => $prompt_filter->name,
							'type' => $prompt_filter->type,
							'status' => $prompt_filter->status,
							'dataset_id' => $prompt_filter->dataset_id,
							'simbaxml' => $prompt_filter->simbaxml,
							'unit_id' => $prompt_filter->unit_id,
							'timestamp' => time(),
						))
						->execute();
				}				
				break;
		}
	}
	xdata_page_update_status($cid);
	xdata_page_update_simbaxml($name, $cid);
	back_xdata_page($unit_id);
}


function xdata_page_delete_confirm_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	
	//Delete prompt filters related to the page.
	$prompts = db_query(
						"SELECT p.cid
						FROM {xdata_adaptor_page} p
						WHERE type = 'prompt'
						AND fid = :fid",
						array(':fid' => $entry['cid'])
				);
	foreach ($prompts as $prompt) {
		db_delete('xdata_adaptor_page')
			->condition('fid', $prompt->cid)
			->execute();
	}
	
	//Delete reports and prompts related to the page.
	db_delete('xdata_adaptor_page')
        ->condition('fid', $entry['cid'])
		->execute();
	
	//Remove the shared units for the page.
	db_delete('xdata_adaptor_pages_units')
		->condition('cid', $entry['cid'])
		->execute();			
	
	//Delete all published catalog entries for the page.
	db_delete('mobiiapp_catalog')
		->condition('cid', $entry['cid'])
		->condition('adaptor', 'xdata')
		->execute();
	
	//Delete the page.
	db_delete('xdata_adaptor_page')
        ->condition('cid', $entry['cid'])
		->execute();

	back_xdata_page($unit_id);       
} 


function xdata_page_display_form($form, &$form_state) {
    if(isset($_GET['entry'])) {
		$entry = unserialize($_GET['entry']);
		$page_cid = $entry['cid'];
		$page_name = $entry['name'];
	}
	else {
		$page_cid = $form_state['values']['page_cid'];
		$page_name = $form_state['values']['page_name'];
	}
	$form['page_cid'] = array(
		'#type' => 'value',
		'#value' => $page_cid,
	);
	$form['page_name'] = array(
		'#type' => 'value',
		'#value' => $page_name,
	);	
	
	$page = get_xdata_page_by_cid($page_cid);
	$prompts = get_xdata_prompts_by_page_cid($page_cid);
	
	$entry = serialize(array('unit_id' => $page['unit_id']));
	$query = array('query' => array('entry' => $entry));	
	$form['page_name_title'] = array(
		'#title' => t('Page Name: '). l($page_name, 'xdata_adaptor/page', $query),
		'#type' => 'item',
	);
	
	//If the page is published and the associated catalog entry is active, 
	//the page cannot add new prompt or report 
	//except changing the associated catalog entry to be blocked.
	$published = is_page_published('xdata', $page_cid);
	$active = is_page_active('xdata', $page_cid);
	$editable = (!$published  || ($published && !$active));
	
	if ($editable) {
		$form['add'] = array(
			'#title' => t('Add Report/Prompt'),
			'#type' => 'fieldset',   
			'#collapsible' => true,
			'#collapsed'   => true,
		);
		
		$report_count = db_query(
							"SELECT count(s.name) 
							FROM {xdata_adaptor_page} s 
							WHERE fid = :fid
							AND type = 'report'", 
							array(':fid' => $page_cid)
						)->fetchField();
		
		if ($report_count == 0) {
			$types = drupal_map_assoc(array(t('report')));
		}
		elseif (($report_count > 0) && ($report_count < 10)) {
			$types = drupal_map_assoc(array(t('report'), t('prompt')));			
		}
		else {
			$types = drupal_map_assoc(array(t('prompt')));
		}
		$form['add']['type'] = array(
			'#title' => t('Type'),
			'#type' => 'select',
			'#options' => $types,
			'#prefix' => '<div class="container-inline">',
			'#suffix' => '</div>',
			'#description' => t('A page can contain 10 reports.'),
		);
		
		$form['add']['prompt_report'] = array(
			'#title' => t('Prompt/Report'),
			'#type' => 'fieldset',   
			'#collapsible' => true,
			'#states' => array(
				'invisible' => array(
					':input[name="type"]' => array('value' => t('prompt_filter')),
				),
			),
		);		
		
		$form['add']['prompt_report']['name'] = array(
			'#title' => t('Name'),
			'#type' => 'textfield',
			'#prefix' => '<div class="container-inline">',
			'#suffix' => '</div>',			
		);
		
		$form['add']['prompt_report']['dataset'] = array(
			'#title' => t('Dataset'),
			'#type' => 'select',
			'#options' => get_xdata_datasets_by_unit_id($page['unit_id']),
			'#states' => array(
				'visible' => array(
					':input[name="type"]' => array('value' => t('report')),
				),
			),
			'#prefix' => '<div class="container-inline">',
		);
		
		$form['add']['prompt_report']['in_page'] = array(
			'#type' => 'checkbox', 
			'#title' => t('In Page'),
			'#default_value' => 1,
			// '#disabled' => true,
			'#states' => array(
				'visible' => array(
					':input[name="type"]' => array('value' => t('report')),
				),
			),
			'#suffix' => '</div>',
		);		
		
		$form['add']['add_report_prompt'] = array(
			'#value' => t('Add'),
			'#type' => 'submit',
			'#validate' => array('xdata_page_display_add_validate'),
			'#submit' => array('xdata_page_display_add_submit'),
		);	
	}
	
	if (count($prompts) > 0) {
		$form['prompt_name'] = array(
			'#title' => '<b>'. t('Prompts'). '</b>',
			'#type' => 'item',
		);
		$form['prompt_table'] = xdata_page_prompt_form($form_state);
	}
	
	$form['report_name'] = array(
		'#title' => '<b>'. t('Reports'). '</b>',
		'#type' => 'item',
	);
	$form['report_table'] = xdata_page_report_form($form_state);
	
	$form['catalog_path'] = array(
		'#title' => '<b>'. t('Catalog Paths'). '</b>',
		'#type' => 'item',
	);
	$form['catalog_table'] = xdata_catalog_form($form_state);

	return $form;
}


function filter_dataset_select_callback($form, &$form_state) {
	return $form['add']['filter']['filter_dataset'];
}


function constrainChoices_select_callback($form, &$form_state) {
	return $form['add']['filter']['constrainChoices'];
}


function includeAllChoices_checkbox_callback($form, &$form_state) {
	return $form['add']['filter']['includeAllChoices'];
}


function xdata_page_prompt_form(&$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page_name = $entry['name'];
	
	//If the page is published and the associated catalog entry is active, 
	//the prompts cannot edit, remove or upload
	//except changing the associated catalog entry to be blocked.
	$published = is_page_published('xdata', $page_cid);
	$active = is_page_active('xdata', $page_cid);
	$editable = (!$published  || ($published && !$active));
	
	$result = db_select('xdata_adaptor_page', 's')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('s')
		->condition('type', 'prompt', '=')
		->condition('fid', $page_cid, '=')
		->execute();
	
	// $options = array();
	foreach ($result as $key => $row) {
		$entry = serialize(
					array(
						'cid' => $row->cid, 
						'name' => $row->name, 
						'type' => $row->type,
						//'dataset_id' => $row->dataset_id,
						'page_cid' => $page_cid, 
						'page_name' => $page_name, 
					)
				);
		$query = array('query' => array('entry' => $entry));
		
		$edit = l(t('edit'), 'xdata_adaptor/page/display/edit', $query);
		$remove = l(t('remove'), 'xdata_adaptor/page/display/delete', $query);
		$add_prompt_filter = l(t('add prompt filter'), 'xdata_adaptor/page/display/prompt_filter/add', $query);
		
		$op = "";
		if ($editable) {
			$op = "Operations:&nbsp;". $edit. '&nbsp;|&nbsp;'. $remove. '&nbsp;|&nbsp;'. $add_prompt_filter;
		}
		else {
			$op = "Operations:&nbsp;";
		}
		$form['prompt'][$key] = array(
			'#title' => $row->name,
			'#type' => 'fieldset',   
			'#collapsible' => true,
		);
		$form['prompt'][$key]['prompt_cid'] = array(
			'#type' => 'value',
			'#value' => $row->cid,
		);
		$form['prompt'][$key]['operation'] = array(
			'#title' => $op,
			'#type' => 'item',
		);
		
		$form['prompt'][$key]['prompt_filter_table'] = xdata_page_prompt_filter_form($row->cid, $form_state);
	}

	return $form;

}


function xdata_page_prompt_filter_form($prompt_cid, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page_name = $entry['name'];
	
	//If the page is published and the associated catalog entry is active, 
	//the prompts cannot edit, remove or upload
	//except changing the associated catalog entry to be blocked.
	$published = is_page_published('xdata', $page_cid);
	$active = is_page_active('xdata', $page_cid);
	$editable = (!$published  || ($published && !$active));
	
    $header = array(
		'name' => array('field' => 's.name', 'data' => t('Name')),
		'information' => array('data' => t('Information')),
		'dataset' => array('data' => t('Dataset')),
	);
	
	if ($editable) {
		$header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	}
	
	$result = db_select('xdata_adaptor_page', 's')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('s')
		->condition('type', 'prompt_filter', '=')
		->condition('fid', $prompt_cid, '=')
		->execute();
	
	$options = array();
	foreach ($result as $key => $row) {
		$entry = serialize(
					array(
						'page_cid' => $page_cid, 
						'page_name' => $page_name, 
						'prompt_cid' => $prompt_cid,
						'cid' => $row->cid, 
						'name' => $row->name, 
						'dataset_id' => $row->dataset_id,						
					)
				);
		$query = array('query' => array('entry' => $entry));
		
		$edit = l(t('edit'), 'xdata_adaptor/page/display/prompt_filter/edit', $query);
		// $default = l(t('default'), 'xdata_adaptor/page/display/prompt_filter/default', $query);
		$remove = l(t('remove'), 'xdata_adaptor/page/display/delete', $query);
		
		$published = is_page_published('xdata', $page_cid);
		$status_ = ($published)? t('published'): t('generated'); 
		
		$simbaxml = new DOMDocument();
		$simbaxml->formatOutput = true;
		$simbaxml->loadXML($row->simbaxml);
		$promptFilterNode = $simbaxml->getElementsByTagName('promptFilter')->item(0);
		
		$dataset_name = db_query(
							'SELECT name 
							 FROM {xdata_adaptor_dataset} 
							 WHERE id = :id', 
							array(':id' => $row->dataset_id)
						)->fetchField();

		$infos = array();
		$infos[] = 'Caption: '. $promptFilterNode->getAttribute('caption');
		$infos[] = 'Operator: '. $promptFilterNode->getAttribute('op');
		$infos[] = 'Control: '. $promptFilterNode->getAttribute('control');
		$infos[] = 'Constrain: '. $promptFilterNode->getAttribute('constrainChoices');
		$infos[] = 'Default: '. $promptFilterNode->getAttribute('default');
		$infos[] = 'DefaultValue: '. $promptFilterNode->getAttribute('defaultValue');
		if ($promptFilterNode->getAttribute('op') == 'between') {
			$infos[] = 'DefaultValue2: '. $promptFilterNode->getAttribute('defaultValue2');
		}
		
		if ($editable) {
			$options[$row->cid] = array(
				'name' => array('data' => $row->name, 'width' => '20%'),
				'information' => array('data' => theme('item_list', array('items' => $infos)), 'width' => '50%'),
				'dataset' => array('data' => $dataset_name, 'width' => '20%'),
				'operations' => array('data' => $edit. '&nbsp;|&nbsp;'. $remove, 'width' => '10%'),
			);
		}
		else {
			$options[$row->cid] = array(
				'name' => array('data' => $row->name, 'width' => '20%'),
				'information' => array('data' => theme('item_list', array('items' => $infos)), 'width' => '60%'),
				'dataset' => array('data' => $dataset_name, 'width' => '20%'),
			);
		}
	}
	
	$form['xdata_prompt_filter_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function xdata_page_report_form(&$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page_name = $entry['name'];
	
	//If the page is published and the associated catalog entry is active, 
	//the reports cannot edit, remove or upload
	//except changing the associated catalog entry to be blocked.
	$published = is_page_published('xdata', $page_cid);
	$active = is_page_active('xdata', $page_cid);
	$editable = (!$published  || ($published && !$active));
	
    $header = array(
		'name' => array('field' => 's.name', 'data' => t('Name')),
		'dataset' => array('data' => t('Dataset')),
		'status' => array('field' => 's.status', 'data' => t('Status')),
		'operations' => array('data' => t('Operations'), 'colspan' => 1),
	);
	
	// if ($editable) {
		// $header['operations'] = array('data' => t('Operations'), 'colspan' => 4);
	// }
	// else {
		// $header['operations'] = array('data' => t('Operations'), 'colspan' => 1);
	// }
	
	$result = db_select('xdata_adaptor_page', 's')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('s')
		->condition('type', 'report', '=')
		->condition('fid', $page_cid, '=')
		->execute();
	
	$options = array();
	foreach ($result as $row) {
		$entry = serialize(
					array(
						'cid' => $row->cid, 
						'name' => $row->name, 
						'type' => $row->type,
						'dataset_id' => $row->dataset_id,
						'page_cid' => $page_cid, 
						'page_name' => $page_name, 
					)
				);		
		$query = array('query' => array('entry' => $entry));
	
		$edit = l(t('edit'), 'xdata_adaptor/page/display/edit', $query);
		$remove = l(t('remove'), 'xdata_adaptor/page/display/delete', $query);
		$upload = l(t('upload'), 'xdata_adaptor/page/display/upload', $query);
		$download = l(t('download'), 'xdata_adaptor/page/display/download', $query);
		
		$published = is_page_published('xdata', $page_cid);
		$status_ = ($published)? t('published'): t('generated'); 
		
		$dataset_name = db_query(
							'SELECT name 
							 FROM {xdata_adaptor_dataset} 
							 WHERE id = :id', 
							array(':id' => $row->dataset_id)
						)->fetchField();
		
		if ($editable) {
			global $user;
			$is_super_admin = is_super_admin_mobiiapp($user->roles);
			
			if ($is_super_admin) {			
				$options[$row->cid] = array(
					'name' => array('data' => $row->name, 'width' => '50%'),
					'dataset' => array('data' => $dataset_name, 'width' => '15%'),
					'status' => array('data' => ($row->status)? $status_:t('Fail'), 'width' => '10%'),
					'operations' => array('data' => $edit. '&nbsp;|&nbsp;'. $remove. '&nbsp;|&nbsp;'. $upload. '&nbsp;|&nbsp;'. $download, 'width' => '25%'),
				);
			}
			else {
				$options[$row->cid] = array(
					'name' => array('data' => $row->name, 'width' => '65%'),
					'dataset' => array('data' => $dataset_name, 'width' => '15%'),
					'status' => array('data' => ($row->status)? $status_:t('Fail'), 'width' => '10%'),
					'operations' => array('data' => $edit. '&nbsp;|&nbsp;'. $remove, 'width' => '10%'),
				);
			}
		}
		else {
			$options[$row->cid] = array(
				'name' => array('data' => $row->name, 'width' => '65%'),
				'dataset' => array('data' => $dataset_name, 'width' => '15%'),
				'status' => array('data' => ($row->status)? $status_:t('Fail'), 'width' => '10%'),
				'operations' => array('data' => '', 'width' => '10%'),
			);
		}
	}
	
	$form['xdata_report_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;

}


function xdata_catalog_form(&$form_state) {
    $entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page = get_xdata_page_by_cid($page_cid);
	$unit_id = $page['unit_id'];	   
	
	$header = array(
		'unit' => array('data' => t('Group')),
		'path' => array('data' => t('Path')),
	);
	
	
	$result = db_select('mobiiapp_catalog', 'm')
		->extend('PagerDefault')->limit(20)
		->fields('m')
		->condition('cid', $page_cid, '=')
		->condition('adaptor', 'xdata', '=')
		->execute();
	
	$options = array();
	foreach ($result as $row) {
		$_unit = get_unit($row->unit_id);
		$unit_name = $_unit['unit_name'];
		
		if ($unit_id == $row->unit_id) {
			$path = get_directory_path($row->parent_id, $row->unit_id);
		}
		else {
			$path = get_directory_path($row->parent_id, $row->unit_id, false);
		}
		
		$options[$row->id] = array(
			'unit' => array('data' => $unit_name, 'width' => '20'),
			'path' => array('data' => $path ,'width' => '80%'),
		);
					
	}
	
	$form['xdata_catalog_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;

}


function xdata_page_display_add_validate($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$type = $form_state['values']['type'];
	
	if (($type == 'report') && (count($form['add']['prompt_report']['dataset']['#options']) == 0)) {
		form_set_error('dataset', t('Please add dataset before adding ant report.'));
	}
	
	$name = $form_state['values']['name'];
	$fid = $page_cid;
	
	if (trim($name) == "") {
		form_set_error('name', t('Please fill the name for the report/prompt.'));
	}	
	
	$query = 'SELECT count(s.name) 
				FROM {xdata_adaptor_page} s 
				WHERE fid = :fid
				AND name = :name 
				AND type = :type';
	$name_existed = db_query($query, array(':fid' => $fid, ':name' => $name, ':type' => $type))->fetchField();
	if ($name_existed != 0) {
		form_set_error('name', t("The $type name($name) has been existed already."));
	}
}


function xdata_page_display_add_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page_name = $entry['name'];
	$page = get_xdata_page_by_cid($page_cid);
	$unit_id = $page['unit_id'];
	
	$type = $form_state['values']['type'];
	$name = $form_state['values']['name'];
	$fid = $page_cid;
	
	$cid = db_insert('xdata_adaptor_page')
		     ->fields(array(
		        'fid' => $fid,
		    	'name' => $name,
			    'type' => $type,
		    	'unit_id' => $unit_id,
		    	'timestamp' => time(),
			 ))
		    ->execute();
	
	$fields = array();
	global $metadata_client; 
    $gener_simba = new srcMetadataset();
	switch ($type) {
		case 'prompt': 	    
			$prompt = new Prompt();
			$prompt->promptName = $name;
			$gener_simba->prompt = $prompt;
			$gener_simba->style = 'prompt';
			$gener_simba->cid =  $cid;
			$gener_simba->appName = 'sql';
			$simbaxml = $metadata_client->convert_metadata($gener_simba);
			break;
		case 'report':
			$dataset_id = $form_state['values']['dataset'];
			$in_page = $form_state['values']['in_page'];
			$fields['dataset_id'] = $form_state['values']['dataset'];
			$fields['in_page'] = $form_state['values']['in_page'];
			$report = new Report();
			$report->reportSql = get_sql_script_by_dataset($dataset_id);
			$report->reportName = $name;
			$gener_simba->report = $report;        
			$gener_simba->style = 'report';
			$gener_simba->cid =  $cid;
			$gener_simba->appName = 'sql';
			$simbaxml = $metadata_client->convert_metadata($gener_simba);
			break;
	}

	$status = 1;
	if($simbaxml == 'Format is not correct') {
		$status = 0;
	    form_set_error('',t('The dataset is invaid.  Please validate the dataset.')); 
	}
	
	$fields['simbaxml'] = $simbaxml;
	$fields['status'] = $status;
	
	db_update('xdata_adaptor_page')
		->fields($fields)
		->condition('cid', $cid)
		->execute();
	
	xdata_page_update_status($page_cid);
	xdata_page_update_simbaxml($page_name, $page_cid);
	
	back_xdata_page_display($page_cid, $page_name);
}


function xdata_page_display_edit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	$name = $entry['name'];
	$type= $entry['type'];
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$page = get_xdata_page_by_cid($page_cid);
  
    $form['edit'] = array(
		'#title' => t('Edit Prompts/Reports'),
		'#type' => 'fieldset',
	);
	
	$form['edit']['type'] = array(
		'#title' => t('Type'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(array(t('prompt'), t('report'))),
		'#default_value' => $type,
		'#disabled' => TRUE,
		'#required' => TRUE,
	);
	
	$form['edit']['name'] = array(
		'#title' => t('Name'),
		'#type' => 'textfield',
		'#default_value' => $name,
		'#required' => TRUE,
	);
	
	if ($type == 'report') {
		$form['edit']['dataset'] = array(
			'#title' => t('Dataset'),
			'#type' => 'select',
			'#options' => get_xdata_datasets_by_unit_id($page['unit_id']),
			'#default_value' => $entry['dataset_id'],
			'#prefix' => '<div class="container-inline">',
			'#suffix' => '</div>',
		);
	}
	
	$form['edit']['save'] = array(
		'#value' => t('Save'),
		'#type' => 'submit',
		// '#validate' => array('xdata_page_display_edit_validate'),
		// '#submit' => array('xdata_page_display_edit_submit'),
		'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_display_cancel($page_cid, $page_name);		
	$form['edit']['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	return $form;
}


function xdata_page_display_edit_validate($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];	
	$type= $entry['type'];
	$page_cid = $entry['page_cid'];
	$name = $form_state['values']['name'];
	
	$prompt_report = db_query('SELECT s.cid, s.name 
						FROM {xdata_adaptor_page} s 
						WHERE s.cid = :cid', array(':cid' => $cid))->fetchAssoc();
	if ($prompt_report['name'] != $name) {	
		$query = 'SELECT count(s.name) 
					FROM {xdata_adaptor_page} s 
					WHERE fid = :fid
					AND name = :name 
					AND type = :type';
		$name_existed = db_query($query, array(':fid' => $page_cid, ':name' => $name, ':type' => $type))->fetchField();
		if ($name_existed != 0) {
			form_set_error('name', t('The '.$type.' name has been existed already.'));
		}
	}
}


function xdata_page_display_edit_submit($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	$type= $entry['type'];
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
    $name = $form_state['values']['name'];
	
	$fields = array('name' => $name, 'timestamp' => time());	
	
	$changed = false;
	
	if ($type == 'report') {
		$report = db_query('SELECT s.*
							FROM {xdata_adaptor_page} s 
							WHERE s.cid = :cid', array(':cid' => $cid))->fetchAssoc();					
		$dataset_id = $form_state['values']['dataset'];
		
		if ($dataset_id != $report['dataset_id']) {
			$changed = true;
			
			$fields['dataset_id'] = $dataset_id;
			
			global $metadata_client; 
			$gener_simba = new srcMetadataset();
			
			$report = new Report();	
            $report->reportSql = get_sql_script_by_dataset($dataset_id);			
			$report->reportName = $name;
			$gener_simba->report = $report;
			$gener_simba->cid =  $cid;
			$gener_simba->style = 'report';
			$gener_simba->appName = 'sql';
			$simbaxml = $metadata_client->convert_metadata($gener_simba);
			
			$fields['simbaxml'] = $simbaxml;
			
			$fields['status'] = 1;
			if($simbaxml == 'Format is not correct') {
				$fields['status'] = 0;
	            form_set_error('',t('The dataset is invaid.  Please validate the dataset.')); 
	        }
		}
	}
	
	$entry = unserialize($_GET['entry']);
	if($name != $entry['name']) {
		$changed = true;
	}
	
	if ($changed) {
		db_update('xdata_adaptor_page')
			->fields($fields)
			->condition('cid', $cid, '=')
			->execute();
		
		if ($type == 'report') {
			xdata_page_update_prompts_simbaxml_by_page_cid($page_cid);
		}
		
		xdata_page_update_status($page_cid);
		xdata_page_update_simbaxml($page_name, $page_cid);
	}
	
	back_xdata_page_display($page_cid, $page_name);
}


function xdata_page_display_cancel($page_cid, $page_name) {
	$entry = serialize(
				array(
					'cid' => $page_cid, 
					'name' => $page_name, 
				)
			);
	$query = array('query' => array('entry' => $entry)); 
	$cancel = l(t('Cancel'), 'xdata_adaptor/page/display', $query);
	
	return $cancel;
}


function xdata_page_display_delete_confirm($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
    $name = $entry['name'];
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	
	$entry = serialize(
				array(
					'cid' => $page_cid, 
					'name' => $page_name, 
				)
			);	
	
	return confirm_form($form, 
						t('Are you sure you want to delete the item %name ?', 
							array('%name' => $name)), 
						array('path' => 'xdata_adaptor/page/display', 'query' => array('entry' => $entry)), 
						t('This action cannot be undone.'), 
						t('Delete'));

}


function xdata_page_display_delete_confirm_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	
	$record = get_xdata_page_by_cid($cid);
	
	db_delete('xdata_adaptor_page')
		->condition('cid', $cid)
		->execute();
	db_delete('xdata_adaptor_page')
        ->condition('fid',$entry['cid'])
		->execute();
	
	if ($record['type'] == 'prompt_filter') {
		$prompt = get_xdata_page_by_cid($record['fid']);
		xdata_page_update_prompt_simbaxml($prompt['name'], $record['fid'], $record['name']);
	}
	else {
		if ($record['type'] == 'report') {
			xdata_page_update_prompts_simbaxml_by_page_cid($page_cid);
		}
		
		xdata_page_update_status($page_cid);
		xdata_page_update_simbaxml($page_name, $page_cid);
	}
	
	back_xdata_page_display($page_cid, $page_name);
}


function xdata_page_display_prompt_filter_add($form, &$form_state) {
	if(isset($_GET['entry'])) {
		$entry = unserialize($_GET['entry']);
		$page_cid = $entry['page_cid'];
		$page_name = $entry['page_name'];
		$prompt_cid = $entry['cid'];
	}
	else {
		$page_cid = $form_state['values']['page_cid'];
		$page_name = $form_state['values']['page_name'];
		$prompt_cid =  $form_state['values']['prompt_cid'];
	}
	$form['page_cid'] = array(
		'#type' => 'value',
		'#value' => $page_cid,
	);
	$form['page_name'] = array(
		'#type' => 'value',
		'#value' => $page_name,
	);
	$form['prompt_cid'] = array(
		'#type' => 'value',
		'#value' => $prompt_cid,
	);
		
	$page = get_xdata_page_by_cid($page_cid);
	
	$prompt_filters = get_xdata_prompt_filters_by_page_cid($page_cid);
	$prompt_filter_columns = get_prompt_filter_columns_by_page_cid($page_cid);
	$prompt_filter_columns = array_diff($prompt_filter_columns, $prompt_filters);
	$default_prompt_filter_column = isset($form_state['values']['filter_name'])? $form_state['values']['filter_name']: key($prompt_filter_columns);
	
	$form['add'] = array(
		'#title' => t('Prompt Filter'),
		'#type' => 'fieldset',   
	);	
	$form['add']['filter_name'] = array(
		'#title' => t('name'),
		'#type' => 'select',
		'#default_value' => $default_prompt_filter_column,
		'#options' => $prompt_filter_columns,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		'#ajax' => array(
			'callback' => 'add_filter_dataset_select_callback',
			'wrapper' => 'add_select_filter_dataset_replace',
		),
	);
	$form['add']['caption'] = array(
		'#title' => t('caption'),
		'#type' => 'textfield',
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	$form['add']['operator'] = array(
		'#title' => t('operator'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(
							array(
								t('in'),
								t('notIn'),
								t('less'), 
								t('greater'), 
								t('lessOrEqual'),
								t('greaterOrEqual'),
								t('between'),
								t('containsAny'), 
								t('beginsWith'), 
								t('endsWith'),
								t('like'),
								t('notLike'),
							)
						),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	$form['add']['control'] = array(
		'#title' => t('control'),
		'#type' => 'select',
		'#options' => drupal_map_assoc(
							array(
								t('edit'),
								t('calendar'),
								t('drop'), 										
							)
						),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	$form['add']['filter_dataset'] = array(
		'#title' => t('dataset'),
		'#type' => 'select',
		'#options' => get_xdata_datasets_by_unit_id_column_name(
							$page['unit_id'], 
							$prompt_filter_columns[$default_prompt_filter_column]
						),
		'#prefix' => '<div class="container-inline"><div id ="add_select_filter_dataset_replace">',
		'#suffix' => '</div>',
	);
	
	$default_multi = isset($form_state['values']['multi'])? $form_state['values']['multi']: 0;
	$form['add']['multi'] = array(
		'#type' => 'checkbox', 
		'#title' => t('multi'),
		'#default_value' => $default_multi,
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
		'#ajax' => array(
			'callback' => 'add_includeAllChoices_checkbox_callback',
			'wrapper' => 'add_checkbox_includeAllChoices_replace',
		),
	);
	$form['add']['includeAllChoices'] = array(
		'#type' => 'checkbox', 
		'#title' => t('includeAllChoices'),
		'#default_value' => $default_multi,
		'#disabled' => (!$default_multi),
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
		'#prefix' => '<div id ="add_checkbox_includeAllChoices_replace">',
		'#suffix' => '</div></div>',
	);
	$form['add']['constrainChoices'] = array(
		'#title' => t('constrainChoices'),
		'#type' => 'select',
		'#empty_option' => 'no constrain',
		'#options' => get_xdata_prompt_filters_by_prompt($prompt_cid, TRUE),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
	);
	
	$form['add']['next'] = array(
		'#value' => t('Next'),
		'#type' => 'submit',
	'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_display_cancel($page_cid, $page_name);		
	$form['add']['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


function add_filter_dataset_select_callback($form, &$form_state) {
	return $form['add']['filter_dataset'];
}


function add_includeAllChoices_checkbox_callback($form, &$form_state) {
	return $form['add']['includeAllChoices'];
}


function xdata_page_display_prompt_filter_add_validate($form, &$form_state) {
	if (!in_array($form_state['values']['operator'], array(t('in'), t('notIn'))) && 
		($form_state['values']['control'] == t('drop')) && 
		$form_state['values']['multi']) {
		form_set_error('opertor', t("Only operator 'in' or 'notIn' support 'drop' control with 'multi'."));
	}
	
	if (!in_array($form_state['values']['operator'], 
			array(t('in'), t('notIn'), t('less'), t('greater'), t('lessOrEqual'), t('greaterOrEqual'), t('between'))) &&
		($form_state['values']['control'] == t('calendar'))) {
		form_set_error('opertor', t("Only operator 'in', 'notIn', 'less', 'greater', 'lessOrEqual', 'greaterOrEqual' or 'between' support 'calendar' control."));
	}
			
	if ($form_state['values']['constrainChoices'] != 0) {
		if ($form_state['values']['control'] != t('drop')) {
			form_set_error('control', t("If constrainChoices is set, please select 'drop' at control."));
		}
		else {
			$selected_column = $form_state['values']['filter_name'];
			$name = $form['add']['filter_name']['#options'][$selected_column];
			
			$selected_constrainChoices = $form_state['values']['constrainChoices'];
			$constrainChoices = $form['add']['constrainChoices']['#options'][$selected_constrainChoices];
			
			// The constrainChoices($constrainChoices) must be at the same dataset with the name($name).
			$constrain_prompt_filter = get_xdata_page_by_cid($selected_constrainChoices);
			$dataset_id = $form_state['values']['filter_dataset'];	
			if ($dataset_id != $constrain_prompt_filter['dataset_id']) {
				form_set_error('constrainChoices', t("The constrainChoices($constrainChoices) must be at the same dataset with the name($name)."));
			}
		}
	}
}


function xdata_page_display_prompt_filter_add_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$prompt_cid = $entry['cid'];
	$prompt_name = $entry['name'];
		
	$selected_column = $form_state['values']['filter_name'];
	$name = $form['add']['filter_name']['#options'][$selected_column];
	
	$page = get_xdata_page_by_cid($page_cid);
	$unit_id = $page['unit_id'];
	
	global $metadata_client; 
	$gener_simba = new srcMetadataset();
	
	$dataset_id = ($form_state['values']['control'] == 'drop')? $form_state['values']['filter_dataset']: 0;
	
	$attributes = array();
	$attributes['formula'] = $name;
	$attributes['op'] = $form_state['values']['operator'];
	$attributes['default'] = '';
	$attributes['defaultValue'] = '';
	$attributes['defaultValue2'] = '';
	
	$attributes['control'] = (($form_state['values']['control'] == 'drop') 
								&& ($form_state['values']['multi']))? 
							'multi': $form_state['values']['control'];
	
	$attributes['values'] = ($form_state['values']['control'] == 'drop')? get_sql_script_by_dataset($dataset_id, 'filter_value', $name): '';
	
	$attributes['includeAllChoices'] = (($form_state['values']['includeAllChoices'] == 1) && 
										($form_state['values']['control'] == 'drop') && 
										($form_state['values']['multi']))? 'true': 'false';
	
	$selected_constrainChoices = $form_state['values']['constrainChoices'];
	$constrainChoices = ($selected_constrainChoices != 0)? 
		$form['add']['constrainChoices']['#options'][$selected_constrainChoices]: '';
	$attributes['constrainChoices'] = $constrainChoices;
	
	$attributes['caption'] = (trim($form_state['values']['caption']) != '')? $form_state['values']['caption']: $name;
	
	$simbaxml = get_prompt_filter_simbaxml($attributes);
	
	$status = 1;
	if($simbaxml == 'Format is not correct') {
		$status = 0;
		form_set_error('',t('The dataset is invaid.  Please validate the dataset.')); 
	}

	$entry = serialize(
				array(
					'page_cid' => $page_cid,
					'page_name' => $page_name,
					'prompt_cid' => $prompt_cid,
					'name' => $name,
					'unit_id' => $unit_id,
					'dataset_id' => $dataset_id,
					'simbaxml' => $simbaxml,
					'status' => $status,
				)
			);
	$query = array('query' => array('entry' => $entry));
	
	drupal_goto('xdata_adaptor/page/display/prompt_filter/default', $query);
}


function xdata_page_display_prompt_filter_edit($form, &$form_state) {
	if(isset($_GET['entry'])) {
		$entry = unserialize($_GET['entry']);
		$page_cid = $entry['page_cid'];
		$page_name = $entry['page_name'];
		$prompt_cid = $entry['prompt_cid'];
		$cid = $entry['cid'];
		$name = $entry['name'];
		$dataset_id = $entry['dataset_id'];		
	}
	else {
		$page_cid = $form_state['values']['page_cid'];
		$page_name = $form_state['values']['page_name'];
		$prompt_cid =  $form_state['values']['prompt_cid'];
		$cid =  $form_state['values']['cid'];
		$name =  $form_state['values']['name'];
		$dataset_id =  $form_state['values']['dataset_id'];		
	}
	$form['page_cid'] = array(
		'#type' => 'value',
		'#value' => $page_cid,
	);
	$form['page_name'] = array(
		'#type' => 'value',
		'#value' => $page_name,
	);
	$form['prompt_cid'] = array(
		'#type' => 'value',
		'#value' => $prompt_cid,
	);
	$form['cid'] = array(
		'#type' => 'value',
		'#value' => $cid,
	);
	$form['name'] = array(
		'#type' => 'value',
		'#value' => $name,
	);
	$form['dataset_id'] = array(
		'#type' => 'value',
		'#value' => $dataset_id,
	);
	
	$prompt_filter = get_xdata_page_by_cid($cid);
	$simbaxml = new DOMDocument();
	$simbaxml->loadXML($prompt_filter['simbaxml']);
	$promptFilterNode = $simbaxml->getElementsByTagName('promptFilter')->item(0);
	
	$prompt_filters = get_xdata_prompt_filters_by_page_cid($page_cid);
	$prompt_filter_columns = get_prompt_filter_columns_by_page_cid($page_cid);
	$prompt_filter_columns = array_diff($prompt_filter_columns, $prompt_filters);
	
	$prompt_filter_columns[] = $name;
	sort($prompt_filter_columns);
	
	$default_prompt_filter_column = 
		isset($form_state['values']['filter_name'])? $form_state['values']['filter_name']: array_search($name, $prompt_filter_columns);
	
	$form['edit'] = array(
		'#title' => t('Prompt Filter'),
		'#type' => 'fieldset',   
	);	
	$form['edit']['filter_name'] = array(
		'#title' => t('name'),
		'#type' => 'select',
		'#default_value' => $default_prompt_filter_column,
		'#options' => $prompt_filter_columns,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		'#ajax' => array(
			'callback' => 'edit_filter_dataset_select_callback',
			'wrapper' => 'edit_select_filter_dataset_replace',
		),
	);
	$form['edit']['caption'] = array(
		'#title' => t('caption'),
		'#type' => 'textfield',
		'#default_value' => $promptFilterNode->getAttribute('caption'),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	$form['edit']['operator'] = array(
		'#title' => t('operator'),
		'#type' => 'select',
		'#default_value' => $promptFilterNode->getAttribute('op'),
		'#options' => drupal_map_assoc(
						array(
							t('in'),
							t('notIn'),
							t('less'), 
							t('greater'), 
							t('lessOrEqual'),
							t('greaterOrEqual'),
							t('between'),
							t('containsAny'), 
							t('beginsWith'), 
							t('endsWith'),
							t('like'),
							t('notLike'),
						)
					),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	
	$multi = 0;
	$control = $promptFilterNode->getAttribute('control');
	if ($control == 'multi') {
		$control = 'drop';
		$multi = 1;
	}
	$default_multi = isset($form_state['values']['multi'])? $form_state['values']['multi']: $multi;
	$form['edit']['control'] = array(
		'#title' => t('control'),
		'#type' => 'select',
		'#default_value' => $control,
		'#options' => drupal_map_assoc(
							array(
								t('edit'),
								t('calendar'),
								t('drop'), 									
							)
						),
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	$form['edit']['filter_dataset'] = array(
		'#title' => t('dataset'),
		'#type' => 'select',
		'#default_value' => $dataset_id,
		'#options' => get_xdata_datasets_by_unit_id_column_name(
							$prompt_filter['unit_id'], 
							$prompt_filter_columns[$default_prompt_filter_column]
						),
		'#prefix' => '<div class="container-inline"><div id ="edit_select_filter_dataset_replace">',
		'#suffix' => '</div>'
	);
	
	$form['edit']['multi'] = array(
		'#type' => 'checkbox', 
		'#title' => t('multi'),
		'#default_value' => $default_multi,
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
		'#ajax' => array(
			'callback' => 'edit_includeAllChoices_checkbox_callback',
			'wrapper' => 'checkbox_includeAllChoices_edit_replace',
		),
	);
	
	$includeAllChoices = ($promptFilterNode->getAttribute('includeAllChoices') == 'true')? 1: 0;
	$default_includeAllChoices = isset($form_state['values']['includeAllChoices'])? 
		$form_state['values']['includeAllChoices']: $includeAllChoices;
	$form['edit']['includeAllChoices'] = array(
		'#type' => 'checkbox', 
		'#title' => t('includeAllChoices'),
		//If 'drop without multi' is selected, it will be reset.
		'#default_value' => ($default_multi)? $default_includeAllChoices: 0,
		'#disabled' => (!$default_multi),
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
		'#prefix' => '<div id ="checkbox_includeAllChoices_edit_replace">',
		'#suffix' => '</div></div>',
	);
	
	$default_constrainChoices = $promptFilterNode->getAttribute('constrainChoices');
	$prompt_filters = get_xdata_prompt_filters_by_prompt($prompt_cid, TRUE);
	$form['edit']['constrainChoices'] = array(
		'#title' => t('constrainChoices'),
		'#type' => 'select',
		'#empty_option' => 'no constrain',
		'#default_value' => array_search($default_constrainChoices, $prompt_filters),
		'#options' => $prompt_filters,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		'#states' => array(
			'visible' => array(
				':input[name="control"]' => array('value' => t('drop')),
			),
		),
	);
	
	$form['edit']['default'] = array(
		'#type' => 'value',
		'#value' => $promptFilterNode->getAttribute('default'),
	);
	$form['edit']['defaultValue'] = array(
		'#type' => 'value',
		'#value' => $promptFilterNode->getAttribute('defaultValue'),
	);
	$form['edit']['defaultValue2'] = array(
		'#type' => 'value',
		'#value' => $promptFilterNode->getAttribute('defaultValue2'),
	);
	
	$form['edit']['next'] = array(
		'#value' => t('Next'),
		'#type' => 'submit',
		'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_display_cancel($page_cid, $page_name);		
	$form['edit']['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


function edit_filter_dataset_select_callback($form, &$form_state) {
	return $form['edit']['filter_dataset'];
}


function edit_includeAllChoices_checkbox_callback($form, &$form_state) {
	return $form['edit']['includeAllChoices'];
}


function xdata_page_display_prompt_filter_edit_validate($form, &$form_state) {
	if (!in_array($form_state['values']['operator'], array(t('in'), t('notIn'))) && 
		($form_state['values']['control'] == t('drop')) && 
		$form_state['values']['multi']) {
		form_set_error('opertor', t("Only operator 'in' or 'notIn' support 'drop' control with 'multi'."));
	}
	
	if (!in_array($form_state['values']['operator'], 
			array(t('in'), t('notIn'), t('less'), t('greater'), t('lessOrEqual'), t('greaterOrEqual'), t('between'))) &&
		($form_state['values']['control'] == t('calendar'))) {
		form_set_error('opertor', t("Only operator 'in', 'notIn', 'less', 'greater', 'lessOrEqual', 'greaterOrEqual' or 'between' support 'calendar' control."));
	}
	
	if ($form_state['values']['constrainChoices'] != 0) {
		if ($form_state['values']['control'] != t('drop')) {
			form_set_error('control', t("If constrainChoices is set, please select 'drop' at control."));
		}
		else {
			$selected_column = $form_state['values']['filter_name'];
			$name = $form['edit']['filter_name']['#options'][$selected_column];
			
			$selected_constrainChoices = $form_state['values']['constrainChoices'];
			$constrainChoices = $form['edit']['constrainChoices']['#options'][$selected_constrainChoices];
			
			if ($constrainChoices == $name) {
				form_set_error('constrainChoices', t("The constrainChoices($constrainChoices) cannot be the same as the name($name)."));
			}
			
			// The constrainChoices($constrainChoices) must be at the same dataset with the name($name).
			$constrain_prompt_filter = get_xdata_page_by_cid($selected_constrainChoices);
			$dataset_id = $form_state['values']['filter_dataset'];	
			if ($dataset_id != $constrain_prompt_filter['dataset_id']) {
				form_set_error('constrainChoices', t("The constrainChoices($constrainChoices) must be at the same dataset with the name($name)."));
			}
		}
	}
}


function xdata_page_display_prompt_filter_edit_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$prompt_cid = $entry['prompt_cid'];
	$cid = $entry['cid'];		
	
	$selected_column = $form_state['values']['filter_name'];
	$name = $form['edit']['filter_name']['#options'][$selected_column];

	$dataset_id = ($form_state['values']['control'] == 'drop')? $form_state['values']['filter_dataset']: 0;			

	$attributes = array();
	$attributes['formula'] = $name;
	$attributes['op'] = $form_state['values']['operator'];
	$attributes['default'] = $form_state['values']['default'];
	$attributes['defaultValue'] = $form_state['values']['defaultValue'];
	$attributes['defaultValue2'] = $form_state['values']['defaultValue2'];

	$attributes['control'] = (($form_state['values']['control'] == 'drop') 
								&& ($form_state['values']['multi']))? 
							'multi': $form_state['values']['control'];

	$attributes['values'] = ($form_state['values']['control'] == 'drop')? get_sql_script_by_dataset($dataset_id, 'filter_value', $name): '';

	$attributes['includeAllChoices'] = (
										($form_state['values']['includeAllChoices'] == 1) && 
										($form_state['values']['control'] == 'drop') && 
										($form_state['values']['multi'])
										)? 'true': 'false';

	$selected_constrainChoices = $form_state['values']['constrainChoices'];
	$constrainChoices = ($selected_constrainChoices != 0)? 
		$form['edit']['constrainChoices']['#options'][$selected_constrainChoices]: '';
	$attributes['constrainChoices'] = $constrainChoices;

	$attributes['caption'] = (trim($form_state['values']['caption']) != '')? $form_state['values']['caption']: $name;

	$simbaxml = get_prompt_filter_simbaxml($attributes);

	$prompt = get_xdata_page_by_cid($prompt_cid);
	
	$entry = serialize(
				array(
					'page_cid' => $page_cid,
					'page_name' => $page_name,
					'prompt_cid' => $prompt_cid,
					'cid' => $cid,
					'name' => $name,
					'unit_id' => $prompt['unit_id'],
					'dataset_id' => $dataset_id,
					'simbaxml' => $simbaxml,
				)
			);
	$query = array('query' => array('entry' => $entry));
	
	drupal_goto('xdata_adaptor/page/display/prompt_filter/default', $query);
}


function xdata_page_display_prompt_filter_default($form, &$form_state) {
	if(isset($_GET['entry'])) {
		$entry = unserialize($_GET['entry']);
		$page_cid = $entry['page_cid'];
		$page_name = $entry['page_name'];
		$prompt_cid = $entry['prompt_cid'];
		if (isset($entry['cid'])) {
			$cid = $entry['cid'];
		}
		$name = $entry['name'];
		$unit_id = $entry['unit_id'];
		$dataset_id = $entry['dataset_id'];
		$simbaxml = $entry['simbaxml'];
	}
	else {
		$page_cid = $form_state['values']['page_cid'];
		$page_name = $form_state['values']['page_name'];
		$prompt_cid =  $form_state['values']['prompt_cid'];
		if (isset($form_state['values']['cid'])) {
			$cid =  $form_state['values']['cid'];
		}
		$name =  $form_state['values']['name'];
		$unit_id =  $form_state['values']['unit_id'];
		$dataset_id =  $form_state['values']['dataset_id'];		
		$simbaxml = $form_state['values']['simbaxml'];
	}
	$form['page_cid'] = array(
		'#type' => 'value',
		'#value' => $page_cid,
	);
	$form['page_name'] = array(
		'#type' => 'value',
		'#value' => $page_name,
	);
	$form['prompt_cid'] = array(
		'#type' => 'value',
		'#value' => $prompt_cid,
	);
	if (isset($cid)) {
		$form['cid'] = array(
			'#type' => 'value',
			'#value' => $cid,
		);
	}
	$form['name'] = array(
		'#type' => 'value',
		'#value' => $name,
	);
	$form['unit_id'] = array(
		'#type' => 'value',
		'#value' => $unit_id,
	);
	$form['dataset_id'] = array(
		'#type' => 'value',
		'#value' => $dataset_id,
	);
	$form['simbaxml'] = array(
		'#type' => 'value',
		'#value' => $simbaxml,
	);

	$simbaxml_dom = new DOMDocument();
	$simbaxml_dom->loadXML($simbaxml);
	$promptFilterNode = $simbaxml_dom->getElementsByTagName('promptFilter')->item(0);
	
	$operator = $promptFilterNode->getAttribute('op');
	$control = $promptFilterNode->getAttribute('control');
	if (($control == 'drop') || ($control == 'multi')) {
		$default_options = drupal_map_assoc(array(t('sqlExpression')));
	}
	else {
		$default_options = drupal_map_assoc(array(t('noDefault'), t('specific'), t('sqlExpression')));
	}
	
	$form['edit']['default'] = array(
		'#title' => t('default'),
		'#type' => 'select',
		'#default_value' => ($promptFilterNode->getAttribute('default') == '')? 
								'noDefault': $promptFilterNode->getAttribute('default'),
		'#options' => $default_options,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
	);
	
	$datasets = get_xdata_datasets_by_unit_id_column_name($unit_id, $name);
	
	$default_dataset = (isset($form_state['values']['filter_dataset']))? 
							$form_state['values']['filter_dataset']: 
							(($dataset_id == 0)? key($datasets): $dataset_id);
	
	$form['edit']['sql_exp'] = array(
		'#title' => t('SQL Expression'),
		'#type' => 'fieldset',
		'#states' => array(
			'visible' => array(
				':input[name="default"]' => array('value' => t('sqlExpression')),
			),
		),		
	);
	
	$form['edit']['sql_exp']['filter_dataset'] = array(
		'#title' => t('dataset'),
		'#type' => 'select',
		'#disabled' => ($promptFilterNode->getAttribute('values') != ''),
		'#default_value' => $default_dataset,
		'#options' => $datasets,
		'#prefix' => '<div class="container-inline">',
		'#suffix' => '</div>',
		'#ajax' => array(
			'callback' => 'sql_script_fieldset_callback',
			'wrapper' => 'base_sql_script_replace',
		),
	);
	
	
	$form['edit']['sql_exp']['base_sql'] = array(
		'#type' => 'item',
		//'#title' => t('Base SQL'),
		'#markup' => get_prompt_filter_base_sql($default_dataset, $name),
		'#prefix' => '<div id ="base_sql_script_replace">',
		'#suffix' => '</div>',
	);
	$form['edit']['sql_exp']['where'] = array(
		'#title' => t('Condtion (WHERE)'),
		'#type' => 'textarea',
		'#default_value' => $promptFilterNode->getAttribute('defaultValue'),
		'#rows' => 6,
		'#description' => t('The default value for the prompt filter.'),
	);
	
	if ($operator == 'between') {
		$form['edit']['sql_exp']['where2'] = array(
			'#title' => t('Condtion2 (WHERE)'),
			'#type' => 'textarea',
			'#default_value' => $promptFilterNode->getAttribute('defaultValue2'),
			'#rows' => 6,
			'#description' => t('The default value 2 for the prompt filter.'),
		);
	}
	
	$form['edit']['specific'] = array(
		'#title' => t('Specific'),
		'#type' => 'fieldset',
		'#states' => array(
			'visible' => array(
				':input[name="default"]' => array('value' => t('specific')),
			),
		),		
	);
	$form['edit']['specific']['defaultValue'] = array(
		'#title' => t('defaultValue'),
		'#type' => 'textarea',
		'#default_value' => $promptFilterNode->getAttribute('defaultValue'),
		'#rows' => 6,
		'#description' => t('The default value for the prompt filter.  Please use <b>(BLANK)</b> as blank value and <b>(NULL)</b> as null value.'),
	);
	
	if ($operator == 'between') {
		$form['edit']['specific']['defaultValue2'] = array(
			'#title' => t('defaultValue2'),
			'#type' => 'textarea',
			'#default_value' => $promptFilterNode->getAttribute('defaultValue2'),
			'#rows' => 6,
			'#description' => t('The default value 2 for the prompt filter.  Please use <b>(BLANK)</b> as blank value and <b>(NULL)</b> as null value.'),
		);
	}

	$form['edit']['save'] = array(
		'#value' => t('Save'),
		'#type' => 'submit',
		// '#validate' => array('xdata_page_display_prompt_filter_default_validate'),
		// '#submit' => array('xdata_page_display_prompt_filter_default_submit'),
		'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_display_cancel($page_cid, $page_name);		
	$form['edit']['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	
	return $form;
}


function xdata_page_display_prompt_filter_default_validate($form, &$form_state) {
	if ($form_state['values']['op'] == t('Save')) {	
		$entry = unserialize($_GET['entry']);
		$name = $entry['name'];
		$simbaxml = $entry['simbaxml'];
			
		$simbaxml_dom = new DOMDocument();
		$simbaxml_dom->formatOutput = true;
		$simbaxml_dom->loadXML($simbaxml);
		$promptFilterNode = $simbaxml_dom->getElementsByTagName('promptFilter')->item(0);
		
		$default = $form_state['values']['default'];
		
		switch ($default) {
			case 'sqlExpression':
				$dataset_id = $form_state['values']['filter_dataset'];
				$dataset = db_query('SELECT * FROM {xdata_adaptor_dataset} WHERE id = :id', array(':id' => $dataset_id))->fetchAssoc();
				$interface_id = $dataset['interface_id'];
				$dataset_type = $dataset['type'];
			
				$condition = $form_state['values']['where'];
				$sql_script = get_sql_script_by_dataset($dataset_id, 'filter_default', $name, $condition);		
				
				$validate = validate_database_sql_script($sql_script, $interface_id, $dataset_type);
				if ($validate != 'success') {
					form_set_error('where', $validate);		
				}
				
				if ($promptFilterNode->getAttribute('op') == 'between') {		
					$condition2 = $form_state['values']['where2'];
					$sql_script2 = get_sql_script_by_dataset($dataset_id, 'filter_default', $name, $condition2);
					
					$validate2 = validate_database_sql_script($sql_script2, $interface_id, $dataset_type);
					if ($validate2 != 'success') {
						form_set_error('where2', $validate2);		
					}
				}
				break;
			case 'specific':
				$defaultValue = trim($form_state['values']['defaultValue']);
				if ($defaultValue == '') {
					form_set_error('defaultValue', t('Please use (BLANK) as blank value and (NULL) as null value.'));
				}
				
				if ($promptFilterNode->getAttribute('op') == 'between') {
					$defaultValue2 = trim($form_state['values']['defaultValue2']);
					if ($defaultValue2 == '') {
						form_set_error('defaultValue2', t('Please use (BLANK) as blank value and (NULL) as null value.'));
					}
				}
				break;
		}
	}
}


function xdata_page_display_prompt_filter_default_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$prompt_cid = $entry['prompt_cid'];
	
	$name = $entry['name'];
	$unit_id = $entry['unit_id'];
	$dataset_id = $entry['dataset_id'];
	$simbaxml = $entry['simbaxml'];
	
	$fields = array('timestamp' => time());
	if (isset($entry['cid'])) {
		$cid = $entry['cid'];
		$fields['name'] = $name;
		$fields['dataset_id'] = $dataset_id;
	}
	else {
		$status = $entry['status'];		
		$cid = db_insert('xdata_adaptor_page')
				 ->fields(array(
					'fid' => $prompt_cid,
					'name' => $name,
					'type' => 'prompt_filter',
					'unit_id' => $unit_id,
					'dataset_id' => $dataset_id,
					'status' => $status,
					'timestamp' => time(),
				 ))
				->execute();
	}

	$simbaxml_dom = new DOMDocument();
	$simbaxml_dom->formatOutput = true;
	$simbaxml_dom->loadXML($simbaxml);
	$promptFilterNode = $simbaxml_dom->getElementsByTagName('promptFilter')->item(0);
	
	$default = $form_state['values']['default'];
	
	$attributes = array();
	$attributes['formula'] = $promptFilterNode->getAttribute('formula');
	$attributes['op'] = $promptFilterNode->getAttribute('op');
	$attributes['default'] = ($default == 'noDefault')? "": $default;
	$attributes['defaultValue'] = '';
	$attributes['defaultValue2'] = '';	
	$attributes['control'] = $promptFilterNode->getAttribute('control');	
	$attributes['values'] = $promptFilterNode->getAttribute('values');	
	$attributes['includeAllChoices'] = $promptFilterNode->getAttribute('includeAllChoices');	
	$attributes['constrainChoices'] = $promptFilterNode->getAttribute('constrainChoices');	
	$attributes['caption'] = $promptFilterNode->getAttribute('caption');
		
	switch ($default) {
		case 'sqlExpression':
			if ($attributes['values'] == '') {
				$dataset_id = $form_state['values']['filter_dataset'];
				$fields['dataset_id'] = $dataset_id;
			}
			
			$attributes['defaultValue'] = $form_state['values']['where'];			
			if ($attributes['op'] == 'between') {		
				$attributes['defaultValue2'] = $form_state['values']['where2'];
			}
			break;
		case 'specific':
			if (($attributes['values'] == '') && ($dataset_id != 0)) {
				$fields['dataset_id'] = 0;
			}
			$attributes['defaultValue'] = $form_state['values']['defaultValue'];
			if ($attributes['op'] == 'between') {		
				$attributes['defaultValue2'] = $form_state['values']['defaultValue2'];
			}
			break;
		case 'noDefault':
			if (($attributes['values'] == '') && ($dataset_id != 0)) {
				$fields['dataset_id'] = 0;
			}
			break;
	}
	
	$simbaxml = get_prompt_filter_simbaxml($attributes);
	$fields['simbaxml'] = $simbaxml;
	
	db_update('xdata_adaptor_page')
		->fields($fields)
		->condition('cid', $cid)
		->execute();
	
	$prompt = get_xdata_page_by_cid($prompt_cid);
	xdata_page_update_prompt_simbaxml($prompt['name'], $prompt_cid);
	
	back_xdata_page_display($page_cid, $page_name);
}


function sql_script_fieldset_callback($form, &$form_state) {
	return $form['edit']['sql_exp']['base_sql'];
}


function get_prompt_filter_base_sql($default_dataset, $column_name) {
	$dataset = db_query('SELECT s.name,								
							s.sql_select,
							s.sql_from,
							s.sql_where,
							s.type,
							s.interface_id
					FROM {xdata_adaptor_dataset} s 
					WHERE s.id = :id', 
					array(':id' => $default_dataset))->fetchAssoc();
	
	$columns = explode(',', $dataset['sql_select']);
	foreach ($columns as $column) {
		if (preg_match("/.$column_name/i", $column)) {
			$distinct_column = $column;
			break;
		}
	}
	
	
	$select = 'SELECT DISTINCT'. "<br/>". $distinct_column. "<br/>";
	$from = 'FROM'. "<br/>". str_replace("\r\n", "<br/>", $dataset['sql_from']);
	
	$base_sql = $select. $from;
	
	return $base_sql;
}


function xdata_page_display_upload($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$form['upload_file'] = array(
		'#type' => 'file',
		'#title' => t('Upload File'),
		'#size' => 40,
		'#description' => t('Select an XML file to update.'),
	);
	$form['upload'] = array(
		'#type' => 'submit',
		'#value' => t('Upload'),
		'#prefix' => '<div class="container-inline">',
	);	
	$cancel = xdata_page_display_cancel($page_cid, $page_name);		
	$form['cancel'] = array(
		'#type' => 'item',
		'#title' => "<b>$cancel</b>",
		'#suffix' => '</div>',
	);
	$form['#attributes'] = array('enctype' => "multipart/form-data");	

	return $form;
}


function xdata_page_display_upload_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['page_cid'];
	$page_name = $entry['page_name'];
	$cid = $entry['cid'];
	$name = $entry['name'];
	$type = $entry['type'];
	$file = file_save_upload('upload_file', array('file_validate_extensions' => array()), 'temporary://');
	
	if (!empty($file)) {		
		if ($file->filename != $name.'.xml') {  
			//validate the right simbaxml file.
			form_set_error('',t('Please upload the right xml file,whose name should be '.$name.'.xml.'));  
		}
		else {
			$fields = array('timestamp' => time());	
			
			$path = str_replace("temporary://", "/tmp/", $file->uri);	
			$handle = fopen($path, "r");
			$xmlfile = fread($handle, filesize($path));
			$simbaxml = $xmlfile;
			$fields['simbaxml'] = $simbaxml;
			
			$dom = new DOMDocument();
			$dom->loadXML($xmlfile);
			$simbas = $dom->getElementsByTagName('simba');
	        
			foreach($simbas as $simba){
				$simba_cid = $simba->getAttribute('cid');
			}
			
	        if ($simba_cid != $cid) {
				//validate the cid of simbaxml.
				form_set_error('',t('Please upload the right xml file,whose cid should be '. $cid.'.')); 
	        }
			else{
				if($type == 'report') {
					global $metadata_client; 
					$gener_simba = new srcMetadataset();
					$report = new Report();					
					$report->reportName = $name;
					$gener_simba->report = $report;
					$gener_simba->cid =  $cid;
					$gener_simba->style = 'report';
					$gener_simba->appName = 'sql';
					$gener_simba->srcMetadata = $xmlfile;     //return the upoaded simbaxml file to thrift...
					$simbaxml = $metadata_client->convert_metadata($gener_simba);
					$fields['simbaxml'] = $simbaxml;
					
					$fields['status'] = 1;
					if($simbaxml == 'Format is not correct') {
						$fields['status'] = 0;
						form_set_error('',t('The upload file is invalid. Please validate it.')); 
					}
				}
			}
			
			fclose($handle);
			file_delete($file, true);
			
			db_update('xdata_adaptor_page')
				->fields($fields)
				->condition('cid', $entry['cid'], '=')
				->execute();
				
			xdata_page_update_status($page_cid);
			
			drupal_set_message(t('This '.$entry['type']. ' "'.$name. '" simbaxml has been uploaded successfully.'));		
		}	   
	}
	else {
		form_set_error('',t('The xml file is empty.'));
	}
	
	back_xdata_page_display($page_cid, $page_name);
}


function xdata_page_display_download($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	
	$query = 'SELECT s.simbaxml FROM {xdata_adaptor_page} s WHERE cid = :cid';
	$simbaxml = db_query($query, array(':cid' => $entry['cid']))->fetchField();

	$Content_Disposition = 'attachment; filename = '.$entry['name'].'.xml'; 	
	drupal_add_http_header('Content-Type', 'text/xml');
	drupal_add_http_header('Content-Disposition', $Content_Disposition);
	drupal_add_http_header('Content-Transfer-Encoding', 'binary');
	ob_clean();
	print $simbaxml;
	exit;	
}

?>
