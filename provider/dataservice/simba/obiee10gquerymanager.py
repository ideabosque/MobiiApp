import sys
import time
import tempfile
import xml.dom.minidom as dom
from filterElement import *
import simbaStruct

saw_NS = 'com.siebel.analytics.web/report/v1'
sawx_NS = 'com.siebel.analytics.web/expression/v1'
xsi_NS = 'http://www.w3.org/2001/XMLSchema-instance'
sawd_NS = 'com.siebel.analytics.web/dashboard/v1'

def getText(nodelist):
    rc = ""
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc = rc + node.data
    return rc

class OBIEE10gQueryManager(object):
    def __init__(self,savedFilters=None,prompts=None,columnSelector=None,drillColumn=None,requestXml=None,filters=None,simbaXml=None,resultXml=None):
        self.savedFilters = savedFilters
        self.prompts = prompts
        self.requestXml = requestXml
        self.columnSelector = columnSelector
        self.drillColumn = drillColumn
        self.resultXml = resultXml
        if savedFilters is not None:
            self.resultXml = self.generateSavedFilterResultXml(self.savedFilters,self.requestXml)
        if self.prompts is not None:
            self.filters = self.generateFilters(self.prompts,self.requestXml)
            self.resultXml = self.generateFilterResultXml(self.prompts,self.requestXml)
        if self.columnSelector is not None:
            self.resultXml = self.generateColSeletorResultXml(self.columnSelector,self.requestXml)
        if self.drillColumn is not None:
            self.resultXml = self.generateDrillColResultXml(self.drillColumn,self.requestXml)
    def get_savedFilters(self):return self.savedFilters
    def set_savedFilters(self):self.savedFilters = savedFilters
    def get_prompts(self):return self.prompts
    def set_prompts(self):self.prompts = prompts
    def get_columnSelector(self):return self.columnSelector
    def set_columnSelector(self):self.columnSelector = columnSelector
    def get_drillColumn(self):return self.drillColumn
    def set_drillColumn(self):self.drillColumn = drillColumn
    def get_requestXml(self):return self.requestXml
    def set_requestXml(self):self.requestXml = requestXml
    def get_filtersXml(self):return self.filtersXml
    def set_filtersXml(self):self.filtersXml = filtersXml
    def get_resultXml(self):return self.resultXml
    def set_resultXml(self):self.resultXml = resultXml
    def get_simbaXml(self):return self.simbaXml
    def set_simbaXml(self):self.simbaXml = simbaXml
    def generateSavedFilterResultXml(self,savedFilters,requestXml):
        reqXmlObj = dom.parseString(requestXml)
        if len(reqXmlObj.getElementsByTagNameNS(saw_NS,'filter'))>0:
            filterObj = reqXmlObj.getElementsByTagNameNS(saw_NS,'filter')[0]
            self.filterExprRecur(reqXmlObj,savedFilters)
        resultXml = reqXmlObj.toxml()
        return resultXml
    def filterExprRecur(self,reqXmlObj,savedFilters):            
        filterObj = reqXmlObj.getElementsByTagNameNS(saw_NS,'filter')[0]
        for filterExprObj in filterObj.childNodes:
            if filterExprObj.nodeType == filterExprObj.ELEMENT_NODE:
                if filterExprObj.getAttributeNS(xsi_NS,'type') == 'saw:savedFilter':
                    savedFilterPath = filterExprObj.getAttribute('path')
                    exprParentObj = filterExprObj.parentNode
                    savedFilterXml = savedFilters[savedFilterPath]
                    savedFilterXmlObj = dom.parseString(savedFilterXml)
                    self.filterExprRecur(savedFilterXmlObj,savedFilters)
                    if len(savedFilterXmlObj.getElementsByTagNameNS(saw_NS,'filter'))>0:
                        savedfilterObj = savedFilterXmlObj.getElementsByTagNameNS(saw_NS,'filter')[0]
                        for savedfilterObj_child in savedfilterObj.childNodes:
                            if srcExprObj_child.nodeType==srcExprObj_child.ELEMENT_NODE:
                                exprParentObj.appendChild(srcExprObj_child)
                    exprParentObj.removeChild(exprObj)
    def generateFilters(self,prompts,requestXml):
        filters = []
        filterExprProtectedSqlExpressions = []
        reqXmlObj = dom.parseString(requestXml)
        if len(reqXmlObj.getElementsByTagNameNS(saw_NS,'filter'))>0:
            filterObj = reqXmlObj.getElementsByTagNameNS(saw_NS,'filter')[0]
            filterExprObjs = filterObj.getElementsByTagNameNS(sawx_NS,'expr')
            for filterExprObj in filterExprObjs:
                if filterExprObj.getAttribute('protected') == 'true':
                    for filterExprChildObj in filterExprObj.childNodes:
                        if filterExprChildObj.nodeType == filterExprChildObj.ELEMENT_NODE and filterExprChildObj.getAttributeNS(xsi_NS,'type')=='sawx:sqlExpression':
                            filterExprProtectedSqlExpression = getText(filterExprChildObj.childNodes)
                            filterExprProtectedSqlExpressions.append(filterExprProtectedSqlExpression)
        for prompt in prompts:
            control = prompt['control']
            operator = prompt['operator']
            sqlExpression = prompt['formula']
            value = prompt['value']
            if sqlExpression not in filterExprProtectedSqlExpressions:
                if value != 'allChoices':
                    exprObj = expr()
                    if control in ['drop','edit','calendar']:
                        exprObj.op = operator
                        exprObj.type_ = self.filterExprType(operator)
                        exprObj = self.generateSVFilter(control,exprObj,operator,sqlExpression,value)
                    elif control == 'multi':
                        exprObj.op = operator
                        exprObj.type_ = self.filterExprType(operator)
                        exprObj = self.generateMVFilter(control,exprObj,operator,sqlExpression,value)
                    tfile = tempfile.TemporaryFile()
                    exprObj.export(tfile,0,namespace_="sawx:", namespacedef_='xmlns:saw="com.siebel.analytics.web/report/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sawx="com.siebel.analytics.web/expression/v1"')
                    exprObj.export(sys.stdout,0,namespace_="sawx:", namespacedef_='xmlns:saw="com.siebel.analytics.web/report/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sawx="com.siebel.analytics.web/expression/v1"')
                    tfile.seek(0)
                    filterXml = tfile.read()
                    filters.append(filterXml.replace('sawx:expression','sawx:expr'))
        return filters
    def filterExprType(self,operator):
        if operator in ['equal','notEqual','between','null','notNull','less','great']:
            exprType = 'sawx:comparison'
        elif operator in ['in','notIn','like','notLike','containsAll','containsAny','notContains','beginsWith','endsWith']:
            exprType = 'sawx:list'
        elif operator in ['top','bottom']:
            exprType = 'sawx:rank'
        return exprType
    def generateSVFilter(self,control,exprObj,operator,sqlExpression,value):
        if operator == 'between':
            values= value.split('---to---')
            value1 = values[0]
            value2 = values[1]
            exprSqlObj = expression()
            exprSqlObj.type_ = 'sawx:sqlExpression'
            exprSqlObj.valueOf_ = sqlExpression
            exprObj.add_expression(exprSqlObj)
            exprValue1Obj = expression()
            exprValue1Obj.type_ = self.exprValueType(control)
            exprValue1Obj.valueOf_ = value1
            exprObj.add_expression(exprValue1Obj)
            exprValue2Obj = expression()
            exprValue2Obj.type_ = self.exprValueType(control)
            exprValue2Obj.valueOf_ = value2
            exprObj.add_expression(exprValue2Obj)
        else:
            exprSqlObj = expression()
            exprSqlObj.type_ = 'sawx:sqlExpression'
            exprSqlObj.valueOf_ = sqlExpression
            exprObj.add_expression(exprSqlObj)
            exprValueObj = expression()
            exprValueObj.type_ = self.exprValueType(control)
            exprValueObj.valueOf_ = value
            exprObj.add_expression(exprValueObj)
        return exprObj
    def generateMVFilter(self,control,exprObj,operator,sqlExpression,value):
        exprSqlObj = expression()
        exprSqlObj.type_ = 'sawx:sqlExpression'
        exprSqlObj.valueOf_ = sqlExpression
        exprObj.add_expression(exprSqlObj)
        values = value.split(', ')
        for value in values:
            exprValueObj = expression()
            exprValueObj.type_ = self.exprValueType(control)
            exprValueObj.valueOf_ = value
            exprObj.add_expression(exprValueObj)
        return exprObj
    def exprValueType(self,control):
        if control == 'calendar':
            exprValueType = 'xsd:dateTime'
        else:
            exprValueType = 'xsd:string'
        return exprValueType
    def generateFilterResultXml(self,prompts,requestXml):
        srcReqXmlObj = dom.parseString(requestXml)
        if len(srcReqXmlObj.getElementsByTagNameNS(saw_NS,'filter'))>0:
            srcFilterObj = srcReqXmlObj.getElementsByTagNameNS(saw_NS,'filter')[0]
            srcExprObjs = srcFilterObj.getElementsByTagNameNS(saw_NS,'expr')
            for prompt in prompts:
                if prompt['value']=='allChoices':
                    for srcExprObj in srcExprObjs:
                        for srcExprObj_child in srcExprObj.childNodes:
                            if srcExprObj_child.nodeType==srcExprObj_child.TEXT_NODE and srcExprObj_child.nodeValue==prompt['formula']:
                                srcExprParentObj = srcExprObj.parentNode
                                srcExprGrandObj = srcExprParentObj.parentNode
                                srcExprGrandObj.removeChild(srcExprParentObj)
        resultXml = srcReqXmlObj.toxml()
        return resultXml

    def generateColSeletorResultXml(self,columnSelector,requestXml):
        columnSelectorView = columnSelector['columnSelectorView']
        selectorColId = columnSelector['selectorColumnId']
        chioceColFormula = columnSelector['chioceColumn']
##        requestXmlObj = dom.parse(requestXml)
        requestXmlObj = dom.parseString(requestXml)
        srcCriteriaObj = requestXmlObj.getElementsByTagNameNS(saw_NS,'criteria')[0]
        srcColumnObjs = srcCriteriaObj.getElementsByTagNameNS(saw_NS,'column')
        for srcColumnObj in srcColumnObjs:
            if srcColumnObj.getAttribute('columnID') == selectorColId:
                initColFormula = srcColumnObj.getAttribute('formula')
                srcColumnObj.setAttribute('formula',chioceColFormula)
        srcViewObjs = requestXmlObj.getElementsByTagNameNS(saw_NS,'view')
        for srcViewObj in srcViewObjs:
            if srcViewObj.getAttributeNS(xsi_NS,'type') == 'saw:columnSelectorView' and srcViewObj.getAttributeNS(xsi_NS,'name') == 'columnSelectorView!1':
                srcSelectorObjs = srcViewObj.getElementsByTagNameNS(saw_NS,'selector')
                for srcSelectorObj in srcSelectorObjs:
                    if srcSelectorObj.getAttribute('columnID')==selectorColId and srcSelectorObj.getAttribute('bPrompt')=='true':
                        srcChoiceObjs = srcSelectorObj.getElementsByTagNameNS(saw_NS,'choice')
                        for srcChoiceObj in srcChoiceObjs:
                            if srcChoiceObj.getAttribute('formula')==chioceColFormula:
                                srcChoiceObj.setAttribute('formula',initColFormula)
        resultXml = requestXmlObj.toxml()
        return resultXml

    def generateDrillColResultXml(self,drillColumn,requestXml):
        drillColumnID = drillColumn['columnID']
        drillFormula = drillColumn['formula']
        srcSimbaXml = drillColumn['simbaXml']
        srcReqXmlObj = dom.parse(requestXml)
        drillTgtColumns = self.getDrillTargtColumn(drillColumnID,drillFormula,srcSimbaXml)
        impl = dom.getDOMImplementation()
        doc = impl.createDocument(None, None, None)
        self.addCriteriaDrillCol(srcReqXmlObj,drillColumnID,drillTgtColumns,doc)
        self.addViewsDrillCol(srcReqXmlObj,drillColumnID,drillTgtColumns,doc)
        resultXml = srcReqXmlObj.toxml()
        return resultXml
    def addCriteriaDrillCol(self,srcReqXmlObj,drillColumnID,drillTgtColumns,doc):
        srcReqCriteriaObj = srcReqXmlObj.getElementsByTagNameNS(saw_NS,'criteria')[0]
        srcReqColumnsObj = srcReqXmlObj.getElementsByTagNameNS(saw_NS,'columns')[0]
        srcReqColumnObjs = srcReqCriteriaObj.getElementsByTagNameNS(saw_NS,'column')
        for srcReqColumnObj in srcReqColumnObjs:
            if srcReqColumnObj.getAttribute('columnID') == drillColumnID:                
                for drillTgtColumn in drillTgtColumns:
                    drillTgtColItem = doc.createElement('saw:column')
                    drillTgtColItem.setAttribute('formula','"'+drillTgtColumn['tableName']+'"."'+drillTgtColumn['columnName']+'"')
                    drillTgtColItem.setAttribute('columnID',drillTgtColumn['columnID'])
                srcReqColumnsObj.insertBefore(drillTgtColItem,srcReqColumnObj.nextSibling)    
    def addViewsDrillCol(self,srcReqXmlObj,drillColumnID,drillTgtColumns,doc):
        srcReqViewsObj = srcReqXmlObj.getElementsByTagNameNS(saw_NS,'views')[0]
        srcReqViewColObjs = srcReqViewsObj.getElementsByTagNameNS(saw_NS,'column')
        srcReqViewEdgeLayerObjs = srcReqViewsObj.getElementsByTagNameNS(saw_NS,'edgeLayer')
        for srcReqViewColObj in srcReqViewColObjs:
            if srcReqViewColObj.getAttribute('columnID')== drillColumnID:
                srcReqViewColParentObj = srcReqViewColObj.parentNode
                srcRqeViewColNextObj = srcReqViewColObj.nextSibling
                for drillTgtColumn in drillTgtColumns:
                    drillTgtViewColItem = doc.createElement('saw:column')
                    drillTgtViewColItem.setAttribute('columnID',drillTgtColumn['columnID'])
                    srcReqViewColParentObj.insertBefore(drillTgtViewColItem,srcRqeViewColNextObj)
        for srcReqViewEdgeLayerObj in srcReqViewEdgeLayerObjs:
            if srcReqViewEdgeLayerObj.getAttribute('type')== 'column' and srcReqViewEdgeLayerObj.getAttribute('columnID')== drillColumnID:
                srcReqViewEdgeLayerParentObj = srcReqViewEdgeLayerObj.parentNode
                srcRqeViewEdgeLayerNextObj = srcReqViewEdgeLayerObj.nextSibling
                for drillTgtColumn in drillTgtColumns:
                    drillTgtViewColItem = doc.createElement('saw:edgeLayer')
                    drillTgtViewColItem.setAttribute('type','column')
                    drillTgtViewColItem.setAttribute('columnID',drillTgtColumn['columnID'])
                    srcReqViewEdgeLayerParentObj.insertBefore(drillTgtViewColItem,srcRqeViewEdgeLayerNextObj)
    def getDrillTargtColumn(self,drillColumnID,drillFormula,srcSimbaXml):
        srcSimbaXmlObj = simbaStruct.parseString(srcSimbaXml)
        srcSimbaColObjs = srcSimbaXmlObj.application.report.criteria[0].columns.column
        for srcSimbaColObj in srcSimbaColObjs:
            if srcSimbaColObj.columnId == drillColumnID:
                srcDrillColObjs = srcSimbaColObj.drillColumn
                i=0
                drillTgtColumns=[]
                for srcDrillColObj in srcDrillColObjs:
                    drillTgtColumn = {}
                    drillTgtColumn['tableName'] = srcDrillColObj.tableName
                    drillTgtColumn['columnName'] = srcDrillColObj.columnName
                    seq = time.time()+i
                    drillTgtColumn['columnID'] = 'd'+str(seq)
                    drillTgtColumns.append(drillTgtColumn)
                    i+=1
        return drillTgtColumns

