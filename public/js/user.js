var settings = {
	pageLength : 50
}

var PG = new $P({
	default: {
		s : 0,
		l : 50,
		v : 'visible'
	},
	bind: function(){
		this.bindhash();
		
	}
});

/* 
* console commons function
*/
var USR = $.extend(new $M(), {
		
		// delete user	
	   	onDelUserBtn : function (){
	       	$.ask("删除用户","是否确认删除选中的用户？", function(){
				var users = $.map(USR.getSelectData('#userListTb'), function(user, idx){
					return user.name;
				});
				
				$.post('/users/d', {D:users},
					function(data){
						if(data.R === 'Y'){
							USR.load();
						}else
							$.alert('#serviceCtlBar', '删除用户出错：'+data.M);
					});
			});
	   	},

	   	onNewUserBtn: function(){
			$('#userForm').data('state','create').clearall();
			$('#userForm').find("#name").attr('readonly',false);
			$('#userDlg').modal();
			//valide.resetForm();
	   	},


	   	onSaveUserBtn: function(){
	   		var valide = $('#userForm').validate();
			if(valide.form()){
				$.post('/users/u', $('#userForm').serialize(),
					function(data){
						$('#userDlg').modal('hide');
						if(data.R === 'Y'){
							USR.load();
						}else
							$.alert('#serviceCtlBar', '保存用户出错：'+data.M);
					});	
			}
	   	},

	   	onUpdateUserBtn : function (){
	   		USR.getline('#userListTb', function(user){
				$('#userForm').data('state','update')
					.clearall().autofill(user);
				$('#userForm').find("#name").attr('readonly',true);
				$('#userDlg').modal();		
	   		});
	   	},

	   	// load user with given page
	   	load : function (page, query){

			if(!PG.state.s && !PG.state.l){
				PG.pushState({s:0, l:50});
				return;
			}
			$('#searchTxt').val(PG.state.k);
            $('#userListTb').spin();
			var that =  this;
	        $.get('users',
            	PG.state,
        		function(data) {
        			if(data.R === 'N'){
	    				$('#userListTb').spin(false);
	    				return $.alert('#serviceCtlBar', "查询失败:" + data.M);
	    			}
	                var trs = that.lines(data.M.items, that._userline);
	                
	                $('#userListTb').empty().append(trs);
	                $('#userListTb').spin(false);
	                $('#cellPageCtl').pagectl(data.M.count, settings.pageLength, PG.state.s, function(start){
	                	PG.state.s = start;
	                	PG.state.l = settings.pageLength;
	                	PG.pushState();
	                });
            });
	   },


	bind : function(){
		$(PG).on('statechange', $.switchcontext(this, this.load));

		$('#userListTb thead a').tooltip();
		$('#searchTxt').keypress(function(e){
			if ( event.which == 13 ) {
			    PG.state.k = $(this).val();
			    PG.state.s = 0;
				PG.pushState();
		   	};
		});

		$('#delUserBtn').click(USR.onDelUserBtn);
		$('#createUserBtn').click(USR.onNewUserBtn);
		$('#updateUserBtn').click(USR.onUpdateUserBtn);
		$('#saveUserBtn').click(USR.onSaveUserBtn);
		$('#userForm').validate();
	},

    _userline: function(user){
	    var tr = '<tr class="gradeX even"><td><input type="checkbox" value=' + user.name + '  /></td>';
            tr += '<td>' + user.name + '</td>';
            tr += '<td>' + user.role + '</td>';
            tr += '<td>' + user.realname + '</td>';
            tr += '<td>' + user.dept + '</td>';
            tr += '<td>' + user.tel + '</td></tr>';
	    return tr;
	}

});
	
function init(){
	USR.bind();
	PG.bind();
	$(window).trigger('hashchange');
}
$(document).ready(init);