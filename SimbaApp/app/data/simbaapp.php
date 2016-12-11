<?php
function simbaGetCaptionFromFormula($formula){
	$reg = '/"(.+?)"/'; 
    preg_match_all ($reg,$formula,$arr, PREG_SET_ORDER);
    $caption = (!empty($arr)) ? $arr[count($arr)-1][1] : $formula;
    return $caption;
}

function formatBaseColumnName($columnName){
	$columnName = str_replace('&gt;',">",str_replace('&lt;','<',$columnName));
	$columnName = str_replace('&apos;',"'",str_replace('&quot;','"',$columnName));
	if (strtoupper(substr($columnName,0,10))=="CASE WHEN " || 
		strpos($columnName,"||")!==false || 
		(strpos($columnName,"(")!==false && strpos($columnName,")")!==false) ||
		substr($columnName,0,1) === "'" ||
		strpos($columnName,".") === false ||
		count(explode('.',$columnName)) > 2
	) return $columnName;
	$tableColumn = explode(".",$columnName);
	$tbName = $tableColumn[0]; 
	$colName = $tableColumn[1];
	if(substr($colName,-1) != '"' && str_word_count(str_replace("_","",$colName))==1){
		$colName = '"'.$colName.'"';
	}
	if(substr($tbName,-1) === '"' && str_word_count(str_replace('"',"",str_replace("_","",$tbName)))==1 && strpos($tbName,"-")===false){
		$tbName = str_replace('"',"",$tbName);
	}
	return $tbName.".".$colName;
}

function simbaGenFilterLabel($caption, $formula,$op){
	$caption = $caption ? $caption : simbaGetCaptionFromFormula($formula);
	if($op == 'between'){
		return $caption;
	} else if($op == 'in'){
		return $caption.' (IN) ';
	} else if ($op == 'notIn'){
		return $caption.' (NOT IN) ';
	} else if ($op == 'less'){
		return $caption.' (<) ';
	} else if ($op == 'greater'){
		return $caption.' (>) ';
	} else if ($op == 'lessOrEqual'){
		return $caption.' (<=) ';
	} else if ($op == 'greaterOrEqual'){
		return $caption.' (>=) ';
	} else if ($op == 'equal'){
		return $caption.' (=) ';
	} else {
		return $caption.' (=) ';
	}
}

function simbaGetPromptFilters($controller,$promptCid,$filters = null){
	$output = array();
	$defaultFilters = array();
	$promptFilters = array();
	$variables = array();
	$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'prompt' and control_id = ".$promptCid ;
	$promptSimbaRaw = db_result(db_query($sql));
	$promptSimbaDom = new DOMDocument();
	$promptSimbaDom -> loadXML($promptSimbaRaw);
	foreach($promptSimbaDom -> getElementsByTagName('promptFilter') as $promptFilter){
		$prompt = array();
		$prompt['control'] = $promptFilter->getAttribute('control');
		$prompt['defaultX'] = $promptFilter->getAttribute('default');
		$prompt['constrainChoices'] = $promptFilter->getAttribute('constrainChoices');
		$prompt['includeAllChoices'] = $promptFilter->getAttribute('includeAllChoices');
		$prompt['values'] = $promptFilter->getAttribute('values');
		$prompt['sql'] = $promptFilter->getAttribute('sql');
		$prompt['formula'] = $promptFilter->getAttribute('formula');
		$prompt['op'] = $promptFilter->getAttribute('op');
		$prompt['setVariableValue'] = $promptFilter->getAttribute('setVariableValue');
		$prompt['setVariable'] = $promptFilter->getAttribute('setVariable');
		$caption = $promptFilter->getAttribute('caption');
		$prompt['caption'] = simbaGenFilterLabel($caption, $prompt['formula'],$prompt['op']);
		$prompt['name'] = str_replace('=','-',base64_encode($prompt['formula']));
		$name1 = $prompt['name'].'_1';
		$name2 = $prompt['name'].'_2';
		if($filters->$name1) {
			$prompt['defaultValue'] = $filters->$name1;
		} else if ($filters->$prompt['name']) {
			$prompt['defaultValue'] = $filters->$prompt['name'];
		} else {
			if($prompt['defaultX'] === 'sqlExpression'){
				$prompt['defaultValue'] = obiifGetData($promptFilter->getAttribute('defaultValue'));
				$prompt['defaultValue'] = current($prompt['defaultValue']);
				$prompt['defaultValue'] = $prompt['defaultValue'][0];
			} else {
				$prompt['defaultValue'] = $promptFilter->getAttribute('defaultValue');
				if($prompt['control'] === "multi"){
					$prompt['defaultValue'] = str_replace("'","",$prompt['defaultValue']);
				}
			}
		}
		if($prompt['control']==='calendar') { //$prompt['defaultValue'] = ($controller === 'obiee10g') ? str_replace(' ',"T",$prompt['defaultValue']) : $prompt['defaultValue'];
			if($controller === 'obiee10g'){
				$prompt['defaultValue'] = str_replace(' ',"T",$prompt['defaultValue']) ;
			} else if($controller === 'sql') {
				$prompt['defaultValue'] = str_replace('Z',"",$prompt['defaultValue']) ;
				$prompt['defaultValue'] = str_replace('T'," ",$prompt['defaultValue']) ;
			}
		}
		if($filters->$name2){
			$prompt['defaultValue2'] = $filters->$name2;
			if($prompt['control']==='calendar'){ //$prompt['defaultValue2'] = ($controller === 'obiee10g') ? str_replace(' ',"T",$prompt['defaultValue2']);
				if($controller === 'obiee10g'){
					$prompt['defaultValue2'] = str_replace(' ',"T",$prompt['defaultValue2']) ;
				} else if($controller === 'sql') {
					$prompt['defaultValue2'] = str_replace('Z',"",$prompt['defaultValue2']) ;
					$prompt['defaultValue2'] = str_replace('T'," ",$prompt['defaultValue2']) ;
				}
			}
		} else if ($promptFilter->hasAttribute('defaultValue2')){
			$prompt['defaultValue2'] = $promptFilter->getAttribute('defaultValue2');
			if($prompt['control']==='calendar'){ //$prompt['defaultValue2'] = ($prompt['defaultValue2'] && $controller === 'obiee10g') ? str_replace(' ',"T",$prompt['defaultValue2']) : date("Y-m-d G:i:s");
				if($prompt['defaultValue2'] == '') $prompt['defaultValue2'] = date("Y-m-d G:i:s");
				if($controller === 'obiee10g'){
					$prompt['defaultValue2'] = str_replace(' ',"T",$prompt['defaultValue2']) ;
				} else if($controller === 'sql') {
					$prompt['defaultValue2'] = str_replace('Z',"",$prompt['defaultValue2']) ;
					$prompt['defaultValue2'] = str_replace('T'," ",$prompt['defaultValue2']) ;
				}
			}
		}
		// $prompt['data'] = obiifGetData($prompt['values']);
		if($controller == 'obiee10g'){
			$prompt['data'] = obiifGetData($prompt['values']);
		} else if($controller == 'sql'){
			// $prompt['data'] = sql_interface_mysql_getPromptDataBySql($prompt['values']); // MySQL
			$prompt['data'] = ($prompt['control'] === 'calendar') ? array() : sql_interface_oracle_getPromptDataBySql($prompt['values']); // Oracle
		}
		$promptFilters[] = $prompt;
		if($prompt['defaultValue']){
			$defaultFilter['formula'] = $prompt['formula'];
			// $defaultFilter['control'] = ($prompt['control'] ==='calendar') ? 'edit' : $prompt['control'];
			$defaultFilter['control'] = $prompt['control'];
			$defaultFilter['operator'] = $prompt['op'];
			$defaultFilter['value'] = $prompt['defaultValue2'] ? $prompt['defaultValue'].'---to---'.$prompt['defaultValue2'] : $prompt['defaultValue'];
			if($prompt['setVariableValue'] && $prompt['setVariable']) {
				$defaultFilter['setVariableValue'] = $prompt['setVariableValue'];
				$defaultFilter['setVariable'] = $prompt['setVariable'];
			}
			$defaultFilters[] = $defaultFilter;
		} else if($prompt['defaultX'] === 'allChoices' && $prompt['includeAllChoices'] === "true"){
			$defaultFilter['formula'] = $prompt['formula'];
			$defaultFilter['control'] = $prompt['control'];
			$defaultFilter['operator'] = $prompt['op'];
			$defaultFilter['value'] = 'allChoices';
			if($prompt['setVariableValue'] && $prompt['setVariable']) {
				$defaultFilter['setVariableValue'] = $prompt['setVariableValue'];
				$defaultFilter['setVariable'] = $prompt['setVariable'];
			}
			$defaultFilters[] = $defaultFilter;
		}
		if($prompt['setVariableValue'] && $prompt['setVariable']) {
			$variable["name"] = $prompt["setVariableValue"];
			$variable["value"] = $prompt['defaultValue'];
			$variables[] = $variable;
		}
	}
	$output['promptFilters'] = $promptFilters;
	$output['defaultFilters'] = $defaultFilters;
	$output['variables'] = $variables;
	return $output;
}


function simbaGetPromptFiltersSubmitInfo($controller,$promptCid){
	$promptFilters = array();
	$sql = "SELECT simbaxml FROM ".$controller."_control_list WHERE typename = 'prompt' and control_id = ".$promptCid ;
	$promptSimbaRaw = db_result(db_query($sql));
	$promptSimbaDom = new DOMDocument();
	$promptSimbaDom -> loadXML($promptSimbaRaw);
	foreach($promptSimbaDom -> getElementsByTagName('promptFilter') as $promptFilter){
		$prompt = array();
		$prompt['control'] = $promptFilter->getAttribute('control');
		$prompt['formula'] = $promptFilter->getAttribute('formula');
		$prompt['operator'] = $promptFilter->getAttribute('op');
		$prompt['name'] = str_replace('=','-',base64_encode($prompt['formula']));
		$promptFilters[$prompt['name']] = $prompt;
	}
	return $promptFilters;
}

function simbaGetSavedFilters($controller, $control_id){
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


function simbaFilterQueryManager($controller,$defaultFilters,$requestxml,$savedFilters = array()){
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

function simbaSqlFilterQueryManager($controller,$defaultFilters,$simbaxmlRaw){
	// return $simbaxmlRaw;
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
		// $simbaxmlDom = new DOMDocument();
		// $simbaxmlDom->loadxml($simbaxmlRaw);
		// $criteriaElement = $simbaxmlDom->getElementsByTagName("criteria")->item(0);
		// foreach($criteriaElement->childNodes as $child){
			// if($child->nodeName === 'sql') {
				// $sql = $child->nodeValue;
				// break;
			// }
		// }
		$srcQueryset->srcXml = $simbaxmlRaw;
		$simbaxmlRaw = $client->get_sqlResultSimba($srcQueryset);
		// $sql = 'select
// "T0"."C0" "Opp_Modality",
// "T0"."C1" "Account_Name"
// from
// (
// select
// "D_PRODUCT_OPP"."MODALITY" "C0",
// "D_BUSINESS_ACCOUNT"."ACCOUNT_NAME" "C1"
// from
// "DATABOOK"."D_PRODUCT" "D_PRODUCT_OPP",
// "DATABOOK"."D_BUSINESS_ACCOUNT" "D_BUSINESS_ACCOUNT"
// where
// "D_OPPORTUNITY_DETAIL_OPP"."OPP_STATUS" in (\'Open\') AND
// "D_PRODUCT_OPP"."MODALITY" LIKE :PQ AND
// "D_OPPORTUNITY_DETAIL_OPP"."EXP_BK_DT" LIKE :PQ
// )';
		// $srcQueryset->srcXml = $sql;
		// $newsql = $client->get_sqlResultSimba($srcQueryset);
		// $child->nodeValue = $newSql;
		return $simbaxmlRaw;
	} catch (dataService_InvalidValueException $e) {
		return $e->error_msg;
	}
}

function simbaDataConvertorManager($controller,$requestxmlRaw,$simbaxmlRaw,$viewName,$viewType,$dataxmlRaw){
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


function simbaGetBaseViewInfoFromSimbaxml($controller, $simbaxmlRaw,$requestxml,$filterxml,$variables,$path=null){
	$baseViewInfo = array();
	$baseViewName = "";
	$compoundViews = array();
	$compoundViewNames = array();
	$compoundViewNames_ = array();
	$baseViewInfo['hasData'] = false;
	$baseViewInfo['hasColumnSelector'] = false;
	$baseViewInfo['isViewSelector'] = false;
	$baseViewInfo['columnInfo'] = array();
	$simbaxml = new DOMDocument();
	$simbaxml->loadxml($simbaxmlRaw);
	foreach ($simbaxml->getElementsByTagName("compoundView") as $compoundView){
		if($compoundView->hasAttribute("name")) $viewName = $compoundView->getAttribute("name");
		$compoundViews[$viewName] = $compoundView;
	}
	if(!empty($compoundViews)){
		foreach($compoundViews as $compoundView){
			$compoundViewNames[] = $compoundView->getAttribute("name");
		}
		foreach($compoundViewNames as $name){
			$key = substr($name,strpos($name,"compoundView!"));
			$compoundViewNames_[$key] = $name;
		}
	}
	ksort($compoundViewNames_);
	$baseViewName = $compoundViewNames_[key($compoundViewNames_)];
	$baseView = $compoundViews[$baseViewName];
	if($baseView){
		$i = 0;
		foreach($baseView->getElementsByTagName("cell") as $cell){
			if($cell->hasAttribute("viewName")) $viewName = $cell->getAttribute("viewName");
			if($viewName ==='Title') continue;
			$viewType =  simbaGetViewType($viewName);
			$cells[$i]['viewName'] = $viewName;
			$cells[$i]['viewType'] = $viewType;
			if($viewType == "columnSelector"){
				$baseViewInfo['hasColumnSelector'] = true;
				$cells[$i]['viewInfo'] = simbaGetColumnSelectorInfo($viewName,$simbaxmlRaw);
			}
			if($viewType == "viewSelector") {
				$baseViewInfo['isViewSelector'] = true;
				$viewSelectorInfo = simbaGetViewSelectorViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
				$cells[$i]['subViews'] = $viewSelectorInfo['subViews'];
				$cells[$i]['caption'] = $viewSelectorInfo['caption'];
				if($viewSelectorInfo['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$viewSelectorInfo['columnInfo']);
			}
			if($viewType == 'PivotTable'){
				$cells[$i]['viewInfo'] = simbaGetPivotTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
				if($cells[$i]['viewInfo']['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$cells[$i]['viewInfo']['columnInfo']);
			}
			if($viewType == 'Chart'){
				if($controller == 'ssrs'){
					$cells[$i]['viewInfo'] = simbaGetSSRSChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$path);
				} else {
					$cells[$i]['viewInfo'] = simbaGetChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
				}
				if($cells[$i]['viewInfo']['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$cells[$i]['viewInfo']['columnInfo']);
			}
			if($viewType == 'Table'){
				$cells[$i]['viewInfo'] = simbaGetTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
				if($cells[$i]['viewInfo']['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$cells[$i]['viewInfo']['columnInfo']);
			}
			if($viewType == 'Tablix'){
				$cells[$i]['viewType'] = 'Table';
				$cells[$i]['viewInfo'] = simbaGetTablixViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables,$path);
				if($cells[$i]['viewInfo']['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$cells[$i]['viewInfo']['columnInfo']);
			}
			if($viewType == "compoundView") {
				$compoundViewInfo = simbaGetCompoundViewSubViews($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
				$cells[$i]['subViews'] = $compoundViewInfo;
				if($compoundViewInfo['hasData']) $baseViewInfo['hasData'] = true;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$compoundViewInfo['columnInfo']);
			}
			$cells[$i]['viewName'] = $viewName;
			$i ++;
	  }
	}
	if(empty($cells)) $cells[] = "tableView!1";
	$baseViewInfo['views'] = $cells;
	return $baseViewInfo;
}

function simbaGetViewType($viewName){
	if(strpos($viewName,"staticchart")!==false || strpos($viewName,"gaugechart")!==false || strpos($viewName,"Chart")!==false) return "Chart";
	if(strpos($viewName,"pivotTableView")!==false || strpos($viewName,"Pivot Table")!==false) return "PivotTable";
	if(strpos($viewName,"viewSelector")!==false) return "viewSelector";
	if(strpos($viewName,"narrativeView")!==false) return "Narrative";
	if(strpos($viewName,"compoundView")!==false) return "compoundView";
	if(strpos($viewName,"columnSelectorView")!==false) return "columnSelector";
	if(strpos($viewName,"tableView")!==false || strpos($viewName,"Table")!==false) return "Table";
	if(strpos($viewName,"Tablix")!==false) return "Tablix";
}

function simbaGetChartSelectionColumns($chartElement,$selection,$criteriaCols){ //Get columns under category, serieGenerator and measure.
	$selectionColumns = array();
	foreach ($chartElement->getElementsByTagName($selection) as $selection){$selections[] = $selection;}
	if (!empty($selections)){
		foreach ($selections as $selection){
			foreach ($selection->getElementsByTagName('column') as $column){
				if($criteriaCols[$column->getAttribute("columnId")]){
					$formula = $column->getAttribute("formula");
					$selectionColumns[$column->getAttribute("columnId")] = $formula;
				}
			}
		}
	}
	return $selectionColumns;
}

function simbaGetSSRSChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$path){
	$viewInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$viewInfo['hasData'] = false;
	$criteriaCols = array();
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		$criteriaCols[$column->getAttribute('columnId')] = $column->getAttribute('formula');
	}
	foreach($simbaxmlDom -> getElementsByTagName('chart') as $chart){
		if($chart->getAttribute('name') === $viewName){
			$viewInfo['type'] = $chart->getAttribute('chartType');
			$viewInfo['subType'] = $chart->getAttribute('subType');
			$viewInfo['categories'] = simbaGetChartSelectionColumns($chart,"category",$criteriaCols);
			$viewInfo['series'] = simbaGetChartSelectionColumns($chart,"seriesGenerators",$criteriaCols);
			$viewInfo['measures'] = simbaGetChartSelectionColumns($chart,"measures",$criteriaCols);
			$viewInfo['pointers'] = simbaGetChartSelectionColumns($chart,"pointer",$criteriaCols);
		}
	}
	$dataxmlRaw = ssrs_interface_getDataxmlByPath($path);
	$dataConvertResult = simbaDataConvertorManager($controller,$requestxml,$simbaxmlRaw,$viewName,'Chart',$dataxmlRaw);
	$viewInfo['data'] = $dataConvertResult['data'];
	$viewInfo['columnInfo'] = simbaGetColumnInfoFromSimbaxml($simbaxmlRaw);
	$viewInfo['hasData'] = ($viewInfo['data']) ? true : false;
	return $viewInfo;
}

function simbaGetChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables,$chartData=null,$chartColumnInfo=null){
	$viewInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$viewInfo['hasData'] = false;
	$criteriaCols = array();
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		$criteriaCols[$column->getAttribute('columnId')] = $column->getAttribute('formula');
	}
	foreach($simbaxmlDom -> getElementsByTagName('chart') as $chart){
		if($chart->getAttribute('name') === $viewName){
			$viewInfo['type'] = $chart->getAttribute('chartType');
			$viewInfo['subType'] = $chart->getAttribute('subType');
			$viewInfo['categories'] = simbaGetChartSelectionColumns($chart,"category",$criteriaCols);
			$viewInfo['series'] = simbaGetChartSelectionColumns($chart,"seriesGenerators",$criteriaCols);
			$viewInfo['measures'] = simbaGetChartSelectionColumns($chart,"measures",$criteriaCols);
			$viewInfo['pointers'] = simbaGetChartSelectionColumns($chart,"pointer",$criteriaCols);
			foreach($chart->getElementsByTagName('interaction') as $interaction){
				if($interaction->hasAttribute('interactiontType')){
					if($interaction->getAttribute('interactiontType') === 'navigate'){
						$navigate = $interaction->getElementsByTagName('navigation')->item(0);
						$viewInfo['navigate']['cid'] = $navigate->getAttribute('cid');
						$sql = "SELECT obieepath FROM obiee10g_control_list WHERE control_id = ".$viewInfo['navigate']['cid'] ;
						$result = db_result(db_query($sql));
						$result = array_pop(split('/',$result));
						$viewInfo['navigate']['caption'] = $result;
					}
				}
			}
		}
	}
	if($chartData && $chartColumnInfo){
		$viewInfo['data'] = $chartData;
		$viewInfo['columnInfo'] = $chartColumnInfo;
	} else {
		$criteriaAggRules = simbaGetCriteriaAggRules($simbaxmlRaw);
		$chartRequestxml = simbaGetChartReqeustXML($viewInfo,$requestxml,$criteriaAggRules);
		$viewInfo['requestxml'] = $chartRequestxml;
		// $viewInfo['filterxml'] = $filterxml;
		// $viewInfo['variables'] = $variables;
		$chartDataxml = obiifGetDataXML(null, $chartRequestxml,null, $filterxml,$variables);
		// $viewInfo['dataxml'] = $chartDataxml;
		// $sColumnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
		// $columnIds = simbaGetColumnIdsFromRequestxml($chartRequestxml,$sColumnIds);
		// $viewInfo['data'] = simbaGetDataFromDataxml($chartDataxml,$columnIds);
		// $viewInfo['columnInfo'] = simbaGetColumnInfoFromDataxml($chartDataxml,$columnIds);
		$dataConvertResult = simbaDataConvertorManager($controller,$chartRequestxml,$simbaxmlRaw,$viewName,'Chart',$chartDataxml);
		$viewInfo['data'] = $dataConvertResult['data'];
		$viewInfo['columnInfo'] = $dataConvertResult['columnInfo'];
	}
	if($viewInfo['data']) $viewInfo['hasData'] = true;
	return $viewInfo;
}

function simbaGetChartReqeustXML($chartViewInfo,$requestxml,$criteriaAggRules){
	$serieCols = $chartViewInfo["series"];
	$categoryCols = $chartViewInfo["categories"];
	$measureCols = $chartViewInfo["measures"];

	$scmCols = array_merge($serieCols,$categoryCols,$measureCols);
	$scCols = array_merge($serieCols,$categoryCols);

	
	$criteriaCols = array();
	$excludedCols = array();
	$requestxmlDom = new DOMDocument();
	$requestxmlDom->loadxml($requestxml);

	$criteriaElement = $requestxmlDom->getElementsByTagName('criteria')->item(0);
	$columnsElement = $criteriaElement->getElementsByTagName('columns')->item(0);
	
	$viewsElement = $requestxmlDom->getElementsByTagName('views')->item(0);
	$viewsElement->parentNode->removeChild($viewsElement);
	
	foreach($columnsElement->getElementsByTagName('column') as $column){
		$colId = $column->getAttribute('columnID');
		$formula = $column->getAttribute('formula');
		if($scmCols[$colId]) { //$criteriaCols[$column->getAttribute('columnID')] = $column->getAttribute('formula');
			if($measureCols[$colId] && $criteriaAggRules[$mId]){
			// if($measureCols[$colId]){
				$aggRule = simbaConvertAggRule($criteriaAggRules[$mId]);
				$aggFormula = $aggRule.'('.$formula.' BY '.implode(",", array_values($scCols)).' )';
				$column->setAttribute('formula',$aggFormula);
			}
		} else {
			$excludedCols[] = $column;
		}
	}
	foreach($excludedCols as $excludedCol){
		$columnsElement->removeChild($excludedCol);
	}
	return $requestxmlDom->saveXML();
}

function simbaGetColumnSelectorInfo($viewName,$simbaxmlRaw){
	$viewInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	foreach($simbaxmlDom -> getElementsByTagName('columnSelector') as $columnSelector){
		if($columnSelector->getAttribute('name') === $viewName){
			$selectors = array();
			foreach($columnSelector->getElementsByTagName('selector') as $selector){
				$columnId = $selector->getAttribute('columnId');
				foreach($selector->getElementsByTagName('choice') as $choice){
					$selectors[$columnId][] = $choice->getAttribute('formula');
				}
			}
			break;
		}
	}
	$viewInfo['selectors'] = $selectors;
	return $viewInfo;
}

function simbaGetViewSelectorViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables){
	$viewInfo = array();
	$viewInfo['hasData'] = false;
	$viewInfo['columnInfo'] = array();
	$subViews = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	foreach($simbaxmlDom -> getElementsByTagName('viewSelector') as $viewSelector){
		if($viewSelector->getAttribute('name') === $viewName){
			$i = 0;
			foreach($viewSelector->getElementsByTagName('viewItem') as $viewItem){
				$subViewName = $viewItem->getAttribute('viewName');
				$subViews[$i]['viewName'] = $subViewName;
				$caption = $viewItem->getAttribute('caption');
				$viewType = simbaGetViewType($subViewName);
				$subViews[$i]['caption'] = $caption ? $caption : $viewType;
				$subViews[$i]['viewType'] = $viewType;
				if($viewType == 'PivotTable'){
					$subViews[$i]['viewInfo'] = simbaGetPivotTableViewInfo($controller, $subViewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $viewInfo['hasData'] = true;
					$viewInfo['columnInfo'] = array_merge($viewInfo['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				if($viewType == 'Chart'){
					$subViews[$i]['viewInfo'] = simbaGetChartViewInfo($controller, $subViewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $viewInfo['hasData'] = true;
					$viewInfo['columnInfo'] = array_merge($viewInfo['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				if($viewType == 'Table'){
					$subViews[$i]['viewInfo'] = simbaGetTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $viewInfo['hasData'] = true;
					$viewInfo['columnInfo'] = array_merge($viewInfo['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				if($viewType == "compoundView") {
					$subViews[$i]['subViews'] = simbaGetCompoundViewSubViews($controller, $subViewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $viewInfo['hasData'] = true;
					$viewInfo['columnInfo'] = array_merge($viewInfo['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				$i ++;
			}
			$viewInfo['subViews'] = $subViews;
			$caption = $viewSelector->getAttribute('caption');
			$viewInfo['caption'] = $viewSelector->getAttribute('caption');
			break;
		}
	}
	return $viewInfo;
}

function simbaGetCompoundViewSubViews($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables){
	$subViews = array();
	$subViews['hasData'] = false;
	$subViews['columnInfo'] = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	foreach($simbaxmlDom -> getElementsByTagName('compoundView') as $compoundView){
		if($compoundView->getAttribute('name') === $viewName){
			$i = 0;
			foreach($compoundView->getElementsByTagName('cell') as $cell){
				$subViewName = $cell->getAttribute('viewName');
				$subViews[$i]['viewName'] = $subViewName;
				$viewType = simbaGetViewType($subViewName);
				$subViews[$i]['viewType'] = $viewType;
				if($viewType == 'PivotTable'){
					$subViews[$i]['viewInfo'] = simbaGetPivotTableViewInfo($controller, $subViewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $subViews['hasData'] = true;
					$subViews['columnInfo'] = array_merge($subViews['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				if($viewType == 'Chart'){
					$subViews[$i]['viewInfo'] = simbaGetChartViewInfo($controller, $subViewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $subViews['hasData'] = true;
					$subViews['columnInfo'] = array_merge($subViews['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				if($viewType == 'Table'){
					$cells[$i]['viewInfo'] = simbaGetTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
					if($subViews[$i]['viewInfo']['hasData']) $subViews['hasData'] = true;
					$subViews['columnInfo'] = array_merge($subViews['columnInfo'],$subViews[$i]['viewInfo']['columnInfo']);
				}
				$i ++;
			}
			break;
		}
	}
	return $subViews;
}

function simbaGetTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables){
	$viewInfo = array();
	if($controller == 'obiee10g'){
		$tableDataxml = obiifGetDataXML(null, $requestxml,null, $filterxml,$variables);
		// $viewInfo['dataxml'] = $tableDataxml;
		// $sColumnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
		// $columnIds = simbaGetColumnIdsFromRequestxml($requestxml,$sColumnIds);
		// $viewInfo['data'] = simbaGetDataFromDataxml($tableDataxml,$columnIds);
		// $viewInfo['columnInfo'] = simbaGetColumnInfoFromDataxml($tableDataxml,$columnIds);
		// $viewInfo['hasData'] = ($viewInfo['data']) ? true : false;
		$dataConvertResult = simbaDataConvertorManager($controller,$requestxml,$simbaxmlRaw,$viewName,'Table',$tableDataxml);
		$viewInfo['data'] = $dataConvertResult['data'];
		$viewInfo['columnInfo'] = $dataConvertResult['columnInfo'];
		$viewInfo['hasData'] = ($viewInfo['data']) ? true : false;
	} else if($controller == 'sql'){
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
			// $viewInfo['sql'] = $sql;
			// $viewInfo['data'] = sql_interface_mysql_getReportDataBySql($sql); // MySQL
			$viewInfo['data'] = sql_interface_oracle_getReportDataBySql($sql); // Oracle
			$viewInfo['columnInfo'] = simbaGetColumnInfoFromSimbaxml($simbaxmlRaw);
			$viewInfo['hasData'] = ($viewInfo['data']) ? true : false;
		}
	}
	return $viewInfo;
}

function simbaGetTablixViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables,$path=null){
	$viewInfo = array();
	if($controller == 'ssrs'){
		$dataxmlRaw = ssrs_interface_getDataxmlByPath($path);
		// $viewInfo['viewName'] = $viewName;
		// $viewInfo['simbaxmlRaw'] = $simbaxmlRaw;
		// $viewInfo['requestxml'] = $requestxml;
		// $viewInfo['dataxmlRaw'] = $dataxmlRaw;
		// $viewInfo['controller'] = $controller;
		$dataConvertResult = simbaDataConvertorManager($controller,$requestxml,$simbaxmlRaw,$viewName,'Table',$dataxmlRaw);
		$viewInfo['data'] = $dataConvertResult['data'];
		$viewInfo['columnInfo'] = simbaGetColumnInfoFromSimbaxml($simbaxmlRaw);
		$viewInfo['hasData'] = ($viewInfo['data']) ? true : false;
	}
	return $viewInfo;
}

function simbaGetPivotTableViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables){
	$pivotTableInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	foreach ($simbaxmlDom->getElementsByTagName("pivotTable") as $pivotTable){
		if ($pivotTable->getAttribute("name")===$viewName) break;
	}
	$criteriaCols = array();
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		$criteriaCols[$column->getAttribute('columnId')] = $column->getAttribute('formula');
	}
    foreach ($pivotTable->getElementsByTagName("edge") as $edge) {$edges[] = $edge;}
    foreach ($edges as $edge){
		$axis = $edge->getAttribute("axis");
		if ($edge->hasAttribute("total")) $pivotTableInfo[$axis]['total'] = $edge->getAttribute("total");
		if ($edge->hasAttribute("totalLabel")) $pivotTableInfo[$axis]['totalLabel'] = $edge->getAttribute("totalLabel");
		$mLabelsNode = $edge->getElementsByTagName("measureLabels")->item(0);
		if(!is_null($mLabelsNode)){
			$pivotTableInfo[$axis]["LabelPos"] = $mLabelsNode->getAttribute("edgeSeq");
			$pivotTableInfo['LabelPos'] = $axis;
			if($mLabelsNode->hasAttribute("total")) $pivotTableInfo[$axis]['total'] = $mLabelsNode->getAttribute("total");
		}
		$columns = array();
		foreach ($edge->getElementsByTagName("column") as $column){$columns[] = $column;}
		$cols =array();
		$altCols = array();
		foreach ($columns as $column){
			if($criteriaCols[$column->getAttribute("columnId")]){
				$columnId = $column->getAttribute("columnId");
				$formula = $column->getAttribute("formula");
				$altCols[$columnId] = $formula;
				$cols[$columnId]['formula'] = $formula;
				if($column->hasAttribute("aggRule")) $cols[$columnId]['aggRule'] = $column->getAttribute("aggRule");
				$columnHeading = $column->getElementsByTagName("columnHeading")->item(0);
				if($columnHeading && $columnHeading->hasAttribute('captionText'))  $cols[$columnId]['caption'] = $columnHeading->hasAttribute("captionText");
			}
		}
		$pivotTableInfo[$axis]['columns'] = $cols;
		$pivotTableInfo[$axis]['altColumns'] = $altCols;
	}
	if($controller == 'obiee10g'){
		$criteriaAggRules = simbaGetCriteriaAggRules($simbaxmlRaw);
		$ptRequestxml = simbaGetPivotTableReqeustXML($pivotTableInfo,$requestxml,$criteriaAggRules);
		// $pivotTableInfo['requestxml'] = $ptRequestxml;
		// $pivotTableInfo['filterxml'] = $filterxml;
		// $pivotTableInfo['variables'] = $variables;
		$ptDataxml = obiifGetDataXML(null, $ptRequestxml,null, $filterxml,$variables);
		// $pivotTableInfo['dataxml'] = $ptDataxml;
		// $sColumnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
		// $pivotTableInfo['sColumnIds'] = $sColumnIds;
		// $columnIds = simbaGetColumnIdsFromRequestxml($ptRequestxml,$sColumnIds);
		// $pivotTableInfo['rcolumnIds'] = $columnIds;
		// $pivotTableInfo['data'] = simbaGetDataFromDataxml($ptDataxml,$columnIds);
		// $pivotTableInfo['columnInfo'] = simbaGetColumnInfoFromDataxml($ptDataxml,$columnIds);
		$dataConvertResult = simbaDataConvertorManager($controller,$ptRequestxml,$simbaxmlRaw,$viewName,'PivotTable',$ptDataxml);
		$pivotTableInfo['data'] = $dataConvertResult['data'];
		$pivotTableInfo['columnInfo'] = $dataConvertResult['columnInfo'];
		
		$pivotCharts = array();
		foreach ($pivotTable->getElementsByTagName('chart') as $chartElement){$pivotCharts[] = $chartElement;}
		if (!empty($pivotCharts)) {
			$chartElement = $pivotCharts[0];
			$pivotTableInfo['chart']['position']  = $chartElement->getAttribute("chartPosition");	
			if($pivotTableInfo['chart']['position'] === 'only'){
				$pivotTableInfo['chart']['viewInfo'] = simbaGetChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables);
			} else {
				$pivotTableInfo['chart']['viewInfo'] = simbaGetChartViewInfo($controller, $viewName,$simbaxmlRaw,$requestxml,$filterxml,$variables,$pivotTableInfo['data'],$pivotTableInfo['columnInfo']);
			}
			$pivotTableInfo['chart']['viewName'] = $viewName;
			$pivotTableInfo['chart']['viewType'] = "Chart";
		}
		$pivotTableInfo['hasData'] = ($pivotTableInfo['data']) ? true : false;
		
		unset($pivotTableInfo["page"]['altColumns']);
		unset($pivotTableInfo["section"]['altColumns']);
		unset($pivotTableInfo["column"]['altColumns']);
		unset($pivotTableInfo["row"]['altColumns']);
		unset($pivotTableInfo["measure"]['altColumns']);
	} else if($controller == 'sql'){
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
			// $pivotTableInfo['sql'] = $sql;
			// $viewInfo['data'] = sql_interface_mysql_getReportDataBySql($sql); // MySQL
			$pivotTableInfo['data'] = sql_interface_oracle_getReportDataBySql($sql); // Oracle
			$pivotTableInfo['columnInfo'] = simbaGetColumnInfoFromSimbaxml($simbaxmlRaw);
			$pivotTableInfo['hasData'] = ($pivotTableInfo['data']) ? true : false;
		}
	}
	
	return $pivotTableInfo;
}

function simbaGetCriteriaAggRules($simbaxmlRaw){
	$aggRules = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		if($column->getAttribute('aggRule')) $aggRules[$column->getAttribute('columnId')] = $column->getAttribute('aggRule');
	}
	return $aggRules;
}

function simbaConvertAggRule($aggRule){
	$output = 'AGGREGATE';
	if(strtolower($aggRule) === 'sum') $output = 'SUM';
	if(strtolower($aggRule) === 'count') $output = 'COUNT';
	return $output;
}


function simbaGetPivotTableReqeustXML($pivotTableInfo,$requestxml,$criteriaAggRules){
	$pageCols = $pivotTableInfo["page"]['altColumns'];
	$sectionCols = $pivotTableInfo["section"]['altColumns'];
	$columnCols = $pivotTableInfo["column"]['altColumns'];
	$rowCols = $pivotTableInfo["row"]['altColumns'];
	$measureCols = $pivotTableInfo["measure"]['altColumns'];
	
	$pscrmCols = array_merge($pageCols,$sectionCols,$columnCols,$rowCols,$measureCols);
	$pscrCols = array_merge($pageCols,$sectionCols,$columnCols,$rowCols);

	
	$criteriaCols = array();
	$excludedCols = array();
	$requestxmlDom = new DOMDocument();
	$requestxmlDom->loadxml($requestxml);

	$criteriaElement = $requestxmlDom->getElementsByTagName('criteria')->item(0);
	$columnsElement = $criteriaElement->getElementsByTagName('columns')->item(0);
	
	$viewsElement = $requestxmlDom->getElementsByTagName('views')->item(0);
	$viewsElement->parentNode->removeChild($viewsElement);
	
	foreach($columnsElement->getElementsByTagName('column') as $column){
		$colId = $column->getAttribute('columnID');
		if($pscrmCols[$colId]) $criteriaCols[$column->getAttribute('columnID')] = $column->getAttribute('formula');
		else $excludedCols[] = $column;
	}
	foreach($excludedCols as $excludedCol){
		$columnsElement->removeChild($excludedCol);
	}
	
	$aggCols = array();
	// return $aggCols;
	// return $criteriaElement->hasAttribute('subjectArea') ? $criteriaElement->getAttribute('subjectArea') : $requestxml;
	if(!empty($measureCols)){
		foreach($measureCols as $mId => $mFormual){
			if(!empty($pscrCols)){
				$aggRule = ($pivotTableInfo["measure"]['columns'][$mId]['aggRule']) ? $pivotTableInfo["measure"]['columns'][$mId]['aggRule'] : $criteriaAggRules[$mId];
				$aggRule = simbaConvertAggRule($aggRule);
				$aggCols[$mId] = $aggRule.'('.$mFormual.' BY )';
				if (!empty($pageCols)){ //p
					$byCols = array_values($pageCols);
					$byIds = array_merge(array($mId),array_keys($pageCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($sectionCols)){ //ps
					$byCols = array_merge(array_values($pageCols),array_values($sectionCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($sectionCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($rowCols)){ //pr
					$byCols = array_merge(array_values($pageCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($columnCols)){ //pc
					$byCols = array_merge(array_values($pageCols),array_values($columnCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($columnCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($sectionCols) && !empty($columnCols)){ //psc
					$byCols = array_merge(array_values($pageCols),array_values($sectionCols),array_values($columnCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($sectionCols),array_keys($columnCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($sectionCols) && !empty($rowCols)){ //psr
					$byCols = array_merge(array_values($pageCols),array_values($sectionCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($sectionCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($columnCols) && !empty($rowCols)){ //pcr
					$byCols = array_merge(array_values($pageCols),array_values($columnCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($columnCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($pageCols) && !empty($sectionCols) && !empty($columnCols) && !empty($rowCols)){ //pscr
					$byCols = array_merge(array_values($pageCols),array_values($sectionCols),array_values($columnCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($pageCols),array_keys($sectionCols),array_keys($columnCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($sectionCols)){ //s
					$byCols = array_values($sectionCols);
					$byIds = array_merge(array($mId),array_keys($sectionCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($sectionCols) && !empty($columnCols)){ //sc
					$byCols = array_merge(array_values($sectionCols),array_values($columnCols));
					$byIds = array_merge(array($mId),array_keys($sectionCols),array_keys($columnCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($sectionCols) && !empty($rowCols)){ //sr
					$byCols = array_merge(array_values($sectionCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($sectionCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($sectionCols) && !empty($columnCols) && !empty($rowCols)){ //scr
					$byCols = array_merge(array_values($sectionCols),array_values($columnCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($sectionCols),array_keys($columnCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($columnCols)){ //c
					$byCols = array_values($columnCols);
					$byIds = array_merge(array($mId),array_keys($columnCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($columnCols) && !empty($rowCols)){ //cr
					$byCols = array_merge(array_values($columnCols),array_values($rowCols));
					$byIds = array_merge(array($mId),array_keys($columnCols),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
				if (!empty($rowCols)){ //r
					$byCols = array_values($rowCols);
					$byIds = array_merge(array($mId),array_keys($rowCols));
					$aggCols[implode(",", $byIds)] = $aggRule.'('.$mFormual.' BY '.implode(",", $byCols).' )';
				}
			}
		}
		if(!empty($aggCols)){
			// return $aggCols;
			foreach($aggCols as $aggId => $aggFormula){
				$colIds = explode(",", $aggId);
				foreach($columnsElement->getElementsByTagName('column') as $column){
					if($column->getAttribute('columnID') === $colIds[0]){
						$columnElement = $column->cloneNode(true);
						$columnElement->setAttribute("formula", $aggFormula);
						$columnElement->setAttribute("columnID", $aggId);
						$columnsElement->appendChild($columnElement);
						break;
					}
				}
				// $columnElement = $requestxmlDom->createElement('saw:column');
				// $columnHeadingElement = $requestxmlDom->createElement('saw:columnHeading');
				// $captionElement = $requestxmlDom->createElement('saw:caption');
				// $textElement = $requestxmlDom->createElement('saw:text',$aggId);
				// $columnElement->appendChild($columnHeadingElement);
				// $columnHeadingElement->appendChild($captionElement);
				// $captionElement->appendChild($textElement);
				// $columnElement->setAttribute("formula", $aggFormula);
				// $columnElement->setAttribute("columnID", $aggId);
				// $columnsElement->appendChild($columnElement);
				// $columnXML ='<saw:column formula="'.$aggFormula.'" columnID="'.$aggId.'"><saw:columnHeading><saw:displayFormat interaction="default"/><saw:caption><saw:text>'.$aggId.'</saw:text></saw:caption></saw:columnHeading></saw:column>';
			}
			return $requestxmlDom->saveXML();
		} else {
			return $requestxmlDom->saveXML();
		}
	} else {
		return $requestxml;
	}

}

function simbaGetDataFromDataxml($dataxml,$columnIds){
	$data = array();
	// $columnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
	$dataxmlDom = new DOMDocument();
	$dataxmlDom -> loadxml($dataxml);
	$dataxmlDom = obiifAddNullNodes($dataxmlDom);
	$columns = array();
	$i = 0;
	foreach($dataxmlDom -> getElementsByTagName('element') as $el){
		$columns[$el->getAttribute('name')] = $columnIds[$i]['columnId'];
		$i ++;
	}
	$i = 0;
	foreach($dataxmlDom -> getElementsByTagName('Row') as $row){
		if($row->hasChildNodes()){
			foreach ($row->childNodes as $child){
				foreach ($columns as $k => $v){
					if ($child->nodeName == $k) {
						$data[$i][$v] = $child->nodeValue;
					}
				}
			}
			$i ++;
		}
	}
	if(count($data) === 1){
		$j = 0;
		$ln = count($data[0]);
		foreach($data[0] as $k => $v){
			if($v === '') $j ++; 
		}
		if($j === $ln) $data = array();
	}
	return $data;
}


// function simbaGetColumnInfoFromDataxml($dataxml,$simbaxmlRaw){
function simbaGetColumnInfoFromDataxml($dataxml,$columnIds){
	$columnInfo = array();
	// $columnIds = simbaGetColumnIdsFromSimbaxml($simbaxmlRaw);
	$dataxmlDom = new DOMDocument();
	$dataxmlDom -> loadxml($dataxml);
	$i = 0;
	foreach($dataxmlDom -> getElementsByTagName('element') as $el){
		$type = $el->getAttribute('saw-sql:type');
		$formula = $el->getAttribute('saw-sql:displayFormula');
		$name = $columnIds[$i]['columnId'];
		$ids = explode(',',$name);
		$aggrRule = $el->getAttribute('saw-sql:aggregationRule');
		$tableHeading = $el->getAttribute('saw-sql:tableHeading');
		$columnHeading = $el->getAttribute('saw-sql:columnHeading');
		if($type === 'char'){
			$type = 'string';
		} else if ($type === 'integer'){
			$type = 'int';
		} else if ($type === 'float'){
			$type = 'float';
		} else {
			$type = 'string';
		}
		$columnInfo[$name]['dformula'] = $formula;
		$columnInfo[$name]['encodedformula'] = str_replace('=','-',base64_encode($columnIds[$i]['formula']));
		$columnInfo[$name]['sformula'] = $columnIds[$i]['formula'];
		$columnInfo[$name]['dataType'] = $columnInfo[$ids[0]]['type'] ? $columnInfo[$ids[0]]['type'] : $type;
		$columnInfo[$name]['aggrRule'] = $columnInfo[$ids[0]]['aggrRule']? $columnInfo[$ids[0]]['aggrRule'] : $aggrRule;
		$columnInfo[$name]['tableHeading'] = $columnInfo[$ids[0]]['tableHeading']? $columnInfo[$ids[0]]['tableHeading']: $tableHeading;
		$columnInfo[$name]['columnHeading'] = $columnInfo[$ids[0]]['columnHeading']? $columnInfo[$ids[0]]['columnHeading'] : $columnHeading;
		if($columnIds[$i]['drillthrough_cid']) $columnInfo[$name]['drillthrough_cid'] = $columnInfo[$ids[0]]['drillthrough_cid']? $columnInfo[$ids[0]]['drillthrough_cid'] : $columnIds[$i]['drillthrough_cid'];
		if($columnIds[$i]['dataFormat']) $columnInfo[$name]['dataFormat'] = $columnInfo[$ids[0]]['dataFormat']? $columnInfo[$ids[0]]['dataFormat'] : $columnIds[$i]['dataFormat'];
		
		$i ++;
	}
	return $columnInfo;
}


function simbaGetColumnIdsFromSimbaxml($simbaxmlRaw){
	$columnIds = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	$i = 0;
	foreach($criteria->getElementsByTagName('column') as $column){
		$columnIds[$i]['columnId'] = $column->getAttribute('columnId');
		$columnIds[$i]['formula'] = $column->getAttribute('formula');
		if($column->hasAttribute('interaction')){
			if($column->getAttribute('interaction') === 'navigate'){
				$navigate = $column->getElementsByTagName('navigation')->item(0);
				$columnIds[$i]['drillthrough_cid'] = $navigate->getAttribute('cid');
			}
		}
		$dataFormatElement = $column->getElementsByTagName('dataFormat')->item(0);
		if($dataFormatElement){
			if($dataFormatElement->hasAttribute('type')) $dataFormat['type'] = $dataFormatElement->getAttribute('type');
			if($dataFormatElement->hasAttribute('commas')) $dataFormat['commas'] = $dataFormatElement->getAttribute('commas');
			if($dataFormatElement->hasAttribute('negativeType')) $dataFormat['negativeType'] = $dataFormatElement->getAttribute('negativeType');
			if($dataFormatElement->hasAttribute('minDigits')) $dataFormat['minDigits'] = $dataFormatElement->getAttribute('minDigits');
			if($dataFormatElement->hasAttribute('maxDigits')) $dataFormat['maxDigits'] = $dataFormatElement->getAttribute('maxDigits');
			$columnIds[$i]['dataFormat'] = $dataFormat;
		}
		$i++;
	}
	return $columnIds;
}

function simbaGetColumnIdsFromRequestxml($requestxml,$sColumnIds){
	$columnIds = array();
	$requestxmlDom = new DOMDocument();
	$requestxmlDom->loadxml($requestxml);
	$criteria = $requestxmlDom->getElementsByTagName('criteria')->item(0);
	$i = 0;
	foreach($criteria->getElementsByTagName('column') as $column){
		$columnIds[$i]['columnId'] = $column->getAttribute('columnID');
		$columnIds[$i]['formula'] = $column->getAttribute('formula');
		$colIds = explode(',', $columnIds[$i]['columnId']);
		foreach($sColumnIds as $k => $sColumnId){
			// if($sColumnId['columnId'] == $columnIds[$i]['columnId'] && $sColumnId['drillthrough_cid']){
				// $columnIds[$i]['drillthrough_cid'] = $sColumnId['drillthrough_cid'];
				// break;
			// }
			
			// if($sColumnId['columnId'] == $columnIds[$i]['columnId']){
			if($colIds[0] == $sColumnId['columnId']){
				if($sColumnId['drillthrough_cid']) $columnIds[$i]['drillthrough_cid'] = $sColumnId['drillthrough_cid'];
				if($sColumnId['dataFormat']) $columnIds[$i]['dataFormat'] = $sColumnId['dataFormat'];
				break;
			}
		}
		$i++;
	}
	return $columnIds;
}


function simbaGetColumnInfoFromSimbaxml($simbaxmlRaw){
	$columnInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	foreach($criteria->getElementsByTagName('column') as $column){
		// $name = strtoupper($column->getAttribute('columnId'));
		$name = $column->getAttribute('columnId');
		$formula = $column->getAttribute('formula');
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
		$columnInfo[$name]['aggrRule'] = 'none';
		$columnInfo[$name]['tableHeading'] = '';
	}
	return $columnInfo;

}