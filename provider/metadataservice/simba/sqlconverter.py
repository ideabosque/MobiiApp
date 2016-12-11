from simbaStruct import *
import simbaStruct
import sys

def getColumns(sql):
    columns = sql.split('\r\nFROM\r\n',1)[0].replace('SELECT DISTINCT\r\n','SELECT\r\n').split('SELECT\r\n',1)[1].replace(' AS ',' ').split(',\r\n')
##    columns = sql.split('\nFROM\n',1)[0].replace('SELECT DISTINCT\n','SELECT\n').split('SELECT\n',1)[1].replace(' AS ',' ').split(',\n')   ##for devel
    return columns

class SQLConverter:
    def __init__(self,cid=None,style=None,appName=None,srcMetadata=None,report=None,prompt=None,page=None,columns=None):
        self.cid = cid
        self.style = style
        self.appName = appName
        self.srcMetadata = srcMetadata
        self.report = report
        self.prompt = prompt
        self.page = page
    def get_cid(self):return self.cid
    def set_cid(self):self.cid = cid
    def get_style(self):return self.style
    def set_style(self):self.style = style
    def get_appName(self):return self.appName
    def set_appName(self):self.appName = appName
    def get_srcMetadata(self):return self.srcMetadata
    def set_srcMetadata(self):self.srcMetadata = srcMetadata
    def get_report(self):return self.report
    def set_report(self):self.report = report
    def get_prompt(self):return self.prompt
    def set_prompt(self):self.prompt = prompt
    def get_page(self):return self.page
    def set_page(self):self.page = page
    def get_columns(self):return self.columns
    def set_columns(self):self.columns = columns
    def generateSimba(self):
        try:
            if self.srcMetadata == None:
                simbaObj = simba()
                simbaObj.cid = self.cid
                simbaObj.style = self.style
                simbaObj.application = self.generateApp()
            else:
    ##            simbaObj = simbaStruct.parse(self.srcMetadata)
                simbaObj = simbaStruct.parseString(self.srcMetadata)
                simbaObj = self.improveSimba(simbaObj)
        except:
            simbaObj = 'Format is not correct'
        return simbaObj
    def generateApp(self):
        appObj = application()
        appObj.appName = self.appName
        if self.style == 'report':
            appObj.report = self.generateReport(self.report)
        elif self.style == 'prompt':
            appObj.prompt = self.generatePrompt(self.prompt)
        elif self.style == 'page':
            appObj.page = self.generatePage(self.page)
        return appObj
    def generateReport(self,rpt):
        reportObj = report()
        reportObj.add_criteria(self.generateCriteria(rpt.reportSql))
        reportObj.views= self.generateViews()
##        reportObj.reportPrompt = self.generateReportPrompt(sql)
        return reportObj
    def generateCriteria(self,reportSql):
        criteriaObj = criteria()
        reportSql = reportSql.replace('select','SELECT').replace('from','FROM').replace('where','WHERE')
        cols = getColumns(reportSql)
##        filters = sqlQuery.rsplit(' WHERE ',1)[1].split(' AND ')
##        orders = sqlQuery.rsplit(' ORDER BY ',1)[1].split(', ')
        criteriaObj.columns = self.generateColumns(cols)
        criteriaObj.sql = reportSql
        self.columns = criteriaObj.columns
        return criteriaObj
    def generateColumns(self,cols):
        columnsObj = columns()
        for col in cols:
            columnsObj.add_column(self.generateColumn(col))
        return columnsObj
    def generateColumn(self,col):
        columnObj = column()
        columnObj.formula = col.rsplit(' ',1)[0]
        columnObj.columnId = col.rsplit(' ',1)[1].replace('"','')
        if len(col.split(' '))> 1:
            columnObj.columnHeading = self.generateColumnHeading(col.rsplit(' ',1)[0])
        return columnObj
    def generateColumnHeading(self,caption):
        columnHeadingObj = columnHeadingType()
        captionText = caption.rsplit('.',1)[1]
        columnHeadingObj.captionText = captionText.replace('"','')
        return columnHeadingObj
    def generateViews(self):
        viewsObj = views()
        viewsObj.add_compoundView(self.generateCompoundView())
        viewsObj.add_tableView(self.generateTableView())
        return viewsObj
    def generateCompoundView(self):
        compoundViewObj = compoundView()
        compoundViewObj.name = 'compoundView!1'
        cellObj = cell()
        cellObj.viewName = 'tableView!1'
        cellObj.viewType = 'tableView'
        compoundViewObj.add_cell(cellObj)
        return compoundViewObj
    def generateTableView(self):
        tableViewObj = tableView()
        tableViewObj.name = 'tableView!1'
        return tableViewObj
##    def generateReportPrompt(self,sql):
##        rptPromptObj = reportPrompt()
##        cols = getColumns(sql)
##        for col in cols:
##            rptPromptObj.add_promptFilter(self.generatePromptFilter(col))
##        return rptPromptObj
##    def generatePromptFilter(self,column):
##        promptFilterObj = promptFilterType()
##        promptFilterObj.formula = column.split(' ')[0]
##        promptFilterObj.type = 'colFilterPrompt'
##        promptFilterObj.op = 'in'
##        promptFilterObj.control = 'edit'
##        if len(column.split(' '))> 1:
##            promptFilterObj.caption = column.split(' ')[1]
##        return promptFilterObj

    def improveSimba(self,simbaObj):
        criteriaObjs = simbaObj.application.report.criteria
        cols = []
        for criteriaObj in criteriaObjs:
            columnsObj = criteriaObj.columns
            columnObjs = columnsObj.column
            for columnObj in columnObjs:
                cols.append(columnObj)
        viewsObj = simbaObj.application.report.views
        chartObjs = viewsObj.chart
        pivotTableObjs = viewsObj.pivotTable
        mapViewObjs = viewsObj.mapView
        if len(chartObjs) > 0:
            for chartObj in chartObjs:
                self.improveChart(chartObj,cols)
        if len(pivotTableObjs) > 0:
            for pivotTableObj in pivotTableObjs:
                self.improvepivotTable(pivotTableObj, cols)
        if len(mapViewObjs) >0:
            for mapViewObj in mapViewObjs:
                self.improveMapView(mapViewObj, cols)
        return simbaObj
    def improveChart(self,chartObj,cols):
        categoryObjs = chartObj.categories.category
        for categoryObj in categoryObjs:
            categoryColObjs = categoryObj.column
            self.replaceColumn(categoryColObjs,cols)
        measuresColObjs = chartObj.measures.column
        self.replaceColumn(measuresColObjs,cols)
        if chartObj.seriesGenerators is not None:
            seriesGeneratorsColObjs = chartObj.seriesGenerators.column
            self.replaceColumn(seriesGeneratorsColObjs,cols)
        if chartObj.gaugePointers is not None:
            gaugePointerObjs = chartObj.gaugePointers.pointer
            for gaugePointerObj in gaugePointerObjs:
                gaugePointerColObjs = gaugePointerObj.column
                self.replaceColumn(gaugePointerColObjs,cols)
        if chartObj.gaugeScale is not None:
            gaugeScaleMinColObjs = chartObj.gaugeScale.scaleMin.column
            self.replaceColumn(gaugeScaleMinColObjs,cols)
            gaugeScaleMaxColObjs = chartObj.gaugeScale.scaleMax.column
            self.replaceColumn(gaugeScaleMaxColObjs,cols)
        if chartObj.gaugeRanges is not None:
            gaugeRangeObjs = chartObj.gaugeRanges.gaugeRange
            for gaugeRangeObj in gaugeRangeObjs:
                gaugeRangeLowColObjs = gaugeRangeObj.rangeLow.column
                self.replaceColumn(gaugeRangeLowColObjs,cols)
                gaugeRangeHighColObjs = gaugeRangeObj.rangeHigh.column
                self.replaceColumn(gaugeRangeHighColObjs,cols)
    def improvepivotTable(self,pivotTableObj,cols):
        edgeObjs = pivotTableObj.edge
        for edgeObj in edgeObjs:
            edgeColObjs = edgeObj.column
            self.replaceColumn(edgeColObjs,cols)
    def improveMapView(self,mapViewObj,cols):
        latitudeObj = mapViewObj.latitude
        latitudeColObj = latitudeObj.column
        self.replaceColumn(latitudeColObj,cols)
        longitudeObj = mapViewObj.longitude
        longitudeColObj = longitudeObj.column
        self.replaceColumn(longitudeColObj,cols)
        detailObj = mapViewObj.detail
        detailColObjs = latitudeObj.column
        for detailColObj in detailColObjs:
            self.replaceColumn(detailColObj,cols)
    def replaceColumn(self,columnObjs,cols):
        for columnObj in columnObjs:
            for col in cols:
                if col.columnId == columnObj.columnId:
                    columnObjs[columnObjs.index(columnObj)] = col                        

    def generatePrompt(self,ppt):
        promptObj = prompt()
        promptObj.scope = ppt.scope
        if ppt.promptFilters is not None:
            for pormptFilter in ppt.promptFilters:
                promptObj.add_promptFilter(self.generatePromptFilter(pormptFilter))
        return promptObj
    def generatePromptFilter(self,pormptFilter):
        promptFilterObj = promptFilterType()
        promptFilterObj.formula = pormptFilter.formula
        promptFilterObj.schema = pormptFilter.schema
        promptFilterObj.op = pormptFilter.op
        promptFilterObj.default = pormptFilter.defaultOn
        promptFilterObj.defaultValue = pormptFilter.defaultValue
        promptFilterObj.defaultValue2 = pormptFilter.defaultValue2
        promptFilterObj.values = pormptFilter.values
        promptFilterObj.control = pormptFilter.control
        promptFilterObj.includeAllChoices = pormptFilter.includeAllChoices
        promptFilterObj.constrainChoices = pormptFilter.constrainChoices
        promptFilterObj.setVariable = pormptFilter.setVariable
        promptFilterObj.setVariableValue = pormptFilter.setVariableValue
        promptFilterObj.type = pormptFilter.type
        promptFilterObj.caption = pormptFilter.caption
        return promptFilterObj

    def generatePage(self, pg):
        pageObj = page()
        pageObj.pageName = pg.pageName
        prompts = pg.prompts
        reports = pg.reports
        pageObj.add_section(self.generateSection(prompts,reports))
        return pageObj
    def generateSection(self, prompts, reports):
        sectionObj = section()
        if prompts is not None:
            for promptName in prompts.keys():
                sectionObj.add_pagePrompt(self.generatePagePrompt(promptName,prompts[promptName]))
        if reports is not None:
            for reportName in reports.keys():
                sectionObj.add_pageReport(self.generatePageReport(reportName,reports[reportName]))
        return sectionObj
    def generatePagePrompt(self,promptName,promptCid):
        pagePromptObj = nodeType()
        pagePromptObj.cid = promptCid
        pagePromptObj.caption = promptName
        return pagePromptObj
    def generatePageReport(self,reportName,reportCid):
        pageReportObj = nodeType()
        pageReportObj.cid = reportCid
        pageReportObj.caption = reportName
        return pageReportObj
        
