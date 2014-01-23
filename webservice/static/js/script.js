$(document).ready(function() {

    $(".tab_content").hide(); 
    $("ul.tabs li:first").addClass("active").show(); // Default to first tab
    $(".tab_content:first").show(); // Show the default tabs content

    // When the user clicks on the tab
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

function add_reco_item(recommended, recommendedasin, CNT, share_id) {
    $.getJSON(
	    'http://localhost:8080/product/' + recommendedasin,
	    function(prodObj) {

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

function after_load(args) {
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
    add_detail("cesar", "B0072O5UXE");

}