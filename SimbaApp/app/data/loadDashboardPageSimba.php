<?php
$_SERVER['REMOTE_ADDR'] = 'localhost';
$documentRoot = ($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : "/var/www/html";
chdir($documentRoot);
include_once "./includes/bootstrap.inc";

$GLOBALS['THRIFT_ROOT'] = './src';

require_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';
require_once $GLOBALS['THRIFT_ROOT'].'/protocol/TBinaryProtocol.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TSocket.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/THttpClient.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TBufferedTransport.php';

require_once $GLOBALS['THRIFT_ROOT'].'/packages/dataservice/DataService.php';



drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
require_once('simbaapp.php');
global $user;

$controller = $_POST['controller'];
$typename = $_POST['typename'];
$control_id = $_POST['control_id'];
$filters = $_POST['filters'];

// $controller = $controller ? $controller : 'obiee10g';
// $typename = $typename ? $typename : 'page';
// $control_id = $control_id ? $control_id : '502';
// $filters = $filters ? $filters : '{"IkNvcmUgV2Vic2l0ZSIuTmFtZQ--":"Admin","IkNvcmUgU3RvcmUgR3JvdXAiLk5hbWU-":"","IkNvcmUgU3RvcmUiLk5hbWU-":""}';

if($user->uid != 0){
	if($controller === 'obiee10g' && $typename && $control_id ){
		$filters = ($filters) ? json_decode($filters) : null;
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
		$simbaxmlRaw  = db_result(db_query($sql));
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$defaultFilters = array();
		$variables = array();
		foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
			$promptFilters = array();
			$cid = $pagePrompt->getAttribute('cid');
			$result = simbaGetPromptFilters($controller,$cid,$filters);
			$promptFilters = $result['promptFilters'];
			$defaultFilters = array_merge($defaultFilters,$result['defaultFilters']);
			$variables = array_merge($variables,$result['variables']);
			$page['pagePrompts'][$cid]['promptFilters'] = $result['promptFilters'];
			// $page['pagePrompts'][$cid]['defaultFilters'] = $result['defaultFilters'];
			// $page['pagePrompts'][$cid]['variables'] = $result['variables'];
		}
		$savedFilters = simbaGetSavedFilters($controller, $control_id);
		$page['savedFilters'] = $savedFilters;
		foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
			$cid = $pageReport->getAttribute('cid');
			$caption = $pageReport->getAttribute('caption');
			$page['pageReports'][$cid] = array();
			$page['pageReports'][$cid]['caption'] = $caption;
			$sql = "SELECT obieepath, requestxml, simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$cid ;
			$result = db_query($sql);
			while ($record = db_fetch_object($result)) {
				$simbaxmlRaw = $record->simbaxml;
				$requestxml = $record->requestxml;
				// $page['pageReports'][$cid]['obieepath'] = $record->obieepath;
				$filterxml = null;
				$queryResult = simbaFilterQueryManager($controller,$defaultFilters,$requestxml,$savedFilters);
				$filterxml = $queryResult['filterxml'];
				$requestxml = $queryResult['requestxml'];
				// $page['pageReports'][$cid]['defaultFilters'] = $defaultFilters;
				// $page['pageReports'][$cid]['filterxml'] = $filterxml;
				// $page['pageReports'][$cid]['requestxml'] = $requestxml;
				// $columnInfo = array();
				$page['pageReports'][$cid]['baseViewInfo'] = simbaGetBaseViewInfoFromSimbaxml($controller, $simbaxmlRaw,$requestxml,$filterxml,$variables);
				// $page['pageReports'][$cid]['columnInfo'] = $columnInfo;
				// $dataxml = obiifGetDataXML($record->obieepath, $requestxml,null,$filterxml,$variables);
				// $columnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
				// $page['pageReports'][$cid]['data'] = simbaGetDataFromDataxml($dataxml,$columnIds);
				// $page['pageReports'][$cid]['columnInfo'] = simbaGetColumnInfoFromDataxml($dataxml,$columnIds);
			}
			break;
		}
		if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		else var_dump($page);//echo '{"success": true, "pagesimba": '.json_encode($page)."}"; 
		// echo '{"success": true, "pagesimba": '.json_encode($page).',"user":'.json_encode($user).',"session":'.json_encode($_SESSION)."}";
		// else var_dump($page);
	} else if ($controller === 'sql' && $typename && $control_id ){
		$filters = ($filters) ? json_decode($filters) : null;
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
		$simbaxmlRaw  = db_result(db_query($sql));
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$defaultFilters = array();
		$variables = array();
		foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
			$promptFilters = array();
			$cid = $pagePrompt->getAttribute('cid');
			$result = simbaGetPromptFilters($controller,$cid,$filters);
			$promptFilters = $result['promptFilters'];
			$defaultFilters = array_merge($defaultFilters,$result['defaultFilters']);
			$variables = array_merge($variables,$result['variables']);
			$page['pagePrompts'][$cid]['promptFilters'] = $result['promptFilters'];
			$page['pagePrompts'][$cid]['defaultFilters'] = $result['defaultFilters'];
			$page['pagePrompts'][$cid]['variables'] = $result['variables'];
		}
		foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
			$cid = $pageReport->getAttribute('cid');
			$caption = $pageReport->getAttribute('caption');
			$page['pageReports'][$cid] = array();
			$page['pageReports'][$cid]['caption'] = $caption;
			$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$cid ;
			$result = db_query($sql);
			while ($record = db_fetch_object($result)) {
				$simbaxmlRaw = $record->simbaxml;
				$simbaxmlRaw = simbaSqlFilterQueryManager($controller,$defaultFilters,$simbaxmlRaw);
				// $page['pageReports'][$cid]['simbaxmlRaw'] = $simbaxmlRaw;
				$page['pageReports'][$cid]['baseViewInfo'] = simbaGetBaseViewInfoFromSimbaxml($controller, $simbaxmlRaw,null,null,null);
			}
		}
		if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		else var_dump($page);//echo '{"success": true, "pagesimba": '.json_encode($page)."}"; 
		// echo '{"success": true, "pagesimba": '.json_encode($page).',"user":'.json_encode($user).',"session":'.json_encode($_SESSION)."}";
		// else var_dump($page);
	} else if ($controller === 'file' && $typename && $control_id ){
		$sql = "SELECT filepath, simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
		$result = db_query($sql);
		while ($record = db_fetch_object($result)) {
			$simbaxmlRaw = $record->simbaxml;
			$filepath = $record->filepath;
		}
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$page['filepath'] = $filepath;
		$page['simbaxmlRaw'] = $simbaxmlRaw;
		foreach($simbaxml -> getElementsByTagName('img') as $img){
			$imgInfo = array();
			$imgInfo['caption'] = $img->getAttribute('caption');
			$filename = $img->getAttribute('fileName');
			$imgInfo['filepath'] = $filepath."/".$filename;
			$page['imgs'][] = $imgInfo;
		}
		echo '{"success": true, "pagesimba": '.json_encode($page)."}";
	} else if($controller === 'ssrs' && $typename && $control_id ){
		$filters = ($filters) ? json_decode($filters) : null;
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
		$simbaxmlRaw  = db_result(db_query($sql));
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$defaultFilters = array();
		$variables = array();
		foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
			$promptFilters = array();
			$cid = $pagePrompt->getAttribute('cid');
			$result = simbaGetPromptFilters($controller,$cid,$filters);
			$promptFilters = $result['promptFilters'];
			$defaultFilters = array_merge($defaultFilters,$result['defaultFilters']);
			$variables = array_merge($variables,$result['variables']);
			$page['pagePrompts'][$cid]['promptFilters'] = $result['promptFilters'];
		}
		foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
			$cid = $pageReport->getAttribute('cid');
			$caption = $pageReport->getAttribute('caption');
			$page['pageReports'][$cid] = array();
			$page['pageReports'][$cid]['caption'] = $caption;
			$sql = "SELECT ssrspath, requestxml, simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$cid ;
			$result = db_query($sql);
			while ($record = db_fetch_object($result)) {
				$simbaxmlRaw = $record->simbaxml;
				$requestxml = $record->requestxml;
				$ssrspath = $record->ssrspath;
				$page['pageReports'][$cid]['simbaxmlRaw'] = $simbaxmlRaw;
				$page['pageReports'][$cid]['requestxml'] = $requestxml;
				$page['pageReports'][$cid]['ssrspath'] = $ssrspath;
				// $page['pageReports'][$cid]['obieepath'] = $record->obieepath;
				//$filterxml = null;
				//$queryResult = simbaFilterQueryManager($controller,$defaultFilters,$requestxml,$savedFilters);
				//$filterxml = $queryResult['filterxml'];
				//$requestxml = $queryResult['requestxml'];
				// $page['pageReports'][$cid]['defaultFilters'] = $defaultFilters;
				// $page['pageReports'][$cid]['filterxml'] = $filterxml;
				// $page['pageReports'][$cid]['requestxml'] = $requestxml;
				// $columnInfo = array();
				$page['pageReports'][$cid]['baseViewInfo'] = simbaGetBaseViewInfoFromSimbaxml($controller, $simbaxmlRaw,$requestxml,$filterxml,$variables,$ssrspath);
				// $page['pageReports'][$cid]['columnInfo'] = $columnInfo;
				// $dataxml = obiifGetDataXML($record->obieepath, $requestxml,null,$filterxml,$variables);
				// $columnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
				// $page['pageReports'][$cid]['data'] = simbaGetDataFromDataxml($dataxml,$columnIds);
				// $page['pageReports'][$cid]['columnInfo'] = simbaGetColumnInfoFromDataxml($dataxml,$columnIds);
			}
		}
		if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		else var_dump($page);//echo '{"success": true, "pagesimba": '.json_encode($page)."}"; 
		// echo '{"success": true, "pagesimba": '.json_encode($page).',"user":'.json_encode($user).',"session":'.json_encode($_SESSION)."}";
		// else var_dump($page);
	} else {
		echo '{"success": false, "errorMessage": '.json_encode('The controller is not defined.')."}";
	}
} else {
	echo '{"success": false, "errorMessage": '.json_encode('The loged in account was invalid. Please re-login.').',"errorCode":'.json_encode('InvalidAccount')."}";
} 