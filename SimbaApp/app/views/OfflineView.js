SimbaApp.WebSQLDb = {};
SimbaApp.WebSQLDb.initDatabase = function(){
	if (window.openDatabase) {
		_mobiiappdb = openDatabase("mobiiappdb", "1.0", "Mobiiapp Cached Pages", 50 * 1024 * 1024);
		if (_mobiiappdb) {
			_mobiiappdb.transaction(function(tx) {
				tx.executeSql("CREATE TABLE IF NOT EXISTS mobiiappdb (id unique, label, path, control_id, controller, simba, cachedtime)",[],function(tx,results){
					// console.log(results);
				});
			});
		} else {
			Ext.Msg.alert('Local Storage','Error occurred trying to open DB');
		}
	} else {
		Ext.Msg.alert('Local Storage','Web Databases not supported');
	}
};

SimbaApp.WebSQLDb.loadRecords = function(){
	_mobiiappdb.transaction(function (tx) {
        tx.executeSql('SELECT * FROM mobiiappdb', [], function (tx, results){
            if(results.rows && results.rows.length){
				var records = []
                for(var i=0; i < results.rows.length; i++){
                    var record = {
                    	'id' : results.rows.item(i).id,
                    	'label': results.rows.item(i).label,
                    	'path' : results.rows.item(i).path,
                    	'control_id': results.rows.item(i).control_id,
                    	'controller': results.rows.item(i).controller,
                    	// 'simba': results.rows.item(i).simba,
						'simba' : '',
						'cachedtime': results.rows.item(i).cachedtime
                    };
                    records.push(record);
                }
				SimbaApp.stores.OfflineNavigation.loadData(records);
            }
        });
    });
};

SimbaApp.WebSQLDb.saveRecord = function(record){
	var id = record['id'], 
		label = record['label'], 
		path = record['path'], 
		control_id = record['control_id'], 
		controller = record['controller'], 
		simba = record['simba'],
		cachedtime = new Date(),
		// cachedtime = dt.format('Y-m-d'),
		dashboardPage = eval("SimbaApp.views.DashboardPage" + id);
	cachedtime = cachedtime.format('Y-m-d H:i:s');
	_mobiiappdb.transaction(function (tx) {
        tx.executeSql('SELECT * FROM mobiiappdb WHERE id = ?', [id], function (tx, results){
			// console.log(results);
            if(results.rows && results.rows.length > 0){
				_mobiiappdb.transaction(function (tx) {
                	tx.executeSql('UPDATE mobiiappdb SET label = ?, path = ?, control_id = ?, controller = ?, simba = ?, cachedtime = ? WHERE id = ? ', [label, path, control_id, controller, simba, cachedtime, id]);
                });
            } else {
				_mobiiappdb.transaction(function (tx) {
					tx.executeSql('INSERT INTO mobiiappdb (id, label, path, control_id, controller, simba, cachedtime) values (?,?,?,?,?,?,?)', [id, label, path, control_id, controller, simba, cachedtime],function(tx,results){
						// console.log(results);
					});
				});
			}
			Ext.Msg.alert('Success','The page is cached successfully!',function(btnText){
				// SimbaApp.views.viewport.setActiveItem(dashboardPage);
				// if(Ext.is.Phone){
					// SimbaApp.views.viewport.backButton.show();
				// }
				SimbaApp.views.viewport.optionsPanel.setValues({
					cachedtime: cachedtime
				});
			});
        });
    });
};

SimbaApp.WebSQLDb.deleteRecord = function(id){
	_mobiiappdb.transaction(function (tx) {
        tx.executeSql('DELETE FROM mobiiappdb WHERE id = ? ', [id], function(tx,results){
			var idx = SimbaApp.stores.OfflineNavigation.findExact('id',id);
			if (idx != -1){
				SimbaApp.stores.OfflineNavigation.removeAt(idx);
			}
		});
    });
};

SimbaApp.views.OfflinePanel = Ext.extend(Ext.Panel, {
    fullscreen: true,
	cls:'offline',
    layout: 'card',
	items: [{
        cls: 'launchscreen',
        html: '<div><p><strong>MobiiApp, the data in your hands.</strong></p></div>'
    }],
    initComponent: function() {
		var me = this;
        me.navigateButton = new Ext.Button({
            hidden: Ext.is.Phone,
            text: 'Navigation',
            handler: function(btn,e) {
                SimbaApp.views.OfflineNavigation.showBy(btn, 'fade');
            }
        });
		
		me.closeButton = new Ext.Button({
			hidden: true,
			iconMask: true,
			iconCls: 'delete',
			handler: me.closePage
		});
		
		me.trashButton = new Ext.Button({
			hidden: true,
			iconMask: true,
			iconCls: 'trash',
			handler: me.removeCachedPage
		});
		
        
        // var btns = [me.navigateButton];
        
		me.settingButton = new Ext.Button({
            iconCls: 'settings',
            iconMask: true,
            handler: function(btn,e){
				// me.closeButton.hide();
				if (SimbaApp.views.Settings){
					SimbaApp.views.Settings.setValues({
						offlinemode: 1
					});
				} else {
					SimbaApp.views.createSettingsForm();
				}
				me.setActiveItem(SimbaApp.views.Settings);
				me.doLayout();
            },
			listeners: {
				hide: function(btn){
					// console.log('setting button hide');
					// SimbaApp.views.offlinePanel.settingButton.show();
					SimbaApp.views.offlinePanel.closeButton.show();
					if(! Ext.is.Phone) SimbaApp.views.offlinePanel.trashButton.show();
					SimbaApp.views.offlinePanel.optionsButton.show();
				},
				show: function(btn){
					// console.log('setting button show');
					SimbaApp.views.offlinePanel.closeButton.hide();
					if(! Ext.is.Phone) SimbaApp.views.offlinePanel.trashButton.hide();
					SimbaApp.views.offlinePanel.optionsButton.hide();
				}
			}
        });
        
		me.optionsButton = new Ext.Button({
			iconCls: 'more',
			iconMask: true,
			hidden: true,
			handler: function(btn,e){
				if(me.optionsPanel == undefined){
					me.createOptionsPanel();
				} 
				me.setActiveItem(me.optionsPanel);
			}
		
		});
		
        // btns.push({xtype: 'spacer'});
        // btns.push(me.settingButton);
		// btns.push(me.closeButton);
		// btns.push(me.trashButton);
		// btns.push(me.optionsButton);
		
		if(Ext.is.Phone){
			var btns = [me.navigateButton,me.closeButton,{xtype: 'spacer'},me.settingButton,me.optionsButton];
		} else {
			var btns = [me.navigateButton,{xtype: 'spacer'},me.settingButton,me.closeButton,me.trashButton,me.optionsButton];
		}
        
        me.toolBar = new Ext.Toolbar({
            id: 'simba-offline-viewport-title-toolbar-id',
            ui: 'dark',
            dock: 'top',
            items: btns.concat(me.buttons || []),
            title: me.title
        });
        
        me.dockedItems = me.dockedItems || [];
        me.dockedItems.unshift(me.toolBar);

        if (!Ext.is.Phone) {
            SimbaApp.views.OfflineNavigation.setWidth(300);
        }

        if (!Ext.is.Phone && Ext.Viewport.orientation == 'landscape') {
            me.dockedItems.unshift(SimbaApp.views.OfflineNavigation);
        } else if (Ext.is.Phone) {
            me.items = this.items || [];
            me.items.unshift(SimbaApp.views.OfflineNavigation);
        }

        SimbaApp.views.Viewport.superclass.initComponent.call(me, arguments);
    },
	
	createOptionsPanel: function(){
		var me = this;
		
		// me.simbaReportsList = new Ext.List({
			// allowDeselect: false,
			// itemTpl: '{reportName}',
			// itemCls: 'carrow',
			// cls: 'x-simbareports-list',
			// onItemDisclosure: true,
			// store: null,
			// scroll: false,
			// listeners: {
				// itemtap: me.onReportItemTap
			// }
		// });
		
		me.optionsPanel =  new Ext.form.FormPanel({
			layout: {
				type:"vbox"
			},
			scroll: false,
			cls : 'x-login-screen',
			items: [{
				xtype: 'fieldset',
				title: 'Cache Information',
				style:{width:'100%'},
				items: [{
					xtype: 'textareafield',
					name: 'path',
					label: 'Path:',
					disabled: true,
					value: ''
				},{
					xtype:'textfield',
					name: 'cachedtime',
					label: 'Cached Time:',
					LableWidth: '40%',
					value:'',
					disabled: true
				// },{
					// xtype:"button",
					// text:"Remove",   
					// cls  : 'demobtn',
					// ui  : 'decline',
					// style: 'margin:2%;',
					// hidden: (Ext.is.Phone) ? false : true,
					// handler: me.removeCachedPage
				}]
			// },{
				// xtype: 'fieldset',
				// id   : 'offline-options-form-reports-list-fieldset',
				// title: 'Reports',
				// hidden: true,
				// style: {width:'100%'},
				// items: [me.simbaReportsList]
			},{
				xtype:"button",
				text:"Remove",   
				cls  : 'demobtn',
				ui  : 'decline',
				// style: 'margin:2%;',
				style: {
					width: '100%'
				},
				hidden: (Ext.is.Phone) ? false : true,
				handler: me.removeCachedPage
			}],
			// dockedItems: [{
				// xtype: 'toolbar',
				// dock: 'bottom',
				// items:[{
					// xtype: 'spacer'
				// },{
					// text: 'Back',
					// handler: me.backToPage
				// }]
			// }],
			listeners:{
				activate: me.onOptionsFormActivate
			}
		});
	},
	
	closePage: function(btn,e){
		if(SimbaApp.views.offlinePanel.getActiveItem() == SimbaApp.views.offlinePanel.optionsPanel){
			SimbaApp.views.offlinePanel.backToPage();
			return false;
		}
		var selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords();
		var currentPage;
		if(selectedRecords.length > 0){
			var simbapageid = selectedRecords[0].get('id'),
				items = SimbaApp.views.offlinePanel.items.items,
				len = items.length;
			for(var i = 0; i < len; i ++){
				var item = items[i];
				if(item.simbapageid && item.simbapageid == simbapageid && item.simbatype){
					currentPage = item;
					break;
				}
			}
			if(currentPage){
				SimbaApp.views.offlinePanel.remove(currentPage,true);
				SimbaApp.views.offlinePanel.setActiveItem(null);
				SimbaApp.views.offlinePanel.settingButton.show();
				// SimbaApp.views.offlinePanel.closeButton.hide();
				// SimbaApp.views.offlinePanel.trashButton.hide();
				// SimbaApp.views.offlinePanel.optionsButton.hide();
			}
			SimbaApp.views.OfflineNavigation.items.items[0].deselect(selectedRecords[0]);
		}
		var title = (Ext.is.Phone) ? 'Cached Pages' : 'MobiiApp';
		SimbaApp.views.offlinePanel.toolBar.setTitle(title);
	},
	
	removeCachedPage: function(btn,e){
		var selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords();
		var currentPage;
		if(selectedRecords.length > 0){
			var simbapageid = selectedRecords[0].get('id'),
				items = SimbaApp.views.offlinePanel.items.items,
				len = items.length;
			for(var i = 0; i < len; i ++){
				var item = items[i];
				if(item.simbapageid && item.simbapageid == simbapageid){
					currentPage = item;
					break;
				}
			}
			var idx = SimbaApp.stores.OfflineNavigation.findExact('id',simbapageid);
			if (idx != -1){
				Ext.Msg.confirm("Confirmation", "Are you sure you want to remove the item?", function(buttonText){
					if(buttonText == 'yes'){
						SimbaApp.WebSQLDb.deleteRecord(simbapageid);
						if (currentPage) {
							SimbaApp.views.offlinePanel.remove(currentPage,true);
						}
						SimbaApp.views.offlinePanel.setActiveItem(null);
						SimbaApp.views.offlinePanel.settingButton.show();
						// SimbaApp.views.offlinePanel.closeButton.hide();
						// SimbaApp.views.offlinePanel.trashButton.hide();
						// SimbaApp.views.offlinePanel.optionsButton.hide();
					}
				});				
			}
		}
		var title = (Ext.is.Phone) ? 'Cached Pages' : 'MobiiApp';
		SimbaApp.views.offlinePanel.toolBar.setTitle(title);
	},
	
	removeListedItems: function(btn,e){
		var selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords();
		var currentPage;
		var selectedRecordsLength = selectedRecords.length; // to be deleted
		var simbapageid = Array(),idx = Array();
		Ext.Msg.confirm("Confirmation", "Are you sure you want to remove the items?",function(buttonText){
			if(buttonText == 'yes'){
				for(var i=0;i<selectedRecordsLength;i++){
					simbapageid[i] = selectedRecords[i].get('id');
					idx[i] = SimbaApp.stores.OfflineNavigation.findExact('id',simbapageid[i]);
					SimbaApp.WebSQLDb.deleteRecord(simbapageid[i]);
				}
			}
			SimbaApp.views.offlinePanel.setActiveItem(null);
			SimbaApp.views.offlinePanel.settingButton.show();
		});
		var title = (Ext.is.Phone) ? 'Cached Pages' : 'MobiiApp';
		SimbaApp.views.offlinePanel.toolBar.setTitle(title);
	},
	
	backToPage: function(btn,e){
		var selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords();
		var currentPage;
		if(selectedRecords.length > 0){
			// var simbapageid = selectedRecords[0].get('id'),
				// items = SimbaApp.views.offlinePanel.items.items,
				// len = items.length;
			// for(var i = 0; i < len; i ++){
				// var item = items[i];
				// if(item.simbapageid && item.simbapageid == simbapageid){
					// currentPage = item;
					// break;
				// }
			// }
			var simbapageid = selectedRecords[0].get('id');
			var currentPage = SimbaApp.views.offlinePanel.getSimbapageByID(simbapageid);
			if(currentPage){
				SimbaApp.views.offlinePanel.setActiveItem(currentPage);
				// SimbaApp.views.offlinePanel.settingButton.show();
				// SimbaApp.views.offlinePanel.optionsButton.hide();
			}
		}
	},
	
	getSimbapageByID: function(simbapageid){
		var items = SimbaApp.views.offlinePanel.items.items,
			len = items.length,
			simbapage;
		for(var i = 0; i < len; i ++){
			var item = items[i];
			if(item.simbapageid && item.simbapageid == simbapageid){
				simbapage = item;
				break;
			}
		}
		return simbapage;
	},
	
	onOptionsFormActivate: function(optionForm){
		var me = SimbaApp.views.offlinePanel;
		var selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords();
		if(selectedRecords.length > 0){
			var path = selectedRecords[0].get('path'),
				cachedtime = selectedRecords[0].get('cachedtime'),
				simbapageid = selectedRecords[0].get('id');
				// fieldset = Ext.getCmp('offline-options-form-reports-list-fieldset'),
				// dashboardPage = me.getSimbapageByID(simbapageid);
			// console.log('cachedtime',cachedtime.format('Y-m-d H:i:s'));
			optionForm.setValues({
				path: path,
				cachedtime: cachedtime
			});
			// if(fieldset) fieldset.hide();
			// if(dashboardPage && dashboardPage.simbatype != 'filepage'){
				// var checkedIdx = me.buildReportsList(dashboardPage);
			// }
			optionForm.srcsimbapageid = simbapageid;
		}
		// optionForm.scroller.updateBoundary();
		
		optionForm.doLayout();
		// if(checkedIdx != undefined){
			// me.simbaReportsList.getSelectionModel().select(checkedIdx);
		// }
	},
	/*
	buildReportsList: function(dashboardPage){
		var pageReports = dashboardPage.pagesimba.pageReports,
			fieldset = Ext.getCmp('offline-options-form-reports-list-fieldset'),
			// i = 0,
			activeReport = dashboardPage.getActiveItem(),
			reportsList = [];
		
		for(var reportcid in pageReports){
			var report = {},
				reportsimba = pageReports[reportcid];
			report['label'] = reportsimba.caption;
			report['value'] = reportcid;
			if(activeReport.reportid==reportcid) report['checked'] = true;
			reportsList.push(report);
			// i ++;
		}
		if(fieldset){
			fieldset.removeAll(true);
			fieldset.add(reportsList);
			fieldset.doLayout();
			fieldset.show();
		}
		// console.log(reportsList);
	},
	*/
	/*
	buildReportsList: function(dashboardPage,select){
		var me = this,
			pageReports = dashboardPage.pagesimba.pageReports,
			activeReport = dashboardPage.getActiveItem(),
			fieldset = Ext.getCmp('offline-options-form-reports-list-fieldset'),
			i=0,
			checkedIdx = 0,
			data = [],
			select = (select == undefined) ? true : select;
		if(fieldset) fieldset.show();
		for(var reportcid in pageReports){
			var row = {},
				reportsimba = pageReports[reportcid];
			row['reportName'] = reportsimba.caption;
			row['reportCid'] = reportcid;
			data.push(row);
			if(activeReport.reportid==reportcid) checkedIdx = i;
			i = i + 1;
		}
		var store = new Ext.data.Store({
			fields: ['reportName', 'reportCid'],
			data: data
		});
		me.simbaReportsList.bindStore(store);
		if(select) {
			// me.simbaReportsList.getSelectionModel().select(i-1);
			me.simbaReportsList.getSelectionModel().select(checkedIdx,false,false);
		}
		// me.simbaReportsList.getEl().repaint();
		return checkedIdx;
	},
	
	onReportItemTap: function(list,index,item,e){
		var me = SimbaApp.views.offlinePanel,
			selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords(),
			store = list.getStore(),
			totalReports = store.getCount(),
			newReportCid = store.getAt(index).get('reportCid');
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id'),
				dashboardPage = me.getSimbapageByID(simbapageid),
				oldReport = dashboardPage.getActiveItem();
			if(oldReport.reportid != newReportCid){
				var newReport = new SimbaApp.views.SimbaReport({
					title: dashboardPage.pagesimba.pageReports[newReportCid].caption,
					pagecid: dashboardPage.cid, 
					simbapageid: dashboardPage.simbapageid,
					reportid: newReportCid, 
					simba: dashboardPage.pagesimba.pageReports[newReportCid]
				});
				me.setActiveItem(dashboardPage);
				dashboardPage.remove(oldReport,true);
				dashboardPage.setActiveItem(newReport);
				if(dashboardPage.controlBar){
					var preButton = dashboardPage.controlBar.items.items[0],
						nextButton = dashboardPage.controlBar.items.items[2];
					if(index == 0){
						preButton.hide();
						if(totalReports > 1) nextButton.show();
					} else if(index == totalReports -1){
						nextButton.hide();
						if(totalReports>1) preButton.show();
					} else {
						preButton.show();
						nextButton.show();
					}
				}
			} else {
				me.setActiveItem(dashboardPage);
			}
		}
	},*/
	/*
	onReportItemCheck: function(radiofield){
		var me = SimbaApp.views.offlinePanel,
			selectedRecords = SimbaApp.views.OfflineNavigation.items.items[0].getSelectedRecords(),
			newReportCid = radiofield.getValue();
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id'),
				dashboardPage = me.getSimbapageByID(simbapageid),
				oldReport = dashboardPage.getActiveItem();
			// console.log(dashboardPage);
			if(oldReport.reportid != newReportCid){
				var newReport = new SimbaApp.views.SimbaReport({
					title: dashboardPage.pagesimba.pageReports[newReportCid].caption,
					pagecid: dashboardPage.cid, 
					simbapageid: dashboardPage.simbapageid,
					reportid: newReportCid, 
					simba: dashboardPage.pagesimba.pageReports[newReportCid]
				});
				me.setActiveItem(dashboardPage);
				dashboardPage.remove(oldReport,true);
				dashboardPage.setActiveItem(newReport);
			} else {
				me.setActiveItem(dashboardPage);
			}
			// if(Ext.is.Phone){
				// SimbaApp.views.viewport.backButton.show();
			// }
		}
	},*/
    
    setTitle: function(title){
    	var me = this;
    	me.toolBar.setTitle(title);
    },
    
    layoutOrientation: function(orientation, w, h) {
		// console.log('width',w);
    	var me = this;
		var win = window,
			d = document,
			e = d.documentElement,
			g = d.getElementsByTagName('body')[0],
			x = win.innerWidth||e.clientWidth||g.clientWidth,
			y = win.innerHeight||e.clientHeight||g.clientHeight;
		var activeItem = me.getActiveItem();
		if(activeItem){
			if(activeItem.simbatype === 'filepage'){
				var imgViewer = Ext.getCmp('filepage_imgviewer_' + activeItem.cid);
				imgViewer.onImageReLoad();
			}
		}
        if (!Ext.is.Phone) {
			if(activeItem){
				if(activeItem.simbatype === 'simbapage'){
					var activeReport = activeItem.getActiveItem();
					if(activeReport.orientation != orientation){
						// console.log(Ext.ComponentMgr.all.length);
						// activeItem.remove(activeReport,true);
						activeReport.destroy();
						var newReport = new SimbaApp.views.SimbaReport({
							title: activeReport.simba.caption,
							pagecid: activeReport.pagecid, 
							simbapageid: activeReport.simbapageid,
							reportid: activeReport.reportid, 
							simba: activeReport.simba
						});
						// activeItem.setActiveItem(newReport);
					} else {
						var newReport = activeReport;
					}
				}
			}
            if (orientation == 'portrait') {
                SimbaApp.views.OfflineNavigation.hide(false);
                me.removeDocked(SimbaApp.views.OfflineNavigation, false);
                if (SimbaApp.views.OfflineNavigation.rendered) {
                    SimbaApp.views.OfflineNavigation.el.appendTo(document.body);
                }
                SimbaApp.views.OfflineNavigation.setFloating(true);
				SimbaApp.views.OfflineNavigation.items.items[0].setHeight(650);
                SimbaApp.views.OfflineNavigation.setHeight(750);
                me.toolBar.items.get(0).show(false);
            } else {
                SimbaApp.views.OfflineNavigation.setFloating(false);
                SimbaApp.views.OfflineNavigation.show(false);
                me.toolBar.items.get(0).hide(false);
                me.insertDocked(0, SimbaApp.views.OfflineNavigation);
				// var ownerHeight = SimbaApp.views.OfflineNavigation.getHeight();
				SimbaApp.views.OfflineNavigation.setHeight(y);
				SimbaApp.views.OfflineNavigation.items.items[0].setHeight(y - 100);
            }
            // me.toolBar.doComponentLayout();
			if(newReport != undefined) activeItem.setActiveItem(newReport);
        } else {
			SimbaApp.views.OfflineNavigation.items.items[0].setWidth(x);
			if(SimbaApp.views.OfflineNavigation.dockedItems.items[1].hidden){
				SimbaApp.views.OfflineNavigation.items.items[0].setHeight(y-42);
			} else {
				SimbaApp.views.OfflineNavigation.items.items[0].setHeight(y-42*2);
			}
		}
		// console.log(Ext.ComponentMgr.all.length);
        SimbaApp.views.Viewport.superclass.layoutOrientation.call(me, orientation, w, h);
    }
});


SimbaApp.createOfflineNavigation = function(){
	SimbaApp.WebSQLDb.initDatabase();
	if(SimbaApp.views.OfflineNavigation){
		SimbaApp.WebSQLDb.loadRecords();
	} else {
		SimbaApp.WebSQLDb.loadRecords();
		
		var offlineNavigationList = new Ext.List({
			store: SimbaApp.stores.OfflineNavigation,
			allowDeselect: true,
			simpleSelect: true,
			// multiSelect : false,
			// itemTpl: '<p class="x-list-item-text">{label}</p><p><div style="float: right; width: 45px; height: 30px" id="offlineitem-list-info-{id}"></div><div style="float: right; width: 45px; height: 30px" id="offlineitem-list-delete-{id}"></div></p>',
			// itemTpl: '<p>{label}</p>',
			itemTpl: "<div class='item-frame' tabindex='0'>"+
						"<div class='item-date' align='right'>{cachedtime}</div>"+
						"<div class='item-title'>{label}</div>"+
						"<div>"+
							"<div class='fl'></div>"+
							"<div class='Ye Wk' dir='ltr'>{path:ellipsis(40,true)}</div>"+
						"</div>"+
					  "</div>",
			emptyText: 'No cached report',
			//style: {'background-color':'#2c2d31'},
			// ui: 'light',
			// ui: 'offline',
			// tapText: function(list,index,item,e){
				// var store = list.getStore(),
					// record = store.getAt(index),
					// simbapageid = record.get('id'),
					// activeItem = SimbaApp.views.offlinePanel.getActiveItem();
				// if (activeItem && activeItem.simbatype == 'simbapage'){
					// if (activeItem.simbapageid != simbapageid){
						// activeItem.destroy();
						// var dashboardPage = new SimbaApp.views.DashboardPage({
							// cid: record.get('control_id'), 
							// controller: record.get('controller'),
							// typename  : 'page',
							// pagesimba: Ext.decode(record.get('simba')),
							// simbapageid: simbapageid
						// });
						// SimbaApp.views.offlinePanel.setActiveItem(dashboardPage);
						// if (Ext.is.Phone) {
							// SimbaApp.views.offlinePanel.closeButton.show();
						// }
						// dashboardPage.doLayout();
					// }
				// } else {
					// var dashboardPage = new SimbaApp.views.DashboardPage({
						// cid: record.get('control_id'), 
						// controller: record.get('controller'),
						// typename  : 'page',
						// pagesimba: Ext.decode(record.get('simba')),
						// simbapageid: simbapageid
					// });
					// SimbaApp.views.offlinePanel.setActiveItem(dashboardPage);
					// if (Ext.is.Phone) {
						// SimbaApp.views.offlinePanel.closeButton.show();
					// }
					// dashboardPage.doLayout();
				// }
			// },
			// tapTrash: function(list,index,item,e){
				// Ext.Msg.confirm("Confirmation", "Are you sure you want to delete the item?", function(buttonText){
					// if(buttonText == 'yes'){
						// var store = list.getStore(),
							// record = store.getAt(index),
							// id = record.get('id');
						// SimbaApp.WebSQLDb.deleteRecord(id);
					// }
				// });
			// },
			// tapInfo: function(list,index,item,e){
				// var store = list.getStore(),
					// record = store.getAt(index),
					// path = record.get('path');
				// list.itemInfoPanel.update('Path: ' + path);
			// },
			// itemInfoPanel: new Ext.Panel({
				// floating: true,
				// width: 300,
				// height: 200,
				// centered: true,
				// modal: true,
				// hideOnMaskTap: true,
				// html: ''
			// }),
			listeners: {
				beforeselect: function(list,node,selections){
					console.log('list',list);
					console.log('node',node);
					console.log('selections',selections);
				},
				itemtap: function(list,index,item,e){
					// return;
					var delbtn = SimbaApp.views.OfflineNavigation.dockedItems.items[1].items.items[2];
					if(delbtn.isHidden()){
						// var maskEl = Ext.getBody();
						// var loadMask = new Ext.LoadMask(maskEl, {
							// msg: 'Loading...'
						// });
						// loadMask.show();
						var thisList = SimbaApp.views.OfflineNavigation.items.items[0];   
						var listlength = thisList.store.data.items.length;
						var dellist = new Array(listlength);
						for(var i=0;i<listlength;i++){
							dellist[i] = i;
						}
						dellist.splice(index,1);
						for(var i=0;i<dellist.length;i++){
							list.deselect(dellist[i]);
						}
						var store = list.getStore(),
							record = store.getAt(index),
							simbapageid = record.get('id'),
							controller = record.get('controller'),
							activeItem = SimbaApp.views.offlinePanel.getActiveItem(),
							dashboardPageBase = {
								cid: record.get('control_id'), 
								controller: record.get('controller'),
								typename  : 'page',
								// pagesimba: Ext.decode(record.get('simba')),
								simbapageid: simbapageid
							};
						if (activeItem && activeItem.simbapageid && activeItem.simbapageid != simbapageid){
							activeItem.destroy();
						} else if(activeItem && ((activeItem.simbapageid && activeItem.simbapageid == simbapageid) || (activeItem == SimbaApp.views.offlinePanel.optionsPanel && activeItem.srcsimbapageid == simbapageid))){
							var el = new Ext.Element(item);
							el.addCls('x-item-selected');
							list.refresh();
							return;
						}
						var maskEl = Ext.getBody();
						var loadMask = new Ext.LoadMask(maskEl, {
							msg: 'Loading...'
						});
						loadMask.show();
						_mobiiappdb.transaction(function (tx) {
							tx.executeSql('SELECT simba FROM mobiiappdb WHERE id = ? ', [simbapageid], function (tx, results){
								if(results.rows && results.rows.length){
									for(var i=0; i < results.rows.length; i++){
										var simba = results.rows.item(i).simba;
										break;
									}
									dashboardPageBase.pagesimba = Ext.decode(simba);
									if(controller == 'file'){
										var dashboardPage = new SimbaApp.views.FilePage(dashboardPageBase);
									} else {
										var dashboardPage = new SimbaApp.views.DashboardPage(dashboardPageBase);
									}
									SimbaApp.views.offlinePanel.setActiveItem(dashboardPage);
									dashboardPage.doLayout();
									SimbaApp.views.offlinePanel.settingButton.hide();
									var toolBar = SimbaApp.views.offlinePanel.toolBar;
									var label = record.get('label');
									if (label.length > 15 && Ext.is.Phone) {
										toolBar.setTitle(label.substring(0,12) + '...');
									} else {
										toolBar.setTitle(label);
									}
									if(!Ext.is.Phone && Ext.Viewport.orientation == 'portrait') SimbaApp.views.OfflineNavigation.hide();
									loadMask.destroy();
									loadMask.disable();
								}
							});
						});
						
						setTimeout(function(){
							if(! loadMask.isDisabled( )) {
								loadMask.destroy();
								loadMask.disable();
							}
						},1500);
						// SimbaApp.views.offlinePanel.closeButton.show();
						// SimbaApp.views.offlinePanel.trashButton.show();
						// SimbaApp.views.offlinePanel.optionsButton.show();
						// list.tapText(list,index,item,e);
						// var targetClassList = e.target.classList;
						// for (var i in targetClassList){
							// if(targetClassList[i] == 'trash'){
								// list.tapTrash(list,index,item,e);
								// break;
							// } else if(targetClassList[i] == 'info'){
								// list.tapInfo(list,index,item,e);
								// break;
							// } else {
								// list.tapText(list,index,item,e);
								// break;
							// }
						// }
					}
				},
				update: function(){
					var store = SimbaApp.stores.OfflineNavigation;
					var deleteToolbar = SimbaApp.views.OfflineNavigation.dockedItems.items[1];
					var editBtn = deleteToolbar.items.items[0];
					var editBtnEl = editBtn.getEl();
					var deleteBtn = deleteToolbar.items.items[2];
					if(store.getCount() == 0){
						editBtn.setText('Edit');
						editBtnEl.setStyle('background','#2B2B2B');
						deleteBtn.hide();
						deleteToolbar.hide();
						if(Ext.is.Phone){
							var win = window,
								d = document,
								e = d.documentElement,
								g = d.getElementsByTagName('body')[0],
								x = win.innerWidth||e.clientWidth||g.clientWidth,
								y = win.innerHeight||e.clientHeight||g.clientHeight;
							offlineNavigationList.setHeight(y-42);
						}
					} else {
						deleteToolbar.show();
						if(Ext.is.Phone){
							var win = window,
								d = document,
								e = d.documentElement,
								g = d.getElementsByTagName('body')[0],
								x = win.innerWidth||e.clientWidth||g.clientWidth,
								y = win.innerHeight||e.clientHeight||g.clientHeight;
							offlineNavigationList.setHeight(y-42*2);
						}
					}
					
					SimbaApp.views.OfflineNavigation.doLayout();
					// if(SimbaApp.views.offlinePanel){
						// SimbaApp.views.offlinePanel.doLayout();
					// }
				}
				// afterrender : function(list){
					// this.isAfterrendered = true;
				// },
				// update: function(){
					// var me = this;
					// var store = SimbaApp.stores.OfflineNavigation;
					// if(this.isAfterrendered && store.getCount() > 0){
						// Ext.each(store.data.items, function(arrayItem,index){
							// var infoBtn = Ext.getCmp('offlineitem-list-info-btn-' + arrayItem.data.id),
								// delBtn = Ext.getCmp('offlineitem-list-delete-btn-' + arrayItem.data.id);
							// if (infoBtn) infoBtn.destroy();
							// if (delBtn) delBtn.destroy();
							// new Ext.Button({
								// id: 'offlineitem-list-info-btn-' + arrayItem.data.id,
								// iconMask : true,
								// ui : 'action', 
								// iconCls : 'info',
								// renderTo : 'offlineitem-list-info-' + arrayItem.data.id,
								// handler: function(btn,e){
									// me.itemInfoPanel.showBy(btn,'fade');
								// }
							// });
							// new Ext.Button({
								// id: 'offlineitem-list-delete-btn-' + arrayItem.data.id,
								// iconMask : true,
								// ui : 'action', 
								// iconCls : 'trash',
								// renderTo : 'offlineitem-list-delete-' + arrayItem.data.id
							// });
						// });
						
					// }
				// }
			}
		});
		
		var titleToolbar = {
			xtype: 'toolbar',
			title : 'Cached Pages',
			hidden: (Ext.is.Phone) ? true : false,
			ui:'light'
		};
		
		var deleteToolbar = {
			xtype:'toolbar',
			ui: 'light',
			dock: 'bottom',
			// hidden: (SimbaApp.stores.OfflineNavigation.getCount() == 0) ? true : false,
			items:[{
				xtype: 'button',
				text: 'Edit',
				// ui: 'confirm',
				handler: function(btn,e) {
					var delbtn = SimbaApp.views.OfflineNavigation.dockedItems.items[1].items.items[2];
					var rptlistlength = SimbaApp.views.OfflineNavigation.items.items[0].store.data.items.length;
					var curlist = SimbaApp.views.OfflineNavigation.items.items[0];
					// var selMode = SimbaApp.views.OfflineNavigation.items.items[0].getSelectionModel();
					var el = btn.getEl();
					if(delbtn.isHidden()){
						SimbaApp.views.offlinePanel.closePage();
						delbtn.show();
						// btn.addCls('x-button-confirm');
						el.setStyle('background','#3C7EE6');
						btn.setText('Done');
					}else{
						delbtn.hide();
						// Deselect all reports
						for(var i=0;i<rptlistlength;i++){
							curlist.deselect(i);
						}
						// btn.removeCls('x-button-confirm');
						btn.setText('Edit');
						el.setStyle('background','#2B2B2B');
					}
				}
			},{
				xtype: 'spacer'
			},{
				xtype: 'button',
				text: 'Delete',
				hidden: true,
				handler: function(){
					var returnArray = [];
					var thisList = SimbaApp.views.OfflineNavigation.items.items[0];
					var selectedRecords = thisList.getSelectedRecords();
					if(!selectedRecords.length == 0){
						SimbaApp.views.offlinePanel.removeListedItems();
						thisList.refresh();
					}
					if(!Ext.is.Phone && Ext.getOrientation() == 'portrait'){
						SimbaApp.views.OfflineNavigation.hide();
					}
				}
			}]
		};
		
		SimbaApp.views.OfflineNavigation = new Ext.Panel({
			cls:'offline',
			dock: 'left',
		//	style: {'background-color':'#2c2d31'},
			dockedItems: [titleToolbar,deleteToolbar],
			items: [offlineNavigationList]
		});
	}
}
