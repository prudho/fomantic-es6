"use strict";

import Module from '../module'

import $ from 'cash-dom';

const settings = {
    name          : 'Transition',
    namespace     : 'transition',

    silent        : false,
    debug         : false,
    verbose       : false,
    performance   : true,
    
    interval      : 0, // delay between animations in group
    reverse       : 'auto', // whether group animations should be reversed
    
    useFailSafe   : true, // whether timeout should be used to ensure callback fires in cases animationend does not
    failSafeDelay : 100, // delay in ms for fail safe
    allowRepeats  : false, // whether EXACT animation can occur twice in a row
    displayType   : false, // Override final display type on visible

    // animation
    animation     : 'fade',
    duration      : false,

    queue         : true, // new animations will occur after previous ones

    metadata : {
        displayType: 'display'
    },

    className   : {
        animating  : 'animating',
        disabled   : 'disabled',
        hidden     : 'hidden',
        inward     : 'in',
        loading    : 'loading',
        looping    : 'looping',
        outward    : 'out',
        transition : 'transition',
        visible    : 'visible'
    },

    error: {
        noAnimation : 'Element is no longer attached to DOM. Unable to animate.  Use silent setting to surpress this warning in production.',
        repeated    : 'That animation is already occurring, cancelling repeated animation',
        method      : 'The method you called is not defined',
        support     : 'This browser does not support CSS animations'
    },

    events: ['start', 'complete', 'show', 'hide']
}

export class Transition extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing transition module', this.settings);

        // get vendor specific events
        this.animationEnd = this.get_animationEndEvent();

        if(this.settings.interval) {
            this.delay(this.settings.animate);
        } else  {
            this.animate();
        }
        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.instance = this; // FIXME
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.$element.removeData(this.moduleNamespace);
    }

    animate(overrideSettings) {
        this.settings = overrideSettings || this.settings;
        if(!this.is_supported()) {
            this.error(error.support);
            return false;
        }
        this.debug('Preparing animation', settings.animation);
        if(this.is_animating()) {
            if(this.settings.queue) {
                if(!this.settings.allowRepeats && this.has_direction() && this.is_occurring() && this.queuing !== true) {
                    this.debug('Animation is currently occurring, preventing queueing same animation', this.settings.animation);
                }
                else {
                    this.queue(this.settings.animation);
                }
                return false;
            } else if(!this.settings.allowRepeats && this.is_occurring()) {
                this.debug('Animation is already occurring, will not execute repeated animation', this.settings.animation);
                return false;
            } else {
                this.debug('New animation started, completing previous early', this.settings.animation);
                this.complete();
            }
        }
        if( this.can_animate() ) {
            this.set_animating(this.settings.animation);
        } else {
            this.error(this.settings.error.noAnimation, this.settings.animation, this.$element);
        }
    }

    complete(event) {
        this.debug('Animation complete', settings.animation);
        this.remove_completeCallback();
        this.remove_failSafe();
        if(!this.is_looping()) {
            if( this.is_outward() ) {
                this.verbose('Animation is outward, hiding element');
                this.restore_conditions();
                this.hide();
            } else if( this.is_inward() ) {
                this.verbose('Animation is outward, showing element');
                this.restore_conditions();
                this.show();
            } else {
                this.verbose('Static animation completed');
                this.restore_conditions();
                this.invokeCallback('complete')(this.$element);
            }
        }
    }
    
    show(display) {
        this.verbose('Showing element', display);
        this.remove_hidden();
        this.set_visible();
        this.force_visible();
        this.invokeCallback('show')(this.$element);
        this.invokeCallback('complete')(this.$element);
        // module.repaint(); already commented
    }

    hide() {
        this.verbose('Hiding element');
        if( this.is_animating() ) {
            this.reset();
        }
        // FIXME or INVESTIGATE
        //element.blur(); // previous comment: IE will trigger focus change if element is not blurred before hiding
        this.remove_display();
        this.remove_visible();
        this.set_hidden();
        this.force_hidden();
        this.invokeCallback('hide')(this.$element);
        this.invokeCallback('complete')(this.$element);
        // module.repaint(); already commented
    }

    toggle() {
        if( this.is_visible() ) {
            this.hide();
          }
          else {
            this.show();
          }
    }

    delay(interval) {
        var
            direction = this.get_animationDirection(),
            shouldReverse,
            delay
        ;
        if(!direction) {
            direction = this.can_transition()
                ? this.get_direction()
                : 'static'
            ;
        }
        interval = (interval !== undefined)
            ? interval
            : this.settings.interval
        ;
        shouldReverse = (this.settings.reverse == 'auto' && direction == this.settings.className.outward);
        delay = this.settings.interval
        /*delay = (shouldReverse || this.settings.reverse == true)
            ? ($allModules.length - index) * settings.interval
            : index * this.settings.interval*/
        ;
        this.debug('Delaying animation by', delay);
        setTimeout(this.animate.bind(this), delay);
    }

    queue(animation) {
        var module = this;
        this.debug('Queueing animation of', animation);
        this.queuing = true;
        this.$element.one(this.animationEnd + '.queue' + this.eventNamespace, function() {
            module.queuing = false;
            // === module.settings.animation = animation; ===
            //module.repaint(); INVESTIGATE
            module.animate.apply(module, module.settings);
        });
    }

    repaint() {
        // SEEMS USELESS
        this.verbose('Repainting element');
        var
            fakeAssignment = element.offsetWidth
        ;
    }

    forceRepaint() {
        this.verbose('Forcing element repaint');
        var
            $parentElement = this.$element.parent(),
            $nextElement = this.$element.next()
        ;
        if($nextElement.length === 0) {
            this.$element.detach().appendTo($parentElement);
        } else {
            this.$element.detach().insertBefore($nextElement);
        }
    }
    
    reset() {
        this.debug('Resetting animation to beginning conditions');
        this.remove_animationCallbacks();
        this.restore_conditions();
        this.remove_animating();
    }

    refresh() {
        this.verbose('Refreshing display type on next animation');
        delete this.displayType;
    }

    clear_queue() {
        this.debug('Clearing animation queue');
        this.remove_queueCallback();
      }

    enable() {
        this.verbose('Starting animation');
        this.$element.removeClass(this.settings.className.disabled);
    }

    disable() {
        this.verbose('Stopping animation');
        this.$element.addClass(this.settings.className.disabled);
    }

    stop() {
        this.debug('Stopping current animation');
        //$module.triggerHandler(animationEnd); // INVESTIGATE
        this.$element.trigger(animationEnd);
    }

    stopAll() {
        this.debug('Stopping all animation');
        this.remove_queueCallback();
        //$module.triggerHandler(animationEnd); // INVESTIGATE
        this.$element.trigger(animationEnd);
    }
    
    get_animationEndEvent(){
        var
            element     = document.createElement('div'),
            animations  = {
                'animation'       :'animationend',
                'OAnimation'      :'oAnimationEnd',
                'MozAnimation'    :'mozAnimationEnd',
                'WebkitAnimation' :'webkitAnimationEnd'
            },
            animation
        ;
        for(animation in animations){
            if(element.style[animation] !== undefined){
                return animations[animation];
            }
        }
        return false;
    }

    get_animationClass(animation) {
        var
            animationClass = animation || this.settings.animation,
            directionClass = (this.can_transition() && !this.has_direction())
                ? this.get_direction() + ' '
                : ''
        ;
        return this.settings.className.animating + ' '
            + this.settings.className.transition + ' '
            + directionClass
            + animationClass
        ;
    }

    get_animationDirection(animation) {
        var
            direction,
            module = this
        ;
        animation = animation || this.settings.animation;
        if(typeof animation === 'string') {
            animation = animation.split(' ');
            // search animation name for out/in class
            $.each(animation, function(index, word){
            if(word === module.settings.className.inward) {
                direction = module.settings.className.inward;
            }
            else if(word === module.settings.className.outward) {
                direction = module.settings.className.outward;
            }
            });
        }
        // return found direction
        if(direction) {
            return direction;
        }
        return false;
    }

    get_currentAnimation() {
        return (this.cache && this.cache.animation !== undefined)
            ? this.cache.animation
            : false
        ;
    }

    get_direction() {
        return this.is_hidden() || !this.is_visible()
            ? this.settings.className.inward
            : this.settings.className.outward
      ;
    }

    get_duration(duration) {
        duration = duration || this.settings.duration;
        if(duration === false) {
            duration = this.$element.css('animation-duration') || 0;
        }
        return (typeof duration === 'string')
            ? (duration.indexOf('ms') > -1)
                ? parseFloat(duration)
                : parseFloat(duration) * 1000
            : duration
        ;
    }

    get_transitionExists(animation) {
        //return $.fn.transition.exists[animation]; FIXME
        return true;
    }

    get_displayType(shouldDetermine) {
        shouldDetermine = (shouldDetermine !== undefined) ? shouldDetermine : true;
        if(this.settings.displayType) {
            return this.settings.displayType;
        }
        if(shouldDetermine && this.$element.data(this.settings.metadata.displayType) === undefined) {
            // create fake element to determine display state
            this.can_transition(true);
        }
        return this.$element.data(this.settings.metadata.displayType);
    }

    get_userStyle(style) {
        style = style || this.$element.attr('style') || '';
        return style.replace(/display.*?;/, '');
    }

    set_animating(animation) {
        var
            animationClass,
            direction
        ;
        // remove previous callbacks
        this.remove_completeCallback();

        // determine exact animation
        animation      = animation || settings.animation;
        animationClass = this.get_animationClass(animation);

        // save animation class in cache to restore class names
        this.save_animation(animationClass);

        // override display if necessary so animation appears visibly
        this.force_visible();

        this.remove_hidden();
        this.remove_direction();

        this.start_animation(animationClass);
    }

    set_duration(animationName, duration) {
        duration = duration || this.settings.duration;
        duration = (typeof duration == 'number')
            ? duration + 'ms'
            : duration
        ;
        if(duration || duration === 0) {
            this.verbose('Setting animation duration', duration);
            this.$element.css({ 'animation-duration':  duration });
        }
    }

    set_hidden() {
        this.$element
            .addClass(this.settings.className.transition)
            .addClass(this.settings.className.hidden)
        ;
    }

    set_looping() {
        this.debug('Transition set to loop');
        this.$element.addClass(this.settings.className.looping);
    }

    set_visible() {
        this.$element
            .addClass(this.settings.className.transition)
            .addClass(this.settings.className.visible)
        ;
    }

    is_supported() {
        return (this.animationEnd !== false);
    }

    is_animating() {
        return this.$element.hasClass(this.settings.className.animating);
    }

    is_hidden() {
        return this.$element.css('visibility') === 'hidden';
    }

    is_inward() {
        return this.$element.hasClass(this.settings.className.inward);
    }

    is_looping() {
        return this.$element.hasClass(this.settings.className.looping);
    }

    is_occurring(animation) {
        animation = animation || this.settings.animation;
        animation = '.' + animation.replace(' ', '.');
        return ( this.$element.filter(animation).length > 0 );
    }

    is_outward() {
        return this.$element.hasClass(this.settings.className.outward);
    }

    is_visible() {
        //return this.$element.is(':visible'); FIXME
        return this.$element.hasClass('visible');
    }

    has_direction(animation) {
        var
            hasDirection = false,
            className = this.settings.className
        ;
        animation = animation || this.settings.animation;
        if(typeof animation === 'string') {
            animation = animation.split(' ');
            $.each(animation, function(index, word){
                if(word === className.inward || word === className.outward) {
                    hasDirection = true;
                }
            });
        }
        return hasDirection;
    }

    can_animate() {
        // can transition does not return a value if animation does not exist
        return (this.can_transition() !== undefined);
    }

    can_transition(forced) {
        var
            animation         = this.settings.animation,
            transitionExists  = this.get_transitionExists(animation),
            displayType       = this.get_displayType(false),
            elementClass,
            tagName,
            $clone,
            currentAnimation,
            inAnimation,
            directionExists
        ;
        if( transitionExists === undefined || forced) {
            this.verbose('Determining whether animation exists');
            elementClass = this.$element.attr('class');
            tagName      = this.$element.prop('tagName');

            $clone = $('<' + tagName + ' />').addClass( elementClass ).insertAfter(this.$element);
            currentAnimation = $clone
                .addClass(animation)
                .removeClass(this.settings.className.inward)
                .removeClass(this.settings.className.outward)
                .addClass(this.settings.className.animating)
                .addClass(this.settings.className.transition)
                .css('animationName')
            ;
            inAnimation = $clone
                .addClass(this.settings.className.inward)
                .css('animationName')
            ;
            if(!displayType) {
                displayType = $clone
                    .attr('class', elementClass)
                    .removeAttr('style')
                    .removeClass(this.settings.className.hidden)
                    .removeClass(this.settings.className.visible)
                    .show()
                    .css('display')
                ;
                this.verbose('Determining final display state', displayType);
                this.save_displayType(displayType);
            }

            $clone.remove();
            if(currentAnimation != inAnimation) {
                this.debug('Direction exists for animation', animation);
                directionExists = true;
            } else if(currentAnimation == 'none' || !currentAnimation) {
                this.debug('No animation defined in css', animation);
                return;
            } else {
                this.debug('Static animation found', animation, displayType);
                directionExists = false;
            }
            this.save_transitionExists(animation, directionExists);
        }
        return (transitionExists !== undefined)
            ? transitionExists
            : directionExists
        ;
    }

    remove_animating() {
        this.$element.removeClass(this.settings.className.animating);
    }

    remove_animationCallbacks() {
        this.remove_queueCallback();
        this.remove_completeCallback();
    }

    remove_completeCallback() {
        this.$element.off('.complete' + this.eventNamespace);
    }

    remove_direction() {
        this.$element
            .removeClass(this.settings.className.inward)
            .removeClass(this.settings.className.outward)
        ;
    }

    remove_display() {
        this.$element.css('display', '');
    }

    remove_duration() {
        this.$element.css('animation-duration', '');
    }

    remove_failSafe() {
        this.verbose('Removing fail safe timer', this.timer);
        if(this.timer) {
            clearTimeout(this.timer);
        }
    }

    remove_hidden() {
        this.$element.removeClass(this.settings.className.hidden);
    }

    remove_looping() {
        this.debug('Transitions are no longer looping');
        if( this.is_looping() ) {
            this.reset();
            this.$element.removeClass(this.settings.className.looping);
        }
    }

    remove_queueCallback() {
        this.$element.off('.queue' + this.eventNamespace);
    }

    remove_visible() {
        this.$element.removeClass(this.settings.className.visible);
    }

    save_animation(animation) {
        if(!this.cache) {
            this.cache = {};
        }
        this.cache.animation = animation;
    }

    save_displayType(displayType) {
        if(displayType !== 'none') {
            this.$element.data(this.settings.metadata.displayType, displayType);
        }
    }
    save_transitionExists(animation, exists) {
        //$.fn.transition.exists[animation] = exists; FIXME
        this.verbose('Saving existence of transition', animation, exists);
    }
    
    force_hidden() {
        var
            style          = this.$element.attr('style'),
            currentDisplay = this.$element.css('display'),
            emptyStyle     = (style === undefined || style === '')
        ;
        if(currentDisplay !== 'none' && !this.is_hidden()) {
            this.verbose('Overriding default display to hide element');
            this.$element.css('display', 'none');
        } else if(emptyStyle) {
            this.$element.removeAttr('style');
        }
    }

    force_visible() {
        var
            style          = this.$element.attr('style'),
            userStyle      = this.get_userStyle(),
            displayType    = this.get_displayType(),
            overrideStyle  = userStyle + 'display: ' + displayType + ' !important;',
            currentDisplay = this.$element.css('display'),
            emptyStyle     = (style === undefined || style === '')
        ;
        if(currentDisplay !== displayType) {
            this.verbose('Overriding default display to show element', displayType);
            this.$element.attr('style', overrideStyle);
        } else if(emptyStyle) {
            this.$element.removeAttr('style');
        }
    }

    start_animation(animationClass) {
        animationClass = animationClass || this.get_animationClass();
        this.debug('Starting tween', animationClass);
        this.$element
            .addClass(animationClass)
            .one(this.animationEnd + '.complete' + this.eventNamespace, this.complete.bind(this))
        ;
        if(this.settings.useFailSafe) {
            this.add_failSafe();
        }
        this.set_duration(this.settings.duration);

        //this.invokeCallback('start', element); INVESTIGATE
        this.invokeCallback('start')(this.$element);
    }

    add_failSafe() {
        var
            duration = this.get_duration(),
            module = this
        ;
        this.timer = setTimeout(function() {
            // module.$element.triggerHandler(module.animationEnd); INVESTIGATE
            module.$element.trigger(module.animationEnd);
        }, duration + module.settings.failSafeDelay);
        module.verbose('Adding fail safe timer', module.timer);
    }

    restore_conditions() {
        var
            animation = this.get_currentAnimation()
        ;
        if(animation) {
            this.$element.removeClass(animation);
            this.verbose('Removing animation class', this.cache);
        }
        this.remove_duration();
    }
}
