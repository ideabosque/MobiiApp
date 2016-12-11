<?php
function mobiiapp_bill_form($form, &$form_state) {
	global $user;
	
	$is_super_admin = is_super_admin_mobiiapp($user->roles);
	$unit_id = '';
	if (!$is_super_admin) {
		$unit = get_unit_by_uid($user->uid);
		$unit_id = $unit['unit_id'];
	}

	$header = array(
		'bill_no' => array('field' => 's.bill_no', 'data' => t('Bill No.')),
		'date' => array('field' => 's.date', 'data' => t('Purchased Date')),
		'brought_by' => array('field' => 's.brought_by', 'data' => t('Brought By')),
		'amount' => array('field' => 's.amount', 'data' => t('Amount')),
	);
	if ($is_super_admin) {
		$header['unit_name'] = array('data' => t('Group'));
	}
	
	$select = db_select('mobiiapp_bill', 's')
		->extend('TableSort')
		->extend('PagerDefault')->limit(20)
		->fields('s');
		
	if (!$is_super_admin) {
		$select = $select->condition('unit_id', $unit_id, '=');
	}
	$select = $select->orderByHeader($header);
	$result = $select->execute();
	
	$disableds = array();
	$options = array();
	foreach ($result as $row) {
		$entry = serialize(
				array(					
					'bill_no' => $row->bill_no,
				)
			);
		$query = array('query' => array('entry' => $entry));
		$options[$row->bill_no] = array(
			'bill_no' => array('data' => l($row->bill_no, 'mobiiapp/bill/membership', $query)),
			'date' => array('data' => date('Y-m-d', $row->date)),
			'brought_by' => array('data' => $row->brought_by),
			'amount' => array('data' => '$'.$row->amount),			
		);
		
		$_unit = get_unit($row->unit_id);
		$unit_name = $_unit['unit_name'];
		
		if ($is_super_admin) {			
			$options[$row->bill_no]['bill_no']['width'] = '20%';
			$options[$row->bill_no]['date']['width'] = '20%';
			$options[$row->bill_no]['brought_by']['width'] = '20%';
			$options[$row->bill_no]['amount']['width'] = '20%';
			$options[$row->bill_no]['unit_name'] = array('data' => $unit_name, 'width' => '20%');			
		}
		else {
			$options[$row->bill_no]['bill_no']['width'] = '25%';
			$options[$row->bill_no]['date']['width'] = '25%';
			$options[$row->bill_no]['brought_by']['width'] = '25%';
			$options[$row->bill_no]['amount']['width'] = '25%';
		}
		
		//If the bill with memberships not expired yet, it cannot be deleted.
		$count = db_query(
						"SELECT count(*) 
						FROM {mobiiapp_membership_history} 
						WHERE expired_date > :now
						AND bill_no = :bill_no", 
						array(':now' => time(), ':bill_no' => $row->bill_no)
					)->fetchField();
		if ($count > 0) {
			$disableds[] = $row->bill_no;
		}
	}
	
	$form['delete'] = array(
		'#type' => 'submit',
		'#value' => t('Delete'),
	);
	$form['mobiiapp_bill_table'] = array(
		'#type' => 'tableselect',
		'#header' => $header,
		'#options' => $options,
		'#empty' => t('No Results Available.'),
	);
	foreach ($disableds as $id) {
		$form['mobiiapp_bill_table'][$id]['#disabled'] = true;
	}
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;	
}


function mobiiapp_bill_form_validate($form, &$form_state) {
	$selected_count = count(array_filter($form_state['values']['mobiiapp_bill_table']));
	if ($selected_count == 0) {
		form_set_error('', t('Please select the bills to delete.'));
	}
}


function mobiiapp_bill_form_submit($form, &$form_state){
	$bill_nos = array();
	foreach (array_filter($form_state['values']['mobiiapp_bill_table']) as $bill_no => $value){		       
		$bill_nos[] = $bill_no; 	   
	} 
	drupal_goto('mobiiapp/bill/delete', array('query' => array('bill_nos' => serialize($bill_nos))));     
}


function mobiiapp_bill_delete_confirm($form, &$form_state) {
	$form['#submit'][] = 'mobiiapp_bill_delete_confirm_submit';
	
	$output = confirm_form($form,
		t('Are you sure you want to delete these bills?'),
		'mobiiapp/bill',
		t('This action cannot be undone.'),
		t('Delete'),
		t('Cancel'));
	
	return $output; 
}


function mobiiapp_bill_delete_confirm_submit($form, &$form_state) {
	$bill_nos = unserialize($_GET['bill_nos']);
	
	db_delete('mobiiapp_membership_history')
		->condition('bill_no', $bill_nos, 'IN')
		->execute();
	
	db_delete('mobiiapp_bill')
		->condition('bill_no', $bill_nos, 'IN')
		->execute();
	
	drupal_set_message(t('These bills have been successfully deleted.'));
	
	$form_state['redirect'] = 'mobiiapp/bill';       
}


function mobiiapp_bill_membership($form, &$form_state) {
	$entry = unserialize($_GET['entry']);
	$bill_no = $entry['bill_no'];
	
	$bill = db_query(
					'SELECT * 
					FROM {mobiiapp_bill} 
					WHERE bill_no = :bill_no',
					array(':bill_no' => $bill_no)
				)->fetchAssoc();
	
	$header = array(
		'membership_no' => array('field' => 's.membership_no', 'data' => t('Membership No.')),
		'subscribed_date' => array('field' => 's.subscribed_date', 'data' => t('Subscribed Date')),
		'expired_date' => array('field' => 's.expired_date', 'data' => t('Expired Date')),
	);

	$result = db_select('mobiiapp_membership_history', 's')
				->extend('TableSort')
				->extend('PagerDefault')->limit(20)
				->fields('s')		
				->condition('bill_no', $bill_no, '=')
				->orderByHeader($header)
				->execute();
			
	$options = array();
	foreach ($result as $row) {
		$entry = serialize(
				array(					
					'membership_no' => $row->membership_no,
				)
			);
		$query = array('query' => array('entry' => $entry));
		$options[$row->membership_no.'-'.$row->bill_no] = array(
			'membership_no' => array('data' => l($row->membership_no, 'mobiiapp/membership/history', $query), 'width' => '60%'),
			'subscribed_date' => array('data' => date('Y-m-d', $row->subscribed_date), 'width' => '20%'),	
			'expired_date' => array('data' => date('Y-m-d', $row->expired_date), 'width' => '20%'),			
		);
	}
	
	$form['bill'] = array(
		'#title' => t('Bill No. '). $bill['bill_no'],
		'#type' => 'fieldset',   
	);
	$form['bill']['date'] = array(
		'#type' => 'item',
		'#title' => '<b>Purchased Date: </b>'. date('Y-m-d', $bill['date']),	   
	);
	$form['bill']['brought_by'] = array(
		'#type' => 'item',
		'#title' => '<b>Brought By: </b>'. $bill['brought_by'],	   
	);
	$form['bill']['payment_status'] = array(
		'#type' => 'item',
		'#title' => '<b>Payment Status: </b>'. $bill['payment_status'],	   
	);
	$form['bill']['item_value'] = array(
		'#type' => 'item',
		'#title' => '<b>Item Value: </b>'. '$'. $bill['item_value']. '/month per membership',	   
	);
	$form['bill']['quantity'] = array(
		'#type' => 'item',
		'#title' => '<b>Quantity: </b>'. $bill['quantity'],	   
	);
	$form['bill']['duration'] = array(
		'#type' => 'item',
		'#title' => '<b>Duration: </b>'. $bill['duration']. ' month(s)',	   
	);
	$form['bill']['amount'] = array(
		'#type' => 'item',
		'#title' => '<b>Quantity: </b>'. '$'. $bill['amount'],	   
	);
	
	$form['subscribe_membership'] = array(
		'#title' => t('Subscribe Membership'),
		'#type' => 'fieldset',   
	);	
	$form['subscribe_membership']['mobiiapp_membership_history_table'] = array(
		'#theme' => 'table',
		'#header' => $header,
		'#rows' => $options,
		'#empty' => t('No Results Available.'),
	);
		
	$form['back'] = array(
		'#type' => 'submit',
		'#value' => t('Back'),
	);
	
	$form['pager'] = array('#theme' => 'pager');
	
	return $form;
}


function mobiiapp_bill_membership_submit($form, &$form_state) {
	$form_state['redirect'] = 'mobiiapp/bill';
}
?>