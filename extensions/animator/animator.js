function Animator(target, animations) {

	TriggerEnum = {
		ONCLICK: "onClick",
		WITHPREVIOUS: "withPrevious",
		AFTERPREVIOUS: "afterPrevious"
	}
    
    var anims,  // list of all animations
    cursor,     // pointer to the current animation
    
    events = {
		/*
		This event fires whenever the current animation is completed.
                The callback function is passed one parameter, target, equal to 
                the target on which the animation completed.
		
		$(document).bind('deck.animator.completed', function(target) {
		   alert('The animation of '+target+' has just completed.');
		});
		*/
		completed: 'deck.animator.completed',
		
                /*
		This event fires whenever an animation is performed. The callback
                function is passed two parameters, target and index, equal to
                the target on which the animation is performed and the index of
                the animation i.e between 0 and animation.lenght.
		*/
		progress: 'deck.animator.progress',
                
		/*
		This event fires at the beginning of deck.animator initialization.
		*/
		beforeInitialize: 'deck.animator.beforeInit',
		
		/*
		This event fires at the end of deck.animator initialization.
		*/
		initialize: 'deck.animator.init' 
	};
    
    if( $.isArray(animations) ) {
        anims = animations;
        cursor = 0;
    } else {
        throw "Animator only takes an array of animation as argument.";
    }
    
    /*
        Restart animator.
        */
    this.restart = function() {
        init();
		this.next();
    }
	
	/*
		Start animator from the last state.
		*/
	this.startFromTheEnd = function() {
		init();
		animations.forEach( function(a){
			console.log("startFromEnd");
            a.play(target, false, true);
			cursor++;
        });
	}
	
	this.getCursor = function() {
		return cursor;
	}

    /*  
        Move to next animation.
        */
    this.next = function() {
        if( cursor < anims.length ) {
			do {
				anim = animations[cursor++];
				anim.play(target, false, false);
				
				if(cursor < anims.length && animations[cursor].trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor < anims.length);
            $(document).trigger(events.progress, {'target':target, 'index':cursor-1});
        } else {
            $(document).trigger(events.completed, {'target':target});
        }
    }
	
	/*
		Move to previous animation.
		*/
	this.prev = function() {
		if( cursor > 0 ) {
			do {
				anim = animations[--cursor];
				anim.play(target, true, false);
				
				if(cursor > 0 && animations[cursor].trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor > 0);
			$(document).trigger(events.progress, {'target':target, 'index':cursor-1});
        } else {
            $(document).trigger(events.completed, {'target':target});
        }
	}
   
    /*  
        Return true if animation is complete.
        */
    this.isCompleted = function() {
        return cursor == anims.length;
    }
    
    /*
        Push new animation into the animator.
        */
    this.push = function(anim) {
        this.anims.push(anim);
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

callUsingTrigger = function(func, trigger, previousElt, nextElt, nextTrigger, container, reverse) {
	if(reverse) {
		if(nextTrigger === TriggerEnum.AFTERPREVIOUS && nextElt !== undefined) {
			// wait until the previous (reverse) animation is done
			$(nextElt, container).promise().done(function(){
				func();
			});
		} else {
			func();
		}
	} else {
		if(trigger === TriggerEnum.AFTERPREVIOUS && previousElt !== undefined) {
			// wait until the previous animation is done
			$(previousElt, container).promise().done(function(){
				func();
			});
		} else {
			func();
		}
	}
}

/*
    Animator.Appear(e,d)

    e   element
    d   duration
	previousElt   the id of the previous Elt
	nextElt   the id of the next Elt
	trig   the stirng representing the trigger of the event
    */
Animator.Appear = function(e, d, previousElt, nextElt, nextTrigger, trig) {
    d = d || 0;
	return {
		trigger: trig,
		play: function(t, reverse, skip) {
			duration = d;
			if(skip) duration = 0;
			this.appearance = function() {
				if(reverse) {
					$(e, t).animate({opacity: 0}, duration);
				} else {
					$(e, t).animate({opacity: 1}, duration);
				}
			};
			callUsingTrigger(this.appearance, this.trigger, previousElt, nextElt, nextTrigger, t, reverse);
		}
	};
}

/*
    Animator.Disappear(e,d)

    e   element
    d   duration
	previousElt   the id of the previous Elt
	nextElt   the id of the next Elt
	trig   the stirng representing the trigger of the event
    */
Animator.Disappear = function(e, d, previousElt, nextElt, nextTrigger, trig) {
    d = d || 0;
    return {
		trigger: trig,
		play: function(t, reverse, skip) {
			duration = d;
			if(skip) duration = 0;
			this.disappearance = function() {
				if(reverse) {
					$(e, t).animate({opacity: 1}, duration);
				} else {
					$(e, t).animate({opacity: 0}, duration);
				}
			};
			callUsingTrigger(this.disappearance, this.trigger, previousElt, nextElt, nextTrigger, t, reverse);
		}
	};
}

/*
    Animator.Move(e,tr,d)

    e   element
    trX  the X translation
	trY  the Y translation
    d   duration
	previousElt   the id of the previous Elt
	nextElt   the id of the next Elt
	trig   the stirng representing the trigger of the event
    */
Animator.Move = function(e,trX,trY,d,previousElt, nextElt, nextTrigger, trig) {
    d = d || 0;
    return {
		trigger: trig,
		play: function(t, reverse, skip) {
			duration = d;
			if(skip) duration = 0;
			// You have to wait for the animation to be finished to avoid using the wrong starting coordinates
			this.translation = function() {
				$(e, t).promise().done(function(){
					currentX = parseInt($(e).css("left"));
					currentY = parseInt($(e).css("top"));
					if(reverse) {
						$(e, t).animate({left: currentX-trX, top: currentY-trY}, duration);
					} else {
						$(e, t).animate({left: currentX+trX, top: currentY+trY}, duration);
					}
				});
			}
			callUsingTrigger(this.translation, this.trigger, previousElt, nextElt, nextTrigger, t, reverse);
		}
	};
}


