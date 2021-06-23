'use strict';

import { Module, ModuleOptions } from '../module'
import Utils from '../utils';

import $, { Cash } from 'cash-dom';

export interface VisibilityOptions extends ModuleOptions {
  observeChanges         : boolean;

  // check position immediately on init
  initialCheck           : boolean;

  // whether to refresh calculations after all page images load
  refreshOnLoad          : boolean;

  // whether to refresh calculations after page resize event
  refreshOnResize        : boolean;

  // should call callbacks on refresh event (resize, etc)
  checkOnRefresh         : boolean;

  // callback should only occur one time
  once                   : boolean;

  // callback should fire continuously whe evaluates to true
  continuous             : boolean;

  // offset to use with scroll top
  offset                 : number;

  // whether to include margin in elements position
  includeMargin          : boolean;

  // scroll context for visibility checks
  context                : Window,

  // visibility check delay in ms (defaults to animationFrame)
  throttle               : boolean;

  // special visibility type (image, fixed)
  type                   : 'image' | 'fixed';

  // z-index to use with visibility 'fixed'
  zIndex                 : number;

  // image only animation settings
  transition             : string;
  duration               : number;

  metadata : {
    src: string;
  },

  className: {
    fixed       : string;
    placeholder : string;
    visible     : string;
  },

  error : {
    method  : string;
    visible : string;
  },

  // array of callbacks for percentage
  onPassed               : {},

  // standard callbacks
  onOnScreen             : Function;
  onOffScreen            : Function;
  onPassing              : Function;
  onTopVisible           : Function;
  onBottomVisible        : Function;
  onTopPassed            : Function;
  onBottomPassed         : Function;

  // reverse callbacks
  onPassingReverse       : Function;
  onTopVisibleReverse    : Function;
  onBottomVisibleReverse : Function;
  onTopPassedReverse     : Function;
  onBottomPassedReverse  : Function;

  // special callbacks for image
  onLoad                 : Function;
  onAllLoaded            : Function;

  // special callbacks for fixed position
  onFixed                : Function;
  onUnfixed              : Function;

  // utility callbacks
  onUpdate               : Function;
  onRefresh              : Function;
}

const default_settings: VisibilityOptions = {
  name                   : 'Visibility',
  namespace              : 'visibility',

  silent                 : false,
  debug                  : false,
  verbose                : false,
  performance            : true,

  // whether to use mutation observers to follow changes
  observeChanges         : true,

  // check position immediately on init
  initialCheck           : true,

  // whether to refresh calculations after all page images load
  refreshOnLoad          : true,

  // whether to refresh calculations after page resize event
  refreshOnResize        : true,

  // should call callbacks on refresh event (resize, etc)
  checkOnRefresh         : true,

  // callback should only occur one time
  once                   : true,

  // callback should fire continuously whe evaluates to true
  continuous             : false,

  // offset to use with scroll top
  offset                 : 0,

  // whether to include margin in elements position
  includeMargin          : false,

  // scroll context for visibility checks
  context                : window,

  // visibility check delay in ms (defaults to animationFrame)
  throttle               : false,

  // special visibility type (image, fixed)
  type                   : null,

  // z-index to use with visibility 'fixed'
  zIndex                 : 10,

  // image only animation settings
  transition             : 'fade in',
  duration               : 1000,

  metadata : {
    src: 'src'
  },

  className: {
    fixed       : 'fixed',
    placeholder : 'constraint',
    visible     : 'visible'
  },

  error : {
    method  : 'The method you called is not defined.',
    visible : 'Element is hidden, you must call refresh after element becomes visible'
  },

  // array of callbacks for percentage
  onPassed               : {},

  // standard callbacks
  onOnScreen             : null,
  onOffScreen            : null,
  onPassing              : null,
  onTopVisible           : null,
  onBottomVisible        : null,
  onTopPassed            : null,
  onBottomPassed         : null,

  // reverse callbacks
  onPassingReverse       : null,
  onTopVisibleReverse    : null,
  onBottomVisibleReverse : null,
  onTopPassedReverse     : null,
  onBottomPassedReverse  : null,

  // special callbacks for image
  onLoad                 : function() {},
  onAllLoaded            : function() {},

  // special callbacks for fixed position
  onFixed                : function() {},
  onUnfixed              : function() {},

  // utility callbacks
  onUpdate               : null, // disabled by default for performance
  onRefresh              : function(){}
}

export class Visibility extends Module {
settings: VisibilityOptions;

  $window: Cash = $(window);
  $placeholder: Cash;
  $context: Cash;

  contextObserver: MutationObserver;
  observer: MutationObserver;

  disabled: boolean = false;

  cache: any;
  timer;

  instance: Visibility;

  constructor(selector: string, parameters: any) {
    super(selector, parameters, default_settings);

    this.$context = $(this.settings.context);
    
    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing', this.settings);
  
    this.setup_cache();

    if (this.should_trackChanges()) {

      if (this.settings.type == 'image') {
        this.setup_image();
      }
      if (this.settings.type == 'fixed') {
        this.setup_fixed();
      }

      if (this.settings.observeChanges) {
        this.observeChanges();
      }
      this.bind_events();
    }

    this.save_position();
    if (!this.is_visible()) {
      this.error(this.settings.error.visible, this.$element);
    }

    if (this.settings.initialCheck) {
      this.checkVisibility();
    }
    this.instantiate();
  }

  instantiate() {
    this.debug('Storing instance', this);
    this.$element.data(this.moduleNamespace, this);
    this.instance = this;
  }

  destroy() {
    this.verbose('Destroying previous module');
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.contextObserver) {
      this.contextObserver.disconnect();
    }
    this.$window
      .off('load'   + this.eventNamespace, this.event_load)
      .off('resize' + this.eventNamespace, this.event_resize)
    ;
    this.$context
      .off('scroll'       + this.eventNamespace, this.event_scroll)
      .off('scrollchange' + this.eventNamespace, this.event_scrollchange)
    ;
    if (this.settings.type == 'fixed') {
      this.resetFixed();
      this.remove_placeholder();
    }
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
  }

  setup_cache() {
    this.cache = {
      occurred : {},
      screen   : {},
      element  : {},
    };
  }

  setup_image() {
    let src = this.$element.data(this.settings.metadata.src);
    if (src) {
      this.verbose('Lazy loading image', src);
      this.settings.once           = true;
      this.settings.observeChanges = false;

      // show when top visible
      this.settings.onOnScreen = () => {
        this.debug('Image on screen', this.element);
        this.precache(src, () => {
          this.set_image(src, function() {
            loadedCount++;
            if(loadedCount == moduleCount) {
              this.settings.onAllLoaded.call(this);
            }
            this.settings.onLoad.call(this);
          });
        });
      };
    }
  }

  setup_fixed() {
    this.debug('Setting up fixed');
    this.settings.once           = false;
    this.settings.observeChanges = false;
    this.settings.initialCheck   = true;
    this.settings.refreshOnLoad  = true;
    if (!this.settings.parameters.transition) {
      this.settings.transition = false;
    }
    this.create_placeholder();
    this.debug('Added placeholder', this.$placeholder);
    this.settings.onTopPassed = () => {
      this.debug('Element passed, adding fixed position', this.$element);
      this.show_placeholder();
      this.set_fixed();
      if (this.settings.transition) {
        if($.fn.transition !== undefined) {
          $module.transition(this.settings.transition, this.settings.duration);
        }
      }
    };
    this.settings.onTopPassedReverse = () => {
      this.debug('Element returned to position, removing fixed', this.$element);
      this.hide_placeholder();
      this.remove_fixed();
    };
  }

  create_placeholder() {
    this.verbose('Creating fixed position placeholder');
    this.$placeholder = this.$element
      .clone(false)
      .css('display', 'none')
      .addClass(this.settings.className.placeholder)
      .insertAfter(this.$element)
    ;
  }

  checkVisibility(scroll) {
    this.verbose('Checking visibility of element', this.cache.element);
  
    if (!this.disabled && this.is_visible()) {

      // save scroll position
      this.save_scroll(scroll);

      // update calculations derived from scroll
      this.save_calculations();

      // percentage
      this.passed();

      // reverse (must be first)
      this.passingReverse();
      this.topVisibleReverse();
      this.bottomVisibleReverse();
      this.topPassedReverse();
      this.bottomPassedReverse();

      // one time
      this.onScreen();
      this.offScreen();
      this.passing();
      this.topVisible();
      this.bottomVisible();
      this.topPassed();
      this.bottomPassed();

      // on update callback
      if (this.settings.onUpdate) {
        this.settings.onUpdate.call(this.element, this.get_elementCalculations());
      }
    }
  }

  show_placeholder() {
    this.verbose('Showing placeholder');
    this.$placeholder
      .css('display', 'block')
      .css('visibility', 'hidden')
    ;
  }

  hide_placeholder() {
    this.verbose('Hiding placeholder');
    this.$placeholder
      .css('display', 'none')
      .css('visibility', '')
    ;
  }

  is_onScreen(): boolean {
    let calculations = this.get_elementCalculations();
    return calculations.onScreen;
  }

  is_offScreen(): boolean {
    let calculations = this.get_elementCalculations();
    return calculations.offScreen;
  }

  is_visible(): boolean {
    if (this.cache && this.cache.element) {
      return !(this.cache.element.width === 0 && this.cache.element.offset.top === 0);
    }
    return false;
  }

  is_verticallyScrollableContext(): boolean {
    let
      overflowY = (this.$context.get(0) !== window)
        ? this.$context.css('overflow-y')
        : false
    ;
    return (overflowY == 'auto' || overflowY == 'scroll');
  }

  is_horizontallyScrollableContext(): boolean {
    let
      overflowX = (this.$context.get(0) !== window)
        ? this.$context.css('overflow-x')
        : false
    ;
    return (overflowX == 'auto' || overflowX == 'scroll');
  }

  should_trackChanges(): boolean {
    if (methodInvoked) {
      this.debug('One time query, no need to bind events');
      return false;
    }
    this.debug('Callbacks being attached');
    return true;
  }

  observeChanges() {
    if ('MutationObserver' in window) {
      this.contextObserver = new MutationObserver(this.event_contextChanged);
      this.observer        = new MutationObserver(this.event_changed);
      this.contextObserver.observe(document, {
        childList : true,
        subtree   : true
      });
      this.observer.observe(this.element, {
        childList : true,
        subtree   : true
      });
      this.debug('Setting up mutation observer', this.observer);
    }
  }

  bind_events() {
    this.verbose('Binding visibility events to scroll and resize');
    if (this.settings.refreshOnLoad) {
      this.$window.on('load' + this.eventNamespace, this.event_load);
    }
    this.$window.on('resize' + this.eventNamespace, this.event_resize)
    ;
    // pub/sub pattern
    this.$context
      .off('scroll'      + this.eventNamespace)
      .on('scroll'       + this.eventNamespace, this.event_scroll)
      .on('scrollchange' + this.eventNamespace, this.event_scrollchange)
    ;
  }

  event_changed(mutations) {
    this.verbose('DOM tree modified, updating visibility calculations');
    this.timer = setTimeout(() => {
      this.verbose('DOM tree modified, updating sticky menu');
      this.refresh();
    }, 100);
  }

  event_contextChanged(mutations) {
    [].forEach.call(mutations, (mutation) => {
      if (mutation.removedNodes) {
        [].forEach.call(mutation.removedNodes, (node) => {
          if(node == this.element || $(node).find(this.element).length > 0) {
            this.debug('Element removed from DOM, tearing down events');
            this.destroy();
          }
        });
      }
    });
  }

  event_resize() {
    this.debug('Window resized');
    if (this.settings.refreshOnResize) {
      requestAnimationFrame(this.refresh);
    }
  }

  event_load() {
    this.debug('Page finished loading');
    requestAnimationFrame(this.refresh);
  }

  // publishes scrollchange event on one scroll
  event_scroll() {
    if (this.settings.throttle) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.$context.triggerHandler('scrollchange' + this.eventNamespace, [ this.$context.scrollTop() ]);
      }, this.settings.throttle);
    }
    else {
      requestAnimationFrame(() => {
        this.$context.triggerHandler('scrollchange' + this.eventNamespace, [ this.$context.scrollTop() ]);
      });
    }
  }

  // subscribes to scrollchange
  event_scrollchange(event, scrollPosition) {
    this.checkVisibility(scrollPosition);
  }

  precache(images, callback) {
    if (!(images instanceof Array)) {
      images = [images];
    }
    let
      imagesLength  = images.length,
      loadedCounter = 0,
      cache         = [],
      cacheImage    = document.createElement('img'),
      handleLoad    = () => {
        loadedCounter++;
        if (loadedCounter >= images.length) {
          if ($.isFunction(callback)) {
            callback();
          }
        }
      }
    ;
    while (imagesLength--) {
      cacheImage         = document.createElement('img');
      cacheImage.onload  = handleLoad;
      cacheImage.onerror = handleLoad;
      cacheImage.src     = images[imagesLength];
      cache.push(cacheImage);
    }
  }

  enableCallbacks() {
    this.debug('Allowing callbacks to occur');
    this.disabled = false;
  }

  disableCallbacks() {
    this.debug('Disabling all callbacks temporarily');
    this.disabled = true;
  }

  refresh() {
    this.debug('Refreshing constants (width/height)');
    if (this.settings.type == 'fixed') {
      this.resetFixed();
    }
    this.reset();
    this.save_position();
    if (this.settings.checkOnRefresh) {
      this.checkVisibility();
    }
    this.settings.onRefresh.call(this.element);
  }

  resetFixed () {
    this.remove_fixed();
    this.remove_occurred();
  }

  reset() {
    this.verbose('Resetting all cached values');
    if ($.isPlainObject(this.cache)) {
      this.cache.screen = {};
      this.cache.element = {};
    }
  }

  passed(amount = undefined, newCallback = undefined) {
    let calculations = this.get_elementCalculations();
    // assign callback
    if (amount && newCallback) {
      this.settings.onPassed[amount] = newCallback;
    }
    else if (amount !== undefined) {
      return (this.get_pixelsPassed(amount) > calculations.pixelsPassed);
    }
    else if (calculations.passing) {
      $.each(this.settings.onPassed, (amount, callback) => {
        if(calculations.bottomVisible || calculations.pixelsPassed > this.get_pixelsPassed(amount)) {
          this.execute(callback, amount);
        }
        else if(!this.settings.once) {
          this.remove_occurred(callback);
        }
      });
    }
  }

  onScreen(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onOnScreen,
      callbackName = 'onScreen'
    ;
    if (newCallback) {
      this.debug('Adding callback for onScreen', newCallback);
       this.settings.onOnScreen = newCallback;
    }
    if (calculations.onScreen) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback !== undefined) {
      return calculations.onOnScreen;
    }
  }

  offScreen(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onOffScreen,
      callbackName = 'offScreen'
    ;
    if (newCallback) {
      this.debug('Adding callback for offScreen', newCallback);
      this.settings.onOffScreen = newCallback;
    }
    if (calculations.offScreen) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback !== undefined) {
      return calculations.onOffScreen;
    }
  }

  passing(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onPassing,
      callbackName = 'passing'
    ;
    if (newCallback) {
      this.debug('Adding callback for passing', newCallback);
      this.settings.onPassing = newCallback;
    }
    if (calculations.passing) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback !== undefined) {
      return calculations.passing;
    }
  }

  topVisible(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onTopVisible,
      callbackName = 'topVisible'
    ;
    if (newCallback) {
      this.debug('Adding callback for top visible', newCallback);
      this.settings.onTopVisible = newCallback;
    }
    if (calculations.topVisible) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return calculations.topVisible;
    }
  }

  bottomVisible(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onBottomVisible,
      callbackName = 'bottomVisible'
    ;
    if (newCallback) {
      this.debug('Adding callback for bottom visible', newCallback);
      this.settings.onBottomVisible = newCallback;
    }
    if (calculations.bottomVisible) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return calculations.bottomVisible;
    }
  }

  topPassed(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onTopPassed,
      callbackName = 'topPassed'
    ;
    if (newCallback) {
      this.debug('Adding callback for top passed', newCallback);
      this.settings.onTopPassed = newCallback;
    }
    if (calculations.topPassed) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return calculations.topPassed;
    }
  }

  bottomPassed(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onBottomPassed,
      callbackName = 'bottomPassed'
    ;
    if (newCallback) {
      this.debug('Adding callback for bottom passed', newCallback);
      this.settings.onBottomPassed = newCallback;
    }
    if (calculations.bottomPassed) {
      this.execute(callback, callbackName);
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return calculations.bottomPassed;
    }
  }

  passingReverse(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onPassingReverse,
      callbackName = 'passingReverse'
    ;
    if (newCallback) {
      this.debug('Adding callback for passing reverse', newCallback);
      this.settings.onPassingReverse = newCallback;
    }
    if (!calculations.passing) {
      if (this.get_occurred('passing')) {
        this.execute(callback, callbackName);
      }
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback !== undefined) {
      return !calculations.passing;
    }
  }

  topVisibleReverse(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onTopVisibleReverse,
      callbackName = 'topVisibleReverse'
    ;
    if (newCallback) {
      this.debug('Adding callback for top visible reverse', newCallback);
      this.settings.onTopVisibleReverse = newCallback;
    }
    if (!calculations.topVisible) {
      if (this.get_occurred('topVisible')) {
        this.execute(callback, callbackName);
      }
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return !calculations.topVisible;
    }
  }

  bottomVisibleReverse(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onBottomVisibleReverse,
      callbackName = 'bottomVisibleReverse'
    ;
    if (newCallback) {
      this.debug('Adding callback for bottom visible reverse', newCallback);
      this.settings.onBottomVisibleReverse = newCallback;
    }
    if (!calculations.bottomVisible) {
      if (this.get_occurred('bottomVisible')) {
        this.execute(callback, callbackName);
      }
    }
    else if(!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return !calculations.bottomVisible;
    }
  }

  topPassedReverse(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback ||this. settings.onTopPassedReverse,
      callbackName = 'topPassedReverse'
    ;
    if (newCallback) {
      this.debug('Adding callback for top passed reverse', newCallback);
      this.settings.onTopPassedReverse = newCallback;
    }
    if (!calculations.topPassed) {
      if (this.get_occurred('topPassed')) {
        this.execute(callback, callbackName);
      }
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if(newCallback === undefined) {
      return !calculations.onTopPassed;
    }
  }

  bottomPassedReverse(newCallback = undefined) {
    let
      calculations = this.get_elementCalculations(),
      callback     = newCallback || this.settings.onBottomPassedReverse,
      callbackName = 'bottomPassedReverse'
    ;
    if (newCallback) {
      this.debug('Adding callback for bottom passed reverse', newCallback);
      this.settings.onBottomPassedReverse = newCallback;
    }
    if (!calculations.bottomPassed) {
      if (this.get_occurred('bottomPassed')) {
        this.execute(callback, callbackName);
      }
    }
    else if (!this.settings.once) {
      this.remove_occurred(callbackName);
    }
    if (newCallback === undefined) {
      return !calculations.bottomPassed;
    }
  }

  execute(callback, callbackName) {
    let
      calculations = this.get_elementCalculations(),
      screen       = this.get_screenCalculations()
    ;
    callback = callback || false;
    if (callback) {
      if (this.settings.continuous) {
        this.debug('Callback being called continuously', callbackName, calculations);
        callback.call(this.element, calculations, screen);
      }
      else if (!this.get_occurred(callbackName)) {
        this.debug('Conditions met', callbackName, calculations);
        callback.call(this.element, calculations, screen);
      }
    }
    this.save_occurred(callbackName);
  }

  get_pixelsPassed(amount) {
    let element = this.get_elementCalculations();
    if (amount.search('%') > -1) {
      return (element.height * (parseInt(amount, 10) / 100));
    }
    return parseInt(amount, 10);
  }

  get_occurred(callback) {
    return (this.cache.occurred !== undefined)
      ? this.cache.occurred[callback] || false
      : false
    ;
  }

  get_direction() {
    if (this.cache.direction === undefined) {
      this.save_direction();
    }
    return this.cache.direction;
  }

  get_elementPosition() {
    if (this.cache.element === undefined) {
      this.save_elementPosition();
    }
    return this.cache.element;
  }

  get_elementCalculations() {
    if (this.cache.element === undefined) {
      this.save_elementCalculations();
    }
    return this.cache.element;
  }

  get_screenCalculations() {
    if (this.cache.screen === undefined) {
      this.save_screenCalculations();
    }
    return this.cache.screen;
  }

  get_screenSize() {
    if (this.cache.screen === undefined) {
      this.save_screenSize();
    }
    return this.cache.screen;
  }

  get_scroll() {
    if (this.cache.scroll === undefined) {
      this.save_scroll();
    }
    return this.cache.scroll;
  }

  get_lastScroll() {
    if (this.cache.screen === undefined) {
      this.debug('First scroll event, no last scroll could be found');
      return false;
    }
    return this.cache.screen.top;
  }

  set_fixed() {
    this.verbose('Setting element to fixed position');
    this.$element
      .addClass(this.settings.className.fixed)
      .css({
        position : 'fixed',
        top      : this.settings.offset + 'px',
        left     : 'auto',
        zIndex   : this.settings.zIndex
      })
    ;
    this.settings.onFixed.call(this.element);
  }

  set_image(src, callback) {
    this.$element.attr('src', src);
    if (this.settings.transition) {
      if ($.fn.transition !== undefined) {
        if (this.$element.hasClass(this.settings.className.visible)) {
          this.debug('Transition already occurred on this image, skipping animation');
          return;
        }
        this.$element.transition(this.settings.transition, this.settings.duration, callback);
      }
      else {
        Utils.fadeIn(this.$element, this.settings.duration, 'linear', callback);
      }
    }
    else {
      this.$element.show();
    }
  }

  save_calculations() {
    this.verbose('Saving all calculations necessary to determine positioning');
    this.save_direction();
    this.save_screenCalculations();
    this.save_elementCalculations();
  }

  save_occurred(callback) {
    if (callback) {
      if (this.cache.occurred[callback] === undefined || (this.cache.occurred[callback] !== true)) {
        this.verbose('Saving callback occurred', callback);
        this.cache.occurred[callback] = true;
      }
    }
  }

  save_scroll(scrollPosition) {
    scrollPosition      = scrollPosition + this.settings.offset || this.$context.scrollTop() + this.settings.offset;
    this.cache.scroll = scrollPosition;
  }

  save_direction() {
    let
      scroll     = this.get_scroll(),
      lastScroll = this.get_lastScroll(),
      direction
    ;
    if (scroll > lastScroll && lastScroll) {
      direction = 'down';
    }
    else if (scroll < lastScroll && lastScroll) {
      direction = 'up';
    }
    else {
      direction = 'static';
    }
    this.cache.direction = direction;
    return this.cache.direction;
  }

  save_elementPosition() {
    let
      element = this.cache.element,
      screen  = this.get_screenSize()
    ;
    this.verbose('Saving element position');
    // (quicker than $.extend)
    element.fits          = (element.height < screen.height);
    element.offset        = this.$element.offset();
    element.width         = this.$element.outerWidth();
    element.height        = this.$element.outerHeight();
    // compensate for scroll in context
    if (this.is_verticallyScrollableContext()) {
      element.offset.top += this.$context.scrollTop() - this.$context.offset().top;
    }
    if (this.is_horizontallyScrollableContext()) {
      element.offset.left += this.$context.scrollLeft() - this.$context.offset().left;
    }
    // store
    this.cache.element = element;
    return element;
  }

  save_elementCalculations() {
    let
      screen     = this.get_screenCalculations(),
      element    = this.get_elementPosition()
    ;
    // offset
    if (this.settings.includeMargin) {
      element.margin        = {};
      element.margin.top    = parseInt(this.$element.css('margin-top'), 10);
      element.margin.bottom = parseInt(this.$element.css('margin-bottom'), 10);
      element.top    = element.offset.top - element.margin.top;
      element.bottom = element.offset.top + element.height + element.margin.bottom;
    }
    else {
      element.top    = element.offset.top;
      element.bottom = element.offset.top + element.height;
    }

    // visibility
    element.topPassed        = (screen.top >= element.top);
    element.bottomPassed     = (screen.top >= element.bottom);
    element.topVisible       = (screen.bottom >= element.top) && !element.topPassed;
    element.bottomVisible    = (screen.bottom >= element.bottom) && !element.bottomPassed;
    element.pixelsPassed     = 0;
    element.percentagePassed = 0;

    // meta calculations
    element.onScreen  = ((element.topVisible || element.passing) && !element.bottomPassed);
    element.passing   = (element.topPassed && !element.bottomPassed);
    element.offScreen = (!element.onScreen);

    // passing calculations
    if (element.passing) {
      element.pixelsPassed     = (screen.top - element.top);
      element.percentagePassed = (screen.top - element.top) / element.height;
    }
    this.cache.element = element;
    this.verbose('Updated element calculations', element);
    return element;
  }

  save_screenCalculations() {
    let scroll = this.get_scroll();
    this.save_direction();
    this.cache.screen.top    = scroll;
    this.cache.screen.bottom = scroll + this.cache.screen.height;
    return this.cache.screen;
  }

  save_screenSize() {
    this.verbose('Saving window position');
    this.cache.screen = {
      height: this.$context.height()
    };
  }

  save_position() {
    this.save_screenSize();
    this.save_elementPosition();
  }

  remove_fixed() {
    this.debug('Removing fixed position');
    this.$element
      .removeClass(this.settings.className.fixed)
      .css({
        position : '',
        top      : '',
        left     : '',
        zIndex   : ''
      })
    ;
    this.settings.onUnfixed.call(this.element);
  }

  remove_placeholder() {
    this.debug('Removing placeholder content');
    if (this.$placeholder) {
      this.$placeholder.remove();
    }
  }

  remove_occurred(callback) {
    if (callback) {
      let occurred = this.cache.occurred;
      if (occurred[callback] !== undefined && occurred[callback] === true) {
        this.debug('Callback can now be called again', callback);
        this.cache.occurred[callback] = false;
      }
    }
    else {
      this.cache.occurred = {};
    }
  }
}
