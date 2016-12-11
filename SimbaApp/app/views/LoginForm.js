SimbaApp.onOnlineLoginSuccess = function (response, opts){
	data = Ext.decode(response.responseText);
	if (data.errorMessage != null){
		if(data.errorCode && data.errorCode == 'NoGroup'){
			SimbaApp.views.LoginForm.hide();
			SimbaApp.views.createJoinGroupForm();
			// Ext.Msg.show({
				// cls: 'x-group-msgbox',
				// msg: data.errorMessage,
				// buttons: [
					// {text: 'Cancel', itemId: 'cancel', ui: 'action'},
                    // {text: 'Create/Join a Group', itemId: 'group', ui: 'action'},
                // ],
                // fn: function(button){
					// console.log('button',button);
					// if(button == 'group'){
						// SimbaApp.views.LoginForm.hide();
						// SimbaApp.views.createJoinGroupForm();
					// }
				// },
			// });
		} else {
			Ext.Msg.alert('Login Error', data.errorMessage, Ext.emptyFn);
		}
	} else {
		_userPerm = data.userperm;
		SimbaApp.stores.OnlineNavigation.proxy.url = _urlBase + _menuURL;
		SimbaApp.stores.MobiiappComment.proxy.url = _urlBase + _commentURL;
		SimbaApp.stores.MobiiappUnits.proxy.url = _urlBase + _unitsURL;
		SimbaApp.stores.MobiiappSupport.proxy.url = _urlBase + _ticketsURL;
		if(_userPerm == 'super admin mobiiapp'){
			SimbaApp.stores.OnlineNavigation.proxy.extraParams.unit_id = 1;
			SimbaApp.stores.MobiiappUnits.load();
		}
		window.localStorage.setItem("urlBase",_urlBase);
		if(SimbaApp.views.LoginForm.getValues().Username != 'demo'){
			window.localStorage.setItem("username",SimbaApp.views.LoginForm.getValues().Username);
			window.localStorage.setItem("password",data.ptoken);
		}
		// } else {
			// window.localStorage.removeItem("username");
			// window.localStorage.removeItem("password");
		// }
		SimbaApp.views.LoginForm.submittedValues = SimbaApp.views.LoginForm.getValues();
		SimbaApp.createNavigation();
		if(SimbaApp.views.viewport){
			if(SimbaApp.views.viewport.hidden) SimbaApp.views.viewport.show();
			if(SimbaApp.views.viewport.toolBar.hidden) SimbaApp.views.viewport.toolBar.show();
			if(Ext.is.Phone){
				SimbaApp.views.viewport.refreshButton.show();
			}
			SimbaApp.views.viewport.doLayout();
			var simbaitems = [];
			for(var i in SimbaApp.views.viewport.items.items){
				var item = SimbaApp.views.viewport.items.items[i];
				if(item.simbatype === 'simbapage' || item.simbatype === 'simbaprompt') simbaitems.push(item);//SimbaApp.views.viewport.remove(item,true);
			}
			if(simbaitems.length > 0){
				Ext.each(simbaitems,function(simbaitem,index,simbaitems){
					simbaitem.destroy();
				});
			}
			SimbaApp.views.viewport.setActiveItem(null);
		} else {
			SimbaApp.views.viewport = new SimbaApp.views.Viewport({title: 'MobiiApp'});
		}
		SimbaApp.views.LoginForm.op = 'login';
		SimbaApp.views.LoginForm.hide();
		_offline = false;
	}
}

SimbaApp.doOnlineLoginOK = function(){
	_urlBase = SimbaApp.views.LoginForm.getValues().urlbase1;
	// Ext.Msg.alert('Server',_urlBase);
	SimbaApp.views.LoginForm.setValues({
		urlbase2 : _urlBase
	});
	Ext.Ajax.request({
		url   : _urlBase + _loginURL,
		method: 'post',
		params: {
			username: SimbaApp.views.LoginForm.getValues().Username, 
			password : SimbaApp.views.LoginForm.getValues().Password
		},
		timeout: 10000,
		failure : function(response){
			console.log('Failure',response);
			if(response.status === 404){
				Ext.Ajax.request({
					url   : _urlBase + _loginURL,
					method: 'post',
					params: {
						username: SimbaApp.views.LoginForm.getValues().Username, 
						password : SimbaApp.views.LoginForm.getValues().Password
					},
					timeout: 10000,
					failure : function(response){
						Ext.Msg.alert('Connection Error','The server is not reachable. Please check your network or contact the server admin.');
					},
					success: SimbaApp.onOnlineLoginSuccess 
				});
			} else {
				Ext.Msg.alert('Connection Error','The server is not reachable. Please check your network or contact the server admin.');
			}
		},
		success: SimbaApp.onOnlineLoginSuccess
	});
}

SimbaApp.doSignUp = function(){
	var username = SimbaApp.views.LoginForm.getValues().signup_username,
		email = SimbaApp.views.LoginForm.getValues().signup_email,
		emailpatrn = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	if(username == '' || email == ''){
		Ext.Msg.alert('Error','User Name and Email Address are required!');
	} else if (!emailpatrn.exec(email)) {
		Ext.Msg.alert('Error','Wrong email format!');
	} else {
		_urlBase = SimbaApp.views.LoginForm.getValues().urlbase2;
		SimbaApp.views.LoginForm.setValues({
			urlbase1 : _urlBase
		});
		Ext.Ajax.request({
			url   : _urlBase + _signupURL,
			method: 'post',
			params: {
				username: username, 
				email   : email
			},
			timeout: 10000,
			failure : function(response){
				console.log('Failure',response);
			},
			success: function(response, opts){
				console.log('Success',response);
				var data = Ext.decode(response.responseText);
				if (data.errorMessage != null){
					Ext.Msg.alert('Error', data.errorMessage, Ext.emptyFn);
				} else {
					window.localStorage.setItem("urlBase",_urlBase);
					var loginForm = SimbaApp.views.LoginForm,
						loginFieldset = loginForm.items.items[0],
						signupFieldset = loginForm.items.items[1],
						signupSuccessHtml = loginForm.items.items[2],
						loginBtn = loginForm.items.items[3],
						signupBtn = loginForm.items.items[4];
					signupSuccessHtml.update(data.msg);
					signupSuccessHtml.show();
					signupFieldset.hide();
					signupBtn.hide();
					loginForm.reset();
				}
			}
		});
	}
}


var LoginFormBase = {
	op   : 'login',
	// scroll: 'vertical',
	fullscreen: true,
	cls  : 'x-login-screen',
	scroll: false,
    items: [{
        xtype: 'fieldset',
        items: [{
                xtype: 'textfield',
                label: 'Name',
				labelWidth: '40%',
                name: 'Username',
				value: window.localStorage.getItem("username")
            }, {
                xtype: 'passwordfield',
                label: 'Password',
				labelWidth: '40%',
                name: 'Password'
			},{
				xtype: 'togglefield',
				style: {width: '100%'},
				label: 'Offline Mode',
				labelWidth: '40%',
				name: 'gooffline',
				value: _offline ? 1 : 0,
				required: false,
				listeners: {
					change: function(slider,thumb,newValue,oldValue){
						if(oldValue == 0 && newValue==1){
							SimbaApp.offlineLaunch();
						}
					},
					afterrender: function(offlineField){
						offlineField.ownerCt.ownerCt.offlineField = offlineField;
					}
				}
			},{
				xtype: 'textfield',
                label: 'Server',
				labelWidth: '40%',
                name: 'urlbase1',
				hidden: (_mode == 'web') ? true : false,
				value: _urlBase
			}
        ]
	}, {
		xtype: 'fieldset',
		hidden: true,
        items: [{
                xtype: 'textfield',
                label: 'Name',
                name: 'signup_username'
            }, {
                xtype: 'emailfield',
                label: 'Email',
                name: 'signup_email'
			},{
				xtype: 'textfield',
                label: 'Server',
                name: 'urlbase2',
				hidden: (_mode == 'web') ? true : false,
				value: _urlBase
			}]
	}, {
		html: '',
		hidden: true
	}, {
		style: {
			width: '100%'
		},
		xtype: 'button',
		text: 'Log In',
		handler: SimbaApp.doOnlineLoginOK
	}, {
		style: {
			width: '100%'
		},
		xtype: 'button',
		hidden: true,
		text: 'Sign Up',
		handler: SimbaApp.doSignUp
	}, {
		layout: {
			type: 'hbox'
		},
		style: {
			width: '100%',
			'margin-top': '20px',
			'padding': '0px'
		},
		defaults: {
			xtype: 'button',
			ui   : 'plain'
		},
		items: [{
			text: 'Sign Up',
			cls : 'x-login-signup-button',
			style: {
				width: '50%'
			},
			handler: function(btn,e){
				var loginForm = SimbaApp.views.LoginForm,
					loginFieldset = loginForm.items.items[0],
					signupFieldset = loginForm.items.items[1],
					signupSuccessHtml = loginForm.items.items[2],
					loginBtn = loginForm.items.items[3],
					signupBtn = loginForm.items.items[4];
				signupSuccessHtml.hide();
				if(btn.getText() == 'Sign Up'){
					btn.setText('Log in');
					loginFieldset.hide();
					loginBtn.hide();
					signupFieldset.show();
					signupBtn.show();
				} else {
					btn.setText('Sign Up');
					loginFieldset.show();
					loginBtn.show();
					signupFieldset.hide();
					signupBtn.hide();
				}
			}
		},{
			text: 'Login With Demo',
			cls : 'x-login-with-demo-button',
			style: {
				width: Ext.is.Phone ? '160px' : '50%'
			},
			handler: function(btn,e){
				SimbaApp.views.LoginForm.setValues({
					Username: 'demo',
					Password: 'demo'
				});
				SimbaApp.doOnlineLoginOK();
				SimbaApp.views.LoginForm.setValues({
					Username: '',
					Password: ''
				});
			}
		}]
	}, {
		html: '<div style="text-align: center"><span style="color: blue; font-size: 18px;">Build: ' + _build + '</span></div>'
		// handler: SimbaApp.doOnlineLoginOK
	// },{
		// height: 40,
		// html: '<div style="color: blue; font-size: 18px; float: left;"><a target="_blank" style="color: blue;" href="'+_urlBase+'user/register/">Create new account</a></div>'
	// },{
		// height: 40,
		// html: '<div style="color: blue; font-size: 18px; float: left;"><a target="_blank" style="color: blue;" href="'+_urlBase+'tutorial/">Tutorial</a></div>'
	// },{
		// height: 40,
		// html: '<div style="color: blue; font-size: 18px; float: left;"><a target="_blank" style="color: blue;" href="'+_urlBase+'">MobiiApp Admin Web Console</a></div>'
	// }, {
		// style: {
			// width: '100%',
			// "margin-top" : '15px'
		// },
		// xtype: 'button',
		// text: 'Sign In With Demo Account',
		// handler: function(btn,e){
			// SimbaApp.views.LoginForm.setValues({
				// Username: 'demo',
				// Password: 'demo'
			// });
			// SimbaApp.doOnlineLoginOK();
			// SimbaApp.views.LoginForm.setValues({
				// Username: '',
				// Password: ''
			// });
		// }
	}],
	dockedItems:[{
        xtype: 'toolbar',
        title: 'MobiiApp',
        ui: 'light',
        dock: 'top'
	}],
	listeners: {
		show: function(loginForm){
			loginForm.offlineField.setValue(0);
		}
	}
};

var PasswordResetFormBase = {
	scroll : 'vertical',
	cls  : 'x-login-screen',
    dockedItems: [{xtype: 'toolbar',title: 'Change Password',ui: 'light',dock: 'top'}],
    items: [{
        xtype: 'fieldset',
        defaults: {
            required: true,
            labelAlign: 'left',
            labelWidth: '40%'
        },
        items: [
            {
                xtype: 'textfield',
                placeHolder: 'Mobile BI Server',
                label: 'Server',
                name: 'Server',
				hidden: true
            }, {
                xtype: 'textfield',
                placeHolder: 'User Name',
                label: 'User Name',
                name: 'Username',
				value: window.localStorage.getItem("username")
            }, {
                xtype: 'passwordfield',
                label: 'Current Password',
                placeHolder: 'Current Password',
                name: 'OldPassword'
            }, {
                xtype: 'passwordfield',
                label: 'New Password',
                placeHolder: 'New Password',
                name: 'NewPassword'
            },{
                xtype: 'passwordfield',
                label: 'Confirm',
                placeHolder: 'Confirm',
                name: 'ConfirmedPassword'
            },{
				layout: 'hbox',
				defaults: {
					flex: 1
				},
				items: [{
					xtype: 'button',
					text: 'Apply',
					style: 'margin:2%;',
					handler: function(btn,evt) {
						var username = SimbaApp.views.PasswordResetForm.getValues().Username,
							oldpassword = SimbaApp.views.PasswordResetForm.getValues().OldPassword,
							newpassword = SimbaApp.views.PasswordResetForm.getValues().NewPassword,
							confirmedpassword = SimbaApp.views.PasswordResetForm.getValues().ConfirmedPassword;
						
						if(username === '' || oldpassword === '' || newpassword === '' || confirmedpassword === ''){
							Ext.Msg.alert('Error', 'User Name, Current Password, New Password and Confirm Password are required', Ext.emptyFn);
						} else if(oldpassword === newpassword){
							Ext.Msg.alert('Error', 'Your new password should be different than the old one.', Ext.emptyFn);
						} else if(confirmedpassword !== newpassword){
							Ext.Msg.alert('Error', 'Your confirm password is different than your new password.', Ext.emptyFn);
						} else {
							Ext.Ajax.request({
								url   : _urlBase + _passwordURL,
								method: 'post',
								params: {
									username    : username, 
									oldpassword : oldpassword,
									newpassword : newpassword
								},
								failure : function(response){
									console.log('Failure',response);
									if(response.status === 404){
										Ext.Ajax.request({
											url   : _urlBase + _passwordURL,
											method: 'post',
											params: {
												username    : username, 
												oldpassword : oldpassword,
												newpassword : newpassword
											},
											failure : function(response){
												console.log('Failure',response);
												Ext.Msg.alert('Error', 'Error while change password!');
											},
											success: function(response, opts) {
												data = Ext.decode(response.responseText);
												if (data.errorMessage != null){
													Ext.Msg.alert('Error', data.errorMessage, Ext.emptyFn);
												} else {
													SimbaApp.views.PasswordResetForm.reset();
													Ext.Msg.alert('Success','Your password was changed successfully! Please re-login.',SimbaApp.doLogout);
												}
											}
										});
									}
								},
								success: function(response, opts) {
									data = Ext.decode(response.responseText);
									if (data.errorMessage != null){
										Ext.Msg.alert('Error', data.errorMessage, Ext.emptyFn);
									} else {
										SimbaApp.views.PasswordResetForm.reset();
										Ext.Msg.alert('Success','Your password was changed successfully! Please re-login.',SimbaApp.doLogout);
									}
								}
							});
						}
					}
				},{
					xtype: 'button',
					text : 'Cancel',
					style: 'margin:2%;',
					handler: function(btn,evt){
						SimbaApp.views.PasswordResetForm.reset();
						SimbaApp.views.viewport.setActiveItem(SimbaApp.views.Settings);
					}
				}]
			}
        ]
    }],
	listeners: {
		show: function (form){
			form.setValues({Username: SimbaApp.views.LoginForm.getValues().Username || window.localStorage.getItem("username") || ''});
		}
	}
};

SimbaApp.doLogout = function(){
	Ext.Ajax.request({
		url   : _urlBase + _logoutURL,
		method: 'post',
		timeout: 5000,
		failure : function(response){
			console.log('Failure',response);
		},
		success: function(response){
			console.log('Success',response);
		}
	});
	window.localStorage.removeItem("username");
	window.localStorage.removeItem("password");
	// var oldSimbaPageids = [];
	// Ext.each(SimbaApp.views.viewport.items.items,function(item,index,allItems){
		// if(item.simbapageid) oldSimbaPageids.push(item.simbapageid);
	// });
	// if(oldSimbaPageids.length > 0){
		// for(var i =0; i < oldSimbaPageids.length; i++){
			// var oldPage = eval("SimbaApp.views.DashboardPage" + oldSimbaPageids[i]);
			// var oldPrompt = eval("SimbaApp.views.Prompts" + oldSimbaPageids[i]);
			// if(oldPage){
				// if(oldPage) oldPage.destroy();
				// if(oldPrompt) oldPrompt.destroy();
				// delete SimbaApp.views['DashboardPage' + oldSimbaPageids[i]]; 
				// delete SimbaApp.views['Prompts' + oldSimbaPageids[i]]; 
			// }
		// }
	// }
	for(var k in SimbaApp.views){
		if(Ext.isObject(SimbaApp.views[k])){
			if(SimbaApp.views[k].simbatype == 'simbapage' || SimbaApp.views[k].simbatype == 'simbaprompt'){
				if(!SimbaApp.views[k].isDestroyed) SimbaApp.views[k].destroy();
				delete SimbaApp.views[k];
			}
		}
	}
	if(SimbaApp.views.LoginForm.submittedValues){
		SimbaApp.views.LoginForm.reset();
		SimbaApp.views.LoginForm.setValues({
			Rememberme: 0,
			Username: (SimbaApp.views.LoginForm.submittedValues) ? SimbaApp.views.LoginForm.submittedValues.Username : window.localStorage.getItem("username") || '',
			urlbase1: _urlBase,
			urlbase2: _urlBase
		});
	}
	SimbaApp.views.viewport.hide();
	SimbaApp.views.LoginForm.show();
	// SimbaApp.views.LoginForm.doComponentLayout();
	SimbaApp.views.LoginForm.op = 'logout';
	if(SimbaApp.views.offlinePanel){
		// console.log('OfflinePanel',SimbaApp.views.offlinePanel);
		SimbaApp.views.offlinePanel.hide();
	}
	SimbaApp.stores.OnlineNavigation.proxy.extraParams.unit_id = 0;
	SimbaApp.views.Settings.reset();
}

SimbaApp.views.PasswordResetForm = new Ext.form.FormPanel(PasswordResetFormBase);

SimbaApp.views.createSettingsForm = function(){
	SimbaApp.views.Settings = new Ext.form.FormPanel({
		layout: {
			type:"vbox",
		},
		// scroll: 'vertical',
		scroll: false,
		cls  : 'x-login-screen',
		switchToOnline: function(){
			if(SimbaApp.views.offlinePanel){
				var activeItem = SimbaApp.views.offlinePanel.getActiveItem();
				if (activeItem && activeItem.simbatype == 'simbapage'){
					activeItem.destroy();
					if (Ext.is.Phone) {
						SimbaApp.views.offlinePanel.setActiveItem(SimbaApp.views.OfflineNavigation);
						if (!SimbaApp.views.offlinePanel.closeButton.hidden){
							SimbaApp.views.offlinePanel.closeButton.hide();
						}
					}
				}
				SimbaApp.views.offlinePanel.setActiveItem(null);
				SimbaApp.views.offlinePanel.hide();
			}
			if(SimbaApp.views.viewport && SimbaApp.views.LoginForm.op == 'login'){
				SimbaApp.views.viewport.show();
				SimbaApp.views.viewport.refreshButton.show();
				_offline = false;
			} else {
				SimbaApp.onlineLaunch();
			}
		},
		items: [{
			xtype: 'fieldset',
			style:{width:'100%'},
			hidden: _offline ? true : false,
			items: [{
				xtype:"button",
				text:"Logout",   
				style: 'margin:2%;',
				// disabled: _offline ? true : false,
				handler: SimbaApp.doLogout
			},{
				xtype:"button",
				text:"Change Password",
				style: 'margin:2%;',
				// disabled: _offline ? true : false,
				handler:function(btn,e){
					SimbaApp.views.viewport.setActiveItem(SimbaApp.views.PasswordResetForm);
				}
			}]
		},{
			xtype: 'fieldset',
			style:{width:'100%'},
			hidden: (_userPerm != 'super admin mobiiapp') ? true : false,
			items: [{
				xtype: 'selectfield',
				label: 'Group',
				store: SimbaApp.stores.MobiiappUnits,
				valueField: 'id',
				displayField: 'name',
				value: 1,
				labelWidth: '40%',
				name: 'unit',
				listeners: {
					change: function(select,value){
						SimbaApp.stores.OnlineNavigation.proxy.extraParams.unit_id = value;
						var maskEl = Ext.getBody();
						var loadMask = new Ext.LoadMask(maskEl, {
							msg: 'Refreshing...'
						});
						loadMask.show();
						SimbaApp.views.Navigation.store.load();
						SimbaApp.views.Navigation.store.on('read',function(store,node,records,successful){
							loadMask.destroy();
							loadMask.disable();
							if(Ext.is.Phone && !_offline){
								SimbaApp.views.viewport.setActiveItem(SimbaApp.views.Navigation);
								SimbaApp.views.viewport.refreshButton.show();
							}
						});
					}
				}
			}]
		},{
			xtype: 'fieldset',
			style:{width:'100%'},
			items: [{
				xtype: 'togglefield',
				label: 'Offline Mode',
				labelWidth: '40%',
				name: 'offlinemode',
				value: _offline ? 1 : 0,
				required: false,
				listeners: {
					change: function(slider,thumb,newValue,oldValue){
						var logoutPasswordFieldset = SimbaApp.views.Settings.items.items[0],
							// logoutBtn = SimbaApp.views.Settings.items.items[0].items.items[0],
							// changepasswordBtn = SimbaApp.views.Settings.items.items[0].items.items[1],
							supportBtn = SimbaApp.views.Settings.items.items[3].items.items[0],
							unitSelectFieldset = SimbaApp.views.Settings.items.items[1];
						if(oldValue == 0 && newValue==1){
							_offline = true;
							// logoutBtn.disable();
							// changepasswordBtn.disable();
							// supportBtn.disable();
							logoutPasswordFieldset.hide();
							unitSelectFieldset.hide();
							SimbaApp.offlineLaunch();
						} else if(oldValue == 1 && newValue==0){
							_offline = false;
							// logoutBtn.enable();
							// changepasswordBtn.enable();
							// supportBtn.enable();
							logoutPasswordFieldset.show();
							if(_userPerm == 'super admin mobiiapp'){
								unitSelectFieldset.show();
							}
							SimbaApp.views.Settings.switchToOnline();
						}
					}
				}
			}]
		},{
			xtype: 'fieldset',
			style:{width:'100%'},
			hidden: (_userPerm == 'super admin mobiiapp' || _offline) ? true : false,
			items: [{
				xtype: 'button',
				text : 'Support',
				style: 'margin:2%;',
				// disabled: _offline ? true : false,
				handler: function(btn,e){
					var supportPanel = new SimbaApp.views.Support({});
					SimbaApp.views.viewport.setActiveItem(supportPanel);
				}
			// },{
				// height: 46,
				// html: '<div style="margin-top: 10px; color: blue; font-size: 18px; float: left;"><a target="_blank" style="color: blue;" href="'+_urlBase+'tutorial/">Tutorial</a></div>'
			// },{
				// height: 46,
				// html: '<div style="margin-top: 10px; color: blue; font-size: 18px; float: left;"><a target="_blank" style="color: blue;" href="'+_urlBase+'">MobiiApp Admin Web Console</a></div>'
			}]
		}],
		dockedItems:[{
			xtype: 'toolbar',
			dock: 'bottom',
			items:[{
				xtype: 'spacer'
			}, {
				text: 'Back',
				ui  : 'action',
				handler: function(btn,e){
					SimbaApp.views.Settings.ownerCt.setActiveItem(null);
					if(Ext.is.Phone && !_offline){
						SimbaApp.views.Settings.ownerCt.refreshButton.show();
					}
				}
			}]
		}],
		listeners: {
			activate: function(settingForm){
				var unitSelectFieldset = settingForm.items.items[1];
				var supportBtnFieldset = settingForm.items.items[3];
				if(_userPerm == 'super admin mobiiapp' && ! _offline){
					unitSelectFieldset.show();
				} else {
					unitSelectFieldset.hide();
				}
				if(_userPerm == 'super admin mobiiapp' || _offline){
					supportBtnFieldset.hide();
				} else {
					supportBtnFieldset.show();
				}
			}
		}
	});
}

SimbaApp.views.createJoinGroupForm = function(){
	var joinGroupForm = new Ext.form.FormPanel({
		fullscreen: true,
		layout : {
			type: 'vbox'
		},
		cls: 'x-login-screen',
		items: [{
			xtype: 'fieldset',
			style: {
				width: '100%'
			},
			items: [{
				xtype: 'selectfield',
				label: 'Request To:',
				name: 'create_or_join',
				options: [
					{text: 'Create a Group', value: 'create_group'},
					{text: 'Join a Group', value: 'join_group'}
				],
				listeners: {
					change: function(field,value){
						var descriptionField = joinGroupForm.getFields('group_description');
						var createJoinBtn = field.nextSibling().nextSibling().nextSibling();
						// console.log('descriptionField',descriptionField);
						// var statusHtml = field.nextSibling().nextSibling().nextSibling();
						// statusHtml.update('');
						// statusHtml.hide();
						if(value == 'join_group'){
							descriptionField.hide();
							createJoinBtn.setText('Join');
						} else {
							descriptionField.show();
							createJoinBtn.setText('Create');
						}
					}
				}
			},{
				xtype: 'textfield',
				label: 'Name:',
				name : 'group_name'
			},{
				xtype: 'textareafield',
				label: 'Description:',
				maxRows: 5,
				name : 'group_description'
			// },{
				// html: '',
				// style: {
					// 'margin-top': '15px',
					// color: 'blue'
				// },
				// hidden: true
			},{
				xtype: 'button',
				style: {
					'width' : '100%',
					'margin-top': '10px',
					'margin-bottom': '10px',
					// 'float' : 'right'
				},
				text : 'Create',
				handler: function(btn,e){
					var values = joinGroupForm.getValues();
					console.log('values',values);
					if(values.create_or_join == 'create group'){
						if(values.group_name == '' || values.group_description == ''){
							Ext.Msg.alert('Warning','Group Name and Description are required to create a group!');
							return false;
						} 
					} else {
						if(values.group_name == ''){
							Ext.Msg.alert('Warning','Group Name is required to join a group!');
							return false;
						}
					}
					Ext.Ajax.request({
						url   : _urlBase + _joinGroupURL,
						method: 'post',
						params: {
							action   : (values.create_or_join == 'create_group') ? 'create' : 'join',
							groupname: values.group_name,
							groupdesc: (values.create_or_join == 'create_group') ? values.group_description : '',
							username: window.localStorage.getItem("username") || 'demo',
							password: window.localStorage.getItem("password")
						},
						timeout: 10000,
						failure : function(response){
							console.log('Failure',response);
						},
						success: function(response, opts){
							console.log('Success',response);
							var data = Ext.decode(response.responseText);
							if (data.errorMessage != null){
								Ext.Msg.alert('Error', data.errorMessage, Ext.emptyFn);
							} else {
								if(values.create_or_join == 'create_group'){
									// Ext.Msg.alert('Success',data.msg,function(){
										// joinGroupForm.destroy();
										// SimbaApp.views.LoginForm.show();
										// SimbaApp.doOnlineLoginOK();
									// });
									joinGroupForm.destroy();
									var successInfoPanel = new Ext.form.FormPanel({
										fullscreen: true,
										items: [{
											html: data.msg,
										}],
										dockedItems: [{
											xtype: 'toolbar',
											dock: 'top',
											items:[{
												xtype: 'spacer'
											}, {
												text: 'Done',
												ui  : 'action',
												handler: function(btn,e){
													successInfoPanel.destroy();
													SimbaApp.views.LoginForm.show();
													var username = window.localStorage.getItem("username");
													var password = window.localStorage.getItem("password");
													if(username && password){
														SimbaApp.onlineLaunch();
													} else {
														SimbaApp.doOnlineLoginOK();
													}
												}
											}]
										}]
									});
									
								} else {
									// Ext.Msg.alert('Success',data.msg,function(){
										// joinGroupForm.destroy();
										// SimbaApp.views.LoginForm.show();
									// });
									joinGroupForm.destroy();
									var successInfoPanel = new Ext.form.FormPanel({
										fullscreen: true,
										items: [{
											html: data.msg
										}],
										dockedItems: [{
											xtype: 'toolbar',
											dock: 'top',
											items:[{
												xtype: 'spacer'
											}, {
												text: 'Done',
												ui  : 'action',
												handler: function(btn,e){
													successInfoPanel.destroy();
													SimbaApp.views.LoginForm.show();
												}
											}]
										}]
									});
								}
								// var statusHtml = btn.previousSibling();
								// statusHtml.show();
								// statusHtml.update(data.msg);
								// console.log(statusHtml);
								// joinGroupForm.setValues({
									// group_name: '',
									// group_description: ''
								// })
							}
						}
					});
				}
			}]
		}],
		dockedItems: [{
			xtype: 'toolbar',
			dock: 'top',
			title: 'Create or Join a Group',
			// items:[{
				// xtype: 'spacer'
			// }, {
				// text: 'Done',
				// ui  : 'action',
				// handler: function(btn,e){
					// joinGroupForm.destroy();
					// SimbaApp.views.LoginForm.show();
				// }
			// }]
		}]
	});
}



