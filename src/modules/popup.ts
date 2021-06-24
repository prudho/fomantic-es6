"use strict";

import { Module, ModuleOptions } from '../module'

import { Transition } from './transition';

import $, { Cash } from 'cash-dom';

export interface PopupOptions extends ModuleOptions {
  // whether it should use dom mutation observers
  observeChanges : boolean;

  // when to show popup
  on             : string;

  // element to use to determine if popup is out of boundary
  boundary       : Window,

  // whether to add touchstart events when using hover
  addTouchEvents : boolean;

  // default position relative to element
  position       : string;

  // if given position should be used regardless if popup fits
  forcePosition  : boolean;

  // name of variation to use
  variation      : string;

  // whether popup should be moved to context
  movePopup      : boolean;

  // element which popup should be relative to
  target?         : string;

  // jq selector or element that should be used as popup
  popup?          : string;

  // popup should remain inline next to activator
  inline         : boolean;

  // popup should be removed from page on hide
  preserve       : boolean;

  // popup should not close when being hovered on
  hoverable      : boolean;

  // explicitly set content
  content        : boolean;

  // explicitly set html
  html           : boolean;

  // explicitly set title
  title          : boolean;

  // whether automatically close on clickaway when on click
  closable?       : boolean;

  // automatically hide on scroll
  hideOnScroll   : boolean;

  // hide other popups on show
  exclusive      : boolean;

  // context to attach popups
  context        : string;

  // context for binding scroll events
  scrollContext  : Window,

  // position to prefer when calculating new position
  prefer         : string;

  // specify position to appear even if it doesn't fit
  lastResort     : boolean;

  // number of pixels from edge of popup to pointing arrow center (used from centering)
  arrowPixelsFromEdge: number;

  // delay used to prevent accidental refiring of animations due to user error
  delay : {
    show : number;
    hide : number;
  },

  // whether fluid variation should assign width explicitly
  setFluidWidth  : boolean;

  // transition settings
  duration       : number;
  transition     : string;

  // distance away from activating element in px
  distanceAway   : number;

  // number of pixels an element is allowed to be "offstage" for a position to be chosen (allows for rounding)
  jitter         : number;

  // offset on aligning axis from calculated position
  offset         : number;

  // maximum times to look for a position before failing (9 positions total)
  maxSearchDepth : number;

  error: {
    invalidPosition : string;
    cannotPlace     : string;
    method          : string;
    noTransition    : string;
    notFound        : string;
  },

  metadata: {
    activator : string;
    content   : string;
    html      : string;
    offset    : string;
    position  : string;
    title     : string;
    variation : string;
  },

  className   : {
    active       : string;
    basic        : string;
    animating    : string;
    dropdown     : string;
    fluid        : string;
    loading      : string;
    popup        : string;
    position     : string;
    visible      : string;
    popupVisible : string;
  },

  selector    : {
    popup    : string;
  },

  templates: {
    escape: Function;
    popup: Function;
  }

  // callback only when element added to dom
  onCreate       : Function;

  // callback before element removed from dom
  onRemove       : Function;

  // callback before show animation
  onShow         : Function;

  // callback after show animation
  onVisible      : Function;

  // callback before hide animation
  onHide         : Function;

  // callback when popup cannot be positioned in visible screen
  onUnplaceable  : Function;

  // callback after hide animation
  onHidden       : Function;
}

const default_settings: PopupOptions = {

  name           : 'Popup',
    
  // module settings
  silent         : false,
  debug          : false,
  verbose        : false,
  performance    : true,
  namespace      : 'popup',

  // whether it should use dom mutation observers
  observeChanges : true,

  // when to show popup
  on             : 'hover',

  // element to use to determine if popup is out of boundary
  boundary       : window,

  // whether to add touchstart events when using hover
  addTouchEvents : true,

  // default position relative to element
  position       : 'top left',

  // if given position should be used regardless if popup fits
  forcePosition  : false,

  // name of variation to use
  variation      : '',

  // whether popup should be moved to context
  movePopup      : true,

  // element which popup should be relative to
  target         : null,

  // jq selector or element that should be used as popup
  popup          : null,

  // popup should remain inline next to activator
  inline         : false,

  // popup should be removed from page on hide
  preserve       : false,

  // popup should not close when being hovered on
  hoverable      : false,

  // explicitly set content
  content        : false,

  // explicitly set html
  html           : false,

  // explicitly set title
  title          : false,

  // whether automatically close on clickaway when on click
  closable       : true,

  // automatically hide on scroll
  hideOnScroll   : null,

  // hide other popups on show
  exclusive      : false,

  // context to attach popups
  context        : 'body',

  // context for binding scroll events
  scrollContext  : window,

  // position to prefer when calculating new position
  prefer         : 'opposite',

  // specify position to appear even if it doesn't fit
  lastResort     : false,

  // number of pixels from edge of popup to pointing arrow center (used from centering)
  arrowPixelsFromEdge: 20,

  // delay used to prevent accidental refiring of animations due to user error
  delay : {
    show : 50,
    hide : 70
  },

  // whether fluid variation should assign width explicitly
  setFluidWidth  : true,

  // transition settings
  duration       : 200,
  transition     : 'scale',

  // distance away from activating element in px
  distanceAway   : 0,

  // number of pixels an element is allowed to be "offstage" for a position to be chosen (allows for rounding)
  jitter         : 2,

  // offset on aligning axis from calculated position
  offset         : 0,

  // maximum times to look for a position before failing (9 positions total)
  maxSearchDepth : 15,

  error: {
    invalidPosition : 'The position you specified is not a valid position',
    cannotPlace     : 'Popup does not fit within the boundaries of the viewport',
    method          : 'The method you called is not defined.',
    noTransition    : 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>',
    notFound        : 'The target or popup you specified does not exist on the page'
  },

  metadata: {
    activator : 'activator',
    content   : 'content',
    html      : 'html',
    offset    : 'offset',
    position  : 'position',
    title     : 'title',
    variation : 'variation'
  },

  className   : {
    active       : 'active',
    basic        : 'basic',
    animating    : 'animating',
    dropdown     : 'dropdown',
    fluid        : 'fluid',
    loading      : 'loading',
    popup        : 'ui popup',
    position     : 'top left center bottom right',
    visible      : 'visible',
    popupVisible : 'visible'
  },

  selector    : {
    popup    : '.ui.popup'
  },

  templates: {
    escape: function(string) {
      let
        badChars     = /[<>"'`]/g,
        shouldEscape = /[&<>"'`]/,
        escape       = {
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
          "`": "&#x60;"
        },
        escapedChar  = function(chr) {
          return escape[chr];
        }
      ;
      if (shouldEscape.test(string)) {
        string = string.replace(/&(?![a-z0-9#]{1,6};)/, "&amp;");
        return string.replace(badChars, escapedChar);
      }
      return string;
    },
    popup: function(text) {
      let
        html   = '',
        escape = default_settings.templates.escape
      ;
      if (typeof text !== undefined) {
        if (typeof text.title !== undefined && text.title) {
          text.title = escape(text.title);
          html += '<div class="header">' + text.title + '</div>';
        }
        if (typeof text.content !== undefined && text.content) {
          text.content = escape(text.content);
          html += '<div class="content">' + text.content + '</div>';
        }
      }
      return html;
    }
  },

  // callback only when element added to dom
  onCreate       : function(){},

  // callback before element removed from dom
  onRemove       : function(){},

  // callback before show animation
  onShow         : function(){},

  // callback after show animation
  onVisible      : function(){},

  // callback before hide animation
  onHide         : function(){},

  // callback when popup cannot be positioned in visible screen
  onUnplaceable  : function(){},

  // callback after hide animation
  onHidden       : function(){},
}

export class Popup extends Module {
  settings: PopupOptions;

  $window: Cash = $(window);
  $document: Cash = $(document);
  $body: Cash = $('body');
  $target: Cash;
  $popup: Cash;
  $context: Cash;
  $offsetParent: Cash;
  $boundary: Cash;
  $scrollContext: Cash;

  elementNamespace: string;
  id: string;
  searchDepth: number = 0;
  triedPositions: any = false;
  openedWithTouch: boolean = true;

  clickEvent: string = ('ontouchstart' in document.documentElement)
    ? 'touchstart'
    : 'click'
  ;

  hideTimer;
  showTimer;
  cache;

  documentObserver: MutationObserver;

  instance: Popup;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$target = (this.settings.target)
      ? $(this.settings.target)
      : this.$element
    ;

    this.$context = $(this.settings.context);
    this.$scrollContext = $(this.settings.scrollContext);
    this.$boundary = $(this.settings.boundary),
    
    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing', this.$element);
    this.createID();
    this.bind_events();
    if (!this.exists() && this.settings.preserve) {
      this.create();
    }
    if (this.settings.observeChanges) {
      this.observeChanges();
    }
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    this.debug('Destroying previous module');
    if (this.documentObserver) {
      this.documentObserver.disconnect();
    }
    // remove element only if was created dynamically
    if (this.$popup && !this.settings.preserve) {
      this.removePopup();
    }
    // clear all timeouts
    clearTimeout(this.hideTimer);
    clearTimeout(this.showTimer);
    // remove events
    this.unbind_close();
    this.unbind_events();
    this.$element.removeAttr(this.moduleNamespace);
  }

  // generates popup html from metadata
  create(): void {
    let
      html      = this.get_html(),
      title     = this.get_title(),
      content   = this.get_content()
    ;

    if (html || content || title) {
      this.debug('Creating pop-up html');
      if (!html) {
        html = this.settings.templates.popup({
          title   : title,
          content : content
        });
      }
      this.$popup = $('<div/>')
        .addClass(this.settings.className.popup)
        .data(this.settings.metadata.activator, this.$element)
        .html(html)
      ;
      if (this.settings.inline) {
        this.verbose('Inserting popup element inline', this.$popup);
        this.$popup
          .insertAfter(this.$element)
        ;
      }
      else {
        this.verbose('Appending popup element to body', this.$popup);
        this.$popup
          .appendTo( this.$context )
        ;
      }
      this.refresh();
      this.set_variation();

      if (this.settings.hoverable) {
        this.bind_popup();
      }
      this.settings.onCreate.call(this.$popup, this.element);
    }
    else if (this.settings.popup) {
      $(this.settings.popup).data(this.settings.metadata.activator, this.$element);
      this.verbose('Used popup specified in settings');
      this.refresh();
      if (this.settings.hoverable) {
        this.bind_popup();
      }
    }
    else if (this.$target.next(this.settings.selector.popup).length !== 0) {
      this.verbose('Pre-existing popup found');
      this.settings.inline = true;
      this.settings.popup  = this.$target.next(this.settings.selector.popup).data(this.settings.metadata.activator, this.$element);
      this.refresh();
      if (this.settings.hoverable) {
        this.bind_popup();
      }
    }
    else {
      this.debug('No content specified skipping display', this.element);
    }
  }

  createID(): void {
    this.id = (Math.random().toString(16) + '000000000').substr(2, 8);
    this.elementNamespace = '.' + this.id;
    this.verbose('Creating unique id for element', this.id);
  }

  bind_events() {
    this.debug('Binding popup events to module');
    if (this.settings.on == 'click') {
      this.$element.on(this.clickEvent + this.eventNamespace, this.toggle.bind(this));
    }
    if (this.settings.on == 'hover') {
      this.$element.on('touchstart' + this.eventNamespace, this.event_touchstart.bind(this));
    }
    if (this.get_startEvent()) {
      this.$element
        .on(this.get_startEvent() + this.eventNamespace, this.event_start.bind(this))
        .on(this.get_endEvent() + this.eventNamespace, this.event_end.bind(this))
      ;
    }
    if (this.settings.target) {
      this.debug('Target set to element', this.$target);
    }
    this.$window.on('resize' + this.elementNamespace, this.event_resize.bind(this));
  }

  bind_close() {
    if (this.settings.hideOnScroll === true || (this.settings.hideOnScroll == null && this.settings.on != 'click')) {
      this.bind_closeOnScroll();
    }
    if (this.is_closable()) {
      this.bind_clickaway();
    }
    else if (this.settings.on == 'hover' && this.openedWithTouch) {
      this.bind_touchClose();
    }
  }

  bind_closeOnScroll() {
    this.verbose('Binding scroll close event to document');
    this.$scrollContext.one(this.get_scrollEvent() + this.elementNamespace, this.event_hideGracefully.bind(this));
  }

  bind_touchClose() {
    this.verbose('Binding popup touchclose event to document');
    this.$document
      .on('touchstart' + this.elementNamespace, (event) => {
        this.verbose('Touched away from popup');
        // this.event_hideGracefully.call(this.element, event);
        this.event_hideGracefully.call(this, event);
      })
    ;
  }

  bind_clickaway() {
    this.verbose('Binding popup close event to document');
    this.$document
      .on(this.clickEvent + this.elementNamespace, (event) => {
        this.verbose('Clicked away from popup');
        // this.event_hideGracefully.call(this.element, event);
        this.event_hideGracefully.call(this, event);
      })
    ;
  }

  bind_popup() {
    this.verbose('Allowing hover events on popup to prevent closing');
    if (this.$popup && this.has_popup()) {
      this.$popup
        .on('mouseenter' + this.eventNamespace, this.event_start.bind(this))
        .on('mouseleave' + this.eventNamespace, this.event_end.bind(this))
      ;
    }
  }

  unbind_close(): void {
    this.$document.off(this.elementNamespace);
    this.$scrollContext.off(this.elementNamespace);
  }

  unbind_events(): void {
    this.$window.off(this.elementNamespace);
    this.$element.off(this.eventNamespace);
  }

  event_documentChanged(mutations): void {
    [].forEach.call(mutations, (mutation) => {
      if (mutation.removedNodes) {
        [].forEach.call(mutation.removedNodes, (node) => {
          // INVESTIGATE this.element.toString()
          if (node == this.element || $(node).find(this.selector).length > 0) {
            this.debug('Element removed from DOM, tearing down events');
            this.destroy();
          }
        });
      }
    });
  }

  event_end(): void {
    let delay = ($.isPlainObject(this.settings.delay))
      ? this.settings.delay.hide
      : this.settings.delay
    ;
    clearTimeout(this.showTimer);
    this.hideTimer = setTimeout(this.hide.bind(this), delay);
  }

  event_hideGracefully(event): void {
    let
      $target = $(event.target),
      // isInDOM = $.contains(document.documentElement, event.target),
      isInDOM = document.documentElement !== event.target && document.documentElement.contains(event.target),
      inPopup = ($target.closest(this.settings.selector.popup).length > 0)
    ;
    // don't close on clicks inside popup
    if (event && !inPopup && isInDOM) {
      this.debug('Click occurred outside popup hiding popup');
      this.hide();
    }
    else {
      this.debug('Click was inside popup, keeping popup open');
    }
  }

  event_resize(): void {
    if (this.is_visible()) {
      this.set_position();
    }
  }

  event_start(): void {
    let delay = ($.isPlainObject(this.settings.delay))
      ? this.settings.delay.show
      : this.settings.delay
    ;
    clearTimeout(this.hideTimer);
    if (!this.openedWithTouch || (this.openedWithTouch && this.settings.addTouchEvents) ) {
      this.showTimer = setTimeout(this.show.bind(this), delay);
    }
  }

  event_touchstart(): void {
    this.openedWithTouch = true;
    if (this.settings.addTouchEvents) {
      this.show();
    }
  }

  exists(): boolean {
    if (!this.$popup) {
      return false;
    }
    if (this.settings.inline || this.settings.popup) {
      return (this.has_popup());
    }
    else {
      return (this.$popup.closest(this.$context).length >= 1 )
        ? true
        : false
      ;
    }
  }

  reset(): void {
    this.remove_visible();
    if (this.settings.preserve) {
      // INVESTIGATE
      // if ($.fn.transition !== undefined) {
      //   this.$popup
      //     .transition('remove transition')
      //   ;
      // }
    }
    else {
      this.removePopup();
    }
  }

  removePopup(): void {
    if (this.has_popup() && !this.settings.popup) {
      this.debug('Removing popup', this.$popup);
      this.$popup.remove();
      this.$popup = undefined;
      this.settings.onRemove.call(this.$popup, this.element);
    }
  }

  refresh(): void {
    if (this.settings.popup) {
      this.$popup = $(this.settings.popup).eq(0);
    }
    else {
      if (this.settings.inline) {
        this.$popup = this.$target.nextAll(this.settings.selector.popup).eq(0);
        this.settings.popup = this.$popup;
      }
    }
    if (this.settings.popup) {
      this.$popup.addClass(this.settings.className.loading);
      this.$offsetParent = this.get_offsetParent();
      this.$popup.removeClass(this.settings.className.loading);
      if (this.settings.movePopup && this.has_popup() && this.get_offsetParent(this.$popup)[0] !== this.$offsetParent[0]) {
        this.debug('Moving popup to the same offset parent as target');
        this.$popup
          .detach()
          .appendTo(this.$offsetParent)
        ;
      }
    }
    else {
      this.$offsetParent = (this.settings.inline)
        ? this.get_offsetParent(this.$target)
        : this.has_popup()
          ? this.get_offsetParent(this.$popup)
          : this.$body
      ;
    }
    if (this.$offsetParent.is('html') && this.$offsetParent[0] !== this.$body[0]) {
      this.debug('Setting page as offset parent');
      this.$offsetParent = this.$body;
    }
    if (this.get_variation()) {
      this.set_variation();
    }
  }

  // determines popup state
  toggle(): void {
    this.debug('Toggling pop-up');
    if (this.is_hidden()) {
      this.debug('Popup is hidden, showing pop-up');
      this.unbind_close();
      this.show();
    }
    else {
      this.debug('Popup is visible, hiding pop-up');
      this.hide();
    }
  }

  show(callback = () => {}): void {
    this.debug('Showing pop-up', this.settings.transition);
    if (this.is_hidden() && !(this.is_active() && this.is_dropdown()) ) {
      if (!this.exists()) {
        this.create();
      }
      if (this.settings.onShow.call(this.$popup, this.element) === false) {
        this.debug('onShow callback returned false, cancelling popup animation');
        return;
      }
      else if (!this.settings.preserve && !this.settings.popup) {
        this.refresh();
      }
      if (this.$popup && this.set_position()) {
        this.save_conditions();
        if (this.settings.exclusive) {
          this.hideAll();
        }
        this.animate_show(callback);
      }
    }
  }

  animate_show(callback: Function = () => {}) {
    // if (this.settings.transition && $.fn.transition !== undefined && this.$element.transition('is supported')) {
    if (this.settings.transition) {
      this.set_visible();
      let transition = new Transition(this.$popup, {
        animation  : (this.settings.transition.showMethod || this.settings.transition) + ' in',
        queue      : false,
        debug      : this.settings.debug,
        verbose    : this.settings.verbose,
        duration   : this.settings.transition.showDuration || this.settings.duration,
        onComplete : () => {
          this.bind_close();
          callback.call(this.$popup, this.element);
          this.settings.onVisible.call(this.$popup, this.element);
        }
      });
    }
    else {
      this.error(this.settings.error.noTransition);
    }
  }

  hide(callback: Function = () => {}): void {
    if (this.is_visible() || this.is_animating()) {
      
      if(this.settings.onHide.call(this.$popup, this.element) === false) {
        this.debug('onHide callback returned false, cancelling popup animation');
        return;
      }
      this.remove_visible();
      this.unbind_close();
      this.restore_conditions();
      this.animate_hide(callback);
    }
  }

  animate_hide(callback: Function = () => {}): void {
    this.debug('Hiding pop-up');
    // if (this.settings.transition && $.fn.transition !== undefined && this.$element.transition('is supported')) {
    if (this.settings.transition) {
      let transition = new Transition(this.$popup, {
        animation  : (this.settings.transition.hideMethod || this.settings.transition) + ' out',
          queue      : false,
          duration   : this.settings.transition.hideDuration || this.settings.duration,
          debug      : this.settings.debug,
          verbose    : this.settings.verbose,
          onComplete : () => {
            this.reset();
            callback.call(this.$popup, this.element);
            // INVESTIGATE: broken when using in calendar
            this.settings.onHidden.call(this.$popup, this.element);
          }
      });
    }
    else {
      this.error(this.settings.error.noTransition);
    }
  }

  hideAll(): void {
    // INVESTIGATE
    // $(selector.popup)
    //   .filter('.' + className.popupVisible)
    //   .each(function() {
    //     $(this)
    //       .data(metadata.activator)
    //         .popup('hide')
    //     ;
    //   })
    // ;
  }

  observeChanges(): void {
    if ('MutationObserver' in window) {
      this.documentObserver = new MutationObserver(this.event_documentChanged.bind(this));
      this.documentObserver.observe(document, {
        childList : true,
        subtree   : true
      });
      this.debug('Setting up mutation observer', this.documentObserver);
    }
  }

  is_active(): boolean {
    return this.$element.hasClass(this.settings.className.active);
  }

  is_animating(): boolean {
    return (this.$popup !== undefined && this.$popup.hasClass(this.settings.className.animating) );
  }

  is_basic(): boolean {
    return this.$element.hasClass(this.settings.className.basic);
  }

  is_closable(): boolean {
    if (this.settings.closable == null) {
      if (this.settings.on == 'hover') {
        return false;
      }
      return true;
    }
    return this.settings.closable;
  }

  is_dropdown(): boolean {
    return this.$element.hasClass(this.settings.className.dropdown);
  }

  is_fluid(): boolean {
    return (this.$popup !== undefined && this.$popup.hasClass(this.settings.className.fluid));
  }

  is_hidden(): boolean {
    return !this.is_visible();
  }

  is_offstage(distanceFromBoundary, position): boolean {
    let
      offstage = []
    ;
    // return boundaries that have been surpassed
    $.each(distanceFromBoundary, (direction, distance) => {
      if (distance < -this.settings.jitter) {
        this.debug('Position exceeds allowable distance from edge', direction, distance, position);
        offstage.push(direction);
      }
    });
    if (offstage.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  is_rtl(): boolean {
    return this.$element.attr('dir') === 'rtl' || this.$element.css('direction') === 'rtl';
  }

  is_svg(element): boolean {
    return this.supports_svg() && (element instanceof SVGGraphicsElement);
  }

  is_visible(): boolean {
    return (this.$popup !== undefined && this.$popup.hasClass(this.settings.className.popupVisible));
  }

  has_popup(): boolean {
    return (this.$popup && this.$popup.length > 0);
  }

  get_calculations() {
    let
      $popupOffsetParent = this.get_offsetParent(this.$popup),
      targetElement      = this.$target[0],
      isWindow           = ($.isWindow(this.$boundary[0])),
      targetOffset       = this.$target.offset(),
      parentOffset       = this.settings.inline || (this.settings.popup && this.settings.movePopup)
        ? this.$target.offsetParent().offset()
        : { top: 0, left: 0 },
      screenPosition = (isWindow)
        ? { top: 0, left: 0 }
        : this.$boundary.offset(),
      calculations: any   = {},
      scroll = (isWindow)
        // ? { top: this.$window.scrollTop(), left: this.$window.scrollLeft() }
        ? { top: window.scrollY, left: window.scrollX }
        : { top: 0, left: 0},
      screen
    ;
    calculations = {
      // element which is launching popup
      target : {
        element : this.$target[0],
        width   : this.$target.outerWidth(),
        height  : this.$target.outerHeight(),
        top     : targetOffset.top - parentOffset.top,
        left    : targetOffset.left - parentOffset.left,
        margin  : {}
      },
      // popup itself
      popup : {
        width  : this.$popup.outerWidth(),
        height : this.$popup.outerHeight()
      },
      // offset container (or 3d context)
      parent : {
        width  : this.$offsetParent.outerWidth(),
        height : this.$offsetParent.outerHeight()
      },
      // screen boundaries
      screen : {
        top  : screenPosition.top,
        left : screenPosition.left,
        scroll: {
          top  : scroll.top,
          left : scroll.left
        },
        width  : this.$boundary.width(),
        height : this.$boundary.height()
      }
    };

    // if popup offset context is not same as target, then adjust calculations
    if ($popupOffsetParent.get(0) !== this.$offsetParent.get(0)) {
      let popupOffset = $popupOffsetParent.offset();
      calculations.target.top -= popupOffset.top;
      calculations.target.left -= popupOffset.left;
      calculations.parent.width = $popupOffsetParent.outerWidth();
      calculations.parent.height = $popupOffsetParent.outerHeight();
    }

    // add in container calcs if fluid
    if (this.settings.setFluidWidth && this.is_fluid()) {
      calculations.container = {
        width: this.$popup.parent().outerWidth()
      };
      calculations.popup.width = calculations.container.width;
    }

    // add in margins if inline
    calculations.target.margin.top = (this.settings.inline)
      ? parseInt(window.getComputedStyle(targetElement).getPropertyValue('margin-top'), 10)
      : 0
    ;
    calculations.target.margin.left = (this.settings.inline)
      ? this.is_rtl()
        ? parseInt(window.getComputedStyle(targetElement).getPropertyValue('margin-right'), 10)
        : parseInt(window.getComputedStyle(targetElement).getPropertyValue('margin-left'), 10)
      : 0
    ;
    // calculate screen boundaries
    screen = calculations.screen;
    calculations.boundary = {
      top    : screen.top + screen.scroll.top,
      bottom : screen.top + screen.scroll.top + screen.height,
      left   : screen.left + screen.scroll.left,
      right  : screen.left + screen.scroll.left + screen.width
    };
    return calculations;
  }

  get_content(): string {
    this.$element.removeAttr(this.settings.metadata.content);
    return this.$element.data(this.settings.metadata.content) || this.settings.content || this.$element.attr('title');
  }

  get_distanceFromBoundary(offset, calculations = this.get_calculations()) {
    let
      distanceFromBoundary = {},
      popup,
      boundary
    ;

    // shorthand
    popup        = calculations.popup;
    boundary     = calculations.boundary;

    if (offset) {
      distanceFromBoundary = {
        top    : (offset.top - boundary.top),
        left   : (offset.left - boundary.left),
        right  : (boundary.right - (offset.left + popup.width) ),
        bottom : (boundary.bottom - (offset.top + popup.height) )
      };
      this.verbose('Distance from boundaries determined', offset, distanceFromBoundary);
    }
    return distanceFromBoundary;
  }

  get_endEvent(): string | boolean {
    if (this.settings.on == 'hover') {
      return 'mouseleave';
    }
    else if (this.settings.on == 'focus') {
      return 'blur';
    }
    return false;
  }

  get_html(): string {
    this.$element.removeAttr(this.settings.metadata.html);
    return this.$element.data(this.settings.metadata.html) || this.settings.html;
  }

  get_id(): string {
    return this.id;
  }

  get_nextPosition(position) {
    let
      positions          = position.split(' '),
      verticalPosition   = positions[0],
      horizontalPosition = positions[1],
      opposite = {
        top    : 'bottom',
        bottom : 'top',
        left   : 'right',
        right  : 'left'
      },
      adjacent = {
        left   : 'center',
        center : 'right',
        right  : 'left'
      },
      backup = {
        'top left'      : 'top center',
        'top center'    : 'top right',
        'top right'     : 'right center',
        'right center'  : 'bottom right',
        'bottom right'  : 'bottom center',
        'bottom center' : 'bottom left',
        'bottom left'   : 'left center',
        'left center'   : 'top left'
      },
      adjacentsAvailable = (verticalPosition == 'top' || verticalPosition == 'bottom'),
      oppositeTried = false,
      adjacentTried = false,
      nextPosition: any  = []
    ;
    if (!this.triedPositions) {
      this.verbose('All available positions available');
      this.triedPositions = this.get_positions();
    }

    this.debug('Recording last position tried', position);
    this.triedPositions[position] = true;

    if (this.settings.prefer === 'opposite') {
      nextPosition  = [opposite[verticalPosition], horizontalPosition];
      nextPosition  = nextPosition.join(' ');
      oppositeTried = (this.triedPositions[nextPosition] === true);
      this.debug('Trying opposite strategy', nextPosition);
    }
    if ((this.settings.prefer === 'adjacent') && adjacentsAvailable ) {
      nextPosition  = [verticalPosition, adjacent[horizontalPosition]];
      nextPosition  = nextPosition.join(' ');
      adjacentTried = (this.triedPositions[nextPosition] === true);
      this.debug('Trying adjacent strategy', nextPosition);
    }
    if (adjacentTried || oppositeTried) {
      this.debug('Using backup position', nextPosition);
      nextPosition = backup[position];
    }
    return nextPosition;
  }

  get_offsetParent($element: Cash = undefined): Cash {
    let
      element = ($element !== undefined)
        ? $element[0]
        : this.$target[0],
      parentNode = element.parentNode,
      $node    = $(parentNode)
    ;
    if (parentNode) {
      let
        is2D     = ($node.css('transform') === 'none'),
        isStatic = ($node.css('position') === 'static'),
        isBody   = $node.is('body')
      ;
      while (parentNode && !isBody && isStatic && is2D) {
        parentNode = parentNode.parentNode;
        $node    = $(parentNode);
        is2D     = ($node.css('transform') === 'none');
        isStatic = ($node.css('position') === 'static');
        isBody   = $node.is('body');
      }
    }
    return ($node && $node.length > 0)
      ? $node
      : $()
    ;
  }

  get_popup() {
    return this.$popup;
  }

  get_popupOffset() {
    return this.$popup.offset();
  }

  get_positions() {
    return {
      'top left'      : false,
      'top center'    : false,
      'top right'     : false,
      'bottom left'   : false,
      'bottom center' : false,
      'bottom right'  : false,
      'left center'   : false,
      'right center'  : false
    };
  }

  get_scrollEvent(): string {
    return 'scroll';
  }

  get_startEvent(): string | boolean {
    if (this.settings.on == 'hover') {
      return 'mouseenter';
    }
    else if (this.settings.on == 'focus') {
      return 'focus';
    }
    return false;
  }

  get_title(): string {
    this.$element.removeAttr(this.settings.metadata.title);
    return this.$element.data(this.settings.metadata.title) || this.settings.title;
  }

  get_variation(): string {
    this.$element.removeAttr(this.settings.metadata.variation);
    return this.$element.data(this.settings.metadata.variation) || this.settings.variation;
  }

  set_fluidWidth(calculations = this.get_calculations()) {
    this.debug('Automatically setting element width to parent width', calculations.parent.width);
    this.$popup.css('width', calculations.container.width);
  }

  set_position(position = (this.$element.data(this.settings.metadata.position) || this.settings.position), calculations = this.get_calculations()) {
    // exit conditions
    if (this.$target.length === 0 || this.$popup.length === 0) {
      this.error(this.settings.error.notFound);
      return;
    }
    let
      offset = this.$element.data(this.settings.metadata.offset) || this.settings.offset,
      distanceAway = this.settings.distanceAway,
      target,
      popup,
      parent,
      positioning,
      popupOffset,
      distanceFromBoundary
    ;

    // shorthand
    target = calculations.target;
    popup  = calculations.popup;
    parent = calculations.parent;

    if (this.should_centerArrow(calculations)) {
      this.verbose('Adjusting offset to center arrow on small target element');
      if (position == 'top left' || position == 'bottom left') {
        offset += (target.width / 2);
        offset -= this.settings.arrowPixelsFromEdge;
      }
      if (position == 'top right' || position == 'bottom right') {
        offset -= (target.width / 2);
        offset += this.settings.arrowPixelsFromEdge;
      }
    }

    if (target.width === 0 && target.height === 0 && !this.is_svg(target.element)) {
      this.debug('Popup target is hidden, no action taken');
      return false;
    }

    if (this.settings.inline) {
      this.debug('Adding margin to calculation', target.margin);
      if (position == 'left center' || position == 'right center') {
        offset       +=  target.margin.top;
        distanceAway += -target.margin.left;
      }
      else if (position == 'top left' || position == 'top center' || position == 'top right') {
        offset       += target.margin.left;
        distanceAway -= target.margin.top;
      }
      else {
        offset       += target.margin.left;
        distanceAway += target.margin.top;
      }
    }

    this.debug('Determining popup position from calculations', position, calculations);

    if (this.is_rtl()) {
      position = position.replace(/left|right/g, function (match) {
        return (match == 'left')
          ? 'right'
          : 'left'
        ;
      });
      this.debug('RTL: Popup position updated', position);
    }

    // if last attempt use specified last resort position
    if (this.searchDepth == this.settings.maxSearchDepth && typeof this.settings.lastResort === 'string') {
      position = this.settings.lastResort;
    }

    switch (position) {
      case 'top left':
        positioning = {
          top    : 'auto',
          bottom : parent.height - target.top + distanceAway,
          left   : target.left + offset,
          right  : 'auto'
        };
      break;
      case 'top center':
        positioning = {
          bottom : parent.height - target.top + distanceAway,
          left   : target.left + (target.width / 2) - (popup.width / 2) + offset,
          top    : 'auto',
          right  : 'auto'
        };
      break;
      case 'top right':
        positioning = {
          bottom :  parent.height - target.top + distanceAway,
          right  :  parent.width - target.left - target.width - offset,
          top    : 'auto',
          left   : 'auto'
        };
      break;
      case 'left center':
        positioning = {
          top    : target.top + (target.height / 2) - (popup.height / 2) + offset,
          right  : parent.width - target.left + distanceAway,
          left   : 'auto',
          bottom : 'auto'
        };
      break;
      case 'right center':
        positioning = {
          top    : target.top + (target.height / 2) - (popup.height / 2) + offset,
          left   : target.left + target.width + distanceAway,
          bottom : 'auto',
          right  : 'auto'
        };
      break;
      case 'bottom left':
        positioning = {
          top    : target.top + target.height + distanceAway,
          left   : target.left + offset,
          bottom : 'auto',
          right  : 'auto'
        };
      break;
      case 'bottom center':
        positioning = {
          top    : target.top + target.height + distanceAway,
          left   : target.left + (target.width / 2) - (popup.width / 2) + offset,
          bottom : 'auto',
          right  : 'auto'
        };
      break;
      case 'bottom right':
        positioning = {
          top    : target.top + target.height + distanceAway,
          right  : parent.width - target.left  - target.width - offset,
          left   : 'auto',
          bottom : 'auto'
        };
      break;
    }
    if (positioning === undefined) {
      this.error(this.settings.error.invalidPosition, position);
    }

    this.debug('Calculated popup positioning values', positioning);

    // tentatively place on stage
    this.$popup
      .removeClass(this.settings.className.position)
      .addClass(position)
      .addClass(this.settings.className.loading)
      .css(positioning)
    ;

    popupOffset = this.get_popupOffset();

    // see if any boundaries are surpassed with this tentative position
    distanceFromBoundary = this.get_distanceFromBoundary(popupOffset, calculations);

    if (!this.settings.forcePosition && this.is_offstage(distanceFromBoundary, position) ) {
      this.debug('Position is outside viewport', position);
      if (this.searchDepth < this.settings.maxSearchDepth) {
        this.searchDepth++;
        position = this.get_nextPosition(position);
        this.debug('Trying new position', position);
        return (this.$popup)
          ? this.set_position(position, calculations)
          : false
        ;
      }
      else {
        if (this.settings.lastResort) {
          this.debug('No position found, showing with last position');
        }
        else {
          this.debug('Popup could not find a position to display', this.$popup);
          this.error(this.settings.error.cannotPlace, this.element);
          this.remove_attempts();
          this.remove_loading();
          this.reset();
          this.settings.onUnplaceable.call(this.$popup, this.element);
          return false;
        }
      }
    }
    this.debug('Position is on stage', position);
    this.remove_attempts();
    this.remove_loading();
    if (this.settings.setFluidWidth && this.is_fluid()) {
      this.set_fluidWidth(calculations);
    }
    return true;
  }

  set_variation(variation = this.get_variation()): void {
    if (variation && this.has_popup()) {
      this.verbose('Adding variation to popup', variation);
      this.$popup.addClass(variation);
    }
  }

  set_visible(): void {
    this.$element.addClass(this.settings.className.visible);
  }

  remove_attempts(): void {
    this.verbose('Resetting all searched positions');
    this.searchDepth    = 0;
    this.triedPositions = false;
  }

  remove_loading(): void {
    this.$popup.removeClass(this.settings.className.loading);
  }

  remove_variation(variation = this.get_variation()) {
    if (variation) {
      this.verbose('Removing variation', variation);
      this.$popup.removeClass(variation);
    }
  }

  remove_visible(): void {
    this.$element.removeClass(this.settings.className.visible);
  }

  restore_conditions(): boolean {
    if (this.cache && this.cache.title) {
      this.$element.attr('title', this.cache.title);
      this.verbose('Restoring original attributes', this.cache.title);
    }
    return true;
  }

  should_centerArrow(calculations): boolean {
    return !this.is_basic() && calculations.target.width <= (this.settings.arrowPixelsFromEdge * 2);
  }

  supports_svg(): boolean {
    return (typeof SVGGraphicsElement !== 'undefined');
  }

  save_conditions() {
    this.cache = {
      title: this.$element.attr('title')
    };
    if (this.cache.title) {
      this.$element.removeAttr('title');
    }
    this.verbose('Saving original attributes', this.cache.title);
  }

  reposition(): void {
    this.refresh();
    this.set_position();
  }

  change_content(html) {
    this.$popup.html(html);
  }
}
