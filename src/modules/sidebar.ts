"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

export interface SidebarOptions extends ModuleOptions {
  transition        : string;
  mobileTransition  : string;

  defaultTransition : {
    computer: {
      left   : string;
      right  : string;
      top    : string;
      bottom : string;
    },
    mobile: {
      left   : string;
      right  : string;
      top    : string;
      bottom : string;
    }
  },

  context           : string;
  exclusive         : boolean;
  closable          : boolean;
  dimPage           : boolean;
  scrollLock        : boolean;
  returnScroll      : boolean;
  delaySetup        : boolean;

  duration          : number;

  className         : {
    active    : string;
    animating : string;
    dimmed    : string;
    ios       : string;
    pushable  : string;
    pushed    : string;
    right     : string;
    top       : string;
    left      : string;
    bottom    : string;
    visible   : string;
  },

  selector: {
    fixed   : string;
    omitted : string;
    pusher  : string;
    sidebar : string;
  },

  regExp: {
    ios          : RegExp;
    mobileChrome : RegExp;
    mobile       : RegExp;
  },

  error   : {
    method       : string;
    pusher       : string;
    movedSidebar : string;
    notFound     : string;
  },

  onChange          : Function;
  onShow            : Function;
  onHide            : Function;

  onHidden          : Function;
  onVisible         : Function;
}

const default_settings: SidebarOptions = {
  name              : 'Sidebar',
  namespace         : 'sidebar',

  silent            : false,
  debug             : false,
  verbose           : false,
  performance       : true,

  transition        : 'auto',
  mobileTransition  : 'auto',

  defaultTransition : {
    computer: {
      left   : 'uncover',
      right  : 'uncover',
      top    : 'overlay',
      bottom : 'overlay'
    },
    mobile: {
      left   : 'uncover',
      right  : 'uncover',
      top    : 'overlay',
      bottom : 'overlay'
    }
  },

  context           : 'body',
  exclusive         : false,
  closable          : true,
  dimPage           : true,
  scrollLock        : false,
  returnScroll      : false,
  delaySetup        : false,

  duration          : 500,

  className         : {
    active    : 'active',
    animating : 'animating',
    dimmed    : 'dimmed',
    ios       : 'ios',
    pushable  : 'pushable',
    pushed    : 'pushed',
    right     : 'right',
    top       : 'top',
    left      : 'left',
    bottom    : 'bottom',
    visible   : 'visible'
  },

  selector: {
    fixed   : '.fixed',
    omitted : 'script, link, style, .ui.modal, .ui.dimmer, .ui.nag, .ui.fixed',
    pusher  : '.pusher',
    sidebar : '.ui.sidebar'
  },

  regExp: {
    ios          : /(iPad|iPhone|iPod)/g,
    mobileChrome : /(CriOS)/g,
    mobile       : /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/g
  },

  error   : {
    method       : 'The method you called is not defined.',
    pusher       : 'Had to add pusher element. For optimal performance make sure body content is inside a pusher element',
    movedSidebar : 'Had to move sidebar. For optimal performance make sure sidebar and pusher are direct children of your body tag',
    notFound     : 'There were no elements that matched the specified selector'
  },

  onChange          : function(){},
  onShow            : function(){},
  onHide            : function(){},

  onHidden          : function(){},
  onVisible         : function(){}
}

export class Sidebar extends Module {
  settings: SidebarOptions;

  $window: Cash         = $(window);
  $document: Cash       = $(document);
  $html: Cash           = $('html');
  $head: Cash           = $('head');
  $context: Cash;
  $pusher: Cash;
  $sidebars: Cash;
  $fixed: Cash;
  $style: Cash;

  elementNamespace: string;
  id: string;
  transitionEvent: string;
  cache;
  currentScroll: number;

  instance: Sidebar;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$context        = $(this.settings.context);
    this.$pusher         = this.$context.children(this.settings.selector.pusher);
    this.$sidebars       = this.$element.children(this.settings.selector.sidebar);
    this.$fixed          = this.$context.children(this.settings.selector.fixed);

    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing sidebar', this.settings);

    this.create_id();

    this.transitionEvent = this.get_transitionEvent();

    // avoids locking rendering if initialized in onReady
    if (this.settings.delaySetup) {
      requestAnimationFrame(this.setup_layout);
    }
    else {
      this.setup_layout();
    }

    requestAnimationFrame(() => {
      this.setup_cache();
    });

    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous module for', this.$element);
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
    if (this.is_ios()) {
      this.remove_ios();
    }
    // bound by uuid
    this.$context.off(this.elementNamespace);
    this.$window.off(this.elementNamespace);
    this.$document.off(this.elementNamespace);
  }

  create_id(): void {
    this.id = (Math.random().toString(16) + '000000000').substr(2,8);
    this.elementNamespace = '.' + this.id;
    this.verbose('Creating unique id for element', this.id);
  }

  setup_cache(): void {
    this.cache = {
      width  : this.$element.outerWidth(),
      height : this.$element.outerHeight()
    };
  }

  setup_layout(): void {
    if (this.$context.children(this.settings.selector.pusher).length === 0) {
      this.debug('Adding wrapper element for sidebar');
      this.error(this.settings.error.pusher);
      this.$pusher = $('<div class="pusher" />');
      this.$context
        .children()
          .not(this.settings.selector.omitted)
          .not(this.$sidebars)
          .wrapAll(this.$pusher)
      ;
      this.refresh();
    }
    if (this.$element.nextAll(this.settings.selector.pusher).length === 0 || this.$element.nextAll(this.settings.selector.pusher)[0] !== this.$pusher[0]) {
      this.debug('Moved sidebar to correct parent element');
      this.error(this.settings.error.movedSidebar, this.element);
      this.$element.detach().prependTo(this.$context);
      this.refresh();
    }
    this.clear_cache();
    this.set_pushable();
    this.set_direction();
  }

  bind_clickaway(): void {
    this.verbose('Adding clickaway events to context', this.$context);
    this.$context
      .on('click'    + this.elementNamespace, this.event_clickaway.bind(this))
      .on('touchend' + this.elementNamespace, this.event_clickaway.bind(this))
    ;
  }

  bind_scrollLock(): void {
    if (this.settings.scrollLock) {
      this.debug('Disabling page scroll');
      this.$window.on('DOMMouseScroll' + this.elementNamespace, this.event_scroll.bind(this));
    }
    this.verbose('Adding events to contain sidebar scroll');
    this.$document.on('touchmove' + this.elementNamespace, this.event_touch.bind(this));
    this.$element.on('scroll' + this.eventNamespace, this.event_containScroll.bind(this));
  }

  event_clickaway(event): void {
    if (this.settings.closable) {
      let
        // INVESTIGATE
        // clickedInPusher = (this.$pusher.find(event.target).length > 0 || this.$pusher.is(event.target)),
        clickedInPusher = (this.$pusher.filter(event.target).length > 0 || this.$pusher.is(event.target)),
        clickedContext  = (this.$context.is(event.target))
      ;
      if (clickedInPusher) {
        this.verbose('User clicked on dimmed page');
        this.hide();
      }
      if (clickedContext) {
        this.verbose('User clicked on dimmable context (scaled out page)');
        this.hide();
      }
    }
  }

  event_touch(event): void {
    //event.stopPropagation();
  }

  event_containScroll(event): void {
    if (this.element.scrollTop <= 0)  {
      this.element.scrollTop = 1;
    }
    if ((this.element.scrollTop + this.element.offsetHeight) >= this.element.scrollHeight) {
      this.element.scrollTop = this.element.scrollHeight - this.element.offsetHeight - 1;
    }
  }

  event_scroll(event): void {
    if ($(event.target).closest(this.settings.selector.sidebar).length === 0 ) {
      event.preventDefault();
    }
  }

  unbind_clickaway(): void {
    this.verbose('Removing clickaway events from context', this.$context);
    this.$context.off(this.elementNamespace);
  }

  unbind_scrollLock(): void {
    this.verbose('Removing scroll lock from page');
    this.$document.off(this.elementNamespace);
    this.$window.off(this.elementNamespace);
    this.$element.off('scroll' + this.eventNamespace);
  }

  refresh(): void {
    this.verbose('Refreshing selector cache');
    this.$context  = $(this.settings.context);
    this.$sidebars = this.$context.children(this.settings.selector.sidebar);
    this.$pusher   = this.$context.children(this.settings.selector.pusher);
    this.$fixed    = this.$context.children(this.settings.selector.fixed);
    this.clear_cache();
  }

  refreshSidebars(): void {
    this.verbose('Refreshing other sidebars');
    this.$sidebars = this.$context.children(this.settings.selector.sidebar);
  }

  clear_cache(): void {
    this.verbose('Clearing cached dimensions');
    this.cache = {};
  }

  repaint(): void {
    this.verbose('Forcing repaint event');
    this.element.style.display = 'none';
    let ignored = this.element.offsetHeight;
    // element.scrollTop = element.scrollTop; WTF
    this.element.style.display = '';
  }

  attachEvents(selector, event): void {
    let $toggle = $(this.selector);
    event = $.isFunction(module[event])
      ? this[event]
      : this.toggle
    ;
    if ($toggle.length > 0) {
      this.debug('Attaching sidebar events to element', selector, event);
      $toggle.on('click' + this.eventNamespace, event);
    }
    else {
      this.error(this.settings.error.notFound, selector);
    }
  }

  show(callback = () => {}): void {
    if (this.is_hidden()) {
      this.refreshSidebars();
      this.refresh();
      if (this.othersActive()) {
        this.debug('Other sidebars currently visible');
        if (this.settings.exclusive) {
          // if not overlay queue animation after hide
          if (this.settings.transition != 'overlay') {
            this.hideOthers(this.show);
            return;
          }
          else {
            this.hideOthers();
          }
        }
        else {
          this.settings.transition = 'overlay';
        }
      }
      this.pushPage(() => {
        callback.call(this.element);
        this.settings.onShow.call(this.element);
      });
      this.settings.onChange.call(this.element);
      this.settings.onVisible.call(this.element);
    }
    else {
      this.debug('Sidebar is already visible');
    }
  }

  hide(callback = () => {}): void {
    if (this.is_visible() || this.is_animating()) {
      this.debug('Hiding sidebar', callback);
      this.refreshSidebars();
      this.pullPage(() => {
        callback.call(this.element);
        this.settings.onHidden.call(this.element);
      });
      this.settings.onChange.call(this.element);
      this.settings.onHide.call(this.element);
    }
  }

  pullPage(callback = () => {}): void {
    let
      transition = this.get_transition(),
      $transition = (transition == 'overlay' || this.othersActive())
        ? this.$element
        : this.$pusher,
      animate,
      transitionEnd
    ;
    this.verbose('Removing context push state', this.get_direction());

    this.unbind_clickaway();
    this.unbind_scrollLock();

    animate = () => {
      this.set_transition(transition);
      this.set_animating();
      this.remove_visible();
      if (this.settings.dimPage && !this.othersVisible()) {
        this.$pusher.removeClass(this.settings.className.dimmed);
      }
    };
    transitionEnd = (event) => {
      if (event.target == $transition[0]) {
        $transition.off(this.transitionEvent + this.elementNamespace, transitionEnd);
        this.remove_animating();
        this.remove_transition();
        this.remove_inlineCSS();
        if (transition == 'scale down' || (this.settings.returnScroll && this.is_mobile()) ) {
          this.scrollBack();
        }
        callback.call(this.element);
      }
    };
    $transition.off(this.transitionEvent + this.elementNamespace);
    $transition.on(this.transitionEvent + this.elementNamespace, transitionEnd);
    requestAnimationFrame(animate);
  }

  pushPage(callback = () => {}): void {
    let
      transition = this.get_transition(),
      $transition = (transition === 'overlay' || this.othersActive())
        ? this.$element
        : this.$pusher,
      animate,
      dim,
      transitionEnd
    ;

    if (this.settings.transition == 'scale down') {
      this.scrollToTop();
    }
    this.set_transition(transition);
    this.repaint();
    animate = () => {
      this.bind_clickaway();
      this.add_inlineCSS();
      this.set_animating();
      this.set_visible();
    };
    dim = () => {
      this.set_dimmed();
    };
    transitionEnd = (event) =>  {
      if (event.target == $transition[0]) {
        $transition.off(this.transitionEvent + this.elementNamespace, transitionEnd);
        this.remove_animating();
        this.bind_scrollLock();
        callback.call(this.element);
      }
    };
    $transition.off(this.transitionEvent + this.elementNamespace);
    $transition.on(this.transitionEvent + this.elementNamespace, transitionEnd);
    requestAnimationFrame(animate);
    if (this.settings.dimPage && !this.othersVisible()) {
      requestAnimationFrame(dim);
    }
  }

  othersAnimating(): boolean {
    return (this.$sidebars.not(this.$element).filter('.' + this.settings.className.animating).length > 0);
  }

  othersVisible(): boolean {
    return (this.$sidebars.not(this.$element).filter('.' + this.settings.className.visible).length > 0);
  }

  othersActive(): boolean {
    return(this.othersVisible() || this.othersAnimating());
  }

  hideOthers(callback = () => {}): void {
    let
      $otherSidebars = this.$sidebars.not(this.$element).filter('.' + this.settings.className.visible),
      sidebarCount   = $otherSidebars.length,
      callbackCount  = 0
    ;
    // $otherSidebars
    //   .sidebar('hide', function() {
    //     callbackCount++;
    //     if (callbackCount == sidebarCount) {
    //       callback();
    //     }
    //   })
    // ;
  }

  add_inlineCSS() {
    let
      width     = this.cache.width  || this.$element.outerWidth(),
      height    = this.cache.height || this.$element.outerHeight(),
      isRTL     = this.is_rtl(),
      direction = this.get_direction(),
      distance  = {
        left   : width,
        right  : -width,
        top    : height,
        bottom : -height
      },
      style
    ;

    if (isRTL) {
      this.verbose('RTL detected, flipping widths');
      distance.left = -width;
      distance.right = width;
    }

    style  = '<style>';

    if (direction === 'left' || direction === 'right') {
      this.debug('Adding CSS rules for animation distance', width);
      style  += ''
        + ' .ui.visible.' + direction + '.sidebar ~ .fixed,'
        + ' .ui.visible.' + direction + '.sidebar ~ .pusher {'
        + '   -webkit-transform: translate3d('+ distance[direction] + 'px, 0, 0);'
        + '           transform: translate3d('+ distance[direction] + 'px, 0, 0);'
        + ' }'
      ;
    }
    else if (direction === 'top' || direction == 'bottom') {
      style  += ''
        + ' .ui.visible.' + direction + '.sidebar ~ .fixed,'
        + ' .ui.visible.' + direction + '.sidebar ~ .pusher {'
        + '   -webkit-transform: translate3d(0, ' + distance[direction] + 'px, 0);'
        + '           transform: translate3d(0, ' + distance[direction] + 'px, 0);'
        + ' }'
      ;
    }

    /* IE is only browser not to create context with transforms */
    /* https://www.w3.org/Bugs/Public/show_bug.cgi?id=16328 */
    if (this.is_ie() ) {
      if (direction === 'left' || direction === 'right') {
        this.debug('Adding CSS rules for animation distance', width);
        style  += ''
          + ' body.pushable > .ui.visible.' + direction + '.sidebar ~ .pusher:after {'
          + '   -webkit-transform: translate3d('+ distance[direction] + 'px, 0, 0);'
          + '           transform: translate3d('+ distance[direction] + 'px, 0, 0);'
          + ' }'
        ;
      }
      else if (direction === 'top' || direction == 'bottom') {
        style  += ''
          + ' body.pushable > .ui.visible.' + direction + '.sidebar ~ .pusher:after {'
          + '   -webkit-transform: translate3d(0, ' + distance[direction] + 'px, 0);'
          + '           transform: translate3d(0, ' + distance[direction] + 'px, 0);'
          + ' }'
        ;
      }
      /* opposite sides visible forces content overlay */
      style += ''
        + ' body.pushable > .ui.visible.left.sidebar ~ .ui.visible.right.sidebar ~ .pusher:after,'
        + ' body.pushable > .ui.visible.right.sidebar ~ .ui.visible.left.sidebar ~ .pusher:after {'
        + '   -webkit-transform: translate3d(0, 0, 0);'
        + '           transform: translate3d(0, 0, 0);'
        + ' }'
      ;
    }
    style += '</style>';
    this.$style = $(style)
      .appendTo(this.$head)
    ;
    this.debug('Adding sizing css to head', this.$style);
  }

  get_direction(): string {
    if (this.$element.hasClass(this.settings.className.top)) {
      return this.settings.className.top;
    }
    else if (this.$element.hasClass(this.settings.className.right)) {
      return this.settings.className.right;
    }
    else if (this.$element.hasClass(this.settings.className.bottom)) {
      return this.settings.className.bottom;
    }
    return this.settings.className.left;
  }

  toggle(): void {
    this.verbose('Determining toggled direction');
    if (this.is_hidden()) {
      this.show();
    }
    else {
      this.hide();
    }
  }

  scrollToTop(): void {
    this.verbose('Scrolling to top of page to avoid animation issues');
    // this.currentScroll = $(window).scrollTop();
    this.currentScroll = window.scrollY;
    // this.$element.scrollTop(0);
    this.element.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  scrollBack(): void {
    this.verbose('Scrolling back to original page position');
    window.scrollTo(0, this.currentScroll);
  }

  get_transition() {
    let
      direction: string = this.get_direction(),
      transition
    ;
    transition = (this.is_mobile())
      ? (this.settings.mobileTransition == 'auto')
        ? this.settings.defaultTransition.mobile[direction]
        : this.settings.mobileTransition
      : (this.settings.transition == 'auto')
        ? this.settings.defaultTransition.computer[direction]
        : this.settings.transition
    ;
    this.verbose('Determined transition', transition);
    return transition;
  }

  get_transitionEvent(): string {
    let
      element     = document.createElement('element'),
      transitions = {
        'transition'       :'transitionend',
        'OTransition'      :'oTransitionEnd',
        'MozTransition'    :'transitionend',
        'WebkitTransition' :'webkitTransitionEnd'
      },
      transition
    ;
    for (transition in transitions) {
      if (element.style[transition] !== undefined) {
        return transitions[transition];
      }
    }
  }

  // ios only (scroll on html not document). This prevent auto-resize canvas/scroll in ios
  // (This is no longer necessary in latest iOS)
  set_ios() {
    this.$html.addClass(this.settings.className.ios);
  }

  // container
  set_pushed() {
    this.$context.addClass(this.settings.className.pushed);
  }
  
  set_pushable() {
    this.$context.addClass(this.settings.className.pushable);
  }

  // pusher
  set_dimmed() {
    this.$pusher.addClass(this.settings.className.dimmed);
  }

  // sidebar
  set_active() {
    this.$element.addClass(this.settings.className.active);
  }
  
  set_animating() {
    this.$element.addClass(this.settings.className.animating);
  }
  
  set_transition(transition) {
    transition = transition || this.get_transition();
    this.$element.addClass(transition);
  }
  
  set_direction(direction = this.get_direction()) {
    this.$element.addClass(this.settings.className[direction]);
  }
  
  set_visible() {
    this.$element.addClass(this.settings.className.visible);
  }

  remove_inlineCSS() {
    this.debug('Removing inline css styles', this.$style);
    if (this.$style && this.$style.length > 0) {
      this.$style.remove();
    }
  }

  // ios scroll on html not document
  remove_ios() {
    this.$html.removeClass(this.settings.className.ios);
  }

  // context
  remove_pushed() {
    this.$context.removeClass(this.settings.className.pushed);
  }

  remove_pushable() {
    this.$context.removeClass(this.settings.className.pushable);
  }

  // sidebar
  remove_active() {
    this.$element.removeClass(this.settings.className.active);
  }

  remove_animating() {
    this.$element.removeClass(this.settings.className.animating);
  }

  remove_transition(transition = this.get_transition()) {
    this.$element.removeClass(transition);
  }

  remove_direction(direction) {
    direction = direction || this.get_direction();
    this.$element.removeClass(this.settings.className[direction]);
  }

  remove_visible() {
    this.$element.removeClass(this.settings.className.visible);
  }

  is_ie(): boolean {
    let
      isIE11 = (!(window.ActiveXObject) && 'ActiveXObject' in window),
      isIE   = ('ActiveXObject' in window)
    ;
    return (isIE11 || isIE);
  }

  is_ios(): boolean {
    let
      userAgent      = navigator.userAgent,
      isIOS          = userAgent.match(this.settings.regExp.ios),
      isMobileChrome = userAgent.match(this.settings.regExp.mobileChrome)
    ;
    if (isIOS && !isMobileChrome) {
      this.verbose('Browser was found to be iOS', userAgent);
      return true;
    }
    else {
      return false;
    }
  }

  is_mobile(): boolean {
    let
      userAgent    = navigator.userAgent,
      isMobile     = userAgent.match(this.settings.regExp.mobile)
    ;
    if (isMobile) {
      this.verbose('Browser was found to be mobile', userAgent);
      return true;
    }
    else {
      this.verbose('Browser is not mobile, using regular transition', userAgent);
      return false;
    }
  }

  is_hidden(): boolean {
    return !this.is_visible();
  }

  is_visible(): boolean {
    return this.$element.hasClass(this.settings.className.visible);
  }

  // alias
  is_open(): boolean {
    return this.is_visible();
  }

  is_closed(): boolean {
    return this.is_hidden();
  }

  is_vertical(): boolean {
    return this.$element.hasClass(this.settings.className.top);
  }

  is_animating(): boolean {
    return this.$context.hasClass(this.settings.className.animating);
  }

  is_rtl(): boolean {
    if (this.cache.rtl === undefined) {
      this.cache.rtl = this.$element.attr('dir') === 'rtl' || this.$element.css('direction') === 'rtl';
    }
    return this.cache.rtl;
  }
}