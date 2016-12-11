#!/usr/bin/env python

import sys
sys.path.append('../')

import ContentService
from ttypes import *
from contentdaemon import ContentServiceHandler

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

		

handler = ContentServiceHandler()
processor = ContentService.Processor(handler)
transport = TSocket.TServerSocket('localhost',9092)
tfactory = TTransport.TBufferedTransportFactory()
pfactory = TBinaryProtocol.TBinaryProtocolFactory()

server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

print 'Starting the Content Service server...'
server.serve()
print 'done.'
