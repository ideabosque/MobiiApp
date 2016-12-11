#!/usr/bin/env python

import sys, time, syslog, traceback

from simba.daemon import Daemon
from simba.metadatamanager import MetadataManager
from simba.metadataconverter import MetadataConverter
from simba.metadatarenew import MetadataRenew

from simba import MetadataService
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


class MetadataServiceHandler:
    def __init__(self):
        self.metadataManager = MetadataManager()
        self.metaConverterObj = MetadataConverter()
        self.metadataRenewObj = MetadataRenew()
        self.log = {}

    def ping(self):
        print 'ping()'

    def getTokens(self):
        return self.metadataManager.getTokens()

    def delToken(self, paths):
        self.metadataManager.delToken(paths) 

    def saveMetadata(self,path,uid):
        return self.metadataManager.saveMetadata(path,uid)
            
    def getSchemas(self,path):
        schemaObjs = self.metadataManager.getSchemas(path)
        schemas = []
        for schemaObj in schemaObjs:
            schema= Schema(schemaObj.schemaName,schemaObj.schemaDesc)
            schemas.append(schema)
        return schemas

    def getColumns(self,schemaName,path):
        columns = []
        columnObjs = self.metadataManager.getColumns(schemaName,path)
        for columnObj in columnObjs:
            dimColumns = []
            for dimColumnObj in columnObj.dimColumn:
                dimColumn = DimColumn(dimColumnObj.columnName)
                dimColumns.append(dimColumn)
                
            drillColumns = []
            for drillColumnObj in columnObj.drillColumn:
                drillColumn = DrillColumn(drillColumnObj.columnName,drillColumnObj.weight)
                drillColumns.append(drillColumn)

            tables = []
            for tableObj in columnObj.table:
                table = Table(tableObj.tableName,tableObj.position)
                tables.append(table)
                
            column = Column(columnObj.columnName, columnObj.columnAlias, columnObj.columnDesc, columnObj.nullable, columnObj.dataType, columnObj.aggregateable, columnObj.aggrRule, drillColumns, tables, dimColumns)
            columns.append(column)
        return columns

    def setSchema(self,path,schema,uid):
        return self.metadataManager.setSchema(path,schema,uid)

    def setColumn(self, schemaName, column, path, uid):
        return self.metadataManager.setColumn(schemaName, column, path, uid)

    def addSchema(self,path,schema,uid):
        return self.metadataManager.addSchema(path,schema,uid)

    def addColumn(self, schemaName, column, path, uid):
        return self.metadataManager.addColumn(schemaName, column, path, uid)

    def delSchema(self,path,schema,uid):
        return self.metadataManager.delSchema(path,schema,uid)

    def delColumn(self, schemaName, column, path, uid):
        return self.metadataManager.delColumn(schemaName, column, path, uid)

    def editMetadata(self,srcMetadataset):
        return self.metadataRenewObj.renewMetadata(srcMetadataset.updateInfo,srcMetadataset.srcMetadata)

    def convert_metadata(self,srcMetadataset):
##        if srcMetadataset.cid == None:
##            raise InvalidValueException(1,'no controller Id exception')
##        else:
##            self.metaConverterObj.cid = srcMetadataset.cid
##        if srcMetadataset.style == None:
##            raise InvalidValueException(2,'no Type exception')
##        else:
##            self.metaConverterObj.style = srcMetadataset.style
##        if srcMetadataset.appName == None:
##            raise InvalidValueException(3,'no App Name exception')
##        else:
##            self.metaConverterObj.appName = srcMetadataset.appName
##        if srcMetadataset.srcMetadata == None:
##            raise InvalidValueException(4,'no srcMetadata exception')
##        else:
##            self.metaConverterObj.srcMetadata = srcMetadataset.srcMetadata
        self.metaConverterObj.cid = srcMetadataset.cid
        self.metaConverterObj.style = srcMetadataset.style
        self.metaConverterObj.appName = srcMetadataset.appName
        self.metaConverterObj.srcMetadata = srcMetadataset.srcMetadata
        self.metaConverterObj.subs = srcMetadataset.subs
        self.metaConverterObj.savedFilters = srcMetadataset.savedFilters
        self.metaConverterObj.report = srcMetadataset.report
        self.metaConverterObj.prompt = srcMetadataset.prompt
        self.metaConverterObj.page = srcMetadataset.page
        self.metaConverterObj.generateSimba()
        return self.metaConverterObj.simba

    def __del__(self):
        del self.metadataManager
        del self.metaConverterObj
        del self.metadataRenewObj

class MetadataDaemon(Daemon):
    def run(self):
        #while True:
        #    time.sleep(1)
    
        try:
            handler = MetadataServiceHandler()
            processor = MetadataService.Processor(handler)
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
