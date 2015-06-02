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
	// determines whether a actuel change in slide number has occured before the next action
	hasChanged = false;
	// determines whether the animators have finished initializing
	pageLoaded = false;
	
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
		*/
	$[deck]('extend', 'getAnimator', function(slideNum) {
		var $slide = $[deck]('getSlide', slideNum);
		return $slide.data('slide-animator');
	});
	
	$[deck]('extend', 'convertAnimatorJSON', function(animatorJSON) {
		var animationsJSON = animatorJSON.actions;
		animations = new Array();
		animationsJSON.forEach( function(a){
			if(a.type === "move") {
				animations.push(Animator.Move(a.target, parseInt(a.trX), parseInt(a.trY), parseInt(a.duration)));
			} else if (a.type === 'appear') {
				animations.push(Animator.Appear(a.target, parseInt(a.duration)));
			} else if (a.type === 'disappear') {
				animations.push(Animator.Disappear(a.target, parseInt(a.duration)));
			}
		});
		return new Animator(animatorJSON.target, animations)
	});
	   
    /*
        jQuery.deck('Init')
        */
    $d.bind('deck.init', function() {
        var keys = $[deck].defaults.keys;
		
		// init all animators
		for(slideNb = 0; slideNb < $[deck]('getSlides').length; ++slideNb) {
			var $slide = $[deck]('getSlide', slideNb);
			var animatorJSON = eval($slide.data('dahu-animator'));
			
			if(!animatorJSON) continue;
			
			$slide.data('slide-animator', $[deck]('convertAnimatorJSON', animatorJSON));
		}
        
        /* Bind key events */
        $d.unbind('keydown.deckanimator').bind('keydown.deckanimator', function(e) {
			var currentIndex = $[deck]('getCurrentSlideIndex');
			var nbSlides = $[deck]('getSlides').length;
            if (currentIndex === nbSlides -1 && !hasChanged && (e.which === keys.next || $.inArray(e.which, keys.next) > -1)) {
                $d.trigger('deck.beforeChange', [currentIndex, currentIndex]);
            }
			if (currentIndex === 0 && !hasChanged && (e.which === keys.previous || $.inArray(e.which, keys.previous) > -1)) {
                $d.trigger('deck.beforeChange', [currentIndex, currentIndex]);
            }
			hasChanged = false;
        });
    })
    
	.bind('deck.beforeChange', function(e, from, to) {
		hasChanged = false;

		/*
		 * If the animations of the current slide are not complete,
		 * we keep on doing them and we don't go to the next slide.
		 */
		var animator = $[deck]('getAnimator', from);
		if ( animator !== undefined ) {
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
		// when the presentation hasn't been loaded from the first slide,
		// the previous animations are set to their final states
		if(!pageLoaded) {
			for(slideNb = 0; slideNb < to; ++slideNb) {
				var prevAnimator = $[deck]('getAnimator', slideNb);
				if(prevAnimator !== undefined) {
					prevAnimator.startFromTheEnd();
				}
			}
		}
		pageLoaded = true;
	});
	
		
})(jQuery, 'deck');