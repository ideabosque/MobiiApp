import sys
from ssrsdataconvertor import *
from obiee10gdataconvertor import *

class DataConvertor(object):
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
        if self.appName == 'ssrs':
            dataConvertorObj = SSRSDataConvertor(self.requestxmlRaw,self.simbaxmlRaw,self.viewName,self.viewType,self.dataxmlRaw)
            result = dataConvertorObj.generateResults()
            return result
        elif self.appName == 'obiee10g':
            dataConvertorObj = OBIEE10gDataConvertor(self.requestxmlRaw,self.simbaxmlRaw,self.viewName,self.viewType,self.dataxmlRaw)
            result = dataConvertorObj.generateResults()
            return result
        else :
            return ''
