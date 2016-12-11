<?php 
$GLOBALS['THRIFT_ROOT'] = '/var/www/html/src';

require_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';
require_once $GLOBALS['THRIFT_ROOT'].'/protocol/TBinaryProtocol.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TSocket.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/THttpClient.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TBufferedTransport.php';

require_once $GLOBALS['THRIFT_ROOT'].'/packages/dataservice/DataService.php';

try {

    $socket = new TSocket('localhost', 9091);
    $transport = new TBufferedTransport($socket, 1024, 1024);
    $protocol = new TBinaryProtocol($transport);
    $client = new DataServiceClient($protocol);
    $transport->open();
    $client->ping();
	$srcDataset = new srcDataset();
	$srcDataset->appName = 'ssrs';
	$fileName = "Magento_Orders_report";
	// $fileName = "Magento_Orders_report_column_chart";
	// $fileName = "Product_Order_Amounts(Table)";
	// $fileName = "Product_Order_Grand_Total_Pie_Chart";
	$line = '';
    $file_handle = fopen($fileName.".xml", "r");
    while (!feof($file_handle)) {
         $line.=fgets($file_handle);
    }
    $srcDataset->dataxmlRaw = $line;
	fclose($file_handle);
	$line = '';
    $file_handle = fopen($fileName.".rdl", "r");
    while (!feof($file_handle)) {
         $line.=fgets($file_handle);
    }
    $srcDataset->requestxmlRaw = $line;
	fclose($file_handle);
	$srcDataset->viewName = 'Tablix2';
	// $srcDataset->viewName = 'Tablix1';
	// $srcDataset->viewName = 'Chart2';
	$srcDataset->viewType = 'Table';
	// $srcDataset->viewType = 'Chart';
	$result = $client->convert_data($srcDataset);
	var_dump($result);
    // $srcQueryset = new dataService_srcQueryset();
	// $srcQueryset->appName = 'obiee10g';
	// $srcQueryset->prompts = Array(0=>Array('control'=>'drop','operator'=>'in','formula'=>'A','value'=>'1'));
	// $line = '';
    // $file_handle = fopen("APRadar.xml", "r");
    // while (!feof($file_handle)) {
         // $line.=fgets($file_handle);
    // }
    // $srcQueryset->srcXml = $line;
	// fclose($file_handle);
	// $filters = $client->get_filters($srcQueryset);
	// print_r($filters);
	// $requestxml = $client->get_requestXml($srcQueryset);
	// print $requestxml;
}
catch (dataService_InvalidValueException $e) {
    echo $e->error_msg.'<br/>';
}
?>