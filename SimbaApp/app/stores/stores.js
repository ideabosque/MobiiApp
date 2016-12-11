SimbaApp.stores.OnlineNavigation = new Ext.data.TreeStore({
	model: 'Navigation',
	proxy: {
		type: 'ajax',
		url   : _urlBase + _menuURL,
		method: 'POST',
		reader: {
			type: 'tree',
			root: 'items'
		},
		extraParams:{
			unit_id: 0,
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password") || ''
		}
	},
	listeners: {
		'beforeload': function(store,opt){
			// console.log('store',store);
			store.proxy.extraParams.username = window.localStorage.getItem("username") || 'demo';
			store.proxy.extraParams.password = window.localStorage.getItem("password");
		}
	},
	autoLoad: false
});

SimbaApp.stores.OfflineNavigation = new Ext.data.Store({
	model: 'OfflineNavigation',
	autoLoad: false
});

SimbaApp.stores.MobiiappComment = new Ext.data.Store({
	model: 'MobiiappComment',
	proxy: {
		type: 'ajax',
		url   : _urlBase + _commentURL,
		method: 'POST',
		reader: {
			type: 'json',
			root: 'comments'
		},
		extraParams:{
			catalog_id: _catalogID,
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password") || ''
		}
	},
	listeners: {
		'beforeload': function(store,opt){
			store.proxy.extraParams.username = window.localStorage.getItem("username") || 'demo';
			store.proxy.extraParams.password = window.localStorage.getItem("password");
		}
	},
	autoLoad: false
});


SimbaApp.stores.MobiiappUnits = new Ext.data.Store({
	fields: [
		{name: 'id',   type: 'int'},
		{name: 'name', type: 'string'},
	],
	proxy: {
		type: 'ajax',
		url   : _urlBase + _unitsURL,
		method: 'POST',
		reader: {
			type: 'json',
			root: 'units'
		},
		extraParams:{
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password") || ''
		}
	},
	listeners: {
		'beforeload': function(store,opt){
			store.proxy.extraParams.username = window.localStorage.getItem("username") || 'demo';
			store.proxy.extraParams.password = window.localStorage.getItem("password");
		}
	},
	autoLoad: false
});


SimbaApp.stores.MobiiappSupport = new Ext.data.Store({
	model: 'MobiiappSupport',
	proxy: {
		type: 'ajax',
		url   : _urlBase + _ticketsURL,
		method: 'POST',
		reader: {
			type: 'json',
			root: 'tickets'
		},
		extraParams:{
			username: window.localStorage.getItem("username") || 'demo',
			password: window.localStorage.getItem("password") || ''
		}
	},
	listeners: {
		'beforeload': function(store,opt){
			store.proxy.extraParams.username = window.localStorage.getItem("username") || 'demo';
			store.proxy.extraParams.password = window.localStorage.getItem("password");
		}
	},
	autoLoad: false
});