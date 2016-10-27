"use strict";

window.scriptReady = true;

TemplateEngine.init();

Renderer.init();

Data.init({
	database : "https://scriptcase-tools.firebaseio.com/feedback",
	parseSnapshot : function(snapshot){
		var data = [];
		snapshot.forEach(row => {
			var rowData = row.val();
			
			rowData.counter = Data.counter.up();
			rowData.prettyDate = Helper.getPrettyDate(rowData.date);
			rowData.browserName = Helper.getBrowserName(rowData.userAgent);
			
			data.push(rowData);
		});
		return data;
	}
});

Launch();