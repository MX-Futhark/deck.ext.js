/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

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
			console.log("skipping");
            a(target, false, true);
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
            anim = animations[cursor++];
            anim(target, false, false);
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
			anim = animations[--cursor];
			anim(target, true, false);
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

/*
    Animator.Appear(e,d)

    e   element
    d   duration
    */
Animator.Appear = function(e, d) {
    d = d || 0;
    return function(t, reverse, skip) {
		duration = d
		if(skip) duration = 0;
		if(reverse) {
			$(e, t).animate({opacity: 0}, duration);
		} else {
			$(e, t).animate({opacity: 1}, duration);
		}
    }
}

/*
    Animator.Disappear(e,d)

    e   element
    d   duration
    */
Animator.Disappear = function(e, d) {
    d = d || 0;
    return function(t, reverse, skip) {
		duration = d
		if(skip) duration = 0;
		if(reverse) {
			$(e, t).animate({opacity: 1}, duration);
		} else {
			$(e, t).animate({opacity: 0}, duration);
		}
    }
}

/*
    Animator.Move(e,tr,d)

    e   element
    trX  the X translation
	trY  the Y translation
    d   duration
    */
Animator.Move = function(e,trX,trY,d) {
    d = d || 0;
    return function(t, reverse, skip) {
		duration = d
		if(skip) duration = 0;
		// You have to wait for the animation to be finished to avoid using the wrong starting coordinates
		$(e).promise().done(function(){
			currentX = parseInt($(e).css("left"));
			currentY = parseInt($(e).css("top"));
			if(reverse) {
				$(e).animate({left: currentX-trX, top: currentY-trY}, duration);
			} else {
				$(e).animate({left: currentX+trX, top: currentY+trY}, duration);
			}
		});
    }
}


