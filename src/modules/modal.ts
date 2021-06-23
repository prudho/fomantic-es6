"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';
import { Dimmer } from './dimmer';
import { Transition } from './transition';

export interface ModalOptions extends ModuleOptions {
  useFlex        : boolean;
  offset         : number;

  observeChanges : boolean;

  allowMultiple  : boolean;
  detachable     : boolean;
  closable       : boolean;
  autofocus      : boolean;
  restoreFocus   : boolean;
  autoShow       : boolean;

  inverted       : boolean;
  blurring       : boolean;

  centered       : boolean;

  dimmerSettings : {
    closable : boolean;
    useCSS   : boolean;
  }

  // whether to use keyboard shortcuts
  keyboardShortcuts: boolean;

  context    : string;

  queue      : boolean;
  duration   : number;
  transition : string;

  // padding with edge of page
  padding    : number;
  scrollbarWidth: number;

  //dynamic content
  title        : string;
  content      : string;
  class        : string;
  classTitle   : string;
  classContent : string;
  classActions : string;
  closeIcon    : boolean;
  actions      : [];
  preserveHTML : boolean;

  fields         : {
    class        : string;
    text         : string;
    icon         : string;
    click        : string;
  }

  selector    : {
    title    : string;
    content  : string;
    actions  : string;
    close    : string;
    approve  : string;
    deny     : string;
    modal    : string;
    dimmer   : string;
    bodyFixed: string;
    prompt   : string;
  }

  error : {
    dimmer      : string;
    method      : string;
    notFound    : string;
    noTransition: string
  }

  className : {
    active     : string;
    animating  : string;
    blurring   : string;
    inverted   : string;
    legacy     : string;
    loading    : string;
    scrolling  : string;
    undetached : string;
    front      : string;
    close      : string;
    button     : string;
    modal      : string;
    title      : string;
    content    : string;
    actions    : string;
    template   : string;
    ok         : string;
    cancel     : string;
    prompt     : string;
  }

  text: {
    ok    : string;
    cancel: string;
  }

  templates: {
    getArguments: Function;
    alert: Function;
    confirm: Function;
    prompt: Function;
  }

  // called before show animation
  onShow     : Function;

  // called after show animation
  onVisible  : Function;

  // called before hide animation
  onHide     : Function;

  // called after hide animation
  onHidden   : Function;

  // called after approve selector match
  onApprove  : Function;

  // called after deny selector match
  onDeny     : Function;
}

const default_settings: ModalOptions = {
  name           : 'Modal',
  namespace      : 'modal',

  useFlex        : null,
  offset         : 0,

  silent         : false,
  debug          : false,
  verbose        : false,
  performance    : true,

  observeChanges : false,

  allowMultiple  : false,
  detachable     : true,
  closable       : true,
  autofocus      : true,
  restoreFocus   : true,
  autoShow       : false,

  inverted       : false,
  blurring       : false,

  centered       : true,

  dimmerSettings : {
    closable : false,
    useCSS   : true
  },

  // whether to use keyboard shortcuts
  keyboardShortcuts: true,

  context    : 'body',

  queue      : false,
  duration   : 500,
  transition : 'scale',

  // padding with edge of page
  padding    : 50,
  scrollbarWidth: 10,

  //dynamic content
  title        : '',
  content      : '',
  class        : '',
  classTitle   : '',
  classContent : '',
  classActions : '',
  closeIcon    : false,
  actions      : [],
  preserveHTML : true,

  fields         : {
    class        : 'class',
    text         : 'text',
    icon         : 'icon',
    click        : 'click'
  },

  selector    : {
    title    : '> .header',
    content  : '> .content',
    actions  : '> .actions',
    close    : ':scope > .close',
    approve  : '.actions .positive, .actions .approve, .actions .ok',
    deny     : '.actions .negative, .actions .deny, .actions .cancel',
    modal    : '.ui.modal',
    dimmer   : '> .ui.dimmer',
    bodyFixed: ':scope > .ui.fixed.menu, :scope > .ui.right.toast-container, :scope > .ui.right.sidebar, :scope > .ui.fixed.nag, :scope > .ui.fixed.nag :scope > .close',
    prompt   : '.ui.input > input'
  },
  error : {
    dimmer      : 'UI Dimmer, a required component is not included in this page',
    method      : 'The method you called is not defined.',
    notFound    : 'The element you specified could not be found',
    noTransition: 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>'
  },
  className : {
    active     : 'active',
    animating  : 'animating',
    blurring   : 'blurring',
    inverted   : 'inverted',
    legacy     : 'legacy',
    loading    : 'loading',
    scrolling  : 'scrolling',
    undetached : 'undetached',
    front      : 'front',
    close      : 'close icon',
    button     : 'ui button',
    modal      : 'ui modal',
    title      : 'header',
    content    : 'content',
    actions    : 'actions',
    template   : 'ui tiny modal',
    ok         : 'positive',
    cancel     : 'negative',
    prompt     : 'ui fluid input'
  },
  text: {
    ok    : 'Ok',
    cancel: 'Cancel'
  },

  templates: {
    getArguments: function(args) {
      let queryArguments = [].slice.call(args);
      if ($.isPlainObject(queryArguments[0])) {
        return $.extend({
          handler:function() {},
          content:'',
          title: ''
        }, queryArguments[0]);
      } else {
        if (!$.isFunction(queryArguments[queryArguments.length-1])) {
          queryArguments.push(function() {});
        }
        return {
          handler: queryArguments.pop(),
          content: queryArguments.pop() || '',
          title: queryArguments.pop() || ''
        };
      }
    },
    alert: function () {
      let
        settings = this.get.settings(),
        args     = settings.templates.getArguments(arguments)
      ;
      return {
        title  : args.title,
        content: args.content,
        actions: [{
          text : settings.text.ok,
          class: settings.className.ok,
          click: args.handler
        }]
      }
    },
    confirm: function () {
      let
        settings = this.get.settings(),
        args     = settings.templates.getArguments(arguments)
      ;
      return {
        title  : args.title,
        content: args.content,
        actions: [{
          text : settings.text.ok,
          class: settings.className.ok,
          click: function() {args.handler(true)}
        },{
          text: settings.text.cancel,
          class: settings.className.cancel,
          click: function() {args.handler(false)}
        }]
      }
    },
    prompt: function () {
      let
        $this    = this,
        settings = this.get.settings(),
        args     = settings.templates.getArguments(arguments),
        input    = $($.parseHTML(args.content)).filter('.ui.input')
      ;
      if (input.length === 0) {
        args.content += '<p><div class="'+settings.className.prompt+'"><input placeholder="'+this.helpers.deQuote(args.placeholder || '')+'" type="text" value="'+this.helpers.deQuote(args.defaultValue || '')+'"></div></p>';
      }
      return {
        title  : args.title,
        content: args.content,
        actions: [{
          text: settings.text.ok,
          class: settings.className.ok,
          click: function() {
            let
              settings = $this.get.settings(),
              inputField = $this.get.element().find(settings.selector.prompt)[0]
            ;
            args.handler($(inputField).val());
          }
        },{
          text: settings.text.cancel,
          class: settings.className.cancel,
          click: function() {args.handler(null)}
        }]
      }
    }
  },

  // called before show animation
  onShow     : function(){},

  // called after show animation
  onVisible  : function(){},

  // called before hide animation
  onHide     : function(){ return true; },

  // called after hide animation
  onHidden   : null,

  // called after approve selector match
  onApprove  : function(){ return true; },

  // called after deny selector match
  onDeny     : function(){ return true; }
}

class Cache {
  isEdge: boolean;
  isIE: boolean;
  isFirefox: boolean;
  isRTL: boolean;
  isSafari: boolean;
  pageHeight: number;
  contextHeight: number;
  height: number;
  width: number;
  topOffset: number;
  scrollHeight: number;
  leftBodyScrollbar: boolean;
}

export class Modal extends Module {
  settings: ModalOptions;
  
  id: string;
  elementEventNamespace: string;
  observer: MutationObserver;
  cache: Cache;

  ignoreRepeatedEvents: boolean;
  initialMouseDownInScrollbar: boolean;
  initialMouseDownInModal: boolean;

  initialBodyMargin = '';
  tempBodyMargin: number = 0;

  $close: Cash;
  $context: Cash;
  $otherModals: Cash;
  $allModals: Cash;
  $window: Cash = $(window);
  $body: Cash = $('body');
  $document: Cash = $(document)
  $focusedElement: Cash;

  transition: Transition;
  dimmer: Dimmer;
  $dimmer: Cash;
  $dimmable: Cash;

  instance: Modal;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$context        = $(this.settings.context);
    this.$close          = this.$element.find(this.settings.selector.close);
    
    this.initialize();
  }

  initialize(): void {
    if (!this.$element.hasClass('modal')) {
      this.create_modal();
      if (!$.isFunction(this.settings.onHidden)) {
        this.settings.onHidden = () => {
          this.destroy();
          this.$element.remove();
        };
      }
    }
    this.$element.addClass(this.settings.class);
    if (this.settings.title !== '') {
      this.$element.find(this.settings.selector.title).html(this.helpers_escape(this.settings.title, this.settings.preserveHTML)).addClass(this.settings.classTitle);
    }
    if (this.settings.content !== '') {
      this.$element.find(this.settings.selector.content).html(this.helpers_escape(this.settings.content, this.settings.preserveHTML)).addClass(this.settings.classContent);
    }
    if (this.has_configActions()) {
      let $actions = this.$element.find(this.settings.selector.actions).addClass(this.settings.classActions);
      this.settings.actions.forEach(function (el) {
        let
          icon = el[this.settings.fields.icon] ? '<i class="' + this.helpers_deQuote(el[this.settings.fields.icon]) + ' icon"></i>' : '',
          text = this.helpers_escape(el[this.settings.fields.text] || '', this.settings.preserveHTML),
          cls = this.helpers_deQuote(el[this.settings.fields.class] || ''),
          click = el[this.settings.fields.click] && $.isFunction(el[this.settings.fields.click]) ? el[this.settings.fields.click] : function () {}
        ;
        $actions.append($(`<button class="${this.settings.className.button + ' ' + cls}">${icon + text}</button>`));
        
        // // Click sur le boutton
        // click: function () {
        //   if (click.call(element, this.$element) === false) {
        //     return;
        //   }
        //   this.hide();
        // }
      });
    }
    this.cache = new Cache;
    this.verbose('Initializing dimmer', this.$context);

    this.create_id();
    this.create_dimmer();

    if (this.settings.allowMultiple) {
      this.create_innerDimmer();
    }
    if (!this.settings.centered) {
      this.$element.addClass('top aligned');
    }
    this.refreshModals();

    this.bind_events();
    if (this.settings.observeChanges) {
      this.observeChanges();
    }
    this.instantiate();
    if (this.settings.autoShow) {
      this.show();
    }
  }

  instantiate(): void {
    this.verbose('Storing instance of modal');
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.verbose('Destroying previous modal');
    this.$element
      .removeAttr(this.moduleNamespace)
      .off(this.eventNamespace)
    ;
    this.$window.off(this.elementEventNamespace);
    this.$dimmer.off(this.elementEventNamespace);
    this.$close.off(this.eventNamespace);
    // this.$context.dimmer('destroy');
    this.dimmer.destroy();
  }

  refresh(): void {
    this.remove_scrolling();
    this.cacheSizes();
    if (!this.can_useFlex()) {
      this.set_modalOffset();
    }
    this.set_screenHeight();
    this.set_type();
  }

  toggle(): void {
    if (this.is_active() || this.is_animating()) {
      this.hide();
    }
    else {
      this.show();
    }
  }

  refreshModals(): void {
    this.$otherModals = this.$element.siblings(this.settings.selector.modal);
    this.$allModals   = this.$otherModals.add(this.$element);
  }

  create_modal(): void {
    this.$element = $(`<div class="${this.settings.className.modal}"/>`);
    if (this.settings.closeIcon) {
      this.$close = $(`<i class="${this.settings.className.close}"/>`);
      this.$element.append(this.$close);
    }
    if (this.settings.title !== '') {
      $(`<div class="${this.settings.className.title}"/>`).appendTo(this.$element);
    }
    if (this.settings.content !== '') {
      $(`<div class="${this.settings.className.content}"/>`).appendTo(this.$element);
    }
    if (this.has_configActions()) {
      $(`<div class="${this.settings.className.actions}}"/>`).appendTo(this.$element);
    }
    this.$context.append(this.$element);
  }

  create_dimmer(): void {
    let
      defaultSettings = {
        debug      : this.settings.debug,
        dimmerName : 'modals'
      },
      dimmerSettings = $.extend(true, defaultSettings, this.settings.dimmerSettings)
    ;
    // FIXME
    // if ($.fn.dimmer === undefined) {
    //   this.error(this.settings.error.dimmer);
    //   return;
    // }
    this.debug('Creating dimmer');
    this.dimmer = new Dimmer(this.settings.context, dimmerSettings);
    this.$dimmable = this.dimmer.$dimmable;
    //$dimmable = this.$context.dimmer(dimmerSettings);
    if (this.settings.detachable) {
      this.verbose('Modal is detachable, moving content into dimmer');
      this.dimmer.add_content(this.$element);
      //$dimmable.dimmer('add content', this.$element);
    }
    else {
      this.set_undetached();
    }
    this.$dimmer = this.dimmer.get_dimmer();
    // $dimmer = $dimmable.dimmer('get dimmer');
  }

  create_id(): void {
    this.id = (Math.random().toString(16) + '000000000').substr(2, 8);
    this.elementEventNamespace = '.' + this.id;
    this.verbose('Creating unique id for element', this.id);
  }

  create_innerDimmer(): void {
    if (this.$element.find(this.settings.selector.dimmer).length == 0) {
      this.$element.prepend('<div class="ui inverted dimmer"></div>');
    }
  }

  bind_events(): void {
    this.verbose('Attaching events');
    this.$element.find(this.settings.selector.close).on(  'click' + this.eventNamespace, this.event_close.bind(this));
    this.$element.find(this.settings.selector.approve).on('click' + this.eventNamespace, this.event_approve.bind(this));
    this.$element.find(this.settings.selector.deny).on(   'click' + this.eventNamespace, this.event_deny.bind(this));

    this.$window.on('resize' + this.elementEventNamespace, this.event_resize.bind(this));
  }

  bind_scrollLock(): void {
    // touch events default to passive, due to changes in chrome to optimize mobile perf
    this.$dimmable.get(0).addEventListener('touchmove', this.event_preventScroll.bind(this), { passive: false });
  }

  unbind_scrollLock(): void {
    // INVESTIGATE
    // this.$dimmable.get(0).removeEventListener('touchmove', this.event_preventScroll.bind(this), { passive: false });
  }

  event_close(): void {
    this.hide();
  }

  event_approve(): void {
    if (this.ignoreRepeatedEvents || this.settings.onApprove.call(this.element, this.$element) === false) {
      this.verbose('Approve callback returned false cancelling hide');
      return;
    }
    this.ignoreRepeatedEvents = true;
    this.hide(() => {
      this.ignoreRepeatedEvents = false;
    });
  }

  // INVESTIGATE
  // event_debounce(method, delay) {
  //   clearTimeout(this.timer);
  //   this.timer = setTimeout(method, delay);
  // }

  event_deny(): void {
    if (this.ignoreRepeatedEvents || this.settings.onDeny.call(this.element, this.$element) === false) {
      this.verbose('Deny callback returned false cancelling hide');
      return;
    }
    this.ignoreRepeatedEvents = true;
    this.hide(() => {
      this.ignoreRepeatedEvents = false;
    });
  }

  event_keyboard(event): void {
    let
      keyCode   = event.which,
      escapeKey = 27
    ;
    if (keyCode == escapeKey) {
      if (this.settings.closable) {
        this.debug('Escape key pressed hiding modal');
        if (this.$element.hasClass(this.settings.className.front)) {
          this.hide();
        }
      }
      else {
        this.debug('Escape key pressed, but closable is set to false');
      }
      event.preventDefault();
    }
  }

  event_mousedown(event): void {
    let
      $target   = $(event.target),
      isRtl = this.is_rtl();
    ;
    this.initialMouseDownInModal = ($target.closest(this.settings.selector.modal).length > 0);
    if (this.initialMouseDownInModal) {
      this.verbose('Mouse down event registered inside the modal');
    }
    this.initialMouseDownInScrollbar = this.is_scrolling() && ((!isRtl && $(window).outerWidth() - this.settings.scrollbarWidth <= event.clientX) || (isRtl && this.settings.scrollbarWidth >= event.clientX));
    if (this.initialMouseDownInScrollbar) {
      this.verbose('Mouse down event registered inside the scrollbar');
    }
  }

  event_mouseup(event): void {
    if (!this.settings.closable) {
      this.verbose('Dimmer clicked but closable setting is disabled');
      return;
    }
    if (this.initialMouseDownInModal) {
      this.debug('Dimmer clicked but mouse down was initially registered inside the modal');
      return;
    }
    if (this.initialMouseDownInScrollbar) {
      this.debug('Dimmer clicked but mouse down was initially registered inside the scrollbar');
      return;
    }
    let
      $target   = $(event.target),
      isInModal = ($target.closest(this.settings.selector.modal).length > 0),
      // isInDOM   = $.contains(document.documentElement, event.target)
      isInDOM   = document.documentElement !== event.target && document.documentElement.contains(event.target)
    ;
    if (!isInModal && isInDOM && this.is_active() && this.$element.hasClass(this.settings.className.front)) {
      this.debug('Dimmer clicked, hiding all modals');
      if (this.settings.allowMultiple) {
        if (!this.hideAll(undefined)) {
          return;
        }
      }
      else if (!this.hide()) {
        return;
      }
      this.remove_clickaway();
    }
  }

  event_resize(): void {
    if (this.dimmer.is_active() && ( this.is_animating() || this.is_active() ) ) {
    // if (this.$dimmable.dimmer('is active') && (this.is_animating() || this.is_active())) {
      requestAnimationFrame(this.refresh);
    }
  }

  event_preventScroll(event): void {
    if (event.target.className.indexOf('dimmer') !== -1) {
      event.preventDefault();
    }
  }

  observeChanges(): void {
    if ('MutationObserver' in window) {
      this.observer = new MutationObserver((mutations) => {
        this.debug('DOM tree modified, refreshing');
        this.refresh();
      });
      // this.observer.observe(this.element, {
      //   childList : true,
      //   subtree   : true
      // });
      this.debug('Setting up mutation observer', this.observer);
    }
  }

  show(callback: Function = () => {}): void {
    this.refreshModals();
    this.set_dimmerSettings();
    this.set_dimmerStyles();

    this.showModal(callback);
  }

  showDimmer(): void {
    // if ($dimmable.dimmer('is animating') || !$dimmable.dimmer('is active') ) {
    if (this.dimmer.is_animating() || !this.dimmer.is_active()) {
      this.save_bodyMargin();
      this.debug('Showing dimmer');
      // $dimmable.dimmer('show');
      this.dimmer.show();
    }
    else {
      this.debug('Dimmer already visible');
    }
  }

  hide(callback: Function = () => {}): boolean {
    this.refreshModals();
    return this.hideModal(callback, false, undefined);
  }

  hideDimmer(): void {
    if (this.dimmer.is_animating() || this.dimmer.is_active()) {
      this.unbind_scrollLock();
      this.dimmer.hide(() => {
        this.restore_bodyMargin();
        this.remove_clickaway();
        this.remove_screenHeight();
      });
    }
    else {
      this.debug('Dimmer is not visible cannot hide');
      return;
    }
  }
  
  hideAll(callback: Function = () => {}): boolean {
    let $visibleModals = this.$allModals.filter('.' + this.settings.className.active + ', .' + this.settings.className.animating);
    if ($visibleModals.length > 0) {
      this.debug('Hiding all visible modals');
      let hideOk = true;
      //check in reverse order trying to hide most top displayed modal first
      $($visibleModals.get().reverse()).each(function(index,element) {
          if (hideOk) {
            // TODO: hide other modals
            //hideOk = $(element).modal('hide modal', callback, false, true);
          }
      });
      if (hideOk) {
        this.hideDimmer();
      }
      return hideOk;
    }
  }

  cacheSizes(): void {
    this.$element.addClass(this.settings.className.loading);
    let
      scrollHeight = this.$element.prop('scrollHeight'),
      modalWidth   = this.$element.outerWidth(),
      modalHeight  = this.$element.outerHeight()
    ;
    if (this.cache.pageHeight === undefined || modalHeight !== 0) {
      $.extend(this.cache, {
        pageHeight    : $(document).outerHeight(),
        width         : modalWidth,
        height        : modalHeight + this.settings.offset,
        scrollHeight  : scrollHeight + this.settings.offset,
        contextHeight : (this.settings.context == 'body')
          ? $(window).height()
          : this.$dimmable.height(),
      });
      this.cache.topOffset = -(this.cache.height / 2);
    }
    this.$element.removeClass(this.settings.className.loading);
    this.debug('Caching modal and container sizes', this.cache);
  }

  showModal(callback: Function = () => {}): void {
    if (this.is_animating() || !this.is_active()) {
      this.showDimmer();
      this.cacheSizes();
      this.set_bodyMargin();
      if (this.can_useFlex()) {
        this.remove_legacy();
      }
      else {
        this.set_legacy();
        this.set_modalOffset();
        this.debug('Using non-flex legacy modal positioning.');
      }
      this.set_screenHeight();
      this.set_type();
      this.set_clickaway();

      if (!this.settings.allowMultiple && this.others_active()) {
        this.hideOthers(this.showModal.bind(this));
      }
      else {
        this.ignoreRepeatedEvents = false;
        if (this.settings.allowMultiple) {
          if (this.others_active()) {
            this.$otherModals.filter('.' + this.settings.className.active).find(this.settings.selector.dimmer).addClass('active');
          }

          if (this.settings.detachable) {
            this.$element.detach().appendTo(this.$dimmer);
          }
        }
        this.settings.onShow.call(this.element);
        // if (this.settings.transition && $.fn.transition !== undefined && $module.transition('is supported')) {
        if (this.settings.transition) {
          this.debug('Showing modal with css animations');

          this.transition = new Transition(this.element, {
            debug       : this.settings.debug,
            animation   : (this.settings.transition.showMethod || this.settings.transition) + ' in',
            queue       : this.settings.queue,
            duration    : this.settings.transition.showDuration || this.settings.duration,
            useFailSafe : true,
            onComplete  : () => {
              console.log('complete')
              this.settings.onVisible.apply(this.element);
              if (this.settings.keyboardShortcuts) {
                this.add_keyboardShortcuts();
              }
              this.save_focus();
              this.set_active();
              if (this.settings.autofocus) {
                this.set_autofocus();
              }
              callback();
            }
          });
        }
        else {
          this.error(this.settings.error.noTransition);
        }
      }
    }
    else {
      this.debug('Modal is already visible');
    }
  }

  hideModal(callback: Function = () => {}, keepDimmed: boolean, hideOthersToo: boolean): boolean {
    let $previousModal = this.$otherModals.filter('.' + this.settings.className.active).last();
    this.debug('Hiding modal');
    // if (settings.onHide.call(element, $(this)) === false) {
    if (this.settings.onHide.call(this.element, this.$element) === false) {
      this.verbose('Hide callback returned false cancelling hide');
      this.ignoreRepeatedEvents = false;
      return false;
    }

    if (this.is_animating() || this.is_active()) {
      // if (settings.transition && $.fn.transition !== undefined && $module.transition('is supported')) {
      if (this.settings.transition) {
        this.remove_active();

        this.transition = new Transition(this.element, {
          debug       : this.settings.debug,
          animation   : (this.settings.transition.hideMethod || this.settings.transition) + ' out',
          queue       : this.settings.queue,
          duration    : this.settings.transition.hideDuration || this.settings.duration,
          useFailSafe : true,
          onStart     : () => {
            if (!this.others_active() && !this.others_animating() && !keepDimmed) {
              this.hideDimmer();
            }
            if (this.settings.keyboardShortcuts && !this.others_active()) {
              this.remove_keyboardShortcuts();
            }
          },
          onComplete  : () => {
            this.unbind_scrollLock();
            if (this.settings.allowMultiple) {
              $previousModal.addClass(this.settings.className.front);
              this.$element.removeClass(this.settings.className.front);
  
              if (hideOthersToo) {
                this.$allModals.find(this.settings.selector.dimmer).removeClass('active');
              }
              else {
                $previousModal.find(this.settings.selector.dimmer).removeClass('active');
              }
            }
            if ($.isFunction(this.settings.onHidden)) {
              this.settings.onHidden.call(this.element);
            }
            this.remove_dimmerStyles();
            this.restore_focus();
            callback();
          }
        });
      }
      else {
        this.error(this.settings.error.noTransition);
      }
    }
  }

  add_keyboardShortcuts(): void {
    this.verbose('Adding keyboard shortcuts');
    this.$document.on('keyup' + this.eventNamespace, this.event_keyboard.bind(this));
  }

  remove_keyboardShortcuts(): void {
    this.verbose('Removing keyboard shortcuts');
    this.$document.off('keyup' + this.eventNamespace);
  }

  is_active(): boolean {
    return this.$element.hasClass(this.settings.className.active);
  }

  is_animating(): boolean {
    // return this.$element.transition('is supported')
    return this.transition !== undefined
      ? this.transition.is_animating()
      // : this.$element.is(':visible')
      : this.$element.is('.visible')
    ;
  }

  is_edge(): boolean {
    if (this.cache.isEdge === undefined) {
      this.cache.isEdge = !!window.setImmediate && !this.is_ie();
    }
    return this.cache.isEdge;
  }

  is_ie(): boolean {
    if (this.cache.isIE === undefined) {
      let
        isIE11 = (!(window.ActiveXObject) && 'ActiveXObject' in window),
        isIE = ('ActiveXObject' in window)
      ;
      this.cache.isIE = (isIE11 || isIE);
    }
    return this.cache.isIE;
  }

  is_firefox(): boolean {
    if (this.cache.isFirefox === undefined) {
      // INVESTIGATE
      // this.cache.isFirefox = !!window.InstallTrigger;
    }
    return this.cache.isFirefox;
  }

  is_iframe(): boolean {
    return !(self === top);
  }

  is_modernBrowser() {
    // appName for IE11 reports 'Netscape' can no longer use
    return !(window.ActiveXObject || 'ActiveXObject' in window);
  }

  is_rtl(): boolean {
    if (this.cache.isRTL === undefined) {
      this.cache.isRTL = this.$body.attr('dir') === 'rtl' || this.$body.css('direction') === 'rtl';
    }
    return this.cache.isRTL;
  }

  is_safari(): boolean {
    if (this.cache.isSafari === undefined) {
      // INVESTIGATE
      // this.cache.isSafari = /constructor/i.test(window.HTMLElement) || !!window.ApplePaySession;
    }
    return this.cache.isSafari;
  }

  is_scrolling(): boolean {
    return this.$dimmable.hasClass(this.settings.className.scrolling);
  }

  can_fit(): boolean {
    let
      contextHeight  = this.cache.contextHeight,
      verticalCenter = this.cache.contextHeight / 2,
      topOffset      = this.cache.topOffset,
      scrollHeight   = this.cache.scrollHeight,
      height         = this.cache.height,
      paddingHeight  = this.settings.padding,
      startPosition  = (verticalCenter + topOffset)
    ;
    return (scrollHeight > height)
      ? (startPosition + scrollHeight + paddingHeight < contextHeight)
      : (height + (paddingHeight * 2) < contextHeight)
    ;
  }

  can_leftBodyScrollbar(): boolean {
    if (this.cache.leftBodyScrollbar === undefined) {
      this.cache.leftBodyScrollbar = this.is_rtl() && ((this.is_iframe() && !this.is_firefox()) || this.is_safari() || this.is_edge() || this.is_ie());
    }
    return this.cache.leftBodyScrollbar;
  }

  can_useFlex(): boolean {
    if (this.settings.useFlex === null) {
      return this.settings.detachable && !this.is_ie();
    }
    if (this.settings.useFlex && this.is_ie()) {
      this.debug('useFlex true is not supported in IE');
    } else if (this.settings.useFlex && !this.settings.detachable) {
      this.debug('useFlex true in combination with detachable false is not supported');
    }
    return this.settings.useFlex;
  }

  has_configActions(): boolean {
    return Array.isArray(this.settings.actions) && this.settings.actions.length > 0;
  }

  get_element() {
    return this.$element;
  }

  get_id(): string {
    return (Math.random().toString(16) + '000000000').substr(2, 8);
  }

  get_settings() {
    return this.settings;
  }

  set_active(): void {
    this.$element.addClass(this.settings.className.active + ' ' + this.settings.className.front);
    this.$otherModals.filter('.' + this.settings.className.active).removeClass(this.settings.className.front);
  }

  set_autofocus(): void {
    let
      // $inputs    = this.$element.find('[tabindex], :input').filter(':visible').filter(function() {
      $inputs    = this.$element.find('[tabindex], input').filter('.visible').filter(function() {
        return $(this).closest('.disabled').length === 0;
      }),
      $autofocus = $inputs.filter('[autofocus]'),
      $input     = ($autofocus.length > 0)
        ? $autofocus.first()
        : $inputs.first()
    ;
    if ($input.length > 0) {
      $input.trigger('focus');
    }
  }

  set_bodyMargin(): void {
    let position = this.can_leftBodyScrollbar() ? 'left':'right';
    if (this.settings.detachable || this.can_fit()) {
      this.$body.css('margin-'+position, this.tempBodyMargin + 'px');
    }
    let o = this;
    this.$body.find(this.settings.selector.bodyFixed.replace('right',position)).each(function() {
      let
        el = $(this),
        attribute = el.css('position') === 'fixed' ? 'padding-'+position : position
      ;
      el.css(attribute, 'calc(' + el.css(attribute) + ' + ' + o.tempBodyMargin + 'px)');
    });
  }

  set_clickaway(): void {
    if (!this.settings.detachable) {
      this.$element.on('mousedown' + this.elementEventNamespace, this.event_mousedown.bind(this));
    }
    this.$dimmer.on('mousedown' + this.elementEventNamespace, this.event_mousedown.bind(this));
    this.$dimmer.on('mouseup' + this.elementEventNamespace, this.event_mouseup.bind(this));
  }

  set_dimmerSettings(): void {
    // FIXME
    // if ($.fn.dimmer === undefined) {
    //   this.error(this.settings.error.dimmer);
    //   return;
    // }
    let
      defaultSettings = {
        debug      : this.settings.debug,
        dimmerName : 'modals',
        closable   : 'auto',
        useFlex    : this.can_useFlex(),
        duration   : {
          show     : this.settings.transition.showDuration || this.settings.duration,
          hide     : this.settings.transition.hideDuration || this.settings.duration
        }
      },
      dimmerSettings = $.extend(true, defaultSettings, this.settings.dimmerSettings)
    ;
    if (this.settings.inverted) {
      dimmerSettings.variation = (dimmerSettings.variation !== undefined)
        ? dimmerSettings.variation + ' inverted'
        : 'inverted'
      ;
    }
    // this.$context.dimmer('setting', dimmerSettings);
    this.dimmer.setting(dimmerSettings, undefined);
  }

  set_dimmerStyles(): void {
    if (this.settings.inverted) {
      this.$dimmer.addClass(this.settings.className.inverted);
    }
    else {
      this.$dimmer.removeClass(this.settings.className.inverted);
    }
    if (this.settings.blurring) {
      this.$dimmable.addClass(this.settings.className.blurring);
    }
    else {
      this.$dimmable.removeClass(this.settings.className.blurring);
    }
  }

  set_modalOffset(): void {
    if (!this.settings.detachable) {
      let canFit = this.can_fit();
      this.$element
        .css({
          top: (!this.$element.hasClass('aligned') && canFit)
            // ? $(document).scrollTop() + (this.cache.contextHeight - this.cache.height) / 2
            ? document.body.scrollTop + (this.cache.contextHeight - this.cache.height) / 2
            : !canFit || this.$element.hasClass('top')
              // ? $(document).scrollTop() + this.settings.padding
              // : $(document).scrollTop() + (this.cache.contextHeight - this.cache.height - this.settings.padding),
              ? document.body.scrollTop + this.settings.padding
              : document.body.scrollTop + (this.cache.contextHeight - this.cache.height - this.settings.padding),
          marginLeft: -(this.cache.width / 2)
        }) 
      ;
    } else {
      this.$element.css({
        marginTop: (!this.$element.hasClass('aligned') && this.can_fit())
          ? -(this.cache.height / 2)
          : this.settings.padding / 2,
        marginLeft: -(this.cache.width / 2)
      });
    }
    this.verbose('Setting modal offset for legacy mode');
  }

  set_legacy(): void {
    this.$element.addClass(this.settings.className.legacy);
  }

  set_screenHeight(): void {
    if (this.can_fit()) {
      this.$body.css('height', '');
    }
    else if (!this.$element.hasClass('bottom')) {
      this.debug('Modal is taller than page content, resizing page height');
      this.$body.css('height', this.cache.height + (this.settings.padding * 2) );
    }
  }

  set_scrolling(): void {
    this.$dimmable.addClass(this.settings.className.scrolling);
    this.$element.addClass(this.settings.className.scrolling);
    this.unbind_scrollLock();
  }

  set_type(): void {
    if (this.can_fit()) {
      this.verbose('Modal fits on screen');
      if (!this.others_active() && !this.others_animating()) {
        this.remove_scrolling();
        this.bind_scrollLock();
      }
    }
    else if (!this.$element.hasClass('bottom')) {
      this.verbose('Modal cannot fit on screen setting to scrolling');
      this.set_scrolling();
    } else {
      this.verbose('Bottom aligned modal not fitting on screen is unsupported for scrolling');
    }
  }

  set_undetached(): void {
    this.$dimmable.addClass(this.settings.className.undetached);
  }

  save_bodyMargin(): void {
    this.initialBodyMargin = this.$body.css('margin-'+(this.can_leftBodyScrollbar() ? 'left':'right'));
    let 
      bodyMarginRightPixel = parseInt(this.initialBodyMargin.replace(/[^\d.]/g, '')),
      bodyScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    ;
    this.tempBodyMargin = bodyMarginRightPixel + bodyScrollbarWidth;
  }

  save_focus(): void {
    let
      $activeElement = $(document.activeElement),
      inCurrentModal = $activeElement.closest(this.$element).length > 0
    ;
    if (!inCurrentModal) {
      this.$focusedElement = $(document.activeElement).trigger('blur');
    }
  }

  remove_active(): void {
    this.$element.removeClass(this.settings.className.active);
  }

  remove_bodyStyle(): void {
    if (this.$body.attr('style') === '') {
      this.verbose('Removing style attribute');
      this.$body.removeAttr('style');
    }
  }

  remove_clickaway(): void {
    if (!this.settings.detachable) {
      this.$element.off('mousedown' + this.elementEventNamespace);
    }           
    this.$dimmer.off('mousedown' + this.elementEventNamespace);
    this.$dimmer.off('mouseup' + this.elementEventNamespace);
  }

  remove_dimmerStyles(): void {
    this.$dimmer.removeClass(this.settings.className.inverted);
    this.$dimmable.removeClass(this.settings.className.blurring);
  }

  remove_legacy(): void {
    this.$element.removeClass(this.settings.className.legacy);
  }

  remove_screenHeight(): void {
    this.debug('Removing page height');
    this.$body.css('height', '');
  }

  remove_scrolling(): void {
    this.$dimmable.removeClass(this.settings.className.scrolling);
    this.$element.removeClass(this.settings.className.scrolling);
  }

  restore_bodyMargin(): void {
    let position = this.can_leftBodyScrollbar() ? 'left':'right';
    this.$body.css('margin-'+position, this.initialBodyMargin);
    this.$body.find(this.settings.selector.bodyFixed.replace('right',position)).each(function() {
      let
        el = $(this),
        attribute = el.css('position') === 'fixed' ? 'padding-'+position : position
      ;
      el.css(attribute, '');
    });
  }

  restore_focus(): void {
    if (this.$focusedElement && this.$focusedElement.length > 0 && this.settings.restoreFocus) {
      this.$focusedElement.trigger('focus');
    }
  }

  others_active(): boolean {
    return (this.$otherModals.filter('.' + this.settings.className.active).length > 0);
  }

  others_animating(): boolean {
    return (this.$otherModals.filter('.' + this.settings.className.animating).length > 0);
  }

  attachEvent(selector, event): void {
    let $toggle = $(selector);
    event = $.isFunction(this[event])
      ? this[event]
      : this.toggle
    ;
    if ($toggle.length > 0) {
      this.debug('Attaching modal events to element', selector, event);
      $toggle
        .off(this.eventNamespace)
        .on('click' + this.eventNamespace, event)
      ;
    }
    else {
      this.error(this.settings.error.notFound, selector);
    }
  }

  hideOthers(callback: Function = () => {}): void {
    let $visibleModals = this.$otherModals.filter('.' + this.settings.className.active + ', .' + this.settings.className.animating);
    if ($visibleModals.length > 0) {
      this.debug('Hiding other modals', this.$otherModals);
      // TODO
      // $visibleModals.modal('hide modal', callback, true);
    }
  }

  helpers_deQuote(string: string): string {
    return String(string).replace(/"/g,"");
  }

  helpers_escape(string: string, preserveHTML: boolean): string {
    if (preserveHTML) {
      return string;
    }
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
  }
}