<?php
function mobiiapp_client_xdata_getPageSimba($control_id,$filtersStr){
	$sql = "SELECT simbaxml FROM xdata_adaptor_page WHERE type = 'page' and cid = :cid";
	$record = db_query($sql, array(':cid' => $control_id))->fetchObject();
	$simbaxmlRaw = $record->simbaxml;
	$page = array();
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($simbaxmlRaw);
	$defaultFilters = array();
	$variables = array();
	$pagePrompts = array();
	$pagePrompts = mobiiapp_client_xdata_getPromptsInfo($control_id,$filtersStr);
	$defaultFilters = $pagePrompts['defaultFilters'];
	$variables = $pagePrompts['variables'];
	$page['pagePrompts'] = $pagePrompts;
	if($_POST['refreshPrompt']){
		echo '{"success": true, "pagesimba": '.json_encode($page)."}";
		return;
	}
	foreach($simbaxml -> getElementsByTagName('pageReport') as $pageReport){
		$cid = $pageReport->getAttribute('cid');
		$caption = $pageReport->getAttribute('caption');
		$page['pageReports'][$cid] = array();
		$page['pageReports'][$cid]['caption'] = $caption;
		$sql = "SELECT dataset_id, simbaxml FROM xdata_adaptor_page WHERE type = 'report' and cid = :cid";
		$record = db_query($sql,array(':cid'=>$cid))->fetchObject();
		$simbaxmlRaw = $record->simbaxml;
		$dataset_id = $record->dataset_id;
		$reportFilters = mobiiapp_client_xdata_handleDefaultFilters($defaultFilters,$dataset_id);
		$simbaxmlRaw = mobiiapp_client_xdata_QueryManager($reportFilters,$simbaxmlRaw);
		$page['pageReports'][$cid]['reportFilters'] = $reportFilters;
		$baseViewInfo = mobiiapp_client_reportInfoManager('sql',$simbaxmlRaw,null);
		// $page['pageReports'][$cid]['baseViewInfo'] = $baseViewInfo;
		$page['pageReports'][$cid]['baseViewInfo'] = mobiiapp_client_xdata_getReportViewsData($dataset_id,$baseViewInfo,$simbaxmlRaw);
	}
	$drillThroughTargets = mobiiapp_client_getNotInPageReports($control_id);
	$page['drillThroughTargets'] = $drillThroughTargets;
	if($_POST) echo '{"success": true, "pagesimba": '.json_encode($page)."}";
	else var_dump($page);//echo '{"success": true, "pagesimba": '.json_encode($page)."}"; 
}

function mobiiapp_client_getNotInPageReports($pagecid){
	$notInPageReports = array();
	$result = db_query(
		"SELECT 
			cid, 
			name
		FROM 
			xdata_adaptor_page
		WHERE 
			fid = :fid AND
			type = 'report' AND 
			(in_page = 0 OR in_page is null)
		",
		array(':fid' => $pagecid)
	);
	foreach ($result as $record) {
		$notInPageReports[$record->cid] = $record->name;
	}
	return $notInPageReports;
}

function mobiiapp_client_xdata_getReportSimba($pagecid,$reportid,$promptfilters,$drillthroughfilters,$reportSimbaxmlRaw=null){
	$defaultFilters = array();
	$variables = array();
	if($pagecid){
		$sql = "SELECT simbaxml FROM xdata_adaptor_page WHERE type = 'page' and cid = :cid";
		$record = db_query($sql, array(':cid' => $pagecid))->fetchObject();
		$simbaxmlRaw = $record->simbaxml;
		$page = array();
		$simbaxml = new DOMDocument();
		$simbaxml -> loadXML($simbaxmlRaw);
		$pagePrompts = array();
		$pagePrompts = mobiiapp_client_xdata_getPromptsInfo($pagecid,$promptfilters);
		$defaultFilters = $pagePrompts['defaultFilters'];
		$variables = $pagePrompts['variables'];
		$page['pagePrompts'] = $pagePrompts;
	}
	$drillThroughFilters = json_decode($drillthroughfilters);
	if(!empty($drillThroughFilters )){
		foreach($drillThroughFilters as $drillThroughFilter){
			// $drillFilter['formula'] = base64_decode(str_replace('-','=',$drillThroughFilter->formula));
			$formula = base64_decode(str_replace('-','=',$drillThroughFilter->formula));
			$drillFilter['oformula'] = $formula;
			$drillFilter['formula'] = mobiiapp_client_xdata_replaceFormulaDataset($formula,$reportid);
			$drillFilter['control'] = 'edit';
			$drillFilter['operator'] = 'in';
			$drillFilter['value'] = $drillThroughFilter->value;
			$defaultFilters[] = $drillFilter;
		}
	}
	
	$reportsimba = array();
	$sql = "SELECT dataset_id, name, simbaxml FROM xdata_adaptor_page WHERE type = 'report' and cid = :cid";
	$record = db_query($sql,array(':cid' => $reportid))->fetchObject();
	$simbaxmlRaw = ($reportSimbaxmlRaw) ? $reportSimbaxmlRaw : $record->simbaxml;
	$reportsimba['caption'] = $record->name;
	// $reportsimba['simbaxmlRaw'] = $simbaxmlRaw;
	$dataset_id = $record->dataset_id;
	$reportFilters = mobiiapp_client_xdata_handleDefaultFilters($defaultFilters,$dataset_id);
	$simbaxmlRaw = mobiiapp_client_xdata_QueryManager($reportFilters,$simbaxmlRaw);
	$baseViewInfo = mobiiapp_client_reportInfoManager('sql',$simbaxmlRaw,null);
	$reportsimba['baseViewInfo'] = mobiiapp_client_xdata_getReportViewsData($dataset_id,$baseViewInfo,$simbaxmlRaw);
	if($_POST) echo '{"success": true, "reportsimba": '.json_encode($reportsimba).',"defaultFilters":'.json_encode($defaultFilters)."}";
}

function mobiiapp_client_xdata_replaceFormulaDataset($formula,$reportid){
	$mFormula = $formula;
	// $dataset_name = db_query(
		// "SELECT 
			// d.name
		// FROM 
			// xdata_adaptor_dataset d
		// JOIN 
			// xdata_adaptor_page p
		// ON 
			// d.id = p.dataset_id
		// WHERE 
			// p.cid = :cid
		// ",
		// array(':cid' => $reportid)
	// )->fetchField();
	$tmp = explode('.',$formula);
	if(count($tmp) == 2){
		return $tmp[1];
	} 
	return $mFormula;
}

function mobiiapp_client_xdata_getPromptsInfo($pagecid,$filtersStr){
	$pagePrompts = array();
	$prompts = array();
	$sql = "SELECT cid, simbaxml FROM xdata_adaptor_page WHERE type = 'prompt' and fid = :fid";
	$result = db_query($sql, array(':fid' => $pagecid));
	foreach($result as $record){
		$promptSimbaxmlRaw = $record->simbaxml;
		$promptCid = $record->cid;
		$promptSimbaxmlRaw = mobiiapp_client_xdata_handleDefaultFiltersValue($promptCid,$promptSimbaxmlRaw);
		$prompts[$promptCid] = $promptSimbaxmlRaw;
	}
	if(!empty($prompts)){
		$pagePrompts = mobiiapp_client_promptsInfoManager($filtersStr,$prompts);
		$pagePrompts = mobiiapp_client_xdata_getPromptFiltersData($pagePrompts);
	} else {
		$pagePrompts['defaultFilters'] = array();
		$pagePrompts['variables'] = array();
	}
	
	return $pagePrompts;
}

function mobiiapp_client_xdata_handleDefaultFiltersValue($promptCid,$promptSimbaxmlRaw){
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($promptSimbaxmlRaw);
	foreach($simbaxml -> getElementsByTagName('promptFilter') as $promptFilter){
		$defaultX = $promptFilter->getAttribute('default');
		$defaultValue = $promptFilter->getAttribute('defaultValue');
		$formula = $promptFilter->getAttribute('formula');
		$control = $promptFilter->getAttribute('control');
		if($defaultX === 'sqlExpression'){
			$sql = "SELECT dataset_id FROM xdata_adaptor_page WHERE type = 'prompt_filter' and fid = :fid and name = :name";
			$dataset_id = db_query($sql,array(':fid'=>$promptCid,':name'=>$formula))->fetchField();
			$rows = xdata_get_data_by_sql($defaultValue,$dataset_id);
			$formula_key = str_replace(' ','_',strtolower($formula));
			if($control == 'multi'){
				$values = array();
				foreach($rows as $row){
					$values[] = $row[$formula_key];
				}
				$defaultValue = implode(", ", $values);
			} else {
				$defaultValue = $rows[0][$formula_key];
			}
			$promptFilter->setAttribute('default','specific');
			$promptFilter->setAttribute('defaultValue',$defaultValue);
		}
	}
	return $simbaxml->saveXML();
}

function mobiiapp_client_xdata_getPromptFiltersData($pagePrompts){
	foreach($pagePrompts as $pCid => $pagePrompt){
		if($pCid == 'defaultFilters'){
		} else if($pCid != 'variables'){
			$promptFilters = $pagePrompt['promptFilters'];
			foreach($promptFilters as $i => $promptFilter){
				$promptFilter['data'] = array();
				$formula = $promptFilter['formula'];
				$sql = "SELECT dataset_id FROM xdata_adaptor_page WHERE type = 'prompt_filter' and fid = :fid and name = :name";
				$dataset_id = db_query($sql,array(':fid'=>$pCid,':name'=>$formula))->fetchField();
				$rows = xdata_get_data_by_sql($promptFilter['values'],$dataset_id);
				$data = array();
				foreach($rows as $row){
					$value = $row[strtolower(str_replace(' ','_',$formula))];
					if(!in_array($value,$data)){
						$data[] = $value;
					}
				}
				$promptFilter['data'][$formula] = $data;
				// $promptFilter['data'][$formula] = $rows;
				$promptFilters[$i] = $promptFilter;
			}
			$pagePrompt['promptFilters'] = $promptFilters;
			$pagePrompts[$pCid] = $pagePrompt;
		}
	}
	return $pagePrompts;

}

function mobiiapp_client_xdata_handleDefaultFilters($defaultFilters,$dataset_id){
	$len = count($defaultFilters);
	$reportFilters = array();
	$dataset_name = db_query(
		'SELECT name FROM xdata_adaptor_dataset WHERE id = :id',
		array(':id' => $dataset_id))
		->fetchField();
	if($dataset_name){
		for($i=0;$i<$len;$i++){
			$defaultFilter = $defaultFilters[$i];
			$defaultFilter['formula'] = $dataset_name.'.'.$defaultFilter['formula'];
			$reportFilters[$i] = $defaultFilter;
		}
	} else {
		return $defaultFilters;
	}
	return $reportFilters;
}

function mobiiapp_client_xdata_QueryManager($defaultFilters,$simbaxmlRaw,$viewName=null,$viewType=null){
	$srcQueryset = class_exists(dataService_srcQueryset) ? new dataService_srcQueryset() : new srcQueryset();
	$srcQueryset->appName = 'sql';
	$srcQueryset->prompts = $defaultFilters;
	$srcQueryset->srcXml = $simbaxmlRaw;
	$srcQueryset->viewName = $viewName;
	$srcQueryset->viewType = strtolower($viewType);
	global $data_client;
	$simbaxmlRaw = $data_client->get_requestXml($srcQueryset);
	return $simbaxmlRaw;
}

function mobiiapp_client_xdata_getReportViewsData($dataset_id, $baseViewInfo,$simbaxmlRaw){
	if (!empty($baseViewInfo) && !empty($baseViewInfo['views'])){
		$baseViewInfo['hasData'] = false;
		$baseViewInfo['useCount'] = false;
		$baseViewInfo['columnInfo'] = array();
		foreach ($baseViewInfo['views'] as $viewIdx => $view){
			if($view['subViews']){
				foreach ($view['subViews'] as $subViewIdx => $subView){
					if($subView['subViews']){
						foreach($subView['subViews'] as $subSubViewIdx => $subSubView){
							$viewName = $subSubView['viewName'];
							// $viewType = strtolower($subSubView['viewType']);
							$viewType = $subSubView['viewType'];
							$dataInfo = mobiiapp_client_xdata_getDetailedViewData($dataset_id,$simbaxmlRaw,$viewName,$viewType);
							$subSubView['viewInfo']['data'] = $dataInfo['data'];
							$subSubView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							$subSubView['viewInfo']['useCount'] = $dataInfo['useCount'];
							$subSubView['viewInfo']['sql'] = $dataInfo['sql'];
							if ($subSubView['viewType'] == 'pivotTable' && $subSubView['viewInfo'] && $subSubView['viewInfo']['chart'] && $subSubView['viewInfo']['chart']['position']!='only'){
								$subSubView['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
								$subSubView['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
							}
							$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
							$subView['viewInfo']['useCount'] = $dataInfo['useCount'];
							$baseViewInfo['useCount'] = ($dataInfo['useCount'] || $baseViewInfo['useCount']) ? true : false;
							$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
							$subView['subViews'][$subSubViewIdx] = $subSubView;
						}
					} else {
						$viewName = $subView['viewName'];
						// $viewType = strtolower($subView['viewType']);
						$viewType = $subView['viewType'];
						$dataInfo = mobiiapp_client_xdata_getDetailedViewData($dataset_id,$simbaxmlRaw,$viewName,$viewType);
						$subView['viewInfo']['data'] = $dataInfo['data'];
						$subView['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
						$subView['viewInfo']['useCount'] = $dataInfo['useCount'];
						$subView['viewInfo']['sql'] = $dataInfo['sql'];
						if ($subView['viewType'] == 'pivotTable' && $subView['viewInfo'] && $subView['viewInfo']['chart'] && $subView['viewInfo']['chart']['position']!='only'){
							$subView['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
							$subView['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
						}
						$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
						$baseViewInfo['useCount'] = ($dataInfo['useCount'] || $baseViewInfo['useCount']) ? true : false;
						$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
					}
					$view['subViews'][$subViewIdx] = $subView;
				}
			} else {
				$viewName = $view['viewName'];
				// $viewType = strtolower($view['viewType']);
				$viewType = $view['viewType'];
				$dataInfo = mobiiapp_client_xdata_getDetailedViewData($dataset_id,$simbaxmlRaw,$viewName,$viewType);
				$view['viewInfo']['data'] = $dataInfo['data'];
				$view['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
				$view['viewInfo']['useCount'] = $dataInfo['useCount'];
				$view['viewInfo']['sql'] = $dataInfo['sql'];
				if ($view['viewType'] == 'pivotTable' && $view['viewInfo'] && $view['viewInfo']['chart'] && $view['viewInfo']['chart']['position']!='only'){
					$view['viewInfo']['chart']['viewInfo']['data'] = $dataInfo['data'];
					$view['viewInfo']['chart']['viewInfo']['columnInfo'] = $dataInfo['columnInfo'];
				}
				$baseViewInfo['hasData'] = ($dataInfo['data']) ? true : false;
				$baseViewInfo['useCount'] = ($dataInfo['useCount'] || $baseViewInfo['useCount']) ? true : false;
				$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$dataInfo['columnInfo']);
			}
			$baseViewInfo['views'][$viewIdx] = $view;
		}
		$columnInfo = mobiiapp_client_getColumnInfoFromSimbaxml(array(),$simbaxmlRaw);
		$baseViewInfo['columnInfo'] = array_merge($baseViewInfo['columnInfo'],$columnInfo);
	}
	return $baseViewInfo;
}

function mobiiapp_client_xdata_getDetailedViewData($dataset_id,$simbaxmlRaw,$viewName,$viewType){
	$simbaxmlRaw = mobiiapp_client_xdata_QueryManager(null,$simbaxmlRaw,$viewName,$viewType);
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
		$data = xdata_get_data_by_sql($sql,$dataset_id);
		if(is_array($data)){
			$output['data'] = $data;
		} else {
			$output['data'] = array();
		}
		$output['sql'] = $sql;
		$output['columnInfo'] = mobiiapp_client_getColumnInfoFromSimbaxml($data,$simbaxmlRaw,$viewName,$viewType);
		if($viewType == 'mapView'){
			$output['data'] = mobiiapp_client_handleMapViewData($output['data'],$simbaxmlRaw,$viewName,$viewType);
			$output['mapView'] = $viewName;
		}
		if($output['columnInfo']['cc1'] && ($viewType == 'chart' || $viewType == 'pivotTable')) $output['useCount'] = true;
		else $output['useCount'] = false;
	} else {
		$output['data'] = array();
		$output['columnInfo'] = array();
		$output['useCount'] = false;
	}
	return $output;
}

function mobiiapp_client_getCoordinateByBingMapService($address){
	$coord = array();
	$bingMapsKey = 'AuroaJl13amAax36pbA6zTCLouuRuKmUiQkDLZjgEgCTAISgjBlhfqV2ZTpAL39B';
	$url = 'http://dev.virtualearth.net/REST/v1/Locations?q='.urlencode($address).'&o=json&key='.$bingMapsKey;
	$result = file_get_contents($url);
    $resultObj = json_decode($result);
	if($resultObj->statusCode == 200){
		$coord = $resultObj->resourceSets[0]->resources[0]->point->coordinates;
	} else {
		$coord = array(33.713626861572,-117.79599761963);
	}
	return $coord;
}

function mobiiapp_client_handleMapViewData($data,$simbaxmlRaw,$viewName,$viewType){
	$simbaxml = new DOMDocument();
	$simbaxml -> loadXML($simbaxmlRaw);
	// $newData = array();
	foreach($simbaxml -> getElementsByTagName('mapView') as $mapView){
		if($mapView->getAttribute('name') == $viewName){
			$geocodeSource = $mapView->hasAttribute('geocodeSource') ? $mapView->getAttribute('geocodeSource') : 'coordinate';
			// $newData['geocodeSource'] = $geocodeSource;
			if($geocodeSource == 'address'){
				$location = $mapView->getElementsByTagName('location')->item(0);
				$addressColumn = $location->getElementsByTagName('column')->item(0);
				$addressColumnId = $addressColumn->getAttribute('columnId');
				// $newData['addressColumnId'] = $addressColumnId;
				$i = 0;
				$newData = array();
				foreach($data as $row){
					$address = $row[$addressColumnId];
					$coord = mobiiapp_client_getCoordinateByBingMapService($address);
					$row['lat'] = $coord[0];
					$row['lng'] = $coord[1];
					$newData[$i] = $row;
					$i = $i +1;
					if($i >= 500) {
						break;
					}
				}
				return $newData;
			} else {
				return $data;
			}
			break;
		}
	}
	return $data;
}

function mobiiapp_client_getColumnInfoFromSimbaxml($data,$simbaxmlRaw,$viewName=null,$viewType=null){
	$getViewColumns = ($viewName && $viewType) ? true : false;
	if(empty($data) && $getViewColumns){
		return array();
	}
	$columnInfo = array();
	$simbaxmlDom = new DOMDocument();
	$simbaxmlDom->loadxml($simbaxmlRaw);
	$criteria = $simbaxmlDom->getElementsByTagName('criteria')->item(0);
	$viewType = strtolower($viewType);
	$viewColumns = array();
	if($getViewColumns){
		if ($viewType == 'chart'){
			$chartObjs = $simbaxmlDom->getElementsByTagName('chart');
			foreach($chartObjs as $chartObj){
				if($chartObj->getAttribute('name') == $viewName){
					$viewObj = $chartObj;
					break;
				}
			}
		} else if ($viewType == 'pivottable'){
			$povotTableObjs = $simbaxmlDom->getElementsByTagName('pivotTable');
			foreach($povotTableObjs as $povotTableObj){
				if($povotTableObj->getAttribute('name') == $viewName){
					$viewObj = $povotTableObj;
					break;
				}
			}
		}
		if($viewObj){
			$viewColumnObjs = $viewObj->getElementsByTagName('column');
			foreach($viewColumnObjs as $viewColumnObj){
				$formula = $viewColumnObj->getAttribute('formula');
				$viewColumns[$viewColumnObj->getAttribute('columnId')] = $formula ? $formula : 'none';
			}
		}
	}
	foreach($criteria->getElementsByTagName('column') as $column){
		$name = $column->getAttribute('columnId');
		if(empty($viewColumns) || $viewColumns[$name]){
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
	}
	
	foreach($data[0] as $key => $value){
		$keys = explode(',',$key);
		if(count($keys) > 1 && $columnInfo[$keys[0]]){
			$columnInfo[$key] = $columnInfo[$keys[0]];
		}
	}
	
	
	return $columnInfo;

}

function mobiiapp_client_xdata_editReportSimbaxml($srcSimbaxml,$updateInfo){
	$srcMetadataset = new srcMetadataset();
	$srcMetadataset->srcMetadata = $srcSimbaxml;
	$srcMetadataset->updateInfo = $updateInfo;
	global $metadata_client;
    $result = $metadata_client->edit_metadata($srcMetadataset);
    return $result;
}

function mobiiapp_client_xdata_updateReportSimbaxml($reportid,$reporteditorinfo,$editoption){
	$sql = "SELECT simbaxml FROM xdata_adaptor_page WHERE type = 'report' and cid = :cid";
	$record = db_query($sql,array(':cid' => $reportid))->fetchObject();
	$simbaxmlRaw = $record->simbaxml;
	$updatedSimbaxmlRaw = mobiiapp_client_xdata_editReportSimbaxml($simbaxmlRaw,$reporteditorinfo);
	if($editoption == 'submit'){
		$update = db_update('xdata_adaptor_page')
			->fields(array(
				'simbaxml' => $updatedSimbaxmlRaw,
				'timestamp' => time()
			))
			->condition('cid', $reportid, '=')
			->execute();
	}
	return $updatedSimbaxmlRaw;
}

