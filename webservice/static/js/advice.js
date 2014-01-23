// TODO: highlight hands on hover to show that they're clickable;
// restrict user to one vote; change hand color once vote is cast;
function vote() {
    
    var action = $(this).attr('class');
    var type = '.' + action + 's';
    // cast vote
    var count = parseInt($(this).siblings(type).text());
    $(this).siblings(type).text(count+1);
    console.log(count);
    var asin = $(this).parent().siblings('.product').attr('alt');
    // call service to cast vote
    $.ajaxSetup({
    	async: false
    });
    if(asin != 'title' && action != 'dislike')
	var success = submit_recommendation(document.user,asin,document.share_id);
    $.ajaxSetup({
    	async: true
    });
    // update view regardless of DB - this is a demo!
    if(success || true){ 
	console.log('one more '+action);
	// update total
	var likes = parseInt($(this).siblings('.likes').text());
	console.log(likes);
	$(this).siblings('.likes').text(likes);
	var dislikes = parseInt($(this).siblings('.dislikes').text());
	console.log(dislikes);
	var newTotal = likes-dislikes;
	var tot = $(this).siblings("span:first-of-type");
	tot.text(newTotal);
	// make sure total is color coded
	if(newTotal == -1) tot.attr('class','negative');
	else if(newTotal == 0) tot.removeClass();
	else if(newTotal == 1) tot.attr('class','positive');
    }
}

// TODO: dynamically populate pinterest view with suggested ASINs and their votes
$(document).ready(function() {
    // configure tabs
    $(".tab_content").hide(); 
    $("ul.tabs li:first").addClass("active").show(); // Default to first tab
    $(".tab_content:first").show(); // Show the default tabs content
    $("ul.tabs li").click(function() {
	$("ul.tabs li").removeClass("active"); // Remove the active class
	$(this).addClass("active"); // Add the active tab to the selected tab
	$(".tab_content").hide(); // Hide all other tab content
	var activeTab = $(this).find("a").attr("href"); // Get the href's
	// attribute value
	// (class) and fade in
	// the corresponding
	// tabs content
	$(activeTab).fadeIn(); // Fade the tab in
	return false;
    });
    // load content
    $.ajaxSetup({
    	async: false
    	});
    load_content();
    $.ajaxSetup({
    	async: true
    	});
    // register vote handler
    $('.votes img').click(vote);
});

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for ( var i = 0; i < ca.length; i++) {
	var c = ca[i];
	while (c.charAt(0) == ' ')
	    c = c.substring(1, c.length);
	if (c.indexOf(nameEQ) == 0)
	    return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function add_user_row(users, image_url, username, userlocation) {
    var row = users.insertRow(2);
    row.id = username + "_data";
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML = "";
    cell2.className = "userimagerow";
    cell2.innerHTML = "<img src=\"" + image_url + "\"/>";
    cell2.style.width = "50px"
    cell3.innerHTML = "<div class=\"username\">" + username
	+ "</div><div class=\"userlocation\">" + userlocation
	+ "</div><table id=\"" + username + "_shares\"></table>";
    cell4.innerHTML = "";

    return username + "_shares";
}

function add_detail(username, asin) {
    $.getJSON('http://localhost:8080/user/' + username, function(userObj) {
	var users = document.getElementById("detail")
	user_row_id = add_user_row(users, userObj['imgurl'], userObj['uname'],
				   userObj['location']);
	add_share_detail(username, asin);
    });

}

function add_share_detail(username, asin) {
    $.getJSON('http://localhost:8080/product/' + asin, function(prodObj) {
	$.getJSON('http://localhost:8080/shares/get/' + username + '/' + asin,
		  function(shareObj) {
		      var shares = document.getElementById(username + "_shares");
		      add_asin_detail(shares, asin, prodObj['imgurl'],
				      prodObj['name'], shareObj['text'], prodObj['url'],
				      shareObj['rowid']);
		  });
    });

}

function add_asin_detail(shares, asin, image_url, prod_name, share_text, url,
			 share_id) {
    var row = shares.insertRow(0);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML = "";
    cell2.width = "50px";
    cell2.innerHTML = "<img src=\"" + image_url + "\" width=100px/>";
    cell3.style.verticalAlign = "top";

    // var votesText = "<div style=\"float: left; font-size: 10px;margin: 0px;
    // padding: 13px 10px;\">13 votes</div>"
    var btnText = "<a class = 'button' href=\"" + url
	+ "\" style=\"float: left\">Buy</a>";
    var wrapper = "<div class=\"buttonText\" >" + btnText + "</dev>";

    cell3.innerHTML = "<div class=\"buttonText\">" + prod_name
	+ "</div><div class=\"sharetext\">" + share_text + "</div>"
	+ wrapper;
    cell4.innerHTML = "";

    $.getJSON(

	'http://localhost:8080/rec/count/' + share_id, function(recoObj) {
	    recoObj.forEach(function(countOfAsin) {

		var recommended = document.getElementById("recommended");
		add_reco_item(recommended, countOfAsin['recommendedasin'],
			      countOfAsin['CNT'], share_id);

	    });
	});

}

function createPinWithVotes(prod, cnt, event_id) {
    var pin = $('<div class="pin"/>');
    // pic
    var prodImg = $('<img class="product"/>').attr('src',prod['imgurl']);
    prodImg.attr('alt',prod['asin']);
    pin.append(prodImg);
    // title
    // var title = $('<p class="title"/>').text(prod['name']);
    // pin.append(title);
    // votes
    var votes = $('<div class="votes"/>');
    votes.append($('<span class="positive"/>').text(parseInt(cnt,10)));
    votes.append($('<img class="like" src="/static/img/img_trans.gif" alt="like"/>'));
    votes.append($('<span class="likes"/>').text(parseInt(cnt,10)));
    votes.append($('<img class="dislike" src="/static/img/img_trans.gif" alt="dislike"/>'));
    votes.append($('<span class="dislikes"/>').text(0));
    pin.append(votes);
    return pin;
}

function addPinWithVotes(asin, prod, cnt, event_id) {
    var pin = createPinWithVotes(prod,cnt,event_id);
    var columns = $('#columns');
    columns.prepend(pin);
    console.log(pin);
}

//---------------------Dwai---------------------------------------------------
function submit_recommendation(user,fromasin,shareid){
    var result;
    $.getJSON(
        'http://localhost:8080/rec/add/' + user + "/" + fromasin + "/" + shareid, 
        function(data) {
            $.each(data, function(key, val) {
                if(val=='fail'){
                    console.log("You have already recommended this product");
                    result=false;
                }
                else{
                    console.log("You have successfully recommended this product");
                    result=true;
                }
            });
        }
    );
    return result;
}

function createSearchItemWithRecommendButton(asin,prod, share_id) {
    var pin = $('<div class="pin"/>');
    // pic
    var prodlink = $('<a  />').attr('href',prod['url']);
    var prodImg = $('<img width="160px" />').attr('src',prod['imgurl']);
    prodImg.attr('alt',prod['name']);
    prodlink.append(prodImg)
    pin.append(prodlink);
    var args = "\'"+document.user+"','"+asin+"','"+share_id+"'";
    var button = $('<div class="buttonText"/>');
    button.append($("<a class='button' style='float: left' href='#' onclick=\"submit_recommendation("+args+ ");return false;\">Recommend</a>"));
    pin.append(button);
    return pin;
}

function addSearchItems(share_id) {
    var asin_list = ['B00A4SQIJA',
	             'B000OZC4TG',
	             'B0072O5UXE',
	             'B00BB5VQCE',
	             'B00A29WCA0'];
    for (var i = 0; i < asin_list.length; i++) {
	recommendedasin = asin_list[i];
	$.getJSON(
	    'http://localhost:8080/product/' + recommendedasin,
	    function(prodObj) {
		var pin = createSearchItemWithRecommendButton(recommendedasin,prodObj,share_id);
		var columns = $('#search_cols');
		columns.prepend(pin);
		console.log(pin);
	    });
    }
}
//-----------------------Dwai---------------------------------------------------

function add_reco_item(recommended, recommendedasin, CNT, share_id) {
    $.getJSON(
	    'http://localhost:8080/product/' + recommendedasin,
	    function(prodObj) {

		// add pin
		addPinWithVotes(recommendedasin, prodObj, CNT, share_id);
		 
		//populating search tab
		//addSearchItems(recommendedasin, prodObj, CNT, share_id);    
		
		
		image_url = prodObj['imgurl'];
		prod_name = prodObj['name'];
		var separatorRow = recommended.insertRow(0);
		var cell1 = separatorRow.insertCell(0);
		cell1.innerHTML = "<br/>";

		var row = recommended.insertRow(0);
		// var cell1=row.insertCell(0);
		var cell2 = row.insertCell(0);
		var cell3 = row.insertCell(1);
		var cell4 = row.insertCell(2);
		// cell1.innerHTML="";
		cell2.width = "50px";
		cell2.innerHTML = "<img src=\"" + image_url
		    + "\" width=100px/>";
		cell3.style.verticalAlign = "top";

		var votesText = "<div class = 'votetext' >" + CNT
		    + " votes</div>";
		var btnText = "<a class='button' style=\"float: left\" href=\"rec.html?fromuser="
		    + document.user
		    + "&shareid="
		    + share_id
		    + "&fromasin="
		    + recommendedasin
		    + "&toasin="
		    + document.asin + "\">Recommend</a>";

		var wrapper = "<div class=\"buttonText\" >" + btnText
		    + "</div>";

		cell3.innerHTML = "<div class=\"product\">" + prod_name
		    + "</div>" + votesText + wrapper;
		cell4.innerHTML = "";

	    });

}

function load_content() {
    var QueryString = function() {
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for ( var i = 0; i < vars.length; i++) {
	    var pair = vars[i].split("=");
	    if (typeof query_string[pair[0]] === "undefined") {
		query_string[pair[0]] = pair[1];
	    } else if (typeof query_string[pair[0]] === "string") {
		var arr = [ query_string[pair[0]], pair[1] ];
		query_string[pair[0]] = arr;
	    } else {
		query_string[pair[0]].push(pair[1]);
	    }
	}
	return query_string;
    }();

    var asinname = unescape(QueryString.asinname);
    var asin = QueryString.asin;
    var user = QueryString.user;
    document.asin = asin;
    document.user = user;

    var header = document.getElementById("divHeader");
    //TODO: hardcoding the request parameters here for easy testing of page
    document.asin = 'B0072O5UXE';
    document.user = 'haines';
    document.share_id = '2';
    add_detail("cesar", "B0072O5UXE");
    //Adds all items in products table to the search and reco tab
    addSearchItems('2');

}