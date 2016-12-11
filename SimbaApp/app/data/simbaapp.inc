<?php
$GLOBALS['THRIFT_ROOT'] = './src';

require_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';
require_once $GLOBALS['THRIFT_ROOT'].'/protocol/TBinaryProtocol.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TSocket.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/THttpClient.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TBufferedTransport.php';

require_once $GLOBALS['THRIFT_ROOT'].'/packages/dataservice/DataService.php';
require_once $GLOBALS['THRIFT_ROOT'].'/packages/contentservice/ContentService.php';

function simbaapp_obiee10gPageSimba($controller,$typename,$control_id,$filtersStr){
	$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
	$simbaxmlRaw  = db_result(db_query($sql));
	$page = array();
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($simbaxmlRaw);
	$defaultFilters = array();
	$variables = array();
	$pagePrompts = array();
	$pagePrompts = simbaapp_getPromptsInfo($simbaxmlRaw,$controller,$filtersStr);
	$defaultFilters = $pagePrompts['defaultFilters'];
	$variables = $pagePrompts['variables'];
	$page['pagePrompts'] = $pagePrompts;
	$savedFilters = simbaapp_getSavedFilters($controller, $control_id);
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
			$filterxmls = null;
			$queryResult = simbaapp_obiee10gQueryManager($controller,$defaultFilters,$requestxml,$savedFilters);
			$filterxmls = $queryResult['filterxml'];
			$requestxml = $queryResult['requestxml'];
			// $page['pageReports'][$cid]['filterxml'] = $filterxmls;
			// $page['pageReports'][$cid]['requestxml'] = $requestxml;
			$baseViewInfo = simbaapp_reportInfoManager($controller,$simbaxmlRaw,$requestxml);
			$page['pageReports'][$cid]['baseViewInfo'] = simbaapp_getReportViewsData($baseViewInfo,$controller,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
		}
		// break;
	}
	if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
	else var_dump($page);
}

function simbaapp_obiee10gReportSimba($controller,$typename,$pagecid,$reportid,$promptfilters,$drillthroughfilters){
	$defaultFilters = array();
	$variables = array();
	if($pagecid){
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'page' and control_id = ".$pagecid;
		$simbaxmlRaw  = db_result(db_query($sql));
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$pagePrompts = array();
		$pagePrompts = simbaapp_getPromptsInfo($simbaxmlRaw,$controller,$promptfilters);
		$defaultFilters = $pagePrompts['defaultFilters'];
		$variables = $pagePrompts['variables'];
		$page['pagePrompts'] = $pagePrompts;
		$savedFilters = simbaapp_getSavedFilters($controller, $pagecid);
		$page['savedFilters'] = $savedFilters;
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
		$reportsimba['caption'] = array_pop(explode("/",$record->obieepath));
		$filterxmls = null;
		$queryResult = simbaapp_obiee10gQueryManager($controller,$defaultFilters,$requestxml,$savedFilters);
		$filterxmls = $queryResult['filterxml'];
		$requestxml = $queryResult['requestxml'];
		$baseViewInfo = simbaapp_reportInfoManager($controller,$simbaxmlRaw,$requestxml);
		$reportsimba['baseViewInfo'] = simbaapp_getReportViewsData($baseViewInfo,$controller,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
	}
	
	if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";
}

function simbaapp_sqlPageSimba($controller,$typename,$control_id,$filtersStr){
	$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = '".$typename."' and control_id = ".$control_id ;
	$simbaxmlRaw  = db_result(db_query($sql));
	$page = array();
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($simbaxmlRaw);
	$defaultFilters = array();
	$variables = array();
	$pagePrompts = array();
	$pagePrompts = simbaapp_getPromptsInfo($simbaxmlRaw,$controller,$filtersStr);
	$defaultFilters = $pagePrompts['defaultFilters'];
	$variables = $pagePrompts['variables'];
	$page['pagePrompts'] = $pagePrompts;
	foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
		$cid = $pageReport->getAttribute('cid');
		$caption = $pageReport->getAttribute('caption');
		$page['pageReports'][$cid] = array();
		$page['pageReports'][$cid]['caption'] = $caption;
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'report' and control_id = ".$cid ;
		$result = db_query($sql);
		while ($record = db_fetch_object($result)) {
			$simbaxmlRaw = $record->simbaxml;
			$simbaxmlRaw = simbaapp_sqlQueryManager($controller,$defaultFilters,$simbaxmlRaw);
			$page['pageReports'][$cid]['simbaxmlRaw'] = $simbaxmlRaw;
			$baseViewInfo = simbaapp_reportInfoManager($controller,$simbaxmlRaw,null);
			$page['pageReports'][$cid]['baseViewInfo'] = simbaapp_getReportViewsData($baseViewInfo,$controller,$simbaxmlRaw,null,null,null);
		}
	}
	if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
	else var_dump($page);//echo '{"success": true, "pagesimba": '.json_encode($page)."}"; 
}

function simbaapp_sqlReportSimba($controller,$typename,$pagecid,$reportid,$promptfilters,$drillthroughfilters){
	$defaultFilters = array();
	$variables = array();
	
	if($pagecid){
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'page' and control_id = ".$pagecid;
		$simbaxmlRaw  = db_result(db_query($sql));
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$pagePrompts = array();
		$pagePrompts = simbaapp_getPromptsInfo($simbaxmlRaw,$controller,$promptfilters);
		$defaultFilters = $pagePrompts['defaultFilters'];
		$variables = $pagePrompts['variables'];
		$page['pagePrompts'] = $pagePrompts;
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
		$simbaxmlRaw = simbaapp_sqlQueryManager($controller,$defaultFilters,$simbaxmlRaw);
		$baseViewInfo = simbaapp_reportInfoManager($controller,$simbaxmlRaw,null);
		$reportsimba['baseViewInfo'] = simbaapp_getReportViewsData($baseViewInfo,$controller,$simbaxmlRaw,null,null,null);

	}
	if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";

}

function simbaapp_getPromptsInfo($pageSimbaxmlRaw,$controller,$filtersStr){
	$pagePrompts = array();
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($pageSimbaxmlRaw);
	foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
		$cid = $pagePrompt->getAttribute('cid');
		$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'prompt' and control_id = ".$cid ;
		$promptSimbaxmlRaw = db_result(db_query($sql));
		$promptSimbaxmlRaw = simbaapp_handleDefaultFiltersValue($promptSimbaxmlRaw,$controller);
		$prompts[$cid] = $promptSimbaxmlRaw;
	}
	if(!empty($prompts)){
		$pagePrompts = simbaapp_promptsInfoManager($filtersStr,$prompts);
		$pagePrompts = simbaapp_getPromptFiltersData($pagePrompts,$controller);
	} else {
		$pagePrompts['defaultFilters'] = array();
		$pagePrompts['variables'] = array();
	}
	
	return $pagePrompts;
}

function simbaapp_handleDefaultFiltersValue($promptSimbaxmlRaw,$controller){
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($promptSimbaxmlRaw);
	foreach($simbaxml -> getElementsByTagName('promptFilter') as $promptFilter){
		$defaultX = $promptFilter->getAttribute('default');
		$defaultValue = $promptFilter->getAttribute('defaultValue');
		if($defaultX === 'sqlExpression'){
			if($controller == 'obiee10g'){
				$defaultValue = obiifGetData($defaultValue);
				$defaultValue = current($defaultValue);
				$defaultValue = $defaultValue[0];
				$promptFilter->setAttribute('default','specific');
				$promptFilter->setAttribute('defaultValue',$defaultValue);
			} else if ($controller == 'sql'){
				
			}
		}
	}
	return $simbaxml->saveXML();
}

function simbaapp_getPromptFiltersData($pagePrompts,$controller){
	foreach($pagePrompts as $pCid => $pagePrompt){
		if($pCid != 'defaultFilters' && $pCid != 'variables'){
			$promptFilters = $pagePrompt['promptFilters'];
			foreach($promptFilters as $i => $promptFilter){
				if($controller == 'obiee10g'){
					$promptFilter['data'] = obiifGetData($promptFilter['values']);
				} else if($controller == 'sql'){
					$promptFilter['data'] = sql_interface_mysql_getPromptDataBySql($promptFilter['values']); // MySQL
					// $promptFilter['data'] = ($promptFilter['control'] === 'calendar') ? array() : sql_interface_oracle_getPromptDataBySql($promptFilter['values']); // Oracle
				}
				$promptFilters[$i] = $promptFilter;
			}
			$pagePrompt['promptFilters'] = $promptFilters;
			$pagePrompts[$pCid] = $pagePrompt;
		}
	}
	return $pagePrompts;
}

function simbaapp_promptsInfoManager($filtersStr,$prompts){
	try {
		$socket = new TSocket('localhost', 9092);
		$transport = new TBufferedTransport($socket, 1024, 1024);
		$protocol = new TBinaryProtocol($transport);
		$client = new ContentServiceClient($protocol);
		$transport->open();
		$client->ping();
		$srcPromptsSet = class_exists(contentService_srcPromptsSet) ? new contentService_srcPromptsSet() : new srcPromptsSet();
		$srcPromptsSet->prompts = $prompts;
    	$srcPromptsSet->filters = $filtersStr;
    	$result = $client->get_prompts_info($srcPromptsSet);
    	return json_decode($result,true);
	} catch (contentService_InvalidValueException $e) {
		return $e->error_msg;
	}
}


function simbaapp_reportInfoManager($controller,$simbaxmlRaw,$requestxml=null){
	try {
		$socket = new TSocket('localhost', 9092);
		$transport = new TBufferedTransport($socket, 1024, 1024);
		$protocol = new TBinaryProtocol($transport);
		$client = new ContentServiceClient($protocol);
		$transport->open();
		$client->ping();
		$srcReportSet = class_exists(contentService_srcReportSet) ? new contentService_srcReportSet() : new srcReportSet();
		$srcReportSet->controller = $controller;
    	$srcReportSet->simbaxmlRaw = $simbaxmlRaw;
		$srcReportSet->requestxmlRaw = $requestxml;
		$srcReportSet->filterxmls = null;
		$srcReportSet->variables = null;
    	$result = $client->get_report_info($srcReportSet);
    	return json_decode($result,true);
	} catch (contentService_InvalidValueException $e) {
		return $e->error_msg;
	}
}

function simbaapp_dataConvertorManager($controller,$requestxmlRaw,$simbaxmlRaw,$viewName,$viewType,$dataxmlRaw){
	try {
		$socket = new TSocket('localhost', 9091);
		$transport = new TBufferedTransport($socket, 1024, 1024);
		$protocol = new TBinaryProtocol($transport);
		$client = new DataServiceClient($protocol);
		$transport->open();
		$client->ping();
		$srcDataset = class_exists(dataService_srcDataset) ? new dataService_srcDataset() : new srcDataset();
		$srcDataset->appName = $controller;
		$srcDataset->requestxmlRaw = $requestxmlRaw;
		$srcDataset->simbaxmlRaw = $simbaxmlRaw;
		$srcDataset->viewName = $viewName;
		$srcDataset->viewType = $viewType;
		$srcDataset->dataxmlRaw = $dataxmlRaw;
		$result = $client->convert_data($srcDataset);
		return json_decode($result,true);
	} catch (dataService_InvalidValueException $e) {
		return $e->error_msg;
	}
}

function simbaapp_getReportViewsData($baseViewInfo,$controller,$simbaxmlRaw,$requestxml=null,$filterxmls=null,$variables=null){
	if ($controller == 'obiee10g' || $controller == 'sql'){
		if (!empty($baseViewInfo) && !empty($baseViewInfo['views'])){
			$baseViewInfo['hasData'] = false;
			$baseViewInfo['columnInfo'] = array();
			foreach ($baseViewInfo['views'] as $viewIdx => $view){
				if($view['subViews']){
					foreach ($view['subViews'] as $subViewIdx => $subView){
						if($subView['subViews']){
							foreach($subView['subViews'] as $subSubViewIdx => $subSubView){
								$viewName = $subSubView['viewName'];
								if ($subSubView['viewType'] == 'Chart'){
									$requestxml = ($subSubView['viewInfo']['requestxml']) ? $subSubView['viewInfo']['requestxml'] : $requestxml;
								} else if ($subSubView['viewType'] == 'PivotTable'){
									$requestxml = ($subSubView['viewInfo']['requestxml']) ? $subSubView['viewInfo']['requestxml'] : $requestxml;
									if ($subSubView['viewInfo'] && $subSubView['viewInfo']['chart'] && $subSubView['viewInfo']['chart']['position']=='only'){
										$ptChartRequestxml = ($subSubView['viewInfo']['chart']['viewInfo']['requestxml']) ? $subSubView['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
										unset($subSubView['viewInfo']['chart']['viewInfo']['requestxml']);
										$viewType = 'chart';
										$ptChartDataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables,$viewName,$viewType);
										$subSubView['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
										$subSubView['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
										$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
										$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
									}
								}
								unset($subSubView['viewInfo']['requestxml']);
								$viewType = strtolower($subSubView['viewType']);
								$dataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$requestxml,$filterxmls,$variables,$viewName,$viewType);
								$subSubView['viewInfo']['data'] = $dataInfo['data'];
								$subSubView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
								$subSubView['viewInfo']['sql'] = $dataInfo['sql'];
								if ($subSubView['viewType'] == 'PivotTable' && $subSubView['viewInfo'] && $subSubView['viewInfo']['chart'] && $subSubView['viewInfo']['chart']['position']!='only'){
									$subSubView['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
									$subSubView['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
								}
								$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
								$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
								$subView['subViews'][$subSubViewIdx] = $subSubView;
							}
						} else {
							$viewName = $subView['viewName'];
							if ($subView['viewType'] == 'Chart'){
								$requestxml = ($subView['viewInfo']['requestxml']) ? $subView['viewInfo']['requestxml'] : $requestxml;
							} else if ($subView['viewType'] == 'PivotTable'){
								$requestxml = ($subView['viewInfo']['requestxml']) ? $subView['viewInfo']['requestxml'] : $requestxml;
								if ($subView['viewInfo'] && $subView['viewInfo']['chart'] && $subView['viewInfo']['chart']['position']=='only'){
									$ptChartRequestxml = ($subView['viewInfo']['chart']['viewInfo']['requestxml']) ? $subView['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
									unset($subView['viewInfo']['chart']['viewInfo']['requestxml']);
									$viewType = 'chart';
									$ptChartDataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables,$viewName,$viewType);
									$subView['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
									$subView['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
									$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
									$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
								}
							}
							unset($subView['viewInfo']['requestxml']);
							$viewType = strtolower($subView['viewType']);
							$dataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$requestxml,$filterxmls,$variables,$viewName,$viewType);
							$subView['viewInfo']['data'] = $dataInfo['data'];
							$subView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							$subView['viewInfo']['sql'] = $dataInfo['sql'];
							if ($subView['viewType'] == 'PivotTable' && $subView['viewInfo'] && $subView['viewInfo']['chart'] && $subView['viewInfo']['chart']['position']!='only'){
								$subView['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
								$subView['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							}
							$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
							$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
						}
						$view['subViews'][$subViewIdx] = $subView;
					}
				} else {
					$viewName = $view['viewName'];
					if ($view['viewType'] == 'Chart'){
						$requestxml = ($view['viewInfo']['requestxml']) ? $view['viewInfo']['requestxml'] : $requestxml;
					} else if ($view['viewType'] == 'PivotTable'){
						$requestxml = ($view['viewInfo']['requestxml']) ? $view['viewInfo']['requestxml'] : $requestxml;
						if ($view['viewInfo'] && $view['viewInfo']['chart'] && $view['viewInfo']['chart']['position']=='only'){
							$ptChartRequestxml = ($view['viewInfo']['chart']['viewInfo']['requestxml']) ? $view['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
							unset($view['viewInfo']['chart']['viewInfo']['requestxml']);
							$viewType = 'chart';
							$ptChartDataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables,$viewName,$viewType);
							$view['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
							$view['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
							$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
							$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
						}
					}
					unset($view['viewInfo']['requestxml']);
					$viewType = strtolower($view['viewType']);
					$dataInfo = simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$requestxml,$filterxmls,$variables,$viewName,$viewType);
					$view['viewInfo']['data'] = $dataInfo['data'];
					$view['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
					$view['viewInfo']['sql'] = $dataInfo['sql'];
					if ($view['viewType'] == 'PivotTable' && $view['viewInfo'] && $view['viewInfo']['chart'] && $view['viewInfo']['chart']['position']!='only'){
						$view['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
						$view['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
					}
					$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
					$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
				}
				$baseViewInfo['views'][$viewIdx] = $view;
			}
		}
		return $baseViewInfo;
	} else {
		return $baseViewInfo;
	}
}

function simbaapp_getDetailedViewData($controller,$simbaxmlRaw,$requestxml=null,$filterxmls=null,$variables=null,$viewName=null,$viewType=null){
	$output = array();
	if($controller == 'obiee10g'){
		$dataxml = obiifGetDataXML(null, $requestxml,null, $filterxmls,$variables);
		$dataConvertResult = simbaapp_dataConvertorManager($controller,$requestxml,$simbaxmlRaw,'','',$dataxml);
		$output['data'] = $dataConvertResult['data'];
		$output['columnInfo'] = $dataConvertResult['columnInfo'];
	} else if ($controller == 'sql'){
		$simbaxmlRaw = simbaapp_sqlQueryManager($controller,null,$simbaxmlRaw,$viewName,$viewType);
		$simbaxmlDom = new DOMDocument();
		$simbaxmlDom->loadxml($simbaxmlRaw);
		$criteriaElement = $simbaxmlDom->getElementsByTagName("criteria")->item(0);
		foreach($criteriaElement->childNodes as $child){
			if($child->nodeName === 'sql') {
				$sql = $child->nodeValue;
				break;
			}
		}
		if($sql){
			$data = sql_interface_mysql_getReportDataBySql($sql); // MySQL
			if(is_array($data)){
				$output['data'] = $data;
			} else {
				$output['data'] = array();
			}
			$output['sql'] = $sql;
			// $output['data'] = sql_interface_oracle_getReportDataBySql($sql); // Oracle
			$output['columnInfo'] = simbaapp_getColumnInfoFromSimbaxml($simbaxmlRaw);
		}
	}
	return $output;
}

function simbaapp_getSavedFilters($controller, $control_id){
	$savedFilters = array();
	$sql = "SELECT obieepath, requestxml FROM ".$controller."_control_list WHERE typename = 'savedFilter' and fid = ".$control_id ;
	$result = db_query($sql);
	while ($row = db_fetch_object($result)) {
		$savedFilter['path'] = $row->obieepath;
		$savedFilter['requestXml'] = $row->requestxml;
		$savedFilters[] = $savedFilter;
	}
	return $savedFilters;
}

function simbaapp_obiee10gQueryManager($controller,$defaultFilters,$requestxml,$savedFilters = array()){
	try {
		$socket = new TSocket('localhost', 9091);
		$transport = new TBufferedTransport($socket, 1024, 1024);
		$protocol = new TBinaryProtocol($transport);
		$client = new DataServiceClient($protocol);
		$transport->open();
		$client->ping();
		$srcQueryset = class_exists(dataService_srcQueryset) ? new dataService_srcQueryset() : new srcQueryset();
		$srcQueryset->appName = $controller;
		$srcQueryset->prompts = $defaultFilters;
		$srcQueryset->srcXml = $requestxml;
		$srcQueryset->savedFilters = $savedFilters;
		$filters = $client->get_filters($srcQueryset);
		$requestxml = $client->get_requestXml($srcQueryset);
		$output['filterxml'] = $filters;
		$output['requestxml'] = $requestxml;
		return $output;
	} catch (dataService_InvalidValueException $e) {
		return $e->error_msg;
	}
}

function simbaapp_sqlQueryManager($controller,$defaultFilters,$simbaxmlRaw,$viewName=null,$viewType=null){
	try {
		$socket = new TSocket('localhost', 9091);
		$transport = new TBufferedTransport($socket, 1024, 1024);
		$protocol = new TBinaryProtocol($transport);
		$client = new DataServiceClient($protocol);
		$transport->open();
		$client->ping();
		$srcQueryset = class_exists(dataService_srcQueryset) ? new dataService_srcQueryset() : new srcQueryset();
		$srcQueryset->appName = $controller;
		$srcQueryset->prompts = $defaultFilters;
		$srcQueryset->srcXml = $simbaxmlRaw;
		$srcQueryset->viewName = $viewName;
		$srcQueryset->viewType = $viewType;
		$simbaxmlRaw = $client->get_requestXml($srcQueryset);
		return $simbaxmlRaw;
	} catch (dataService_InvalidValueException $e) {
		return $e->error_msg;
	}
}

function simbaapp_getColumnInfoFromSimbaxml($simbaxmlRaw){
	$columnInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		$name = $column->getAttribute('columnId');
		$formula = $column->getAttribute('formula');
		$aggrRule = $column->hasAttribute('aggRule') ? $column->getAttribute('aggRule') : 'none';
		if($column->hasAttribute('interaction')){
			if($column->getAttribute('interaction') === 'navigate'){
				$navigate = $column->getElementsByTagName('navigation')->item(0);
				$columnInfo[$name]['drillthrough_cid'] = $navigate->getAttribute('cid');
			}
		}
		$dataFormatElement = $column->getElementsByTagName('dataFormat')->item(0);
		if($dataFormatElement){
			if($dataFormatElement->hasAttribute('type')) $dataFormat['type'] = $dataFormatElement->getAttribute('type');
			if($dataFormatElement->hasAttribute('commas')) $dataFormat['commas'] = $dataFormatElement->getAttribute('commas');
			if($dataFormatElement->hasAttribute('negativeType')) $dataFormat['negativeType'] = $dataFormatElement->getAttribute('negativeType');
			if($dataFormatElement->hasAttribute('minDigits')) $dataFormat['minDigits'] = $dataFormatElement->getAttribute('minDigits');
			if($dataFormatElement->hasAttribute('maxDigits')) $dataFormat['maxDigits'] = $dataFormatElement->getAttribute('maxDigits');
			$columnInfo[$name]['dataFormat'] = $dataFormat;
		}
		
		$columnHeadingElement = $column->getElementsByTagName('columnHeading')->item(0);
		if($columnHeadingElement){
			if($columnHeadingElement->hasAttribute('captionText')) $columnInfo[$name]['columnHeading'] = str_replace('_',' ', $columnHeadingElement->getAttribute('captionText'));
		}
		
		$columnInfo[$name]['dformula'] = $formula;
		$columnInfo[$name]['encodedformula'] = str_replace('=','-',base64_encode($formula));
		$columnInfo[$name]['sformula'] = $formula;
		$columnInfo[$name]['dataType'] = 'string';
		$columnInfo[$name]['aggrRule'] = $aggrRule;
		$columnInfo[$name]['tableHeading'] = '';
	}
	return $columnInfo;

}