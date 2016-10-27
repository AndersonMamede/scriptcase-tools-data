var Helper = {
	ucFirst : function(text){
		return text.substr(0, 1).toUpperCase() + text.substr(1);
	},
	
	getBrowserName : function(userAgent){
		var browserInfo = (userAgent || "").toLowerCase().match(/(chrome|firefox)\/([0-9.]+)/);
		return browserInfo ? Helper.ucFirst(browserInfo[1] + " v" + browserInfo[2]) : "?";
	},
	
	strLeftPad : function(value, length, txt){
		var pad = Array(length).join(txt);
		return (pad + value).slice(length * -1);
	},
	
	getPrettyDate : function(timestamp){
		var date = new Date(timestamp);
		return [
				Helper.strLeftPad(date.getDate(), 2, "0"),
				Helper.strLeftPad(date.getMonth()+1, 2, "0"),
				date.getFullYear()
			].join("/") + " - " + [
				Helper.strLeftPad(date.getHours(), 2, "0"),
				Helper.strLeftPad(date.getMinutes(), 2, "0"),
				Helper.strLeftPad(date.getSeconds(), 2, "0")
			].join(":");
	},
	
	htmlEntities : function(str){
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	},
	
	nano : function(template, data, useFnHtmlEntities){
		useFnHtmlEntities = useFnHtmlEntities || true;
		return template.replace(/\{([\w\.]*)\}/g, function(str, key){
			var keys = key.split("."), v = data[keys.shift()];
			if (useFnHtmlEntities && v !== null && v !== "") v = Helper.htmlEntities(v);
			for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
			return (typeof v !== "undefined" && v !== null) ? v : "";
		});
	}
};

var TemplateEngine = new (function(){
	var _this = this;
	
	var templates = {
		item : null
	};
	
	_this.loadAll = function(callback){
		var _fnLoadAll = function(resolve, reject){
			var templatesToLoad = Object.keys(templates);
			templatesToLoad.forEach(function(name){
				$.get("template/" + name + ".html")
					.then(function(template){
						templates[name] = template;
						templatesToLoad.splice(templatesToLoad.indexOf(name), 1);
						if(!templatesToLoad.length){
							resolve();
						}
					}).fail(reject);
			});
		};
		
		return new Promise(_fnLoadAll);
	};
	
	_this.get = function(name){
		return templates[name];
	};
	
	return _this;
});

var Data = new (function(){
	var _this = this;
	
	var fb = new Firebase("https://scriptcase-tools.firebaseio.com/feedback");
	var lastIdInSnapshot = null;
	var counter = 0;
	
	var orderByDesc = function(data, key){
		return data.sort((a, b) => b[key] - a[key]);
	};
	
	var parseSnapshot = function(snapshot){
		var data = [];
		snapshot.forEach(row => {
			var rowData = row.val();
			rowData.counter = _this.counter.up();
			rowData.prettyDate = Helper.getPrettyDate(rowData.date);
			rowData.browserName = Helper.getBrowserName(rowData.userAgent);
			data.push(rowData);
			lastIdInSnapshot = row.key();
		});
		return data;
	};
	
	_this.counter = {
		get : () => counter,
		up : () => ++counter
	};
	
	_this.loadAll = function(){
		var _fnLoadAll = function(resolve, reject){
			fb.once("value",
				snapshot => resolve(orderByDesc(parseSnapshot(snapshot), "date")),
				error => reject
			);
		};
		
		return new Promise(_fnLoadAll);
	};
	
	_this.listenForNewData = function(callback){
		var query = fb.orderByKey();
		
		if(lastIdInSnapshot !== null){
			query = query.startAt(lastIdInSnapshot);
		}
		
		query.on("child_added", function(snapshot){
			if(snapshot.key() == lastIdInSnapshot){
				return;
			}
			
			lastIdInSnapshot = snapshot.key();
			callback(orderByDesc(parseSnapshot([snapshot]), "date"));
		});
	};
	
	return this;
});

var Renderer = new (function(){
	var _this = this;
	var $container = $("#feedback-list");
	
	_this.hideMessage = function(){
		$("#message").addClass("display-none");
	};
	
	_this.data = function(data, prepend){
		var content = [];
		
		if($container.hasClass("empty-data")){
			$container.removeClass("empty-data").empty();
		}
		
		data.forEach(item => {
			content.push(Helper.nano(TemplateEngine.get("item"), item));
		});
		
		_this.hideMessage();
		prepend ? $container.prepend(content) : $container.append(content);
	};
	
	_this.empty = function(){
		_this.hideMessage();
		$container.addClass("empty-data").html("<li>No data found.</li>");
	};
	
	return _this;
});

window.viewReady = true;
Promise.all([Data.loadAll(), TemplateEngine.loadAll()])
	.then(values => {
		if(values[0].length){
			Renderer.data(values[0]);
		}else{
			Renderer.empty();
		}
		
		Data.listenForNewData(data => {
			Renderer.data(data, true);
		});
	})
	.catch(error => {
		$("main").html("Error: " + (error.statusText || error));
	});