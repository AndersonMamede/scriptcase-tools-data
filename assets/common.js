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
	
	_this.focusListItem = function($element){
		if(!$element || !$element.length){
			return;
		}
		
		// temporarily change the element id, otherwise the hash change would
		// cause the browser to jump to the element's position
		var itemId = $element.prop("id");
		$element.prop("id", itemId + "-temp");
		window.location.href = "#" + itemId;
		$element.prop("id", itemId);
		
		$("body").animate({
			scrollTop: $element.offset().top
		}, 500);
	};
	
	_this.ucFirst = function(text){
		return text.substr(0, 1).toUpperCase() + text.substr(1);
	},
	
	_this.getOperatingSystemName = function(userAgent){
		var operatingSystemName = "Unknown O.S.";
		
		if(userAgent.indexOf("Windows NT 10.0") != -1) operatingSystemName = "Windows 10 / Windows Server 2016";
		if(userAgent.indexOf("Windows NT 6.3") != -1)  operatingSystemName = "Windows 8.1 / Windows Server 2012 R2";
		if(userAgent.indexOf("Windows NT 6.2") != -1)  operatingSystemName = "Windows 8";
		if(userAgent.indexOf("Windows NT 6.1") != -1)  operatingSystemName = "Windows 7";
		if(userAgent.indexOf("Windows NT 6.0") != -1)  operatingSystemName = "Windows Vista";
		if(userAgent.indexOf("Windows NT 5.1") != -1)  operatingSystemName = "Windows XP";
		if(userAgent.indexOf("Windows NT 5.0") != -1)  operatingSystemName = "Windows 2000";
		if(userAgent.indexOf("Mac") != -1)             operatingSystemName = "Mac/iOS";
		if(userAgent.indexOf("X11") != -1)             operatingSystemName = "UNIX";
		if(userAgent.indexOf("Linux") != -1)           operatingSystemName = "Linux";
		
		return operatingSystemName;
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
	
	var bindEvents = function(){
		settings.$container.on("click", ".content-list-item-counter", function(evt){
			evt.preventDefault();
			var itemId = $(this).closest(".content-list-item").prop("id");
			Helper.focusListItem($("#" + itemId));
			return false;
		});
	};
	
	_this.init = function(_settings){
		settings = Helper.extend(settings, _settings);
		bindEvents();
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
			
			if(window.location.hash != ""){
				Helper.focusListItem($("#" + window.location.hash.substr(1)));
			}
		})
		.catch(error => {
			$("main").html("Error: " + (error.statusText || error));
		});
};

try{
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
	ga('create', 'UA-79876137-1', 'auto');
	ga('send', 'pageview');
}catch(ex){}