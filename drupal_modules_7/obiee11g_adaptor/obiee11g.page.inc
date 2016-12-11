<?php


function back_obiee11g_page($unit_id) {
	$entry = serialize(array('unit_id' => $unit_id));
	$query = array('query' => array('entry' => $entry));
	drupal_goto('obiee11g_adaptor/page', $query);
}


// Pages can be published only when they are generated.
function get_obiee11g_pages_by_unit_id($unit_id) {
	
	$result = db_query("SELECT o.cid, o.name 
						FROM {obiee11g_adaptor_page} o
						WHERE o.status = 1
						AND o.unit_id = :unit_id AND o.type = 'page' ", array(':unit_id' => $unit_id));
	$pages = array();
	foreach($result as $row) {
		$pages[$row->cid] = $row->name;
	}
	
	return $pages;
}


function back_obiee11g_page_display($page_cid, $path) {
	$entry = serialize(
				array(
					'cid' => $page_cid, 
					'obieepath' => $path, 
				)
			);
	$query = array('query' => array('entry' => $entry)); 
	drupal_goto('obiee11g_adaptor/page/display', $query);
}



function get_obiee11g_page_by_cid($cid) {
	$page = db_query('SELECT o.* 
						FROM {obiee11g_adaptor_page} o
						WHERE o.cid = :cid', array(':cid' => $cid))->fetchAssoc();
	return $page;
}


function is_obiee11g_page_generated($cid) {
	$page = get_obiee11g_page_by_cid($cid);
	$status = $page['status'];
	$generated = ($status == 1)? true: false;
	
	return $generated;
}


function obiee11g_page_form($form, &$form_state) {
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
			'#submit' => array('obiee11g_page_form_submit'),
		);
	}
	
	$form['table'] = obiee11g_page_list_form($form);	

	return $form;
}


function obiee11g_page_form_submit($form, &$form_state) {
	$unit_id = $form_state['values']['unit'];
	back_obiee11g_page($unit_id);
}


function obiee11g_get_prompts_and_reports($cid,$requestxml,$obiee11gClient,$interface_id,$unit_id){
    $requestxml_doc= new DOMDocument();
    
    if($requestxml != 'SOAP Fault' && isset($requestxml)){
        $requestxml_doc->loadxml($requestxml); 
	}
    
    $fid = $cid; 
   // $prompts = array();	
    foreach ($requestxml_doc->getElementsByTagName("globalFilterView") as $prompt){
        $prompts[] = $prompt;
    }
  
    if(!empty($prompts)){
        foreach($prompts as $prompt){
            $promptpath = $prompt->getAttribute('path');
	        $requestxml_prompt = obiee11g_interface_get_requestxml($obiee11gClient,$promptpath);
			db_insert('obiee11g_adaptor_page')
		        ->fields(array(
				    'fid' => $cid,
					'obieepath' => $promptpath,
					'name' => '',
					'type' => 'prompt',
					'requestxml' => $requestxml_prompt,
					'status' => 0,
					'interface_id' => $interface_id, 
					'unit_id' => $unit_id, 					
					'timestamp' => time(),
				)
			)
		    ->execute();
        }
    }
	
	foreach ($requestxml_doc->getElementsByTagName("reportRef") as $report){
        $reportpath = $report->getAttribute('path');
        $requestxml_report = obiee11g_interface_get_requestxml($obiee11gClient,$reportpath);
        $reportpaths[] = $reportpath; 
       
        $drill_paths = obiee11g_drill_reports($obiee11gClient,$requestxml_report);
        if(!empty($drill_paths)){
            foreach($drill_paths as $drill_path){
	            $drillPaths = array();
	            if(is_array($drill_path)){
		            $drillPaths += obiee11g_reports_drill_cycle($drill_path);
		        }
		        else{ $drill_reportpaths[] = $drill_path;}     
	        }
	        if(!empty($drillPaths)){
                $drill_reportpaths = array_merge($drillPaths,$drill_reportpaths);
	        }
        }
	    if(!empty($drill_reportpaths)){
	        $reportpaths = array_merge($reportpaths,$drill_reportpaths);
	    }
    }
	if(!empty($reportpaths)){
        $reportpaths = array_unique(array_filter($reportpaths)); 
        foreach($reportpaths as $reportpath){           
	        $requestxml_report = obiee11g_interface_get_requestxml($obiee11gClient,$reportpath);
            $report_cid = db_insert('obiee11g_adaptor_page')
		                    ->fields(array(
				                'fid' => $cid,
					            'obieepath' => $reportpath,
					            'name' => '',
					            'type' => 'report',
					            'requestxml' => $requestxml_report,
					            'status' => 0,
					            'interface_id' => $interface_id, 
					            'unit_id' => $unit_id, 					
					            'timestamp' => time(),
				            ))
		                    ->execute();
		}
    }

}


function obiee11g_drill_reports($obiee11gClient,$requestxml_report){
    $requestxml= new DOMDocument(); 
    if(isset($requestxml_report)){
        $requestxml->loadxml($requestxml_report); }
        foreach ($requestxml->getElementsByTagName("navigation") as $nav){
             $navs[] = $nav;
        }
		$reportpaths = array();
        if(!empty($navs)){
            foreach($navs as $nav){
                foreach($nav->getElementsByTagName("navTarget") as $navT){
                    $reportpath= $navT->getAttribute('path');
	                $report_paths[] =  $reportpath;
                    $requestxml_report = obiee11g_interface_get_requestxml($obiee11gClient,$reportpath);
                    $drill_reportpaths[] = obiee11g_drill_reports($obiee11gClient,$requestxml_report);	 
                }
            }
        
            if(!empty($drill_reportpaths) && !empty($report_paths)){
                $reportpaths = array_merge($report_paths,$drill_reportpaths);
            }else{
                $reportpaths = $report_paths;
            }
		}
    return $reportpaths;
}


function obiee11g_reports_drill_cycle($drill_path){
    $i =0;
	$drill_reportpaths = array();
	$drillReportpaths = array();
    while($i<count($drill_path)){
        $drill_paths = array();
        if(is_array($drill_path[$i])){
	        $drill_paths += obiee11g_reports_drill_cycle($drill_path[$i]);	       
	    }else{
	        $drill_reportpaths[] = $drill_path[$i];
	    } 
	    $i++;
    }
    if(!empty($drill_paths)&&!empty($drill_reportpaths)){
        $drillReportpaths = array_merge($drill_paths,$drill_reportpaths);
    }
    if(empty($drill_paths)){
        $drillReportpaths = $drill_reportpaths;
	}
    return $drillReportpaths;
}



function obiee11g_page_update_status($cid){
	$query = 'SELECT count(o.status) FROM {obiee11g_adaptor_page} o WHERE o.status = 0 AND o.fid = :fid';	
	$fail_count = db_query($query, array(':fid' => $cid))->fetchField();
	
	//...if one of page's prompts or reports is not generated, the page's status will not be generated.
	$status = ($fail_count > 0)? 0: 1;
	
	db_update('obiee11g_adaptor_page')
		->fields(array('status' => $status))
		->condition('cid', $cid)
		->execute();		   
}


function obiee11g_get_simbaxml($cid,$obiee11gClient){
    $subs = array();
	$result = db_query('SELECT o.cid,
	                           o.obieepath,
							   o.type
							   FROM {obiee11g_adaptor_page} o  
							   WHERE cid = :cid OR fid = :fid', array(':cid' => $cid, ':fid' => $cid),array('fetch' => PDO::FETCH_ASSOC));
	foreach ($result as $re) {
	    if($re['type'] != 'page'){
		    $subs[$re['obieepath']]= $re['cid'];
		}
	}
	$result_ = db_query('SELECT o.cid,
	                           o.type,
							   o.requestxml 
							   FROM {obiee11g_adaptor_page} o  
							   WHERE cid = :cid OR fid = :fid', array(':cid' => $cid, ':fid' => $cid),array('fetch' => PDO::FETCH_ASSOC));
	
	foreach($result_ as $re){
	    global $metadata_client; 
	    $gener_simba = new srcMetadataset();
	    
		if($re['type'] == 'page'){
		    $gener_simba->subs = $subs;			
		}
		if($re['type'] == 'prompt'){
		    $gener_simba->subs = array();			
		}
		if($re['type'] == 'report'){
		    $gener_simba->subs = $subs;	
            $gener_simba->savedFilters = obiee11g_getTotal_savedFilter($cid,$obiee11gClient,$re['cid'],$re['requestxml']);			
		}
	    $gener_simba->cid = $re['cid'];
		$gener_simba->style = $re['type'];
	    $gener_simba->appName = 'obiee11g';
		$gener_simba->srcMetadata = $re['requestxml'];
	    $simbaxml = $metadata_client->convert_metadata($gener_simba);
       
	    db_update('obiee11g_adaptor_page')
		    ->fields(array('simbaxml' => $simbaxml,'status' => 1))
		    ->condition('cid', $re['cid'])
		->execute();		
	}
    obiee11g_page_update_status($cid);	
}


function obiee11g_page_list_form($form) {
	$unit_id = $form['unit_id']['#value']; 
	
	$result = db_select('obiee11g_adaptor_page_list_v', 'c')
		->extend('PagerDefault')->limit(11)
		->fields('c')
		->condition('unit_id', $unit_id, '=')
		->execute();
	
	$form['pages'] = array(
		'#tree' => TRUE,
	);
	
	foreach($result as $row) {
		$form['pages'][$row->cid]['#page'] = (object) array(
			'cid' => $row->cid,
			'name' => $row->name,
			'status' => $row->status,
			'interface_name' => $row->interface_name,
			'interface_id' => $row->interface_id,
			'unit_id' => $row->unit_id,
		);
		
	}
	

	$form['interface'] = array(
		'#title' => t('Interface'),
		'#type' => 'select',
		'#prefix' => '<div class="container-inline">',		
		'#options' => get_obiee11g_interfaces_by_unit_id($unit_id),
		//'#title_display' => 'invisible',
	);	
	$form['path'] = array(
		'#type' => 'textfield',
		'#title' => t('Path'),
		//'#title_display' => 'invisible',
		'#size' => 60,
		'#maxlength' => 120,
	);
	$form['add'] = array(
		'#type' => 'submit',
		'#value' => t('Add page'),
		'#suffix' => '</div>',
		'#validate' => array('obiee11g_page_add_validate'),
		'#submit' => array('obiee11g_page_add_submit'),
	);
	
	$form['#theme'] = 'obiee11g_page_list_form';
	
	return $form;
}


function get_obiee11g_interfaces_by_unit_id($unit_id) {
	$interfaces = array();
	
	$result = db_query('SELECT o.id, o.name  
						FROM {obiee11g_adaptor_interface} o
						WHERE o.unit_id = :unit_id', 
						array(':unit_id' => $unit_id));
	
	foreach ($result as $record) {
		$interfaces[$record->id] = $record->name;
	}
	
	return $interfaces;
}


function theme_obiee11g_page_list_form($variables) {
	$form = $variables['form'];
	$header = array(t('Name'), t('Interface'), t('Status'), t('Operations'));
	
	$rows = array();	
	foreach (element_children($form['pages']) as $cid) {
        $name= $form['pages'][$cid]['#page']->name;
				
		$published = is_page_published('obiee11g', $cid);
		$status_ = ($published)? t('published'): t('generated'); 
		
		$status = ($form['pages'][$cid]['#page']->status == 0)? t('Fail'): $status_;
		$interface = $form['pages'][$cid]['#page']->interface_name;
		$interface_id = $form['pages'][$cid]['#page']->interface_id;
		$unit_id = $form['pages'][$cid]['#page']->unit_id;
		
		$path = db_query('SELECT obieepath FROM {obiee11g_adaptor_page}  WHERE cid = :cid',array(':cid'=>$cid))->fetchField();	
		$entry = serialize(
					array(
						'cid' => $cid, 
						'obieepath' => $path, 
						'interface_id' => $interface_id, 
						'unit_id' => $unit_id
					)
				);
		$query = array('query' => array('entry' => $entry));    
		
		$row = array();
		$row[] = array('data' => l(t($name), 'obiee11g_adaptor/page/display', $query), 'width' => '50%');
		$row[] = array('data' => check_plain($interface), 'width' => '30%');
		$row[] = array('data' => check_plain($status), 'width' => '11%');
		$row[] = array('data' => l(t('edit'), 'obiee11g_adaptor/page/edit', $query), 'width' => '11%');
		
		$rows[] = array('data' => $row);
	}
	$rows[] = array(array('data' => drupal_render($form['interface']). drupal_render($form['path']). drupal_render($form['add']), 'colspan' => 4, 'class' => 'edit-name'));
    
	$output = theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'page-list')));
	$output .= theme('pager');

	return $output;
}


function obiee11g_page_add_validate($form, &$form_state) {   
	$path = $form_state['values']['path'];
	$unit_id = $form_state['values']['unit'];
	
	$query = 'SELECT count(o.obieepath) FROM {obiee11g_adaptor_page} o WHERE obieepath = :obieepath AND unit_id = :unit_id;';	
	$existed = db_query($query, array(':obieepath' => $path, ':unit_id' => $unit_id))->fetchField();
	if ($existed != 0) {
		form_set_error('path', t('The page path has been existed already.'));
	}
}


function obiee11g_page_add_submit($form, &$form_state){ 
	$path = $form_state['values']['path'];
	$nameArray = explode('/',$path);
    $name = array_pop($nameArray);
	$unit_id = $form_state['values']['unit'];
	$interface_id = $form_state['values']['interface'];
	
	$obiee11gClient = obiee11g_interface_connect_interface($interface_id);
    $requestxml = obiee11g_interface_get_requestxml($obiee11gClient,$path);
	
	$cid = db_insert('obiee11g_adaptor_page')
		->fields(
				array(
				    'obieepath' => $path,
					'name' => $name,
					'type' => 'page',
					'requestxml' => $requestxml,
					'status' => 0,
					'interface_id' => $interface_id, 
					'unit_id' => $unit_id, 					
					'timestamp' => time(),
				)
			)
		->execute();
	
	//obiee11g_get_prompts_and_reports($cid,$requestxml,$obiee11gClient,$interface_id,$unit_id);
//	obiee11g_get_simbaxml($cid,$obiee11gClient);
   
    obiee11g_interface_disconnect_interface($obiee11gClient);
	back_obiee11g_page($unit_id); 
}


function obiee11g_page_edit($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	
	//If a page is published, it cannot be edited or removed.
	$published = is_page_published('obiee11g', $cid);
	$active = is_page_active('obiee11g', $cid);
	
	$form['path'] = array(
		'#type' => 'item',
		'#description' => $entry['obieepath'],
	);
	$form['cid'] = array(
		'#type' => 'value',
		'#value' => $entry['cid'],
	);
	$form['unit_id'] = array(
		'#type' => 'value',
		'#value' => $entry['unit_id'],
	);
	$form['actions'] = array('#type' => 'actions');
	
    $form['actions']['rebuild'] = array(
		'#type' => 'submit',
		'#value' => t('Rebuild'),
		'#disabled' => $active,  
		'#submit' => array('obiee11g_page_rebuild_submit'),
	);	
	$form['actions']['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
		'#disabled' => $published,  
		'#submit' => array('obiee11g_page_delete_submit'),
	);
	$form['actions']['Cancel'] = array(
		'#type' => 'submit',
		'#value' => t('Cancel'),
		'#submit' => array('obiee11g_page_cancel_submit'),
	);

	return $form; 
}


function obiee11g_page_rebuild_submit($form, &$form_state) {    
    $entry = unserialize($_GET['entry']);
	$cid = $entry['cid'];
	$path = $entry['obieepath'];
	$interface_id = $entry['interface_id'];	
	$unit_id = $entry['unit_id'];;
	
	
	$obiee11gClient = obiee11g_interface_connect_interface($interface_id);
	$requestxml_re = obiee11g_interface_get_requestxml($obiee11gClient,$path);	
	
	db_update('obiee11g_adaptor_page')
	    ->fields(array(
			'requestxml' => $requestxml_re,			
			'timestamp' => time()
		))
        ->condition('cid',$cid)
	->execute();
	
	db_delete('obiee11g_adaptor_page')
        ->condition('fid',$cid)
	->execute();
	
	obiee11g_get_prompts_and_reports($cid,$requestxml_re,$obiee11gClient,$interface_id,$unit_id);
	//obiee11g_get_simbaxml($cid,$obiee11gClient);
   
    obiee11g_interface_disconnect_interface($obiee11gClient);
	
	drupal_set_message(t('The page has been rebuilt successfully.'));

    back_obiee11g_page($unit_id);  
}


function obiee11g_page_cancel_submit($form, &$form_state) {    
	$unit_id = $form_state['values']['unit_id'];

    back_obiee11g_page($unit_id);  
}


function obiee11g_page_delete_submit($form, &$form_state) {
	$entry = serialize(array('cid' => $form_state['values']['cid'],'unit_id' => $form_state['values']['unit_id']));
	$query = array('query' => array('entry' => $entry));

	drupal_goto('obiee11g_adaptor/page/delete', $query);
}


function obiee11g_page_delete_confirm($form, &$form_state){
    $entry = unserialize($_GET['entry']);
    $name = db_query('SELECT o.name FROM {obiee11g_adaptor_page} o WHERE cid = :cid',array(':cid' => $entry['cid']))->fetchField();

	return confirm_form($form, 
						t('Are you sure you want to delete the page %name ?', 
							array('%name' => $name)), 
						'obiee11g_adaptor/page', 
						t('This action cannot be undone.'), 
						t('Delete'));

}


function obiee11g_page_delete_confirm_submit($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$unit_id = $entry['unit_id'];
	$page_cid = $entry['cid'];
	
	$result = db_query("SELECT cid FROM {obiee11g_adaptor_page} WHERE fid = :fid  AND type = 'prompt' ", array(':fid' => $page_cid));
	foreach($result as $re){
	    $result_p = db_query('SELECT id FROM {obiee11g_prompt_filters} WHERE cid = :cid', array( ':cid' => $re->cid));
		foreach($result_p as $row){
			db_delete('obiee11g_prompt_filter_values')          //delete data from table {obiee11g_prompt_filter_values} in the same time......
		            ->condition('filter_id', $row->id)
		        ->execute();
		}
	     
	    db_delete('obiee11g_prompt_filters')         //delete data from table {obiee11g_prompt_filters} in the same time......
		            ->condition('cid', $re->cid)
		        ->execute();
	} 
    db_delete('obiee11g_adaptor_page')
        ->condition('cid',$page_cid)
		->execute();	
				
	db_delete('obiee11g_adaptor_page')
        ->condition('fid',$page_cid)
		->execute();
		
	
	

	back_obiee11g_page($unit_id);       
} 


//obiee11g page's prompts ,reports and saveFilters
/**
 * Get saveFilters by every report's requestxml.
**/
function obiee11g_get_saveFilter($obiee11gClient,$fpath){  
    $requestxml_ = obiee11g_interface_get_requestxml($obiee11gClient,$fpath);
   
    $requestxml= new DOMDocument(); 
    if(isset($requestxml_)){
        $requestxml->loadxml($requestxml_); 
    }
	$filterPaths = array();
	$filter_paths = array();
    foreach ($requestxml->getElementsByTagName("filter") as $filter){
        foreach($filter->getElementsByTagName("expr") as $expr){
            $type= $expr->getAttribute('xsi:type');
	        if($type == 'saw:savedFilter'){
	            $filter_paths[] =  $expr->getAttribute('path');
		        $recursion = obiee11g_get_saveFilter($obiee11gClient,$expr->getAttribute('path'));
            }
	    }
	   
	}
    if(!empty($recursion)){
        $filterPaths = array_merge($filter_paths,$recursion);
    }else{ 
	    $filterPaths = $filter_paths;
	}
    
	return $filterPaths;
}



function obiee11g_getTotal_savedFilter($cid,$obiee11gClient,$report_cid,$requestxml){
    $page = get_obiee11g_page_by_cid($cid);	
	$interface_id = $page['interface_id'];
	$unit_id = $page['unit_id'];
	
    $requestxml_doc= new DOMDocument(); 
    if(isset($requestxml)){
        $requestxml_doc->loadxml($requestxml); 
	}
	$filter_paths = array();
    foreach ($requestxml_doc->getElementsByTagName("filter") as $filter){
        foreach($filter->getElementsByTagName("expr") as $expr){
            $type= $expr->getAttribute('xsi:type');
	        if($type == 'saw:savedFilter'){
	            $filter_paths[] =  $expr->getAttribute('path');
		        $recursion = obiee11g_get_saveFilter($obiee11gClient,$expr->getAttribute('path'));
            }
	    }
	}
    $type = 'savedFilter';	
	$result = db_query('SELECT o.obieepath FROM {obiee11g_adaptor_page} o  WHERE type = :type AND fid = :fid',array('type' => $type,':fid' => $cid));
    $fpaths = array();
    foreach($result as $row){
	   $fpaths[] = $row->obieepath;
    }
	$savedFilter = array();
	$filterPaths = array();
	if(!empty($filter_paths)){
	    if(!empty($recursion)){
		   $filterPaths = array_unique(array_merge($filter_paths,$recursion));
		}
		else{$filterPaths = array_unique($filter_paths);}
		foreach($filterPaths as $fpath){ 
			$fid = $cid;
			if(!in_array($fpath,$fpaths)){
			    $requestxml = obiee11g_interface_get_requestxml($obiee11gClient,$fpath);
				$savedFilter[$fpath]= $requestxml;	
                db_insert('obiee11g_adaptor_page')
		            ->fields(array(
		                'fid' => $cid,
		    	        'obieepath' => $fpath,
						'name' => '',
			            'type' => $type,
		    	        'requestxml' => $requestxml,
		    	        'interface_id' => $interface_id,
		    	        'unit_id' => $unit_id,
						'status' => 1,
		    	        'timestamp' => time(),
			        ))
		        ->execute();				
			}
			else {
				$savedFilter[$fpath] = db_query('SELECT requestxml FROM {obiee11g_adaptor_page} WHERE obieepath = :path', array(':path' => $fpath))->fetchField();				
			}
          }
    }
	return $savedFilter;
 }


function obiee11g_page_display_form($form, &$form_state) {
    $entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page = get_obiee11g_page_by_cid($page_cid);	
	$path= $page['obieepath'];
    $page_name = $page['name'];
   
	
	$entry = serialize(array('unit_id' => $page['unit_id']));
	$query = array('query' => array('entry' => $entry));	
	
	$form['page_name'] = array(
		'#title' => t('Page Name: '). l($page_name, 'obiee11g_adaptor/page', $query),
		'#type' => 'item',
	);
	$form['page_path'] = array(
		'#title' => t('Page Path: '). $path,
		'#type' => 'item',
	);
	
	$form['prompt_name'] = array(
		'#title' => t('Prompts'),
		'#type' => 'item',
	);
    $form['prompt_table'] = obiee11g_page_prompt_form();
	
	$form['report_name'] = array(
		'#title' => t('Reports'),
		'#type' => 'item',
	);
	$form['report_table'] = obiee11g_page_report_form();
	
	$form['savedfilter_name'] = array(
		'#title' => t('Savedfilters'),
		'#type' => 'item',
	);
	$form['savedfilter_table'] = obiee11g_savedfilter_form();
	
	$form['catalog_path'] = array(
		'#title' => t('Catalog Paths'),
		'#type' => 'item',
	);
	$form['catalog_table'] = obiee11g_catalog_form();

	return $form;
}


function obiee11g_page_prompt_form() {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page = get_obiee11g_page_by_cid($page_cid);	
	$path= $page['obieepath'];
    $page_name = $page['name'];
    $interface_id = $page['interface_id'];	
	
	$form['cid'] = array(
		'#type' => 'value',
		'#value' => $page_cid,
	);
	$form['path'] = array(
		'#type' => 'value',
		'#value' => $path,
	);
	$form['interface_id'] = array(
		'#type' => 'value',
		'#value' => $interface_id,
	);
	$form['prompt_refresh'] = array(
		'#value' => t('Refresh'),
		'#type' => 'submit',
		'#submit' => array('obiee11g_page_prompt_form_submit'),
	);
    $header = array(
		'path' => array('field' => 'o.obieepath', 'data' => t('Path')),
		'status' => array('field' => 'o.status', 'data' => t('Status')),
		'refresh' => array( 'data' => t('Refresh Time')),
	);
	
	$select = db_select('obiee11g_adaptor_page', 'o');
    $select = $select->extend('TableSort');
	$select = $select->extend('PagerDefault')->limit(20);
	$select = $select->fields('o');
	$select = $select->condition('type', 'prompt', '=');
	$select = $select->condition('fid', $page_cid, '=');
	$result = $select->execute();
	
	$options = array();
	foreach ($result as $row) {
		
		$published = is_page_published('obiee11g', $page_cid);
		$status_ = ($published)? t('published'): t('generated'); 
		$filter_id = db_query('SELECT id FROM {obiee11g_prompt_filters}  WHERE cid = :cid', array(':cid' => $row->cid))->fetchField();            
        $refresh_time = db_query('SELECT refresh_date FROM {obiee11g_prompt_filter_values}  WHERE filter_id = :filter_id', array(':filter_id' => $filter_id))->fetchField(); 
		if(empty($refresh_time)){
	        $refresh_time = '';
	    }
		else $refresh_time = format_date($refresh_time,'custom', 'Y-m-d H:i');
		$options[$row->cid] = array(
			'path' => array('data' => $row->obieepath, 'width' => '70%'),
			'status' => array('data' => ($row->status)? $status_ : t('Fail'), 'width' => '15%'),
			'refresh' => array('data' => $refresh_time, 'width' => '15%'),			
		);
	}
	
	$form['obiee11g_prompt_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;

}


function obiee11g_page_prompt_form_submit($form, &$form_state) { 
    $entry = unserialize($_GET['entry']);
	$page_cid = $form_state['values']['cid'];
	$path = $form_state['values']['path'];
	$interface_id = $form_state['values']['interface_id'];
	$obiee11gClient = obiee11g_interface_connect_interface($interface_id);
	
	foreach (array_filter($form_state['values']['obiee11g_prompt_table']) as $cid => $value){	
       
		
        $simbaxml = db_query('SELECT simbaxml FROM obiee11g_adaptor_page where cid = :cid',array(':cid' => $cid))->fetchField();
        $simbaObj = new DOMDocument();
        $simbaObj->loadxml($simbaxml);
        $promptFilterObjs = $simbaObj->getElementsByTagName('promptFilter');
        foreach($promptFilterObjs as $promptFilterObj){
            $formula = $promptFilterObj->getAttribute('formula');
            $subjectArea = $promptFilterObj->getAttribute('subjectArea');
            $values = $promptFilterObj->getAttribute('values');
            $valuesResults = current(obiifGetData($obiee11gClient,$values));
	        $filter_id = db_query("SELECT id FROM {obiee11g_prompt_filters} WHERE cid = :cid AND filter_formula = :formula", array(':cid' => $cid,':formula' => $formula))->fetchField();	       
		    if($filter_id == 0){
			    $filter_id = db_insert('obiee11g_prompt_filters')
		                    ->fields(array(
		                        'cid' => $cid,
			                    'filter_formula' => $formula,
			                    'create_date' => time(),			
			                 ))
		                   ->execute();
		        
			}else{
			    db_update('obiee11g_prompt_filters')
				    ->fields(array(
			            'filter_formula' => $formula,		
			            'create_date' => time()
		            ))
		            ->condition('id', $filter_id)
		        ->execute();
				
			    db_delete('obiee11g_prompt_filter_values')
		            ->condition('filter_id', $filter_id)
		        ->execute();
			}
	        foreach($valuesResults as $valuesResult){
			     db_insert('obiee11g_prompt_filter_values')
		                    ->fields(array(
		                        'filter_id' => $filter_id,
			                    'filter_value' => $valuesResult,
			                    'refresh_date' => time(),			
			                 ))
		                   ->execute();
		    }
        }
    }
	
	obiee11g_interface_disconnect_interface($obiee11gClient);
	
	back_obiee11g_page_display($page_cid, $path);
}


function obiee11g_page_report_form() {
	$entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];

    $header = array(
		'name' => array('field' => 'o.obieepath', 'data' => t('Path')),
		'status' => array('field' => 'o.status', 'data' => t('Status')),
	);
	
	$select = db_select('obiee11g_adaptor_page', 'o');
    $select = $select->extend('TableSort');
	$select = $select->extend('PagerDefault')->limit(20);
	$select = $select->fields('o');
	$select = $select->condition('type', 'report', '=');
	$select = $select->condition('fid', $page_cid, '=');
	$result = $select->execute();
	
	$options = array();
	foreach ($result as $row) {
		
		$published = is_page_published('obiee11g', $page_cid);
		$status_ = ($published)? t('published'): t('generated'); 
		
		$options[$row->cid] = array(
			'path' => array('data' => $row->obieepath, 'width' => '80%'),
			'status' => array('data' => ($row->status)? $status_ : t('Fail'), 'width' => '20%'),	
		);
	}
	
	$form['obiee11g_report_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function obiee11g_savedfilter_form(){
    $entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];

    $header = array(
		'name' => array('field' => 'o.obieepath', 'data' => t('Path')),
		'status' => array('field' => 'o.status', 'data' => t('Status')),
	);
	
	$select = db_select('obiee11g_adaptor_page', 'o');
    $select = $select->extend('TableSort');
	$select = $select->extend('PagerDefault')->limit(20);
	$select = $select->fields('o');
	$select = $select->condition('type', 'savedFilter', '=');
	$select = $select->condition('fid', $page_cid, '=');
	$result = $select->execute();
	
	$options = array();
	foreach ($result as $row) {
		
		$published = is_page_published('obiee11g', $page_cid);
		$status_ = ($published)? t('published'): t('generated'); 
		
		$options[$row->cid] = array(
			'path' => array('data' => $row->obieepath, 'width' => '80%'),
			'status' => array('data' => ($row->status)? $status_ : t('Fail'), 'width' => '20%'),	
		);
	}
	
	$form['obiee11g_report_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function obiee11g_catalog_form() {
    $entry = unserialize($_GET['entry']);
	$page_cid = $entry['cid'];
	$page = get_obiee11g_page_by_cid($page_cid);
	$unit_id = $page['unit_id'];	   
	
	$header = array(
		'path' => array('data' => t('Path')),
	);
	
	
	$select = db_select('mobiiapp_catalog', 'm');
	$select = $select->extend('PagerDefault')->limit(20);
	$select = $select->fields('m');
	$select = $select->condition('cid', $page_cid, '=');
	$select = $select->condition('adaptor', 'obiee11g', '=');
	$result = $select->execute();
	
	$options = array();
	foreach ($result as $row) {
	    $path = get_directory_path($row->parent_id, $unit_id);
		
		$options[$row->id] = array(
			'path' => array('data' => $path ,'width' => '111%'),
		);
					
	}
	
	$form['obiee11g_catalog_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;

}





?>