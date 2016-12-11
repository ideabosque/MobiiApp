// Sencha 1 fix for map click events
Ext.gesture.Manager.onMouseEventOld = Ext.gesture.Manager.onMouseEvent;
Ext.gesture.Manager.onMouseEvent = function(e) {
	var target = e.target;
	while (target) {
		if (Ext.fly(target) && Ext.fly(target).hasCls('x-map')) {
			return;
		}
		target = target.parentNode;
	}
	this.onMouseEventOld.apply(this, arguments);
};

SimbaApp.views.SimbaMapPanel = Ext.extend(Ext.Panel, {
    layout: 'fit',
	simba : this.simba,
	
    initComponent: function() {
		var me = this;
		me.markersArray = [];
		me.infowindow = new google.maps.InfoWindow({ content: ''});
		if(_offline){
			me.html = '<span style="color:#D6B80A">The map view is not supported to be viewed in offline.</span>';
			me.items = [];
		} else {
			me.items = me.map = new Ext.Map({
				mapOptions: {
					center : new google.maps.LatLng(33.740717, -117.881408),  //Santa Ana
					zoom : 10,
					mapTypeId : google.maps.MapTypeId.ROADMAP,
					navigationControl: true,
					navigationControlOptions: { style: google.maps.NavigationControlStyle.DEFAULT},
					zoomControl: true,
					zoomControlOptions: (Ext.is.Desktop) ? {position: google.maps.ControlPosition.LEFT_CENTER,style:google.maps.ZoomControlStyle.DEFAULT} : {position: google.maps.ControlPosition.LEFT_BOTTOM,style:google.maps.ZoomControlStyle.LARGE}
				},
				listeners: {
					maprender: function(comp,map){
						if(comp.ownerCt){
							var simbaMapPanel = comp.ownerCt,
								simbaview = simbaMapPanel.simbaview,
								viewinfo = simbaview.viewInfo,
								centerLatitude = parseFloat(viewinfo.centerLatitude),
								centerLongitude = parseFloat(viewinfo.centerLongitude),
								centerCoords = new google.maps.LatLng(centerLatitude, centerLongitude),
								geocodeSource = viewinfo.geocodeSource,
								latitude = viewinfo.latitude,
								longitude = viewinfo.longitude,
								location = viewinfo.location,
								detail = viewinfo.detail,
								data = viewinfo.data,
								series = viewinfo.series,
								ln = data.length;
							map.setCenter(centerCoords);
							me.mapCenter = centerCoords;
							if(simbaMapPanel.markerCluster) simbaMapPanel.markerCluster.clearMarkers();
							if(simbaMapPanel.markersArray.length>0){
								for (var i in simbaMapPanel.markersArray){
									simbaMapPanel.markersArray[i].setMap(null);
								}
								simbaMapPanel.markersArray.length = 0;
							}
							if(ln > 0){
								for(var i = 0; i < ln; i++){
									if(geocodeSource == 'coordinate'){
										var lat = parseFloat(data[i][latitude]);
										var lng = parseFloat(data[i][longitude]);
									} else {
										var lat = parseFloat(data[i]['lat']);
										var lng = parseFloat(data[i]['lng']);
									}
									// var title = data[i][detail[0]];
									if(series.length == 0){
										var marker = new google.maps.Marker({
											position: new google.maps.LatLng(lat,lng),
											index: i,
											animation: google.maps.Animation.DROP,
											map: map,
											clickable: true,
											draggable: false,
											icon: 'resources/img/markers/blue.png'
											// icon: _urlBase + 'SimbaApp/resources/img/markers/blue.png'
										});
									} else {
										var seriesValue = data[i][series.join('')];
										var record = me.seriesStore.findRecord('label',seriesValue);
										if(record){
											var markerUrl = record.get('markerUrl');
										} else {
											// var markerUrl = _urlBase + 'SimbaApp/resources/img/markers/blue.png';
											var markerUrl = 'resources/img/markers/blue.png';
										}
										var marker = new google.maps.Marker({
											position: new google.maps.LatLng(lat,lng),
											index: i,
											animation: google.maps.Animation.DROP,
											map: map,
											clickable: true,
											draggable: false,
											icon: markerUrl
										});
									}
									google.maps.event.addListener(marker, 'click', function() {
										// console.log('maker',this);
										me.onSingleChoice(this.index);
										// simbaMapPanel.infowindow.setContent(this.title);
										// simbaMapPanel.infowindow.open(map, this);
									});
									simbaMapPanel.markersArray.push(marker);
								}
								simbaMapPanel.markerCluster = new MarkerClusterer(map, simbaMapPanel.markersArray);
								simbaMapPanel.markerCluster.onClick = function() { 
									// console.log('this',this);
									return me.onMultiChoice(simbaMapPanel); 
								}
							}
						}
					}
				}
			});
			me.relatedTable = new SimbaApp.views.SimbaTable({
				pagecid: me.pagecid, 
				simbapageid: me.simbapageid,
				reportid: me.reportid, 
				simba: me.simba,
				simbaview: me.simbaview,
				extId: '-relatedTable',
				// id: me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName + '-relatedtable',
				fullscreen: true,
				// hidden: true,
				style: 'z-index: -100',
				preview: true,
				dockedItems: [{
					xtype: 'toolbar',
					dock : 'top',
					items:[{
						xtype: 'spacer'
					},{
						xtype: 'button',
						iconCls: 'delete',
						iconMask: true,
						handler: function(btn,e){
							me.relatedTable.store.data.items = me.relatedTable.store.alldata;
							var rtEl = me.relatedTable.getEl();
							rtEl.setStyle('z-index',-100);
							// me.relatedTable.hide();
							// var ownerReport = SimbaApp.getOwnerbySimbatype(me,'simbareport');
							// console.log('ownerReport',ownerReport);
							// if(ownerReport.preview){
								// ownerReport.show(); 
							// } else {
								// SimbaApp.views.viewport.show();
							// }
						}
					}]
				}]
			});
			if(me.relatedTable.store.snapshot) me.relatedTable.store.data = me.relatedTable.store.snapshot;
			// me.relatedTable.store.pageSize = me.relatedTable.store.getCount();
			// me.relatedTable.pagingSiderToolbar.hide();
			me.listeners = {
				destroy: function(){
					if(me.relatedTable) me.relatedTable.destroy();
				}
			};
			me.buildSeriesBar();
		}
		me.id = me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
        SimbaApp.views.SimbaMapPanel.superclass.initComponent.call(me, arguments);
    },
	
	getSeries: function(){
		var me = this,
			store = me.relatedTable.store,
			viewInfo = me.simbaview.viewInfo,
			// markerPath = _urlBase + 'SimbaApp/resources/img/markers/',
			markerPath = 'resources/img/markers/',
			seriesColors = [
				'blue','brown','darkgreen','lime','orange','lightblue','pink','purple','red','yellow',
				'AliceBlue','AntiqueWhite','Aquamarine','BlueViolet','BurlyWood','CadetBlue','CornflowerBlue','Cyan','DarkGoldenRod','Darkorange',
				'DarkOrchid','DarkSeaGreen','ForestGreen','Gold','Turquoise','SandyBrown','Snow','Silver','Tomato','Teal'
			],
			colorsLen = seriesColors.length,
			series = viewInfo.series;
		if(series.length == 0){
			return false;
		} else {
			var seriesValues = store.collectBy(series),
				seriesLen = seriesValues.length,
				fields = ['markerUrl','label','markerColor'],
				data = [],
				i = 0;
			// console.log('seriesValues',seriesValues);
			for(;i < seriesLen; i++){
				if(i < colorsLen){
					var row = {
						markerUrl: markerPath + seriesColors[i] + '.png',
						label    : seriesValues[i],
						markerColor: seriesColors[i],
						disabled : false
					};
				} else {
					// var idx = i%colorsLen;
					// console.log('idx',idx);
					var row = {
						markerUrl: markerPath + seriesColors[i%colorsLen] + '.png',
						label    : seriesValues[i],
						markerColor: seriesColors[i%colorsLen],
						disabled : false
					};
					// console.log('row',row);
				}
				data.push(row);
			}
			me.seriesStore = new Ext.ux.SimbaStore({
				fields: fields,
				data  : data
			});
			// console.log('seriesStore',me.seriesStore)
			// console.log('store',store)
		}
	},
	
	buildSeriesBar: function(){
		var me = this,
			store = me.relatedTable.store,
			viewInfo = me.simbaview.viewInfo;
		me.getSeries();
		if(me.seriesStore){
			var tpl = new Ext.XTemplate('<ul class="' + 'x-legend-items">',
				'<tpl for=".">',
					'<li class="' + 'x-legend-item <tpl if="disabled">' + 'x-legend-inactive' + '</tpl>">',
						'<span class="' + 'x-legend-item-marker" style="background-color:{markerColor};"></span>{label}',
					'</li>',
				'</tpl>',
			'</ul>');
			var orientation = Ext.getOrientation();
			var dataViewBase = {
				store: me.seriesStore,
				tpl: tpl,
				multiSelect: false,
				cls: 'x-legend',
				overItemCls:'x-view-over',
				itemSelector:'li.x-legend-item'
			};
			if(Ext.is.Phone){
				dataViewBase.width = 200;
				dataViewBase.height = 260;
				dataViewBase.floating = true;
                dataViewBase.modal =true;
                dataViewBase.hideOnMaskTap = true;
				var toolbar = me.toolbar = new Ext.Toolbar({
					 dock : 'bottom',
					 cls  : 'x-chart-toolbar',
					 // style: {'background':'transparent'},
					 items: [{
						text: 'Reset',
						handler: function(btn,e){
							var gmap = me.map.map,
								mapCenter = me.mapCenter;
							gmap.panTo(mapCenter);
							gmap.setZoom(10);
						}
					 },{
						xtype: 'spacer'
					},{
						// cls: 'x-legend-button',
						iconCls: 'legend',
						iconMask: true,
						// ui      : 'plain',
						handler: function(btn,e){
							// if(me.legendDataview)
							// console.log(me.legendDataview);
							if(me.legendDataview.rendered){
								me.legendDataview.showBy(btn);
							} else {
								var el = Ext.getBody();
								me.legendDataview.render(el);
								me.legendDataview.showBy(btn);
							}
						}	
					}]
				});
				me.dockedItems = me.dockedItems || [];
				me.dockedItems.push(toolbar);
			} else {
				dataViewBase.dock = (orientation == 'landscape') ? 'right' : 'top';
				if(orientation == 'landscape') dataViewBase.width = 200;
				if(orientation == 'portrait') dataViewBase.height = 200;
			}
			
			var legendDataview = me.legendDataview = new Ext.DataView(dataViewBase);
			if(!Ext.is.Phone){
				me.dockedItems = me.dockedItems || [];
				me.dockedItems.push(legendDataview);
			}
		}
		
	},
	
	onSingleChoice: function(index){
		var me = this;
		var rowDetailsForm = Ext.getCmp('mobiiapp-row-details-form');
		if(rowDetailsForm) rowDetailsForm.destroy();
		while (Ext.get('mobiiapp-row-details-form')){
			Ext.get('mobiiapp-row-details-form').remove();
		}
		var store = me.relatedTable.store;
		var record = store.getAt(index);
		var dimColModel = me.relatedTable.dimColModel;
		var factColModel = me.relatedTable.factColModel;
		var colModel = dimColModel.concat(factColModel);
		var colLen = colModel.length;
		var dataLen = store.snapshot ? store.snapshot.length : store.getCount();
		var html = '<table style="width: 100%;">';
		var rowDetailsFormbase = {
			items: [],
			scroll: 'vertical',
			cls: 'x-row-detail',
			fullscreen: true,
			id: 'mobiiapp-row-details-form',
			style: 'z-index: 100',
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					xtype: 'spacer'
				},{
					xtype: 'button',
					iconCls: 'delete',
					iconMask: true,
					handler: function(btn,e){
						var rowDetailsForm = Ext.getCmp('mobiiapp-row-details-form');
						rowDetailsForm.destroy();
						while (Ext.get('mobiiapp-row-details-form')){
							Ext.get('mobiiapp-row-details-form').remove();
						}
					}
				}]
			}],
		};
		for(var i=0; i<colLen; i++){
			var model = colModel[i];
			if(Ext.isArray(model.header)) var header = model.header.join(', ');
			else var header = model.header;
			if(header.indexOf(', ') == 0) header = header.substring(2);
			html += '<tr class="x-grid-row"><td width="40%" class="x-grid-cell">'+ 
						header + 
						'</td><td width="60%" class="x-grid-cell">'+ 
						record.get(model.mapping) +
						'</td></tr>';
		}
		html += '</table>';
		rowDetailsFormbase.html = html;
		var rowDetailsForm = new Ext.form.FormPanel(rowDetailsFormbase);
		rowDetailsForm.show();
	},
	
	onMultiChoice: function(simbaMapPanel) {
		var me = this,
			mc = simbaMapPanel.markerCluster,
			map = simbaMapPanel.map.map,
			cluster = mc.clusters_;
		// console.log('cluster',cluster);
		// console.log('map',map);
		// console.log('mc',mc);
		// if more than 1 point shares the same lat/long
		// the size of the cluster array will be 1 AND
		// the number of markers in the cluster will be > 1
		// REMEMBER: maxZoom was already reached and we can't zoom in anymore
		if (map.zoom == 18 && cluster.length >1){
			Ext.Msg.alert('Warning','Max zoom level reached. All item in this zoom level will be shown.',function(){
				var markers = [];
				for(var i=0; i< cluster.length; i++){
					markers = markers.concat(cluster[i].markers_);
				}
				markersLen = markers.length,
				filteredData = [];
				if(me.relatedTable.store.alldata) me.relatedTable.store.data.items = me.relatedTable.store.alldata;
				else me.relatedTable.store.alldata = me.relatedTable.store.data.items;
				for(var i=0; i<markersLen; i++){
					var idx = markers[i].index;
					filteredData.push(me.relatedTable.store.getAt(idx));
				}
				me.relatedTable.store.loadData(filteredData);
				var rtEl = me.relatedTable.getEl();
				// console.log('rtEl',rtEl);
				rtEl.setStyle('z-index',100);
				// var ownerReport = SimbaApp.getOwnerbySimbatype(me,'simbareport');
				// if(ownerReport.preview){
					// ownerReport.hide(); 
				// } else {
					// SimbaApp.views.viewport.hide();
				// }
				// me.relatedTable.show();
			});
			return false;
		}
		if (cluster.length == 1 && cluster[0].markers_.length > 1){
			var markers = cluster[0].markers_,
				markersLen = markers.length,
				filteredData = [];
			if(me.relatedTable.store.alldata) me.relatedTable.store.data.items = me.relatedTable.store.alldata;
			else me.relatedTable.store.alldata = me.relatedTable.store.data.items;
			for(var i=0; i<markersLen; i++){
				var idx = markers[i].index;
				filteredData.push(me.relatedTable.store.getAt(idx));
			}
			me.relatedTable.store.loadData(filteredData);
			var rtEl = me.relatedTable.getEl();
			// console.log('rtEl',rtEl);
			rtEl.setStyle('z-index',100);
			// var ownerReport = SimbaApp.getOwnerbySimbatype(me,'simbareport');
			// if(ownerReport.preview){
				// ownerReport.hide(); 
			// } else {
				// SimbaApp.views.viewport.hide();
			// }
			// me.relatedTable.show();
			return false;
		}
		return true;
	}
});