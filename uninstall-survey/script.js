$(document).ready(function(){
	var params = {};
	
	try{
		params = JSON.parse(window.location.hash.substr(1));
	}catch(ex){}
	
	var fn = {
		getInstallId : function(){
			window.location.hash.substr(1)
			return window.location.href.split("#")[1] || "";
		},
		
		validateForm : function(){
			if(!$(".question-why:checked").length){
				alert("Please inform why you are uninstalling this extension.");
				return;
			}
			
			return true;
		},
		
		getData : function(){
			var data = {
				userAgent : window.navigator.userAgent,
				language : window.navigator.language,
				date : {".sv" : "timestamp"},
				installId : params.installId,
				sctVersion : params.sctVersion,
				why : [],
				feedback : $.trim($("#feedback").val()),
				email : $.trim($("#email").val())
			};
			
			$(".question-why:checked").each(function(){
				data.why.push(this.value);
			});
			
			return data;
		},
		
		submitSurvey : function(){
			if(!fn.validateForm()){
				return;
			}
			
			fetch("https://scriptcase-tools.firebaseio.com/uninstall-survey.json", {
				method : "POST",
				body : JSON.stringify(fn.getData())
			}).then(function(response){
				if(response.status != 200){
					alert("Error while sending data. Please try again.");
					return;
				}
				
				window.location.href = "done.html";
			});
		},
		
		sendAccessInfo : function(){
			var data = fn.getData();
			fetch("https://scriptcase-tools.firebaseio.com/uninstall-survey-access.json", {
				method : "POST",
				body : JSON.stringify({
					userAgent : data.userAgent,
					language : data.language,
					date : data.date,
					installId : data.installId,
					sctVersion : data.sctVersion
				})
			});
		}
	};
	
	$("#btn-submit").click(fn.submitSurvey);
	
	$("#question-why-NONE").change(function(){
		$(".question-why").not(this).prop({
			checked : false,
			disabled : this.checked ? true : false
		});
	});
	
	fn.sendAccessInfo();
});