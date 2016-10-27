"use strict";

window.Helper = new (function(){
	var _this = this;
	
	_this.extend = function(){
		var rs = {};
		
		var args = Array.prototype.slice.call(arguments);
		args.sort();
		
		args.forEach(function(obj){
			for(var key in obj){
				rs[key] = obj[key];
			}
		});
		
		return rs;
	};
	
	_this.ucFirst = function(text){
		return text.substr(0, 1).toUpperCase() + text.substr(1);
	},
	
	_this.getBrowserName = function(userAgent){
		var browserInfo = (userAgent || "").toLowerCase().match(/(chrome|firefox)\/([0-9.]+)/);
		return browserInfo ? Helper.ucFirst(browserInfo[1] + " v" + browserInfo[2]) : "?";
	},
	
	_this.strLeftPad = function(value, length, txt){
		var pad = Array(length).join(txt);
		return (pad + value).slice(length * -1);
	},
	
	_this.getPrettyDate = function(timestamp){
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
	
	_this.orderByDesc = function(data, key){
		return data.sort((a, b) => b[key] - a[key]);
	},
	
	_this.htmlEntities = function(str){
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	},
	
	_this.nano = function(template, data, useFnHtmlEntities){
		useFnHtmlEntities = useFnHtmlEntities || true;
		return template.replace(/\{([\w\.]*)\}/g, function(str, key){
			var keys = key.split("."), v = data[keys.shift()];
			if (useFnHtmlEntities && v !== null && v !== "") v = Helper.htmlEntities(v);
			for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
			return (typeof v !== "undefined" && v !== null) ? v : "";
		});
	}
	
	return _this;
});

window.TemplateEngine = new (function(){
	var _this = this;
	
	var templates = {};
	
	var settings = {
		templates : ["item"]
	};
	
	_this.init = function(_settings){
		settings = Helper.extend(settings, _settings);
	};
	
	_this.loadAll = function(callback){
		var _fnLoadAll = function(resolve, reject){
			settings.templates.forEach(function(name){
				$.get("template/" + name + ".html")
					.then(function(template){
						templates[name] = template;
						settings.templates.splice(settings.templates.indexOf(name), 1);
						if(!settings.templates.length){
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

window.Renderer = new (function(){
	var _this = this;
	
	var settings = {
		$container : $(".content-list"),
		itemTemplateName : "item"
	};
	
	_this.init = function(_settings){
		settings = Helper.extend(settings, _settings);
	};
	
	_this.hideMessage = function(){
		$(".status-message").addClass("display-none");
	};
	
	_this.data = function(data, prepend){
		var content = [];
		
		if(settings.$container.hasClass("empty-data")){
			settings.$container.removeClass("empty-data").empty();
		}
		
		data.forEach(item => {
			content.push(Helper.nano(TemplateEngine.get(settings.itemTemplateName), item));
		});
		
		_this.hideMessage();
		prepend ? settings.$container.prepend(content) : settings.$container.append(content);
	};
	
	_this.empty = function(){
		_this.hideMessage();
		settings.$container.addClass("empty-data").html("<li>No data to show.</li>");
	};
	
	return _this;
});

window.Data = new (function(){
	var _this = this;
	
	var fb = null;
	var lastIdInSnapshot = null;
	var counter = 0;
	
	var settings = {
		database : null,
		orderBy : "date",
		parseSnapshot : function(snapshot){}
	};
	
	_this.init = function(_settings){
		settings = Helper.extend(settings, _settings);
		fb = new Firebase(_settings.database);
	};
	
	_this.counter = {
		get : () => counter,
		up : () => ++counter
	};
	
	_this.loadAll = function(){
		var _fnLoadAll = function(resolve, reject){
			fb.once("value",
				snapshot => resolve(Helper.orderByDesc((function(snapshot){
					snapshot.forEach(row => {
						lastIdInSnapshot = row.key();
					});
					
					return settings.parseSnapshot(snapshot);
				})(snapshot), settings.orderBy)),
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
			callback(Helper.orderByDesc(settings.parseSnapshot([snapshot]), settings.orderBy));
		});
	};
	
	return _this;
});

window.Launch = function(){
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
};