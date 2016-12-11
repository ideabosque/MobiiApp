SimbaApp.views.SimbaReportEditor = Ext.extend(Ext.Panel, {
    layout: 'card',
	simba : this.simba,
	scroll: false,
	
    initComponent: function() {
		var me = this;
		me.buildFrontPanel();
		me.submitValues = {
			columns: {},
			views: []
		};
		me.items = [me.frontPanel];
        SimbaApp.views.SimbaReportEditor.superclass.initComponent.call(me, arguments);
    },
	
	buildFrontPanel: function(){
		var me = this;
		
		var title = me.title;
		if(title.length > 15){
			title = title.substring(0,12) + '...';
		} 
		var titleToolbar = me.titleToolbar = new Ext.Toolbar({
			title: title,
			dock: 'top',
			items: [{
				text: 'Cancel',
				ui  : 'back',
				handler: function(btn,e){
					var viewport = SimbaApp.views.viewport;
					viewport.show();
					viewport.setActiveItem(viewport.optionsPanel);
					me.destroy();
				}
			},{
				xtype: 'spacer'
			},{
				iconCls: 'add',
				iconMask: true,
				style: {
					'background' : 'transparent'
				},
				handler: function(btn,e){
					me.buildViewEditorPanel();
				}
			}]
		});
		var previewSaveFieldset = me.buildPrevieSaveFieldset();
		var viewsFieldset = me.buildViewsItems();
		var columnsFieldset = me.buildColumnsItems();
		
		me.frontPanel = new Ext.form.FormPanel({
			layout: 'vbox',
			simba : me.simba,
			scroll: 'vertical',
			cls: 'x-login-screen',
			dockedItems: [titleToolbar],
			items: [previewSaveFieldset, viewsFieldset,columnsFieldset],
			previewSaveFieldset : previewSaveFieldset,
			columnsFieldset : columnsFieldset,
			viewsFieldset : viewsFieldset
		});
	},
	
	buildPrevieSaveFieldset: function(){
		var me = this;
		var validateButton = new Ext.Button({
			style: {width: '100%;',margin:'1%'},
			text: 'Preview',
			handler: function(btn,e){
				me.onReportEditDone('validate',btn);
			},
			listeners: {
				show: function(btn){
					me.previewing = false;
					var editButton = btn.ownerCt.editButton;
					var saveButton = btn.ownerCt.saveButton;
					editButton.hide();
					saveButton.hide();
					me.frontPanel.enable();
					me.titleToolbar.items.items[2].enable();
					me.frontPanel.viewsFieldset.publishedViewsListFieldset.sortable.enable();
					btn.ownerCt.doLayout();
				},
				hide: function(btn){
					me.previewing = true;
					var editButton = btn.ownerCt.editButton;
					var saveButton = btn.ownerCt.saveButton;
					editButton.show();
					saveButton.show();
					me.frontPanel.disable();
					me.titleToolbar.items.items[2].disable();
					me.frontPanel.viewsFieldset.publishedViewsListFieldset.sortable.disable();
					btn.ownerCt.doLayout();
				}
			}
		});
		
		var editButton = new Ext.Button({
			style: {width: '100%;',margin:'1%'},
			text: 'Edit',
			hidden: true,
			handler: function(btn,e){
				var validateButton = btn.ownerCt.validateButton;
				validateButton.show();
			}
		});
		
		var saveButton = new Ext.Button({
			style: {width: '100%;',margin:'1%'},
			text: 'Save',
			hidden: true,
			handler: function(btn,e){
				var validateButton = btn.ownerCt.validateButton;
				me.onReportEditDone('submit',validateButton);
			}
		});
		
		var previewSaveFieldset = new Ext.form.FieldSet({
			style: 'width: 100%',
			items: [validateButton,editButton,saveButton],
			validateButton : validateButton,
			editButton: editButton,
			saveButton: saveButton
		});
		
		return previewSaveFieldset;
	},
	
	onReportEditDone: function(editoption,validateButton){
		var me = this;
		var viewport = SimbaApp.views.viewport;
		var publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store;
		if(publishedViewsStore.getCount() == 0){
			Ext.Msg.alert('Error','At least one view needs to be published!');
		} else {
			if(editoption == 'validate') me.getColumnsInfo();
			if(me.submitValues.views.length > 0 || me.submitValues.columns){
				if(editoption == 'validate') me.getViewSelectorInfo();
				var editorinfo = Ext.encode(me.submitValues);
				var simbaprompt = eval("SimbaApp.views.Prompts" + me.simbapageid);
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
					url   : _urlBase + _reportURL,
					params: {
						controller: 'xdata',
						simbapageid  : me.simbapageid,
						pagecid : me.pagecid,
						reportid: me.reportid,
						typename: 'report',
						promptfilters: Ext.encode(filterValues),
						reporteditorinfo: editorinfo,
						editoption: editoption,
						username: window.localStorage.getItem("username") || 'demo',
						password: window.localStorage.getItem("password")
					},
					timeout: _defaultTimeout,
					failure : function(response,opts){
						if(response.status === 404){
							Ext.Ajax.request({
								url   : _urlBase + _reportURL,
								params: {
									controller: 'xdata',
									simbapageid  : me.simbapageid,
									pagecid : me.pagecid,
									reportid: me.reportid,
									typename: 'report',
									promptfilters: Ext.encode(filterValues),
									reporteditorinfo: editorinfo,
									editoption: editoption,
									username: window.localStorage.getItem("username") || 'demo',
									password: window.localStorage.getItem("password")
								},
								timeout: _defaultTimeout,
								failure : function(response,opts){
									console.log('Failed',response);
									Ext.Msg.alert('Failed','Error while processing query!');
								},
								success: function(response, opts) {
									me.onReportEditLoadSuccess(response,loadMask,editoption,validateButton);
								}
							});
						} else {
							console.log('Failed',response);
							Ext.Msg.alert('Failed','Error while processing query!');
						}
					},
					success: function(response, opts) {
						me.onReportEditLoadSuccess(response,loadMask,editoption,validateButton);
					}
				});
			} else {
				Ext.Msg.alert('Confirm','No views or columns were modified.');
			}
		}
		// console.log('submitValues',me.submitValues);
		// console.log('Encoded submitValues',Ext.encode(me.submitValues));
	},
	
	onReportEditLoadSuccess: function(response,loadMask,editoption,validateButton){
		var me = this;
		var data = Ext.decode(response.responseText);
		if(data.success){
			var me = this,
				simbapageid  = me.simbapageid,
				pagecid = me.pagecid,
				reportid = me.reportid,
				simbapage = eval("SimbaApp.views.DashboardPage" + simbapageid),
				simbareport = Ext.getCmp(pagecid + '-' + reportid),
				viewport = SimbaApp.views.viewport;
			if(editoption == 'submit' && simbareport) simbapage.remove(simbareport,true);
			var newSimbareport = new SimbaApp.views.SimbaReport({
				title : data.reportsimba.caption,
				pagecid: pagecid, 
				simbapageid: simbapageid,
				reportid: (editoption == 'submit') ? reportid : reportid + '_p', 
				simba: data.reportsimba,
				preview: (editoption == 'submit') ? false : true, 
				ownerCmp: me,
			});
			if(editoption == 'submit'){
				viewport.show();
				simbapage.pagesimba.pageReports[reportid] = data.reportsimba;
				viewport.setActiveItem(simbapage);
				simbapage.setActiveItem(newSimbareport);
				me.destroy();
			} else {
				me.hide();
				validateButton.hide();
				newSimbareport.show();
			}
		}
		loadMask.destroy();
		loadMask.disable();
	},
	
	isUsedAsMeasure: function(columnId){
		var me = this,
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
			items = publishedViewsStore.data.items,
			length = publishedViewsStore.getCount();
		for(var i=0; i < length; i++){
			var viewName = publishedViewsStore.getAt(i).get('viewName');
			var viewObj = me.getOldView(viewName);
			if(viewObj){
				if(viewObj.action){
					if(viewObj.viewType == 'chart'){
						if(viewObj.viewInfo.measures.indexOf(columnId) != -1){
							return true;
						}
					} else if(viewObj.viewType == 'pivotTable'){
						if(viewObj.viewInfo.measure.indexOf(columnId) != -1){ 
							return true;
						}
					}
				} else {
					if(viewObj.viewType == 'chart'){
						if(viewObj.viewInfo.measures[columnId]){
							return true;
						}
					} else if(viewObj.viewType == 'pivotTable'){
						if(viewObj.viewInfo.measure.columns[columnId]){
							return true;
						}
					}
				}
			}
		}
		return false;
	},
	
	buildColumnsItems: function(){
		var me = this,
			columnInfo = me.simba.baseViewInfo.columnInfo,
			drillThroughTargets = SimbaApp.views['DashboardPage' + me.simbapageid].pagesimba.drillThroughTargets,
			drillThroughTargetReports = [],
			data = [],
			measureColumns = [],
			columnsItems = [];
		var aggrRules = [
			{'text': 'none','value':'none'},
			{'text': 'sum','value':'sum'},
			{'text': 'avg','value':'avg'},
			{'text': 'max','value':'max'},
			{'text': 'min','value':'min'}
		];
		
		var countSwitch = {
			xtype: 'fieldset',
			style: 'width: 100%',
			items: [{
				xtype: 'togglefield',
				label: 'Count',
				name: 'countswitch',
				value: 0,
				listeners: {
					change: function(slider,thumb,newValue,oldValue){
						me.handleCountSwitchValueChange(slider,thumb,newValue,oldValue);
					}
				}
			},{
				xtype: 'textfield',
				label: 'Alias:',
				name: 'cc1',
				value: 'count',
				hidden: true,
				listeners: {
					blur: function(field){
						var value = field.getValue();
						var rec = me.measureColumnsStore.findRecord('columnId','cc1',0,false,true,true);
						if(rec){
							rec.set('caption',value);
						}
					}
				}
			}]
		};

		var columnsFieldsetBase = {
			xtype: 'fieldset',
			style: 'width: 100%',
			title: 'Columns',
			collapsible: true,
			collapsed: false,
			items: []
		};
		for(var columnId in columnInfo){
			if(columnId.split(',').length > 1) continue;
			var columnObj = columnInfo[columnId];
			if(columnId == 'cc1'){
				countSwitch.items[0].value = 1;
				countSwitch.items[1].value = columnObj.columnHeading;
				countSwitch.items[1].hidden = false;
				var row = {
					columnId : columnId,
					formula  : columnObj.sformula,
					caption  : columnObj.columnHeading,
					aggRule  : columnObj.aggrRule,
					drillThroughCid: columnObj.drillthrough_cid || 'none'
				};
				measureColumns.push(row);
			} else {
				var row = {
					columnId : columnId,
					formula  : columnObj.sformula,
					caption  : columnObj.columnHeading,
					aggRule  : columnObj.aggrRule,
					drillThroughCid: columnObj.drillthrough_cid || 'none'
				};
				if(columnObj.aggrRule != 'none'){
					measureColumns.push(row);
				}
				data.push(row);
			}
		}
		
		var fields = [
			{name: 'columnId', type : 'string'},
			{name: 'formula', type : 'string'},
			{name: 'caption', type : 'string'},
			{name: 'aggRule', type : 'string'},
			{name: 'drillThroughCid', type : 'string'}
		];
		
		var columnsStore = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data
		});
		
		var measureColumnsStore = new Ext.ux.SimbaStore({
			fields: fields,
			data  : measureColumns
		});
		// console.log('drillThroughTargets',drillThroughTargets);
		// console.log('drillThroughTargets Type',typeof(drillThroughTargets));
		if(Ext.isObject(drillThroughTargets)){
			for(var cid in drillThroughTargets){
				if(cid != me.reportid){
					var r = {
						'reportCid': cid,
						'reportName': drillThroughTargets[cid]
					};
					drillThroughTargetReports.push(r);
				}
			}
		}
		
		if(drillThroughTargetReports.length != 0){
			var r = {
				'reportCid': 'none',
				'reportName': 'None'
			};
			drillThroughTargetReports.unshift(r);
		}
		
		var drillThroughReportsStore = new Ext.ux.SimbaStore({
			fields: [
				{name: 'reportName', type: 'text'},
				{name: 'reportCid', type: 'text'},
			],
			data  : drillThroughTargetReports
		});
		
		var allColumnsFieldset = {
			xtype: 'fieldset',
			style: 'width: 100%',
			title: 'Formula/Caption/Drill Target',
			items: [{
				xtype: 'selectfield',
				store: columnsStore,
				displayField: 'formula',
				valueField  : 'columnId',
				name : 'all_columns_formula_selector',
				listeners: {
					change: function(select,value){
						var captionField = select.nextSibling();
						var drillThroughField = captionField.nextSibling();
						// var editButton = captionField.nextSibling();
						var editButton = drillThroughField.nextSibling();
						var rec = columnsStore.findRecord('columnId',value,0,false,true,true);
						captionField.setValue(rec.get('caption'));
						captionField.disable();
						drillThroughField.setValue(rec.get('drillThroughCid'));
						drillThroughField.disable();
						editButton.setText('Edit');
					}
				}
			},{
				xtype: 'textfield',
				name : 'all_columns_caption_editor',
				value: columnsStore.getAt(0).get('caption'),
				disabled: true
			},{
				xtype: 'selectfield',
				store: drillThroughReportsStore,
				displayField: 'reportName',
				valueField  : 'reportCid',
				name : 'all_columns_drillthrough_selector',
				disabled: true,
				value: columnsStore.getAt(0).get('drillThroughCid'),
				hidden: (drillThroughTargetReports.length == 0) ? true : false
			},{
				xtype: 'button',
				text : 'Edit',
				style: {
					'width' : '100%',
					'margin-top': '1%'
				},
				handler: function(btn,e){
					if(me.previewing) return false;
					var drillThroughField = btn.previousSibling();
					var captionField = drillThroughField.previousSibling();
					var columnSelectField = captionField.previousSibling();
					if(btn.getText() == 'Edit'){
						captionField.enable();
						drillThroughField.enable();
						btn.setText('Save');
					} else {
						captionField.disable();
						drillThroughField.disable()
						var columnId = columnSelectField.getValue();
						var record = columnsStore.findRecord('columnId',columnId,0,false,true,true);
						var caption = captionField.getValue();
						var drillThroughCid = drillThroughField.getValue();
						var measureColumnSelectField = me.frontPanel.getFields('measure_columns_caption_selector');
						var mcsfValue = measureColumnSelectField.getValue();
						record.set('caption',caption);
						record.set('drillThroughCid',drillThroughCid);
						measureColumnSelectField.setOptions(columnsStore.getRange());
						measureColumnSelectField.setValue(mcsfValue);
						var mRec = measureColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						if(mRec){
							mRec.set('caption',caption);
						}
						btn.setText('Edit');
					}
				}
			}]
		};
		
		var measureColumnsFieldset = {
			xtype: 'fieldset',
			style: 'width: 100%',
			title: 'Measures',
			items: [{
				layout: {
					type: 'hbox',
				},
				height: 48,
				items: [{
					flex : 3,
					xtype: 'selectfield',
					store: columnsStore,
					displayField: 'caption',
					valueField  : 'columnId',
					name : 'measure_columns_caption_selector',
					listeners: {
						change: function(select,value){
							var aggRuleField = select.nextSibling();
							var addBtn = select.ownerCt.nextSibling();
							var modifyBtn = addBtn.nextSibling();
							var rec = columnsStore.findRecord('columnId',value,0,false,true,true);
							aggRuleField.setValue(rec.get('aggRule'));
							var mIdx = measureColumnsStore.findExact('columnId',value);
							if(mIdx != -1){
								modifyBtn.show();
								addBtn.hide();
							} else {
								modifyBtn.hide();
								addBtn.show();
							}
						}
					}
				},{
					flex : 1.5,
					xtype: 'selectfield',
					options: aggrRules,
					name: 'measure_columns_aggrule_selector',
					value: columnsStore.getAt(0).get('aggRule'),
				}]
			},{
				xtype: 'button',
				text : 'Add',
				hidden: columnsStore.getAt(0).get('aggRule') != 'none' ? true : false,
				style: {
					'width' : '100%',
					'margin-top': '1%',
				},
				handler: function(btn,e){
					var aggRule = me.frontPanel.getFields('measure_columns_aggrule_selector').getValue();
					var columnId = me.frontPanel.getFields('measure_columns_caption_selector').getValue();
					if(aggRule == 'none'){
						Ext.Msg.alert('Warning','Please set aggragation rule to not "none" for the measure column!');
					} else {
						var rec = columnsStore.findRecord('columnId',columnId,0,false,true,true);
						var row = {
							columnId : columnId,
							formula  : rec.get('sformula'),
							caption  : rec.get('caption'),
							aggRule  : aggRule
						};
						rec.set('aggRule',aggRule);
						measureColumnsStore.add(row);
						var modifyBtn = btn.nextSibling();
						modifyBtn.show();
						btn.hide();
					}
				}
			},{
				xtype: 'button',
				text : 'Modify',
				hidden: columnsStore.getAt(0).get('aggRule') == 'none' ? true : false,
				style: {
					'width' : '100%',
					'margin-top': '1%',
				},
				handler: function(btn,e){
					var aggRule = me.frontPanel.getFields('measure_columns_aggrule_selector').getValue();
					var columnId = me.frontPanel.getFields('measure_columns_caption_selector').getValue();
					var rec = columnsStore.findRecord('columnId',columnId,0,false,true,true);
					rec.set('aggRule',aggRule);
					if(aggRule == 'none'){
						var mIdx = measureColumnsStore.findExact('columnId',columnId);
						measureColumnsStore.removeAt(mIdx);
						var addBtn = btn.previousSibling();
						addBtn.show();
						btn.hide();
					} else {
						var mRec = measureColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						mRec.set('aggRule',aggRule);
					}
				}
			},{
				xtype: 'list',
				store: measureColumnsStore,
				cls: 'x-simbareports-list',
				style: {
					'margin-top': '1%',
				},
				scroll: false,
				itemTpl: '<table width="100%"><tr><td width="75%">{caption}</td><td width="25%">{aggRule}</td></tr></table>',
				listeners: {
					itemtap: function(list,index,item,e){
						var rec = list.getStore().getAt(index);
						if(rec){
							var columnId = rec.get('columnId');
							if(columnId != 'cc1'){
								var measureColumnSelectField = me.frontPanel.getFields('measure_columns_caption_selector');
								var measureColumnAggRuleSelectField = me.frontPanel.getFields('measure_columns_aggrule_selector');
								var modifyBtn = list.previousSibling();
								var addBtn = modifyBtn.previousSibling();
								measureColumnSelectField.setValue(columnId);
								measureColumnAggRuleSelectField.setValue(rec.get('aggRule'));
								modifyBtn.show();
								addBtn.hide();
							}
						}
					}
				}
			}]
		};
		me.columnsStore = columnsStore;
		me.measureColumnsStore = measureColumnsStore;
		me.drillThroughReportsStore = drillThroughReportsStore;
		columnsFieldsetBase.items.unshift(countSwitch);
		columnsFieldsetBase.items.push(allColumnsFieldset);
		columnsFieldsetBase.items.push(measureColumnsFieldset);
		var columnsFieldset = new Ext.form.FieldSet(columnsFieldsetBase);
		return columnsFieldset;
	},
	
	handleCountSwitchValueChange: function(slider,thumb,newValue,oldValue){
		var me = this,
			useCount = false,
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
			aliasField = slider.nextSibling();
		if(me.submitValues.views.length == 0){
			useCount = me.simba.baseViewInfo.useCount;
		} else {
			publishedViewsStore.each(function(record){
				if(record.get('useCount') == true) {
					useCount = true;
				}
			});
		}
		
		if(newValue == 1){
			aliasField.show();
			var row = {
				columnId : 'cc1',
				formula  : '',
				caption  : aliasField.getValue(),
				aggRule  : 'count'
			};
			me.measureColumnsStore.add(row);
		} else if(useCount){
			aliasField.show();
			Ext.Msg.alert('Warning','The count is used in some views. It\'s cannot be turn off.',function(){
				slider.toggle();
				slider.fieldEl.replaceCls('x-toggle-off','x-toggle-on');
			});
		} else {
			aliasField.hide();
			var mIdx = me.measureColumnsStore.findExact('columnId','cc1');
			if(mIdx != -1){
				me.measureColumnsStore.removeAt(mIdx);
			}
		}
	},
	
	getColumnsInfo: function(){
		var me = this,
			frontPanelValues = me.frontPanel.getValues(),
			columns = {};
		me.columnsStore.each(function(rec){
			var columnId = rec.get('columnId'),
				aggRule = rec.get('aggRule'),
				caption = rec.get('caption'),
				drillThroughCid = rec.get('drillThroughCid');
			columns[columnId] = {};
			columns[columnId]['aggRule'] = aggRule;
			columns[columnId]['columnHeading'] = caption;
			if(drillThroughCid != 'none'){
				columns[columnId]['drillThroughCid'] = drillThroughCid;
			}
		});
		
		if(frontPanelValues.countswitch != 0){
			columns['cc1'] = {};
			columns['cc1']['aggRule'] = 'count';
			columns['cc1']['columnHeading'] = frontPanelValues.cc1;
			// columns[columnId]['drillThroughCid'] = 'none';
		}
		
		if(frontPanelValues.viewselector != 0){
			me.submitValues.isViewSelector = true; 
			me.submitValues.viewSelectorCaption = frontPanelValues.viewselectorcaption;
		}
		me.submitValues.columns = columns;
	},
	
	getViewSelectorInfo: function(){
		var me = this,
			simbaView = {},
			compoundView = {},
			compoundViewInfo = [],
			viewInfo = [],
			frontPanelValues = me.frontPanel.getValues()
			isViewSelectorOld = me.simba.baseViewInfo.isViewSelector,
			isViewSelectorNew = (frontPanelValues.viewselector == 1) ? true : false,
			len = me.submitValues.views.length,
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store;
		simbaView.viewType = 'viewSelector';
		simbaView.viewCaption = frontPanelValues.viewselectorcaption;
		simbaView.viewName = frontPanelValues.viewselectorname;
		
		compoundView.viewType = 'compoundView';
		compoundView.viewCaption = '';
		compoundView.viewName = 'compoundView!1';
		compoundView.publish = 1;
		compoundView.action = 'edit';
		
		for(var i=0; i< me.submitValues.views.length; i++ ){
			if(me.submitValues.views[i].action == 'add' && me.submitValues.views[i].publish == 0){
				me.submitValues.views.remove(me.submitValues.views[i]);
			}
			if(me.submitValues.views[i].viewType == 'viewSelector' || me.submitValues.views[i].viewType == 'compoundView'){
				me.submitValues.views.remove(me.submitValues.views[i]);
			}
		}
		
		if(isViewSelectorNew){
			simbaView.publish = 1;
			if(isViewSelectorOld){
				simbaView.action = 'edit';
			} else {
				simbaView.action = 'add';
			}
			publishedViewsStore.each(function(record){
				var viewItem = {};
				viewItem['viewName'] = record.get('viewName');
				viewItem['viewType'] = record.get('viewType');
				viewItem['caption'] = record.get('caption');
				viewInfo.push(viewItem);
			});
			simbaView.viewInfo = viewInfo;
			me.submitValues.views.push(simbaView);
			var viewItem = {};
			viewItem['viewName'] = simbaView.viewName;
			viewItem['viewType'] = 'viewSelector';
			viewItem['caption'] = simbaView.viewCaption;
			compoundViewInfo.push(viewItem);
			compoundView.viewInfo = compoundViewInfo;
			me.submitValues.views.push(compoundView);
		} else {
			if(isViewSelectorOld){
				simbaView.publish = 0;
				simbaView.action = 'edit';
				publishedViewsStore.each(function(record){
					var viewItem = {};
					viewItem['viewName'] = record.get('viewName');
					viewItem['viewType'] = record.get('viewType');
					viewItem['caption'] = record.get('caption');
					viewInfo.push(viewItem);
				});
				simbaView.viewInfo = viewInfo;
				me.submitValues.views.push(simbaView);
			}
			publishedViewsStore.each(function(record){
				var viewItem = {};
				viewItem['viewName'] = record.get('viewName');
				viewItem['viewType'] = record.get('viewType');
				viewItem['caption'] = record.get('caption');
				compoundViewInfo.push(viewItem);
			});
			compoundView.viewInfo = compoundViewInfo;
			me.submitValues.views.push(compoundView);
		}
	},
	
	buildViewsItems: function(){
		var me = this,
			isViewSelector = me.simba.baseViewInfo.isViewSelector,
			views = me.simba.baseViewInfo.views,
			ln = views.length,
			data = [];
		var viewsItems = [];
		var getViewSelectCaption = function(){
			if(isViewSelector){
				for(var i=0; i<ln; i++){
					if(views[i].viewType == 'viewSelector'){
						return views[i].caption;
					}
				}
			}
			return '';
		};
		var getViewSelectName = function(){
			if(isViewSelector){
				for(var i=0; i<ln; i++){
					if(views[i].viewType == 'viewSelector'){
						return views[i].viewName;
					}
				}
			}
			return 'viewSelector_' + new Date().getTime();
		};
		var viewSelectorSwitch = {
			xtype: 'fieldset',
			style: 'width: 100%',
			items: [{
				xtype: 'togglefield',
				label: 'View Selector',
				name: 'viewselector',
				value: isViewSelector ? 1 : 0,
				required: false,
				listeners: {
					change: function(slider,thumb,newValue,oldValue){
						var captionField = this.nextSibling();
						if(newValue == 1){
							captionField.show();
						} else {
							captionField.hide();
						}
					}
				}
			},{
				xtype: 'textfield',
				label: 'Caption:',
				name: 'viewselectorcaption',
				hidden: isViewSelector ? false : true,
				value: getViewSelectCaption()
			},{
				xtype: 'textfield',
				label: 'Name:',
				name: 'viewselectorname',
				hidden: true,
				value: getViewSelectName()
			}]
		};
		
		for(var i = 0; i< ln;i++){
			var view = views[i];
			if(view.viewType){
				if(view.viewType == 'viewSelector'){
					for(var j = 0; j < view.subViews.length; j++){
						var subView = view.subViews[j];
						var row = {
							viewId: j,
							viewName: subView.viewName,
							viewType: subView.viewType,
							caption: subView.caption || subView.viewName,
							existed : true,
							useCount: subView.viewInfo ? subView.viewInfo.useCount : false
						};
						data.push(row);
					}
				} else {
					var row = {
						viewId: i,
						viewName: view.viewName,
						viewType: view.viewType,
						caption: view.caption || view.viewInfo.viewCaption || view.viewName,
						existed : true,
						useCount: view.viewInfo ? view.viewInfo.useCount : false
					};
					data.push(row);
				}
			}
		};
		var publishedViewsStore = new Ext.ux.SimbaStore({
			fields: [
				{name: 'viewId',   type: 'int'},
				{name: 'viewName',   type: 'string'},
				{name: 'viewType',   type: 'string'},
				{name: 'caption',   type: 'string'},
				{name: 'existed',   type: 'boolean'},
				{name: 'useCount',   type: 'boolean'}
			],
			data: data
		});
		
		var unpublishedViewsStore = new Ext.ux.SimbaStore({
			fields: [
				{name: 'viewId',   type: 'int'},
				{name: 'viewName',   type: 'string'},
				{name: 'viewType',   type: 'string'},
				{name: 'caption',   type: 'string'},
				{name: 'existed',   type: 'boolean'},
				{name: 'useCount',   type: 'boolean'}
			],
			data: []
		});
		
		
		var publishedViewsListFieldset = {
			xtype: 'fieldset',
			title: 'Items',
			style: 'width: 100%',
			instructions: 'Tips: Drag the item up or down to adjust it\'s order. Tap on it to edit more.',
			items:[{
				xtype: 'list',
				multiSelect: false,
				scroll: false,
				cls: 'x-simbareports-list',
				itemTpl: '{caption}',
				itemCls: 'carrow',
				onItemDisclosure: (Ext.is.Android) ? false : true,
				store: publishedViewsStore,
				listeners: {
					itemtap: function(list,index,item,e){
						var validateButton = me.frontPanel.previewSaveFieldset.validateButton;
						if(! validateButton.hidden){
							if(publishedViewsListFieldset.sortable.sorting){
								publishedViewsListFieldset.sortable.sorting = false;
							}
							var store = list.getStore(),
								record = store.getAt(index);
							me.buildViewEditorPanel(record);
						}
					},
					afterrender: function(list) {
						this.isAfterrendered = true;
						publishedViewsListFieldset.sortable = new Ext.util.Sortable(list.getId(), {
							itemSelector: 'div.x-list-item',
							direction: 'vertical',
							scroll: true,
							constrain: true,
							listeners: {
								sortend: function(sortable,draggable,e){
									var index = sortable.el.select(sortable.itemSelector, false).indexOf(draggable.el.dom);
									var record = list.getRecord(draggable.el.dom);
									list.store.insert(index,[record]);
								}
							}
						});
					}
				}
			}]
		};
		
		var unpubishedViewsListFieldset = {
			xtype: 'fieldset',
			title: 'Unpublish',
			hidden: true,
			style: 'width: 100%',
			items:[{
				xtype: 'list',
				multiSelect: false,
				scroll: false,
				cls: 'x-simbareports-list',
				itemTpl: '{caption}',
				itemCls: 'carrow',
				onItemDisclosure: (Ext.is.Android) ? false : true,
				store: unpublishedViewsStore,
				emptyText: 'No unpublished views',
				listeners: {
					itemtap: function(list,index,item,e){
						var validateButton = me.frontPanel.previewSaveFieldset.validateButton;
						if(! validateButton.hidden){
							var store = list.getStore(),
								record = store.getAt(index);
							me.buildViewEditorPanel(record);
						}
					}
				}
			}]
		};
		
		var viewsFieldset = new Ext.form.FieldSet({
			style: 'width: 100%',
			title: 'Views',
			collapsible: true,
			collapsed: false,
			items: [viewSelectorSwitch,publishedViewsListFieldset,unpubishedViewsListFieldset],
			viewSelectorSwitch: viewSelectorSwitch,
			publishedViewsListFieldset: publishedViewsListFieldset,
			unpubishedViewsListFieldset: unpubishedViewsListFieldset
		});
		
		return viewsFieldset;
	},
	
	buildViewEditorPanel: function(record){
		var me = this,
			views = me.simba.baseViewInfo.views,
			isAdd = (record == undefined) ? true : false,
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
			publishedViews = publishedViewsStore.getCount(),
			ln = views.length;
		if(isAdd && publishedViews >=5){
			Ext.Msg.alert('Warning','Report is limited to have 5 views. No more can be added.');
			return;
		}
		
		var viewEditorToolbar = new Ext.Toolbar({
			dock: 'top',
			title: isAdd ? 'Add View' : 'Edit View',
			items: [{
				text: 'Cancel',
				ui: 'back',
				handler: function(btn,e){
					me.setActiveItem(me.frontPanel);
					me.viewEditorPanel.destroy();
				}
			},{
				xtype: 'spacer'
			},{
				text: 'Done',
				handler: function(btn,e){
					var simbaView = me.validateView();
					if(simbaView != undefined && simbaView){ 
						var flag = 'I';
						for(var i=0; i< me.submitValues.views.length; i++ ){
							if(me.submitValues.views[i].viewName == simbaView.viewName){
								me.submitValues.views[i] = simbaView;
								flag = 'U';
								break;
							}
						}
						if(flag == 'I'){
							me.submitValues.views.push(simbaView);
						}
						me.setActiveItem(me.frontPanel);
						me.viewEditorPanel.destroy();
					}
				}
			}]
		});
		var viewEditorFieldsets = me.buildViewEditorItems(record);
		me.viewEditorPanel = new Ext.form.FormPanel({
			layout: 'vbox',
			scroll: 'vertical',
			cls: 'x-login-screen',
			dockedItems: [viewEditorToolbar],
			items: viewEditorFieldsets,
			isAdd : isAdd,
			viewDetailsFieldset : (viewEditorFieldsets.length>=2) ? viewEditorFieldsets[1] : null
		});
		
		me.setActiveItem(me.viewEditorPanel);
		if(!isAdd){
			var oldView = me.getOldView(record.get('viewName'));
			if(oldView){
				var viewType = record.get('viewType');
				if(viewType == 'chart'){
					if(oldView.viewInfo.subType == 'stacked'){
						if(oldView.viewInfo.type == 'column'){
							var chartType = 'stackedcolumn';
						} else if(oldView.viewInfo.type == 'bar'){
							var chartType = 'stackedbar';
						}
					} else {
						var chartType = oldView.viewInfo.type;
					}
					me.viewEditorPanel.setValues({
						'viewcaption' : record.get('caption'),
						'viewtypeselector' : record.get('viewType'),
						'charttypeselector' : chartType,
						'publishtoggle' : (oldView.publish === 0) ? 0 :1
					});
				} else {
					me.viewEditorPanel.setValues({
						'viewcaption' : record.get('caption'),
						'viewtypeselector' : record.get('viewType'),
						'publishtoggle' : (oldView.publish === 0) ? 0 :1
					});
					me.viewEditorPanel.getFields('charttypeselector').hide();
					me.viewEditorPanel.getFields('charttypeselector').disable();
					
				}
				me.viewEditorPanel.getFields('viewtypeselector').disable();
				me.viewEditorPanel.oldView = oldView;
			}
		} else {
			var publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
				unpubishedViewsStore = me.frontPanel.viewsFieldset.unpubishedViewsListFieldset.items[0].store,
				totalViews = publishedViewsStore.getCount() + unpubishedViewsStore.getCount();
			me.viewEditorPanel.setValues({
				'viewcaption' : 'view_' + (totalViews +1),
				'publishtoggle' : 1
			});
		}
	},
	
	buildViewEditorItems: function(record){
		var me = this,
			frontPanelValues = me.frontPanel.getValues(),
			columnInfo = me.simba.baseViewInfo.columnInfo;
		var viewTypeFieldset = {
			xtype: 'fieldset',
			style: 'width: 100%',
			items: [{
				xtype: 'textfield',
				label: 'View Name',
				placeHolder: 'View display name',
				labelWidth: '40%',
				name: 'viewcaption'
			},{
				xtype: 'selectfield',
				label: 'View Type',
				labelWidth: '40%',
				name: 'viewtypeselector',
				required: true,
				value: 'tableView',
				options: [
					{'text': 'Table', 'value': 'tableView'},
					{'text': 'Chart', 'value': 'chart'},
					{'text': 'Pivot Table', 'value': 'pivotTable'},
					{'text': 'Map', 'value': 'mapView'}
				],
				listeners: {
					change: function(field,value){
						var chartTypeField = this.nextSibling(),
							chartType = chartTypeField.getValue();
						if(value == 'chart'){
							chartTypeField.enable();
							chartTypeField.show();
						} else {
							chartTypeField.disable();
							chartTypeField.hide();
						}
						if(me.viewEditorPanel.viewDetailsFieldset){
							me.viewEditorPanel.remove(me.viewEditorPanel.viewDetailsFieldset,true);
						}
						if(value == 'chart'){
							var viewDetailsFieldset = me.buildChartViewDetailsFieldset(chartType,me.viewEditorPanel.oldView);
						} else if(value == 'tableView'){
							var viewDetailsFieldset = me.buildTableViewDetailsFieldset(me.viewEditorPanel.oldView);
						} else if (value == 'pivotTable'){
							var viewDetailsFieldset = me.buildPivotTableViewDetailsFieldset(me.viewEditorPanel.oldView);
						} else if (value == 'mapView'){
							var viewDetailsFieldset = me.buildMapViewDetailsFieldset(me.viewEditorPanel.oldView);
						}
						if(viewDetailsFieldset != undefined){
							me.viewEditorPanel.add(viewDetailsFieldset);
							me.viewEditorPanel.viewDetailsFieldset = viewDetailsFieldset;
						}
						me.viewEditorPanel.doLayout();
					}
				}
			},{
				xtype: 'selectfield',
				label: 'Chart Type',
				labelWidth: '40%',
				name: 'charttypeselector',
				required: true,
				hidden: true,
				options: [
					{'text': 'Line', 'value': 'line'},
					{'text': 'Column', 'value': 'column'},
					{'text': 'Stacked Column', 'value': 'stackedcolumn'},
					{'text': 'Line Column', 'value': 'linecolumn'},
					{'text': 'Bar', 'value': 'bar'},
					{'text': 'Stacked Bar', 'value': 'stackedbar'},
					{'text': 'Area', 'value': 'area'},
					{'text': 'Pie', 'value': 'pie'},
					{'text': 'Radar', 'value': 'radar'},
					{'text': 'Gauge', 'value': 'gaugeChart'}
				],
				listeners: {
					change: function(field,value){
						if(me.viewEditorPanel.viewDetailsFieldset){
							me.viewEditorPanel.remove(me.viewEditorPanel.viewDetailsFieldset,true);
						}
						var viewDetailsFieldset = me.buildChartViewDetailsFieldset(value,me.viewEditorPanel.oldView);
						if(viewDetailsFieldset != undefined){
							me.viewEditorPanel.insert(1,viewDetailsFieldset);
							me.viewEditorPanel.viewDetailsFieldset = viewDetailsFieldset;
						}
						me.viewEditorPanel.doLayout();
					}
				}
			},{
				xtype: 'togglefield',
				label: 'Publish',
				labelWidth: '40%',
				name: 'publishtoggle',
				value: 0,
				hidden: true,
				required: true
			}]
		};
		var viewEditorFieldsets = [viewTypeFieldset];

		
		if(record != undefined){
			var oldView = me.getOldView(record.get('viewName'));
			var viewType = record.get('viewType');
			if(viewType == 'chart'){
				viewTypeFieldset.items[2].hidden = false;
				if(oldView.viewInfo.subType == 'stacked'){
					if(oldView.viewInfo.type == 'column'){
						var chartType = 'stackedcolumn';
					} else if(oldView.viewInfo.type == 'bar'){
						var chartType = 'stackedbar';
					}
				} else {
					var chartType = oldView.viewInfo.type;
				}
				var viewDetailsFieldset = me.buildChartViewDetailsFieldset(chartType,oldView);
				viewEditorFieldsets.push(viewDetailsFieldset);
			} else if(viewType == 'tableView'){
				var viewDetailsFieldset = me.buildTableViewDetailsFieldset();
				viewEditorFieldsets.push(viewDetailsFieldset);
			} else if (viewType == 'pivotTable'){
				var viewDetailsFieldset = me.buildPivotTableViewDetailsFieldset(oldView);
				viewEditorFieldsets.push(viewDetailsFieldset);
			} else if (viewType == 'mapView'){
				var viewDetailsFieldset = me.buildMapViewDetailsFieldset(oldView);
				viewEditorFieldsets.push(viewDetailsFieldset);
			}
		} else {
			var viewDetailsFieldset = me.buildTableViewDetailsFieldset();
			viewEditorFieldsets.push(viewDetailsFieldset);
		}
		
		var removeButton = {
			xtype: 'button',
			style: {
				'width': '100%',
				'height': '33px'
			},
			text: 'Remove',
			ui: 'decline',
			hidden: (record == undefined) ? true : false,
			handler: function(btn){
				Ext.Msg.confirm('Confirm','Are you sure you are going to remove this view?', function(buttonText){
					if(buttonText == 'yes'){
						me.viewEditorPanel.setValues({
							'publishtoggle' : 0
						});
						var simbaView = me.validateView(true);
						if(simbaView != undefined && simbaView){ 
							var flag = 'I';
							for(var i=0; i< me.submitValues.views.length; i++ ){
								if(me.submitValues.views[i].viewName == simbaView.viewName){
									me.submitValues.views[i] = simbaView;
									flag = 'U';
									break;
								}
							}
							if(flag == 'I'){
								me.submitValues.views.push(simbaView);
							}
							me.setActiveItem(me.frontPanel);
							me.viewEditorPanel.destroy();
						}
					}
				});
			}
		};
		viewEditorFieldsets.push(removeButton);
		return viewEditorFieldsets;
	},
	
	hasMeasureColumn: function(){
		var me = this;
		if(me.measureColumnsStore.getCount() >0) {
			return true;
		} else {
			return false;
		}
	},
	
	getOldView: function(viewName){
		var oldView = null;
		var me = this,
			views = me.simba.baseViewInfo.views,
			viewsLen = views.length;
		for(var i = 0; i< me.submitValues.views.length;i++){
			var view = me.submitValues.views[i];
			if (view.viewName == viewName){
				var oldView = view;
				break;
			}
		}
		if(oldView == null){
			for(var i = 0; i< viewsLen;i++){
				var view = views[i];
				if (view.viewName == viewName){
					var oldView = view;
					break;
				}
				if(view.viewType == 'viewSelector'){
					var subViews = view.subViews,
						subViewsLen = subViews.length;
					for(var j = 0; j<subViewsLen; j++){
						var subView = subViews[j];
						if(subView.viewName == viewName){
							var oldView = subView;
							break;
						}
					}
				}
			};
		}
		return oldView;
	},
	
	buildTableViewDetailsFieldset: function(oldView){
		var viewDetailsFieldset = new Ext.form.FieldSet({
			style: 'width: 100%',
			title: 'Table Configuration',
			viewtype: 'tableView',
			instructions: '',
			hidden: true,
			items: []
		});
		return viewDetailsFieldset;
	},
	
	buildMapViewDetailsFieldset: function(oldView){
		var me = this,
			frontPanelValues = me.frontPanel.getValues(),
			columnInfo = me.simba.baseViewInfo.columnInfo,
			items = [],
			dimColumns = [],
			factColumns = [];
		
		var getSeriesColumns = function(){
			if(oldView && oldView.viewInfo.series){
				return oldView.viewInfo.series.join(', ');
			}
			return '';
		};
		
		var mapCenterFieldset = {
			xtype: 'fieldset',
			style: {'width':'100%'},
			title: 'Map Center',
			items: [{
				xtype: 'selectfield',
				options: [
					{text: 'Coordinate', value: 'coordinate'},
					{text: 'Address', value: 'address'}
				],
				name: 'mapcentertype',
				label: 'Type:',
				listeners: {
					change: function(field,value){
						var coordField = field.nextSibling();
						var addressField = coordField.nextSibling();
						if(value=='address'){
							addressField.show();
							coordField.hide();
						} else {
							addressField.hide();
							coordField.show();
						}
						field.ownerCt.doLayout();
					}
				}
			},{
				layout: {
					type: Ext.is.Phone ? 'vbox' :'hbox',
				},
				defaults: {
					flex: 1,
					xtype: 'textfield'
				},
				items:[{
					label: 'Latitude:',
					name : 'centerLatitude',
					value: oldView ? oldView.viewInfo.centerLatitude : ''
				},{
					label: 'Longitude:',
					name : 'centerLongitude',
					value: oldView ? oldView.viewInfo.centerLongitude : ''
				}]
			},{
				layout: {
					type: Ext.is.Phone ? 'vbox' :'hbox',
				},
				hidden: true,
				items:[{
					xtype: 'textfield',
					label: 'Address:',
					name : 'centerAddress',
					flex : 9
				},{
					xtype: 'button',
					hidden: true,
					height: 50,
					iconCls: 'locate',
					iconMask: true,
					ui: 'action',
					handler: function(btn,e){
					
					}
				}]
				
			}]
		};
		var columnOptions = [{'text':'','value':''}];
		
		me.columnsStore.each(function(record){
			var newRecord = record.copy();
			var row = {
				'text': record.get('caption'),
				'value': record.get('columnId'),
			};
			columnOptions.push(row);
		});
		
		if(frontPanelValues.countswitch != 0){
			var row = {
				'text'  : frontPanelValues.cc1,
				'value' : 'cc1'
			};
			columnOptions.push(row);
		}
		
		var geocodeSourceFieldset = {
			xtype: 'fieldset',
			style: {'width':'100%'},
			title: 'Geocode Source',
			instructions: 'Tips: When geocode source type is set to Address, 500 records are limited. And longer to process the query.',
			items: [{
				xtype: 'selectfield',
				options: [
					{text: 'Coordinate', value: 'coordinate'},
					{text: 'Address', value: 'address'}
				],
				name: 'geocodeSource',
				label: 'Type:',
				value: oldView ? oldView.viewInfo.geocodeSource : 'coordinate',
				listeners: {
					change: function(field,value){
						var coordField = field.nextSibling();
						var addressField = coordField.nextSibling();
						if(value=='address'){
							addressField.show();
							coordField.hide();
						} else {
							addressField.hide();
							coordField.show();
						}
						field.ownerCt.doLayout();
					}
				}
			},{
				layout: {
					type: Ext.is.Phone ? 'vbox' : 'hbox',
				},
				hidden: (oldView && oldView.viewInfo.geocodeSource == 'address') ? true : false,
				defaults: {
					flex: 1,
					xtype: 'textfield'
				},
				items:[{
					xtype: 'selectfield',
					name : 'latitudeColumn',
					label: 'Latitude:',
					value: oldView ? oldView.viewInfo.latitude : '',
					options: columnOptions
				},{
					xtype: 'selectfield',
					name : 'longitudeColumn',
					label: 'Longitude:',
					value: oldView ? oldView.viewInfo.longitude : '',
					options: columnOptions
				}]
			},{
				xtype: 'selectfield',
				hidden: (!oldView || (oldView && oldView.viewInfo.geocodeSource != 'address')) ? true : false,
				name : 'addressColumn',
				label: 'Address:',
				value: oldView ? oldView.viewInfo.location : '',
				options: columnOptions
			}]
		};
		
		var seriesField = {
			xtype        : "multiselectfield",
			label        : 'Series:',
			store        : new Ext.data.Store({
				fields : [
					{ name : "text",  type : "string" },
					{ name : "value", type : "string" }
				],
				data : columnOptions
			}),
			displayField : "text",
			valueField   : "value",
			name         : 'series',
			value        : getSeriesColumns(),
			itemType     : "list"
		};
		
		var viewDetailsFieldset = new Ext.form.FieldSet({
			style: 'width: 100%',
			title: 'Map View Configuration',
			viewtype: 'mapView',
			instructions: '',
			items: [mapCenterFieldset,geocodeSourceFieldset,seriesField]
		});
		return viewDetailsFieldset;
	},
	
	buildPivotTableViewDetailsFieldset: function(oldView){
		var me = this,
			frontPanelValues = me.frontPanel.getValues(),
			columnInfo = me.simba.baseViewInfo.columnInfo,
			edgeFields = [
				{'name': 'columnId', 'type': 'string'},
				{'name': 'formula', 'type': 'string'},
				{'name': 'caption', 'type': 'string'},
				{'name': 'aggRule', 'type': 'string'},
				{'name': 'edge', 'type': 'string'},
				{'name': 'subedge', 'type': 'string'}
			],
			edgeColumnsStore = new Ext.ux.SimbaStore({
				fields: edgeFields
			}), 
			usedColumnsStore = new Ext.ux.SimbaStore({
				fields: edgeFields,
				sorters: [{
					property : 'edge',
					direction: 'ASC'
				}],
			});
			items = [],
			dimColumns = [],
			factColumns = [];
			
		if(! me.hasMeasureColumn() && ! oldView){
			Ext.Msg.alert('Warning','There is no measure column. Pivot table can not be added.');
			return;
		}
		var getOldViewTotalAt = function(oldView){
			if(oldView == undefined) return '';
			var totalAt = [];
			if(oldView.viewInfo.page.total) totalAt.push('page');
			if(oldView.viewInfo.section.total) totalAt.push('section');
			if(oldView.viewInfo.column.total) totalAt.push('column');
			if(oldView.viewInfo.row.total) totalAt.push('row');
			return totalAt.join(', ');
		};
		var getMeasureLabelPosition = function(oldView){
			if(oldView == undefined) return 'column';
			if(oldView.action){
				return oldView.viewInfo.measureLabel;
			} else {
				return oldView.viewInfo.LabelPos;
			}
		};
		
		var getEdge = function(columnId){
			if(oldView == undefined) return 'excluded';
			if(oldView.action){
				if(oldView.viewInfo.page.columns.indexOf(columnId) != -1) return 'page';
				if(oldView.viewInfo.section.columns.indexOf(columnId) != -1) return 'section';
				if(oldView.viewInfo.column.columns.indexOf(columnId) != -1) return 'column';
				if(oldView.viewInfo.row.columns.indexOf(columnId) != -1) return 'row';
				if(oldView.viewInfo.measure.indexOf(columnId) != -1) return 'measure';
			}else {
				if(Ext.isObject(oldView.viewInfo.page.columns) && oldView.viewInfo.page.columns[columnId]) return 'page';
				if(Ext.isObject(oldView.viewInfo.section.columns) && oldView.viewInfo.section.columns[columnId]) return 'section';
				if(Ext.isObject(oldView.viewInfo.column.columns) && oldView.viewInfo.column.columns[columnId]) return 'column';
				if(Ext.isObject(oldView.viewInfo.row.columns) && oldView.viewInfo.row.columns[columnId]) return 'row';
				if(Ext.isObject(oldView.viewInfo.measure.columns) && oldView.viewInfo.measure.columns[columnId]) return 'measure';
			}
			return 'excluded';
		};
		
		var getEdgeColumnsStores = function(){
			var edgeColumnsData = [],
				usedColumnsData = [];
			me.columnsStore.each(function(record){
				var edge = getEdge(record.get('columnId'));
				var newRecord = record.copy();
				newRecord.set('edge',edge);
				if(edge != 'excluded'){
					usedColumnsData.push(newRecord);
				}
				edgeColumnsData.push(newRecord);
			});
			
			if(frontPanelValues.countswitch != 0){
				var edge = getEdge('cc1');
				var newRecord = {
					columnId : 'cc1',
					formula  : '',
					caption  : frontPanelValues.cc1,
					aggRule  : 'count',
					edge     : edge
				};
				if(edge != 'excluded'){
					usedColumnsData.push(newRecord);
				}
				edgeColumnsData.push(newRecord);
			}
			
			edgeColumnsStore.loadData(edgeColumnsData);
			usedColumnsStore.loadData(usedColumnsData);
		};
		
		getEdgeColumnsStores();
		
		var getEdgeOptions = function(record){
			var aggRule = record.get('aggRule');
			if(aggRule != 'none'){
				var edgeOptions = [
					{'text': 'Excluded', 'value':'excluded'},
					{'text': 'Measure', 'value':'measure'}
				];
			} else {
				var edgeOptions = [	
					{'text': 'Excluded', 'value':'excluded'},
					{'text': 'Page', 'value':'page'},
					{'text': 'Section', 'value':'section'},
					{'text': 'Column', 'value':'column'},
					{'text': 'Row', 'value':'row'},
				];
			}
			return edgeOptions;
		};
		
		var totalatitem = {
			xtype        : "multiselectfield",
			store        : new Ext.data.Store({
				fields : [
					{ name : "text",  type : "string" },
					{ name : "value", type : "string" }
				],
				data : [
					{'text': 'Page', 'value':'page'},
					{'text': 'Section', 'value':'section'},
					{'text': 'Column', 'value':'column'},
					{'text': 'Row', 'value':'row'},
				]
			}),
			displayField : "text",
			valueField   : "value",
			name         : 'totalat',
			value        : getOldViewTotalAt(oldView),
			itemType     : "list"
		};
		var measurelabelitem = {
			xtype: 'selectfield',
			options: [
				{text: 'Column', value: 'column'},
				{text: 'Row', value: 'row'}
			],
			name: 'measurelabel',
			value: getMeasureLabelPosition(oldView),
		};
		
		if(Ext.is.Phone){
			var edgeSetItem = {
				xtype: 'fieldset',
				style: 'width: 100%',
				items: [{
					xtype: 'selectfield',
					store: edgeColumnsStore,
					displayField: 'caption',
					valueField  : 'columnId',
					name : 'edge_set_columns_selector',
					listeners: {
						change: function(field,value){
							var record = edgeColumnsStore.findRecord('columnId',value,0,false,true,true);
							if(record){
								var edgeSelectorField = field.nextSibling();
								var edgeOptions = getEdgeOptions(record);
								edgeSelectorField.setOptions(edgeOptions);
								edgeSelectorField.setValue(record.get('edge'));
							}
						}
					}
				},{
					xtype: 'selectfield',
					options: getEdgeOptions(edgeColumnsStore.getAt(0)),
					name : 'edge_selector',
					value: edgeColumnsStore.getAt(0).get('edge'),
				},{
					xtype: 'button',
					text : 'Set',
					handler: function(btn,e){
						var viewEditorValues = me.viewEditorPanel.getValues(),
							columnId = viewEditorValues.edge_set_columns_selector,
							edge = viewEditorValues.edge_selector,
							rec = edgeColumnsStore.findRecord('columnId',columnId,0,false,true,true),
							usedRec = usedColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						rec.set('edge',edge);
						if(usedRec){
							if(edge == 'excluded'){
								usedColumnsStore.remove(usedRec);
							} else {
								usedRec.set('edge',edge);
							}
						} else if(edge != 'excluded'){
							var newRec = rec.copy();
							usedColumnsStore.add(newRec);
							usedColumnsStore.sort();
						}
					}
				}]
			};
		} else {
			var edgeSetItem = {
				style: {
					'width': '100%',
				},
				layout: {
					type: 'hbox',
				},
				items: [{
					flex : 3,
					xtype: 'selectfield',
					store: edgeColumnsStore,
					displayField: 'caption',
					valueField  : 'columnId',
					name : 'edge_set_columns_selector',
					listeners: {
						change: function(field,value){
							var record = edgeColumnsStore.findRecord('columnId',value,0,false,true,true);
							if(record){
								var edgeSelectorField = field.nextSibling();
								var edgeOptions = getEdgeOptions(record);
								edgeSelectorField.setOptions(edgeOptions);
								edgeSelectorField.setValue(record.get('edge'));
							}
						}
					}
				},{
					xtype: 'selectfield',
					options: getEdgeOptions(edgeColumnsStore.getAt(0)),
					name : 'edge_selector',
					value: edgeColumnsStore.getAt(0).get('edge'),
					flex : 2,
				},{
					xtype: 'button',
					text : 'Set',
					style: {
						width: '65px',
						height: '33px'
					},
					handler: function(btn,e){
						var viewEditorValues = me.viewEditorPanel.getValues(),
							columnId = viewEditorValues.edge_set_columns_selector,
							edge = viewEditorValues.edge_selector,
							rec = edgeColumnsStore.findRecord('columnId',columnId,0,false,true,true),
							usedRec = usedColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						rec.set('edge',edge);
						if(usedRec){
							if(edge == 'excluded'){
								usedColumnsStore.remove(usedRec);
							} else {
								usedRec.set('edge',edge);
							}
						} else if(edge != 'excluded'){
							var newRec = rec.copy();
							usedColumnsStore.add(newRec);
							usedColumnsStore.sort();
						}
					}
				}]
			};
		}
		
		var tpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="item-frame" tabindex="0">',
					'<table width="100%"><tr><td style="width: 50%">{caption}</td>',
					'<tpl if="edge== &quot;page&quot;">',
						'<td style="width: 50%">Page</td>',
					'</tpl>',
					'<tpl if="edge== &quot;section&quot;">',
						'<td style="width: 50%">Section</td>',
					'</tpl>',
					'<tpl if="edge== &quot;column&quot;">',
						'<td style="width: 50%">Column</td>',
					'</tpl>',
					'<tpl if="edge== &quot;row&quot;">',
						'<td style="width: 50%">Row</td>',
					'</tpl>',
					'<tpl if="edge== &quot;measure&quot;">',
						'<td style="width: 50%">Measure</td>',
					'</tpl>',
					'</tr></table>',
				'</div>',
			'</tpl>'
		);
		
		var usedColumnsList = {
			xtype: 'list',
			store: usedColumnsStore,
			cls: 'x-simbareports-list',
			style: {
				'margin-top': '1%',
			},
			scroll: false,
			itemTpl: tpl,
			listeners: {
				itemtap: function(list,index,item,e){
					var rec = list.getStore().getAt(index);
					if(rec){
						var edgeOptions = getEdgeOptions(rec);
						var edgeSelectorField = me.viewEditorPanel.getFields('edge_selector');
						edgeSelectorField.setOptions(edgeOptions);
						me.viewEditorPanel.setValues({
							edge_set_columns_selector : rec.get('columnId'),
							edge_selector : rec.get('edge')
						});
					}
				},
			}
		};
		
		var items = [{
			xtype: 'fieldset',
			title: 'Measure Label At/Total At',
			items:[measurelabelitem,totalatitem]
		},edgeSetItem,usedColumnsList];
		
		var viewDetailsFieldset = new Ext.form.FieldSet({
			style: 'width: 100%',
			title: 'Pivot Table Configuration',
			viewtype: 'pivotTable',
			instructions: '',
			usedColumnsStore: usedColumnsStore,
			edgeColumnsStore: edgeColumnsStore,
			items: items
		});
		return viewDetailsFieldset;
	},
	
	buildChartViewDetailsFieldset: function(chartType,oldView){
		var me = this,
			chartType = chartType || 'line',
			frontPanelValues = me.frontPanel.getValues(),
			columnInfo = me.simba.baseViewInfo.columnInfo,
			edgeFields = [
				{'name': 'columnId', 'type': 'string'},
				{'name': 'formula', 'type': 'string'},
				{'name': 'caption', 'type': 'string'},
				{'name': 'aggRule', 'type': 'string'},
				{'name': 'edge', 'type': 'string'},
				{'name': 'subedge', 'type': 'string'}
			],
			edgeColumnsStore = new Ext.ux.SimbaStore({
				fields: edgeFields
			}), 
			usedColumnsStore = new Ext.ux.SimbaStore({
				fields: edgeFields,
				sorters: [{
					property : 'edge',
					direction: 'ASC'
				}],
			});
			
		if(! me.hasMeasureColumn() && ! oldView){
			Ext.Msg.alert('Warning','There is no measure column. Chart can not be added.');
			return;
		}

		var getEdge = function(columnId){
			if(oldView == undefined) return 'excluded';
			var categoriesObj = oldView.viewInfo['categories'];
			var seriesObj = oldView.viewInfo['series'];
			var measuresObj = oldView.viewInfo['measures'];
			if((Ext.isObject(categoriesObj) && (columnId in categoriesObj)) || (Ext.isArray(categoriesObj) && (categoriesObj.indexOf(columnId) != -1))) return 'category';
			if((Ext.isObject(seriesObj) && (columnId in seriesObj)) || (Ext.isArray(seriesObj) && (seriesObj.indexOf(columnId) != -1)))  return 'series';
			if((Ext.isObject(measuresObj) && (columnId in measuresObj)) || (Ext.isArray(measuresObj) && (measuresObj.indexOf(columnId) != -1))) return 'measure';
			return 'excluded';
		};
		
		var lineOrColumn = function(columnId){
			if(oldView == undefined) return 'line';
			var measurePosition = oldView.viewInfo.measurePosition;
			if(measurePosition){
				if(measurePosition.line.indexOf(columnId) != -1) return 'line';
				if(measurePosition.column.indexOf(columnId) != -1) return 'column';
			} 
			return 'line';
		};
		
		var getEdgeColumnsStores = function(){
			var edgeColumnsData = [],
				usedColumnsData = [];
			me.columnsStore.each(function(record){
				var edge = getEdge(record.get('columnId'));
				var newRecord = record.copy();
				newRecord.set('edge',edge);
				newRecord.set('subedge','');
				if (edge == 'measure' && chartType == 'linecolumn'){
					var subedge = lineOrColumn(record.get('columnId'));
					newRecord.set('subedge',subedge);
				}
				if(edge != 'excluded'){
					usedColumnsData.push(newRecord);
				}
				edgeColumnsData.push(newRecord);
			});
			
			if(frontPanelValues.countswitch != 0){
				var edge = getEdge('cc1');
				var newRecord = {
					columnId : 'cc1',
					formula  : '',
					caption  : frontPanelValues.cc1,
					aggRule  : 'count',
					edge     : edge
				};
				if (edge == 'measure' && chartType == 'linecolumn'){
					var subedge = lineOrColumn('cc1');
					newRecord.set('subedge',subedge);
				}
				if(edge != 'excluded'){
					usedColumnsData.push(newRecord);
				}
				edgeColumnsData.push(newRecord);
			}
			
			edgeColumnsStore.loadData(edgeColumnsData);
			usedColumnsStore.loadData(usedColumnsData);
		};
		
		getEdgeColumnsStores();
		
		var getGaugeScale = function(){
			if(oldView == undefined) return {min: '0', max: '100'};
			return oldView.viewInfo.gaugeScale || oldView.viewInfo.scale || {min: '0', max: '100'};
		};
		
		var getEdgeOptions = function(record){
			var edgeOptions = [
				{text: 'Excluded', value:'excluded'}
			];
			var aggRule = record.get('aggRule');
			if(aggRule != 'none'){
				edgeOptions.push(
					{text: 'Measure', value:'measure'}
				);
			} else {
				if(chartType == 'pie'){
					edgeOptions.push(
						{text: 'Series', value:'series'}
					);
				} else if(chartType == 'gaugeChart'  || chartType == 'linecolumn'){
					edgeOptions.push(
						{text: 'Category', value:'category'}
					);
				} else {
					edgeOptions.push(
						{text: 'Category', value:'category'}
					);
					edgeOptions.push(
						{text: 'Series', value:'series'}
					);
				}
			}
			return edgeOptions;
		};

		var viewDetailsFieldsetBase = {
			style: 'width: 100%',
			title: 'Chart Configuration',
			viewtype: 'chart',
			defaults: {
				xtype:'fieldset',
				style: 'width: 100%'
			},
			items: []
		};
		
		var isSubEdgeHidden = function(){
			if(chartType != 'linecolumn'){
				return true;
			} else {
				var rec = edgeColumnsStore.getAt(0);
				if(rec.get('edge') == 'measure'){
					return false;
				} else {
					return true;
				}
			}	
		};
		
		var getDrillThroughCid = function(){
			if(oldView == undefined) return 'none';
			var navigate = oldView.viewInfo.navigate;
			if(navigate){
				return navigate.cid;
			} 
			return 'none';
		};
		
		if(Ext.is.Phone){
			var edgeSetItem = {
				xtype: 'fieldset',
				style: 'width: 100%',
				items: [{
					xtype: 'selectfield',
					store: edgeColumnsStore,
					displayField: 'caption',
					valueField  : 'columnId',
					name : 'edge_set_columns_selector',
					listeners: {
						change: function(field,value){
							var record = edgeColumnsStore.findRecord('columnId',value,0,false,true,true);
							if(record){
								var edgeSelectorField = field.nextSibling();
								var subEdgeSelectorField = edgeSelectorField.nextSibling();
								var edgeOptions = getEdgeOptions(record);
								edgeSelectorField.setOptions(edgeOptions);
								edgeSelectorField.setValue(record.get('edge'));
								if(record.get('subedge')){
									subEdgeSelectorField.show();
									subEdgeSelectorField.setValue(record.get('subedge'));
								} else {
									subEdgeSelectorField.hide();
								}
							}
						}
					}
				},{
					xtype: 'selectfield',
					options: getEdgeOptions(edgeColumnsStore.getAt(0)),
					name : 'edge_selector',
					value: edgeColumnsStore.getAt(0).get('edge'),
					listeners: {
						change: function(field,value){
							if(value == 'measure' && chartType == 'linecolumn'){
								field.nextSibling().show();
							} else {
								field.nextSibling().hide();
							}
						}
					}
				},{
					xtype: 'selectfield',
					options: [
						{text: 'Line', value: 'line'},
						{text: 'Column', value: 'column'},
					],
					hidden: isSubEdgeHidden(),
					name : 'subedge_selector',
					value: edgeColumnsStore.getAt(0).get('subedge'),
				},{
					xtype: 'button',
					text : 'Set',
					handler: function(btn,e){
						var viewEditorValues = me.viewEditorPanel.getValues(),
							columnId = viewEditorValues.edge_set_columns_selector,
							edge = viewEditorValues.edge_selector,
							subedge = viewEditorValues.subedge_selector,
							rec = edgeColumnsStore.findRecord('columnId',columnId,0,false,true,true),
							usedRec = usedColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						rec.set('edge',edge);
						if(chartType != 'linecolumn' || edge != 'measure'){
							subedge = '';
						}
						rec.set('subedge',subedge);
						if(usedRec){
							if(edge == 'excluded'){
								usedColumnsStore.remove(usedRec);
							} else {
								usedRec.set('edge',edge);
								usedRec.set('subedge',subedge);
							}
						} else if(edge != 'excluded'){
							var newRec = rec.copy();
							usedColumnsStore.add(newRec);
							usedColumnsStore.sort();
						}
					}
				}]
			};
		} else {
			var edgeSetItem = {
				style: {
					'width': '100%',
				},
				layout: {
					type: 'hbox',
				},
				items: [{
					flex : 3,
					xtype: 'selectfield',
					store: edgeColumnsStore,
					displayField: 'caption',
					valueField  : 'columnId',
					name : 'edge_set_columns_selector',
					listeners: {
						change: function(field,value){
							var record = edgeColumnsStore.findRecord('columnId',value,0,false,true,true);
							if(record){
								var edgeSelectorField = field.nextSibling();
								var subEdgeSelectorField = edgeSelectorField.nextSibling();
								var edgeOptions = getEdgeOptions(record);
								edgeSelectorField.setOptions(edgeOptions);
								edgeSelectorField.setValue(record.get('edge'));
								if(record.get('subedge')){
									subEdgeSelectorField.show();
									subEdgeSelectorField.setValue(record.get('subedge'));
								} else {
									subEdgeSelectorField.hide();
								}
								field.ownerCt.doComponentLayout();
							}
						}
					}
				},{
					xtype: 'selectfield',
					options: getEdgeOptions(edgeColumnsStore.getAt(0)),
					name : 'edge_selector',
					value: edgeColumnsStore.getAt(0).get('edge'),
					flex : 2,
					listeners: {
						change: function(field,value){
							if(value == 'measure' && chartType == 'linecolumn'){
								field.nextSibling().show();
							} else {
								field.nextSibling().hide();
							}
							field.ownerCt.doComponentLayout();
						}
					}
				},{
					xtype: 'selectfield',
					options: [
						{text: 'Line', value: 'line'},
						{text: 'Column', value: 'column'},
					],
					hidden: isSubEdgeHidden,
					width: 135,
					name : 'subedge_selector',
					value: edgeColumnsStore.getAt(0).get('subedge'),
				},{
					xtype: 'button',
					text : 'Set',
					style: {
						width: '65px',
						height: '33px'
					},
					handler: function(btn,e){
						var viewEditorValues = me.viewEditorPanel.getValues(),
							columnId = viewEditorValues.edge_set_columns_selector,
							edge = viewEditorValues.edge_selector,
							subedge = viewEditorValues.subedge_selector,
							rec = edgeColumnsStore.findRecord('columnId',columnId,0,false,true,true),
							usedRec = usedColumnsStore.findRecord('columnId',columnId,0,false,true,true);
						rec.set('edge',edge);
						if(chartType != 'linecolumn' || edge != 'measure'){
							subedge = '';
						}
						rec.set('subedge',subedge);
						if(usedRec){
							if(edge == 'excluded'){
								usedColumnsStore.remove(usedRec);
							} else {
								usedRec.set('edge',edge);
								usedRec.set('subedge',subedge);
							}
						} else if(edge != 'excluded'){
							var newRec = rec.copy();
							usedColumnsStore.add(newRec);
							usedColumnsStore.sort();
						}
					}
				}]
			};
		}
		
		viewDetailsFieldsetBase.items.push(edgeSetItem);
		
		if(chartType == 'gaugeChart'){
			var scaleItem = {
				layout: {
					type: 'hbox'
				},
				items:[{
					xtype: 'textfield',
					flex: 1,
					name:  'gauge_min',
					value : getGaugeScale().min,
					label: 'Min Value'
				},{
					xtype: 'textfield',
					flex: 1,
					name:  'gauge_max',
					value : getGaugeScale().max,
					label: 'Max Value'
				}]
			};
			viewDetailsFieldsetBase.items.push(scaleItem);
		}
		
		
		
		var tpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="item-frame" tabindex="0">',
					'<tpl if="this.hasSubEdge(subedge) == false">',
						'<table width="100%"><tr><td style="width: 50%">{caption}</td>',
						'<tpl if="edge== &quot;category&quot;">',
							'<td style="width: 50%">Category</td>',
						'</tpl>',
						'<tpl if="edge== &quot;series&quot;">',
							'<td style="width: 50%">Series</td>',
						'</tpl>',
						'<tpl if="edge== &quot;measure&quot;">',
							'<td style="width: 50%">Measure</td>',
						'</tpl>',
						'</tr></table>',
					'</tpl>',
					'<tpl if="this.hasSubEdge(subedge)">',
						'<table width="100%"><tr><td style="width: 50%">{caption}</td>',
						'<tpl if="edge== &quot;category&quot;">',
							'<td width="50%">Category</td>',
						'</tpl>',
						'<tpl if="edge== &quot;series&quot;">',
							'<td width="50%">Series</td>',
						'</tpl>',
						'<tpl if="edge== &quot;measure&quot;">',
							'<td width="50%">',
								'<tpl if="subedge == &quot;line&quot;">',
									'Measure for Line',
								'</tpl>',
								'<tpl if="subedge== &quot;column&quot;">',
									'Measure for Column',
								'</tpl>',
							'</td>',
						'</tpl>',
						'</tr></table>',
					'</tpl>',
				'</div>',
			'</tpl>',
			{
				hasSubEdge: function(subedge){
					return subedge != '';
				},
				notExcluded: function(edge){
					return edge != 'excluded';
				}
			}
		);
		
		var usedColumnsList = {
			xtype: 'list',
			store: usedColumnsStore,
			cls: 'x-simbareports-list',
			style: {
				'margin-top': '1%',
			},
			scroll: false,
			itemTpl: tpl,
			listeners: {
				itemtap: function(list,index,item,e){
					var rec = list.getStore().getAt(index);
					if(rec){
						var edgeOptions = getEdgeOptions(rec);
						var edgeSelectorField = me.viewEditorPanel.getFields('edge_selector');
						var subEdgeSelectorField = me.viewEditorPanel.getFields('subedge_selector');
						edgeSelectorField.setOptions(edgeOptions);
						if(chartType == 'linecolumn' && rec.get('subedge') != ''){
							subEdgeSelectorField.show();
							me.viewEditorPanel.setValues({
								edge_set_columns_selector : rec.get('columnId'),
								edge_selector : rec.get('edge'),
								subedge_selector: rec.get('subedge')
							});
						} else {
							subEdgeSelectorField.hide();
							me.viewEditorPanel.setValues({
								edge_set_columns_selector : rec.get('columnId'),
								edge_selector : rec.get('edge')
							});
						}
						subEdgeSelectorField.ownerCt.doComponentLayout();
					}
				},
			}
		};
		
		viewDetailsFieldsetBase.items.push(usedColumnsList);
		
		// Drill Through Configuration
		var drillThroughFieldset = {
			xtype: 'fieldset',
			style: 'width: 100%',
			title: 'Drill Target',
			hidden: (me.drillThroughReportsStore.getCount() == 0 || chartType == 'gaugeChart') ? true : false,
			items:[{
				xtype: 'selectfield',
				store: me.drillThroughReportsStore,
				displayField: 'reportName',
				valueField  : 'reportCid',
				name : 'chart_drillthrough_selector',
				value: getDrillThroughCid(),
			}]
		};
		viewDetailsFieldsetBase.items.push(drillThroughFieldset);
		
		viewDetailsFieldsetBase.edgeColumnsStore = edgeColumnsStore;
		viewDetailsFieldsetBase.usedColumnsStore = usedColumnsStore;
		var viewDetailsFieldset = new Ext.form.FieldSet(viewDetailsFieldsetBase);
		return viewDetailsFieldset;
	},

	
	validateChartView: function(record){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			chartType = viewEditorValues.charttypeselector,
			usedColumnsStore = me.viewEditorPanel.viewDetailsFieldset.usedColumnsStore,
			categoryColumns = [],
			seriesColumns = [],
			measureColumns = [],
			simbaView = {},
			measurePosition = {
				line: [],
				column: []
			},
			chartViewInfo = {};
		record.viewType = 'chart';
		
		usedColumnsStore.each(function(rec){
			var edge = rec.get('edge');
			var columnId = rec.get('columnId');
			if(edge == 'category'){
				categoryColumns.push(columnId);
			}
			
			if(edge == 'series'){
				seriesColumns.push(columnId);
			}
			
			if(edge == 'measure'){
				measureColumns.push(columnId);
				if(chartType == 'linecolumn'){
					var subedge = rec.get('subedge');;
					if(subedge == 'line'){
						measurePosition['line'].push(columnId);
					} else {
						measurePosition['column'].push(columnId);
					}
				}
				if(columnId == 'cc1') record.useCount = true;
			}
			
		});
		
		if(measureColumns.length == 0){
			Ext.Msg.alert('Validate Error', 'At least one measure column is needed.');
			return false;
		} else if (chartType == 'pie' && seriesColumns.length == 0){
			Ext.Msg.alert('Validate Error', 'At least one series column is needed for the pie chart.');
			return false;
		} else if (chartType != 'pie' && categoryColumns.length == 0){
			Ext.Msg.alert('Validate Error', 'At least one category column is needed.');
			return false;
		} else if(chartType == 'gaugeChart'){
			if(measureColumns.length > 1){
				Ext.Msg.alert('Validate Error', 'Just one measure column is allowed for gauge chart.');
				return false;
			} else {
				var strMin = viewEditorValues['gauge_min'];
				var strMax = viewEditorValues['gauge_max'];
				if(strMin == '' || strMax == ''){
					Ext.Msg.alert('Validate Error', 'Min and Max value for the gauge chart are required.');
					return false;
				} else {
					if(parseInt(strMin)===false || parseInt(strMax)===false){
						Ext.Msg.alert('Validate Error', 'Min and Max value must be valid integer.');
						return false;
					} else {
						var intMin = parseInt(strMin);
						var intMax = parseInt(strMax);
						if(intMax - intMin <=0){
							Ext.Msg.alert('Validate Error', 'Max value must greater than min value.');
							return false;
						}
					}
				}
			}
		}
		chartViewInfo.categories = categoryColumns;
		chartViewInfo.series = seriesColumns;
		chartViewInfo.measures = measureColumns;
		chartViewInfo.type = chartType;
		chartViewInfo.subType = 'no';
		
		if(chartType == 'stackedcolumn'){
			chartViewInfo.type = 'column';
			chartViewInfo.subType = 'stacked';
		}
		
		if(chartType == 'stackedbar'){
			chartViewInfo.type = 'bar';
			chartViewInfo.subType = 'stacked';
		}
		
		if(chartType == 'gaugeChart'){
			chartViewInfo.scale = {
				min: viewEditorValues['gauge_min'] || 0,
				max: viewEditorValues['gauge_max']
			};
		}
		
		if(chartType == 'linecolumn') chartViewInfo.measurePosition = measurePosition;
		
		var drillThroughCid = viewEditorValues.chart_drillthrough_selector;
		// chartViewInfo.navigate = {
			// cid: 'none',
			// caption: 'None'
		// };
		
		// var drillRec = me.drillThroughReportsStore.findRecord('reportCid',drillThroughCid,0,false,true,true);
		// if(drillRec){
			// chartViewInfo.navigate = {
				// cid: drillThroughCid,
				// caption: drillRec.get('reportName')
			// };
		// }
		
		if(drillThroughCid != 'none'){
			chartViewInfo.navigate = {
				cid: 'none',
				caption: 'None'
			};
			var drillRec = me.drillThroughReportsStore.findRecord('reportCid',drillThroughCid,0,false,true,true);
			if(drillRec){
				chartViewInfo.navigate = {
					cid: drillThroughCid,
					caption: drillRec.get('reportName')
				};
			} else {
				chartViewInfo.navigate = {
					cid: drillThroughCid,
					caption: ''
				};
			}
		}
		
		simbaView.viewInfo = chartViewInfo;
		simbaView.viewType = 'chart';
		simbaView.viewCaption = viewEditorValues.viewcaption;
		simbaView.publish = viewEditorValues.publishtoggle;
		simbaView.action = record.action;
		simbaView.viewName = record.viewName;
		me.moveView(record);
		return simbaView;
	},
	
	validateTableView: function(record){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			simbaView = {};
		record.viewType = 'tableView';
		simbaView.viewType = 'tableView';
		simbaView.viewCaption = viewEditorValues.viewcaption;
		simbaView.publish = viewEditorValues.publishtoggle;
		simbaView.action = record.action;
		simbaView.viewName = record.viewName;
		me.moveView(record);
		return simbaView;
	},
	
	validateMapView: function(record){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			viewInfo = {},
			geocoder = new google.maps.Geocoder(),
			simbaView = {};
		record.viewType = 'mapView';
		console.log('viewEditorValues',viewEditorValues);
		viewInfo.geocodeSource = viewEditorValues.geocodeSource;
		viewInfo.latitude = viewEditorValues.latitudeColumn;
		viewInfo.longitude = viewEditorValues.longitudeColumn;
		viewInfo.location = viewEditorValues.addressColumn;
		viewInfo.series = viewEditorValues.series ? viewEditorValues.series.split(', ') : [];
		simbaView.viewType = 'mapView';
		simbaView.viewCaption = viewEditorValues.viewcaption;
		simbaView.publish = viewEditorValues.publishtoggle;
		simbaView.action = record.action;
		simbaView.viewName = record.viewName;
		if(viewInfo.geocodeSource == 'coordinate' && (viewInfo.latitude == '' || viewInfo.longitude == '')){
			Ext.Msg.alert('Validate Error','Latitude and Longitude columns are required');
			return false;
		} else if(viewInfo.geocodeSource == 'address' && viewInfo.location == '') {
			Ext.Msg.alert('Validate Error','Address column is required');
			return false;
		} else {
			if(viewInfo.geocodeSource == 'coordinate'){
				viewInfo.location = '';
			} else {
				viewInfo.latitude = '';
				viewInfo.longitude = '';
			}
			var maskEl = Ext.getBody();
			var loadMask = new Ext.LoadMask(maskEl, {
				msg: 'Validate...'
			});
			loadMask.show();
			if(viewEditorValues.mapcentertype == 'coordinate'){
				viewInfo.centerLatitude = viewEditorValues.centerLatitude;
				viewInfo.centerLongitude = viewEditorValues.centerLongitude;
				viewInfo.centerAddress = '';
				var latlng = new google.maps.LatLng(viewInfo.centerLatitude,viewInfo.centerLongitude);
				geocoder.geocode({'latLng': latlng}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK && results[0]){
						viewInfo.centerAddress = results[0].formatted_address;
						simbaView.viewInfo = viewInfo;
						console.log('coordinate',simbaView);
						var flag = 'I';
						for(var i=0; i< me.submitValues.views.length; i++ ){
							if(me.submitValues.views[i].viewName == simbaView.viewName){
								me.submitValues.views[i] = simbaView;
								flag = 'U';
								break;
							}
						}
						if(flag == 'I'){
							me.submitValues.views.push(simbaView);
						}
						loadMask.destroy();
						loadMask.disable();
						me.moveView(record);
						me.setActiveItem(me.frontPanel);
						me.viewEditorPanel.destroy();
					} else {
						Ext.Msg.alert('Validate Error','The provided lat and lng for map center is not valid.');
						simbaView = false;
						return false;
					}
				});
			} else {
				viewInfo.centerLatitude = '0';
				viewInfo.centerLongitude = '0';
				viewInfo.centerAddress = viewEditorValues.centerAddress;
				geocoder.geocode( { 'address': viewInfo.centerAddress}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						viewInfo.centerLatitude = results[0].geometry.location.lat();
						viewInfo.centerLongitude = results[0].geometry.location.lng();
						simbaView.viewInfo = viewInfo;
						console.log('address',simbaView);
						var flag = 'I';
						for(var i=0; i< me.submitValues.views.length; i++ ){
							if(me.submitValues.views[i].viewName == simbaView.viewName){
								me.submitValues.views[i] = simbaView;
								flag = 'U';
								break;
							}
						}
						if(flag == 'I'){
							me.submitValues.views.push(simbaView);
						}
						me.moveView(record);
						loadMask.destroy();
						loadMask.disable();
						me.setActiveItem(me.frontPanel);
						me.viewEditorPanel.destroy();
						return simbaView;
					} else {
						Ext.Msg.alert('Validate Error','The provided address for map center is not valid.');
						simbaView = false;
						return false;
					}
				});
			}
		}
	},
	
	moveView: function(record){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
			unpubishedViewsStore = me.frontPanel.viewsFieldset.unpubishedViewsListFieldset.items[0].store;
			
		var idx = unpubishedViewsStore.findExact('viewName',record.viewName);
		if(idx != -1){
			unpubishedViewsStore.removeAt(idx);
		}
		var idx = publishedViewsStore.findExact('viewName',record.viewName);
		if(idx != -1){
			publishedViewsStore.removeAt(idx);
		}
		if(viewEditorValues.publishtoggle == 0){
			unpubishedViewsStore.add(record);
		} else {
			publishedViewsStore.add(record);
		}
	},
	
	validatePivotTableView: function(record){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			usedColumnsStore = me.viewEditorPanel.viewDetailsFieldset.usedColumnsStore,
			viewInfo = {},
			pageColumns = [],
			sectionColumns = [],
			columnColumns = [],
			rowColumns = [],
			measureColumns = [],
			simbaView = {};
		
		record.viewType = 'pivotTable';
		usedColumnsStore.each(function(rec){
			var edge = rec.get('edge');
			var columnId = rec.get('columnId');
			if(edge == 'page'){
				pageColumns.push(columnId);
			}
			if(edge == 'section'){
				sectionColumns.push(columnId);
			}
			if(edge == 'column'){
				columnColumns.push(columnId);
			}
			if(edge == 'row'){
				rowColumns.push(columnId);
			}
			if(edge == 'measure'){
				measureColumns.push(columnId);
				if(columnId == 'cc1') record.useCount = true;
			}
			
		});
		var dimColumns = [].concat(pageColumns,sectionColumns,columnColumns,rowColumns);
		if(measureColumns.length == 0){
			Ext.Msg.alert('Validate Error', 'At least one measure column is needed.');
			return false;
		} else if(dimColumns.length == 0){
			Ext.Msg.alert('Validate Error', 'At least one dimension column is needed.');
			return false;
		} else {
			simbaView.viewType = 'pivotTable';
			simbaView.viewCaption = viewEditorValues.viewcaption;
			simbaView.publish = viewEditorValues.publishtoggle;
			simbaView.action = record.action;
			simbaView.viewName = record.viewName;
			viewInfo['measureLabel'] = viewEditorValues['measurelabel'];
			var totalat = viewEditorValues['totalat'].replace(/(^\s*)|(\s*$)/g, "");
			var totalAtArray = totalat.split(', ');
			viewInfo['page'] = {};
			viewInfo['section'] = {};
			viewInfo['column'] = {};
			viewInfo['row'] = {};
			
			viewInfo['page']['columns'] = pageColumns;
			viewInfo['section']['columns'] = sectionColumns;
			viewInfo['column']['columns'] = columnColumns;
			viewInfo['row']['columns'] = rowColumns;
			
			for(var i=0; i< totalAtArray.length; i++){
				if(totalAtArray[i] == 'page') viewInfo['page']['total'] = 'after';
				if(totalAtArray[i] == 'section') viewInfo['section']['total'] = 'after';
				if(totalAtArray[i] == 'column') viewInfo['column']['total'] = 'after';
				if(totalAtArray[i] == 'row') viewInfo['row']['total'] = 'after';
			}
			
			viewInfo['measure'] = measureColumns;
			simbaView.viewInfo = viewInfo;
			me.moveView(record);
			return simbaView;
		}
	},
	
	validateView: function(isRemove){
		var me = this,
			viewEditorValues = me.viewEditorPanel.getValues(),
			viewType = viewEditorValues.viewtypeselector,
			viewDetailsFieldset = me.viewEditorPanel.viewDetailsFieldset,
			publishedViewsStore = me.frontPanel.viewsFieldset.publishedViewsListFieldset.items[0].store,
			unpubishedViewsStore = me.frontPanel.viewsFieldset.unpubishedViewsListFieldset.items[0].store,
			totalViews = publishedViewsStore.getCount() + unpubishedViewsStore.getCount();
		if(isRemove == undefined) isRemove = false;
			
		if(me.viewEditorPanel.oldView != undefined){
			var oldPublish = (me.viewEditorPanel.oldView.publish != undefined) ? me.viewEditorPanel.oldView.publish : 1;
			var action = (me.viewEditorPanel.oldView.action != undefined) ? me.viewEditorPanel.oldView.action : 'edit';
			var viewId = (me.viewEditorPanel.oldView.viewId != undefined) ? me.viewEditorPanel.oldView.viewId : totalViews;
		} else {
			var action = 'add';
			var viewId = totalViews;
		}
		var record = {
			'action' : action,
			'viewId' : viewId,
		};
		
		var getOldViewCaption = function(oldView){
			if(oldView == undefined) return '';
			if(oldView.viewCaption) return oldView.viewCaption;
			if(oldView.caption) return oldView.caption;
			if(oldView.viewInfo && oldView.viewInfo.viewCaption) return oldView.viewInfo.viewCaption;
			return '';
		};
		
		var oldViewCaption = getOldViewCaption(me.viewEditorPanel.oldView);
		
		if(isRemove){
			simbaView = {};
			simbaView.viewType = viewType;
			simbaView.viewCaption = viewEditorValues.viewcaption;
			simbaView.publish = 0;
			simbaView.action = record.action;
			simbaView.viewName = me.viewEditorPanel.oldView.viewName;
			simbaView.viewInfo = {};
			simbaView.useCount = false;
			me.moveView(simbaView);
			return simbaView;
		}
		
		var captionCount = publishedViewsStore.countBy(['caption'],viewEditorValues.viewcaption);
		
		if(viewDetailsFieldset && (viewDetailsFieldset.viewtype != viewType)){
			Ext.Msg.alert('Validate Error','The view configurations does not match the view type!');
			return false;
		} else if (oldViewCaption != '' && oldViewCaption != viewEditorValues.viewcaption && captionCount >= 1){
			Ext.Msg.alert('Validate Error','Duplicate view name is set!');
			return false;
		} else if (oldViewCaption == '' && captionCount >= 1){
			Ext.Msg.alert('Validate Error','Duplicate view name is set!');
			return false;
		} else {
			if(viewType == 'tableView'){
				if(me.viewEditorPanel.oldView != undefined && me.viewEditorPanel.oldView.viewName != undefined){
					record.viewName = me.viewEditorPanel.oldView.viewName;
				} else {
					record.viewName = 'Table_' + new Date().getTime();
				}
				record.caption = (viewEditorValues.viewcaption == '') ? record.viewName : viewEditorValues.viewcaption;
				var simbaView = me.validateTableView(record);
			} else if(viewType == 'pivotTable'){
				if(me.viewEditorPanel.oldView != undefined && me.viewEditorPanel.oldView.viewName != undefined){
					record.viewName = me.viewEditorPanel.oldView.viewName;
				} else {
					record.viewName = 'Pivot Table_' + new Date().getTime();
				}
				record.caption = (viewEditorValues.viewcaption == '') ? record.viewName : viewEditorValues.viewcaption;
				var simbaView = me.validatePivotTableView(record);
			} else if(viewType == 'chart'){
				if(me.viewEditorPanel.oldView != undefined && me.viewEditorPanel.oldView.viewName != undefined){
					record.viewName = me.viewEditorPanel.oldView.viewName;
				} else {
					record.viewName = 'Chart_' + new Date().getTime();
				}
				record.caption = (viewEditorValues.viewcaption == '') ? record.viewName : viewEditorValues.viewcaption;
				var simbaView = me.validateChartView(record);
			} else if(viewType == 'mapView'){
				if(me.viewEditorPanel.oldView != undefined && me.viewEditorPanel.oldView.viewName != undefined){
					record.viewName = me.viewEditorPanel.oldView.viewName;
				} else {
					record.viewName = 'Map_' + new Date().getTime();
				}
				record.caption = (viewEditorValues.viewcaption == '') ? record.viewName : viewEditorValues.viewcaption;
				var simbaView = me.validateMapView(record);
			}
		}
		return simbaView;
	}
	

});


Ext.util.Droppable.override({
	onDragStart : function(draggable, e) {
		if(this.inDraggableGroup(draggable)){
            this.monitoring = true;
            this.el.addCls(this.activeCls);
            this.region = this.el.getPageBox(true);

            draggable.on({
                drag: this.onDrag,
                beforedragend: this.onBeforeDragEnd,
                dragend: this.onDragEnd,
                scope: this
            });

            if (this.isDragOver(draggable)) {
                this.setCanDrop(true, draggable, e);
            }

            this.fireEvent('dropactivate', this, draggable, e);
        }
        else {
            draggable.on({
                dragend: function() {
                    this.el.removeCls(this.invalidCls);
                },
                scope: this,
                single: true
            });
            this.el.addCls(this.invalidCls);
        }
    },
	inDraggableGroup: function(draggable){
		if(Ext.isString(draggable.group)){
			if (draggable.group === this.group){ 
				return true;
			}
		} else if (Ext.isArray(draggable.group)){
			if(draggable.group.indexOf(this.group) != -1){
				return true;
			}
		}
		return false;
	}
});

Ext.form.FieldSet.override({	
	setTitle: function(title){
		var me = this;
        if (me.rendered) {
            if (!me.titleEl) {
				if(me.collapsible){
					me.titleToolbar = new Ext.Toolbar({
						renderTo: me.el,
						dock: 'top',
						ownerCmp: me,
						items: [{
							text: title,
							cls : 'x-fieldset-toolbar-title-button',
							ui  : 'plain'
						},{
							xtype: 'spacer'
						},{
							text: (me.collapsed) ? '--' : '|',
							// width: 30,
							// height: 30,
							cls : 'x-fieldset-toolbar-collapsible-button',
							ui  : 'plain',
							handler: function(btn,e){
								if(btn.getText() == '--'){
									me.el.last().removeCls('x-hidden-display');
									btn.setText('|');
								} else {
									me.el.last().addCls('x-hidden-display');
									btn.setText('--');
								}
							}
							// iconCls: 'alarrow',
							// iconMask: true,
							// rotateDeg: 0,
							// handler : function(btn,e){
								// if(btn.rotateDeg == 0){
									// me.el.last().removeCls('x-hidden-display');
									// me.rotateArrow(btn.iconEl, 90);
									// btn.rotateDeg = 90;
								// } else {
									// me.el.last().addCls('x-hidden-display');
									// me.rotateArrow(btn.iconEl, 0);
									// btn.rotateDeg = 0;
								// }
							// }
						}]
					});
					me.titleEl = me.el.insertFirst(me.titleToolbar.getEl());
					// var rotateButton = me.titleToolbar.items.items[2];
					// if(!me.collapsed){
						// me.el.last().removeCls('x-hidden-display');
						// me.rotateArrow(rotateButton.iconEl, 90);
						// rotateButton.rotateDeg = 90;
					// } else {
						// me.el.last().addCls('x-hidden-display');
						// me.rotateArrow(rotateButton.iconEl, 0);
						// rotateButton.rotateDeg = 0;
					// }
				} else {
					me.titleEl = me.el.insertFirst({
						cls: me.componentCls + '-title'
					});
					me.titleEl.setHTML(title);
				}
            }
        } else {
            me.title = title;
        }
        return me;
    },
	
	destroy: function(){
		Ext.form.FieldSet.superclass.destroy.call(this);
		if(this.titleToolbar){
			this.titleToolbar.destroy();
		}
	},
	
	rotateArrow: function(el, deg) {
		el.setStyle({
			"-webkit-transform"                  : "rotate(" + deg + "deg)",
			"-webkit-transition-property"        : "-webkit-transform",
			"-webkit-transition-duration"        : "300ms",
			"-webkit-transition-timing-function" : "ease-in"
		});
	}
});

Ext.form.Select.override({
	getListPanel: function() {
        if (!this.listPanel) {
            this.listPanel = new Ext.Panel({
                floating         : true,
                stopMaskTapEvent : false,
                hideOnMaskTap    : true,
                cls              : 'x-select-overlay',
                scroll           : 'vertical',
                items: {
                    xtype: 'list',
                    store: this.store,
                    itemId: 'list',
                    scroll: false,
                    itemTpl : [
                        '<span class="x-list-label">{' + this.displayField + '}</span>',
                        '<span class="x-list-selected"></span>'
                    ],
                    listeners: {
                        select   : this.onListSelect,
                        scope    : this
                    }
                },
				listeners: {
					show  : this.onListShow,
					scope  : this
				}
            });
        }

        return this.listPanel;
    },
	
	onListShow: function(listPanel){
		this.oldValue = this.getValue();
	},
	
	onPickerChange: function(picker, value) {
        var currentValue = this.getValue(),
            newValue = value[this.name];
		this.oldValue = currentValue;
        if (newValue != currentValue) {
            this.setValue(newValue);
            this.fireEvent('change', this, newValue);
        }
    },
	
});