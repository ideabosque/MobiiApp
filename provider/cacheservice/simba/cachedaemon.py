#!/usr/bin/env python

import sys, time, syslog, traceback

from simba.daemon import Daemon
from simba.adaptors import OracleAdaptor

from simba import CacheService
from simba.ttypes import *


from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer


def formatExceptionInfo(maxTBlevel=5):
        cla, exc, trbk = sys.exc_info()
        excName = cla.__name__
        try:
                excArgs = exc.__dict__["args"]
        except KeyError:
                excArgs = "<no args>"
        excTb = traceback.format_tb(trbk, maxTBlevel)

        syslog.syslog(syslog.LOG_ERR, ('Exception: %s' % excName))

        for excArg in excArgs:
                syslog.syslog(syslog.LOG_ERR, ('Error Message: %s' % excArg))

        for trace in excTb:
                syslog.syslog(syslog.LOG_ERR, trace)

        return (excName, excArgs, excTb)


class CacheServiceHandler:
        def __init__(self, uid, password, tnsname):
                self.oracleAdaptor = OracleAdaptor(uid, password, tnsname)
                self.log = {}

        def ping(self):
                print 'ping()'

        def insert(self, insertColumns, table):
                id = self.oracleAdaptor.insert(insertColumns, table)
                return Str(id)

        def update(self, updateColumns, table):
                self.oracleAdaptor.update(updateColumns, table)

        def selectById(self, idColumn, table):
                print idColumn
                resultDict = self.oracleAdaptor.selectById(idColumn, table)
                print resultDict
                return resultDict

        def __del__(self):
                del self.oracleAdaptor


class CacheDaemon(Daemon):
	def run(self):
#		while True:
#			time.sleep(1)
		
		try:
			handler = CacheServiceHandler('VDW','VDW','O0x32')
			processor = CacheService.Processor(handler)
			transport = TSocket.TServerSocket('localhost', 9090)
			tfactory = TTransport.TBufferedTransportFactory()
			pfactory = TBinaryProtocol.TBinaryProtocolFactory()

			server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

			# You could do one of these for a multithreaded server
			#server = TServer.TThreadedServer(processor, transport, tfactory, pfactory)
			#server = TServer.TThreadPoolServer(processor, transport, tfactory, pfactory)
			
			server.serve()
		except Exception, e:
			formatExceptionInfo()



