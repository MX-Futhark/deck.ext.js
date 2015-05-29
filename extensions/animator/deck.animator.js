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
		Returns the animator of the slide.
		The object is created if it hasn't been done yet.
		*/
	$[deck]('extend', 'getAnimator', function(slideNum) {
		var $slide = $[deck]('getSlide', slideNum);
		
		if($slide.data('slide-animator'))
			return $slide.data('slide-animator');
		
		var animatorJSON = eval($slide.data('dahu-animator'));
		
		if(!animatorJSON)
			return undefined;
		
		var animationsJSON = animatorJSON.actions;
		animations = new Array();
		animationsJSON.forEach( function(a){
			console.log(a.type);
            if(a.type === "move") {
				animations.push(Animator.Move(a.target, parseInt(a.trX), parseInt(a.trY), parseInt(a.duration)));
			} else if (a.type === 'appear') {
				animations.push(Animator.Appear(a.target, parseInt(a.duration)));
			} else if (a.type === 'disappear') {
				animations.push(Animator.Disappear(a.target, parseInt(a.duration)));
			}
        });
		console.log(animations);
		console.log("target = " + animatorJSON.targetSlide);
		$slide.data('slide-animator', new Animator(animatorJSON.targetSlide, animations));
		return $slide.data('slide-animator');
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
		
		console.log('from = ' + from)
		console.log('to = ' + to)
		/*
		 * If the animations of the current slide are not complete,
		 * we keep on doing them and we don't go to the next slide.
		 */
		var animator = $[deck]('getAnimator', from);
		console.log(animator);
		if ( animator !== undefined ) {
			// on the case the animation hasn't yet been initialized
			// for example, when the presentation hasn't been loaded from the first slide
			var toAnimator = $[deck]('getAnimator', to);
			if(toAnimator !== undefined && from > to && !toAnimator.isCompleted()) {
				toAnimator.startFromTheEnd();
			}
			if( (from === to-1 || (from === to && to === $[deck]('getSlides').length - 1)) && (! animator.isCompleted()) ) {
				e.preventDefault();
				if ( animator.getCursor() == 0 ) {
					animator.restart();
				} else {
					animator.next();
				} 
			} else if ((from === to+1 || (from === to && to === 0)) && animator.getCursor() !== 0) {
				e.preventDefault();
				animator.prev();
			}
		}
	})
	
	.bind('deck.change', function(e, from, to) {
		hasChanged = true;
	});
	
		
})(jQuery, 'deck');