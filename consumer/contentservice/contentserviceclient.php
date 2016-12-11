<?php 
$GLOBALS['THRIFT_ROOT'] = '/var/www/html/src';

require_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';
require_once $GLOBALS['THRIFT_ROOT'].'/protocol/TBinaryProtocol.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TSocket.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/THttpClient.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TBufferedTransport.php';


require_once $GLOBALS['THRIFT_ROOT'].'/packages/contentservice/ContentService.php';
try {

    $socket = new TSocket('localhost', 9092);
    $transport = new TBufferedTransport($socket, 1024, 1024);
    $protocol = new TBinaryProtocol($transport);
    $client = new ContentServiceClient($protocol);
    $transport->open();
    $client->ping();
    $srcPromptsSet = new srcPromptsSet();
	$prompts = array(
		'1616' => '<saw:view xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:saw="com.siebel.analytics.web/report/v1" xsi:type="saw:globalFilterPrompt" rptViewVers="200510010"><saw:prompt type="columnFilter" formula="opportunities.sales_stage" subjectArea="&quot;Sales Opportunities&quot;" eOperator="in" eControl="multi" includeReportDefaults="true" includeAllChoices="true" columnID="c0"><sawx:expr xmlns:sawx="com.siebel.analytics.web/expression/v1" xsi:type="sawx:list" op="in"><sawx:expr xsi:type="sawx:sqlExpression">opportunities.sales_stage</sawx:expr></sawx:expr><saw:label><saw:caption><saw:text>Sales Stages</saw:text></saw:caption></saw:label></saw:prompt></saw:view>'
	);
	$prompts = null;
	$filters = null;
    // var_dump($client);
	// var_dump($srcPromptsSet);
	$srcPromptsSet->prompts = $prompts;
	$srcPromptsSet->filters = $filters;
	$result = $client->get_prompts_info($srcPromptsSet);
	var_dump($result);
}
catch (dataStruct_InvalidValueException $e) {
    echo $e->error_msg.'<br/>';
}
