SimbaApp.views.Support = Ext.extend(Ext.Panel, {
    layout: 'card',
	scroll: false,
	
	initComponent: function() {
		var me = this;
		me.buildFrontPanel();
		me.items = [me.frontPanel];
		me.listeners = {
			deactivate: function(){
				if(me.refreshInterval){
					window.clearInterval(me.refreshInterval);
				}
				me.destroy();
			},
			activate: function(){
				me.refreshInterval = window.setInterval("SimbaApp.stores.MobiiappSupport.load()",_defaultInterval);
				SimbaApp.stores.MobiiappSupport.on(
					'load',
					function(store,records,successful){
						if(me.ticketDetailForm && me.getActiveItem() == me.ticketDetailForm){
							var id = parseInt(me.ticketDetailForm.getValues().id);
							var idx = store.findExact('id',id);
							if(idx != -1){
								var rec = store.getAt(idx);
								me.ticketDetailForm.load(rec);
							} else {
								me.ticketDetailForm.destroy();
								me.setActiveItem(me.frontPanel);
							}
						}
					},
					me
				);
			}
		};
        SimbaApp.views.Support.superclass.initComponent.call(me, arguments);
    },
	
	buildFrontPanel: function(){
		var me = this;
		
		var titleToolbar = new Ext.Toolbar({
			title: 'My Tickets',
			dock: 'top',
			items: [{
				text: 'Back',
				ui: 'back',
				handler: function(btn,e){
					var viewport = SimbaApp.views.viewport;
					viewport.setActiveItem(SimbaApp.views.Settings);
					me.destroy();
				}
			},{
				xtype: 'spacer'
			},{
				iconCls: 'add',
				iconMask: true,
				handler: function(btn,e){
					me.buildNewTicketForm();
				}
			}]
		});
		
		var ticketsList = me.buildTicketsList();
		
		me.frontPanel = new Ext.form.FormPanel({
			layout: 'vbox',
			scroll: 'vertical',
			dockedItems: [titleToolbar],
			items: [ticketsList]
		});
	},
	
	buildNewTicketForm: function(){
		var me = this;
		var titleToolbar = {
			xtype: 'toolbar',
			title: 'New Ticket',
			dock: 'top',
			items: [{
				text: 'Cancel',
				ui: 'back',
				handler: function(btn,e){
					me.getActiveItem().destroy();
					me.setActiveItem(me.frontPanel);
				}
			},{
				xtype: 'spacer'
			},{
				text: 'Submit',
				ui: 'action',
				handler:function(btn,e){
					var newTicketForm = me.getActiveItem();
					var ticketValues = newTicketForm.getValues();
					console.log('ticketValues',ticketValues);
					var subject = ticketValues.subject.replace(/(^\s*)|(\s*$)/g, "");
					var detail = ticketValues.detail.replace(/(^\s*)|(\s*$)/g, "");
					if(subject == '' || detail == ''){
						Ext.Msg.alert('Warning', 'Subject and Detail are required!');
					} else {
						var maskEl = Ext.getBody();
						var loadMask = new Ext.LoadMask(maskEl, {
							msg: 'Submit...'
						});
						loadMask.show();
						Ext.Ajax.request({
							url   : _urlBase + _submitTicketURL,
							method: 'post',
							params: {
								subject: subject, 
								detail : detail,
								username: window.localStorage.getItem("username") || 'demo',
								password: window.localStorage.getItem("password")
							},
							timeout: _defaultTimeout,
							success: function(response, opts) {
								data = Ext.decode(response.responseText,true);
								if (data.errorMessage != null){
									Ext.Msg.alert('Error',data.errorMessage);
								} else {
									newTicketForm.reset();
									var tickets = data.tickets;
									SimbaApp.stores.MobiiappSupport.loadData(tickets);
									me.setActiveItem(me.frontPanel);
								}
								loadMask.destroy();
								loadMask.disable();
							}
						});
						setTimeout(function(){
							if(! loadMask.isDisabled( )) {
								loadMask.destroy();
								loadMask.disable();
								Ext.Msg.alert('Timeout','Timeout while submitting comment.');
							}
						},_defaultTimeout);
					}
				
				}
			}]
		};
		var newTicketForm = new Ext.form.FormPanel({
			layout: 'vbox',
			scroll: 'vertical',
			dockedItems: [titleToolbar],
			defaults: {
				style: 'width: 100%;',
			},
			items: [{
				xtype: 'fieldset',
				title: 'Subject',
				items: [{
					xtype : 'textfield',
					name  : 'subject'
				}]
			},{
				xtype: 'fieldset',
				title: 'Detail',
				items: [{
					xtype : 'textareafield',
					name  : 'detail',
				}]
			}]
		});
		me.setActiveItem(newTicketForm);
	},
	
	buildTicketsList: function(){
		var me = this;
		SimbaApp.stores.MobiiappSupport.load();
		var ticketsList = new Ext.List({
			style: {
				width: '100%'
			},
			itemCls: 'carrow',
			store: SimbaApp.stores.MobiiappSupport,
			cls: 'x-simbareports-list',
			itemTpl: "{subject}",
			onItemDisclosure: true,
			listeners: {
				scope: me,
				itemtap: me.onTicketItemTap,
			}
		});
		return ticketsList;
	},
	
	onTicketItemTap: function(list,index,item,e){
		var me = this;
		var record = list.getStore().getAt(index);
		var detail = record.get('detail');
		var comments = record.get('comments');
		var solution = record.get('solution');
		var history = record.get('history');
		var detailLines = detail.match(/^.*([\n\r]+|$)/gm);
		var commentsLines = comments.match(/^.*([\n\r]+|$)/gm);
		var solutionLines = solution.match(/^.*([\n\r]+|$)/gm);
		var historyLines = history.match(/^.*([\n\r]+|$)/gm);
		var titleToolbar = {
			xtype: 'toolbar',
			title: 'Ticket Detail',
			dock: 'top',
			items: [{
				text: 'Back',
				ui: 'back',
				handler: function(btn,e){
					me.getActiveItem().destroy();
					me.setActiveItem(me.frontPanel);
					delete me.ticketDetailForm;
				}
			}]
		};
		var commentToolbar = {
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
							me.doLayout();
						}
						commentField.oldValue = newValue;
					}
				}
			},{
				xtype: 'button',
				height: 33,
				width : 90,
				text: 'Comment',
				disabled: (record.get('status') == 'Resolved') ? true : false,
				handler: function(btn,e){
					var ticketDetailForm = me.getActiveItem();
					var id = ticketDetailForm.getValues().id;
					var commentField = btn.previousSibling(),
						ownerCt = btn.ownerCt,
						comment = commentField.getValue(),
						el = commentField.getEl(),
						textareaEls = el.select('textarea.x-input-text');
					if(textareaEls.elements.length >0) {
						var textareaEl = Ext.get(textareaEls.elements[0]);
					}
					var newComment = commentField.getValue().replace(/(^\s*)|(\s*$)/g, "");
					if(newComment == ''){
						Ext.Msg.alert('Warning','Can not leave empty comment.');
					} else {
						var maskEl = Ext.getBody();
						var loadMask = new Ext.LoadMask(maskEl, {
							msg: 'Submit...'
						});
						loadMask.show();
						// console.log('id',id);
						// console.log('newComment',newComment);
						Ext.Ajax.request({
							url   : _urlBase + _submitTicketComentURL,
							method: 'post',
							params: {
								id: id, 
								comment : newComment,
								username: window.localStorage.getItem("username") || 'demo',
								password: window.localStorage.getItem("password")
							},
							timeout: _defaultTimeout,
							success: function(response, opts) {
								data = Ext.decode(response.responseText,true);
								if (data.errorMessage != null){
									Ext.Msg.alert('Error',data.errorMessage);
								} else {
									var ticket = data.ticket;
									var ticketRecord = Ext.ModelMgr.create(ticket,'MobiiappSupport');
									ticketDetailForm.load(ticketRecord);
								}
								commentField.reset();
								ownerCt.setHeight(46);
								textareaEl.setHeight(27);
								ownerCt.doLayout();
								loadMask.destroy();
								loadMask.disable();
							}
						});
						setTimeout(function(){
							if(! loadMask.isDisabled( )) {
								loadMask.destroy();
								loadMask.disable();
								Ext.Msg.alert('Timeout','Timeout while submitting comment.');
							}
						},_defaultTimeout);
					}
				
				}
			}]
		}
		var ticketDetailForm = me.ticketDetailForm = new Ext.form.FormPanel({
			layout: 'vbox',
			scroll: 'vertical',
			cls : 'x-login-screen',
			dockedItems: [titleToolbar,commentToolbar],
			defaults: {
				style: 'width: 100%;',
			},
			items: [{
				xtype : 'textfield',
				name  : 'id',
				label : 'Ticket ID:',
				hidden: true
			},{
				xtype : 'textareafield',
				name  : 'subject',
				label : 'Subject:',
				disabled: true
			},{
				xtype : 'textfield',
				name  : 'status',
				label : 'Status:',
				disabled: true
			},{
				xtype : 'textfield',
				name  : 'assign_to',
				label : 'Assigned To:',
				height: 46,
				disabled: true
			},{
				xtype : 'textfield',
				name  : 'created_date',
				label : 'Created Date:',
				disabled: true
			},{
				xtype : 'textfield',
				name  : 'updated_date',
				label : 'Updated Date:',
				disabled: true
			},{
				xtype: 'fieldset',
				title: 'Detail:',
				items: [{
					xtype : 'textareafield',
					name  : 'detail',
					disabled: true,
					maxRows: Ext.is.Phone ? detailLines.length + 5 : detailLines.length + 2
				}]
			},{
				xtype: 'fieldset',
				title: 'Comments:',
				items: [{
					xtype : 'textareafield',
					name  : 'comments',
					disabled: true,
					maxRows: Ext.is.Phone ? commentsLines.length * 2 : commentsLines.length + 2 
				}]
			},{
				xtype: 'fieldset',
				title: 'Solution:',
				items: [{
					xtype : 'textareafield',
					name  : 'solution',
					disabled: true,
					maxRows: Ext.is.Phone ? solutionLines.length * 3 : solutionLines.length + 2 
				}]
			},{
				xtype: 'fieldset',
				title: 'History:',
				items: [{
					xtype : 'textareafield',
					name  : 'history',
					disabled: true,
					maxRows: Ext.is.Phone ? historyLines.length * 3 : historyLines.length + 4 
				}]
			}]
		});
		me.setActiveItem(ticketDetailForm);
		ticketDetailForm.load(record);
	}
	
});