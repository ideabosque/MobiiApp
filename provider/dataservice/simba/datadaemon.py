#!/usr/bin/env python

import sys, time, syslog, traceback

from daemon import Daemon
from querymanager import QueryManager
from dataconvertor import DataConvertor

import DataService
from ttypes import *


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


class DataServiceHandler:
    def __init__(self):
        self.queryManagerObj = QueryManager()
        self.dataConvertorObj = DataConvertor()
##        self.log = {}

    def ping(self):
        print 'ping()'
            
    def get_filters(self,srcQueryset):
        if srcQueryset.appName == None:
            raise InvalidValueException(1,'no application name')
        else:
            self.queryManagerObj.appName = srcQueryset.appName
        if srcQueryset.srcXml == None:
            raise InvalidValueException(2,'no source request XML')
        else:
            self.queryManagerObj.requestXml = srcQueryset.srcXml
        self.queryManagerObj.prompts = srcQueryset.prompts
        resultsObj = self.queryManagerObj.generateResults()
        filters = resultsObj.filters
        return filters   

    def get_requestXml(self,srcQueryset):
        if srcQueryset.appName == None:
            raise InvalidValueException(1,'no application name')
        else:
            self.queryManagerObj.appName = srcQueryset.appName
        if srcQueryset.srcXml == None:
            raise InvalidValueException(2,'no source request XML')
        else:
            self.queryManagerObj.requestXml = srcQueryset.srcXml
        self.queryManagerObj.savedFilters = srcQueryset.savedFilters
        self.queryManagerObj.prompts = srcQueryset.prompts
        self.queryManagerObj.columnSelector = srcQueryset.columnSelector
        self.queryManagerObj.drillColumn = srcQueryset.drillColumn
        self.queryManagerObj.viewName = srcQueryset.viewName
        self.queryManagerObj.viewType = srcQueryset.viewType
        self.queryManagerObj.sql = srcQueryset.sql
        self.queryManagerObj.resultXml = srcQueryset.resultXml
        resultsObj = self.queryManagerObj.generateResults()
        resultXml = resultsObj.resultXml
        return resultXml

    def get_sqlResultSimba(self,srcQueryset):
        if srcQueryset.appName == None:
            raise InvalidValueException(1,'no application name')
        else:
            self.queryManagerObj.appName = srcQueryset.appName
        if srcQueryset.srcXml == None:
            raise InvalidValueException(2,'no source request XML')
        else:
            self.queryManagerObj.simbaXml = srcQueryset.srcXml
        self.queryManagerObj.prompts = srcQueryset.prompts
        resultsObj = self.queryManagerObj.generateResults()
        resultSimbaXml= resultsObj.simbaXml
        return resultSimbaXml

    def convert_data(self,srcDataset):
        if srcDataset.appName == None:
            raise InvalidValueException(1,'no application name')
        else:
            self.dataConvertorObj.appName = srcDataset.appName
        self.dataConvertorObj.requestxmlRaw = srcDataset.requestxmlRaw
        self.dataConvertorObj.simbaxmlRaw = srcDataset.simbaxmlRaw
        self.dataConvertorObj.viewName = srcDataset.viewName
        self.dataConvertorObj.viewType = srcDataset.viewType
        self.dataConvertorObj.dataxmlRaw = srcDataset.dataxmlRaw
        result = self.dataConvertorObj.generateResults()
        return result

    def __del__(self):
        del self.queryManagerObj
        del self.dataConvertorObj

class DataDaemon(Daemon):
    def run(self):
        #while True:
        #    time.sleep(1)
        try:
            handler = DataServiceHandler()
            processor = DataService.Processor(handler)
            transport = TSocket.TServerSocket('localhost', 9091)
            tfactory = TTransport.TBufferedTransportFactory()
            pfactory = TBinaryProtocol.TBinaryProtocolFactory()

            server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

            # You could do one of these for a multithreaded server
            #server = TServer.TThreadedServer(processor, transport, tfactory, pfactory)
            #server = TServer.TThreadPoolServer(processor, transport, tfactory, pfactory)
            
            server.serve()
        except Exception, e:
            formatExceptionInfo()

