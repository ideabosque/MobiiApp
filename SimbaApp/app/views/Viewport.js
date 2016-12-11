SimbaApp.views.Viewport = Ext.extend(Ext.Panel, {
    fullscreen: true,
    layout: 'card',
    items: [{
        cls: 'launchscreen',
        // html: '<div><p><strong>View your BI data in mobile or tablet.</strong></p></div>'
        html: '<div><p><strong>MobiiApp, the data in your hands.</strong></p></div>'
    }],
    initComponent: function() {
		var me = this;
        me.navigateButton = new Ext.Button({
            hidden: Ext.is.Phone,
			// hidden: Ext.is.Phone || Ext.Viewport.orientation == 'landscape',
            text: 'Navigation',
            handler: function(btn,e) {
                SimbaApp.views.Navigation.showBy(btn, 'fade');
            }
        });

        me.backButton = new Ext.Button({
            text: 'Back',
            ui: 'back',
            handler: function(){
                var navigation = SimbaApp.views.Navigation,
					
                    title;
                // console.log(navigation);                    
                if(me.getActiveItem() === navigation){
                    navigation.onBackTap();
                    
                    // we are in the root - no back button here
                    if(navigation.items.indexOf(navigation.getActiveItem()) <= 0){
                        me.toolBar.items.get(0).hide();
                        title = me.title || '';
                    }
				} else if(
							me.getActiveItem() === me.optionsPanel || 
							me.getActiveItem() === me.commentPanel || 
							(me.getActiveItem().simbatype && me.getActiveItem().simbatype == 'simbaprompt')
				){
					me.backToPage();
                } else {
					me.getActiveItem().destroy();
                    me.setActiveItem(navigation, {
                        type: 'slide',
                        reverse: true
                    });
					SimbaApp.views.viewport.optionsButton.hide();
					SimbaApp.views.viewport.commentButton.hide();
                }
                var recordNode = navigation.getActiveItem().recordNode;
                title = title || navigation.renderTitleText(recordNode);
               
                me.toolBar.setTitle(title);
            },
            hidden: true,
            scope: this,
			listeners: {
				show: function(btn){
					me.refreshButton.hide();
				},
				hide: function(btn){
					me.refreshButton.show();
				}
			}
        });
		
		me.refreshButton = new Ext.Button({
			iconCls: 'refresh',
			iconMask: true,
			style: {
				background: 'transparent'
			},
			handler: function(btn,e){
				var maskEl = Ext.getBody();
				var loadMask = new Ext.LoadMask(maskEl, {
					msg: 'Refreshing...'
				});
				loadMask.show();
				SimbaApp.views.Navigation.store.load();
				SimbaApp.views.Navigation.store.on('read',function(store,node,records,successful){
					loadMask.destroy();
					loadMask.disable();
				});
				for(var k in SimbaApp.views){
					if(Ext.isObject(SimbaApp.views[k])){
						if(SimbaApp.views[k].simbatype == 'simbapage' || SimbaApp.views[k].simbatype == 'simbaprompt'){
							if(!SimbaApp.views[k].isDestroyed) SimbaApp.views[k].destroy();
							delete SimbaApp.views[k];
						}
					}
				}
			}
		});
        
        var btns = [me.navigateButton];
        
        if(Ext.is.Phone){
            btns.unshift(me.backButton);
			btns.push(me.refreshButton);
        }
        
        me.settingButton = new Ext.Button({
            iconCls: 'settings',
            iconMask: true,
            handler: function(btn,e){
				if (SimbaApp.views.Settings){
					SimbaApp.views.Settings.setValues({
						offlinemode: 0
					});
				} else {
					SimbaApp.views.createSettingsForm();
				}
				me.setActiveItem(SimbaApp.views.Settings);
				me.doLayout();
				if(Ext.is.Phone){
					me.refreshButton.hide();
				}
            },
			// listeners: {
				// hide: function(){
					// if(!me.hidden){
						// me.optionsButton.show();
						// me.commentButton.show();
						// me.commentButton1.show();
						// me.commentButton2.show();
						// me.commentButton3.show();
						// me.commentButton4.show();
						
					// }
				// }
			// }
        });
		
		me.optionsButton = new Ext.Button({
			iconCls: 'more',
			// iconCls: 'info',
			iconMask: true,
			hidden: true,
			handler: function(btn,e){
				if(me.optionsPanel == undefined){
					me.createOptionsPanel();
				} 
				me.setActiveItem(me.optionsPanel);
				// btn.hide();
			}
		});
		
		me.commentButton = new Ext.Button({
			iconCls: 'comment',
			iconMask: true,
			hidden: true,
			handler: function(btn,e){
				if(me.commentPanel == undefined || me.commentPanel.isDestroyed){
					me.createCommentPanel();
				} 
				me.setActiveItem(me.commentPanel);
				// btn.hide();
			}
		});

        btns.push({xtype: 'spacer'});
        btns.push(me.settingButton);
		btns.push(me.optionsButton);
		btns.push(me.commentButton);
        
        me.toolBar = new Ext.Toolbar({
            id: 'simba-viewport-title-toolbar-id',
            ui: 'dark',
            dock: 'top',
            items: btns.concat(me.buttons || []),
            title: me.title
        });
        
        me.dockedItems = me.dockedItems || [];
        me.dockedItems.unshift(me.toolBar);

        if (!Ext.is.Phone) {
            SimbaApp.views.Navigation.setWidth(300);
        }

        if (!Ext.is.Phone && Ext.Viewport.orientation == 'landscape') {
            me.dockedItems.unshift(SimbaApp.views.Navigation);
        } else if (Ext.is.Phone) {
            me.items = this.items || [];
            me.items.unshift(SimbaApp.views.Navigation);
        }
		
		me.listeners = {
			scope: me,
			show: function(){
				me.layoutOrientation(Ext.getOrientation());
			},
			// el: {
				// scope: me,
				// taphold: me.onTapHold
			// }
		};

        SimbaApp.views.Viewport.superclass.initComponent.call(me, arguments);
    },
	
	onTapHold: function(e,item){
		console.log('Taphold');
		console.log('me',this);
		var me = this;
		var activeItem = me.getActiveItem();
		if(_mode == 'native' && window.plugins && window.plugins.screenshot && activeItem.simbatype && activeItem.simbatype == 'simbapage'){
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
								// 'margin'    : Ext.is.Phone ? '5%' : '2%'
								'margin-bottom' : '15px'
							},
							handler: function(btn,e){
								actionSheet.destroy();
								_capturedFile = {};
								_capturedFile.fullPath = result;
								_capturedFile.fileName = fileName;
								_capturedFile.simbapageid = activeItem.simbapageid;
								// console.log('FullPath: ' + _capturedFile.fullPath);
								// console.log('FullPath: ' + _capturedFile.fileName);
								if(me.commentPanel == undefined || me.commentPanel.isDestroyed){
									me.createCommentPanel();
								} 
								me.setActiveItem(me.commentPanel);
							}
						},{
							text: 'Cancel',
							ui  : 'decline',
							// style: {
								// 'margin'    : Ext.is.Phone ? '5%' : '2%'
							// },
							handler: function(btn,e){
								actionSheet.destroy();
								window.plugins.screenshot.deleteSavedScreenshotFile(fileName);
							}
						}]
					});
					actionSheet.show();
				},
				function(error){
					console.log('Fail','Failed to save screenshot' + error);
				}
			);
		}
	},
	
	openPrompts: function(btn,e){
		var viewport = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id');
			var simbaprompt = eval("SimbaApp.views.Prompts" + simbapageid);
			SimbaApp.views.viewport.setActiveItem(simbaprompt);
		} else {
			SimbaApp.views.viewport.setActiveItem(null);
		}
	},
	
	savePage: function(btn,e){
		var viewport = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id'),
				dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid);
				controller = dashboardPage.controller,
				control_id = dashboardPage.cid,
				pagesimba = dashboardPage.pagesimba,
				idx = SimbaApp.stores.OfflineNavigation.findExact('id',simbapageid),
				offlineRecordData = {};
			offlineRecordData['id'] = simbapageid;
			if(selectedRecords){
				offlineRecordData['label'] = selectedRecords[0].get('label');
				var paths = viewport.getNestedListHierachy(selectedRecords[0],[]);
				offlineRecordData['path'] = paths.join('->');
			} else {
				offlineRecordData['label'] = controller + '_' + control_id;
			}
			offlineRecordData['control_id'] = control_id;
			offlineRecordData['controller'] = controller;
			offlineRecordData['simba'] = Ext.encode(pagesimba);
			// console.log(offlineRecordData);
			SimbaApp.WebSQLDb.saveRecord(offlineRecordData);
		} 
	},
	
	getNestedListHierachy: function(record,paths){
		var me = this;
		if(record != undefined){
			var label = record.get('label'),
				recordNode = record.node,
				parentNode = recordNode ? recordNode.parentNode : null;
			paths.unshift(label);
			if (parentNode){
				record = parentNode.attributes.record;
				paths = me.getNestedListHierachy(record,paths);
			}
		}
		return paths;
	},
	
	backToPage: function(){
		var me = this,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id');
			var dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid);
			SimbaApp.views.viewport.setActiveItem(dashboardPage);
		} else {
			SimbaApp.views.viewport.setActiveItem(null);
		}
		if(Ext.is.Phone){
			SimbaApp.views.viewport.backButton.show();
		}
		SimbaApp.views.viewport.optionsButton.show();
		SimbaApp.views.viewport.commentButton.show();
		if(_commentInterval){
			window.clearInterval(_commentInterval);
		}
	},
	
	onSimbaReportListItemDisclosure: function(record,node,index,e){
		var me = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords(),
			newReportCid = record.get('reportCid');
			
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id'),
				controller = selectedRecords[0].get('controller'),
				editable = selectedRecords[0].get('editable'),
				dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid),
				oldReport = dashboardPage.getActiveItem(),
				newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
				newReportTitle = newReportSimba.caption;
			// if(controller == 'xdata'){
			// if(editable && !Ext.is.Phone){
			if(editable){
				var reportEditor = new SimbaApp.views.SimbaReportEditor({
					title: newReportTitle,
					pagecid: dashboardPage.cid, 
					simbapageid: dashboardPage.simbapageid,
					reportid: newReportCid, 
					simba: newReportSimba,
					fullscreen: true,
				});
				// me.setActiveItem(reportEditor);
				me.hide();
			}
		}
	},
	
	createCommentPanel: function(){
		var me = this;
		
		var tpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<tpl if="this.currentUser(name) == false">',
					'<div class="x-item-frame">',
						'<div>',
							'<span class="item-date" style="float: left">{name}</span>',
							'<span class="item-date" style="float: right">{format_time}</span>',
						'</div><br></br>' ,
						'<tpl if="this.hasImage(image) == false">',
							'<table width="100%"><tr>',
								'<td width="75%">{comment}</td><td width="25%"></td>',
							'</tr></table>',
						'</tpl>',
						'<tpl if="this.hasImage(image)">',
							'<table width="100%"><tr>',
								'<td width="75%">{comment}</td><td width="25%"><img style="float: right" width="50" height="50" src="'+_urlBase + '/sites/default/files/comment_images/{image}"></td>',
							'</tr></table>',
						'</tpl>',
					'</div>',
				'</tpl>',
				'<tpl if="this.currentUser(name)">',
					'<div class="x-item-frame-currentuser">',
						'<div>',
							'<span class="item-date" style="float: left">{name}</span>',
							'<span class="item-date" style="float: right">{format_time}</span>',
						'</div><br></br>' ,
						'<tpl if="this.hasImage(image) == false">',
							'<table width="100%"><tr>',
								'<td width="75%">{comment}</td><td width="25%"></td>',
							'</tr></table>',
						'</tpl>',
						'<tpl if="this.hasImage(image)">',
							'<table width="100%"><tr>',
								'<td width="75%">{comment}</td><td width="25%"><img style="float: right" width="50" height="50" src="'+_urlBase + '/sites/default/files/comment_images/{image}"></td>',
							'</tr></table>',
						'</tpl>',
					'</div>',
				'</tpl>',
			'</tpl>',
			{
				hasImage: function(image){
					return image != '';
				},
				currentUser: function(name){
					var username = window.localStorage.getItem('username') || 'demo';
					if(username.toLowerCase() == name.toLowerCase()){
						return true;
					}
					return false;
				}
			}
		);
			
		var commentList = new Ext.List({
			flex: 8,
			style: {
				width: '100%'
			},
			store: SimbaApp.stores.MobiiappComment,
			cls: 'x-comment-list',
			loadingText: false,
			itemTpl: tpl,
			listeners: {
				itemtap: function(list,index,item,e){
					var store = list.getStore(),
						record = store.getAt(index),
						image = record.get('image');
					// console.log('image',image);
					if(image){
						var imagePath = _urlBase + '/sites/default/files/comment_images/' + image;
						// var screenshot = new SimbaApp.views.ScreenshotViewer({
							// imagePath: imagePath,
							// editable : false
						// });
						var screenshot = new Ext.ux.ImageViewer({
							cid     : 999999,
							fullscreen: true,
							imageSrc: imagePath,
							maxScale: 5
						});
					}
					
				}
			}
		});
		
		me.commentPanel = new Ext.form.FormPanel({
			layout: {
				type:"vbox"
			},
			items: [commentList],
			cls: 'x-comment-panel',
			dockedItems: [{
				xtype: 'toolbar',
				style: {'width':'100%'},
				margin: '0 0 0 0',
				dock: 'bottom',
				layout: {
					type: 'hbox',
				},
				items:[{
					xtype: 'textareafield',
					name : 'new_comment',
					flex : 1,
					maxRows : 1,
					listeners: {
						keyup: function(commentField,e){
							var newValue = commentField.getValue(),
								oldValue = commentField.oldValue || '',
								newValueLines = newValue.split('\n').length,
								oldValueLines = oldValue.split('\n').length,
								el = commentField.getEl(),
								textareaEls = el.select('textarea.x-input-text'),
								ownerCt = commentField.ownerCt,
								keyCode = e.browserEvent.keyCode;
							if(textareaEls.elements.length >0) {
								var textareaEl = Ext.get(textareaEls.elements[0]);
							}
							if(newValueLines != oldValueLines && textareaEl && newValueLines < 5 ){
								ownerCt.setHeight(46 + 27 * (newValueLines -1));
								textareaEl.setHeight(27 * newValueLines);
								ownerCt.doLayout();
							}
							commentField.oldValue = newValue;
						}
					}
				},{
					xtype: 'button',
					height: 33,
					width : 90,
					text: 'Submit',
					handler: function(btn,e){
						var me = SimbaApp.views.viewport;
						var selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
						if(selectedRecords){
							var catalog_id = selectedRecords[0].get('id');
							var commentField = btn.previousSibling(),
								ownerCt = btn.ownerCt,
								comment = commentField.getValue(),
								el = commentField.getEl(),
								textareaEls = el.select('textarea.x-input-text');
							if(textareaEls.elements.length >0) {
								var textareaEl = Ext.get(textareaEls.elements[0]);
							}
							if(comment.replace(/(^\s*)|(\s*$)/g, "")){
								var maskEl = Ext.getBody();
								var loadMask = new Ext.LoadMask(maskEl, {
									msg: 'Submit...'
								});
								loadMask.show();
								if(_mode == 'native' && navigator.device && _capturedFile && window.plugins && window.plugins.screenshot){
									var options = new FileUploadOptions();
									options.fileKey="file";
									// options.fileName = new Date().getTime() + '';
									options.fileName = _capturedFile.fileName;
									options.mimeType="image/jpeg";
									options.params = {
										catalog_id: catalog_id, 
										comment : comment,
										image: options.fileName
									};
									options.chunkedMode = false;
									var ft = new FileTransfer();
									ft.upload(
										_capturedFile.fullPath, 
										_urlBase + _submitCommentURL, 
										function(response){
											var data = Ext.decode(response.response);
											if (data.errorMessage != null){
												Ext.Msg.alert('Error',data.errorMessage);
											} else {
												var comments = data.comments;
												SimbaApp.stores.MobiiappComment.loadData(comments);
											}
											window.plugins.screenshot.deleteSavedScreenshotFile(_capturedFile.fileName);
											commentField.reset();
											ownerCt.setHeight(46);
											textareaEl.setHeight(27);
											ownerCt.doLayout();
											var commentImagePanel = btn.ownerCt.ownerCt.dockedItems.items[1];
											commentImagePanel.getEl().setHTML('<div style="background:whiteSmoke;height:80px;"></div>');
											// commentImagePanel.update('');
											// commentImagePanel.hide();
											// commentImagePanel.ownerCt.doLayout();
											me.commentPanel.doLayout();
											SimbaApp.views.viewport.doLayout();
											_capturedFile = false;
											loadMask.destroy();
											loadMask.disable();
										}, 
										function(error){
											console.log('Error uploading file ' + path + ': ' + error.code);
										}, 
										options
									);
								} else {
									Ext.Ajax.request({
										url   : _urlBase + _submitCommentURL,
										method: 'post',
										params: {
											catalog_id: catalog_id, 
											comment : comment,
											username: window.localStorage.getItem("username") || 'demo',
											password: window.localStorage.getItem("password")
										},
										timeout: _defaultTimeout,
										success: function(response, opts) {
											data = Ext.decode(response.responseText,true);
											if (data.errorMessage != null){
												Ext.Msg.alert('Error',data.errorMessage);
											} else {
												var comments = data.comments;
												SimbaApp.stores.MobiiappComment.loadData(comments);
											}
											commentField.reset();
											ownerCt.setHeight(46);
											textareaEl.setHeight(27);
											ownerCt.doLayout();
											loadMask.destroy();
											loadMask.disable();
										}
									});
								}
								setTimeout(function(){
									if(! loadMask.isDisabled( )) {
										loadMask.destroy();
										loadMask.disable();
										Ext.Msg.alert('Timeout','Timeout while submitting comment.');
									}
								},_defaultTimeout);
							} else {
								Ext.Msg.alert('Warning','Can not leave empty comment.');
							}
						}
					}
				}]
			},{
				// xtype: 'toolbar',
				style: {'width':'100%','background':'black'},
				hidden: _capturedFile ? false : true,
				height: 80,
				margin: '0 0 0 0',
				padding: 0,
				dock: 'bottom',
				html: _capturedFile ? '<img width="50px" height="50px" src="'+_capturedFile.fullPath+'"></img>' : '',
				listeners: {
					el: {
						tap: function(event,item,e){
							// console.log('Tap image');
							// console.log('this',this);
							if(_capturedFile){
								var screenshot = new Ext.ux.ImageViewer({
									cid     : 999999,
									// zindex: 100,
									fullscreen: true,
									editable: true,
									imageSrc: _capturedFile.fullPath,
									maxScale: 5
								});
							}
						}
					}
				}
			}],
			listeners: {
				activate: me.onCommentPanelActivate,
				deactivate: function(commentPanel){
					console.log('Comment Panel Deactivate');
					if(_commentInterval){
						window.clearInterval(_commentInterval);
					}
					if(_capturedFile && window.plugins && window.plugins.screenshot){
						window.plugins.screenshot.deleteSavedScreenshotFile(_capturedFile.fileName);
					}
					_capturedFile = false;
					commentPanel.destroy();
					delete commentPanel;
					me.commentPanel = undefined;
				}
			}
		});
	
	},
	
	onCommentPanelActivate: function(commentPanel){
		var commentList = Ext.getCmp(commentPanel.items.items[0].id);
		commentList.scroller.updateBoundary();
		var me = SimbaApp.views.viewport;
		var selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			_catalogID = selectedRecords[0].get('id');
			var oldCatalogId = SimbaApp.stores.MobiiappComment.proxy.extraParams.catalog_id;
			SimbaApp.stores.MobiiappComment.proxy.extraParams.catalog_id = _catalogID;
			SimbaApp.stores.MobiiappComment.load();
			// _commentInterval = window.setInterval("SimbaApp.stores.MobiiappComment.load()",_defaultInterval);
			_commentInterval = window.setInterval(
				function(){
					SimbaApp.stores.MobiiappComment.load();
					var commentImagePanel = commentPanel.dockedItems.items[1];
					if(_capturedFile && commentImagePanel.hidden){
						commentImagePanel.show();
						commentImagePanel.update('<img width="50px" height="50px" src="'+_capturedFile.fullPath+'"></img>');
					}
				},
				_defaultInterval
			);
			SimbaApp.stores.MobiiappComment.on('datachanged',function(store){
					var commentList = Ext.getCmp(SimbaApp.views.viewport.commentPanel.items.items[0].id);
					var scroller = commentList.scroller;
					scroller.setOffset({x:0,y:0});
					var d = commentList.getEl().dom;
					d.scrollTop = d.scrollHeight - d.offsetHeight;
					commentList.scroller.updateBoundary();
			});
		}
	},
    
	createOptionsPanel: function(){
		var me = this;
		/*
		me.simbaReportsList = new Ext.List({
			allowDeselect: false,
			itemTpl: '{reportName}<div style="float: right;" id="simbareport-edit-{reportCid}"></div>',
			cls: 'x-simbareports-list',
			itemCls: 'carrow',
			// onItemDisclosure: Ext.is.Android ? false : me.onSimbaReportListItemDisclosure,
			onItemDisclosure: Ext.is.Android ? false : true,
			store: null,
			scroll: false,
			listeners: {
				itemtap: me.onReportItemTap,
				afterrender: function(list){
					this.isAfterrendered = true;
				},
				update: function(list){
					var store = this.getStore();
					var selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords(),
						editable = false,
						controller = '';
					if(selectedRecords){
						controller = selectedRecords[0].get('controller');
						editable = selectedRecords[0].get('editable');
					}
					var el = list.getEl();
					var compositeElement = el.select('div.x-list-item');
					// if(this.isAfterrendered && store && store.getCount() > 0 && editable && ! Ext.is.Phone){
					if(this.isAfterrendered && store && store.getCount() > 0 && editable){
						compositeElement.each(function(el,c,idx){
							el.removeCls('carrow');
							el.addCls('compose');
						});
					} else {
						compositeElement.each(function(el,c,idx){
							el.addCls('carrow');
							el.removeCls('compose');
						});
					}
				}
			}
		});
		*/
		me.optionsPanel =  new Ext.form.FormPanel({
			layout: {
				type:"vbox"
			},
			// scroll: 'vertical',
			scroll: false,
			items: [{
				// xtype: 'fieldset',
				// style:{width:'100%'},
				// items: [{
					// xtype:"button",
					// text:"Prompts",   
					// style: 'margin:2%;',
					// handler: me.openPrompts
				// }]
				xtype: 'button',
				text:"Prompts",   
				style:{width:'100%'},
				handler: me.openPrompts
			},{
				xtype:"button",
				text:"Offline Cache",
				style: {
					'width':'100%',
					'margin-top': '15px'
				},
				handler:me.savePage
			},{
				xtype: 'fieldset',
				style:{
					width:'100%',
					'margin-top': '5px'
				},
				items: [{
					// xtype:"button",
					// text:"Offline Cache",
					// style: 'margin:2%;',
					// handler:me.savePage
				// }, {
					xtype: 'fieldset',
					style:{width:'100%'},
					title: 'Last Cached',
					items: [{
						xtype:'textfield',
						name: 'cachedtime',
						label: '',
						value:'Not cached.',
						disabled: true
					}]
				}]
			// },{
				// xtype: 'fieldset',
				// id   : 'options-form-reports-list-fieldset',
				// title: 'Reports',
				// style: {width:'100%'},
				// items: [me.simbaReportsList]
			},{
				xtype: 'button',
				text : 'Edit Reports',
				// hidden: (me.isPageEditable() === true) ? false : true,
				style: {
					width:'100%',
					height: '33px'
					// margin: '2%'
				},
				handler: me.onEditReportButtonTap
			}],
			listeners:{
				activate: me.onOptionsFormActivate,
			}
		});
	},
	
	isPageEditable: function(){
		var editable = false;
		var me = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			editable = selectedRecords[0].get('editable');
			// console.log('Editable',editable);
		}
		// console.log('editable',editable);
		return editable;
	},
	
	onEditReportButtonTap: function(btn,e){
		var me = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords(),
			store = me.buildReportsListStore();
		if(selectedRecords){
			var sheet = new Ext.Sheet({
				height  : 200,
				stretchX: true,
				stretchY: true,
				cls: 'x-reportlists-sheet',
				scroll: 'vertical',
				items: [{
					xtype: 'list',
					allowDeselect: false,
					scroll: false,
					itemTpl: '{reportName}',
					cls: 'x-simbareports-list',
					itemCls: 'carrow',
					store :store,
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
						text : 'Edit',
						handler: function(btn,e){
							var list = sheet.items.items[0];
							var selectedReports = list.getSelectedRecords();
							var newReportRecord = selectedReports[0];
							var newReportCid = newReportRecord.get('reportCid');
							sheet.destroy();
							var simbapageid = selectedRecords[0].get('id'),
								controller = selectedRecords[0].get('controller'),
								editable = selectedRecords[0].get('editable'),
								dashboardPage = SimbaApp.views["DashboardPage" + simbapageid],
								newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
								newReportTitle = newReportSimba.caption;
							var reportEditor = new SimbaApp.views.SimbaReportEditor({
								title: newReportTitle,
								pagecid: dashboardPage.cid, 
								simbapageid: dashboardPage.simbapageid,
								reportid: newReportCid, 
								simba: newReportSimba,
								fullscreen: true,
							});
							me.hide();
						}
					}]
				}]
			});
			sheet.show();
			/*var picker = new Ext.Picker({
				slots: [
					{
						name : 'reports_editor',
						title: 'Reports',
						data : store.getRange(),
						displayField: 'reportName',
						valueField: 'reportCid',
					}
				],
				doneButton: new Ext.Button({
					text: 'Edit',
					handler: function(btn,e){
						var newReportCid = picker.getValue().reports_editor;
						picker.destroy();
						var simbapageid = selectedRecords[0].get('id'),
							controller = selectedRecords[0].get('controller'),
							editable = selectedRecords[0].get('editable'),
							dashboardPage = SimbaApp.views["DashboardPage" + simbapageid],
							newReportSimba = dashboardPage.pagesimba.pageReports[newReportCid],
							newReportTitle = newReportSimba.caption;
						var reportEditor = new SimbaApp.views.SimbaReportEditor({
							title: newReportTitle,
							pagecid: dashboardPage.cid, 
							simbapageid: dashboardPage.simbapageid,
							reportid: newReportCid, 
							simba: newReportSimba,
							fullscreen: true,
						});
						me.hide();
					}
				})
			});
			picker.show();*/
		}
	},
	
	onOptionsFormActivate: function(optionForm){
		var me = SimbaApp.views.viewport;
		var selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id');
			var dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid);
			if(dashboardPage.simbatype === 'filepage'){
				// me.optionsPanel.items.items[0].items.items[0].disable();
				me.optionsPanel.items.items[0].hide();
				// me.optionsPanel.items.items[2].hide();
			} else {
				// me.optionsPanel.items.items[0].items.items[0].enable();
				me.optionsPanel.items.items[0].show();
				// me.optionsPanel.items.items[2].show();
				// if(dashboardPage){
					// me.buildReportsList(dashboardPage);
				// }
			}
			if((me.isPageEditable() === true)){
				me.optionsPanel.items.items[3].show();
			} else {
				me.optionsPanel.items.items[3].hide();
			}
			_mobiiappdb.transaction(function (tx) {
				tx.executeSql('SELECT cachedtime FROM mobiiappdb WHERE id = ?', [simbapageid], function (tx, results){
					if(results.rows && results.rows.length > 0){
						var cachedtime = results.rows.item(0).cachedtime;
						optionForm.setValues({
							cachedtime: cachedtime
						});
					} else {
						optionForm.setValues({
							cachedtime: 'Not cached.'
						});
					}
				});
			});
				
			// }
		}
		optionForm.doLayout();
		// if(Ext.is.Phone){
			// SimbaApp.views.viewport.backButton.hide();
		// }
	},
	
	buildReportsListStore: function(){
		var me = SimbaApp.views.viewport;
		var selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords();
		var store = null;
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id');
			var dashboardPage = SimbaApp.views["DashboardPage" + simbapageid];
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
		}
		return store;
	},
	
	buildReportsList: function(dashboardPage,select){
		var me = this,
			pageReports = dashboardPage.pagesimba.pageReports,
			activeReport = dashboardPage.getActiveItem(),
			i=0,
			checkedIdx = 0,
			data = [],
			select = (select == undefined) ? true : select;
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
		// console.log('select',select);
		if(select) me.simbaReportsList.getSelectionModel().select(checkedIdx);
		return checkedIdx;
	},
	
	onReportItemTap: function(list,index,item,e){
		var me = SimbaApp.views.viewport,
			selectedRecords = SimbaApp.views.Navigation.getActiveItem().getSelectedRecords(),
			store = list.getStore(),
			totalReports = store.getCount(),
			newReportCid = store.getAt(index).get('reportCid');
		if(selectedRecords){
			var simbapageid = selectedRecords[0].get('id'),
				dashboardPage = eval("SimbaApp.views.DashboardPage" + simbapageid),
				oldReport = dashboardPage.getActiveItem(),
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
				me.setActiveItem(dashboardPage);
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
			if(Ext.is.Phone){
				SimbaApp.views.viewport.backButton.show();
			}
			SimbaApp.views.viewport.optionsButton.show();
			SimbaApp.views.viewport.commentButton.show();
		}
	},

    setTitle: function(title){
    	var me = this;
    	me.toolBar.setTitle(title);
    },
    
    layoutOrientation: function(orientation, w, h) {
		// console.log('orientation',orientation);
    	var me = this;
		var win = window,
			d = document,
			e = d.documentElement,
			g = d.getElementsByTagName('body')[0],
			x = win.innerWidth||e.clientWidth||g.clientWidth,
			y = win.innerHeight||e.clientHeight||g.clientHeight;
        if (!me.hidden){
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
					SimbaApp.views.Navigation.hide(false);
					me.removeDocked(SimbaApp.views.Navigation, false);
					if (SimbaApp.views.Navigation.rendered) {
						SimbaApp.views.Navigation.el.appendTo(document.body);
					}
					SimbaApp.views.Navigation.setFloating(true);
					SimbaApp.views.Navigation.setHeight(400);
					// hide the navigation button
					me.toolBar.items.get(0).show(false);
				} else {
					SimbaApp.views.Navigation.setFloating(false);
					SimbaApp.views.Navigation.show(false);
					// show the navigation button
					me.toolBar.items.get(0).hide(false);
					me.insertDocked(0, SimbaApp.views.Navigation);
				}
				me.toolBar.doComponentLayout();
				if(newReport != undefined) activeItem.setActiveItem(newReport);
			} else {
				SimbaApp.views.Navigation.setWidth(x);
			}
		}
        SimbaApp.views.Viewport.superclass.layoutOrientation.call(me, orientation, w, h);
    }
});
