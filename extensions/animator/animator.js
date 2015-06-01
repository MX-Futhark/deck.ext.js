function Animator(target, animations) {

    TriggerEnum = {
        ONCHANGE: "onChange",
        WITHPREVIOUS: "withPrevious",
        AFTERPREVIOUS: "afterPrevious"
    }
    
    var anims,  // list of all animations
    cursor,     // pointer to the current animation
    
    events = {
        /**
         * This event fires whenever the current animation is has nothing left 
         * to start playing.
         * The callback function is passed two parameters, target, equal to 
         * the target on which the animation completed, and reverse, 
         * true if the animation has been completed in reverse order
         *
         * example : 
         * $(document).bind('deck.animator.completed', function(target, reverse) {
         *   alert('The animation of '+target+' has just completed.');
         * });
         */
        completed: 'deck.animator.completed',
        
        /**
         * This event fires whenever a sequence of animations is performed. 
         * The callback function is passed three parameters, target, id and reverse, 
         * equal to the target on which the animation is performed, the id of
         * the animation, and a boolean equal to true if the animation has been 
         * performed in reverse order
         */
        sequenceStart: 'deck.animator.sequence.start',
        
        /**
         * This event fires whenever a sequence of animations has finished performing. 
         * The callback function is passed three parameters, target, id and reverse, 
         * equal to the target on which the animation is performed, the id of
         * the animation, and a boolean equal to true if the animation has been 
         * performed in reverse order
         */
        sequenceStop: 'deck.animator.sequence.stop',
        
        /**
         * This event fires whenever a single action is performed. 
         * The callback function is passed three parameters, target, id and reverse, 
         * equal to the target on which the animation is performed, the id of
         * the animation, and a boolean equal to true if the animation has been 
         * performed in reverse order
         */
        actionStart: 'deck.animator.action.start',
        
        /**
         * This event fires whenever a single action has finished performing. 
         * The callback function is passed three parameters, target, id and reverse, 
         * equal to the target on which the animation is performed, the id of
         * the animation, and a boolean equal to true if the animation has been 
         * performed in reverse order
         */
        actionStop: 'deck.animator.action.stop',
                
        /**
         * This event fires at the beginning of deck.animator initialization.
         */
        beforeInitialize: 'deck.animator.beforeInit',
        
        /**
         * This event fires at the end of deck.animator initialization.
         */
        initialize: 'deck.animator.init'
    };
    
    if( $.isArray(animations) ) {
        anims = animations;
        cursor = 0;
    } else {
        throw "Animator only takes an array of animation as argument.";
    }
    
    /**
     * Restart animator.
     */
    this.restart = function() {
        init();
        this.next(false);
    }
    
    /**
     * Start animator from the last state.
     */
    this.startFromTheEnd = function() {
        init();
        animations.forEach( function(a){
            playAnimation(a, false, true);
            cursor++;
        });
        $(document).trigger(events.completed, {'target':target, 'reverse':true});
    }
    
    /**
     * Return true if animation has started playing.
     */
    this.hasStarted = function() {
        return cursor > 0;
    }
    
    /**
     * Return true if the animation is finished.
     */
    this.isCompleted = function() {
        return cursor == anims.length && !this.isOngoing();
    }
    
    /**
     * Return true if the animation is ongoing
     */
    this.isOngoing = function() {
        for(var i = 0; i < animations.length; ++i) {
            if($(animations[i].action.target, target).is(':animated')) {
                return true;
            }
        }
        return false;
    }

    /** 
     * Move to the next state (right before an afterPrevious-triggered action and, 
     * by extension by calling playSequence, right before the next onChange-triggered action).
     */
    this.next = function(verifyOngoing) {
        // if a sequence of action is ongoing, cut the animation short on key press
        if(verifyOngoing && this.isOngoing()) {
            this.finishOngoing();
            return;
        }
        // else, do the actual next stuff
        if( cursor < anims.length ) {
            var animationSequence = new Array();
            $(document).trigger(events.sequenceStart, {'target':target, 'id':animations[cursor].action.id, 'reverse':false});
            do {
                anim = animations[cursor++];
                animationSequence.push(anim);
                
                if(cursor < anims.length && animations[cursor].action.trigger === TriggerEnum.ONCHANGE) {
                    break;
                }
            } while(cursor < anims.length);
            playSequence(this, animationSequence, false, false);
            if(cursor === anims.length) {
                $(document).trigger(events.completed, {'target':target, 'reverse':false});
            }
        } else {
            $(document).trigger(events.completed, {'target':target, 'reverse':false});
        }
    }
    
    /**
     * Move to the previous state (right before the next (from past to future) onChange-triggered action).
     */
    this.prev = function(verifyOngoing) {
        if( cursor > 0 ) {
            // if a sequence of action is ongoing, cut the animation short on key press
            if(verifyOngoing && this.isOngoing()) {
                this.finishOngoing();
                return;
            }

            var animationSequence = new Array();
            $(document).trigger(events.sequenceStart, {'target':target, 'index':animations[cursor-1].action.id, 'reverse':true});
            do {
                anim = animations[--cursor];
                animationSequence.push(anim);
                
                if(cursor > 0 && animations[cursor].action.trigger === TriggerEnum.ONCHANGE) {
                    break;
                }
            } while(cursor > 0);
            if(cursor === 0) {
                $(document).trigger(events.completed, {'target':target, 'reverse':true});
            }
            playSequence(this, animationSequence, true, true);
        } else {
            $(document).trigger(events.completed, {'target':target, 'reverse':true});
        }
    }
    
    /**
     * Finish immediatly all ongoing animations
     */
    this.finishOngoing = function() {
        animations.forEach(function(a){
            $(a.action.target, target).finish();
        });
    }
    
    /**
     * Add a callback to animationSequence[i].
     */
    function queueAnimation(animator, animationSequence, i, reverse, skip) {
        animationSequence[i].action.nextPlay = function() {
            $(document).trigger(events.actionStop, {'target':target, 'id':animationSequence[i].action.id, 'reverse':reverse});
            if(i < animationSequence.length - 1 &&
                    (animationSequence[i].action.trigger === TriggerEnum.ONCHANGE 
                        || animationSequence[i+1].action.trigger === TriggerEnum.AFTERPREVIOUS)) {
                playAnimation(animationSequence[i+1], reverse, skip);
                for(j = i+2; j < animationSequence.length ; ++j) {
                    if(animationSequence[j].action.trigger === TriggerEnum.WITHPREVIOUS) {
                        playAnimation(animationSequence[j], reverse, skip);
                    }
                }
            }
            
            if(!animator.isOngoing()) {
                $(document).trigger(events.sequenceStop, {'target':target, 'id':animationSequence[i].action.id, 'reverse':reverse});
            }
        };
    }
    
    /**
     * Play a single action.
     */
    function playAnimation(animation, reverse, skip) {
        $(document).trigger(events.actionStart, {'target':target, 'id':animation.action.id, 'reverse':reverse});
        animation.play(target, reverse, skip);
    }
    
    /**
     * Play a sequence of animation
     */
    function playSequence(animator, animationSequence, reverse, skip) {
        if(animationSequence.length === 0) return;
        
        if(reverse) {
            animationSequence.forEach(function(a){
                playAnimation(a, reverse, skip);
            });
        } else {
            for(i = 0; i < animationSequence.length; ++i) {
                queueAnimation(animator, animationSequence, i, reverse, skip);
            }
            playAnimation(animationSequence[0], reverse, skip);
        }
    }
    
    function init() {           
        $(document).trigger(events.beforeInitialize, {'target':target});
        
        cursor = 0;
        if( anims.length>0 ) {
            anim = animations[cursor];
            $(document).trigger(events.initialize, {'target':target}); 
        } else {
            throw "Animator requires at least one animation."
        }
    }
}

/*#########################################################
#####                   ANIMATIONS                    #####
#########################################################*/

/**
 * Animator.Appear(prevA, a, nextA)
 * 
 * a   current action JSON descriptor
 */
Animator.Appear = function(a) {
    return generateAnimatedAction(a, function(t, reverse, skip) {
        playReversibleAnimation(a, t, 
            {opacity: 1}, {opacity: 0}, 
            reverse, skip);
    });
}

/**
 * Animator.Disappear(prevA, a, nextA)
 * 
 * a   current action JSON descriptor
 */
Animator.Disappear = function(a) {
    return generateAnimatedAction(a, function(t, reverse, skip) {
        playReversibleAnimation(a, t, 
            {opacity: 0}, {opacity: 1}, 
            reverse, skip);
    });
}

/**
 * Animator.Move(prevA, a, nextA)
 * 
 * a   current action JSON descriptor
 */
Animator.Move = function(a) {
    return generateAnimatedAction(a, function(t, reverse, skip) {
        currentX = parseInt($(a.target).css("left"));
        currentY = parseInt($(a.target).css("top"));
        trX = parseInt(a.trX);
        trY = parseInt(a.trY);
        playReversibleAnimation(a, t, 
            {left: currentX+trX, top: currentY+trY}, 
            {left: currentX-trX, top: currentY-trY}, 
            reverse, skip);
    });
}


/*#########################################################
#####                     UTILS                       #####
#########################################################*/

/**
 * Animate the target element depending on various playing options.
 */
playReversibleAnimation = function(a, t, 
        cssProperty, reverseCssProperty, 
        reverse, skip) {
    d = a.duration;
    if(d === undefined || skip) d = 0;
    if(reverse) {
        $(a.target, t).animate(reverseCssProperty, d);
    } else {
        $(a.target, t).animate(cssProperty, d, undefined, a.nextPlay);
    }
}

/**
 * Generates an object containing information about the current animation, 
 * how to play it, and information about the next and previous animations.
 */
generateAnimatedAction = function(currentA, currentAnimFunc) {
    return {
        action: currentA,
        play: currentAnimFunc
    };
}
