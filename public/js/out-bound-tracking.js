//http://exisweb.net/link-tracking-universal-analytics
//Track outbounds
(function trackOutbounds() {

	var noop = function (){};

	var hitCallbackHandler = function(url,win) {
	    if (win.length > 0) {
	    	if (win === '_blank')
	    	{
	    		window.open(url, win);
	    		return noop;
	    	}
	    }

    	return function (){
    		window.location.href = url;
    	}
    };
    
	if (document.getElementsByTagName) {
		var el = document.getElementsByTagName('a');
		var getDomain = document.domain.split('.').reverse()[1] + '.' + document.domain.split('.').reverse()[0];
		
		// Look thru each a element
		for (var i=0; i < el.length;i++) {
		
			// Extract it's href attribute
			var href = (typeof(el[i].getAttribute('href')) == 'string' ) ? el[i].getAttribute('href') : '';
			
			// Query the href for the top level domain (xxxxx.com)
			var myDomain = href.match(getDomain);
			
			// If link is outbound and is not to this domain	
			if ((href.match(/^https?\:/i)  && !myDomain) || href.match(/^mailto\:/i)) {
			
				// Add an event to click
				el[i].addEventListener('click', function(e) {
					var url = this.getAttribute('href'), win = (typeof(this.getAttribute('target') == 'string')) ? this.getAttribute('target') : '';
							
					// Log even to Analytics, once done, go to the link
					ga('send', 'event', 'outbound', 'click', url,
						{'hitCallback': hitCallbackHandler(url,win)},
						{'nonInteraction': 1}
					);
					
					e.preventDefault();
				});
			}
		}
	}
})();