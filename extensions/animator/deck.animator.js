/*!
Deck JS - deck.animator
Copyright (c) 2011-2015 Remi BARRAQUAND, Rémy DELANAUX, Maxime PIA
Dual licensed under the MIT license and GPL license.
https://github.com/imakewebthings/deck.js/blob/master/MIT-license.txt
https://github.com/imakewebthings/deck.js/blob/master/GPL-license.txt
*/

/*
This module provides a support for animated elements to the deck so as to create 
animation like in most presentation solution e.g powerpoint, keynote, etc.
Slides can include elements which then can be animated using the Animator.
*/

(function($, deck, undefined) {
    var $d = $(document);
	// determine whether a actual change in slide number has occured before the next action
	slideChangeHappened = false;
	// determine whether the animators have finished initializing
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
	
	/*
		Init all animators.
		*/
	$[deck]('extend', 'initAnimators', function() {
		for(slideNb = 0; slideNb < $[deck]('getSlides').length; ++slideNb) {
			var $slide = $[deck]('getSlide', slideNb);
			var animatorJSON = eval($slide.data('dahu-animator'));
			
			if(!animatorJSON) continue;
			var animationsJSON = animatorJSON.actions;
			animations = new Array();
			for(animInd = 0; animInd < animationsJSON.length; ++animInd) {
				if(animationsJSON[animInd].type === "move") {
					animations.push(Animator.Move(animationsJSON[animInd]));
				} else if (animationsJSON[animInd].type === 'appear') {
					animations.push(Animator.Appear(animationsJSON[animInd]));
				} else if (animationsJSON[animInd].type === 'disappear') {
					animations.push(Animator.Disappear(animationsJSON[animInd]));
				}
			}
			$slide.data('slide-animator', new Animator(animatorJSON.target, animations));
		}
	});
	
	/*
		Call animation functions when necessary.
		*/
	function manageAnimations(e, from, to) {
		slideChangeHappened = false;

		/*
		 * If the animations of the current slide are not complete,
		 * we keep on doing them and we don't go to the next slide.
		 */
		var animator = $[deck]('getAnimator', from);
		if ( animator !== undefined && pageLoaded) {
			// ->
			if( (from === to-1 || (from === to && to === $[deck]('getSlides').length - 1)) && (! animator.isCompleted()) ) {
				e.preventDefault();
				if ( !animator.hasStarted() ) {
					animator.restart();
				} else {
					animator.next(true);
				} 
			// <-
			} else if ((from === to+1 || (from === to && to === 0)) && animator.hasStarted()) {
				e.preventDefault();
				animator.prev(true);
			}
		}
	}
	   
    /*
        jQuery.deck('Init')
        */
    $d.bind('deck.init', function() {
        var keys = $[deck].defaults.keys;
		
		// init all animators
		$[deck]('initAnimators');
		
        /* Bind key events */
        $d.unbind('keydown.deckanimator').bind('keydown.deckanimator', function(e) {
			var currentIndex = $[deck]('getCurrentSlideIndex');
			var nbSlides = $[deck]('getSlides').length;
            if (currentIndex === nbSlides -1 && !slideChangeHappened && (e.which === keys.next || $.inArray(e.which, keys.next) > -1)) {
                manageAnimations(e, currentIndex, currentIndex);
            }
			if (currentIndex === 0 && !slideChangeHappened && (e.which === keys.previous || $.inArray(e.which, keys.previous) > -1)) {
                manageAnimations(e, currentIndex, currentIndex);
            }
			slideChangeHappened = false;
        });
		
		// if there is no anchor, deck.change won't be triggered and the page has finished loading
		if(!window.location.hash){
			pageLoaded = true;
		}
    })
	.bind('deck.beforeChange', function(e, from, to) {
		manageAnimations(e, from, to);
	})
	
	.bind('deck.change', function(e, from, to) {
		slideChangeHappened = true;
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