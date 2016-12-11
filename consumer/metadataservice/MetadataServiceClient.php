#!/usr/bin/env php
<?php
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

#$GLOBALS['THRIFT_ROOT'] = '../../lib/php/src';
//$GLOBALS['THRIFT_ROOT'] = '/root/thrift-0.6.1/lib/php/src';
$GLOBALS['THRIFT_ROOT'] = 'src';

require_once $GLOBALS['THRIFT_ROOT'].'/Thrift.php';
require_once $GLOBALS['THRIFT_ROOT'].'/protocol/TBinaryProtocol.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TSocket.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/THttpClient.php';
require_once $GLOBALS['THRIFT_ROOT'].'/transport/TBufferedTransport.php';

/**
 * Suppress errors in here, which happen because we have not installed into
 * $GLOBALS['THRIFT_ROOT'].'/packages/tutorial' like we are supposed to!
 *
 * Normally we would only have to include Calculator.php which would properly
 * include the other files from their packages/ folder locations, but we
 * include everything here due to the bogus path setup.
 */
//error_reporting(E_NONE);
//require_once 'MetadataService.php';
//require_once 'MetadataService_types.php';
require_once $GLOBALS['THRIFT_ROOT'].'/packages/metadataservice/MetadataService.php';

//error_reporting(E_ALL);

try {
//  if (array_search('--http', $argv)) {
//    $socket = new THttpClient('localhost', 8080, '/php/PhpServer.php');
//  } else {
    $socket = new TSocket('localhost', 9090);
//  }
  $transport = new TBufferedTransport($socket, 1024, 1024);
  $protocol = new TBinaryProtocol($transport);
  $client = new MetadataServiceClient($protocol);

  $transport->open();

  $client->ping();

//  $path= '/opt/thrift/metadataservice/simba/form1.xml';
//  $schemaName1 = 'CDP Waterfall';
//  $uid = 1;


//  $tokens = $client->getTokens();
//  print_r($tokens);
//  $client->delTokens($path);

//  $schemas = $client->getSchemas($path);
//  var_dump($schemas);
  
//  $columns = $client->getColumns('CDP Waterfall',$path);
//  var_dump($columns);

//	$schema = new Schema();
//	$schema->schemaName = 'CDP Waterfall';
//	$schema->schemaDesc = 'CDP Waterfall Desc';
//	$setSchemaResults = $client->setSchema($path,$schema,$uid);
//	print $setSchemaResults;

//  $drillColumn = new DrillColumn();
//  $drillColumn->columnName = 'D';
//  $drillColumn->weight = '1';
//  $table = new Table();
//  $table->tableName = 'B';
//  $table->position = '2';
//  $dimColumn = new DimColumn();
//  $dimColumn->columnName = 'C';
//  $column = new Column();
//  $column->columnName='CRD QTR';
//  $column->columnAlias='DA';
//  $column->columnAlias='DA';
//  $column->columnDesc='DD';
//  $column->nullable='Y';
//  $column->dataType='D';
//  $column->aggregateable='Y';
//  $column->aggrRule='D';
//  $column->drillColumns=array($drillColumn);
//  $column->tables=array($table);
//  $column->dimColumns=array($dimColumn);
//  $setColumnResult = $client->setColumn($schemaName1,$column,$path,$uid);
//  print $setColumnResult;

//	$schema = new Schema();
//	$schema->schemaName = 'schemaA';
//	$schema->schemaDesc = 'schemaA Desc';
//	$addSchemaResult = $client->addSchema($path,$schema,$uid);
//	print $addSchemaResult;

//  $drillColumn = new DrillColumn();
//  $drillColumn->columnName = 'Z';
//  $drillColumn->weight = '9';
//  $table = new Table();
//  $table->tableName = 'Z';
//  $table->position = '9';
//  $dimColumn = new DimColumn();
//  $dimColumn->columnName = 'Z';
//  $column = new Column();
//  $column->columnName='Z';
//  $column->columnAlias='Z';
//  $column->columnAlias='Z';
//  $column->columnDesc='Z';
//  $column->nullable='Z';
//  $column->dataType='Z';
//  $column->aggregateable='Z';
//  $column->aggrRule='Z';
//  $column->drillColumns=array($drillColumn);
//  $column->tables=array($table);
//  $column->dimColumns=array($dimColumn);
//  $addColumnResult = $client->addColumn($schemaName1,$column,$path,$uid);
//  print $addColumnResult;

//	$schema = new Schema();
//	$schema->schemaName = 'B';
//	$schema->schemaDesc = 'B Desc';
//	$delSchemaresult = $client->delSchema($path,$schema,$uid);
//	print $delSchemaresult;

//  $drillColumn = new DrillColumn();
//  $drillColumn->columnName = 'Cycle Yr Num';
//  $drillColumn->weight = '9';
//  $table = new Table();
//  $table->tableName = 'Z';
//  $table->position = '9';
//  $dimColumn = new DimColumn();
//  $dimColumn->columnName = 'Z';
//  $column = new Column();
//  $column->columnName='Z';
//  $column->columnAlias='Z';
//  $column->columnAlias='Z';
//  $column->columnDesc='Z';
//  $column->nullable='Z';
//  $column->dataType='Z';
//  $column->aggregateable='Z';
//  $column->aggrRule='Z';
//  $column->drillColumns=array($drillColumn);
//  $column->tables=array($table);
//  $column->dimColumns=array($dimColumn);
//  $addColumnResult = $client->addColumn($schemaName1,$column,$path,$uid);
//  print $addColumnResult;

//  $saveMetadataResult = $client->saveMetadata($path,$uid);
//  print $saveMetadataResult;
//  
//  $transport->close();

//	$promptFilter1 = new PromptFilter();
//	$promptFilter1->formula = 'formula1';
//	$promptFilter1->defaultOn = 'default1';
//
//	$promptFilter2 = new PromptFilter();
//	$promptFilter2->formula = 'formula2';
//	$promptFilter2->defaultOn = 'default2';
//
//	$promptFilter3 = new PromptFilter();
//	$promptFilter3->formula = 'formula3';
//	$promptFilter3->defaultOn = 'default3';

/* Test Reprot Improving convert */
	$prompt1 = new Prompt();
	$prompt1->promptName = 'prompt1';
//	$prompt1->promptFilters = array($promptFilter1,$promptFilter2);
//
//	$prompt2 = new Prompt();
//	$prompt2->promptName = 'prompt2';
//	$prompt2->promptFilters = array($promptFilter3);

/* Test Reprot Init convert */	
	$report1 = new Report();
	$report1->reportName = 'report1';
	$report1->reportSql = 'SELECT
COLA A,
COLB B
FROM
C';

/* Test Reprot Improving convert */
//	$fileName = "/opt/thrift/metadataservice/simba/form1";
//	$line = '';
//    $file_handle = fopen($fileName.".xml", "r");
//    while (!feof($file_handle)) {
//         $line.=fgets($file_handle);
//    }
//    $srcMetadataset->srcMetadata = $line;
//	fclose($file_handle);

/* Test Page convert */
	$page1 = new Page();
	$page1->pageName = 'page';
	$page1->reports = array('RA'=>1,'RB'=>2);
	$page1->prompts = array('PA'=>3,'PB'=>4);
	
	$srcMetadataset = new srcMetadataset();
	$srcMetadataset->appName = 'sql';
	$srcMetadataset->cid = 2;
	$srcMetadataset->style = 'report';		/* Pls update the style for different convert and add corressponding argument to srcMetadataset*/
	$srcMetadataset->report = $report1;		
	$srcMetadataset->prompt = $prompt1;
	$srcMetadataset->page = $page1;



	$simabXML = $client->convert_metadata($srcMetadataset);
	print $simabXML;
	

} catch (TException $tx) {
  print 'TException: '.$tx->getMessage()."\n";
}

?>