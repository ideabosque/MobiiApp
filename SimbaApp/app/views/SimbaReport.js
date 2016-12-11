SimbaApp.views.SimbaReport = Ext.extend(Ext.Panel, {
    layout: 'fit',
	simba : this.simba, 
	simbatype: 'report',
	scroll: false,
	drillLevel: this.drillLevel || 0,
	
    initComponent: function() {
		var me = this;
		me.fullscreen = me.preview ? true : false,
		me.orientation = Ext.getOrientation();
		me.buildTitleToolbar();
		me.buildReportLayout();
		me.id = me.pagecid + '-' + me.reportid;
		me.simbatype = 'simbareport';
		if(me.preview) SimbaApp.views.viewport.hide();
		if(!me.preview){
			me.listeners = {
				el: {
					scope: me,
					taphold: me.onTapHold
				}
			}
		}
        SimbaApp.views.SimbaReport.superclass.initComponent.call(me, arguments);
    },
	
	
	onTapHold: function(e,item){
		// console.log('Taphold');
		// console.log('me',this);
		// console.log('e',e);
		// console.log('item',item);
		var me = this;
		var target = e.target;
		var titleToolbarEl = me.titleToolbar.getEl();
		var tapOnTitleToolbar = false;
		// console.log('titleToolbarEl',titleToolbarEl);
		while (target) {
			var targetEl = Ext.get(target);
			// console.log('targetEl',targetEl);
			if(targetEl == titleToolbarEl){
				tapOnTitleToolbar = true;
				break;
			}
			target = target.parentNode;
		}
		// console.log('tapOnTitleToolbar',tapOnTitleToolbar);
		if(tapOnTitleToolbar){
			me.onTapHoldOnTitleToolbar();
		} else {
			me.onTakeScreenshot();
		}
	},
	
	onTapHoldOnTitleToolbar: function(){
		var viewport = (_offline) ? SimbaApp.views.offlinePanel : SimbaApp.views.viewport,
			me = this,
			simbapageid = me.simbapageid,
			dashboardPage = (_offline) ? viewport.getSimbapageByID(simbapageid) : SimbaApp.views["DashboardPage" + simbapageid],
			oldReportCid = me.reportid,
			store = me.buildReportsListStore(),
			idx = store.findExact('reportCid',oldReportCid);
		var sheet = new Ext.Sheet({
			height  : 200,
			stretchX: true,
			stretchY: true,
			cls: 'x-reportlists-sheet',
			scroll: 'vertical',
			listeners: {
				afterlayout: function(){
					var list = sheet.items.items[0];
					var ehtml = list.getSelectedNodes()[0];
					var el = Ext.get(ehtml);
					var ykor =  el.getY()-60;
					var xkor =  el.getX();
					sheet.scroller.setOffset({
						x: 0,
						y: -ykor
					});
				}
			},
			items: [{
				xtype: 'list',
				allowDeselect: false,
				scroll: false,
				itemTpl: '{reportName}',
				cls: 'x-simbareports-list',
				itemCls: 'carrow',
				store :store,
				listeners: {
					afterrender: function(list){
						list.getSelectionModel().select(idx);
						
					},
					itemtap: function(list,index,item,e){
						var newReportCid = list.getStore().getAt(index).get('reportCid'),
							newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
							newReportTitle = newReportSimba.caption;
						sheet.destroy();
						if(oldReportCid != newReportCid){
							var newReport = new SimbaApp.views.SimbaReport({
								title: dashboardPage.pagesimba.pageReports[newReportCid].caption,
								pagecid: dashboardPage.cid, 
								simbapageid: dashboardPage.simbapageid,
								reportid: newReportCid, 
								simba: dashboardPage.pagesimba.pageReports[newReportCid]
							});
							if(dashboardPage.items.items.length > 0){
								var oldReports = [];
								Ext.each(dashboardPage.items.items,function(item,index,allItems){
									if(item.simbatype && item.id != newReportCid) oldReports.push(item);
								});
								var ln = oldReports.length;
								if(ln > 0){
									for(var i =0; i < ln; i++){
										dashboardPage.remove(oldReports[i],true);
									}
								}
							}
							dashboardPage.setActiveItem(newReport);
						}
						
					}
				}
			}],
			
			dockedItems: [{
				dock : 'top',
				xtype: 'toolbar',
				title: 'Reports',
				items: [{
					xtype: 'button',
					text : 'Cancel',
					handler: function(){
						sheet.destroy();
					}
				},{
					xtype: 'spacer'
				},{
					xtype: 'button',
					text : 'View',
					hidden: true,
					handler: function(btn,e){
						var list = sheet.items.items[0];
						var selectedRecords = list.getSelectedRecords();
						var newReportRecord = selectedRecords[0];
						var newReportCid = newReportRecord.get('reportCid');
						sheet.destroy();
						var newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
							newReportTitle = newReportSimba.caption;
						if(oldReportCid != newReportCid){
							var newReport = new SimbaApp.views.SimbaReport({
								title: dashboardPage.pagesimba.pageReports[newReportCid].caption,
								pagecid: dashboardPage.cid, 
								simbapageid: dashboardPage.simbapageid,
								reportid: newReportCid, 
								simba: dashboardPage.pagesimba.pageReports[newReportCid]
							});
							if(dashboardPage.items.items.length > 0){
								var oldReports = [];
								Ext.each(dashboardPage.items.items,function(item,index,allItems){
									if(item.simbatype && item.id != newReportCid) oldReports.push(item);
								});
								var ln = oldReports.length;
								if(ln > 0){
									for(var i =0; i < ln; i++){
										dashboardPage.remove(oldReports[i],true);
									}
								}
							}
							dashboardPage.setActiveItem(newReport);
						}
					}
				}]
			}]
		});
		sheet.show();
		/*
		var picker = new Ext.Picker({
			slots: [
				{
					name : 'reports_selector',
					title: 'Reports',
					data : store.getRange(),
					displayField: 'reportName',
					valueField: 'reportCid',
					value: me.reportid,
					cls  : 'x-long-picker'
				}
			],
			cls: 'x-long-picker',
			doneButton: new Ext.Button({
				text: 'View',
				handler: function(btn,e){
					var newReportCid = picker.getValue().reports_selector;
					picker.destroy();
					var oldReport = dashboardPage.getActiveItem(),
						newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
						newReportTitle = newReportSimba.caption;
					if(oldReport.reportid != newReportCid){
						var newReport = new SimbaApp.views.SimbaReport({
							title: dashboardPage.pagesimba.pageReports[newReportCid].caption,
							pagecid: dashboardPage.cid, 
							simbapageid: dashboardPage.simbapageid,
							reportid: newReportCid, 
							simba: dashboardPage.pagesimba.pageReports[newReportCid]
						});
						if(dashboardPage.items.items.length > 0){
							var oldReports = [];
							Ext.each(dashboardPage.items.items,function(item,index,allItems){
								if(item.simbatype && item.id != newReportCid) oldReports.push(item);
							});
							var ln = oldReports.length;
							if(ln > 0){
								for(var i =0; i < ln; i++){
									dashboardPage.remove(oldReports[i],true);
								}
							}
						}
						dashboardPage.setActiveItem(newReport);
					}
				}
			})
		});
		picker.show();*/
	},
	
	buildReportsListStore: function(){
		var me = this;
		var store = null;
		var simbapageid = me.simbapageid;
		var viewport = (_offline) ? SimbaApp.views.offlinePanel : SimbaApp.views.viewport;
		var dashboardPage = (_offline) ? viewport.getSimbapageByID(simbapageid) : SimbaApp.views["DashboardPage" + simbapageid];
		if(dashboardPage){
			var pageReports = dashboardPage.pagesimba.pageReports,
				data = [];
			for(var reportcid in pageReports){
				var row = {},
					reportsimba = pageReports[reportcid];
				row['reportName'] = reportsimba.caption;
				row['reportCid'] = reportcid;
				data.push(row);
			}
			var store = new Ext.data.Store({
				fields: ['reportName', 'reportCid'],
				data: data
			});
		}
		return store;
	},
	
	onTakeScreenshot : function(){
		var viewport = SimbaApp.views.viewport;
		var activeItem = viewport.getActiveItem();
		if(_mode == 'native' && window.plugins && window.plugins.screenshot && ! viewport.isHidden()){
			var fileName = new Date().getTime() + '.png';
			window.plugins.screenshot.clearAllScreenshots();
			window.plugins.screenshot.saveScreenshotAsFile(
				[fileName],
				function(result){
					var actionSheet = new Ext.ActionSheet({
						height: 150,
						items: [{
							text: 'Capture Screen to Comment',
							style: {
								'background': '#1985D0',
								'margin-bottom' : '15px'
							},
							handler: function(btn,e){
								actionSheet.destroy();
								_capturedFile = {};
								_capturedFile.fullPath = result;
								_capturedFile.fileName = fileName;
								_capturedFile.simbapageid = activeItem.simbapageid;
								if(viewport.commentPanel == undefined || viewport.commentPanel.isDestroyed){
									viewport.createCommentPanel();
								} 
								viewport.setActiveItem(viewport.commentPanel);
							}
						},{
							text: 'Cancel',
							ui  : 'decline',
							handler: function(btn,e){
								actionSheet.destroy();
								window.plugins.screenshot.deleteSavedScreenshotFile(fileName);
							}
						}]
					});
					actionSheet.show();
				},
				function(error){
					// console.log('Fail','Failed to save screenshot' + error);
					console.log(error);
				}
			);
		}
	},
	
	/*
	buildReportLayout: function(){
		var me = this,
			simbacharttypes = new Array('simbachart','simbapivotchart');
		if(! me.simba.baseViewInfo.hasData){
			me.html = '<span style="color:#D6B80A">No data for the selected catiera.</span>';
			me.items = [];
		} else {
			var items = me.buildReports(me.simba.baseViewInfo.views);
			if(me.simba.baseViewInfo.isViewSelector){
				me.layout = {type: 'card'};
				me.items = [];
				Ext.each(items,function(item,index,items){
					if(simbacharttypes.indexOf(item.simbatype) != -1 && !Ext.is.Phone){
						item.flex = 2;
						var chartitem = {
							id : item.id + '-alt',
							layout: {
								type: 'vbox',
								align: 'stretch',
								pack : 'center'
							},
							items: [{xtype:'spacer',flex: 1},item,{xtype:'spacer',flex: 1}]
						};
						me.items.push(chartitem);
					} else {
						me.items.push(item);
					}
				});
			} else if(items.length === 1) {
				if(simbacharttypes.indexOf(items[0].simbatype) != -1 && !Ext.is.Phone){
					items[0].flex = 2;
					items.unshift({xtype:'spacer',flex: 1});
					items.push({xtype:'spacer',flex: 1});
					me.items = [{
						layout: {
							type: 'vbox',
							align: 'stretch',
							pack : 'center'
						},
						items: items
					}];
				} else {
					me.items = items;
				}
			} else if(items.length === 2) {
				if(!Ext.is.Phone && (simbacharttypes.indexOf(items[0].simbatype) != -1 || simbacharttypes.indexOf(items[1].simbatype) != -1) ){
					me.items = [{
						layout: {
							type: 'vbox',
							align: 'stretch',
							pack : 'center'
						},
						defaults: {flex: 1},
						items: items
					}];
				} else {
					me.items = [{
						xtype   : 'carousel',
						ui      : 'light',
						direction: 'vertical',
						items   : [items]
					}];
				}
			} else {
				me.items = [{
					xtype   : 'carousel',
					ui      : 'light',
					direction: 'vertical',
					items   : []
				}];
				var ln = items.length;
				if(Ext.is.Phone){
					for(var i =0; i < ln; i++){
						me.items[0].items.push(items[i]);
					}
				} else {
					for(var i =0; i < ln; i++){
						var item = {
							layout: {
								type: 'vbox',
								align: 'stretch',
								pack : 'center'
							},
							defaults: {flex: 1}
						};
						if(items[i+1]){
							if(simbacharttypes.indexOf(items[i].simbatype) != -1 || simbacharttypes.indexOf(items[i+1].simbatype) != -1){
								item.items = [items[i],items[i+1]];
								i = i + 1;
							} else {
								item.items = [items[i]];
							}
						} else {
							if(simbacharttypes.indexOf(items[i].simbatype) != -1){
								items[i].flex = 2;
								item.items = [{xtype:'spacer',flex: 1},items[i],{xtype:'spacer',flex: 1}];
							} else {
								item.items = [items[i]];
							}
						}
						me.items[0].items.push(item);
					}
				}
			}
		}
	},
	*/
	/*
	buildReportLayout: function(orientation){
		var me = this,
			orientation = orientation || Ext.getOrientation();
			simbacharttypes = new Array('simbachart','simbapivotchart');
		// console.log('orientation',orientation);
		if(! me.simba.baseViewInfo.hasData){
			me.html = '<span style="color:#D6B80A">No data for the selected catiera.</span>';
			me.items = [];
		} else {
			var items = me.buildReports(me.simba.baseViewInfo.views);
			if(me.simba.baseViewInfo.isViewSelector){
				me.layout = {type: 'card'};
				me.items = [];
				Ext.each(items,function(item,index,items){
					if(simbacharttypes.indexOf(item.simbatype) != -1 && !Ext.is.Phone){
						// item.flex = 2;
						// var chartitem = {
							// id : item.id + '-alt',
							// layout: {
								// type: 'vbox',
								// align: 'stretch',
								// pack : 'center'
							// },
							// items: [{xtype:'spacer',flex: 1},item,{xtype:'spacer',flex: 1}]
						// };
						// me.items.push(chartitem);
						item.margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
						me.items.push(item);
					} else {
						me.items.push(item);
					}
				});
			} else if(items.length === 1) {
				if(simbacharttypes.indexOf(items[0].simbatype) != -1 && !Ext.is.Phone){
					// items[0].flex = 2;
					// items.unshift({xtype:'spacer',flex: 1});
					// items.push({xtype:'spacer',flex: 1});
					// me.items = [{
						// layout: {
							// type: 'vbox',
							// align: 'stretch',
							// pack : 'center'
						// },
						// items: items
					// }];
					// items[0].margin = '10%';
					items[0].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
					me.items = items;
				} else {
					me.items = items;
				}
			} else if(items.length === 2) {
				if(!Ext.is.Phone && (simbacharttypes.indexOf(items[0].simbatype) != -1 && simbacharttypes.indexOf(items[1].simbatype) != -1) ){
				// if(!Ext.is.Phone && orientation == 'portrait' ){
					if(orientation == 'landscape'){
						me.items = [{
							xtype   : 'carousel',
							ui      : 'light',
							direction: 'vertical',
							items   : []
						}];
						for(var i =0; i < items.length; i++){
							if(simbacharttypes.indexOf(items[i].simbatype) != -1){
								// items[i].flex = 2;
								// var chartitem = {
									// id : items[i].id + '-alt',
									// layout: {
										// type: 'vbox',
										// align: 'stretch',
										// pack : 'center'
									// },
									// items: [{xtype:'spacer',flex: 1},items[i],{xtype:'spacer',flex: 1}]
								// };
								// me.items[0].items.push(chartitem);
								// items[i].margin = '10%';
								items[i].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
								me.items[0].items.push(items[i]);
							} else {
								me.items[0].items.push(items[i]);
							}
						}
					} else {
						me.items = [{
							layout: {
								type: 'vbox',
								align: 'stretch',
								pack : 'center'
							},
							defaults: {flex: 1},
							items: items
						}];
					}
				} else {
					me.items = [{
						xtype   : 'carousel',
						ui      : 'light',
						direction: 'vertical',
						items   : []
					}];
					if(Ext.is.Phone){
						me.items[0].items = items;
					} else {
						for(var i =0; i < items.length; i++){
							if(simbacharttypes.indexOf(items[i].simbatype) != -1){
								items[i].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
								me.items[0].items.push(items[i]);
							} else {
								me.items[0].items.push(items[i]);
							}
						}
					}
				}
			} else {
				me.items = [{
					xtype   : 'carousel',
					ui      : 'light',
					direction: 'vertical',
					items   : []
				}];
				var ln = items.length;
				if(Ext.is.Phone){
					for(var i =0; i < ln; i++){
						me.items[0].items.push(items[i]);
					}
				} else if(orientation == 'portrait'){
				// } else {
					for(var i =0; i < ln; i++){
						var item = {
							layout: {
								type: 'vbox',
								align: 'stretch',
								pack : 'center'
							},
							defaults: {flex: 1}
						};
						if(items[i+1]){
							// if(simbacharttypes.indexOf(items[i].simbatype) != -1 || simbacharttypes.indexOf(items[i+1].simbatype) != -1){
							if(simbacharttypes.indexOf(items[i].simbatype) != -1 && simbacharttypes.indexOf(items[i+1].simbatype) != -1){
								item.items = [items[i],items[i+1]];
								i = i + 1;
							} else {
								if(simbacharttypes.indexOf(items[i].simbatype) != -1){
									items[i].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
									item.items = [items[i]];
								} else {
									item.items = [items[i]];
								}
								// item.items = [items[i]];
							}
						} else {
							if(simbacharttypes.indexOf(items[i].simbatype) != -1){
								// items[i].flex = 2;
								// item.items = [{xtype:'spacer',flex: 1},items[i],{xtype:'spacer',flex: 1}];
								// items[i].margin = '10%';
								items[i].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
								item.items = [items[i]];
							} else {
								item.items = [items[i]];
							}
						}
						me.items[0].items.push(item);
					}
				} else {
					for(var i =0; i < ln; i++){
						if(simbacharttypes.indexOf(items[i].simbatype) != -1){
							// items[i].flex = 2;
							// var chartitem = {
								// id : items[i].id + '-alt',
								// layout: {
									// type: 'vbox',
									// align: 'stretch',
									// pack : 'center'
								// },
								// items: [{xtype:'spacer',flex: 1},items[i],{xtype:'spacer',flex: 1}]
							// };
							// me.items[0].items.push(chartitem);
							// items[i].margin = '10%';
							items[i].margin = (orientation=='portrait') ? '100 20 100 0' : '50 0 50 0';
							me.items[0].items.push(items[i]);
						} else {
							me.items[0].items.push(items[i]);
						}
					}
				}
			}
		}
	},
	*/
	
	buildReportLayout: function(orientation){
		var me = this,
			orientation = orientation || Ext.getOrientation();
			simbacharttypes = new Array('simbachart','simbapivotchart');
		if(! me.simba.baseViewInfo.hasData){
			me.html = '<span style="color:#D6B80A">No data for the selected catiera.</span>';
			me.items = [];
		} else {
			var items = me.buildReports(me.simba.baseViewInfo.views);
			if(me.simba.baseViewInfo.isViewSelector){
				me.layout = {type: 'card'};
				me.items = items;
			} else if(items.length === 1) {
				me.items = items;
			} else if(items.length === 2) {
				if(!Ext.is.Phone && orientation == 'portrait' && simbacharttypes.indexOf(items[0].simbatype) != -1 && simbacharttypes.indexOf(items[1].simbatype) != -1){
					me.items = [{
						layout: {
							type: 'vbox',
							align: 'stretch',
							pack : 'center'
						},
						defaults: {flex: 1},
						items: items
					}];
				} else {
					me.items = [{
						xtype   : 'carousel',
						ui      : 'light',
						direction: 'horizontal',
						defaults: {
							style: {'padding-bottom':'20px'}
						},
						items   : items
					}];
				}
			} else {
				me.items = [{
					xtype   : 'carousel',
					ui      : 'light',
					direction: 'horizontal',
					defaults: {
						style: {'padding-bottom':'20px'}
					},
					items   : []
				}];
				var ln = items.length;
				if(Ext.is.Phone || orientation == 'landscape'){
					for(var i =0; i < ln; i++){
						me.items[0].items.push(items[i]);
					}
				} else {
					for(var i =0; i < ln; i++){
						var item = {
							layout: {
								type: 'vbox',
								align: 'stretch',
								pack : 'center'
							},
							defaults: {flex: 1}
						};
						if(items[i+1]){
							if(simbacharttypes.indexOf(items[i].simbatype) != -1 && simbacharttypes.indexOf(items[i+1].simbatype) != -1){
								item.items = [items[i],items[i+1]];
								i = i + 1;
							} else {
								item.items = [items[i]];
							}
						} else {
								item.items = [items[i]];
						}
						me.items[0].items.push(item);
					}
				}
			}
		}
	},
	
	closeSimbaReport: function(btn,e){
		var reportid = btn.pagecid + '-' + btn.reportid;
		var simbareport = Ext.getCmp(reportid);
		simbareport.removeAll(true);
		simbareport.destroy();
		if(btn.ownerCmp){
			btn.ownerCmp.show();
		} else {
			SimbaApp.views.viewport.show();
		}
	},
	
	buildPagingSelectField: function() {
		var me = this;
		return new Ext.form.Select({
			name: "pt-options",
			hidden: true,
			width: 135,
			options: [
				{ text: "Page 1", value: 1 }
			]
		});
	},
	
	buildTitleToolbar: function(){
		var me = this,
			simbaviews = me.simba.baseViewInfo.views;
			items = [];
			
		
		// console.log('me',me);
		if(me.drillLevel != 0 && ! me.preview){
			var backBtn = {
				xtype: 'button',
				iconCls: 'arrow_left',
				height: 33,
				style: {
					background: 'transparent',
					border    : 'none'
				},
				iconMask: true,
				handler: function(btn,e){
					var dashboardPage = eval("SimbaApp.views.DashboardPage" + me.simbapageid);
					// console.log(dashboardPage);
					// var srcReport = new SimbaApp.views.SimbaReport({
						// title: dashboardPage.pagesimba.pageReports[me.drillsrc].caption,
						// pagecid: dashboardPage.cid, 
						// simbapageid: dashboardPage.simbapageid,
						// reportid: me.drillsrc, 
						// simba: dashboardPage.pagesimba.pageReports[me.drillsrc],
						// drillLevel: me.drillLevel - 1
					// });
					dashboardPage.remove(me,true);
					dashboardPage.setActiveItem(me.drillLevel -1);
				}
			}
		}
		if(backBtn != undefined) items.push(backBtn);
		if(me.simba.baseViewInfo.hasColumnSelector){
			Ext.each(simbaviews, function(simbaview,index,allViews){
				if (simbaview.viewType == 'columnSelector') {
					items = items.concat(me.buildColumnSelector(simbaview.viewInfo));
				}
			});
		}
		if(me.simba.baseViewInfo.isViewSelector && me.simba.baseViewInfo.hasData ){
			Ext.each(simbaviews, function(simbaview,index,allViews){
				if (simbaview.viewType == 'viewSelector') {
					items.push(me.buildViewSelector(simbaview));
				}
			});
		}
		
		items.push({
			xtype: 'button',
			text :  me.simba.caption,
			ui   : 'plain',
			cls : 'cusbut',
			style:{
				fontSize: '18px'
			}
		});
		
		// me.pagingSelectField = me.buildPagingSelectField();
		// items.push(me.pagingSelectField);
		
		if(me.preview){
			var closeBtn = {
				xtype: 'button',
				iconCls: 'delete',
				iconMask: true,
				pagecid: me.pagecid,
				reportid: me.reportid,
				ownerCmp: me.ownerCmp,
				handler: me.closeSimbaReport
			};
			items.push({xtype:'spacer'},closeBtn);
		}
		// console.log('pagingSelectField',me.pagingSelectField);
		
    	me.dockedItems = me.dockedItems || [];
		me.titleToolbar = new Ext.Toolbar({
			title: "",
			items: items,
			scroll: 'horizontal'
    	});
		me.dockedItems.unshift(me.titleToolbar);
	},
	
	buildViewSelector: function(viewSelector){
		var me = this,
			options = [],
			subViews = viewSelector.subViews;
		var item = {
			xtype: 'selectfield',
			width: 160,
			name : me.pagecid + '-' + me.reportid + '-' + viewSelector.viewName,
			listeners: {
				change: function(select,value){
					var newCard = Ext.getCmp(me.pagecid + '-' + me.reportid + '-' + value + '-alt') || Ext.getCmp(me.pagecid + '-' + me.reportid + '-' + value);
					me.setActiveItem(newCard);
				}
			}
		};
		Ext.each(subViews,function(view,index,allViews){
			var option = {};
			option.text = view.caption;
			option.value = view.viewName;
			options.push(option);
		});
		item.options = options;
		return item;
	},
	
	buildReports: function(simbaviews){
		var me = this,
			items = [];
		Ext.each(simbaviews, function(simbaview,index,allViews){
			if(simbaview.viewType === 'tableView'){
				var item = new SimbaApp.views.SimbaTable({
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: simbaview
				});
				items.push(item);
				// me.on('afterrender',function(cmp){
					// console.log(cmp);
					// item.enablePaging();
				// });
			} else if (simbaview.viewType == 'pivotTable') {
				var item = new SimbaApp.views.SimbaPivotTable({
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: simbaview
				});
				items.push(item);
			}else if(simbaview.viewType=='chart'){
				var chartitem = new SimbaApp.views.SimbaChart({
					measures: simbaview.viewInfo.measures,
					series: simbaview.viewInfo.series,
					categories: simbaview.viewInfo.categories,
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: simbaview
				});
				items.push(chartitem);		
			} else if(simbaview.viewType === 'mapView'){
				var item = new SimbaApp.views.SimbaMapPanel({
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: simbaview
				});
				items.push(item);
			} else if(simbaview.viewType === 'viewSelector'){
				items = me.buildReports(simbaview.subViews);
			} else if(simbaview.viewType){
				var item = {
					html: '<span style="color:#D6B80A">' + me.pagecid + '-' + me.reportid + '-' + simbaview.viewName + '-' + simbaview.viewType +'</span>'
				};
				items.push(item);
			} 
		});
		return items;
	},
	
	buildColumnSelector: function(viewinfo){
		var me = this,
			items = [],
			selectors = viewinfo.selectors;
		
		for(var columnId in selectors){
			var item = {
				xtype: 'selectfield',
				width: 160,
				name : columnId,
				listeners: {
					change: function(select,value){
						console.log(value,select);
					}
				}
			};
			var options = [];
			Ext.each(selectors[columnId], function(item,index,allItems){
				var option = {};
				var tempArray = item.split('.');
				var text = tempArray.pop();
				if(text.indexOf('"') === 0) text = text.substr(1,text.length - 2);
				option.text = text;
				option.value = item;
				options.push(option);
			});
			item.options = options;
			items.push(item);
		}
		return items;
			
	}
});
