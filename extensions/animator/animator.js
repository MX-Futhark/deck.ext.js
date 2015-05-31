TriggerEnum = {
	ONCLICK: "onClick",
	WITHPREVIOUS: "withPrevious",
	AFTERPREVIOUS: "afterPrevious"
}

function Animator(target, animations) {
    
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
		This event fires whenever the current animation has finished playing in reverse.
                The callback function is passed one parameter, target, equal to 
                the target on which the animation completed.
		*/
		completedReverse: 'deck.animator.completedReverse',
		
		/*
		This event fires whenever a sequence of animations is performed. The callback
                function is passed two parameters, target and index, equal to
                the target on which the animation is performed and the index of
                the animation i.e between 0 and animation.lenght.
		*/
		progress: 'deck.animator.progress',
		
		/*
		This event fires whenever a sequence of reverse animations is performed. The callback
                function is passed two parameters, target and index, equal to
                the target on which the animation is performed and the index of
                the animation i.e between 0 and animation.lenght.
		*/
		progressReverse: 'deck.animator.progressReverse',
                
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
		this.next(false);
    }
	
	/*
		Start animator from the last state.
		*/
	this.startFromTheEnd = function() {
		this.init();
		animations.forEach( function(a){
            a.play(target, false, true);
			cursor++;
        });
		$(document).trigger(events.completed, {'target':target});
	}
	
	/*
		Return true if animation has started playing.
		*/
	this.hasStarted = function() {
		return cursor > 0;
	}
	
	/*  
        Return true if the animation is finished.
        */
    this.isCompleted = function() {
        return cursor == anims.length && !this.isOngoing();
    }
	
	/*
		Return true if the animation is ongoing
		*/
	this.isOngoing = function() {
		for(var i = 0; i < animations.length; ++i) {
			if($(animations[i].action.target, target).is(':animated')) {
				return true;
			}
		}
		return false;
	}
	
	/*
		Add a callback to animationSequence[i].
		*/
	this.queueAnimation = function(animationSequence, i, isReversed, skip) {
		animationSequence[i].action.nextPlay = function() {
			if(i < animationSequence.length - 1) {
				animationSequence[i+1].play(target, isReversed, skip);
				for(j = i+2; j < animationSequence.length ; ++j) {
					if(animationSequence[j].action.trigger === TriggerEnum.WITHPREVIOUS) {
						animationSequence[j].play(target, isReversed, skip);
					}
				}
			}
		};
	}
	
	/*
		Play a sequence of animation
		*/
	this.play = function(animationSequence, isReversed, skip) {
		if(animationSequence.length === 0) return;
		
		if(isReversed) {
			animationSequence.forEach(function(a){
				a.play(target, isReversed, skip);
			});
		} else {
			for(i = 0; i < animationSequence.length - 1; ++i) {
				if(animationSequence[i].action.trigger !== TriggerEnum.WITHPREVIOUS 
						|| animationSequence[i+1].action.trigger === TriggerEnum.AFTERPREVIOUS) {
					this.queueAnimation(animationSequence, i, isReversed, skip);
				}
			}
			animationSequence[0].play(target, isReversed, skip);
		}

		if(animationSequence[animationSequence.length-1].action.id === animations[animations.length-1].action.id && !isReversed) {
			$(document).trigger(events.completed, {'target':target});
		}
		if(animationSequence[animationSequence.length-1].action.id === animations[0].action.id && isReversed) {
			$(document).trigger(events.completedReverse, {'target':target});
		}
	}
	
	/*
		Finish all ongoing animations
		*/
	this.finishOngoing = function() {
		var self = this;
		animations.forEach(function(a){
			$(a.action.target, target).finish();
		});
	}

    /*  
        Move to the next state (right before an afterPrevious-triggered action and, 
		by extension by calling this.play, right before the next onClick-triggered action).
        */
    this.next = function(verifyOngoing) {
		// if a sequence of action is ongoing, cut the animation short on key press
		if(verifyOngoing && this.isOngoing()) {
			this.finishOngoing();
			return;
		}
		// else, do the actual next stuff
        if( cursor < anims.length ) {
			$(document).trigger(events.progress, {'target':target, 'index':cursor});
			var animationSequence = new Array();
			do {
				anim = animations[cursor++];
				animationSequence.push(anim);
				
				if(cursor < anims.length && animations[cursor].action.trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor < anims.length);
			this.play(animationSequence, false, false);
        } else {
            $(document).trigger(events.completed, {'target':target});
        }
    }
	
	/*
		Move to the previous state (right before the next (from past to future) onClick-triggered action).
		*/
	this.prev = function(verifyOngoing) {
		if( cursor > 0 ) {
			// if a sequence of action is ongoing, cut the animation short on key press
			if(verifyOngoing && this.isOngoing()) {
				this.finishOngoing();
				return;
			}
			
			$(document).trigger(events.progressReverse, {'target':target, 'index':cursor});
			var animationSequence = new Array();
			do {
				anim = animations[--cursor];
				animationSequence.push(anim);
				
				if(cursor > 0 && animations[cursor].action.trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor > 0);
			if(cursor === 0) {
				$(document).trigger(events.completedReverse, {'target':target});
			}
			this.play(animationSequence, true, true);
        } else {
            $(document).trigger(events.completedReverse, {'target':target});
        }
	}
    
    function init() {           
        $(document).trigger(events.beforeInitialize, {'target':target});
        
        cursor = 0;
        if( anims.length>0 ) {
			anim = animations[cursor];
            $(document).trigger(events.initialize, {'target':target}); 
        } else {
            throw "Animator requires at list one animation."
        }
    }
}

///////////////////////////////////////////////////////////
/////                   ANIMATIONS                    /////
///////////////////////////////////////////////////////////

/*
    Animator.Appear(prevA, a, nextA)

    a   current action JSON descriptor
    */
Animator.Appear = function(a) {
	return generateAnimatedAction(a, function(t, reverse, skip) {
		playReversibleAnimation(a, t, 
			{opacity: 1}, {opacity: 0}, 
			reverse, skip);
	});
}

/*
    Animator.Disappear(prevA, a, nextA)

    a   current action JSON descriptor
    */
Animator.Disappear = function(a) {
	return generateAnimatedAction(a, function(t, reverse, skip) {
		playReversibleAnimation(a, t, 
			{opacity: 0}, {opacity: 1}, 
			reverse, skip);
	});
}

/*
    Animator.Move(prevA, a, nextA)

    a   current action JSON descriptor
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


///////////////////////////////////////////////////////////
/////                     UTILS                       /////
///////////////////////////////////////////////////////////

/*
	Animate the target element depending on various playing options.
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

/*
	Generates an object containing information about the current animation, 
	how to play it, and information about the next and previous animations.
	*/
generateAnimatedAction = function(currentA, currentAnimFunc) {
	return {
		action: currentA,
		play: currentAnimFunc
	};
}