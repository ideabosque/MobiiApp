// Ext.is.Blackberry = true;
if(Ext.is.Blackberry) Ext.is.Phone = true;
// Ext.is.Phone = true;
// Ext.is.Android = true;
var _build = '1.0.2.6';
var _mobiiappdb;
var _offline = navigator.onLine ? false : true;
// var _offline = true;
var _mode = 'native';
// var _mode = 'web';
var _urlBase = window.localStorage.getItem('urlBase');
if(! _urlBase){
	var _urlBase = (_mode == 'web') ? '..' : 'https://www.mobiiapp.com';
	window.localStorage.setItem('urlBase',_urlBase);
}

// var _urlBase = '..'; //web
// var _urlBase = 'https://www.mobiiapp.com'; //native
// var _urlBase = 'https://mobiiapp.softmaster.us/'; //native

var _loginURL = '/client/login',
	_signupURL = '/client/signup',
	// _createGroupURL = '/client/creategroup',
	_joinGroupURL = '/client/joingroup',
	_logoutURL = '/client/logout',
	_validURL = '/client/validate',
	_passwordURL = '/client/passwordreset',
	_menuURL = '/client/loadmenu',
	_pageURL = '/client/loaddata',
	_reportURL = '/client/loaddata',
	_commentURL = '/client/loadcomments',
	_submitCommentURL = '/client/submitcomment',
	_ticketsURL = '/client/loadtickets',
	_submitTicketURL = '/client/submitticket',
	_submitTicketComentURL = '/client/submitticketcomment',
	_unitsURL = '/client/loadunit';
var _defaultTimeout = 120000;
var _defaultInterval = 10000;
var _catalogID = 0;
var _commentInterval;
var _userPerm = 'anonymous user';

// if(_mode == 'web'){
	// var _capturedFile = {
		// fullPath: window.location.origin + '/sites/default/files/comment_images/front.1.jpg',
		// fullPath: window.location.origin + '/sites/default/files/comment_images/img_flwr.png',
		// fullPath: window.location.origin + '/sites/default/files/comment_images/icon-xhdpi.png',
		// fullPath: window.location.origin + '/sites/default/files/comment_images/1340267075050.png',
		// fullPath: window.location.origin + '/sites/default/files/comment_images/1340668012830.png',
		// fileName: 'front.1.jpg'
	// };
// } else {
	// var _capturedFile = false;
// }
var _capturedFile = false;

SimbaApp = new Ext.Application({
    name: 'SimbaApp',
    tabletStartupScreen: 'tablet_startup.jpg',
    phoneStartupScreen: 'phone_startup.jpg',
    tabletIcon: 'icon-ipad.png',
    phoneIcon: 'icon-iphone.png',
    glossOnIcon: false,
    launch: function(){
		SimbaApp.views.LoginForm = new Ext.form.FormPanel(LoginFormBase);
		if (_offline){
			SimbaApp.offlineLaunch();
		} else {
			SimbaApp.onlineLaunch();
		}
    },
	listeners: {
		launch: function(){
			SimbaApp.WebSQLDb.initDatabase();
		}
	}
});

SimbaApp.offlineLaunch = function(){
	_offline = true;
	SimbaApp.createOfflineNavigation();
	if (SimbaApp.views.viewport){
		// SimbaApp.views.viewport.removeAll(true);
		SimbaApp.clearDashboardPages();
		SimbaApp.views.viewport.setActiveItem(null);
		SimbaApp.views.viewport.hide();
	}
	if (SimbaApp.views.offlinePanel){
		SimbaApp.views.offlinePanel.show();
	} else {
		var offlineTitle = (Ext.is.Phone) ? 'Cached Pages' : 'MobiiApp';
		SimbaApp.views.offlinePanel = new SimbaApp.views.OfflinePanel({title: offlineTitle});
	}
	if(SimbaApp.views.LoginForm) SimbaApp.views.LoginForm.hide();
};

SimbaApp.onlineLaunch = function(){
	var username = window.localStorage.getItem("username");
	var password = window.localStorage.getItem("password");
	if (!username || !password || !navigator.onLine){
		SimbaApp.views.LoginForm.show();
		// Ext.Msg.alert('Height',SimbaApp.views.LoginForm.getHeight( ));
	} else {
		var maskEl = Ext.getBody();
		var loadMask = new Ext.LoadMask(maskEl, {
			msg: 'Loading...'
		});
		loadMask.show();
		Ext.Ajax.request({
			url   : _urlBase + _validURL,
			method: 'post',
			params: {
				username: username, 
				password : password
			},
			timeout: 5000,
			failure : function(response,opts){
				if(response.status === 404){
					Ext.Ajax.request({
						url   : _urlBase + _validURL,
						method: 'post',
						params: {
							username: username, 
							password : password
						},
						timeout: 5000,
						failure : function(response,opts){
							Ext.Msg.alert('Connection Error','The server is not reachable. Please check your network or contact the server admin. You just can view the saved reports.');
							SimbaApp.offlineLaunch();
						},
						success: function(response, opts) {
							data = Ext.decode(response.responseText,true);
							if (data.errorMessage != null){
								if(data.errorCode && data.errorCode == 'NoGroup'){
									SimbaApp.views.LoginForm.hide();
									SimbaApp.views.createJoinGroupForm();
								} else {
									Ext.Msg.alert('Error',data.errorMessage);
									SimbaApp.views.LoginForm.show();
								}
							} else {
								_userPerm = data.userperm;
								if(_userPerm == 'super admin mobiiapp'){
									SimbaApp.stores.OnlineNavigation.proxy.extraParams.unit_id = 1;
									SimbaApp.stores.MobiiappUnits.load();
								}
								SimbaApp.createNavigation();
								SimbaApp.views.viewport = new SimbaApp.views.Viewport({title: 'MobiiApp'});
								if(SimbaApp.views.LoginForm) SimbaApp.views.LoginForm.hide();
								_offline = false;
							}
							loadMask.destroy();
							loadMask.disable();
						}
					});
				} else {
					Ext.Msg.alert('Connection Error','The server is not reachable. Please check your network or contact the server admin. You just can view the saved reports.');
					SimbaApp.offlineLaunch();
					loadMask.destroy();
					loadMask.disable();
				}
			},
			success: function(response, opts) {
				data = Ext.decode(response.responseText,true);
				if (data.errorMessage != null){
					if(data.errorCode && data.errorCode == 'NoGroup'){
						SimbaApp.views.LoginForm.hide();
						SimbaApp.views.createJoinGroupForm();
					} else {
						Ext.Msg.alert('Error',data.errorMessage);
						SimbaApp.views.LoginForm.show();
					}
				} else {
					_userPerm = data.userperm;
					if(_userPerm == 'super admin mobiiapp'){
						SimbaApp.stores.OnlineNavigation.proxy.extraParams.unit_id = 1;
						SimbaApp.stores.MobiiappUnits.load();
					}
					SimbaApp.createNavigation();
					SimbaApp.views.viewport = new SimbaApp.views.Viewport({title: 'MobiiApp'});
					if(SimbaApp.views.LoginForm) SimbaApp.views.LoginForm.hide();
					_offline = false;
				}
				loadMask.destroy();
				loadMask.disable();
			}
		});
		setTimeout(function(){
			if(! loadMask.isDisabled( )) {
				loadMask.destroy();
				loadMask.disable();
				Ext.Msg.alert('Error','Error while login.');
			}
		},5000);
	}
}

SimbaApp.clearDashboardPages = function(){
	var oldSimbaPageids = [];
	Ext.each(SimbaApp.views.viewport.items.items,function(item,index,allItems){
		if(item.simbapageid) oldSimbaPageids.push(item.simbapageid);
	});
	if(oldSimbaPageids.length > 0){
		for(var i =0; i < oldSimbaPageids.length; i++){
			var oldPage = eval("SimbaApp.views.DashboardPage" + oldSimbaPageids[i]);
			var oldPrompt = eval("SimbaApp.views.Prompts" + oldSimbaPageids[i]);
			if(oldPage){
				if(oldPage) oldPage.destroy();
				if(oldPrompt) oldPrompt.destroy();
			}
		}
	}
};

SimbaApp.createDashboardPage = function(typename, controller, control_id, simbapageid) {
	var oldSimbaPageids = [];
	Ext.each(SimbaApp.views.viewport.items.items,function(item,index,allItems){
		if(item.simbapageid && item.simbapageid !== simbapageid) oldSimbaPageids.push(item.simbapageid);
	});
	if(oldSimbaPageids.length > 0){
		for(var i =0; i < oldSimbaPageids.length; i++){
			var oldPage = eval("SimbaApp.views.DashboardPage" + oldSimbaPageids[i]);
			var oldPrompt = eval("SimbaApp.views.Prompts" + oldSimbaPageids[i]);
			if(oldPage){
				if(oldPage) oldPage.destroy();
				if(oldPrompt) oldPrompt.destroy();
			}
		}
	}

	var dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid);
	var onPagesimbaLoadSuccess = function(response, opts){
		// console.log(response);
		try {
			var data = Ext.decode(response.responseText,true);
			console.log('pagesimba',data.pagesimba);
			if(data.success){
				if(controller === 'file'){
					var dashboardPage = new SimbaApp.views.FilePage({
						cid: control_id, 
						controller: controller,
						typename  : typename,
						pagesimba: data.pagesimba,
						simbapageid: simbapageid
					});
				} else {
					var dashboardPage = new SimbaApp.views.DashboardPage({
						cid: control_id, 
						controller: controller,
						typename  : typename,
						pagesimba: data.pagesimba,
						simbapageid: simbapageid
					});
				}
				SimbaApp.views.viewport.setActiveItem(dashboardPage);
				eval("SimbaApp.views.DashboardPage" + simbapageid + "= dashboardPage;");
			} else {
				if(data.errorCode && data.errorCode == 'InvalidAccount'){
					Ext.Msg.alert('Error',data.errorMessage,SimbaApp.doLogout);
				} else {
					Ext.Msg.alert('Error',data.errorMessage);
				}
			}
		} catch(err) {
			console.log(err);
			Ext.Msg.alert('Error','Error while processing query!');
		}
		loadMask.destroy();
		loadMask.disable();
	};
	
	if(! dashboardPage){
		var maskEl = Ext.getBody();
		var loadMask = new Ext.LoadMask(maskEl, {
			msg: 'Loading...'
		});
		loadMask.show();
		Ext.Ajax.request({
			url   : _urlBase + _pageURL,
			params: {
				controller: controller,
				typename  : typename,
				control_id: control_id,
				username: window.localStorage.getItem("username") || 'demo',
				password: window.localStorage.getItem("password")
			},
			timeout: _defaultTimeout,
			failure : function(response,opts){
				console.log('Failure',response);
				var username = window.localStorage.getItem("username");
				var password = window.localStorage.getItem("password");
				if (!username || !password){
					SimbaApp.views.LoginForm.show();
				} else {
					Ext.Ajax.request({
						url   : _urlBase + _pageURL,
						params: {
							controller: controller,
							typename  : typename,
							control_id: control_id,
							username: window.localStorage.getItem("username") || 'demo',
							password: window.localStorage.getItem("password")
						},
						timeout: _defaultTimeout,
						failure : function(response,opts){
							console.log('Failure',response);
							Ext.Msg.alert('Failed','Error while processing data.');
						},
						success: onPagesimbaLoadSuccess
					});
				}
			},
			success: onPagesimbaLoadSuccess
		});
		setTimeout(function(){
			if(! loadMask.isDisabled( )) {
				loadMask.destroy();
				loadMask.disable();
				Ext.Msg.alert('Timeout','Timeout while processing data.');
			}
		},_defaultTimeout);
	} else if (dashboardPage.isDestroyed) {
		var maskEl = Ext.getBody();
		var loadMask = new Ext.LoadMask(maskEl, {
			msg: 'Loading...'
		});
		loadMask.show();
		setTimeout(function(){
			if(! loadMask.isDisabled( )) {
				loadMask.destroy();
				loadMask.disable();
			}
		},1500);
		if(controller === 'file'){
			dashboardPage = new SimbaApp.views.FilePage({
				cid: dashboardPage.cid, 
				controller: dashboardPage.controller,
				typename  : dashboardPage.typename,
				pagesimba: dashboardPage.pagesimba,
				simbapageid: simbapageid
			});
		} else {
			dashboardPage = new SimbaApp.views.DashboardPage({
				cid: dashboardPage.cid, 
				controller: dashboardPage.controller,
				typename  : dashboardPage.typename,
				pagesimba: dashboardPage.pagesimba,
				simbapageid: simbapageid
			});
		}
		SimbaApp.views.viewport.setActiveItem(dashboardPage);
		SimbaApp.views.viewport.optionsButton.show();
		SimbaApp.views.viewport.commentButton.show();
		eval("SimbaApp.views.DashboardPage" + simbapageid + "= dashboardPage;");
	} else {
		SimbaApp.views.viewport.setActiveItem(dashboardPage);
		if(controller != 'file'){
			SimbaApp.views.viewport.optionsButton.show();
		}
		SimbaApp.views.viewport.commentButton.show();
	}
}

SimbaApp.drillThrough = function(td){
	// console.log('td',td);
	var drillthroughfilters = [];
	var pagecid = td.getAttribute('pagecid');
	var simbapageid = td.getAttribute('simbapageid');
	var reportid = td.getAttribute('reportid');
	var viewname = td.getAttribute('viewname');
	var drillThroughCid = td.getAttribute('drillThroughCid');
	var mapping = td.getAttribute('mapping');
	var rowindex = td.getAttribute('rowindex');
	var value = td.innerText;
	
	
	var srcreport = Ext.getCmp(pagecid + '-' + reportid);
	var tgtreport = Ext.getCmp(pagecid + '-' + drillThroughCid);
	var simbaprompt = eval("SimbaApp.views.Prompts" + simbapageid);
	var simbapage = eval("SimbaApp.views.DashboardPage" + simbapageid);
	
	
	// if(!Ext.is.Blackberry){
		var simbareportOwnerCt = srcreport.ownerCt;
		// var reportsBar = simbareportOwnerCt.reportsBar;
		// var srcbtn = reportsBar.getItemByReportId(reportid);
		// var tgtbtn = reportsBar.getItemByReportId(drillThroughCid);
		// var srcindex = reportsBar.items.items.indexOf(srcbtn);
	// }
	
	var srcreportview = Ext.getCmp(pagecid + '-' + reportid + '-' + viewname);
	if(srcreportview){
		if(srcreportview.pageByForm){
			var pageFilters = srcreportview.pageByForm.getValues();
			Ext.iterate(pageFilters,function(k,v,o){
				if(v !== 'All Pages' && v !== 'All Sections'){
					var pageFilter = {
						formula : srcreport.simba.baseViewInfo.columnInfo[k].encodedformula,
						value   : v
					};
					drillthroughfilters.push(pageFilter);
				}
				
			});
		}
	}
	
	var simbagrid = Ext.getCmp(Ext.get(td).findParent('div.x-simba-grid',50 || document.body,true).id);
	if(simbagrid){
		if(simbagrid.dockedItems.items.length > 0){
			var sectionTds = simbagrid.dockedItems.items[0].getEl().query('td');
			if(sectionTds.length > 0){
				Ext.each(sectionTds,function(sectionTd,index,sectionTds){
					var sectionTdmapping = sectionTd.getAttribute('mapping');
					var sectionTdValue = sectionTd.innerText;
					if(sectionTdValue !== 'All Sections'){
						var sectionFilter = {
							formula : srcreport.simba.baseViewInfo.columnInfo[sectionTdmapping].encodedformula,
							value   : sectionTdValue
						};
						drillthroughfilters.push(sectionFilter);
					}
				});
			}
		}
		var record = simbagrid.items.items[0].store.getAt(rowindex);
		// console.log('record',record);
		// console.log('simbagrid',simbagrid);
		var allTds = simbagrid.getEl().query('td');
		for(var t in allTds){
			if(typeof(allTds[t]) === 'object' && allTds[t].getAttribute('class') == 'x-grid-cell x-grid-hd-cell x-grid-col-' + mapping) {
				var columnTd = allTds[t];
				break;
			}
		}
		// console.log('columnTd',columnTd);
		// console.log('srcreport',srcreport);
		if(columnTd){
			var columnValue = columnTd.innerText;
			// var columnKey = mapping.substring(0,mapping.length-columnValue.length);
			for(var v in srcreport.simba.baseViewInfo.views){
				if(srcreport.simba.baseViewInfo.views[v].viewName == viewname && srcreport.simba.baseViewInfo.views[v].viewType == 'PivotTable'){
					var columnColumns = srcreport.simba.baseViewInfo.views[v].viewInfo.column.columns;
					break;
				}
			}
			if(columnColumns && Ext.isObject(columnColumns)){
				for(var columnKey in columnColumns){
					break;
				}
			}
			// console.log(columnKey,columnValue);
			if(columnKey && columnValue && columnValue != 'Grand Total' && srcreport.simba.baseViewInfo.columnInfo[columnKey]){
				var columnFilter = {
					formula : srcreport.simba.baseViewInfo.columnInfo[columnKey].encodedformula,
					value   : columnValue
				}
				drillthroughfilters.push(columnFilter);
			}
		}
		for(var k in record.data){
			if(record.get(k) === 'Grand Total') break;
			if (srcreport.simba.baseViewInfo.columnInfo[k]){
				var rowFilter = {
					formula : srcreport.simba.baseViewInfo.columnInfo[k].encodedformula,
					value   : record.get(k)
				}
				drillthroughfilters.push(rowFilter);
				if(k === mapping) break;
			}
		}
	}

	var filterValues = simbaprompt.getValues();
	
	for(var pname in simbaprompt.getValues()){
		var pv = simbaprompt.getValues()[pname];
		if(typeof(pv) === 'object' && pv.format){
			filterValues[pname] = pv.format('Y-m-d') + 'T00:00:00.000Z';
		}
	}
	
	
	var maskEl = Ext.getBody();
	var loadMask = new Ext.LoadMask(maskEl, {
		msg: 'Loading...'
	});
	loadMask.show();
	Ext.Ajax.request({
		// url   : _urlBase + 'app/data/loadReportSimba.php',
		url   : _urlBase + _reportURL,
		params: {
			// controller: 'obiee10g',
			controller: simbapage.controller,
			typename  : 'report',
			pagecid    : pagecid,
			reportid  : drillThroughCid,
			promptfilters   : Ext.encode(filterValues),
			drillthroughfilters: Ext.encode(drillthroughfilters),
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password")
		},
		timeout: _defaultTimeout,
		failure : function(response,opts){
			console.log('Failure',response);
			var username = window.localStorage.getItem("username");
			var password = window.localStorage.getItem("password");
			if (!username || !password){
				SimbaApp.views.LoginForm.show();
			} else {
				Ext.Ajax.request({
					// url   : _urlBase + 'app/data/loadReportSimba.php',
					url   : _urlBase + _reportURL,
					params: {
						// controller: 'obiee10g',
						controller: simbapage.controller,
						typename  : 'report',
						pagecid    : pagecid,
						reportid  : drillThroughCid,
						promptfilters   : Ext.encode(filterValues),
						drillthroughfilters: Ext.encode(drillthroughfilters),
						username: window.localStorage.getItem("username") || 'demo',
						password: window.localStorage.getItem("password")
					},
					timeout: _defaultTimeout,
					failure : function(response,opts){
						console.log('Failure',response);
						Ext.Msg.alert('Failed','Error while processing query!');
					},
					success: function(response, opts) {
						var data = Ext.decode(response.responseText,true);
						if(data.success){
							// SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,tgtbtn,reportsBar,data,pagecid,drillThroughCid,reportid,srcindex,srcbtn,simbapageid);
							SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,data,pagecid,drillThroughCid,reportid,simbapageid);
						}
						loadMask.destroy();
						loadMask.disable();
					}
				});
			}
		},
		success: function(response, opts) {
			var data = Ext.decode(response.responseText,true);
			if(data.success){
				// SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,tgtbtn,reportsBar,data,pagecid,drillThroughCid,reportid,srcindex,srcbtn,simbapageid);
				SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,data,pagecid,drillThroughCid,reportid,simbapageid);
			}
			loadMask.destroy();
			loadMask.disable();
		}
	});
	
	setTimeout(function(){
		if(! loadMask.isDisabled( )) {
			loadMask.destroy();
			loadMask.disable();
			Ext.Msg.alert('Timeout','Timeout while processing data.');
		}
	},126000);
};

// SimbaApp.onReportSimbaLoadSuccess = function(srcreport,tgtreport,simbareportOwnerCt,tgtbtn,reportsBar,data,pagecid,drillThroughCid,reportid,srcindex,srcbtn,simbapageid){
SimbaApp.onReportSimbaLoadSuccess = function(srcreport,tgtreport,simbareportOwnerCt,data,pagecid,drillThroughCid,reportid,simbapageid){
	var simbapage = eval("SimbaApp.views.DashboardPage" + simbapageid);
	simbapage.pagesimba.pageReports[drillThroughCid] = data.reportsimba;
	// console.log(simbapage);
	// if(!Ext.is.Blackberry){
		if(tgtreport) simbareportOwnerCt.remove(tgtreport,true);
		// if(tgtbtn) reportsBar.remove(tgtbtn,true);
	// } else {
		// if(tgtreport) tgtreport.destroy();
		// srcreport.destroy();
	// }
	if(simbareportOwnerCt){
		tgtreport = new SimbaApp.views.SimbaReport({
			title : data.reportsimba.caption,
			pagecid: pagecid, 
			simbapageid: simbapageid,
			reportid: drillThroughCid, 
			simba: data.reportsimba,
			drillsrc: reportid,
			drillLevel: srcreport.drillLevel + 1
		});
		simbareportOwnerCt.setActiveItem(tgtreport);
	} else {
		srcreport.hide();
		tgtreport = new SimbaApp.views.SimbaReport({
			title : data.reportsimba.caption,
			pagecid: pagecid, 
			simbapageid: simbapageid,
			reportid: drillThroughCid, 
			simba: data.reportsimba,
			drillsrc: reportid,
			drillLevel: srcreport.drillLevel + 1,
			preview: true, 
			ownerCmp: srcreport,
		});
	}
	// if(!Ext.is.Blackberry){
		// tgtbtn = new Ext.Tab({
			// text: data.reportsimba.caption,
			// reportid: drillThroughCid,
			// handler: function(btn,evt){
				// var report = new SimbaApp.views.SimbaReport({
					// title : data.reportsimba.caption,
					// pagecid: pagecid, 
					// simbapageid: simbapageid,
					// reportid: drillThroughCid, 
					// simba: data.reportsimba,
					// drillsrc: reportid
				// });
				// if(simbareportOwnerCt.getActiveItem()) {
					// var lastBtn = reportsBar.getItemByReportId(simbareportOwnerCt.getActiveItem().reportid);
					// lastBtn.removeCls('x-tab-active');
					// simbareportOwnerCt.getActiveItem().destroy();
				// }
				// simbareportOwnerCt.setActiveItem(report);
				// btn.addCls('x-tab-active');
			// }
		// });
		// tgtbtn.addCls('x-tab-active');
		// reportsBar.insert(srcindex + 1,tgtbtn);
		// srcbtn.removeCls('x-tab-active');
		// reportsBar.doLayout();
		// simbareportOwnerCt.remove(srcreport,true);
		// simbareportOwnerCt.setActiveItem(tgtreport);
	// } else {
		// tgtreport.show();
	// }
};


SimbaApp.chartDrillThrough = function(a){
	// console.log(a);
	var drillthroughfilters = [];
	var pagecid = a.getAttribute('pagecid');
	var simbapageid = a.getAttribute('simbapageid');
	var reportid = a.getAttribute('reportid');
	var viewname = a.getAttribute('viewname');
	var drillThroughCid = a.getAttribute('drillThroughCid');
	if(a.hasAttribute('serieMapping')) var serieMapping = a.getAttribute('serieMapping');
	if(a.hasAttribute('serieValue')) var serieValue = a.getAttribute('serieValue');
	if(a.hasAttribute('categoryMapping')) var categoryMapping = a.getAttribute('categoryMapping');
	if(a.hasAttribute('categoryValue')) var categoryValue = a.getAttribute('categoryValue');
	
	var panelId = a.getAttribute('panelId');
	var itemDetailPanel = Ext.getCmp(panelId);
	if(itemDetailPanel) itemDetailPanel.hide();
	
	var srcreport = Ext.getCmp(pagecid + '-' + reportid);
	var tgtreport = Ext.getCmp(pagecid + '-' + drillThroughCid);
	

	
	var simbaprompt = eval("SimbaApp.views.Prompts" + simbapageid);
	var simbapage = eval("SimbaApp.views.DashboardPage" + simbapageid);
	
	// if(!Ext.is.Blackberry){
		var simbareportOwnerCt = srcreport.ownerCt;
		// var reportsBar = simbareportOwnerCt.reportsBar;
		// var srcbtn = reportsBar.getItemByReportId(reportid);
		// var tgtbtn = reportsBar.getItemByReportId(drillThroughCid);
		// var srcindex = reportsBar.items.items.indexOf(srcbtn);
	// }
	
	var srcreportview = Ext.getCmp(pagecid + '-' + reportid + '-' + viewname);
	if(srcreportview){
		if(srcreportview.pageByForm){
			var pageFilters = srcreportview.pageByForm.getValues();
			Ext.iterate(pageFilters,function(k,v,o){
				if(v !== 'All Pages'&& v !== 'All Sections'){
					var pageFilter = {
						formula : srcreport.simba.baseViewInfo.columnInfo[k].encodedformula,
						value   : v
					};
					drillthroughfilters.push(pageFilter);
				}
				
			});
		}
	}
	
	if(serieMapping && serieValue){
		var serieMappings = serieMapping.split(',');
		var serieValues = serieValue.split(',');
		var serLn = serieMappings.length;
		for(var i = 0; i < serLn; i++){
			var serieFilter = {
				formula : srcreport.simba.baseViewInfo.columnInfo[serieMappings[i]].encodedformula,
				value   : serieValues[i]
			};
			drillthroughfilters.push(serieFilter);
		}
	}
	
	if(categoryMapping && categoryValue){
		var categoryMappings = categoryMapping.split(',');
		var categoryValues = categoryValue.split(',');
		var catLn = categoryMappings.length;
		for(var i = 0; i < catLn; i++){
			var categoryFilter = {
				formula : srcreport.simba.baseViewInfo.columnInfo[categoryMappings[i]].encodedformula,
				value   : categoryValues[i]
			};
			drillthroughfilters.push(categoryFilter);
		}
	}
	
	var filterValues = simbaprompt.getValues();
	
	
	var maskEl = Ext.getBody();
	var loadMask = new Ext.LoadMask(maskEl, {
		msg: 'Loading...'
	});
	loadMask.show();
	Ext.Ajax.request({
		// url   : _urlBase + 'app/data/loadReportSimba.php',
		url   : _urlBase + _reportURL,
		params: {
			// controller: 'obiee10g',
			controller: simbapage.controller,
			typename  : 'report',
			pagecid    : pagecid,
			reportid  : drillThroughCid,
			promptfilters   : Ext.encode(filterValues),
			drillthroughfilters: Ext.encode(drillthroughfilters),
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password")
		},
		timeout: _defaultTimeout,
		failure : function(response,opts){
			console.log('Failure',response);
			var username = window.localStorage.getItem("username");
			var password = window.localStorage.getItem("password");
			if (!username || !password){
				SimbaApp.views.LoginForm.show();
			} else {
				Ext.Ajax.request({
					// url   : _urlBase + 'app/data/loadReportSimba.php',
					url   : _urlBase + _reportURL,
					params: {
						// controller: 'obiee10g',
						controller: simbapage.controller,
						typename  : 'report',
						pagecid    : pagecid,
						reportid  : drillThroughCid,
						promptfilters   : Ext.encode(filterValues),
						drillthroughfilters: Ext.encode(drillthroughfilters),
						username: window.localStorage.getItem("username") || 'demo',
						password: window.localStorage.getItem("password")
					},
					timeout: _defaultTimeout,
					failure : function(response,opts){
						console.log('Failure',response);
						Ext.Msg.alert('Failed','Error while processing query!');
					},
					success: function(response, opts) {
						var data = Ext.decode(response.responseText,true);
						if(data.success){
							// SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,tgtbtn,reportsBar,data,pagecid,drillThroughCid,reportid,srcindex,srcbtn,simbapageid);
							SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,data,pagecid,drillThroughCid,reportid,simbapageid);
						}
						loadMask.destroy();
						loadMask.disable();
					}
				});
			}
		},
		success: function(response, opts) {
			var data = Ext.decode(response.responseText,true);
			if(data.success){
				// SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,tgtbtn,reportsBar,data,pagecid,drillThroughCid,reportid,srcindex,srcbtn,simbapageid);
				SimbaApp.onReportSimbaLoadSuccess(srcreport,tgtreport,simbareportOwnerCt,data,pagecid,drillThroughCid,reportid,simbapageid);
			}
			loadMask.destroy();
			loadMask.disable();
		}
	});
	
	setTimeout(function(){
		if(! loadMask.isDisabled( )) {
			loadMask.destroy();
			loadMask.disable();
			Ext.Msg.alert('Timeout','Timeout while processing data.');
		}
	},126000);
};

SimbaApp.getOwnerbySimbatype = function(cmp,simbatype){
	if((cmp.simbatype && cmp.simbatype == simbatype) || ! cmp.ownerCt){
		return cmp;
	} else {
		return SimbaApp.getOwnerbySimbatype(cmp.ownerCt,simbatype);
	}
};

// SimbaApp.cleanLocalStorage = function(localStorageProxyId){
    // var input = localStorage.getItem(localStorageProxyId);
    // if(input){
        // var splitted = input.split(',');
        // var collector = {};
        // for (i = 0; i < splitted.length; i++) {
            // key = splitted[i].replace(/^\s*/, "").replace(/\s*$/, "");
            // collector[key] = true;
         // }
         // var out = [];
         // for (var key in collector) {
            // if(localStorage.getItem(localStorageProxyId + '-' + key)){
                // out.push(key);
            // }
         // }
         // var output = out.join(',');
         // localStorage.setItem(localStorageProxyId, output);
    // }
// };
// SimbaApp.cleanLocalStorage('offlinenavigation');