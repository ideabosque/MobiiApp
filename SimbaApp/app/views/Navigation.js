SimbaApp.createNavigation = function(){
	if(SimbaApp.views.Navigation) {
		SimbaApp.views.Navigation.store.load();
	} else {	
		SimbaApp.views.Navigation = new Ext.NestedList({
			store: SimbaApp.stores.OnlineNavigation,
			dock: 'left',
			useTitleAsBackText: false,
			useToolbar: Ext.is.Phone ? false : true,
			title: 'Home',
			displayField: 'label',
			hidden: !Ext.is.Phone && Ext.Viewport.orientation == 'portrait',
			onBackTap: function() {
				var currList      = this.getActiveItem(),
					currIdx       = this.items.indexOf(currList);
				var activeItem = SimbaApp.views.viewport.getActiveItem();
				// console.log(activeItem);
				if(activeItem && activeItem.simbatype == 'simbapage'){
					activeItem.destroy();
				}
				if (!Ext.is.Phone) SimbaApp.views.viewport.setActiveItem(null);
				if (currIdx != 0) {
					var prevDepth     = currIdx - 1,
						prevList      = this.items.getAt(prevDepth),
						recordNode    = prevList.recordNode,
						record        = recordNode.getRecord(),
						parentNode    = recordNode ? recordNode.parentNode : null,
						backBtn       = this.backButton,
						backToggleMth = (prevDepth !== 0) ? 'show' : 'hide',
						backBtnText;
					SimbaApp.views.viewport.optionsButton.hide();
					SimbaApp.views.viewport.commentButton.hide();
					if(prevDepth === 0){
						SimbaApp.views.viewport.settingButton.show();
						SimbaApp.views.viewport.toolBar.setTitle('MobiiApp');
						SimbaApp.views.viewport.setActiveItem(null);
					} else {
						var toolBar = SimbaApp.views.viewport.toolBar;
						toolBar.setTitle(record.get('label'));
					}
					this.on('cardswitch', function(newCard, oldCard) {
						var selModel = prevList.getSelectionModel();
						this.remove(currList);
						if (this.clearSelectionDelay) {
							Ext.defer(selModel.deselectAll, this.clearSelectionDelay, selModel);
						}
					}, this, {single: true});
					
					this.setActiveItem(prevList, {
						type: this.cardSwitchAnimation,
						reverse: true,
						scope: this
					});
					this.syncToolbar(prevList);
				}
			},
			getTitleTextTpl: function(node){
				if (Ext.is.Phone) {
					var label = node.attributes.record.data.label;
					if (label.length > 15) {
						return label.substring(0,12) + '...';
					} else {
						return label;
					}
				} else {
					return '';
				}
			},
			listeners: {
				itemtap: function(subList, subIndex, el, e) {
					var store = subList.getStore(),
						record = store.getAt(subIndex),
						recordNode = record.node,
						parentNode = recordNode ? recordNode.parentNode : null;
	
					var toolBar = SimbaApp.views.viewport.toolBar;
					var label = recordNode.attributes.record.data.label;
					if (label.length > 15 && Ext.is.Phone) {
						toolBar.setTitle(label.substring(0,12) + '...');
					} else {
						toolBar.setTitle(label);
					}
					SimbaApp.views.viewport.settingButton.hide();
					
					
					if(Ext.is.Phone){
						toolBar.items.get(0).show();
					}
		
					if (recordNode.leaf) {
						if(!Ext.is.Phone && Ext.Viewport.orientation == 'portrait') SimbaApp.views.Navigation.hide();
						var typename = record.get('type'),
							control_id = record.get('control_id'),
							controller = record.get('controller'),
							simbapageid = record.get('id');
						// console.log('simbapageid',simbapageid);
						if(control_id != 0){
							SimbaApp.createDashboardPage(typename, controller, control_id, simbapageid);
						}
					}
				}
			}
		});
		var tb = SimbaApp.views.Navigation.toolbar;
		var refreshButton = SimbaApp.views.Navigation.refreshButton = new Ext.Button({
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
					// console.log('k',SimbaApp.views[k]);
					if(Ext.isObject(SimbaApp.views[k])){
						if(SimbaApp.views[k].simbatype == 'simbapage' || SimbaApp.views[k].simbatype == 'simbaprompt'){
							if(!SimbaApp.views[k].isDestroyed) SimbaApp.views[k].destroy();
							delete SimbaApp.views[k];
						}
					}
				}
			}
		});
		
		if(tb){
			tb.add(refreshButton);
			SimbaApp.views.Navigation.backButton.on('show',function(btn){
				refreshButton.hide();
			});
			SimbaApp.views.Navigation.backButton.on('hide',function(btn){
				refreshButton.show();
			});
			tb.doLayout();
			
			
		}
		
		
	}
}
