import sys
import json
import re
import base64
import string
import xml.dom.minidom as dom
import simbaStruct

saw_NS = 'com.siebel.analytics.web/report/v1'
sawx_NS = 'com.siebel.analytics.web/expression/v1'
xsi_NS = 'http://www.w3.org/2001/XMLSchema-instance'
sawd_NS = 'com.siebel.analytics.web/dashboard/v1'

class PromptsInfoManager(object):
    def __init__(self,prompts=None,filters=None):
        self.prompts = prompts
        self.filters = filters
    def get_prompts(self):return self.prompts
    def set_prompts(self):self.prompts = prompts
    def get_filters(self):return self.filters
    def set_filters(self):self.filters = filters
    def generateResults(self):
        if(self.filters):
            filters = json.loads(self.filters)
        else :
            filters = {}
        output = {}
        defaultFilters = []
        variables = []
        for pCid, pSimbaXmlRaw in self.prompts.items():
            output[pCid] = {}
            output[pCid]['promptFilters'] = []
            pSimbaXmlObj = simbaStruct.parseString(pSimbaXmlRaw)
            pfObjs = pSimbaXmlObj.application.prompt.promptFilter
            controller = pSimbaXmlObj.application.appName
            for pfObj in pfObjs:
                pf = {}
                pf['control'] = pfObj.control
                pf['defaultX'] = pfObj.default
                pf['constrainChoices'] = pfObj.constrainChoices
                pf['includeAllChoices'] = pfObj.includeAllChoices
                pf['values'] = pfObj.values
                pf['formula'] = pfObj.formula
                pf['op'] = pfObj.op
                pf['setVariableValue'] = pfObj.setVariableValue
                pf['setVariable'] = pfObj.setVariable
                # pf['caption'] = (pfObj.caption == '') and self.getCaptionFromFormula(pf['formula']) or pfObj.caption
                pf['caption'] = self.getPromptFilterCaption(pfObj.caption,pfObj.formula,pfObj.op)
                pf['name'] = base64.encodestring(pf['formula']).replace('=','-').replace('\n','')
                pf = self.getPromptFilterDefaultValue(pfObj,filters,pf,controller)
                
                defaultFilter = self.getDefaultFilter(pf)
                if defaultFilter:
                    defaultFilter['promptCid'] = pCid
                    defaultFilters.append(defaultFilter)
                
                variable = self.getVariable(pf)
                if variable:
                    variables.append(variable)
                
                output[pCid]['promptFilters'].append(pf)
        output = self.handleConstrainFilter(output)
        output['defaultFilters'] = defaultFilters
        output['variables'] = variables
        return json.dumps(output)

    def handleConstrainFilter(self,prompts):
        for pCid, prompt in prompts.items():
            promptFilters = prompt['promptFilters']
            i = 0
            for pf in promptFilters:
                name = pf['name']
                formula = pf['formula']
                constrainChoices = pf['constrainChoices']
                values = pf['values']
                if constrainChoices != '':
                    constrained = self.getConstrainedPromptFilter(constrainChoices,promptFilters)
                    if constrained is not False:
                        constrainedFilter = promptFilters[constrained]
                        #if constrainedFilter.has_Key('constrained'):
			if 'constrained' in constrainedFilter:
                            constrainedFilter['constrained'].append(name)
                        else :
                            constrainedFilter['constrained'] = [name]
                        promptFilters[constrained] = constrainedFilter
                        if constrainedFilter['defaultValue'] != '':
                            if constrainedFilter['control'] == 'multi':
                                if constrainedFilter['defaultValue'].find("', '") == -1:
                                    constrainedDefaultValue = "('" + constrainedFilter['defaultValue'].replace(', ',"', '") + "')"
                                else :
                                    constrainedDefaultValue = "('" + constrainedFilter['defaultValue'] + "')"
                                values += ' WHERE ' + constrainChoices + ' IN ' + constrainedDefaultValue
                            else :
                                values += ' WHERE ' + constrainChoices + " = '" + constrainedFilter['defaultValue'] + "'"
                            pf['values'] = values
                promptFilters[i] = pf
                i += 1
            prompt['promptFilters'] = promptFilters
            prompts[pCid] = prompt
        return prompts

    def getConstrainedPromptFilter(self,formula,promptFilters):
        i = 0
        for pf in promptFilters:
            if pf['formula'] == formula:
                return i
            i += 1
        return False

    def getPromptFilterCaption(self,caption,formula,op):
        caption = (caption == '') and self.getCaptionFromFormula(formula) or caption
        if op == 'between':
            return caption
        if op == 'in':
            return caption + ' (IN) '
        if op == 'notIn':
            return caption + ' (NOT IN) '
        if op == 'less':
            return caption + ' (<) '
        if op == 'greater':
            return caption + ' (>) '
        if op == 'lessOrEqual':
            return caption + ' (<=) '
        if op == 'greaterOrEqual':
            return caption + ' (>=) '
        if op == 'equal':
            return caption + ' (=) '
        if op == 'containsAny':
            return caption + ' (containsAny) '
        if op == 'beginsWith':
            return caption + ' (beginsWith) '
        if op == 'endsWith':
            return caption + ' (endsWith) '
        if op == 'like':
            return caption + ' (like) '
        if op == 'notLike':
            return caption + ' (notLike) '
        return caption + ' (=) '

    def getCaptionFromFormula(self,formula):
        p = re.compile(r'\.')
        li = p.split(formula)
        return li[-1]
        
    def getPromptFilterDefaultValue(self,pfObj,filters,pf,controller):
        name1 = pf['name'] + '_1'
        name2 = pf['name'] + '_2'
        pf['defaultValue'] = pfObj.defaultValue
        if filters.has_key(name1):
            pf['defaultValue'] = filters[name1]
        elif filters.has_key(pf['name']):
            pf['defaultValue'] = filters[pf['name']]
        if filters.has_key(name2):
            pf['defaultValue2'] = filters[name2]
        elif pfObj.defaultValue2:
            # print 'defaultValue2'
            pf['defaultValue2'] = pfObj.defaultValue2
        pf['defaultValue'] = self.getCalendarDefaultValue(pf['defaultValue'],pf,controller)
        if pf.has_key('defaultValue2'):
            pf['defaultValue2'] = self.getCalendarDefaultValue(pf['defaultValue2'],pf,controller)
        return pf
    
    def getCalendarDefaultValue(self,value,pf,controller):
        if pf['defaultX'] == 'sqlExpression':
            return value
        if pf['control'] == 'calendar':
            if controller == 'obiee10g':
                value = value.replace(' ', 'T')
            elif controller == 'sql':
                value = value.replace('Z','').replace('T',' ')
        if pf['control'] == 'multi':
            value = value.replace("'", "")
        return value

    def getDefaultFilter(self,pf):
        defaultFilter = {}
        if pf['defaultValue'] != '':
            defaultFilter['formula'] = pf['formula']
            defaultFilter['control'] = pf['control']
            defaultFilter['operator'] = pf['op']
            defaultFilter['value'] = (pf.has_key('defaultValue2')) and pf['defaultValue'] + '---to---' + pf['defaultValue2'] or pf['defaultValue']
        elif pf['defaultX'] == 'allChoices' and pf['includeAllChoices'] == 'true':
            defaultFilter['formula'] = pf['formula']
            defaultFilter['control'] = pf['control']
            defaultFilter['operator'] = pf['op']
            defaultFilter['value'] = 'allChoices'
        if defaultFilter and pf['setVariableValue'] and pf['setVariable'] :
            defaultFilter['setVariableValue'] = pf['setVariableValue']
            defaultFilter['setVariable'] = pf['setVariable']
        return defaultFilter

    def getVariable(self, pf):
        variable = {}
        if pf['setVariableValue'] and pf['setVariable'] :
            variable['name'] = pf['setVariableValue']
            variable['value'] = pf['defaultValue']
        return variable


class ReportInfoManager(object):
    def __init__(self,controller=None,simbaxmlRaw=None,requestxmlRaw=None,filterxmls=None,variables=None):
        self.controller =     controller
        self.simbaxmlRaw =    simbaxmlRaw
        self.requestxmlRaw =  requestxmlRaw
    def get_controller(self):return self.controller
    def set_controller(self):self.controller = controller
    def get_simbaxmlRaw(self):return self.simbaxmlRaw
    def set_simbaxmlRaw(self):self.simbaxmlRaw = simbaxmlRaw
    def get_requestxmlRaw(self):return self.requestxmlRaw
    def set_requestxmlRaw(self):self.requestxmlRaw = requestxmlRaw
    def generateResults(self):
        baseViewInfo = {}
        baseViewInfo['hasColumnSelector'] = False
        baseViewInfo['isViewSelector'] = False
        if self.simbaxmlRaw:
            self.simbaxmlObj = simbaStruct.parseString(self.simbaxmlRaw)
        if self.requestxmlRaw:
            self.requestxmlObj = dom.parseString(self.requestxmlRaw)
        baseViewObj = self.getBaseViewObject()
        if baseViewObj:
            cells = []
            cellObjs = baseViewObj.cell
            for cellObj in cellObjs:
                cell = {}
                if cellObj.viewName:
                    viewName = cellObj.viewName
                if viewName == 'Title':
                    continue
                viewType = cellObj.viewType and cellObj.viewType or self.getViewTypeByViewName(viewName)
                cell['viewName'] = viewName
                cell['viewType'] = viewType
                if viewType == 'columnSelector':
                    baseViewInfo['hasColumnSelector'] = True
                    columnSelectorInfo = self.getColumnSelectorViewInfo(viewName)
                    cell['viewInfo'] = columnSelectorInfo
                if viewType == 'viewSelector':
                    baseViewInfo['isViewSelector'] = True
                    viewSelectorInfo = self.getViewSelectorViewInfo(viewName)
                    cell['subViews'] = viewSelectorInfo['subViews']
                    cell['caption'] = viewSelectorInfo['caption']
                if viewType == 'tableView':
                    tableViewInfo = self.getTableViewInfo(viewName)
                    cell['viewInfo'] = tableViewInfo
                if viewType == 'chart':
                    chartViewInfo = self.getChartViewInfo(viewName)
                    cell['viewInfo'] = chartViewInfo
                if viewType == 'pivotTable':
                    pivotTableViewInfo = self.getPivotTableViewInfo(viewName)
                    cell['viewInfo'] = pivotTableViewInfo
                if viewType == 'compoundView':
                    compoundViewInfo = self.getCompoundViewInfo(viewName)
                    cell['subViews'] = compoundViewInfo['subViews']
                if viewType == 'mapView':
                    mapViewInfo = self.getMapViewInfo(viewName)
                    cell['viewInfo'] = mapViewInfo
                cells.append(cell)
            print cells
        else :
            cells = []
            cells.append({'viewName':'tableView!1','viewType':'Table'})
        baseViewInfo['views'] = cells
        return json.dumps(baseViewInfo)

    def getViewTypeByViewName(self,viewName):
        if viewName.find('staticchart') != -1 or viewName.find('gaugechart') != -1 or viewName.find('Chart') != -1 :
            return "chart"
        if viewName.find('pivotTableView') != -1 or viewName.find('Pivot Table') != -1 :
            return "pivotTable"
        if viewName.find('viewSelector') != -1 :
            return "viewSelector"
        if viewName.find('narrativeView') != -1 :
            return "narrativeView"
        if viewName.find('compoundView') != -1 :
            return "compoundView"
        if viewName.find('columnSelectorView') != -1 :
            return "columnSelector"
        if viewName.find('tableView') != -1 or viewName.find('Table') != -1 :
            return "tableView"
        if viewName.find('mapView') != -1 or viewName.find('map') != -1 :
            return "mapView"

    def getBaseViewObject(self):
        compoundViewObjs = self.simbaxmlObj.application.report.views.compoundView
        if compoundViewObjs:
            baseViewObj = compoundViewObjs[0]
            if baseViewObj.name:
                viewName = baseViewObj.name
                names = viewName.split('!')
                key = names[1] and names[1] or '0'
                key = string.atoi(key)
            else :
                key = 1
            for compoundViewObj in compoundViewObjs:
                if compoundViewObj.name :
                    viewName = compoundViewObj.name
                    names = viewName.split('!')
                    newKey = names[1] and names[1] or '1'
                    newKey = string.atoi(newKey)
                    if newKey < key:
                        key = newKey
                        baseViewObj = compoundViewObj
            return baseViewObj
        else :
            return False

    def getColumnSelectorViewInfo(self,viewName):
        viewInfo = {}
        columnSelectorObjs = self.simbaxmlObj.application.report.views.columnSelector
        if columnSelectorObjs:
            for columnSelectorObj in columnSelectorObjs :
                if columnSelectorObj.name == viewName:
                    selectors = {}
                    selectorObjs = columnSelectorObj.selector
                    for selectorObj in selectorObjs:
                        columnId = selectorObj.columnId
                        selectors[columnId] = []
                        for choiceObj in selectorObj.choice:
                            selectors[columnId].append(choiceObj.formula)
                    viewInfo['selectors'] = selectors
                    break
        return viewInfo
    
    def getViewSelectorViewInfo(self,viewName):
        viewInfo = {}
        subViews = []
        viewSelectorObjs = self.simbaxmlObj.application.report.views.viewSelector
        if viewSelectorObjs:
            for viewSelectorObj in viewSelectorObjs:
                if viewSelectorObj.name == viewName:
                    viewItemObjs = viewSelectorObj.viewItem
                    for viewItemObj in viewItemObjs:
                        subViewInfo = {}
                        subViewName = viewItemObj.viewName
                        subViewType = viewItemObj.viewType and viewItemObj.viewType or self.getViewTypeByViewName(subViewName)
                        #subViewType = self.getViewTypeByViewName(subViewName)
                        subViewCaption = viewItemObj.caption and viewItemObj.caption or subViewType
                        subViewInfo['viewName'] = subViewName
                        subViewInfo['viewType'] = subViewType
                        subViewInfo['caption'] = subViewCaption
                        if subViewType == 'tableView':
                            tableViewInfo = self.getTableViewInfo(subViewName)
                            subViewInfo['viewInfo'] = tableViewInfo
                        if subViewType == 'chart':
                            chartViewInfo = self.getChartViewInfo(subViewName)
                            subViewInfo['viewInfo'] = chartViewInfo
                        if subViewType == 'pivotTable':
                            pivotTableViewInfo = self.getPivotTableViewInfo(subViewName)
                            subViewInfo['viewInfo'] = pivotTableViewInfo
                        if subViewType == 'compoundView':
                            compoundViewInfo = self.getCompoundViewInfo(subViewName)
                            subViewInfo['subViews'] = compoundViewInfo['subViews']
                        if subViewType == 'mapView':
                            mapViewInfo = self.getMapViewInfo(subViewName)
                            subViewInfo['viewInfo'] = mapViewInfo
                        subViews.append(subViewInfo)
                    viewInfo['subViews'] = subViews
                    viewInfo['caption'] = viewSelectorObj.caption and viewSelectorObj.caption or viewSelectorObj.name
                    break
        return viewInfo

    def getCompoundViewInfo(self,viewName):
        viewInfo = {}
        subViews = []
        compoundViewObjs = self.simbaxmlObj.application.report.views.compoundView
        if compoundViewObjs:
            for compoundViewObj in compoundViewObjs:
                if compoundViewObj.name == viewName:
                    cellObjs = compoundViewObj.cell
                    for cellObj in cellObjs:
                        subViewInfo = {}
                        subViewName = cellObj.viewName
                        subViewType = self.getViewTypeByViewName(subViewName)
                        subViewInfo['viewName'] = subViewName
                        subViewInfo['viewType'] = subViewType
                        if subViewType == 'tableView':
                            tableViewInfo = self.getTableViewInfo(subViewName)
                            subViewInfo['viewInfo'] = tableViewInfo
                        if subViewType == 'chart':
                            chartViewInfo = self.getChartViewInfo(subViewName)
                            subViewInfo['viewInfo'] = chartViewInfo
                        if subViewType == 'pivotTable':
                            pivotTableViewInfo = self.getPivotTableViewInfo(subViewName)
                            subViewInfo['viewInfo'] = pivotTableViewInfo
                        if subViewType == 'mapView':
                            mapViewInfo = self.getMapViewInfo(viewName)
                            subViewInfo['viewInfo'] = mapViewInfo
                        subViews.append(subViewInfo)
                    viewInfo['subViews'] = subViews
                    break
        return viewInfo

    def getTableViewInfo(self,viewName):
        viewInfo = {}
        controller = self.controller
        tableViewObjs = self.simbaxmlObj.application.report.views.tableView
        if tableViewObjs:
            for tableViewObj in tableViewObjs:
                if tableViewObj.name == viewName:
                     viewInfo['viewCaption'] = tableViewObj.caption
        if controller == 'sql':
            sql = self.simbaxmlObj.application.report.criteria[0].sql
            viewInfo['sql'] = sql
        return viewInfo

    def getMapViewInfo(self,viewName):
        viewInfo = {}
        controller = self.controller
        mapViewObjs = self.simbaxmlObj.application.report.views.mapView
        criteriaCols = {}
        criteriaColumnObjs = self.simbaxmlObj.application.report.criteria[0].columns.column
        for criteriaColumnObj in criteriaColumnObjs :
            criteriaCols[criteriaColumnObj.columnId] = criteriaColumnObj.formula
        if mapViewObjs:
            for mapViewObj in mapViewObjs:
                if mapViewObj.name == viewName:
                    viewInfo['viewCaption'] = mapViewObj.caption
                    viewInfo['latitude'] = ''
                    viewInfo['longitude'] = ''
                    viewInfo['detail'] = []
                    viewInfo['series'] = []
                    viewInfo['centerLatitude'] = mapViewObj.centerLatitude
                    viewInfo['centerLongitude'] = mapViewObj.centerLongitude
                    viewInfo['geocodeSource'] = mapViewObj.geocodeSource
                    if mapViewObj.latitude and mapViewObj.latitude.column:
                        viewInfo['latitude'] = mapViewObj.latitude.column.columnId
                    if mapViewObj.longitude and mapViewObj.longitude.column:
                        viewInfo['longitude'] = mapViewObj.longitude.column.columnId
                    if mapViewObj.location and mapViewObj.location.column:
                        viewInfo['location'] = mapViewObj.location.column.columnId
                    #if mapViewObj.detail and mapViewObj.detail.column:
                    #    for column in mapViewObj.detail.column:
                    #        viewInfo['detail'].append(column.columnId)
                    #else:
                    viewInfo['detail'] = criteriaCols.keys()
                    if mapViewObj.seriesGenerators and mapViewObj.seriesGenerators.column:
                        for column in mapViewObj.seriesGenerators.column:
                            viewInfo['series'].append(column.columnId)
        if controller == 'sql':
            sql = self.simbaxmlObj.application.report.criteria[0].sql
            viewInfo['sql'] = sql
        return viewInfo

    def getChartViewInfo(self,viewName):
        viewInfo = {}
        chartObjs = self.simbaxmlObj.application.report.views.chart
        if chartObjs:
            for chartObj in chartObjs:
                if chartObj.name == viewName:
                    viewInfo['viewCaption'] = chartObj.caption
                    viewInfo['type'] = chartObj.chartType
                    viewInfo['subType'] = chartObj.subType and chartObj.subType or 'no' #(chartObj.subType == None) and '' or chartObj.subType
                    viewInfo['categories'] = self.getChartSelectionColumns(chartObj,'categories')
                    viewInfo['series'] = self.getChartSelectionColumns(chartObj,'seriesGenerators')
                    viewInfo['measures'] = self.getChartSelectionColumns(chartObj,'measures')
                    #viewInfo['pointers'] = self.getChartSelectionColumns(chartObj,'gaugePointers')
                    if chartObj.interaction:
                        if chartObj.interaction.interactiontType and chartObj.interaction.interactiontType == 'navigate':
                            viewInfo['navigate'] = {}
                            viewInfo['navigate']['cid'] = chartObj.interaction.navigation[0].cid
                            viewInfo['navigate']['caption'] = chartObj.interaction.navigation[0].caption
                    if(chartObj.chartType == 'gaugeChart'):
                        viewInfo['categories'] = self.getChartSelectionColumns(chartObj,'gaugeTitles')
                        viewInfo['measures'] = self.getChartSelectionColumns(chartObj,'gaugePointers')
                        viewInfo['gaugeScale'] = {'max':100,'min':0}
                        viewInfo['gaugeScale']['max'] = chartObj.gaugeScale.scaleMax.value
                        viewInfo['gaugeScale']['min'] = chartObj.gaugeScale.scaleMin.value
                        
                    if(chartObj.chartType == 'linecolumn'):
                        viewInfo['measurePosition'] = {'line':[],'column':[]}
                        if chartObj.measures:
                            measureColumnObjs = chartObj.measures.column
                            if measureColumnObjs:
                                i = 1
                                ln = len(measureColumnObjs)
                                for measureColumnObj in measureColumnObjs:
                                    if measureColumnObj.measurePosition is not None:
                                        if measureColumnObj.measurePosition == '0':
                                            viewInfo['measurePosition']['column'].append(measureColumnObj.columnId)
                                        else:
                                            viewInfo['measurePosition']['line'].append(measureColumnObj.columnId)
                                    else:
                                        if (i==ln) :
                                            viewInfo['measurePosition']['column'].append(measureColumnObj.columnId)
                                        else:
                                            viewInfo['measurePosition']['line'].append(measureColumnObj.columnId)
                                        i = i + 1
                    break
        viewInfo['requestxml'] = self.getChartRequestxml(viewInfo)
        return viewInfo

    def getCaptionFromFormula(self,formula):
        p = re.compile(r'\.')
        li = p.split(formula)
        captionText = li[-1].replace('"','').capitalize()
        return captionText

    def setColumnHeadingElement(self,srcColumnObj):
        if self.controller == 'obiee10g':
            requestxmlObj = dom.parseString(self.requestxmlRaw)
            columnHeadingObjs = srcColumnObj.getElementsByTagNameNS(saw_NS,'columnHeading')
            captionObjs = srcColumnObj.getElementsByTagNameNS(saw_NS,'caption')
            formula = srcColumnObj.getAttribute('formula')
            captionText = self.getCaptionFromFormula(formula)
            if len(captionObjs) == 0:
                if len(columnHeadingObjs) == 0:
                    columnHeadingObj = requestxmlObj.createElementNS(saw_NS,u'columnHeading')
                else :
                    columnHeadingObj = columnHeadingObjs[0]
                captionObj = requestxmlObj.createElementNS(saw_NS,u'caption')
                captionTextObj = requestxmlObj.createElementNS(saw_NS,u'text')
                textObj = requestxmlObj.createTextNode(captionText)
                captionTextObj.appendChild(textObj)
                captionObj.appendChild(captionTextObj)
                columnHeadingObj.appendChild(captionObj)
                srcColumnObj.appendChild(columnHeadingObj)
            return srcColumnObj

    def getChartRequestxml(self,viewInfo):
        if self.controller == 'obiee10g':
            if viewInfo:
                scmCols = dict(viewInfo['series'].items() + viewInfo['categories'].items() + viewInfo['measures'].items())
                scCols = dict(viewInfo['series'].items() + viewInfo['categories'].items())
                criteriaAggRules = self.getCriteriaAggRules()
                criteriaCols = {}
                excludedColObjs = []
                if self.requestxmlRaw:
                    requestxmlObj = dom.parseString(self.requestxmlRaw)
                    srcCriteriaObj = requestxmlObj.getElementsByTagNameNS(saw_NS,'criteria')[0]
                    srcColumnsObj = srcCriteriaObj.getElementsByTagNameNS(saw_NS,'columns')[0]
                    srcColumnObjs = srcCriteriaObj.getElementsByTagNameNS(saw_NS,'column')
                    viewsObj = requestxmlObj.getElementsByTagNameNS(saw_NS,'views')[0]
                    viewsObj.parentNode.removeChild(viewsObj)
                    for srcColumnObj in srcColumnObjs:
                        columnID = srcColumnObj.getAttribute('columnID')
                        formula = srcColumnObj.getAttribute('formula')
                        if scmCols.has_key(columnID):
                            #pass
                            srcColumnObj = self.setColumnHeadingElement(srcColumnObj)
                            if viewInfo['measures'].has_key(columnID) and criteriaAggRules.has_key(columnID):
                                aggRule = self.convertAggRule(criteriaAggRules[columnID])
                                aggFormula = aggRule + '(' + formula + ' BY ' + ','.join(scCols.values()) + ' )'
                                srcColumnObj.setAttribute('formula',aggFormula)
                        else :
                            excludedColObjs.append(srcColumnObj)
                    for excludedColObj in excludedColObjs:
                        excludedColObj.parentNode.removeChild(excludedColObj)
                    return requestxmlObj.toxml()
                else :
                    return self.requestxmlRaw
            else:
                return self.requestxmlRaw
        return self.requestxmlRaw

    def getCriteriaAggRules(self):
        aggRules = {}
        criteriaColumnObjs = self.simbaxmlObj.application.report.criteria[0].columns.column
        for criteriaColumnObj in criteriaColumnObjs :
            if criteriaColumnObj.aggRule:
                aggRules[criteriaColumnObj.columnId] = criteriaColumnObj.aggRule
        return aggRules

    def convertAggRule(self,aggRule):
        if self.controller == 'obiee10g':
            if aggRule.lower() == 'sum':
                aggRule = 'SUM'
            elif aggRule.lower() == 'count':
                aggRule = 'COUNT'
            else :
                aggRule = 'AGGREGATE'
        return aggRule

    def getChartSelectionColumns(self,chartObj,selection):
        selectionColumns = {}
        selectionColumnObjs = None
        criteriaCols = {}
        criteriaColumnObjs = self.simbaxmlObj.application.report.criteria[0].columns.column
        for criteriaColumnObj in criteriaColumnObjs :
            criteriaCols[criteriaColumnObj.columnId] = criteriaColumnObj.formula
        if selection == 'categories':
            if chartObj.categories:
                selectionColumnObjs = chartObj.categories.category[0].column
        elif selection == 'seriesGenerators':
            if chartObj.seriesGenerators:
                selectionColumnObjs = chartObj.seriesGenerators.column
        elif selection == 'measures':
            if chartObj.measures:
                selectionColumnObjs = chartObj.measures.column
        elif selection == 'gaugePointers':
            if chartObj.gaugePointers :
                if chartObj.gaugePointers.pointer :
                    selectionColumnObj = chartObj.gaugePointers.pointer[0].column
                    columnId = selectionColumnObj.columnId
                    formula = selectionColumnObj.formula
                    if criteriaCols.has_key(columnId):
                        selectionColumns[columnId] = formula
                        return selectionColumns
        elif selection == 'gaugeTitles':
            if chartObj.gaugeTitles:
                if chartObj.gaugeTitles.column:
                    selectionColumnObjs = chartObj.gaugeTitles.column
        if selectionColumnObjs: 
            for selectionColumnObj in selectionColumnObjs:
                columnId = selectionColumnObj.columnId
                formula = selectionColumnObj.formula
                if criteriaCols.has_key(columnId):
                    selectionColumns[columnId] = formula
        else :
            return {}
        return selectionColumns

    def getPivotTableViewInfo(self,viewName):  
        viewInfo = {}
        pivotTableObjs = self.simbaxmlObj.application.report.views.pivotTable
        if pivotTableObjs:
            for pivotTableObj in pivotTableObjs:
                if pivotTableObj.name == viewName:
                    viewInfo['viewCaption'] = pivotTableObj.caption
                    criteriaCols = {}
                    criteriaColumnObjs = self.simbaxmlObj.application.report.criteria[0].columns.column
                    for criteriaColumnObj in criteriaColumnObjs :
                        criteriaCols[criteriaColumnObj.columnId] = criteriaColumnObj.formula
                    edgeObjs = pivotTableObj.edge
                    for edgeObj in edgeObjs:
                        axis = edgeObj.axis
                        viewInfo[axis] = {}
                        if edgeObj.total: 
                            viewInfo[axis]['total'] = edgeObj.total
                        if edgeObj.totalLabel: 
                            viewInfo[axis]['totalLabel'] = edgeObj.totalLabel
                        if edgeObj.measureLabels:
                            viewInfo[axis]['LabelPos'] = edgeObj.measureLabels.edgeSeq
                            viewInfo['LabelPos'] = axis
                            if edgeObj.measureLabels.total:
                                viewInfo[axis]['total'] = edgeObj.measureLabels.total
                        edgeColumnObjs = edgeObj.column
                        cols = {}
                        altCols = {}
                        for edgeColumnObj in edgeColumnObjs:
                            columnId = edgeColumnObj.columnId
                            if criteriaCols.has_key(columnId):
                                formula = edgeColumnObj.formula
                                cols[columnId] = {}
                                cols[columnId]['formula'] = formula
                                altCols[columnId] = formula
                                if edgeColumnObj.aggRule:
                                    cols[columnId]['aggRule'] = edgeColumnObj.aggRule
                                if edgeColumnObj.columnHeading :
                                    if edgeColumnObj.columnHeading.captionText :
                                        cols[columnId]['caption'] = edgeColumnObj.columnHeading.captionText
                        viewInfo[axis]['columns'] = cols
                        viewInfo[axis]['altColumns'] = altCols
                    if pivotTableObj.chart:
                        pivotChartObj = pivotTableObj.chart
                        pivotChart = {}
                        pivotChart['position'] = pivotChartObj.chartPosition
                        pivotChart['viewName'] = viewName
                        pivotChart['viewType'] = 'Chart'
                        pivotChart['viewInfo'] = {}
                        pivotChart['viewInfo']['type'] = pivotChartObj.chartType
                        pivotChart['viewInfo']['subType'] = pivotChartObj.subType and pivotChartObj.subType or 'no'#(pivotChartObj.subType == None) and 'no' or pivotChartObj.subType
                        pivotChart['viewInfo']['categories'] = self.getChartSelectionColumns(pivotChartObj,'categories')
                        pivotChart['viewInfo']['series'] = self.getChartSelectionColumns(pivotChartObj,'seriesGenerators')
                        pivotChart['viewInfo']['measures'] = self.getChartSelectionColumns(pivotChartObj,'measures')
                        pivotChart['viewInfo']['pointers'] = self.getChartSelectionColumns(pivotChartObj,'gaugePointers')
                        if pivotChartObj.interaction:
                            if pivotChartObj.interaction.interactiontType and pivotChartObj.interaction.interactiontType == 'navigate':
                                pivotChart['viewInfo']['navigate'] = {}
                                pivotChart['viewInfo']['navigate']['cid'] = pivotChartObj.interaction.navigation[0].cid
                                pivotChart['viewInfo']['navigate']['caption'] = pivotChartObj.interaction.navigation[0].caption
                        if pivotChart['position'] == 'only':
                            pivotChart['viewInfo']['requestxml'] = self.getChartRequestxml(pivotChart['viewInfo'])
                        viewInfo['chart'] = pivotChart                        
                    break
        viewInfo['requestxml'] = self.getPivotTableRequestxml(viewInfo)
        del viewInfo['page']['altColumns']
        del viewInfo['section']['altColumns']
        del viewInfo['column']['altColumns']
        del viewInfo['row']['altColumns']
        del viewInfo['measure']['altColumns']
        return viewInfo

    def getPivotTableRequestxml(self,viewInfo):
        if self.controller == 'obiee10g':
            if viewInfo:
                pageCols = viewInfo["page"]['altColumns']
                sectionCols = viewInfo["section"]['altColumns']
                columnCols = viewInfo["column"]['altColumns']
                rowCols = viewInfo["row"]['altColumns']
                measureCols = viewInfo["measure"]['altColumns']
                pscrmCols = dict(pageCols.items() + sectionCols.items() + columnCols.items() + rowCols.items() + measureCols.items())
                pscrCols = dict(pageCols.items() + sectionCols.items() + columnCols.items() + rowCols.items())
                criteriaAggRules = self.getCriteriaAggRules()
                criteriaCols = {}
                excludedColObjs = []
                if self.requestxmlRaw:
                    requestxmlObj = dom.parseString(self.requestxmlRaw)
                    srcCriteriaObj = requestxmlObj.getElementsByTagNameNS(saw_NS,'criteria')[0]
                    srcColumnsObj = srcCriteriaObj.getElementsByTagNameNS(saw_NS,'columns')[0]
                    srcColumnObjs = srcCriteriaObj.getElementsByTagNameNS(saw_NS,'column')
                    viewsObj = requestxmlObj.getElementsByTagNameNS(saw_NS,'views')[0]
                    viewsObj.parentNode.removeChild(viewsObj)
                    for srcColumnObj in srcColumnObjs:
                        columnID = srcColumnObj.getAttribute('columnID')
                        formula = srcColumnObj.getAttribute('formula')
                        if pscrmCols.has_key(columnID):
                            srcColumnObj = self.setColumnHeadingElement(srcColumnObj)
                            criteriaCols[columnID] = formula
                        else :
                            excludedColObjs.append(srcColumnObj)
                    for excludedColObj in excludedColObjs:
                        excludedColObj.parentNode.removeChild(excludedColObj)
                    aggCols = {}
                    if measureCols:
                        for mId, mFormula in measureCols.items():
                            if pscrCols:
                                if viewInfo['measure']['columns'][mId].has_key('aggRule'):
                                    aggRule = viewInfo['measure']['columns'][mId]['aggRule']
                                elif criteriaAggRules.has_key(mId):
                                    aggRule = criteriaAggRules[mId]
                                else :
                                    aggRule = ''
                                aggRule = self.convertAggRule(aggRule)
                                aggCols[mId] = aggRule + '(' + mFormula + ' BY )'
                                if pageCols:
                                    byCols = pageCols.values()
                                    byIds = [mId] + sorted(pageCols.keys())
                                    #byIds = [mId] + pageCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and sectionCols:
                                    byCols = pageCols.values() + sectionCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + sectionCols.keys())
                                    #byIds = [mId] + pageCols.keys() + sectionCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and rowCols:
                                    byCols = pageCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + rowCols.keys())
                                    #byIds = [mId] + pageCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and columnCols:
                                    byCols = pageCols.values() + columnCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + columnCols.keys())
                                    #byIds = [mId] + pageCols.keys() + columnCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and sectionCols and columnCols:
                                    byCols = pageCols.values() + sectionCols.values() + columnCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + sectionCols.keys() + columnCols.keys())
                                    #byIds = [mId] + pageCols.keys() + sectionCols.keys() + columnCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and sectionCols and rowCols:
                                    byCols = pageCols.values() + sectionCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + sectionCols.keys() + rowCols.keys())
                                    #byIds = [mId] + pageCols.keys() + sectionCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and columnCols and rowCols:
                                    byCols = pageCols.values() + columnCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + columnCols.keys() + rowCols.keys())
                                    #byIds = [mId] + pageCols.keys() + columnCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if pageCols and sectionCols and columnCols and rowCols:
                                    byCols = pageCols.values() + sectionCols.values() + columnCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(pageCols.keys() + sectionCols.keys() + columnCols.keys() + rowCols.keys())
                                    #byIds = [mId] + pageCols.keys() + sectionCols.keys() + columnCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if sectionCols:
                                    byCols = sectionCols.values()
                                    byIds = [mId] + sorted(sectionCols.keys())
                                    #byIds = [mId] + sectionCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if sectionCols and columnCols:
                                    byCols = sectionCols.values() + columnCols.values()
                                    byIds = [mId] + sorted(sectionCols.keys() + columnCols.keys())
                                    #byIds = [mId] + sectionCols.keys() + columnCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if sectionCols and rowCols:
                                    byCols = sectionCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(sectionCols.keys() + rowCols.keys())
                                    #byIds = [mId] + sectionCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if sectionCols and columnCols and rowCols:
                                    byCols = sectionCols.values() + columnCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(sectionCols.keys() + columnCols.keys() + rowCols.keys())
                                    #byIds = [mId] + sectionCols.keys() + columnCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if columnCols:
                                    byCols = columnCols.values()
                                    byIds = [mId] + sorted(columnCols.keys())
                                    #byIds = [mId] + columnCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if columnCols and rowCols:
                                    byCols = columnCols.values() + rowCols.values()
                                    byIds = [mId] + sorted(columnCols.keys() + rowCols.keys())
                                    #byIds = [mId] + columnCols.keys() + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                                if rowCols:
                                    byCols = rowCols.values()
                                    byIds = [mId] + sorted(rowCols.keys())
                                    #byIds = [mId] + rowCols.keys()
                                    aggCols[','.join(byIds)] = aggRule + '(' + mFormula + ' BY ' + ','.join(byCols) + ' )'
                    if aggCols:
                        for aggId, aggFormula in aggCols.items():
                            colIds = aggId.split(',')
                            for srcColumnObj in srcColumnObjs:
                                if srcColumnObj.getAttribute('columnID') == colIds[0]:
                                    aggColumnObj = srcColumnObj.cloneNode(True)
                                    aggColumnObj.setAttribute("formula", aggFormula)
                                    aggColumnObj.setAttribute("columnID", aggId)
                                    srcColumnObj.parentNode.appendChild(aggColumnObj)
                                    break
                    return requestxmlObj.toxml()
                else :
                    return self.requestxmlRaw
            else:
                return self.requestxmlRaw
        return self.requestxmlRaw
                    



