SimbaApp.models.Navigation = Ext.regModel('Navigation', {
	fields: [
		{name: 'id',   type: 'int'},
		{name: 'label', type: 'string'},
		{name: 'type', type : 'string'},
		{name: 'control_id', type : 'int'},
		{name: 'controller', type : 'string'},
		{name: 'leaf', type: 'boolean'},
		{name: 'editable', type: 'boolean'}
	]
});

SimbaApp.models.OfflineNavigation = Ext.regModel('OfflineNavigation', {
	fields: [
		{name: 'id',   type: 'int'},
		{name: 'label', type: 'string'},
		{name: 'path', type: 'string'},
		{name: 'control_id', type : 'int'},
		{name: 'controller', type : 'string'},
		{name: 'simba', type : 'string'},
		{name: 'cachedtime',type: 'string'}
	]
});

SimbaApp.models.Comment = Ext.regModel('MobiiappComment', {
	fields: [
		{name: 'id',   type: 'int'},
		{name: 'name', type: 'string'},
		{name: 'time', type: 'string'},
		{name: 'format_time', type: 'string',
			convert: function(rec,v){
				// console.log('rec',rec);
				// console.log('v',v);
				var timeStr = v.get('time');
				var timeObj = Date.parseDate(timeStr, "Y-m-d H:i:s",true);
				var format_time = timeStr;
				if(timeObj){
					var now = new Date();
					var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
					var serverTime =  new Date(utc + (3600000* -7));
					// console.log('serverTime',serverTime);
					if(serverTime.getDate() == timeObj.getDate()){
						format_time = timeObj.format('g:i A');
					} else {
						var df = Math.abs((serverTime - timeObj));
						var df_days = df/(1000*60*60*24); 
						var df_hours = df/(1000*60*60); 
						if(df_days >= 1) {
							// format_time = parseInt(df_days);
							// format_time += ' days ago';
							format_time = timeObj.format('n/j/y g:i A');
						} else {
							format_time = parseInt(df_hours);
							format_time += ' hours ago';
						}
					}
					// var df_months;
					// df_months = (serverTime.getFullYear() - timeObj.getFullYear()) * 12;
					// df_months -= timeObj.getMonth();
					// df_months += serverTime.getMonth();
					// console.log('df_months',df_months);
					// if(df_months < 1){
						// var df_days =  Math.abs((serverTime - timeObj))/(1000*60*60*24); 
						// format_time = df_days;
					// } else {
						// format_time = df_months;
					// }
				} 
				// console.log('format_time',format_time);
				return format_time;
			}
		},
		{name: 'comment', type : 'string'},
		{name: 'image', type : 'string'},
	]
});


SimbaApp.models.Support = Ext.regModel('MobiiappSupport', {
	fields: [
		{name: 'id',type:'int'},
		{name: 'status',type:'string'},
		{name: 'subject',type:'string'},
		{name: 'detail',type:'string'},
		{name: 'solution',type:'string'},
		{name: 'comments',type:'string'},
		{name: 'history',type:'string'},
		{name: 'assign_to',type:'string'},
		{name: 'created_date',type:'string'},
		{name: 'created_by',type:'string'},
		{name: 'updated_date',type:'string'},
		{name: 'updated_by',type:'string'},
	]
});