from simbaStruct import *
import sys
import tempfile
import os

from obiee10gconverter import OBIEE10gConverter
from sqlconverter import SQLConverter

def hostname():
    sys = os.name
    if sys == 'nt':
        hostname = os.getenv('computername')
        return hostname
    elif sys == 'posix':
        host = os.popen('echo $HOSTNAME')
        try:
            hostname = host.read()
            return hostname
        finally:
            host.close()
    else:
        return 'Unkwon hostname'

class MetadataConverter:
    def __init__(self,cid=None,appName=None,style=None,subs=None,savedFilters=None,srcMetadata=None,report=None,prompt=None,page=None,simba=None):
        self.cid = cid
        self.style = style
        self.appName = appName
        self.subs = subs
        self.srcMetadata = srcMetadata
        self.report = report
        self.prompt = prompt
        self.page = page
        self.simba = simba
    def get_cid(self):return self.cid
    def set_cid(self):self.cid = cid
    def get_appName(self):return self.appName
    def set_appName(self):self.appName = appName
    def get_style(self):return self.style
    def set_style(self):self.style = style
    def get_savedFilters(self):return self.savedFilters
    def set_savedFilters(self):self.savedFilters = savedFilters
    def get_subs(self):return self.subs
    def set_subs(self):self.subs = subs
    def get_srcMetadata(self):return self.srcMetadata
    def set_srcMetadata(self):self.srcMetadata = srcMetadata
    def get_report(self):return self.report
    def set_report(self):self.report = report
    def get_prompt(self):return self.prompt
    def set_prompt(self):self.prompt = prompt
    def get_page(self):return self.page
    def set_page(self):self.page = page
    def get_simba(self):return self.simba
    def set_simba(self):self.simba = simba
    def generateSimba(self):
        if self.appName == 'obiee10g':
            simbaObj = simba()
            simbaObj.cid = self.cid
            simbaObj.style = self.style
            obiee10gObj = OBIEE10gConverter(self.style,self.appName,self.subs,self.savedFilters,self.srcMetadata)
            obiee10gObj.generateApp()
            simbaObj.application = obiee10gObj.app
        elif self.appName == 'obiee11g':
            obiee10gObj = Obiee11gConverter(self.style,self.appName,self.srcMetadata)
            obiee11gObj.generateApp()
            simbaObj.application = obiee11gObj.app
##        elif self.appName == 'ssrs':
##            ssrsObj = SSRSConverter(self.style,self.appName,self.srcMetadata)
##            ssrsObj.generateApp()
##            simbaObj.application = ssrsObj.app
        elif self.appName == 'sql':
            sqlObj = SQLConverter(self.cid,self.style,self.appName,self.srcMetadata,self.report,self.prompt,self.page)
            simbaObj = sqlObj.generateSimba()
##        else:
##            raise InvalidValueException(1,'Unknowed application.')
        try:
            tfile = tempfile.TemporaryFile()
            simbaObj.export(tfile,0)
            tfile.seek(0)
            simbaxml = tfile.read()
            self.simba = simbaxml
        except:
            self.simba = simbaObj
            
