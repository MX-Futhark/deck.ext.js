/*!
Deck JS - deck.animator
Copyright (c) 2011-2015 Remi BARRAQUAND, Rémy DELANAUX, Maxime PIA
Dual licensed under the MIT license and GPL license.
https://github.com/imakewebthings/deck.js/blob/master/MIT-license.txt
https://github.com/imakewebthings/deck.js/blob/master/GPL-license.txt
*/

/*
This module provides a support for animated SVG to the deck so as to create 
animation like in most presentation solution e.g powerpoint, keynote, etc.
Slides can include elements which then can be animated using the Animator.
*/

(function($, deck, undefined) {
    var $d = $(document);
	hasChanged = false;
	
	$[deck]('extend', 'getCurrentSlideIndex', function() {
		var current = $[deck]('getSlide');
		var i = 0;
		for (; i < $[deck]('getSlides').length; i++) {
			if ($[deck]('getSlides')[i] == current) return i;
		}
		return -1;
    });
	   
    /*
        jQuery.deck('Init')
        */
    $d.bind('deck.init', function() {
        var keys = $[deck].defaults.keys;
        
        /* Bind key events */
        $d.unbind('keydown.deckanimator').bind('keydown.deckanimator', function(e) {
			var currentIndex = $[deck]('getCurrentSlideIndex');
			var nbSlides = $[deck]('getSlides').length;
            if (currentIndex === nbSlides -1 && !hasChanged && (e.which === keys.next || $.inArray(e.which, keys.next) > -1)) {
				console.log("next triggered");
                $d.trigger('deck.beforeChange', [currentIndex, currentIndex]);
            }
			if (currentIndex === 0 && !hasChanged && (e.which === keys.previous || $.inArray(e.which, keys.previous) > -1)) {
				console.log("prev triggered");
                $d.trigger('deck.beforeChange', [currentIndex, currentIndex]);
            }
			hasChanged = false;
        });
    })
    
	.bind('deck.beforeChange', function(e, from, to) {
		hasChanged = false;
		var $slide = $[deck]('getSlide', from);
		console.log('from = ' + from)
		console.log('to = ' + to)
		/*
		 * If the animations of the current slide are not complete,
		 * we keep on doing them and we don't go to the next slide.
		 */
		var animator = eval($slide.data('dahu-animator'));
		console.log("beforeChange : début");
		if ( animator !== undefined ) {
			console.log("animator detected");
			if( (from < to || (from === to && to === $[deck]('getSlides').length - 1)) && (! animator.isCompleted()) ) {
				console.log("beforeChange : on ne passe pas !");
				e.preventDefault();
				if ( animator.getCursor() == 0 ) {
					animator.restart();
				} else {
					animator.next();
				} 
			} else if ((from > to || (from === to && to === 0)) && animator.getCursor() !== 0) {
				console.log("go back from cursor " + animator.getCursor());
				e.preventDefault();
				animator.prev();
			}
		}
		console.log("beforeChange : fin");
	})
	
	.bind('deck.change', function(e, from, to) {
		hasChanged = true;
	});
	
		
})(jQuery, 'deck');