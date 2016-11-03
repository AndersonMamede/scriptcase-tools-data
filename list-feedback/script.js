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
			rowData.operatingSystemName = Helper.getOperatingSystemName(rowData.userAgent);
			rowData.browserName = Helper.getBrowserName(rowData.userAgent);
			rowData.answer = rowData.answer || "";
			rowData.done = rowData.done || false;
			rowData.rejected = rowData.rejected || false;
			
			rowData.title = "";
			if(rowData.done){
				rowData.title = "Item #" + rowData.counter + " - Status: DONE";
			}else if(rowData.rejected){
				rowData.title = "Item #" + rowData.counter + " - Status: REJECTED";
			}
			
			data.push(rowData);
		});
		return data;
	}
});

Launch();