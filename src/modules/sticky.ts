"use strict";

import { Module, ModuleOptions } from '../module'

import $, { Cash } from 'cash-dom';

export interface StickyOptions extends ModuleOptions {
  // whether to stick in the opposite direction on scroll up
  pushing        : boolean;

  context        : string;
  container      : string;

  // Context to watch scroll events
  scrollContext  : Window;

  // Offset to adjust scroll
  offset         : number;

  // Offset to adjust scroll when attached to bottom of screen
  bottomOffset   : number;

  // will only set container height if difference between context and container is larger than this number
  jitter         : number;

  // set width of sticky element when it is fixed to page (used to make sure 100% width is maintained if no fixed size set)
  setSize        : boolean;

  // Whether to automatically observe changes with Mutation Observers
  observeChanges : boolean;

  // Called when position is recalculated
  onReposition   : Function;

  // Called on each scroll
  onScroll       : Function;

  // Called when element is stuck to viewport
  onStick        : Function;

  // Called when element is unstuck from viewport
  onUnstick      : Function;

  // Called when element reaches top of context
  onTop          : Function;

  // Called when element reaches bottom of context
  onBottom       : Function;

  error         : {
    container      : string;
    visible        : string;
    method         : string;
    invalidContext : string;
    elementSize    : string;
  },

  className : {
    bound     : string;
    fixed     : string;
    supported : string;
    top       : string;
    bottom    : string;
  },

  events: Array<string>;
}

const default_settings: StickyOptions = {
  name           : 'Sticky',
  namespace      : 'sticky',

  silent         : false,
  debug          : false,
  verbose        : true,
  performance    : true,

  // whether to stick in the opposite direction on scroll up
  pushing        : false,

  context        : null,
  container      : null,

  // Context to watch scroll events
  scrollContext  : window,

  // Offset to adjust scroll
  offset         : 0,

  // Offset to adjust scroll when attached to bottom of screen
  bottomOffset   : 0,

  // will only set container height if difference between context and container is larger than this number
  jitter         : 5,

  // set width of sticky element when it is fixed to page (used to make sure 100% width is maintained if no fixed size set)
  setSize        : true,

  // Whether to automatically observe changes with Mutation Observers
  observeChanges : false,

  // Called when position is recalculated
  onReposition   : function() {},

  // Called on each scroll
  onScroll       : function() {},

  // Called when element is stuck to viewport
  onStick        : function() {},

  // Called when element is unstuck from viewport
  onUnstick      : function() {},

  // Called when element reaches top of context
  onTop          : function() {},

  // Called when element reaches bottom of context
  onBottom       : function() {},

  error         : {
    container      : 'Sticky element must be inside a relative container',
    visible        : 'Element is hidden, you must call refresh after element becomes visible. Use silent setting to surpress this warning in production.',
    method         : 'The method you called is not defined.',
    invalidContext : 'Context specified does not exist',
    elementSize    : 'Sticky element is larger than its container, cannot create sticky.'
  },

  className : {
    bound     : 'bound',
    fixed     : 'fixed',
    supported : 'native',
    top       : 'top',
    bottom    : 'bottom'
  },

  events: ['reposition', 'scroll', 'stick', 'unstick', 'top', 'bottom']
}

export class Sticky extends Module {
  settings: StickyOptions;

  $window: Cash = $(window);
  $container: Cash;
  $context: Cash;
  $scroll: Cash;

  documentObserver: MutationObserver;
  observer: MutationObserver;

  cache: any;
  elementScroll;
  lastScroll;
  timer;

  instance: Sticky;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$scroll = $(this.settings.scrollContext);

    this.initialize();
  }

  initialize(): void {
    this.determineContainer();
    this.determineContext();
    this.verbose('Initializing sticky', this.settings, this.$container);

    this.save_positions();
    this.checkErrors();
    this.bind_events();

    if (this.settings.observeChanges) {
      this.observeChanges();
    }
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous instance');
    this.reset();
    if (this.documentObserver) {
      this.documentObserver.disconnect();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    this.$window
      .off('load' + this.eventNamespace, this.event_load.bind(this))
      .off('resize' + this.eventNamespace, this.event_resize.bind(this))
    ;
    this.$scroll.off('scrollchange' + this.eventNamespace, this.event_scrollchange.bind(this));
    this.$element.removeAttr(this.moduleNamespace);
  }

  determineContainer(): void {
    if (this.settings.container) {
      this.$container = $(this.settings.container);
    }
    else {
      this.$container = this.$element.offsetParent();
    }
  }

  determineContext(): void {
    if (this.settings.context) {
      this.$context = $(this.settings.context);
    }
    else {
      this.$context = this.$container;
    }
    if (this.$context.length === 0) {
      this.error(this.settings.error.invalidContext, this.settings.context, this.$element);
      return;
    }
  }

  save_elementScroll(scroll) {
    this.elementScroll = scroll;
  }

  save_lastScroll(scroll) {
    this.lastScroll = scroll;
  }

  save_positions(): void {
    let
      scrollContext: any = {
        height : this.$scroll.height()
      },
      element = {
        margin: {
          top    : parseInt(this.$element.css('margin-top'), 10),
          bottom : parseInt(this.$element.css('margin-bottom'), 10),
        },
        offset : this.$element.offset(),
        width  : this.$element.outerWidth(),
        height : this.$element.outerHeight()
      },
      context = {
        offset : this.$context.offset(),
        height : this.$context.outerHeight()
      }
    ;
    if (!this.is_standardScroll()) {
      this.debug('Non-standard scroll. Removing scroll offset from element offset');

      scrollContext.top  = this.settings.scrollContext.scrollY;
      scrollContext.left = this.settings.scrollContext.scrollX;

      element.offset.top  += scrollContext.top;
      context.offset.top  += scrollContext.top;
      element.offset.left += scrollContext.left;
      context.offset.left += scrollContext.left;
    }
    this.cache = {
      fits          : ( (element.height + this.settings.offset) <= scrollContext.height),
      sameHeight    : (element.height == context.height),
      scrollContext : {
        height : scrollContext.height
      },
      element: {
        margin : element.margin,
        top    : element.offset.top - element.margin.top,
        left   : element.offset.left,
        width  : element.width,
        height : element.height,
        bottom : element.offset.top + element.height
      },
      context: {
        top           : context.offset.top,
        height        : context.height,
        bottom        : context.offset.top + context.height
      }
    };
    this.set_containerSize();

    this.stick();
    this.debug('Caching element positions', this.cache);
  }

  checkErrors(): void {
    if (this.is_hidden()) {
      this.error(this.settings.error.visible, this.$element);
    }
    if (this.cache.element.height > this.cache.context.height) {
      this.reset();
      this.error(this.settings.error.elementSize, this.$element);
      return;
    }
  }

  bind_events(): void {
    this.$window
      .on('load' + this.eventNamespace, this.event_load.bind(this))
      .on('resize' + this.eventNamespace, this.event_resize.bind(this))
    ;
    // pub/sub pattern
    this.$scroll
      .off('scroll' + this.eventNamespace)
      .on('scroll' + this.eventNamespace, this.event_scroll.bind(this))
      .on('scrollchange' + this.eventNamespace, this.event_scrollchange.bind(this))
    ;
  }

  event_load(): void {
    this.verbose('Page contents finished loading');
    requestAnimationFrame(this.refresh.bind(this));
  }

  event_resize() {
    this.verbose('Window resized');
    requestAnimationFrame(this.refresh.bind(this));
  }

  event_scroll(): void {
    requestAnimationFrame(() => {
      //this.$scroll.triggerHandler('scrollchange' + this.eventNamespace, this.$scroll.scrollY ); INVESTIGATE
      this.$scroll.trigger('scrollchange' + this.eventNamespace, this.settings.scrollContext.scrollY);
    });
  }

  event_scrollchange(_event, scrollPosition): void {
    this.stick(scrollPosition);
    this.settings.onScroll.call(this.element);
  }

  event_changed(mutations): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.verbose('DOM tree modified, updating sticky menu', mutations);
      this.refresh();
    }, 100);
  }

  event_documentChanged(mutations): void {
    [].forEach.call(mutations, (mutation) => {
      if (mutation.removedNodes) {
        [].forEach.call(mutation.removedNodes, (node) => {
          if (node == this.element || $(node).find(this.selector).length > 0) {
            this.debug('Element removed from DOM, tearing down events');
            this.destroy();
          }
        });
      }
    });
  }

  observeChanges(): void {
    if ('MutationObserver' in window) {
      this.documentObserver = new MutationObserver(this.event_documentChanged.bind(this));
      this.observer         = new MutationObserver(this.event_changed.bind(this));
      this.documentObserver.observe(document, {
        childList : true,
        subtree   : true
      });
      this.observer.observe(this.element, {
        childList : true,
        subtree   : true
      });
      this.observer.observe(this.$context[0], {
        childList : true,
        subtree   : true
      });
      this.debug('Setting up mutation observer', this.observer);
    }
  }

  reset(): void {
    this.debug('Resetting elements position');
    this.unbind();
    this.unfix();
    this.resetCSS();
    this.remove_offset();
    this.remove_lastScroll();
  }

  refresh(hardRefresh: boolean = false): void {
    this.reset();
    if (!this.settings.context) {
      this.determineContext();
    }
    if (hardRefresh) {
      this.determineContainer();
    }
    this.save_positions();
    this.stick();
    this.settings.onReposition.call(this.element);
  }

  stick(scroll = undefined): void {
    let
      cachedPosition = scroll || (this.settings.scrollContext == window ? 0 : this.settings.scrollContext.scrollY),
      cache          = this.cache,
      fits           = cache.fits,
      sameHeight     = cache.sameHeight,
      element        = cache.element,
      scrollContext  = cache.scrollContext,
      context        = cache.context,
      offset         = (this.is_bottom() && this.settings.pushing)
        ? this.settings.bottomOffset
        : this.settings.offset
    ;
      
    scroll         = {
      top    : cachedPosition + offset,
      bottom : cachedPosition + offset + scrollContext.height
    };

    let
      elementScroll  = (fits)
        ? 0
        : this.get_elementScroll(scroll.top),

      // shorthand
      doesntFit      = !fits,
      elementVisible = (element.height !== 0)
    ;
    if (elementVisible && !sameHeight) {

      if (this.is_initialPosition() ) {
        if (scroll.top >= context.bottom) {
          this.debug('Initial element position is bottom of container');
          this.bindBottom();
        }
        else if (scroll.top > element.top) {
          if ((element.height + scroll.top - elementScroll) >= context.bottom) {
            this.debug('Initial element position is bottom of container');
            this.bindBottom();
          }
          else {
            this.debug('Initial element position is fixed');
            this.fixTop();
          }
        }

      }
      else if (this.is_fixed()) {

        // currently fixed top
        if (this.is_top() ) {
          if (scroll.top <= element.top) {
            this.debug('Fixed element reached top of container');
            this.setInitialPosition();
          }
          else if ((element.height + scroll.top - elementScroll) >= context.bottom) {
            this.debug('Fixed element reached bottom of container');
            this.bindBottom();
          }
          // scroll element if larger than screen
          else if (doesntFit) {
            this.set_scroll(elementScroll);
            this.save_lastScroll(scroll.top);
            this.save_elementScroll(elementScroll);
          }
        }

        // currently fixed bottom
        else if (this.is_bottom()) {

          // top edge
          if ((scroll.bottom - element.height) <= element.top) {
            this.debug('Bottom fixed rail has reached top of container');
            this.setInitialPosition();
          }
          // bottom edge
          else if (scroll.bottom >= context.bottom) {
            this.debug('Bottom fixed rail has reached bottom of container');
            this.bindBottom();
          }
          // scroll element if larger than screen
          else if (doesntFit) {
            this.set_scroll(elementScroll);
            this.save_lastScroll(scroll.top);
            this.save_elementScroll(elementScroll);
          }

        }
      }
      else if (this.is_bottom()) {
        if (scroll.top <= element.top) {
          this.debug('Jumped from bottom fixed to top fixed, most likely used home/end button');
          this.setInitialPosition();
        }
        else {
          if (this.settings.pushing) {
            if (this.is_bound() && scroll.bottom <= context.bottom) {
              this.debug('Fixing bottom attached element to bottom of browser.');
              this.fixBottom();
            }
          }
          else {
            if (this.is_bound() && (scroll.top <= context.bottom - element.height)) {
              this.debug('Fixing bottom attached element to top of browser.');
              this.fixTop();
            }
          }
        }
      }
    }
  }

  setInitialPosition(): void {
    this.debug('Returning to initial position');
    this.unfix();
    this.unbind();
  }

  fixTop(): void {
    this.debug('Fixing element to top of page');
    if (this.settings.setSize) {
      this.set_size();
    }
    this.set_minimumSize();
    this.set_offset();
    this.$element
      .css({
        left         : this.cache.element.left,
        bottom       : '',
        marginBottom : ''
      })
      .removeClass(this.settings.className.bound)
      .removeClass(this.settings.className.bottom)
      .addClass(this.settings.className.fixed)
      .addClass(this.settings.className.top)
    ;
    this.settings.onStick.call(this.element);
  }
  
  fixBottom(): void {
    this.debug('Sticking element to bottom of page');
    if (this.settings.setSize) {
      this.set_size();
    }
    this.set_minimumSize();
    this.set_offset();
    this.$element
      .css({
        left         : this.cache.element.left,
        bottom       : '',
        marginBottom : ''
      })
      .removeClass(this.settings.className.bound)
      .removeClass(this.settings.className.top)
      .addClass(this.settings.className.fixed)
      .addClass(this.settings.className.bottom)
    ;
    this.settings.onStick.call(this.element);
  }

  unfix(): void {
    if (this.is_fixed()) {
      this.debug('Removing fixed position on element');
      this.remove_minimumSize();
      this.remove_offset();
      this.$element
        .removeClass(this.settings.className.fixed)
        .removeClass(this.settings.className.top)
        .removeClass(this.settings.className.bottom)
      ;
      this.settings.onUnstick.call(this.element);
    }
  }

  bindTop() {
    this.debug('Binding element to top of parent container');
    this.remove_offset();
    this.$element
      .css({ left: '', top: '', marginBottom: '' })
      .removeClass(this.settings.className.fixed)
      .removeClass(this.settings.className.bottom)
      .addClass(this.settings.className.bound)
      .addClass(this.settings.className.top)
    ;
    this.settings.onTop.call(this.element);
    this.settings.onUnstick.call(this.element);
  }

  bindBottom() {
    this.debug('Binding element to bottom of parent container');
    this.remove_offset();
    this.$element
      .css({ left: '', top: '' })
      .removeClass(this.settings.className.fixed)
      .removeClass(this.settings.className.top)
      .addClass(this.settings.className.bound)
      .addClass(this.settings.className.bottom)
    ;
    this.settings.onBottom.call(this.element);
    this.settings.onUnstick.call(this.element);
  }

  unbind(): void {
    if (this.is_bound()) {
      this.debug('Removing container bound position on element');
      this.remove_offset();
      this.$element
        .removeClass(this.settings.className.bound)
        .removeClass(this.settings.className.top)
        .removeClass(this.settings.className.bottom)
      ;
    }
  }

  resetCSS(): void {
    this.$element.css({ width  : '', height : '' });
    this.$container.css({ height: '' });
  }

  is_standardScroll(): boolean {
    return (this.$scroll[0] == window);
  }

  is_top(): boolean {
    return this.$element.hasClass(this.settings.className.top);
  }
  
  is_bottom(): boolean {
    return this.$element.hasClass(this.settings.className.bottom);
  }
  
  is_initialPosition(): boolean {
    return (!this.is_fixed() && !this.is_bound());
  }
  
  is_hidden(): boolean {
    return (!this.$element.is('visible'));
  }
  
  is_bound(): boolean {
    return this.$element.hasClass(this.settings.className.bound);
  }
  
  is_fixed(): boolean {
    return this.$element.hasClass(this.settings.className.fixed);
  }

  get_direction(scroll): string {
    let direction: string = 'down';
    scroll = scroll || this.settings.scrollContext.scrollY;
    if (this.lastScroll !== undefined) {
      if (this.lastScroll < scroll) {
        direction = 'down';
      }
      else if (this.lastScroll > scroll) {
        direction = 'up';
      }
    }
    return direction;
  }

  get_scrollChange(scroll) {
    scroll = scroll || this.settings.scrollContext.scrollY;
    return (this.lastScroll)
      ? (scroll - this.lastScroll)
      : 0
    ;
  }

  get_currentElementScroll() {
    if (this.elementScroll) {
      return this.elementScroll;
    }
    return (this.is_top())
      ? Math.abs(parseInt(this.$element.css('top'), 10))    || 0
      : Math.abs(parseInt(this.$element.css('bottom'), 10)) || 0
    ;
  }

  get_elementScroll(scroll) {
    scroll = scroll || this.settings.scrollContext.scrollY;
    let
      element        = this.cache.element,
      scrollContext  = this.cache.scrollContext,
      delta          = this.get_scrollChange(scroll),
      maxScroll      = (element.height - scrollContext.height + this.settings.offset),
      elementScroll  = this.get_currentElementScroll(),
      possibleScroll = (elementScroll + delta)
    ;
    if (this.cache.fits || possibleScroll < 0) {
      elementScroll = 0;
    }
    else if (possibleScroll > maxScroll ) {
      elementScroll = maxScroll;
    }
    else {
      elementScroll = possibleScroll;
    }
    return elementScroll;
  }

  set_containerSize() {
    let tagName = this.$container.get(0).tagName;
    if (tagName === 'HTML' || tagName == 'body') {
      // this can trigger for too many reasons
      //module.error(error.container, tagName, $module);
      this.determineContainer();
    }
    else {
      if (Math.abs(this.$container.outerHeight() - this.cache.context.height) > this.settings.jitter) {
        this.debug('Context has padding, specifying exact height for container', this.cache.context.height);
        this.$container.css({
          height: this.cache.context.height
        });
      }
    }
  }

  set_offset(): void {
    this.verbose('Setting offset on element', this.settings.offset);
    this.$element.css('margin-top', this.settings.offset);
  }

  set_minimumSize(): void {
    let element   = this.cache.element;
    this.$container.css('min-height', element.height);
  }

  set_scroll(scroll): void {
    this.debug('Setting scroll on element', scroll);
    if (this.elementScroll == scroll) {
      return;
    }
    if (this.is_top()) {
      this.$element
        .css('bottom', '')
        .css('top', -scroll)
      ;
    }
    if (this.is_bottom()) {
      this.$element
        .css('top', '')
        .css('bottom', scroll)
      ;
    }
  }

  set_size(): void {
    if (this.cache.element.height !== 0 && this.cache.element.width !== 0) {
      // INVESTIGATE
      // this.element.style.setProperty('width',  this.cache.element.width  + 'px', 'important');
      // this.element.style.setProperty('height', this.cache.element.height + 'px', 'important');
      this.$element.css('width', this.cache.element.width  + 'px' );
      this.$element.css('height', this.cache.element.height  + 'px' );
    }
  }

  remove_lastScroll(): void {
    delete this.lastScroll;
  }
  
  remove_elementScroll(scroll): void {
    delete this.elementScroll;
  }
  
  remove_minimumSize(): void {
    this.$container.css('min-height', '');
  }
  
  remove_offset(): void {
    this.$element.css('margin-top', '');
  }

  supports_sticky() {
    let $element = $('<div/>');
    $element.addClass(this.settings.className.supported);
    return($element.css('position').match('sticky'));
  }
}
