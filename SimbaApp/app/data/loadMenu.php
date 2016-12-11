<?php
$_SERVER['REMOTE_ADDR'] = 'localhost';
$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
chdir($documentRoot);
include_once "./includes/bootstrap.inc";
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

global $user;

function hasChildren($id){
    $sql = "SELECT count(*) FROM mobiiapp_catalog WHERE parent_id = ".$id;
    return db_result(db_query($sql));
}
function hasRole($rids){
	global $user;
	$hasRole = false;
	if($user->uid == 1) return true;
	if($user->uid == 0){
		$hasRole = false;
	} else {
		$userRoles = $user->roles;
		foreach($userRoles as $rid => $rname){
			if(strtolower($rname) == 'mobiiapp admin') return true;
		}
		if($rids == '0' || $rids == '' || empty($rids)){
			$hasRole = true;
		} else {
			foreach($rids as $rid){
				if($userRoles[$rid]) {
					$hasRole = true;
					break;
				}
			}
		}
	}
	return $hasRole;
}


$output = array();
function getChildren($parentId, $level){
    $items = array();
    $result = db_query('SELECT id, name, parent_id, control_id, controller, type FROM mobiiapp_catalog WHERE parent_id='.$parentId);
    $i = 0;
    while ($row = db_fetch_array($result)) {
		$roleResult = db_query('SELECT r.rid FROM mobiiapp_catalog l, mobiiapp_catalog_role r WHERE l.id = r.catalog_id and l.id='.$row['id']);
		$rids = array();
		while ($ridRow = db_fetch_array($roleResult)) {
			$rids[] = $ridRow['rid'];
		}
		$hasRole = hasRole($rids);
		if ($hasRole){
			$items[$i]['rids'] = $rids;
			$items[$i]['label'] = $row['name'];
			$items[$i]['id'] = $row['id'];
			$items[$i]['control_id'] = $row['control_id'];
			$items[$i]['controller'] = $row['controller'];
			$items[$i]['type'] = ($row['type'] == 'OBIEE Dashboard Page') ? 'page' : $row['type'];
			$subitems = getChildren($row['id'], $level+1);
			if(empty($subitems) && $items[$i]['type'] != 'Folder'){
				$items[$i]['leaf'] = true;
			} else {
				$items[$i]['items'] = $subitems;
			} 
			$i ++; 
		}
    }   
    return $items;
}
if($user->uid !=0 ){
	$output = getChildren(0, 0);
} else {
	$output = array();
}
echo '{"items":'.json_encode($output).'}';
// echo '{"items":'.json_encode($output).',"user":'.json_encode($user).'}';
