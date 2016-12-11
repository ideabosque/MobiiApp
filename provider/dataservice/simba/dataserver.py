#!/usr/bin/env python

import sys
sys.path.append('../')

import DataService
from ttypes import *
from querymanager import QueryManager
from datadaemon import DataServiceHandler

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

		

handler = DataServiceHandler()
processor = DataService.Processor(handler)
transport = TSocket.TServerSocket('localhost',9091)
tfactory = TTransport.TBufferedTransportFactory()
pfactory = TBinaryProtocol.TBinaryProtocolFactory()

server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

print 'Starting the server...'
server.serve()
print 'done.'
