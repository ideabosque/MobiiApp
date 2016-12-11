var SimbaDashboardPageBase = {
	layout: 'card',
	simba : this.pagesimba,

	initComponent: function() {
		var me = this;
		if (! _offline) {
			me.prompts = me.createPrompts();
		}
		
		me.createReports();
		me.listeners = {
			beforedestroy: function(dashboardPage){
				var ln = dashboardPage.items.items.length;
				for(var i=0; i < ln; i++){
					dashboardPage.setActiveItem(i);
				}
			}
		};
		me.simbatype = 'simbapage';
        SimbaApp.views.DashboardPage.superclass.initComponent.call(me, arguments);
    },
    
    createPrompts: function(){
    	var me = this,
    		promptItems = [],
    		promptSimba = me.pagesimba.pagePrompts,
			promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
    		
		if(promptForm && ! promptForm.isDestroyed) return promptForm;
		
		var clearResetFieldset = {
			xtype: 'fieldset',
			style: {'width':'100%'},
			items:[{
				xtype: 'button',
				style: 'margin:2%;',
				text: 'Reset',
				handler: function(btn,e){
					var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
					promptForm.reset();
				}
			},{
				xtype: 'button',
				style: 'margin:2%;',
				text: 'Roll Back',
				handler: function(btn,e){
					var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
					if(promptForm.submittedValues){
						promptForm.setValues(promptForm.submittedValues);
					} else {
						promptForm.reset();
					}
				}
			}]
		};
		promptItems.push(clearResetFieldset);
		
    	for(var promptCid in promptSimba){
			if(promptCid == 'defaultFilters' || promptCid == 'variables') continue;
    		var promptFilters = promptSimba[promptCid].promptFilters;
    		var filterItems = {};
    		filterItems.xtype = 'fieldset';
			// filterItems.instruction = 'Please use (BLANK) to search blank value and (NULL) to search null value.';
    		filterItems.defaults = {
				required: false,
				labelAlign: 'left',
				// labelWidth: '40%'
			};
    		filterItems.items = [];
    		Ext.each(promptFilters, function(filter, filterIndex, allFilters){
    			switch (filter.control){
    				case 'edit':
    					var filterItem = me.createEditPromptFilterItem(filter);
    					filterItems.items.push(filterItem);
    					break;
					case 'calendar':
    					var filterItem = me.createCalendarPromptFilterItem(filter);
    					filterItems.items.push(filterItem);
    					break;
    				case 'drop':
    					var filterItem = me.createDropPromptFilterItem(filter);
    					filterItems.items.push(filterItem);
    					break;
    				case 'multi':
    					var filterItem = me.createMultiPromptFilterItem(filter);
    					filterItems.items.push(filterItem);
    					break;
    				default: 
    			}
    		});
    		promptItems.push(filterItems);
    	}
    	var promptFormBase = {
    		scroll: 'vertical',
			cls  : 'x-login-screen',
			standardSubmit : false,
			items : promptItems || [],
			simbatype: 'simbaprompt',
			cid : me.cid,
			dockedItems: [{
				xtype: 'toolbar',
				dock : 'bottom',
				items: [{
					text: 'Cancel',
					ui: 'back',
					handler: function(btn,e) {
						var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
						if(promptForm.submittedValues){
							promptForm.setValues(promptForm.submittedValues);
						} else {
							promptForm.reset();
						}
						var dashboardPage = eval("SimbaApp.views.DashboardPage" + me.simbapageid);
						SimbaApp.views.viewport.setActiveItem(dashboardPage);
						if(Ext.is.Phone){
							SimbaApp.views.viewport.backButton.show();
						}
					}
				},{
					xtype: 'spacer'
				},{
					text: 'Go',
					ui: 'forward',
					handler: function(btn,e){
						me.submitPrompts();
					}
				}]
    		}]
		};
		var promptForm = new Ext.form.FormPanel(promptFormBase);
		eval("SimbaApp.views.Prompts" + me.simbapageid + "= promptForm;");
		SimbaApp.views.viewport.optionsButton.show();
		SimbaApp.views.viewport.commentButton.show();
		return promptForm;
		
	},
	
	submitPrompts: function(){
		var me = this,
			promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid),
			dashboardPage = eval("SimbaApp.views.DashboardPage" + me.simbapageid),
			filterValues = promptForm.getValues();
		
		for(var pname in promptForm.getValues()){
			var pv = promptForm.getValues()[pname];
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
			url   : _urlBase + _pageURL,
			params: {
				controller: me.controller,
				typename  : me.typename,
				control_id: me.cid,
				filters   : Ext.encode(filterValues),
				username: window.localStorage.getItem("username") || 'demo',
				password: window.localStorage.getItem("password")
			},
			timeout: _defaultTimeout,
			failure : function(response,opts){
				if(response.status === 404){
					Ext.Ajax.request({
						url   : _urlBase + _pageURL,
						params: {
							controller: me.controller,
							typename  : me.typename,
							control_id: me.cid,
							filters   : Ext.encode(filterValues),
							username: window.localStorage.getItem("username") || 'demo',
							password: window.localStorage.getItem("password")
						},
						timeout: _defaultTimeout,
						failure : function(response,opts){
							console.log('Failed',response);
							Ext.Msg.alert('Failed','Error while processing query!');
						},
						success: function(response, opts) {
							try {
								var data = Ext.decode(response.responseText);
								if(data.success){
									if(dashboardPage) {
										SimbaApp.views.viewport.setActiveItem(dashboardPage);
										dashboardPage.destroy();
									}
									dashboardPage = new SimbaApp.views.DashboardPage({
										cid: me.cid, 
										controller: me.controller,
										typename  : me.typename,
										pagesimba: data.pagesimba,
										simbapageid : me.simbapageid
									});
									var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
									promptForm.submittedValues = promptForm.getValues();
									if(SimbaApp.views.viewport.getActiveItem() !== dashboardPage) SimbaApp.views.viewport.setActiveItem(dashboardPage);
									eval("SimbaApp.views.DashboardPage" + me.simbapageid + "= dashboardPage;");
									SimbaApp.views.viewport.optionsButton.show();
									SimbaApp.views.viewport.commentButton.show();
									if(Ext.is.Phone){
										SimbaApp.views.viewport.backButton.show();
									}
								}
							} catch(err) {
								console.log(err);
							}
							loadMask.destroy();
							loadMask.disable();
						}
					});
				} else {
					console.log('Failed',response);
					Ext.Msg.alert('Failed','Error while processing query!');
				}
			},
			success: function(response, opts) {
				var data = Ext.decode(response.responseText);
				if(data.success){
					if(dashboardPage) {
						SimbaApp.views.viewport.setActiveItem(dashboardPage);
						dashboardPage.destroy();
					}
					dashboardPage = new SimbaApp.views.DashboardPage({
						cid: me.cid, 
						controller: me.controller,
						typename  : me.typename,
						pagesimba: data.pagesimba,
						simbapageid : me.simbapageid
					});
					var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
					promptForm.submittedValues = promptForm.getValues();
					if(SimbaApp.views.viewport.getActiveItem() !== dashboardPage) SimbaApp.views.viewport.setActiveItem(dashboardPage);
					SimbaApp.views.viewport.optionsButton.show();
					SimbaApp.views.viewport.commentButton.show();
					eval("SimbaApp.views.DashboardPage" + me.simbapageid + "= dashboardPage;");
					if(Ext.is.Phone){
						SimbaApp.views.viewport.backButton.show();
					}
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
				console.log(me.cid,loadMask);
			}
		},126000);
	},
	
	onConstrainedPromptValueChange: function(){
		var me = this,
			promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid),
			dashboardPage = eval("SimbaApp.views.DashboardPage" + me.simbapageid),
			filterValues = promptForm.getValues();
		
		for(var pname in promptForm.getValues()){
			var pv = promptForm.getValues()[pname];
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
			url   : _urlBase + _pageURL,
			params: {
				controller: me.controller,
				typename  : me.typename,
				control_id: me.cid,
				filters   : Ext.encode(filterValues),
				refreshPrompt: true,
				username: window.localStorage.getItem("username") || 'demo',
				password: window.localStorage.getItem("password")
			},
			timeout: _defaultTimeout,
			failure : function(response,opts){
				if(response.status === 404){
					Ext.Ajax.request({
						url   : _urlBase + _pageURL,
						params: {
							controller: me.controller,
							typename  : me.typename,
							control_id: me.cid,
							filters   : Ext.encode(filterValues),
							refreshPrompt: true,
							username: window.localStorage.getItem("username") || 'demo',
							password: window.localStorage.getItem("password")
						},
						timeout: _defaultTimeout,
						failure : function(response,opts){
							console.log('Failed',response);
							Ext.Msg.alert('Failed','Error while processing query!');
						},
						success: function(response, opts) {
							try {
								var data = Ext.decode(response.responseText);
								if(data.success){
									console.log('data',data);
									dashboardPage.pagesimba.pagePrompts = data.pagesimba.pagePrompts;
									var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
									promptForm.destroy();
									delete promptForm;
									var newPromptForm = me.createPrompts();
									SimbaApp.views.viewport.setActiveItem(newPromptForm);
								}
							} catch(err) {
								console.log(err);
							}
							loadMask.destroy();
							loadMask.disable();
						}
					});
				} else {
					console.log('Failed',response);
					Ext.Msg.alert('Failed','Error while processing query!');
				}
			},
			success: function(response, opts) {
				var data = Ext.decode(response.responseText);
				if(data.success){
					console.log('data',data);
					dashboardPage.pagesimba.pagePrompts = data.pagesimba.pagePrompts;
					var promptForm = eval("SimbaApp.views.Prompts" + me.simbapageid);
					promptForm.destroy();
					delete SimbaApp.views["SimbaApp.views.Prompts" + me.simbapageid];
					// delete eval("SimbaApp.views.Prompts" + me.simbapageid);
					var newPromptForm = me.createPrompts();
					SimbaApp.views.viewport.setActiveItem(newPromptForm);
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
				console.log(me.cid,loadMask);
			}
		},126000);
	},
	
	createEditPromptFilterItem: function(filter){
		if (filter.op == 'between'){
			return {
				xtype : 'fieldset',
				title : filter.caption,
				items:[{
  			  		xtype : 'textfield',
			 		name  : filter.name + '_1',
			  		label : 'Between',
			  		value : filter.defaultValue
				},{
			  		xtype : 'textfield',
			  		name  : filter.name + '_2',
			  		label : 'And',
			  		value : filter.defaultValue2
				}]
			};
		}else{
			return {
				xtype : 'textfield',
				name  : filter.name,
				label : filter.caption,
				value : filter.defaultValue
			};
		}
	},
	
	createCalendarPromptFilterItem: function(filter){
		var me = this;
		if (filter.op == 'between'){
			var defaultValue = me.convertDateDefaultValue(filter.defaultValue);
			var defaultValue2 = me.convertDateDefaultValue(filter.defaultValue2);
			return {
				xtype : 'fieldset',
				title : filter.caption,
				items:[{
  			  		xtype : 'datepickerfield',
			 		name  : filter.name + '_1',
			  		label : 'Between',
			  		value : defaultValue,
					picker: {yearFrom: 1980, yearTo: defaultValue.getFullYear()}
				},{
			  		xtype : 'datepickerfield',
			  		name  : filter.name + '_2',
			  		label : 'And',
			  		value : defaultValue2,
					picker: {yearFrom: 1980, yearTo: defaultValue2.getFullYear()}
				}]
			};
		}else{
			var defaultValue = me.convertDateDefaultValue(filter.defaultValue);
			return {
				xtype : 'datepickerfield',
				name  : filter.name,
				label : filter.caption,
				value : defaultValue,
				picker: {yearFrom: 1981, yearTo: defaultValue.getFullYear()}
			};
		}
	},
	
	convertDateDefaultValue: function(value){
		if(value){
			var t = (value.indexOf('T') === -1) ? value.indexOf(' ') : value.indexOf('T');
			var dateStr = (t !== -1) ? value.substring(0,t) : value;
			var defaultValue = Date.parseDate(dateStr,'Y-m-d');
		} else {
			var defaultValue = new Date();
		}
		return defaultValue;
	},
	
	createDropPromptFilterItem: function(filter){
		var options = [];
		var me = this;
		for(var k in filter.data){
			Ext.each(filter.data[k], function(item,index,allItems){
				if(typeof(item) === 'string'){
					var option = {};
					option.text = option.value = item;
					options.push(option);
				}
			});
		}
		
		if(filter.includeAllChoices === "true"){
			options.unshift({
				text: '(All Choices)',
				value: 'allChoices'
			});
		} 

		if(filter.defaultX === ""){
			options.unshift({
				text: '',
				value: ''
			});
		}

		if (filter.op == 'between'){		
			return {
				xtype : 'fieldset',
				title : filter.caption,
				items:[{
					xtype: 'selectfield',
					name : filter.name + '_1',
                    label: 'Between',
					options: options,
					value: filter.defaultValue,
					listeners:{
						change: function(selectField,value){
							console.log(value);
						}
					}
				},{
					xtype: 'selectfield',
					name : filter.name + '_2',
					label: 'And',
					options: options,
					value: filter.defaultValue2,
					listeners:{
						change: function(selectField,value){
							console.log(value);
						}
					}
				}]
			};
		}else{
			return {
        	    xtype: 'selectfield',
        	    name : filter.name,
        	    label: filter.caption,
        	    options: options,
        	    value: filter.defaultValue,
				listeners: {
					change: function(field,value){
						if(filter.constrained && filter.constrained.length >0){
							me.onConstrainedPromptValueChange();
						}
					}
				}
        	};
        }
	},
	
	createMultiPromptFilterItem: function(filter){
		var me = this;
		var optionsData = [];
		
		for(var k in filter.data){
			Ext.each(filter.data[k], function(item,index,allItems){
				if(typeof(item) === 'string'){
					var option = {};
					option.text = option.value = item;
					optionsData.push(option);
				}
			});
		}
		
		if(filter.includeAllChoices === "true"){
			optionsData.unshift({
				text: '(All Choices)',
				value: 'allChoices'
			});
		} 
		
		var multiStore = new Ext.data.Store({
			fields : [
				{ name : "text",  type : "string" },
				{ name : "value", type : "string" }
    		],
    		data : optionsData
		});
		
		var multifield = {
			xtype        : "multiselectfield",
			label        : filter.caption,
			store        : multiStore,
			displayField : "text",
			valueField   : "value",
			value        : filter.defaultValue,
			name         : filter.name,
			itemType     : "list",
			listeners    : {
				'finalchange': function(field){
					// console.log('multiselectfield',field);
					if(filter.constrained && filter.constrained.length >0){
						me.onConstrainedPromptValueChange();
					}
				},
				'selectionchange': function(selModel,records){
					// console.log('selModel',selModel);
					// console.log('records',records);
					// console.log('this',this);
					var field = this;
					var len = records.length;
					var allChoices = false;
					for(var i=0; i<len; i++){
						if(records[i].get('value') == 'allChoices'){
							allChoices = true;
							break;
						}
					}
					if(allChoices && this.value != 'allChoices'){
						field.setValue('allChoices');
						// Ext.Msg.alert('Warning','All Choices contains all values. All other values do not need to be selected.',function(){
							// field.setValue('allChoices');
						// });
					}
					// console.log('allChoices',allChoices);
				}
			}
		};
		
		// var choosAllButton = {
			// xtype: 'button',
			// text: 'Select All',
			// handler: function(btn,e){
			
			// }
		// };
		
		// var clearAllButton = {
			// xtype: 'button',
			// text: 'Clear All',
			// handler: function(btn,e){
			
			// }
		// };
		
		// var multifieldset = {
			// xtype: 'fieldset',
			// style: 'width: 100%; margin: 10px 0px 10px 0',
			// items: [
				// multifield,
				// {
					// layout: 'hbox',
					// items: [{xtype: 'spacer'},choosAllButton,clearAllButton]
				// }
			// ]
		// };
		return multifield;
		
	},

	
	createReports: function(){
		var me = this,
			reportBtns = [],
			reportIdx = 0,
    		reportSimba = me.pagesimba.pageReports;
		for(var reportCid in reportSimba){
			if(reportIdx === 0){
				var report = new SimbaApp.views.SimbaReport({
					title: reportSimba[reportCid].caption,
					pagecid: me.cid, 
					simbapageid: me.simbapageid,
					reportid: reportCid, 
					simba: reportSimba[reportCid]
				});
				me.items = [report];
			}
			reportIdx += 1;
		}
		// if(!Ext.is.Phone && reportIdx > 1) me.createControlToolbar();
	},
	
	createControlToolbar: function(){
		var me = this,
			totalReports = me.getTotalReports();
		var bar = me.controlBar = new Ext.Toolbar({
			dock: 'bottom',
			style: 'background: transparent;',
			items: [{
				iconCls: 'arrow_left',
				iconMask: true,
				text: 'Previous',
				iconAlign: 'left',
				hidden: true,
				handler: function(btn,e){
					var viewport = (_offline) ? SimbaApp.views.offlinePanel : SimbaApp.views.viewport;
					if(viewport.optionsPanel == undefined){
						viewport.createOptionsPanel();
					} 
					var checkedIdx = viewport.buildReportsList(me,false);
					var store = viewport.simbaReportsList.getStore(),
						ln = store.getCount(),
						preRecord = store.getAt(checkedIdx - 1),
						preReportCid = preRecord.get('reportCid'),
						currentReport = me.getActiveItem();
					var preReport = new SimbaApp.views.SimbaReport({
						title: me.pagesimba.pageReports[preReportCid].caption,
						pagecid: me.cid, 
						simbapageid: me.simbapageid,
						reportid: preReportCid, 
						simba: me.pagesimba.pageReports[preReportCid]
					});
					me.remove(currentReport,true);
					me.setActiveItem(preReport);
					checkedIdx = checkedIdx - 1;
					if(checkedIdx == 0){
						btn.hide();
					}
					if(checkedIdx != ln-1){
						me.controlBar.items.items[2].show();
					}
				}
			},{
				xtype: 'spacer'
			},{
				iconCls: 'arrow_right',
				iconMask: true,
				text: 'Next',
				iconAlign: 'right',
				hidden: (totalReports >1) ? false : true,
				handler: function(btn,e){
					var viewport = (_offline) ? SimbaApp.views.offlinePanel : SimbaApp.views.viewport;
					if(viewport.optionsPanel == undefined){
						viewport.createOptionsPanel();
					} 
					var checkedIdx = viewport.buildReportsList(me,false);
					var store = viewport.simbaReportsList.getStore(),
						ln = store.getCount(),
						nextRecord = store.getAt(checkedIdx + 1),
						nextReportCid = nextRecord.get('reportCid'),
						currentReport = me.getActiveItem();
					var nextReport = new SimbaApp.views.SimbaReport({
						title: me.pagesimba.pageReports[nextReportCid].caption,
						pagecid: me.cid, 
						simbapageid: me.simbapageid,
						reportid: nextReportCid, 
						simba: me.pagesimba.pageReports[nextReportCid]
					});
					me.remove(currentReport,true);
					me.setActiveItem(nextReport);
					checkedIdx = checkedIdx + 1;
					if(checkedIdx == ln-1){
						btn.hide();
					}
					if(checkedIdx != 0){
						me.controlBar.items.items[0].show();
					}
				}
			}]
		});
		me.dockedItems = me.dockedItems || [];
		me.dockedItems.push(bar);
	},
	getTotalReports: function(){
		var me = this,
			pageReports = me.pagesimba.pageReports,
			totalReports = 0;
		for(var reportcid in pageReports){
			totalReports = totalReports + 1;
		}
		return totalReports;
	}
};


SimbaApp.views.DashboardPage = Ext.extend(Ext.Panel, SimbaDashboardPageBase);

var SimbaFilePageBase = {
	// layout: Ext.is.Blackberry ? 'fit' : 'card',
	layout: 'card',
	simba : this.pagesimba,
	// scroll: 'both',

	initComponent: function() {
		var me = this;
		
		me.createReports();
		me.simbatype = 'filepage';
		
		me.listeners = {
			afterrender: function(){
				var img = Ext.get('filepage_' + me.cid);
				if(img){
					img.on('pinch', function(e){
						var dimensions = img.getSize(),
							factor = 5;
						if(e.deltaScale < 0){
							factor *= -1;
						}
						img.setSize(dimensions.width + factor, dimensions.height + factor);
					});
				}
			}
		}
		if(SimbaApp.views.viewport && !SimbaApp.views.viewport.hidden){
			SimbaApp.views.viewport.optionsButton.show();
			SimbaApp.views.viewport.commentButton.show();
		}
        SimbaApp.views.FilePage.superclass.initComponent.call(me, arguments);
    },
	
	calcImageSize: function(){
		var me = this,
			w=window,
			d=document,
			e=d.documentElement,
			g=d.getElementsByTagName('body')[0],
			x=w.innerWidth||e.clientWidth||g.clientWidth,
			y=w.innerHeight||e.clientHeight||g.clientHeight,
			imgWidth, imgHeight, imgSize;
		if(Ext.is.Blackberry){
			imgSize = {
				x: x,
				y: y-46
			};
		} else if(Ext.is.Phone){
			imgSize = {
				x: x,
				y: y-46-46
			};
		} else if(Ext.is.iPad) {
			imgSize = {
				x: 750,
				y: y-46-46
			};
		} else {
			imgSize = {
				x: x-300,
				y: y-46-46
			};
		}
		// console.log('imgSize',imgSize);
		return imgSize;
	},
	
	createReports: function(){
		var me = this,
			imgBtns = [],
			imgIdx = 0,
			imgSize = me.calcImageSize(),
    		imgs = me.pagesimba.imgs;
		// me.activeImgId = 0;
		me.items = [];
		me.imgIdx = 0;
		// for(var i in imgs){
			// var imgBtn = {
				// imgId: i,
				// text: imgs[i].caption,
				// handler: function(btn,evt){
					// var imgSize = me.calcImageSize();
					// var imgId = 'filepage_img_' + me.cid;
					// var imgEl = document.getElementById(imgId);
					// imgEl.src = "";
					// imgEl.src = imgs[btn.imgId].filepath;
					// var imgViewer = Ext.getCmp('filepage_imgviewer_' + me.cid);
					// imgViewer.resetToOriginal();
					// var lastBtn = me.imgsBar.getItemByImgId(me.activeImgId);
					// lastBtn.removeCls('x-tab-active');
					// btn.addCls('x-tab-active');
					// me.activeImgId = btn.imgId;
				// }
			// };
			// imgBtns.push(imgBtn);
			// if(imgIdx === 0){
				var item = new Ext.ux.ImageViewer({
					cid     : me.cid,
				    // imageSrc: imgs[0].filepath,
					imageSrc: imgs[0].imgdata,
				    maxScale: 5
				});
				me.items.push(item);
			// }
			// imgIdx += 1;
		// }
		// var bar = me.imgsBar = new Ext.TabBar({
			// items: imgBtns,
			// dock : 'bottom',
			// ui   : 'dark',
			// scroll: 'horizontal',
			// layout: {
				// pack: 'center'
			// },
			// getItemByImgId: function(imgId){
				// var items = this.items.items;
				// if(items.length > 0){
					// for(var i in items){
						// if(items[i].imgId == imgId) return items[i];
					// }
				// } 
				// return false;
			// }
		// });
		// me.dockedItems = me.dockedItems || [];
		// me.dockedItems.push(bar);
		// me.imgsBar.items.items[0].addCls('x-tab-active');
		var bar = me.controlBar = new Ext.Toolbar({
			title: imgs[0].caption,
			dock: 'bottom',
			style: 'background: transparent;',
			items: [{
				iconCls: 'arrow_left',
				iconMask: true,
				hidden: true,
				handler: function(btn,e){
					var imgSize = me.calcImageSize();
					var imgId = 'filepage_img_' + me.cid;
					var imgEl = document.getElementById(imgId);
					imgEl.src = "";
					// imgEl.src = imgs[me.imgIdx - 1].filepath;
					imgEl.src = imgs[me.imgIdx - 1].imgdata;
					me.controlBar.setTitle(imgs[me.imgIdx - 1].caption);
					var imgViewer = Ext.getCmp('filepage_imgviewer_' + me.cid);
					imgViewer.resetToOriginal();
					me.imgIdx = me.imgIdx - 1;
					if(me.imgIdx != me.pagesimba.imgs.length -1){
						me.controlBar.items.items[2].show();
					}
					if(me.imgIdx == 0){
						btn.hide();
					}
				}
			},{
				xtype: 'spacer'
			},{
				iconCls: 'arrow_right',
				iconMask: true,
				hidden: (imgs.length >1) ? false : true,
				handler: function(btn,e){
					var imgSize = me.calcImageSize();
					var imgId = 'filepage_img_' + me.cid;
					var imgEl = document.getElementById(imgId);
					imgEl.src = "";
					// imgEl.src = imgs[me.imgIdx + 1].filepath;
					imgEl.src = imgs[me.imgIdx + 1].imgdata;
					me.controlBar.setTitle(imgs[me.imgIdx + 1].caption);
					var imgViewer = Ext.getCmp('filepage_imgviewer_' + me.cid);
					imgViewer.resetToOriginal();
					me.imgIdx = me.imgIdx + 1;
					// if(me.imgIdx != 0){
					me.controlBar.items.items[0].show();
					// }
					if(me.imgIdx == me.pagesimba.imgs.length -1){
						btn.hide();
					}
				}
			}]
		});
		me.dockedItems = me.dockedItems || [];
		me.dockedItems.push(bar);
	}
};
// SimbaApp.views.FilePage = (Ext.is.Blackberry) ? Ext.extend(Ext.List, SimbaFilePageBase) : Ext.extend(Ext.Panel, SimbaFilePageBase);
SimbaApp.views.FilePage = Ext.extend(Ext.Panel, SimbaFilePageBase);
// );
