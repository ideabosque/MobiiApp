# -*- coding: utf-8 -*-
import sys
import json
import re
import base64
import string
import copy
import xml.dom.minidom as dom
import simbaStruct

saw_NS = 'com.siebel.analytics.web/report/v1'
sawx_NS = 'com.siebel.analytics.web/expression/v1'
xsi_NS = 'http://www.w3.org/2001/XMLSchema-instance'

class OBIEE10gDataConvertor(object):
    def __init__(self,requestxmlRaw=None,simbaxmlRaw=None,viewName=None,viewType=None,dataxmlRaw=None):
        self.requestxmlRaw = requestxmlRaw
        self.simbaxmlRaw = simbaxmlRaw
        self.viewName = viewName
        self.viewType = viewType
        self.dataxmlRaw = dataxmlRaw
    def get_requestxmlRaw(self):return self.requestxmlRaw
    def set_requestxmlRaw(self,requestxmlRaw):self.requestxmlRaw = requestxmlRaw
    def get_simbaxmlRaw(self):return self.simbaxmlRaw
    def set_simbaxmlRaw(self,simbaxmlRaw):self.simbaxmlRaw = simbaxmlRaw
    def get_viewName(self):return self.viewName
    def set_viewName(self,viewName):self.viewName = viewName
    def get_viewType(self):return self.viewType
    def set_viewType(self,viewType):self.viewType = viewType
    def get_dataxmlRaw(self):return self.dataxmlRaw
    def set_dataxmlRaw(self,dataxmlRaw):self.dataxmlRaw = dataxmlRaw
    def generateResults(self):
        result = {}
        data = []
        columnInfo = {}
        if self.requestxmlRaw:
            self.requestxmlDom = dom.parseString(self.requestxmlRaw)
        if self.simbaxmlRaw:
            self.simbaxmlDom = simbaStruct.parseString(self.simbaxmlRaw)
        if self.dataxmlRaw:
            self.dataxmlDom = dom.parseString(self.dataxmlRaw)
        #print self.dataxmlRaw
        result['data'] = self.getDataArrayFromDataxml()
        result['columnInfo'] = self.getColumnInfoFromDataxml()
        resultStr = json.dumps(result)
        #self.getColumnIdsFromRequestxml()
        #self.getDataArrayFromDataxml()
        #self.getDataArrayFromDataxml()
        #self.getColumnInfoFromDataxml()
        return resultStr

    def getColumnIdsFromSimbaxml(self):
        columnIds = []
        if self.simbaxmlDom:
            criteriaColumnObjs = self.simbaxmlDom.application.report.criteria[0].columns.column
            for criteriaColumnObj in criteriaColumnObjs :
                columnId = {}
                columnId['columnId'] = criteriaColumnObj.columnId
                columnId['formula'] = criteriaColumnObj.formula
                if criteriaColumnObj.interaction and criteriaColumnObj.interaction == 'navigate':
                    navigateObj = criteriaColumnObj.navigation[0]
                    columnId['drillthrough_cid'] = navigateObj.cid
                dataFormatObj = criteriaColumnObj.dataFormat
                if dataFormatObj:
                    dataFormat = {}
                    if dataFormatObj.type_:
                        dataFormat['type'] = dataFormatObj.type_
                    if dataFormatObj.commas:
                        dataFormat['commas'] = dataFormatObj.commas
                    if dataFormatObj.negativeType:
                        dataFormat['negativeType'] = dataFormatObj.negativeType
                    if dataFormatObj.minDigits:
                        dataFormat['minDigits'] = dataFormatObj.minDigits
                    if dataFormatObj.maxDigits:
                        dataFormat['maxDigits'] = dataFormatObj.maxDigits
                    if dataFormat:
                        columnId['dataFormat'] = dataFormat
                columnIds.append(columnId)
        # print columnIds
        return columnIds
    
    def getColumnIdsFromRequestxml(self):
        columnIds = []
        simbaColumnIds = self.getColumnIdsFromSimbaxml()
        if self.requestxmlDom:
            criteriaObjs = self.requestxmlDom.getElementsByTagNameNS(saw_NS,'criteria')
            if criteriaObjs:
                criteriaObj = criteriaObjs[0]
                for columnObj in criteriaObj.getElementsByTagNameNS(saw_NS,'column'):
                    columnId = {}
                    columnID = columnObj.getAttribute('columnID')
                    columnId['columnId'] = columnID
                    columnId['formula'] = columnObj.getAttribute('formula')
                    colIds = columnID.split(',')
                    for simbaColumnId in simbaColumnIds:
                        if simbaColumnId['columnId'] == colIds[0]:
                            if simbaColumnId.has_key('drillthrough_cid'):
                                columnId['drillthrough_cid'] = simbaColumnId['drillthrough_cid']
                            if simbaColumnId.has_key('dataFormat'):
                                columnId['dataFormat'] = simbaColumnId['dataFormat']
                            break
                    columnIds.append(columnId)
        #print columnIds
        return columnIds

    def getColumnInfoFromSimbaxml(self):
        columnInfo = {}
        if self.simbaxmlDom:
            criteriaColumnObjs = self.simbaxmlDom.application.report.criteria[0].columns.column
            for criteriaColumnObj in criteriaColumnObjs :
                columnId = {}
                formula = criteriaColumnObj.formula
                columnId['columnId'] = criteriaColumnObj.columnId
                columnId['formula'] = formula
                if criteriaColumnObj.interaction and criteriaColumnObj.interaction == 'navigate':
                    navigateObj = criteriaColumnObj.navigation[0]
                    columnId['drillthrough_cid'] = navigateObj.cid
                dataFormatObj = criteriaColumnObj.dataFormat
                if dataFormatObj:
                    dataFormat = {}
                    if dataFormatObj.type_:
                        dataFormat['type'] = dataFormatObj.type_
                    if dataFormatObj.commas:
                        dataFormat['commas'] = dataFormatObj.commas
                    if dataFormatObj.negativeType:
                        dataFormat['negativeType'] = dataFormatObj.negativeType
                    if dataFormatObj.minDigits:
                        dataFormat['minDigits'] = dataFormatObj.minDigits
                    if dataFormatObj.maxDigits:
                        dataFormat['maxDigits'] = dataFormatObj.maxDigits
                    if dataFormat:
                        columnId['dataFormat'] = dataFormat
                columnHeadingObj = criteriaColumnObj.columnHeading
                if columnHeadingObj:
                    if columnHeadingObj.captionText:
                        captionText = columnHeadingObj.captionText
                        captionText = captionText.replace('_',' ')
                        columnId['captionText'] = captionText
                columnId['dformula'] = formula
                columnId['encodedformula'] = base64.encodestring(formula).replace('=','-').replace('\n','')
                columnId['sformula'] = formula
                columnId['dataType'] = 'string'
                columnId['aggrRule'] = 'none'
                columnId['tableHeading'] = ''
                columnInfo[criteriaColumnObj.columnId] = columnId
        #print columnInfo
        return columnInfo

    def getDataArrayFromDataxml(self):
        data = []
        if self.requestxmlDom and self.simbaxmlDom:
            columnIds = self.getColumnIdsFromRequestxml()
        elif self.simbaxmlDom:
            columnIds = self.getColumnIdsFromSimbaxml()
        else :
            columnIds = []
        if self.dataxmlDom and columnIds:
            columns = {}
            elementObjs = self.dataxmlDom.getElementsByTagName('xsd:element')
            i = 0
            for elementObj in elementObjs:
                columns[elementObj.getAttribute('name')] = columnIds[i]['columnId']
                i = i + 1
            rowObjs = self.dataxmlDom.getElementsByTagName('Row')
            for rowObj in rowObjs:
                row = {}
                for rowChildObj in rowObj.childNodes:
                    if rowChildObj.nodeType == rowChildObj.ELEMENT_NODE and rowChildObj.firstChild is not None:
                        row[rowChildObj.nodeName] = rowChildObj.firstChild.data
                #print row
                for k,v in columns.items():
                    if row.has_key(k):
                        row[v] = copy.copy(row[k])
                        del row[k]
                    else:
                        row[v] = ''
                #print row
                for k,v in row.items():
                    if v != '':
                        data.append(row)
                        break
                #data.append(row)
        #print data
        return data

    def getColumnInfoFromDataxml(self):
        columnInfo = {}
        if self.requestxmlDom and self.simbaxmlDom:
            columnIds = self.getColumnIdsFromRequestxml()
        elif self.simbaxmlDom:
            columnIds = self.getColumnIdsFromSimbaxml()
        else :
            columnIds = []
        if self.dataxmlDom and columnIds:
            i = 0
            elementObjs = self.dataxmlDom.getElementsByTagName('xsd:element')
            for elementObj in elementObjs:
                name = columnIds[i]['columnId']
                columnInfo[name] = {}
                dataType = elementObj.getAttribute('saw-sql:type')
                formula = elementObj.getAttribute('saw-sql:displayFormula')
                aggRule = elementObj.getAttribute('saw-sql:aggregationRule')
                tableHeading = elementObj.getAttribute('saw-sql:tableHeading')
                columnHeading = elementObj.getAttribute('saw-sql:columnHeading')
                if dataType == 'char':
                    dataType = 'string'
                elif dataType == 'integer':
                    dataType = 'int'
                elif dataType == 'float':
                    dataType = 'float'
                else :
                    dataType = 'string'
                columnInfo[name]['dformula'] = formula
                columnInfo[name]['encodedformula'] = base64.encodestring(columnIds[i]['formula']).replace('=','-').replace('\n','')
                columnInfo[name]['sformula'] = columnIds[i]['formula']
                columnInfo[name]['dataType'] = dataType
                columnInfo[name]['aggrRule'] = aggRule
                columnInfo[name]['tableHeading'] = tableHeading
                columnInfo[name]['columnHeading'] = columnHeading
                if columnIds[i].has_key('drillthrough_cid'):
                    columnInfo[name]['drillthrough_cid'] = columnIds[i]['drillthrough_cid']
                if columnIds[i].has_key('dataFormat'):
                    columnInfo[name]['dataFormat'] = columnIds[i]['dataFormat']
                i = i + 1
        #print columnInfo
        return columnInfo
