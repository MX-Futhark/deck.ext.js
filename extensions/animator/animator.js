TriggerEnum = {
	ONCLICK: "onClick",
	WITHPREVIOUS: "withPrevious",
	AFTERPREVIOUS: "afterPrevious"
}

// TODO : autocomplete animations on slide change
// TODO : immediatly finish currently playing animation on key press

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
        this.init();
		this.next();
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
        Return true if animation is complete.
        */
    this.isCompleted = function() {
        return cursor == anims.length;
    }
	
	this.isOnGoing = function() {
		animations.forEach(function(a){
			if(a.action.playing) return true;
		});
		return false;
	}
	
	/*
		Play a sequence of animation.
		*/
	this.play = function(animationSequence, isReversed, skip) {
		if(animationSequence.length === 0) return;
		var lastPlayed = 0;
		animationSequence[0].play(target, isReversed, skip);
		for(i = 1; i < animationSequence.length && (animationSequence[i].action.trigger === TriggerEnum.WITHPREVIOUS || isReversed); ++i) {
			animationSequence[i].play(target, isReversed, skip);
			lastPlayed = i;
		}
		if(animationSequence[lastPlayed].index === animations.length && !isReversed) {
			$(document).trigger(events.completed, {'target':target});
		}
		if(animationSequence[lastPlayed].index === 0 && isReversed) {
			$(document).trigger(events.completedReverse, {'target':target});
		}
	}

    /*  
        Move to the next state (right before an afterPrevious-triggered action and, 
		by extension by calling this.play, right before the next onClick-triggered action).
        */
    this.next = function() {
        if( cursor < anims.length ) {
			// if a sequence of action is ongoing, prevent the next action from playing
			if(animations[cursor].action.trigger === TriggerEnum.ONCLICK && this.isOnGoing()) return;
			
			$(document).trigger(events.progress, {'target':target, 'index':cursor});
			var animationSequence = new Array();
			do {
				anim = animations[cursor++];
				animationSequence.push(anim);
				
				if(cursor < anims.length && animations[cursor].action.trigger !== TriggerEnum.WITHPREVIOUS) {
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
	this.prev = function() {
		if( cursor > 0 ) {
			// if an action ongoing, prevent the previous action from playing
			if(this.isOnGoing()) return;
			
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
    
    /*
        Push new animation into the animator.
        */
    this.push = function(anim) {
        this.anims.push(anim);
    }
	
	/*
		Continue the current sequence of animations.
		*/
	this.continuePlaying = function(action, reverse) {
		// find the index of the current action in animations
		curInd = -1;
		for(i = 0; i < animations.length; ++i) {
			if(animations[i].action.id === action.id) {
				curInd = i;
				break;
			}
		}
		
		if(curInd === -1) return;

		
		if(reverse) {
			if(action.trigger != TriggerEnum.ONCLICK) {
				this.prev();
			}
		} else {
			// play the next sequence automatically if the next key (non-withPrevious) action is triggered on afterPrevious
			// find next key animation
			nextInd = curInd+1;
			while(nextInd < animations.length && animations[nextInd].action.trigger === TriggerEnum.WITHPREVIOUS) {
				++nextInd;
			}
			// stop if the sequence of automatically playing actions is finished
			if(nextInd >= animations.length || animations[nextInd].action.trigger === TriggerEnum.ONCLICK) {
				return;
			}
			
			this.next();
		}
	}
    
    this.init = function() {           
        $(document).trigger(events.beforeInitialize, {'target':target});
        
        cursor = 0;
        if( anims.length>0 ) {
			for(i = 0; i < animations.length; ++i) {
				animations[i].action.animator = this;
			}
			anim = animations[cursor];
            $(document).trigger(events.initialize, {'target':target}); 
			// autostart if necessary
			if(anim.action.trigger !== TriggerEnum.ONCLICK) {
				this.next();
			}
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

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Appear = function(ind, prevA, a, nextA) {
	return generateChainedAnimation(ind, prevA, a, nextA, function(t, reverse, skip) {
		playRevertibleAnimation(a, t, 
			{opacity: 1}, {opacity: 0}, 
			reverse, skip);
	});
}

/*
    Animator.Disappear(prevA, a, nextA)

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Disappear = function(ind, prevA, a, nextA) {
	return generateChainedAnimation(ind, prevA, a, nextA, function(t, reverse, skip) {
		playRevertibleAnimation(a, t, 
			{opacity: 0}, {opacity: 1}, 
			reverse, skip);
	});
}

/*
    Animator.Move(prevA, a, nextA)

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Move = function(ind, prevA, a, nextA) {
	return generateChainedAnimation(ind, prevA, a, nextA, function(t, reverse, skip) {
		// One needs to wait for the animation to be finished to avoid using the wrong starting coordinates
		$(a.target, t).promise().done(function(){
			currentX = parseInt($(a.target).css("left"));
			currentY = parseInt($(a.target).css("top"));
			trX = parseInt(a.trX);
			trY = parseInt(a.trY);
			playRevertibleAnimation(a, t, 
				{left: currentX+trX, top: currentY+trY}, 
				{left: currentX-trX, top: currentY-trY}, 
				reverse, skip);
		});
	});
}


///////////////////////////////////////////////////////////
/////                     UTILS                       /////
///////////////////////////////////////////////////////////

/*
	Animate the target element depending on various playing options.
	*/
playRevertibleAnimation = function(a, t, 
		cssProperty, reverseCssProperty, 
		reverse, skip) {
	a.playing = true;
	d = a.duration;
	if(d === undefined || skip) d = 0;
	if(reverse) {
		$(a.target, t).animate(reverseCssProperty, d);
	} else {
		$(a.target, t).animate(cssProperty, d);
	}
	$(a.target, t).promise().done(function(){
		a.playing = false;
		if(a.trigger !== TriggerEnum.WITHPREVIOUS && !reverse && !skip) {
			a.animator.continuePlaying(a, reverse);	
		}
	});
}

/*
	Generates an object containing information about the current animation, 
	how to play it, and information about the next and previous animations.
	*/
generateChainedAnimation = function(ind, prevA, currentA, nextA, currentAnimFunc) {
	return {
		index: ind,
		action: currentA,
		prevAction: prevA,
		nextAction: nextA,
		play: currentAnimFunc
	};
}