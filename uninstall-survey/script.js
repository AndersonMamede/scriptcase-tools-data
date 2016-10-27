$(document).ready(function(){
	var fn = {
		getInstallId : function(){
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
				installId : fn.getInstallId(),
				why : [],
				feedback : $.trim($("#feedback").val()),
				email : $.trim($("#email").val())
			};
			
			$(".question-why:checked").each(function(){
				data.why.push(this.value);
			});
			
			return data;
		},
		
		submit : function(){
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
		}
	};
	
	$("#btn-submit").click(fn.submit);
	
	$("#question-why-NONE").change(function(){
		$(".question-why").not(this).prop({
			checked : false,
			disabled : this.checked ? true : false
		});
	});
});