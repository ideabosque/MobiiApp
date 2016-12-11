# -*- coding: utf-8 -*-
import sys
import json
import re
import base64
import string
import copy
import xml.dom.minidom as dom
import simbaStruct

class SSRSDataConvertor(object):
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
        self.rViewObj = self.getCurrentViewObjectFromRequestxml()
        if self.dataxmlRaw:
            self.dataxmlRaw = self.dataxmlRaw.replace('_x0020_','_')
            self.dataxmlDom = dom.parseString(self.dataxmlRaw)
        if self.viewType == 'Table':
            data = self.generateTableDataResults()
        elif self.viewType == 'Chart':
            data = self.generateChartDataResults()
        result['data'] = data
        result['columnInfo'] = columnInfo
        resultStr = json.dumps(result)
        #print resultStr
        return resultStr

    def generateTableDataResults(self):
        data = []
        if self.dataxmlRaw:
            replacement = self.getFactColumnsReplacement()
            if replacement:
                for k,v in replacement.items():
                    self.dataxmlRaw = self.dataxmlRaw.replace(k,v)
            self.dataxmlDom = dom.parseString(self.dataxmlRaw)
        self.dimGroups = self.getDimGroupsFromRequestxml()
        if self.dataxmlDom:
            viewObjs = self.dataxmlDom.getElementsByTagName(self.viewName)
            if viewObjs:
                viewObj = viewObjs[0]
                for node in viewObj.childNodes:
                    eleName = ''
                    if node.nodeType == node.ELEMENT_NODE and node.nodeName.find('_Collection') != -1:
                        #print node.nodeName
                        eleName = node.nodeName.replace('_Collection','')
                        #print eleName
                        nodeObjs = node.getElementsByTagName(eleName)
                        i = 0
                        for nodeObj in nodeObjs:
                            i = i + 1
                            # if i > 1: break
                            if not nodeObj.hasChildNodes():
                                #print 'no child'
                                row = {}
                                print self.dimGroups
                                row[eleName] = nodeObj.getAttribute(self.dimGroups[eleName]['attr'])
                                for factColumnName in self.factColumns.keys():
                                    row[factColumnName] = nodeObj.getAttribute(factColumnName)
                                data.append(row)
                            elif nodeObj.nodeName.find('ColumnGroup') != -1:
                                row = {}
                                row = self.loopFactColumnsHierarchy(nodeObj,row)
                                data.append(row)
                            else :
                                row = {}
                                row[eleName] = nodeObj.getAttribute(self.dimGroups[eleName]['attr'])
                                data = self.loopDimColumnsHierarchy(nodeObj,row,data)
                        if self.dimGroups[eleName]['totalTextbox']:
                            totalNodeObj = node.parentNode.getElementsByTagName(self.dimGroups[eleName]['totalTextbox'])[0]
                            #print totalNodeObj
                            row = {}
                            if totalNodeObj.hasAttribute(totalNodeObj.nodeName):
                                row[eleName] = node.getAttribute(totalNodeObj.nodeName)
                            else:
                                row[eleName] = 'Total'
                            if not totalNodeObj.hasChildNodes():
                                for factColumnName in self.factColumns.keys():
                                    row[factColumnName] = totalNodeObj.getAttribute(factColumnName)
                            else:
                                columnGroupName = totalNodeObj.childNodes[0].nodeName.replace('_Collection','')
                                nodeObjs = totalNodeObj.getElementsByTagName(columnGroupName)
                                if nodeObjs:
                                    row = self.loopFactColumnsHierarchy(nodeObj[0],row)
                                else :
                                    while totalNodeObj.hasChildNodes() and len(totalNodeObj.childNodes) > 1:
                                        totalNodeObj = totalNodeObj.childNodes[1]
                                    for factColumnName in self.factColumns.keys():
                                        if totalNodeObj.hasAttribute(factColumnName):
                                            row[factColumnName] = totalNodeObj.getAttribute(factColumnName)
                            for k in self.dimGroups.keys():
                                if not row.has_key(k):
                                    row[k] = ''
                            data.append(row)
        #for row in data:
            #print row
        #print len(data)
        return data

    def getDimGroupsFromRequestxml(self):
        dimGroups = {}
        if self.rViewObj:
            rowHierObj = self.rViewObj.getElementsByTagName('TablixRowHierarchy')[0]
            groupNodeObjs = rowHierObj.getElementsByTagName('Group')
            totalTextbox = ''
            for groupNodeObj in groupNodeObjs:
                group = {}
                name = groupNodeObj.getAttribute('Name')
                group['name'] = name
                group['totalTextbox'] = totalTextbox
                #group['value'] = None
                tablixHeaderObj = groupNodeObj.parentNode.getElementsByTagName('TablixHeader')[0]
                textboxNodeObj = tablixHeaderObj.getElementsByTagName('Textbox')[0]
                group['attr'] = textboxNodeObj.getAttribute('Name')
                if groupNodeObj.parentNode.nextSibling.nextSibling:
                    totalNodeObj = groupNodeObj.parentNode.nextSibling.nextSibling
                    tablixHeaderObj = totalNodeObj.getElementsByTagName('TablixHeader')[0]
                    textboxNodeObj = tablixHeaderObj.getElementsByTagName('Textbox')[0]
                    group['totalTextbox'] = textboxNodeObj.getAttribute('Name')
                dimGroups[name] = group
        #print 'dimGroups',dimGroups
        return dimGroups
                
        

    def loopDimColumnsHierarchy(self,parentNodeObj,row,data):
        #print parentNodeObj.nodeName
        #print parentNodeObj.childNodes
        #print row
        if not parentNodeObj.hasChildNodes():
            eleName = parentNodeObj.nodeName
            row[eleName] = parentNodeObj.getAttribute(self.dimGroups[eleName]['attr'])
            newRow = copy.copy(row)
            for factColumnName in self.factColumns.keys():
                newRow[factColumnName] = parentNodeObj.getAttribute(factColumnName)
            data.append(newRow)
        elif parentNodeObj.firstChild.nodeName.find('ColumnGroup') != -1:
            newRow = copy.copy(row)
            newRow = self.loopFactColumnsHierarchy(parentNodeObj.firstChild,newRow)
            data.append(newRow)
        else :
            for node in parentNodeObj.childNodes:
                if node.nodeType == node.ELEMENT_NODE and node.nodeName.find('_Collection') != -1:
                    eleName = node.nodeName.replace('_Collection','')
                    nodeObjs = node.getElementsByTagName(eleName)
                    for nodeObj in nodeObjs:
                        row[eleName] = nodeObj.getAttribute(self.dimGroups[eleName]['attr'])
                        data = self.loopDimColumnsHierarchy(nodeObj,row,data)
                    if self.dimGroups[eleName]['totalTextbox']:
                        totalNodeObj = node.parentNode.getElementsByTagName(self.dimGroups[eleName]['totalTextbox'])[0]
                        #print totalNodeObj
                        #row = {}
                        if totalNodeObj.hasAttribute(totalNodeObj.nodeName):
                            row[eleName] = node.getAttribute(totalNodeObj.nodeName)
                        else:
                            row[eleName] = 'Total'
                        if not totalNodeObj.hasChildNodes():
                            for factColumnName in self.factColumns.keys():
                                row[factColumnName] = totalNodeObj.getAttribute(factColumnName)
                        else:
                            columnGroupName = totalNodeObj.childNodes[0].nodeName.replace('_Collection','')
                            nodeObjs = totalNodeObj.getElementsByTagName(columnGroupName)
                            if nodeObjs:
                                row = self.loopFactColumnsHierarchy(nodeObj[0],row)
                            else :
                                while totalNodeObj.hasChildNodes() and len(totalNodeObj.childNodes) > 1:
                                    totalNodeObj = totalNodeObj.childNodes[1]
                                for factColumnName in self.factColumns.keys():
                                    if totalNodeObj.hasAttribute(factColumnName):
                                        row[factColumnName] = totalNodeObj.getAttribute(factColumnName)
                        for k in self.dimGroups.keys():
                            if not row.has_key(k):
                                row[k] = ''
                        data.append(row)
        return data

    def loopFactColumnsHierarchy(self,columnGroupNodeObj,row):
        for childNodeObj in columnGroupNodeObj.childNodes:
            if not childNodeObj.hasChildNodes():
                for factColumnName in self.factColumns.keys():
                    if childNodeObj.hasAttribute(factColumnName):
                        row[factColumnName] = childNodeObj.getAttribute(factColumnName)
                        break
            else :
                row = self.loopFactColumnsHierarchy(childNodeObj,row)
        return row
        
                

    def getCurrentViewObjectFromRequestxml(self):
        viewItemObj = None
        if self.requestxmlDom:
            reportItemsObj = self.requestxmlDom.getElementsByTagName('ReportItems')[0]
            for reportItemObj in reportItemsObj.childNodes:
                if reportItemObj.nodeType == reportItemObj.ELEMENT_NODE and reportItemObj.getAttribute('Name') == self.viewName:
                    viewItemObj = reportItemObj
                    break
        #print 'viewItemObj',viewItemObj
        return viewItemObj           


    def getFactColumnsReplacement(self):
        replacement ={}
        realFactColumns = []
        factColumns = {}
        if self.rViewObj:
            tablixRowObjs = self.rViewObj.getElementsByTagName('TablixRow')
            for realTablixRowObj in tablixRowObjs:
                if realTablixRowObj.getElementsByTagName('Textbox')[0].getAttribute('Name').find('Textbox') == -1: ## Bugs here, will fix later
                    break
            textboxObjs = realTablixRowObj.getElementsByTagName('Textbox')
            for textboxObj in textboxObjs:
                name = textboxObj.getAttribute('Name')
                print name
                realFactColumns.append(name)
                factColumns[name] = {}
                factColumns[name]['name'] = name
            for tablixRowObj in tablixRowObjs:
                if tablixRowObj != realTablixRowObj:
                    textboxObjs = tablixRowObj.getElementsByTagName('Textbox')
                    i = 0
                    for textboxObj in textboxObjs:
                        replacement[textboxObj.getAttribute('Name')] = realFactColumns[i]
                        i = i + 1
        self.factColumns = factColumns
        #print 'FactColumns:',factColumns
        #print 'replacement',replacement
        return replacement

    def generateChartDataResults(self):
        data = []
        if self.dataxmlDom:
            dViewObjs = self.dataxmlDom.getElementsByTagName(self.viewName)
            if dViewObjs:
                dViewObj = dViewObjs[0]
                #print dViewObj
                #print dViewObj.childNodes
                chartInfo = self.getChartInfo()
                categoryGroupObjs = dViewObj.getElementsByTagName(chartInfo['category']['groupName'])
                for categoryGroupObj in categoryGroupObjs:
                    row = {}
                    row[chartInfo['category']['columnName']] = categoryGroupObj.getAttribute('Label')
                    valueObj = categoryGroupObj.getElementsByTagName('Value')[0]
                    row[chartInfo['measure']['columnName']] = valueObj.getAttribute('Y')
                    data.append(row)
                    #print row
        return data

    def getChartInfo(self):
        chartInfo = {}
        if self.rViewObj:
            categoryHierObj = self.rViewObj.getElementsByTagName('ChartCategoryHierarchy')[0]
            categoryGroupObj = categoryHierObj.getElementsByTagName('Group')[0]
            groupExpressionObj = categoryGroupObj.getElementsByTagName('GroupExpression')[0]
            groupName = categoryGroupObj.getAttribute('Name')
            groupExpr = groupExpressionObj.firstChild.data
            categoryName = groupExpr.replace('=Fields!','').replace('.Value','')
            chartInfo['category'] = {}
            chartInfo['category']['groupName'] = groupName
            chartInfo['category']['columnName'] = categoryName
            #chartInfo['category'][groupName] = groupExpr
            chartDataObj = self.rViewObj.getElementsByTagName('ChartData')[0]
            chartSeriesObj = chartDataObj.getElementsByTagName('ChartSeries')[0]
            chartInfo['measure'] = {}
            measureName = chartSeriesObj.getAttribute('Name')
            chartInfo['measure']['columnName'] = measureName
        return chartInfo
        
