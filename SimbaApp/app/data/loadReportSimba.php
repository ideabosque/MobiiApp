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
$typename = $_POST['typename'] ? $_POST['typename'] : 'report';
$pagecid = $_POST['pagecid'];
$reportid = $_POST['reportid'];
$promptfilters = $_POST['promptfilters'];
$drillthroughfilters = $_POST['drillthroughfilters'];

if($user->uid != 0){
	if($controller === 'obiee10g' && $typename && $reportid){
		$defaultFilters = array();
		$variables = array();
		$promptfilters = ($promptfilters) ? json_decode($promptfilters) : null;
		
		if($pagecid){
			$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'page' and control_id = ".$pagecid;
			$simbaxmlRaw  = db_result(db_query($sql));
			$page = array();
			$simbaxml = new DOMDocument();
			$simbaxml -> loadXML($simbaxmlRaw);
			
			foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
				$promptFilters = array();
				$cid = $pagePrompt->getAttribute('cid');
				$result = simbaGetPromptFilters($controller,$cid,$promptfilters);
				$promptFilters = $result['promptFilters'];
				$defaultFilters = array_merge($defaultFilters,$result['defaultFilters']);
				$variables = array_merge($variables,$result['variables']);
				$page['pagePrompts'][$cid]['promptFilters'] = $result['promptFilters'];
				$page['pagePrompts'][$cid]['defaultFilters'] = $defaultFilters ;
				$page['pagePrompts'][$cid]['variables'] = $variables ;
			}
		}
		$drillThroughFilters = json_decode($drillthroughfilters);
		if(!empty($drillThroughFilters )){
			foreach($drillThroughFilters as $drillThroughFilter){
				$drillFilter['formula'] = base64_decode(str_replace('-','=',$drillThroughFilter->formula));
				$drillFilter['control'] = 'edit';
				$drillFilter['operator'] = 'in';
				$drillFilter['value'] = $drillThroughFilter->value;
				$defaultFilters[] = $drillFilter;
			}
		}
		
		$reportsimba = array();
		$sql = "SELECT obieepath, requestxml, simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$reportid ;
		$result = db_query($sql);
		while ($record = db_fetch_object($result)) {
			$simbaxmlRaw = $record->simbaxml;
			$requestxml = $record->requestxml;
			// $reportsimba['obieepath'] = $record->obieepath;
			$reportsimba['caption'] = array_pop(explode("/",$record->obieepath));
			if(!empty($defaultFilters)) {
				$queryResult = simbaFilterQueryManager($controller,$defaultFilters,$requestxml);
				$filterxml = $queryResult['filterxml'];
				$requestxml = $queryResult['requestxml'];
			} else $filterxml = null;
			// $reportsimba['defaultFilters'] = $defaultFilters;
			// $reportsimba['filterxml'] = $filterxml;
			// $reportsimba['requestxml'] = $requestxml;
			$reportsimba['baseViewInfo'] = simbaGetBaseViewInfoFromSimbaxml($controller,$simbaxmlRaw,$requestxml,$filterxml,$variables);
			// $dataxml = obiifGetDataXML($record->obieepath, $record->requestxml,null,$filterxml,$variables);
			// $columnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
			// $reportsimba['data'] = simbaGetDataFromDataxml($dataxml,$columnIds);
			// $reportsimba['columnInfo'] = simbaGetColumnInfoFromDataxml($dataxml,$columnIds);
		}
		
		if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";
	
	} else if ($controller === 'sql' && $typename && $reportid ){
		$defaultFilters = array();
		$variables = array();
		$promptfilters = ($promptfilters) ? json_decode($promptfilters) : null;
		
		if($pagecid){
			$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'page' and control_id = ".$pagecid;
			$simbaxmlRaw  = db_result(db_query($sql));
			$page = array();
			$simbaxml = new DOMDocument();
			$simbaxml -> loadXML($simbaxmlRaw);
			
			foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
				$promptFilters = array();
				$cid = $pagePrompt->getAttribute('cid');
				$result = simbaGetPromptFilters($controller,$cid,$promptfilters);
				$promptFilters = $result['promptFilters'];
				$defaultFilters = array_merge($defaultFilters,$result['defaultFilters']);
				$variables = array_merge($variables,$result['variables']);
				$page['pagePrompts'][$cid]['promptFilters'] = $result['promptFilters'];
				$page['pagePrompts'][$cid]['defaultFilters'] = $defaultFilters ;
				$page['pagePrompts'][$cid]['variables'] = $variables ;
			}
		}
		$drillThroughFilters = json_decode($drillthroughfilters);
		if(!empty($drillThroughFilters )){
			foreach($drillThroughFilters as $drillThroughFilter){
				$drillFilter['formula'] = base64_decode(str_replace('-','=',$drillThroughFilter->formula));
				$drillFilter['control'] = 'edit';
				$drillFilter['operator'] = 'in';
				$drillFilter['value'] = $drillThroughFilter->value;
				$defaultFilters[] = $drillFilter;
			}
		}
		
		$reportsimba = array();
		$sql = "SELECT name, simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$reportid ;
		$result = db_query($sql);
		while ($record = db_fetch_object($result)) {
			$simbaxmlRaw = $record->simbaxml;
			$reportsimba['caption'] = $record->name;
			$simbaxmlRaw = simbaSqlFilterQueryManager($controller,$defaultFilters,$simbaxmlRaw);
			// $reportsimba['simbaxmlRaw'] = $simbaxmlRaw;
			$reportsimba['baseViewInfo'] = simbaGetBaseViewInfoFromSimbaxml($controller, $simbaxmlRaw,null,null,null);
		}
		
		if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";
	} else {
		echo '{"success": false, "errorMsg": '.json_encode($controller.' is not defined.').',"drillthroughfilters":'.json_encode($drillthroughfilters)."}";
	}
} else {
	echo '{"success": false, "reportsimba": '.json_encode(array()).',"drillthroughfilters":'.json_encode($drillthroughfilters)."}";
}
