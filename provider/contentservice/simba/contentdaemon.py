#!/usr/bin/env python

import sys, time, syslog, traceback

from daemon import Daemon
from contentmanager import PromptsInfoManager
from contentmanager import ReportInfoManager

import ContentService
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


class ContentServiceHandler:
    def __init__(self):
        self.promptsInfoManagerObj = PromptsInfoManager()
        self.reportInfoManagerObj = ReportInfoManager()
##        self.log = {}

    def ping(self):
        print 'ping()'
            
    def get_prompts_info(self,srcPromptsSet):
        # print 'prompts----------------------------'
        self.promptsInfoManagerObj.prompts = srcPromptsSet.prompts
        self.promptsInfoManagerObj.filters = srcPromptsSet.filters
        resultsObj = self.promptsInfoManagerObj.generateResults()
        return resultsObj

    def get_report_info(self,srcReportSet):
        # print 'report----------------------------'
        self.reportInfoManagerObj.controller = srcReportSet.controller
        self.reportInfoManagerObj.simbaxmlRaw = srcReportSet.simbaxmlRaw
        self.reportInfoManagerObj.requestxmlRaw = srcReportSet.requestxmlRaw
        # self.reportInfoManagerObj.filterxmls = srcReportSet.filterxmls
        # self.reportInfoManagerObj.variables = srcReportSet.variables
        # print self.reportInfoManagerObj.controller
        # print self.reportInfoManagerObj.simbaxmlRaw
        # print self.reportInfoManagerObj.requestxmlRaw
        # print self.reportInfoManagerObj.filterxmls
        # print self.reportInfoManagerObj.variables
    
        resultsObj = self.reportInfoManagerObj.generateResults()
        return resultsObj

    def __del__(self):
        del self.promptsInfoManagerObj
        del self.reportInfoManagerObj

class ContentDaemon(Daemon):
    def run(self):
        #while True:
        #    time.sleep(1)
	    try:
        	handler = ContentServiceHandler()
       		processor = ContentService.Processor(handler)
        	transport = TSocket.TServerSocket('localhost', 9092)
        	tfactory = TTransport.TBufferedTransportFactory()
        	pfactory = TBinaryProtocol.TBinaryProtocolFactory()

        	server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

        	# You could do one of these for a multithreaded server
        	#server = TServer.TThreadedServer(processor, transport, tfactory, pfactory)
        	#server = TServer.TThreadPoolServer(processor, transport, tfactory, pfactory)

        	server.serve()
	    except Exception, e:
		    formatExceptionInfo()

