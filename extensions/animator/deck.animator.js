/*!
Deck JS - deck.animator
Copyright (c) 2011-2015 Remi BARRAQUAND, Rémy DELANAUX, Maxime PIA
Dual licensed under the MIT license and GPL license.
https://github.com/imakewebthings/deck.js/blob/master/MIT-license.txt
https://github.com/imakewebthings/deck.js/blob/master/GPL-license.txt
*/

/**
 * This module provides a support for animated elements to the deck so as to create 
 * animation like in most presentation solution e.g powerpoint, keynote, etc.
 * Slides can include elements which then can be animated using the Animator.
 */

(function($, deck, undefined) {
    var $d = $(document);

    // determine whether a actual change in slide number has occured before the next action
    slideChangeHappened = false;
    // determine whether the animators have finished initializing
    pageLoaded = false;
    // determine whether the slides play automtically
    autoplayEnabled = false;
    
    function hasAnimations(animator) {
        return !(animator === undefined || animator.isCompleted());
    }
    
    $.extend(true, $[deck].defaults, {
        keys: {
            autoplay: 65 // a
        }
    });
    
    /**
     * Gets the index of the current slide
     */
    $[deck]('extend', 'getCurrentSlideIndex', function() {
        var current = $[deck]('getSlide');
        var i = 0;
        for (; i < $[deck]('getSlides').length; i++) {
            if ($[deck]('getSlides')[i] == current) return i;
        }
        return -1;
    });
    
    /**
     * Returns the animator of the slide.
     */
    $[deck]('extend', 'getAnimator', function(slideNum) {
        var $slide = $[deck]('getSlide', slideNum);
        if(!$slide) return undefined;
        return $slide.data('slide-animator');
    });
    
    /**
     * Init all animators.
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
    
    /**
     * Automatically plays the next step of the presentation
     */
    function autoplayNext(e) {
        var currentIndex = $[deck]('getCurrentSlideIndex');
        var animator = $[deck]('getAnimator', currentIndex);
<<<<<<< HEAD
        manageAnimations(e, currentIndex, currentIndex+1);
        if(!hasAnimations(animator)) {
=======
        if(animator === undefined || animator.isCompleted()) {
>>>>>>> 10dbaa2... Add delay before auto-next when no animator detected in current slide
            $[deck]('next');
            if($[deck]('getSlides').length > currentIndex+1) {
                $[deck]('getSlide', currentIndex+1).delay(2000).queue(function(next){
                    $[deck]('next');
                    var newCurrentIndex = $[deck]('getCurrentSlideIndex');
                    manageAnimations(e, newCurrentIndex, newCurrentIndex+1);
                });
            }
        } else {
            manageAnimations(e, currentIndex, currentIndex+1);
            if(animator !== undefined && animator.isCompleted()) {
                $[deck]('next');
                manageAnimations(e, currentIndex+1, currentIndex+2);
            }
        }
    }
    
    /**
     * Call animation functions when necessary.
     */
    function manageAnimations(e, from, to) {
        slideChangeHappened = false;

        // If the animations of the current slide are not complete,
        // we keep on doing them and we don't go to the next slide.
        var animator = $[deck]('getAnimator', from);
        if (animator !== undefined && pageLoaded) {
            // ->
            if( (from === to-1 || (from === to && to === $[deck]('getSlides').length - 1)) && (! animator.isCompleted()) ) {
                // the function has been called from beforeChange
                if(e !== undefined) {
                    e.preventDefault();
                }
                if ( !animator.hasStarted() ) {
                    animator.restart();
                } else {
                    animator.next(true);
                } 
            // <-
            } else if ((from === to+1 || (from === to && to === 0)) && animator.hasStarted()) {
                if(e !== undefined) {
                    e.preventDefault();
                }
                animator.prev(true);
            }
        }
    }
       
    /**
     * jQuery.deck('Init')
     */
    $d.bind('deck.init', function() {
        var keys = $[deck].defaults.keys;
        
        // init all animators
        $[deck]('initAnimators');
        
        // Bind key events
        $d.unbind('keydown.deckanimator').bind('keydown.deckanimator', function(e) {
            var currentIndex = $[deck]('getCurrentSlideIndex');
            var nbSlides = $[deck]('getSlides').length;
            if(e.which === keys.autoplay) {
                if(!autoplayEnabled) {
                    autoplayEnabled = true;
                    autoplayNext();
                } else {
                    autoplayEnabled = false;
                }
            } else {
                if (currentIndex === nbSlides -1 && !slideChangeHappened && (e.which === keys.next || $.inArray(e.which, keys.next) > -1)) {
                    autoplayEnabled = false;
                    manageAnimations(undefined, currentIndex, currentIndex);
                }
                if (currentIndex === 0 && !slideChangeHappened && (e.which === keys.previous || $.inArray(e.which, keys.previous) > -1)) {
                    autoplayEnabled = false;
                    manageAnimations(undefined, currentIndex, currentIndex);
                }
                slideChangeHappened = false;
            }
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
                if(hasAnimations(prevAnimator)) {
                    prevAnimator.startFromTheEnd();
                }
            }
        }
        pageLoaded = true;
        
        if(autoplayEnabled) {
            // if the current slide has no animator / an empty animator, 
            // wait 2s before goind to the next slide
            var animator = $[deck]('getAnimator', from);
            if(!hasAnimations(animator)) {
                $[deck]('getSlide', from).delay(2000).queue(function(next){
                    // if autoplay is still enabled at the time the callback is called, 
                    // actually go to the next slide
                    if(autoplayEnabled) {
                        var newCurrentIndex = $[deck]('getCurrentSlideIndex');
                        $[deck]('next');
                        manageAnimations(undefined, from, from+1);
                    }
                });
            }
        }
    })
    .bind('deck.animator.sequence.stop', function(e, options) {
        if(autoplayEnabled) {
            autoplayNext(e);
        }
    });
    
        
})(jQuery, 'deck');