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
$GLOBALS['THRIFT_ROOT'] = '/home/bohung_wang/thrift-0.6.0/lib/php/src';

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
error_reporting(E_NONE);
require_once 'CacheService.php';
require_once 'CacheService_types.php';

error_reporting(E_ALL);

try {
  if (array_search('--http', $argv)) {
    $socket = new THttpClient('localhost', 8080, '/php/PhpServer.php');
  } else {
    $socket = new TSocket('localhost', 9090);
  }
  $transport = new TBufferedTransport($socket, 1024, 1024);
  $protocol = new TBinaryProtocol($transport);
  $client = new CacheServiceClient($protocol);

  $transport->open();

  $client->ping();
  print "ping()\n";


#  $insertColumns = array();
#  array_push($insertColumns, array("key"=>"DASHBOARD_ID","type"=>"id","value"=>"DASHBOARD_ID"));
#  array_push($insertColumns, array("key"=>"DASHBOARD_NAME","type"=>"variable","value"=>"XXXYYYY"));
#  array_push($insertColumns, array("key"=>"CREATED_DATE","type"=>"funct","value"=>"SYSDATE"));
#  array_push($insertColumns, array("key"=>"CREATED_PERSON","type"=>"variable","value"=>"SYSTEM"));
#  array_push($insertColumns, array("key"=>"CHANGED_DATE","type"=>"funct","value"=>"SYSDATE"));
#  array_push($insertColumns, array("key"=>"CHANGED_PERSON","type"=>"variable","value"=>"SYSTEM"));

#  $dashboardId = $client->insert($insertColumns, "DASHBOARDS");

#  echo "Dashboard: $dashboardId inserted\n"; 

  $updateColumns = array();
  array_push($updateColumns, array("key"=>"DASHBOARD_ID","type"=>"id","value"=>"45"));
  array_push($updateColumns, array("key"=>"DASHBOARD_NAME","type"=>"variable","value"=>"XXXYYYY1111"));
  array_push($updateColumns, array("key"=>"CREATED_DATE","type"=>"funct","value"=>"SYSDATE"));
  array_push($updateColumns, array("key"=>"CREATED_PERSON","type"=>"variable","value"=>"SYSTEM"));
  array_push($updateColumns, array("key"=>"CHANGED_DATE","type"=>"funct","value"=>"SYSDATE"));
  array_push($updateColumns, array("key"=>"CHANGED_PERSON","type"=>"variable","value"=>"SYSTEM"));

  $client->update($updateColumns, "DASHBOARDS");
 
  $idColumn = array("key"=>"DASHBOARD_ID", "type"=>"id", "value"=>"45");
  $resultDict = $client->selectById($idColumn, "DASHBOARDS");
  var_dump($resultDict);
  
  $transport->close();

} catch (TException $tx) {
  print 'TException: '.$tx->getMessage()."\n";
}

?>
