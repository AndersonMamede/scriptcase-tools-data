"use strict";

window.scriptReady = true;

var whyUninstall = {
	EXT_DOES_NOT_WORK : "Extension doesn't work",
	FEATURE_DO_NOT_WORK : "Some features don't work",
	NOT_USEFUL : "It's not useful",
	CONFUSING : "Hard to use/confusing",
	SECURITY_CONCERNS : "Security concerns",
	TEMPORARY : "Just temporary, I am planning to install it again soon",
	NONE : "None of the above"
}

TemplateEngine.init();

Renderer.init();

Data.init({
	database : "https://scriptcase-tools.firebaseio.com/uninstall-survey",
	parseSnapshot : function(snapshot){
		var data = [];
		snapshot.forEach(row => {
			var rowData = row.val();
			
			rowData.rowid = row.key();
			rowData.counter = Data.counter.up();
			rowData.prettyDate = Helper.getPrettyDate(rowData.date);
			rowData.operatingSystemName = Helper.getOperatingSystemName(rowData.userAgent);
			rowData.browserName = Helper.getBrowserName(rowData.userAgent);
			rowData.installId = rowData.installId || "-";
			rowData.feedback = rowData.feedback || "-";
			rowData.email = rowData.email || "-";
			
			if(rowData.why && rowData.why.length){
				var why = rowData.why;
				rowData.why = [];
				why.forEach(function(value){
					rowData.why.push(whyUninstall[value]);
				});
				rowData.why = rowData.why.join("; ");
			}else{
				rowData.why = "-";
			}
			
			data.push(rowData);
		});
		return data;
	}
});

Launch();