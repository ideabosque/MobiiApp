import ssrs2010Struct
import simbaStruct

class SSRSConverter:
    def __init__(self,style=None,appName=None,srcMetadata=None,app=None,columns=None):
        self.style = style
        self.appName = appName
        self.srcMetadata = srcMetadata
        self.app = app
        self.columns = columns
    def get_style(self):return self.style
    def set_style(self):self.style = style
    def get_appName(self):return self.Name
    def set_appName(self):self.appName = appName
    def get_srcMetadata(self):return self.srcMetadata
    def set_srcMetadata(self):self.srcMetadata = srcMetaData
    def get_app(self):return self.app
    def set_app(self):self.app = app
    def get_columns(self):return self.columns
    def set_columns(self):self.columns = columns
    def generateApp(self):
        srcReport = ssrsStruct.parse(self.srcMetadata)
        appObj = application()
        appObj.appName = self.appName
        if self.style == 'report':
            appObj.report  = self.generateReport(srcReport)
        elif self.style == 'prompt':
            appObj.prompt = self.generatePrompt(srcReport)
        elif self.style == 'page':
            appObj.page = self.generateDashboardPage(srcReport)
        self.app = appObj
    def generateReport(self,srcReport):
        reportObj = report()
        srcDataSets = srcReport.DataSets[0].DataSet
        for srcDataSet in srcDataSets:
            reportObj.add_criteria(self.generateCriteria(srcDataSet))
        srcBody = srcReport.Body[0]
        reportObj.views = self.generateViews(srcBody)
        return reportObj
    def generateCriteria(self,srcDataSet):
        criteriaObj = criteria()
        criteriaObj.name = srcDataSet.Name
##        srcFields = srcDataSet.Fields[0].Field
        criteriaObj.columns = self.generateColumns()
        self.columns = criteriaObj.columns
        return criteriaObj
    def generateColumns(self):
        columnsObj = columns()
        return columnsObj
    def generateViews(self,srcBody):
        viewsObj = views()
        for 
