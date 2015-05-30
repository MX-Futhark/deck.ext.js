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
		This event fires whenever the current animation has finished playing in reverse.
                The callback function is passed one parameter, target, equal to 
                the target on which the animation completed.
		*/
		completedReverse: 'deck.animator.completedReverse',
		
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
		$(document).trigger(events.completed, {'target':target});
	}
	
	this.hasStarted = function() {
		return cursor > 0;
	}

    /*  
        Move to next animation.
        */
    this.next = function() {
        if( cursor < anims.length ) {
			do {
				anim = animations[cursor++];
				anim.play(target, false, false);
				$(document).trigger(events.progress, {'target':target, 'index':cursor-1});
				if(cursor < anims.length && animations[cursor].action.trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor < anims.length);
            if(cursor === anims.length) {
				$(document).trigger(events.completed, {'target':target});
			}
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
				$(document).trigger(events.progress, {'target':target, 'index':cursor-1});
				
				if(cursor > 0 && animations[cursor].action.trigger === TriggerEnum.ONCLICK) {
					break;
				}
			} while(cursor > 0);
			if(cursor === 0) {
				$(document).trigger(events.completedReverse, {'target':target});
			}
        } else {
            $(document).trigger(events.completedReverse, {'target':target});
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

///////////////////////////////////////////////////////////
/////                   ANIMATIONS                    /////
///////////////////////////////////////////////////////////

/*
    Animator.Appear(prevA, a, nextA)

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Appear = function(prevA, a, nextA) {
	return generateChainedAnimation(prevA, a, nextA, function(t, reverse, skip) {
		this.appearance = function() {
			playRevertibleAnimation(a.target, t, 
				{opacity: 1}, {opacity: 0}, 
				a.duration, reverse, skip);
		};
		callUsingTrigger(this.appearance, prevA, a, nextA, t, reverse);
	});
}

/*
    Animator.Disappear(prevA, a, nextA)

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Disappear = function(prevA, a, nextA) {
	return generateChainedAnimation(prevA, a, nextA, function(t, reverse, skip) {
		this.disappearance = function() {
			playRevertibleAnimation(a.target, t, 
				{opacity: 0}, {opacity: 1}, 
				a.duration, reverse, skip);
		};
		callUsingTrigger(this.disappearance, prevA, a, nextA, t, reverse);
	});
}

/*
    Animator.Move(prevA, a, nextA)

	prevA   action JSON descriptor preceding the current one
    a   current action JSON descriptor
    nextA   action JSON descriptor following the current one
    */
Animator.Move = function(prevA, a, nextA) {
	return generateChainedAnimation(prevA, a, nextA, function(t, reverse, skip) {
		// One needs to wait for the animation to be finished to avoid using the wrong starting coordinates
		this.translation = function() {
			$(a.target, t).promise().done(function(){
				currentX = parseInt($(a.target).css("left"));
				currentY = parseInt($(a.target).css("top"));
				trX = parseInt(a.trX);
				trY = parseInt(a.trY);
				playRevertibleAnimation(a.target, t, 
					{left: currentX+trX, top: currentY+trY}, 
					{left: currentX-trX, top: currentY-trY}, 
					a.duration, reverse, skip);
			});
		}
		callUsingTrigger(this.translation, prevA, a, nextA, t, reverse);
	});
}


///////////////////////////////////////////////////////////
/////                     UTILS                       /////
///////////////////////////////////////////////////////////

/*
    Call the animation function depending on the triggers and playing order.
    */
callUsingTrigger = function(func, prevAction, action, nextAction, container, reverse) {
	if(reverse) {
		if(nextAction !== undefined && nextAction.trigger === TriggerEnum.AFTERPREVIOUS) {
			// wait until the previous (reverse) animation is done
			$(nextAction.target, container).promise().done(function(){
				func();
			});
		} else {
			func();
		}
	} else {
		if(prevAction !== undefined && action.trigger === TriggerEnum.AFTERPREVIOUS) {
			// wait until the previous animation is done
			$(prevAction.target, container).promise().done(function(){
				func();
			});
		} else {
			func();
		}
	}
}

/*
	Animate the target element depending on various playing options.
	*/
playRevertibleAnimation = function(e, t, 
		cssProperty, reverseCssProperty, 
		duration, reverse, skip) {

	d = duration;
	if(d === undefined || skip) d = 0;
	if(reverse) {
		$(e, t).animate(reverseCssProperty, d);
	} else {
		$(e, t).animate(cssProperty, d);
	}
}

/*
	Generates an object containing information about the current animation, 
	how to play it, and information about the next and previous animations.
	*/
generateChainedAnimation = function(prevA, currentA, nextA, currentAnimFunc) {
	return {
		action: currentA,
		prevAction: prevA,
		nextAction: nextA,
		play: currentAnimFunc
	};
}
