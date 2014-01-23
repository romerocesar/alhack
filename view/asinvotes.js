// TODO: highlight hands on hover to show that they're clickable;
// restrict user to one vote; change hand color once vote is cast;
function vote() {
    var action = $(this).attr('class');
    var type = '.' + action + 's';
    // cast vote
    var count = parseInt($(this).siblings(type).text());
    $(this).siblings(type).text(count + 1);
    // TODO: call service to cast vote
    console.log('one more '+action);
    // update total
    var likes = parseInt($(this).siblings('.likes').text());
    var dislikes = parseInt($(this).siblings('.dislikes').text());
    var newTotal = likes-dislikes;
    var tot = $(this).siblings("span:first-of-type");
    tot.text(newTotal);
    // make sure total is color coded
    if(newTotal == -1) tot.attr('class','negative');
    else if(newTotal == 0) tot.removeClass();
    else if(newTotal == 1) tot.attr('class','positive');
}

// TODO: dynamically populate view with suggested ASINs and their votes
$(document).ready(function() {
    $('.votes img').click(vote);
});