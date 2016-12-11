<?php
function mobiiapp_client_obiee10g_getPageSimba($control_id,$filtersStr){
	$sql = "SELECT simbaxml, interface_id FROM obiee10g_adaptor_page WHERE type = 'page' AND cid = :cid";
	$record = db_query($sql, array(':cid' => $control_id))->fetchObject();
	$simbaxmlRaw = $record->simbaxml;
	$interface_id = $record->interface_id;
	$obiee10gClient = obiee10g_interface_connect_interface($interface_id);
	if(!$obiee10gClient){
		echo '{"success": false, "pagesimba": '.json_encode($record).',"errorMessage": '.json_encode("Error to connect to OBIEE10g Server_".$interface_id)."}";
	} else {
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$defaultFilters = array();
		$variables = array();
		$pagePrompts = array();
		$pagePrompts = mobiiapp_client_obiee10g_getPromptsInfo($obiee10gClient,$simbaxmlRaw,$filtersStr);
		$defaultFilters = $pagePrompts['defaultFilters'];
		$variables = $pagePrompts['variables'];
		$page['pagePrompts'] = $pagePrompts;
		$savedFilters = mobiiapp_client_obiee10g_getSavedFilters($control_id);
		$page['savedFilters'] = $savedFilters;
		
		foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
			$cid = $pageReport->getAttribute('cid');
			$caption = $pageReport->getAttribute('caption');
			$page['pageReports'][$cid] = array();
			$page['pageReports'][$cid]['caption'] = $caption;
			$sql = "SELECT obieepath, requestxml, simbaxml FROM obiee10g_adaptor_page WHERE type = 'report' and cid = :cid";
			$result = db_query($sql,array(':cid' => $cid));
			foreach($result as $record){
				$simbaxmlRaw = $record->simbaxml;
				$requestxml = $record->requestxml;
				$filterxmls = null;
				$queryResult = mobiiapp_client_obiee10g_queryManager($defaultFilters,$requestxml,$savedFilters);
				$filterxmls = $queryResult['filterxml'];
				$requestxml = $queryResult['requestxml'];
				$baseViewInfo = mobiiapp_client_reportInfoManager('obiee10g',$simbaxmlRaw,$requestxml);
				// $page['pageReports'][$cid]['baseViewInfo'] = $baseViewInfo;
				$page['pageReports'][$cid]['baseViewInfo'] = mobiiapp_client_obiee10g_getReportViewsData($obiee10gClient,$baseViewInfo,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
			}
		}
		obiee10g_interface_disconnect_interface($obiee10gClient);
		if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		else var_dump($page);
	}
}

function mobiiapp_client_obiee10g_getReportSimba($pagecid,$reportid,$promptfilters,$drillthroughfilters){
	$defaultFilters = array();
	$variables = array();
	$sql = "SELECT simbaxml, interface_id FROM obiee10g_adaptor_page WHERE type = 'page' AND cid = :cid";
	$record = db_query($sql, array(':cid' => $pagecid))->fetchObject();
	$simbaxmlRaw = $record->simbaxml;
	$interface_id = $record->interface_id;
	$obiee10gClient = obiee10g_interface_connect_interface($interface_id);
	if(!$obiee10gClient){
		echo '{"success": false, "pagesimba": '.json_encode($record).',"errorMessage": '.json_encode("Error to connect to OBIEE10g Server_".$interface_id)."}";
	} else {
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$pagePrompts = array();
		$pagePrompts = mobiiapp_client_obiee10g_getPromptsInfo($obiee10gClient,$simbaxmlRaw,$promptfilters);
		$defaultFilters = $pagePrompts['defaultFilters'];
		$variables = $pagePrompts['variables'];
		$page['pagePrompts'] = $pagePrompts;
		$savedFilters = mobiiapp_client_obiee10g_getSavedFilters($control_id);
		$page['savedFilters'] = $savedFilters;
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
		$sql = "SELECT obieepath, requestxml, simbaxml FROM obiee10g_adaptor_page WHERE type = 'report' and cid = :reportid";
		$result = db_query($sql,array(':reportid'=>$reportid));
		foreach($result as $record){
			$simbaxmlRaw = $record->simbaxml;
			$requestxml = $record->requestxml;
			$reportsimba['caption'] = array_pop(explode("/",$record->obieepath));
			$filterxmls = null;
			$queryResult = mobiiapp_client_obiee10g_queryManager($defaultFilters,$requestxml,$savedFilters);
			$filterxmls = $queryResult['filterxml'];
			$requestxml = $queryResult['requestxml'];
			$baseViewInfo = mobiiapp_client_reportInfoManager('obiee10g',$simbaxmlRaw,$requestxml);
			$reportsimba['baseViewInfo'] = mobiiapp_client_obiee10g_getReportViewsData($obiee10gClient,$baseViewInfo,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
		}
		if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";
	}
}

function mobiiapp_client_obiee10g_getPromptsInfo($obiee10gClient, $pageSimbaxmlRaw,$filtersStr){
	$pagePrompts = array();
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($pageSimbaxmlRaw);
	foreach($simbaxml -> getElementsByTagName('pagePrompt') as $pagePrompt){
		$cid = $pagePrompt->getAttribute('cid');
		$sql = "SELECT simbaxml FROM obiee10g_adaptor_page WHERE type = 'prompt' and cid = :cid";
		$result = db_query($sql,array(':cid'=>$cid))->fetchObject();
		$promptSimbaxmlRaw = $result->simbaxml;
		$promptSimbaxmlRaw = mobiiapp_client_obiee10g_handleDefaultFiltersValue($obiee10gClient,$promptSimbaxmlRaw);
		$prompts[$cid] = $promptSimbaxmlRaw;
	}
	if(!empty($prompts)){
		$pagePrompts = mobiiapp_client_promptsInfoManager($filtersStr,$prompts);
		$pagePrompts = mobiiapp_client_obiee10g_getPromptFiltersData($pagePrompts);
	} else {
		$pagePrompts['defaultFilters'] = array();
		$pagePrompts['variables'] = array();
	}
	
	return $pagePrompts;
}

function mobiiapp_client_obiee10g_handleDefaultFiltersValue($obiee10gClient,$promptSimbaxmlRaw){
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($promptSimbaxmlRaw);
	foreach($simbaxml -> getElementsByTagName('promptFilter') as $promptFilter){
		$defaultX = $promptFilter->getAttribute('default');
		$defaultValue = $promptFilter->getAttribute('defaultValue');
		if($defaultX === 'sqlExpression'){
			$defaultValue = obiee10g_interface_get_data_by_sql($obiee10gClient,$defaultValue);
			$defaultValue = current($defaultValue);
			$defaultValue = $defaultValue[0];
			$promptFilter->setAttribute('default','specific');
			$promptFilter->setAttribute('defaultValue',$defaultValue);
		}
	}
	return $simbaxml->saveXML();
}

function mobiiapp_client_obiee10g_getPromptFiltersData($pagePrompts){
	foreach($pagePrompts as $pCid => $pagePrompt){
		if($pCid != 'defaultFilters' && $pCid != 'variables'){
			$promptFilters = $pagePrompt['promptFilters'];
			foreach($promptFilters as $i => $promptFilter){
				$promptFilter['data'] = array();
				$formula = $promptFilter['formula'];
				$sql = 'SELECT fv.filter_value FROM obiee10g_prompt_filter_values fv, obiee10g_prompt_filters f WHERE f.id = fv.filter_id AND f.cid = :cid AND f.filter_formula = :formula';
				$result = db_query($sql,array(':cid' => $pCid, ':formula' => $formula));
				$promptFilter['data'][$formula] = $result->fetchCol();
				$promptFilters[$i] = $promptFilter;
			}
			$pagePrompt['promptFilters'] = $promptFilters;
			$pagePrompts[$pCid] = $pagePrompt;
		}
	}
	return $pagePrompts;
}

function mobiiapp_client_obiee10g_getReportViewsData($obiee10gClient, $baseViewInfo,$simbaxmlRaw,$requestxml=null,$filterxmls=null,$variables=null){
	if (!empty($baseViewInfo) && !empty($baseViewInfo['views'])){
		$baseViewInfo['hasData'] = false;
		$baseViewInfo['columnInfo'] = array();
		foreach ($baseViewInfo['views'] as $viewIdx => $view){
			if($view['subViews']){
				foreach ($view['subViews'] as $subViewIdx => $subView){
					if($subView['subViews']){
						foreach($subView['subViews'] as $subSubViewIdx => $subSubView){
							$viewName = $subSubView['viewName'];
							if ($subSubView['viewType'] == 'chart'){
								$requestxml = ($subSubView['viewInfo']['requestxml']) ? $subSubView['viewInfo']['requestxml'] : $requestxml;
							} else if ($subSubView['viewType'] == 'pivotTable'){
								$requestxml = ($subSubView['viewInfo']['requestxml']) ? $subSubView['viewInfo']['requestxml'] : $requestxml;
								if ($subSubView['viewInfo'] && $subSubView['viewInfo']['chart'] && $subSubView['viewInfo']['chart']['position']=='only'){
									$ptChartRequestxml = ($subSubView['viewInfo']['chart']['viewInfo']['requestxml']) ? $subSubView['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
									unset($subSubView['viewInfo']['chart']['viewInfo']['requestxml']);
									$viewType = 'chart';
									$ptChartDataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables);
									$subSubView['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
									$subSubView['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
									$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
									$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
								}
							}
							unset($subSubView['viewInfo']['requestxml']);
							$viewType = strtolower($subSubView['viewType']);
							$dataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
							$subSubView['viewInfo']['data'] = $dataInfo['data'];
							$subSubView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							$subSubView['viewInfo']['sql'] = $dataInfo['sql'];
							if ($subSubView['viewType'] == 'pivotTable' && $subSubView['viewInfo'] && $subSubView['viewInfo']['chart'] && $subSubView['viewInfo']['chart']['position']!='only'){
								$subSubView['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
								$subSubView['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							}
							$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
							$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
							$subView['subViews'][$subSubViewIdx] = $subSubView;
						}
					} else {
						$viewName = $subView['viewName'];
						if ($subView['viewType'] == 'chart'){
							$requestxml = ($subView['viewInfo']['requestxml']) ? $subView['viewInfo']['requestxml'] : $requestxml;
						} else if ($subView['viewType'] == 'pivotTable'){
							$requestxml = ($subView['viewInfo']['requestxml']) ? $subView['viewInfo']['requestxml'] : $requestxml;
							if ($subView['viewInfo'] && $subView['viewInfo']['chart'] && $subView['viewInfo']['chart']['position']=='only'){
								$ptChartRequestxml = ($subView['viewInfo']['chart']['viewInfo']['requestxml']) ? $subView['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
								unset($subView['viewInfo']['chart']['viewInfo']['requestxml']);
								$viewType = 'chart';
								$ptChartDataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables);
								$subView['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
								$subView['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
								$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
								$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
							}
						}
						unset($subView['viewInfo']['requestxml']);
						$viewType = strtolower($subView['viewType']);
						$dataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
						$subView['viewInfo']['data'] = $dataInfo['data'];
						$subView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
						$subView['viewInfo']['sql'] = $dataInfo['sql'];
						if ($subView['viewType'] == 'pivotTable' && $subView['viewInfo'] && $subView['viewInfo']['chart'] && $subView['viewInfo']['chart']['position']!='only'){
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
				if ($view['viewType'] == 'chart'){
					$requestxml = ($view['viewInfo']['requestxml']) ? $view['viewInfo']['requestxml'] : $requestxml;
				} else if ($view['viewType'] == 'pivotTable'){
					$requestxml = ($view['viewInfo']['requestxml']) ? $view['viewInfo']['requestxml'] : $requestxml;
					if ($view['viewInfo'] && $view['viewInfo']['chart'] && $view['viewInfo']['chart']['position']=='only'){
						$ptChartRequestxml = ($view['viewInfo']['chart']['viewInfo']['requestxml']) ? $view['viewInfo']['chart']['viewInfo']['requestxml'] : $requestxml;
						unset($view['viewInfo']['chart']['viewInfo']['requestxml']);
						$viewType = 'chart';
						$ptChartDataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$ptChartRequestxml,$filterxmls,$variables);
						$view['viewInfo']['chart']['viewInfo']['data'] = $ptChartDataInfo['data'];
						$view['viewInfo']['chart']['viewInfo']['columnInfo'] = $ptChartDataInfo['columnInfo'];
						$baseViewInfo['hasData'] = ($ptChartDataInfo['data']) ? true : false;
						$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$ptChartDataInfo['columnInfo']);
					}
				}
				unset($view['viewInfo']['requestxml']);
				$viewType = strtolower($view['viewType']);
				$dataInfo = mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$requestxml,$filterxmls,$variables);
				$view['viewInfo']['data'] = $dataInfo['data'];
				$view['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
				$view['viewInfo']['sql'] = $dataInfo['sql'];
				if ($view['viewType'] == 'pivotTable' && $view['viewInfo'] && $view['viewInfo']['chart'] && $view['viewInfo']['chart']['position']!='only'){
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
}

function mobiiapp_client_obiee10g_getDetailedViewData($obiee10gClient,$simbaxmlRaw,$requestxml=null,$filterxmls=null,$variables=null){
	$output = array();
	$dataxml = obiee10g_interface_get_dataxml_by_requestxml($obiee10gClient, null, $requestxml,null, $filterxmls,$variables);
	if($dataxml != 'SOAP Fault'){
		$dataConvertResult = mobiiapp_client_dataConvertorManager('obiee10g',$requestxml,$simbaxmlRaw,'','',$dataxml);
		$output['data'] = $dataConvertResult['data'];
		$output['columnInfo'] = $dataConvertResult['columnInfo'];
	} else {
		$output['data'] = array();
		$output['columnInfo'] = array();
	}
	return $output;
}

function mobiiapp_client_obiee10g_getSavedFilters($control_id){
	$savedFilters = array();
	$sql = "SELECT obieepath, requestxml FROM obiee10g_adaptor_page WHERE type = 'savedFilter' and fid = :fid";
	$result = db_query($sql,array(':fid' => $control_id));
	foreach($result as $row){
		$savedFilter['path'] = $row->obieepath;
		$savedFilter['requestXml'] = $row->requestxml;
		$savedFilters[] = $savedFilter;
	}
	return $savedFilters;
}

function mobiiapp_client_obiee10g_queryManager($defaultFilters,$requestxml,$savedFilters = array()){
	$srcQueryset = class_exists(dataService_srcQueryset) ? new dataService_srcQueryset() : new srcQueryset();
	$srcQueryset->appName = 'obiee10g';
	$srcQueryset->prompts = $defaultFilters;
	$srcQueryset->srcXml = $requestxml;
	$srcQueryset->savedFilters = $savedFilters;
	global $data_client;
	$filters = $data_client->get_filters($srcQueryset);
	$requestxml = $data_client->get_requestXml($srcQueryset);
	$output['filterxml'] = $filters;
	$output['requestxml'] = $requestxml;
	return $output;
		
	// try {
		// $socket = new TSocket('localhost', 9091);
		// $transport = new TBufferedTransport($socket, 1024, 1024);
		// $protocol = new TBinaryProtocol($transport);
		// $client = new DataServiceClient($protocol);
		// $transport->open();
		// $client->ping();
		// $srcQueryset = class_exists(dataService_srcQueryset) ? new dataService_srcQueryset() : new srcQueryset();
		// $srcQueryset->appName = 'obiee10g';
		// $srcQueryset->prompts = $defaultFilters;
		// $srcQueryset->srcXml = $requestxml;
		// $srcQueryset->savedFilters = $savedFilters;
		// $filters = $client->get_filters($srcQueryset);
		// $requestxml = $client->get_requestXml($srcQueryset);
		// $output['filterxml'] = $filters;
		// $output['requestxml'] = $requestxml;
		// return $output;
	// } catch (dataService_InvalidValueException $e) {
		// return $e->error_msg;
	// }
}