"use strict";

window.scriptReady = true;

var counter = {
	total : 0,
	browser : { chrome : 0, firefox : 0, other : 0 },
	operatingSystem : {},
	sctVersion : {},
	language : {}
};

var $summary = $(".content-summary");

var $counter = {
	total : $summary.find(".counter-total"),
	browser : {
		chrome : $summary.find(".counter-browser-chrome"),
		firefox : $summary.find(".counter-browser-firefox"),
		other : $summary.find(".counter-browser-other")
	},
	operatingSystem : $(".counter-operating-system"),
	sctVersion : $(".counter-sct-version"),
	language : $(".counter-language")
};

TemplateEngine.init();

Renderer.init();

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
			
			counter.total++;
			if(browserName.indexOf("Chrome") != -1){
				counter.browser.chrome++;
			}else if(browserName.indexOf("Firefox") != -1){
				counter.browser.firefox++;
			}else{
				counter.browser.other++;
			}
			
			if(typeof counter.operatingSystem[rowData.operatingSystemName] == "undefined"){
				counter.operatingSystem[rowData.operatingSystemName] = 0;
			}
			counter.operatingSystem[rowData.operatingSystemName]++;
			
			if(typeof counter.sctVersion[rowData.sctVersion] == "undefined"){
				counter.sctVersion[rowData.sctVersion] = 0;
			}
			counter.sctVersion[rowData.sctVersion]++;
			
			if(typeof counter.language[rowData.language] == "undefined"){
				counter.language[rowData.language] = 0;
			}
			counter.language[rowData.language]++;
			
			data.push(rowData);
		});
		
		$counter.total.text(counter.total);
		$counter.browser.chrome.text(counter.browser.chrome);
		$counter.browser.firefox.text(counter.browser.firefox);
		$counter.browser.other.text(counter.browser.other);
		
		(function createDynamicOrderedOperatingSystemSummary(){
			$counter.operatingSystem.empty();
			
			var operatingSystemList = Object.keys(counter.operatingSystem).sort(function orderDesc(a, b){
				return counter.operatingSystem[b] - counter.operatingSystem[a];
			});
			
			var content =  [];
			for(var x = 0; x < operatingSystemList.length; x++){
				var name = operatingSystemList[x];
				var count = counter.operatingSystem[name] || 0;
				content.push("<b>" + name + ":</b> <span> " + count + "</span>");
			}
			$counter.operatingSystem.append(content.join("&nbsp;&diams;&nbsp;"));
		})();
		
		(function createDynamicOrderedSctVersionSummary(){
			$counter.sctVersion.empty();
			
			var sctVersionList = Object.keys(counter.sctVersion).sort(function orderDesc(a, b){
				return counter.sctVersion[b] - counter.sctVersion[a];
			});
			
			var content =  [];
			for(var x = 0; x < sctVersionList.length; x++){
				var name = sctVersionList[x];
				var count = counter.sctVersion[name] || 0;
				content.push("<b>SCT v" + name + ":</b> <span> " + count + "</span>");
			}
			$counter.sctVersion.append(content.join("&nbsp;&diams;&nbsp;"));
		})();
		
		(function createDynamicOrderedLanguageSummary(){
			$counter.language.empty();
			
			var languageList = Object.keys(counter.language).sort(function orderDesc(a, b){
				return counter.language[b] - counter.language[a];
			});
			
			var content =  [];
			for(var x = 0; x < languageList.length; x++){
				var name = languageList[x];
				var count = counter.language[name] || 0;
				content.push("<b>" + name + ":</b> <span> " + count + "</span>");
			}
			$counter.language.append(content.join("&nbsp;&diams;&nbsp;"));
		})();
		
		return data;
	}
});

Launch();