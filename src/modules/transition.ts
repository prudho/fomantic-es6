"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

export interface TransitionOptions extends ModuleOptions {
  autostart?: boolean;
  interval?: number;
  reverse?: string | boolean;

  useFailSafe?: boolean;
  failSafeDelay?: number;
  allowRepeats?: boolean;
  displayType?: string;

  animation: string;
  duration?: number;

  queue?: boolean;

  skipInlineHidden?: boolean;

  metadata?: {
    displayType: string
  }

  className?: {
    animating  : string,
    disabled   : string,
    hidden     : string,
    inward     : string,
    loading    : string,
    looping    : string,
    outward    : string,
    transition : string,
    visible    : string
  }

  error?: {
    noAnimation : string,
    repeated    : string,
    method      : string,
    support     : string
  }

  events?: Array<string>
}

const settings: TransitionOptions = {
  name          : 'Transition',
  namespace     : 'transition',

  silent        : false,
  debug         : false,
  verbose       : false,
  performance   : true,
  
  autostart     : true, // determine if creating the transition should start it
  interval      : 0, // delay between animations in group
  reverse       : 'auto', // whether group animations should be reversed
  
  useFailSafe   : true, // whether timeout should be used to ensure callback fires in cases animationend does not
  failSafeDelay : 100, // delay in ms for fail safe
  allowRepeats  : false, // whether EXACT animation can occur twice in a row
  displayType   : null, // Override final display type on visible

  // animation
  animation     : 'fade',

  queue         : true, // new animations will occur after previous ones

  // whether initially inline hidden objects should be skipped for transition
  skipInlineHidden: false,

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

  events: ['start', 'complete', 'show', 'hide', 'before_hide']
}

export class Transition extends Module {
  settings: TransitionOptions;

  animationEnd: string;
  cache: any;
  timer: any;
  queuing: boolean;

  instance: Transition;

  constructor(selector, parameters: TransitionOptions) {
    super(selector, parameters, settings);
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing transition module', this.settings);

    // get vendor specific events
    this.animationEnd = this.get_animationEndEvent();

    if (this.settings.autostart) {
      if (this.settings.interval !== 0) {
        this.delay(this.settings.interval);
      } else  {
        this.animate();
      }
    }
    
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Instantiating module', this.settings);
    this.instance = this; // FIXME
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous instance', this.instance);
    this.$element.removeAttr(this.moduleNamespace);
  }

  animate(overrideSettings: boolean = false) {
    this.settings = overrideSettings || this.settings;
    if (!this.is_supported()) {
      this.error(this.settings.error.support);
      return false;
    }
    this.debug('Preparing animation', this.settings.animation);
    if (this.is_animating()) {
      if (this.settings.queue) {
        if (!this.settings.allowRepeats && this.has_direction() && this.is_occurring() && this.queuing !== true) {
          this.debug('Animation is currently occurring, preventing queueing same animation', this.settings.animation);
        }
        else {
          this.queue(this.settings.animation);
        }
        return false;
      } else if (!this.settings.allowRepeats && this.is_occurring()) {
        this.debug('Animation is already occurring, will not execute repeated animation', this.settings.animation);
        return false;
      } else {
        this.debug('New animation started, completing previous early', this.settings.animation);
        this.complete();
      }
    }
    if (this.can_animate()) {
      this.set_animating(this.settings.animation);
    } else {
      this.error(this.settings.error.noAnimation, this.settings.animation, this.$element);
    }
  }

  complete(event: any = false): void {
    this.debug('Animation complete', this.settings.animation);
    this.remove_completeCallback();
    this.remove_failSafe();
    if (!this.is_looping()) {
      if (this.is_outward()) {
        this.verbose('Animation is outward, hiding element');
        this.restore_conditions();
        this.hide();
      } else if (this.is_inward()) {
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
  
  show(display: any = false): void {
    this.verbose('Showing element', display);
    if (this.force_visible()) {
      this.remove_hidden();
      this.set_visible();
      this.invokeCallback('show')(this.element);
      this.invokeCallback('complete')(this.element);
      // module.repaint();
    }
  }

  hide(): void {
    this.verbose('Hiding element');
    if (this.is_animating()) {
      this.reset();
    }
    // IE will trigger focus change if element is not blurred before hiding
    this.$element.trigger('blur');
    this.remove_display();
    this.remove_visible();

    if (this.invokeCallback('before_hide').call(this.element) !== false) {
      this.set_hidden();
      this.force_hidden();
      this.invokeCallback('hide')(this.$element);
      this.invokeCallback('complete')(this.$element);
      // module.repaint(); already commented
    }
  }

  toggle(): void {
    if (this.can_animate()) {
      this.animate();
    } else {
      if (this.is_visible()) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  delay(interval: number = this.settings.interval): void {
    let
      direction: string = this.get_animationDirection(),
      shouldReverse: boolean,
      delay
    ;
    if (direction === '') {
      direction = this.can_transition()
        ? this.get_direction()
        : 'static'
      ;
    }
    shouldReverse = (this.settings.reverse == 'auto' && direction == this.settings.className.outward);
    delay = this.settings.interval
    /*delay = (shouldReverse || this.settings.reverse == true)
      ? ($allModules.length - index) * settings.interval
      : index * this.settings.interval*/
    ;
    this.debug('Delaying animation by', delay);
    setTimeout(this.animate.bind(this), delay);
  }

  queue(animation: string): void {
    this.debug('Queueing animation of', animation);
    this.queuing = true;
    this.$element.one(this.animationEnd + '.queue' + this.eventNamespace, () => {
      this.queuing = false;
      // === module.settings.animation = animation; ===
      //module.repaint(); INVESTIGATE
      this.animate.apply(this, this.settings);
    });
  }

  repaint(): void {
    // SEEMS USELESS
    this.verbose('Repainting element');
    // let
    //   fakeAssignment = element.offsetWidth
    // ;
  }

  forceRepaint(): void {
    this.verbose('Forcing element repaint');
    let
      $parentElement: Cash = this.$element.parent(),
      $nextElement: Cash = this.$element.next()
    ;
    if ($nextElement.length === 0) {
      this.$element.detach().appendTo($parentElement);
    } else {
      this.$element.detach().insertBefore($nextElement);
    }
  }
  
  reset(): void {
    this.debug('Resetting animation to beginning conditions');
    this.remove_animationCallbacks();
    this.restore_conditions();
    this.remove_animating();
  }

  refresh(): void {
    this.verbose('Refreshing display type on next animation');
    // delete this.displayType;
  }

  clear_queue(): void {
    this.debug('Clearing animation queue');
    this.remove_queueCallback();
  }

  enable(): void {
    this.verbose('Starting animation');
    this.$element.removeClass(this.settings.className.disabled);
  }

  disable(): void {
    this.verbose('Stopping animation');
    this.$element.addClass(this.settings.className.disabled);
  }

  stop(): void {
    this.debug('Stopping current animation');
    //$module.triggerHandler(animationEnd); // INVESTIGATE
    // this.$element.trigger(animationEnd);
  }

  stopAll(): void {
    this.debug('Stopping all animation');
    this.remove_queueCallback();
    //$module.triggerHandler(animationEnd); // INVESTIGATE
    // this.$element.trigger(animationEnd);
  }
  
  get_animationEndEvent(): string {
    let
      element     = document.createElement('div'),
      animations  = {
        'animation'       :'animationend',
        'OAnimation'      :'oAnimationEnd',
        'MozAnimation'    :'mozAnimationEnd',
        'WebkitAnimation' :'webkitAnimationEnd'
      },
      animation
    ;
    for (animation in animations) {
      if (element.style[animation] !== undefined) {
        return animations[animation];
      }
    }
    return '';
  }

  get_animationClass(animation: any = false): string {
    let
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

  get_animationDirection(animation: any = this.settings.animation): string {
    let direction: string;

    if (typeof animation === 'string') {
      animation = animation.split(' ');
      // search animation name for out/in class
      animation.forEach(word => {
        if (word === this.settings.className.inward) {
          direction = this.settings.className.inward;
        }
        else if (word === this.settings.className.outward) {
          direction = this.settings.className.outward;
        }
      });
    }
    // return found direction
    if (direction) {
      return direction;
    }
    return '';
  }

  get_currentAnimation() {
    return (this.cache && this.cache.animation !== undefined)
      ? this.cache.animation
      : false
    ;
  }

  get_direction(): string {
    return this.is_hidden() || !this.is_visible()
      ? this.settings.className.inward
      : this.settings.className.outward
    ;
  }

  get_duration(duration: any = this.settings.duration): number {
    if (duration === false) {
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

  get_displayType(shouldDetermine: boolean = true): string {
    if (this.settings.displayType) {
      return this.settings.displayType;
    }
    if (shouldDetermine && this.$element.data(this.settings.metadata.displayType) === undefined) {
      let currentDisplay = this.$element.css('display');
      if (currentDisplay === '' || currentDisplay === 'none') {
      // create fake element to determine display state
        this.can_transition(true);
      } else {
        this.save_displayType(currentDisplay);
      }
    }
    return this.$element.data(this.settings.metadata.displayType);
  }

  get_userStyle(style: any = false): string {
    style = style || this.$element.attr('style') || '';
    return style.replace(/display.*?;/, '');
  }

  set_animating(animation:any = settings.animation): void {
    // remove previous callbacks
    this.remove_completeCallback();

    // determine exact animation
    let animationClass: string = this.get_animationClass(animation);

      // save animation class in cache to restore class names
    this.save_animation(animationClass);

    if (this.force_visible()) {
      this.remove_hidden();
      this.remove_direction();

      this.start_animation(animationClass);
    }
  }

  set_duration(duration = this.settings.duration): void {
    if (duration !== null) {
      this.verbose('Setting animation duration', duration + 'ms');
      this.$element.css({ 'animation-duration': duration + 'ms' });
    }
  }

  set_hidden(): void {
    this.$element
      .addClass(this.settings.className.transition)
      .addClass(this.settings.className.hidden)
    ;
  }

  set_looping(): void {
    this.debug('Transition set to loop');
    this.$element.addClass(this.settings.className.looping);
  }

  set_visible(): void {
    this.$element
      .addClass(this.settings.className.transition)
      .addClass(this.settings.className.visible)
    ;
  }

  is_supported(): boolean {
    return (this.animationEnd !== '');
  }

  is_animating(): boolean {
    return this.$element.hasClass(this.settings.className.animating);
  }

  is_hidden(): boolean {
    return this.$element.css('visibility') === 'hidden';
  }

  is_inward(): boolean {
    return this.$element.hasClass(this.settings.className.inward);
  }

  is_looping(): boolean {
    return this.$element.hasClass(this.settings.className.looping);
  }

  is_occurring(animation: any = this.settings.animation): boolean {
    animation = '.' + animation.replace(' ', '.');
    return ( this.$element.filter(animation).length > 0 );
  }

  is_outward(): boolean {
    return this.$element.hasClass(this.settings.className.outward);
  }

  is_visible(): boolean {
    //return this.$element.is(':visible');
    return this.$element.hasClass('visible');
  }

  has_direction(animation: any = this.settings.animation): boolean {
    let
      hasDirection: boolean = false,
      className = this.settings.className
    ;
    if (typeof animation === 'string') {
      animation = animation.split(' ');
      animation.forEach(word => {
        if (word === className.inward || word === className.outward) {
          hasDirection = true;
        }
      });
    }
    return hasDirection;
  }

  can_animate(): boolean {
    // can transition does not return a value if animation does not exist
    return (this.can_transition() !== undefined);
  }

  can_transition(forced: boolean = false): boolean {
    let
      animation                  = this.settings.animation,
      transitionExists: boolean  = this.get_transitionExists(animation),
      displayType: string        = this.get_displayType(false),
      elementClass,
      tagName,
      $clone,
      currentAnimation,
      inAnimation,
      directionExists
    ;
    if (transitionExists === undefined || forced) {
      this.verbose('Determining whether animation exists');
      elementClass = this.$element.attr('class');
      tagName      = this.$element.prop('tagName');

      $clone = $(`<${tagName} />`).addClass( elementClass ).insertAfter(this.$element);

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
      if (!displayType) {
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
      if (currentAnimation != inAnimation) {
        this.debug('Direction exists for animation', animation);
        directionExists = true;
      } else if (currentAnimation == 'none' || !currentAnimation) {
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

  remove_animating(): void {
    this.$element.removeClass(this.settings.className.animating);
  }

  remove_animationCallbacks(): void {
    this.remove_queueCallback();
    this.remove_completeCallback();
  }

  remove_completeCallback(): void {
    this.$element.off('.complete' + this.eventNamespace);
  }

  remove_direction(): void {
    this.$element
      .removeClass(this.settings.className.inward)
      .removeClass(this.settings.className.outward)
    ;
  }

  remove_display(): void {
    this.$element.css('display', '');
  }

  remove_duration(): void {
    this.$element.css('animation-duration', '');
  }

  remove_failSafe(): void {
    this.verbose('Removing fail safe timer', this.timer);
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  remove_hidden(): void {
    this.$element.removeClass(this.settings.className.hidden);
  }

  remove_looping(): void {
    this.debug('Transitions are no longer looping');
    if (this.is_looping()) {
      this.reset();
      this.$element.removeClass(this.settings.className.looping);
    }
  }

  remove_queueCallback(): void {
    this.$element.off('.queue' + this.eventNamespace);
  }

  remove_transition(): void {
    this.$element
      .removeClass(this.settings.className.transition)
      .removeClass(this.settings.className.visible)
      .removeClass(this.settings.className.hidden)
    ;
  }

  remove_visible(): void {
    this.$element.removeClass(this.settings.className.visible);
  }

  save_animation(animation): void {
    if (!this.cache) {
      this.cache = {};
    }
    this.cache.animation = animation;
  }

  save_displayType(displayType): void {
    if (displayType !== 'none') {
      this.$element.data(this.settings.metadata.displayType, displayType);
    }
  }
  save_transitionExists(animation, exists): void {
    //$.fn.transition.exists[animation] = exists; FIXME
    this.verbose('Saving existence of transition', animation, exists);
  }
  
  force_hidden(): void {
    let
      style: string          = this.$element.attr('style'),
      currentDisplay: string = this.$element.css('display'),
      emptyStyle: boolean    = (style === undefined || style === '')
    ;
    if (currentDisplay !== 'none' && !this.is_hidden()) {
      this.verbose('Overriding default display to hide element');
      this.$element.css('display', 'none');
    } else if (emptyStyle) {
      this.$element.removeAttr('style');
    }
  }

  force_visible(): boolean {
    let
      style: string           = this.$element.attr('style'),
      userStyle: string       = this.get_userStyle(style),
      displayType: string     = this.get_displayType(),
      overrideStyle: string   = userStyle + 'display: ' + displayType + ' !important;',
      inlineDisplay: string   = this.$element[0].style.display,
      mustStayHidden: boolean = displayType == null || (inlineDisplay === 'none' && this.settings.skipInlineHidden) || this.$element[0].tagName.match(/(script|link|style)/i) !== null
    ;
    if (mustStayHidden) {
      this.remove_transition();
      return false;
    }
    this.verbose('Overriding default display to show element', displayType);
    this.$element.attr('style', overrideStyle);
    return true;
  }

  start_animation(animationClass: string = this.get_animationClass()): void {
    this.debug('Starting tween', animationClass);
    this.$element
      .addClass(animationClass)
      .one(this.animationEnd + '.complete' + this.eventNamespace, this.complete.bind(this))
    ;
    if (this.settings.useFailSafe) {
      this.add_failSafe();
    }
    this.set_duration(this.settings.duration);

    //this.invokeCallback('start', element); INVESTIGATE
    this.invokeCallback('start')(this.element);
  }

  add_failSafe(): void {
    let duration: number = this.get_duration();
    this.timer = setTimeout(() => {
      // module.$element.triggerHandler(module.animationEnd); INVESTIGATE
      this.$element.trigger(this.animationEnd);
    }, duration + this.settings.failSafeDelay);
    this.verbose('Adding fail safe timer', this.timer);
  }

  restore_conditions() {
    let animation = this.get_currentAnimation();
    if (animation) {
      this.$element.removeClass(animation);
      this.verbose('Removing animation class', this.cache);
    }
    this.remove_duration();
  }
}
