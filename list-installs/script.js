"use strict";

window.scriptReady = true;

TemplateEngine.init();

Renderer.init();

var counterChrome = 0, counterFirefox = 0, counterOther = 0, counterTotal = 0;
var $summary = $(".content-summary");
var $counterChrome = $summary.find(".counter-chrome");
var $counterFirefox = $summary.find(".counter-firefox");
var $counterOther = $summary.find(".counter-other");
var $counterTotal = $summary.find(".counter-total");

Data.init({
	database : "https://scriptcase-tools.firebaseio.com/installs",
	parseSnapshot : function(snapshot){
		var data = [];
		snapshot.forEach(row => {
			var rowData = row.val();
			var browserName = Helper.getBrowserName(rowData.userAgent);
			
			rowData.counter = Data.counter.up();
			rowData.prettyDate = Helper.getPrettyDate(rowData.date);
			rowData.operatingSystemName = Helper.getOperatingSystemName(rowData.userAgent);
			rowData.browserName = browserName;
			rowData.installId = row.key();
			
			if(browserName.indexOf("Chrome") != -1){
				$counterChrome.text(++counterChrome);
			}else if(browserName.indexOf("Firefox") != -1){
				$counterFirefox.text(++counterFirefox);
			}else{
				$counterOther.text(++counterOther);
			}
			
			$counterTotal.text(++counterTotal);
			
			data.push(rowData);
		});
		return data;
	}
});

Launch();