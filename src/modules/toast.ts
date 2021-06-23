'use strict';

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';
import { Transition } from './transition';

export interface ToastOptions extends ModuleOptions {
  context        : string;

  position       : string;
  horizontal     : boolean;
  class          : string;
  classProgress  : boolean;
  classActions   : boolean;
  classImage     : string;

  title          : string;
  message        : string;
  displayTime    : number;
  minDisplayTime : number;
  wordsPerMinute : number;
  showIcon       : boolean;
  newestOnTop    : boolean;
  showProgress?  : string;
  pauseOnHover   : boolean;
  progressUp     : boolean;
  opacity        : number;
  compact        : boolean;
  closeIcon      : boolean;
  closeOnClick   : boolean;
  cloneModule    : boolean;
  actions?       : [];
  preserveHTML   : boolean;
  showImage?     : string;

  // transition settings
  transition     : {
    showMethod   : string;
    showDuration : number;
    hideMethod   : string;
    hideDuration : number;
    closeEasing  : string;
    closeDuration: number;
  }

  error: {
    method       : string;
    noElement    : string;
    verticalCard : string;
    noTransition : string;
  }

  className      : {
    container    : string;
    box          : string;
    progress     : string;
    toast        : string;
    icon         : string;
    visible      : string;
    content      : string;
    title        : string;
    message      : string;
    actions      : string;
    extraContent : string;
    button       : string;
    buttons      : string;
    close        : string;
    image        : string;
    vertical     : string;
    horizontal   : string;
    attached     : string;
    inverted     : string;
    compact      : string;
    pausable     : string;
    progressing  : string;
    top          : string;
    bottom       : string;
    left         : string;
    basic        : string;
    unclickable  : string;
  }

  icons          : {
    info         : string;
    success      : string;
    warning      : string;
    error        : string;
  }

  selector       : {
    container    : string;
    box          : string;
    toast        : string;
    title        : string;
    message      : string;
    image        : string;
    icon         : string;
    input        : string;
    approve      : string;
    deny         : string;
  }

  fields         : {
    class        : string;
    text         : string;
    icon         : string;
    click        : string;
  }

  // callbacks
  onShow         : Function;
  onVisible      : Function;
  onClick        : Function;
  onHide         : Function;
  onHidden       : Function;
  onRemove       : Function;
  onApprove      : Function;
  onDeny         : Function;
}

const default_settings: ToastOptions = {
  name           : 'Toast',
  namespace      : 'toast',

  silent         : false,
  debug          : false,
  verbose        : false,
  performance    : true,

  context        : 'body',

  position       : 'top right',
  horizontal     : false,
  class          : 'neutral',
  classProgress  : false,
  classActions   : false,
  classImage     : 'mini',

  title          : '',
  message        : '',
  displayTime    : 3000, // set to zero to require manually dismissal, otherwise hides on its own
  minDisplayTime : 1000, // minimum displaytime in case displayTime is set to 'auto'
  wordsPerMinute : 120,
  showIcon       : false,
  newestOnTop    : false,
  pauseOnHover   : true,
  progressUp     : false, //if true, the bar will start at 0% and increase to 100%
  opacity        : 1,
  compact        : true,
  closeIcon      : false,
  closeOnClick   : true,
  cloneModule    : true,
  preserveHTML   : true,

  // transition settings
  transition     : {
    showMethod   : 'scale',
    showDuration : 500,
    hideMethod   : 'scale',
    hideDuration : 500,
    closeEasing  : 'easeOutCubic',  //Set to empty string to stack the closed toast area immediately (old behaviour)
    closeDuration: 500
  },

  error: {
    method       : 'The method you called is not defined.',
    noElement    : 'This module requires ui {element}',
    verticalCard : 'Vertical but not attached actions are not supported for card layout',
    noTransition : 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>'
  },

  className      : {
    container    : 'ui toast-container',
    box          : 'floating toast-box',
    progress     : 'ui attached active progress',
    toast        : 'ui toast',
    icon         : 'centered icon',
    visible      : 'visible',
    content      : 'content',
    title        : 'ui header',
    message      : 'message',
    actions      : 'actions',
    extraContent : 'extra content',
    button       : 'ui button',
    buttons      : 'ui buttons',
    close        : 'close icon',
    image        : 'ui image',
    vertical     : 'vertical',
    horizontal   : 'horizontal',
    attached     : 'attached',
    inverted     : 'inverted',
    compact      : 'compact',
    pausable     : 'pausable',
    progressing  : 'progressing',
    top          : 'top',
    bottom       : 'bottom',
    left         : 'left',
    basic        : 'basic',
    unclickable  : 'unclickable'
  },

  icons          : {
    info         : 'info',
    success      : 'checkmark',
    warning      : 'warning',
    error        : 'times'
  },

  selector       : {
    container    : '.ui.toast-container',
    box          : '.toast-box',
    toast        : '.ui.toast',
    title        : '.header',
    message      : '.message:not(.ui)',
    image        : '> img.image, > .image > img',
    icon         : ':scope> i.icon',
    input        : 'input:not([type="hidden"]), textarea, select, button, .ui.button, ui.dropdown',
    approve      : '.actions .positive, .actions .approve, .actions .ok',
    deny         : '.actions .negative, .actions .deny, .actions .cancel'
  },

  fields         : {
    class        : 'class',
    text         : 'text',
    icon         : 'icon',
    click        : 'click'
  },

  // callbacks
  onShow         : function(){},
  onVisible      : function(){},
  onClick        : function(){},
  onHide         : function(){},
  onHidden       : function(){},
  onRemove       : function(){},
  onApprove      : function(){},
  onDeny         : function(){}
}

export class Toast extends Module {
  settings: ToastOptions;

  $toastBox: Cash;
  $toast: Cash;
  $progress: Cash;
  $progressBar: Cash;
  $animationObject: Cash;
  $actions: Cash;
  $close: Cash;
  $context: Cash;

  isToastComponent: boolean;
  transition: Transition;

  instance: Toast;

  constructor(selector: string, parameters: any) {
    super(selector, parameters, default_settings);

    this.$toastBox    = $(`<div class="${this.settings.className.box}"/>`);
    this.$toast       = $('<div/>');
    this.$progress    = $(`<div class="${this.settings.className.progress} ${this.settings.class}"/>`);
    this.$progressBar = $(`<div class="bar"/>`);

    this.$close       = $(`<i class="close icon"/>`);
    this.$context     = (this.settings.context) ? $(this.settings.context) : $('body');

    this.isToastComponent = this.$element.hasClass('toast') || this.$element.hasClass('message') || this.$element.hasClass('card');
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing element');
    if (!this.has_container()) {
      this.create_container();
    }
    if (this.isToastComponent || this.settings.message !== '' || this.settings.title !== '' || this.get_iconClass() !== '' || this.settings.showImage || this.has_configActions()) {
      if (typeof this.settings.showProgress !== 'string' || [this.settings.className.top, this.settings.className.bottom].indexOf(this.settings.showProgress) === -1) {
        this.settings.showProgress = null;
      }
      this.create_toast();
      if (this.settings.closeOnClick && (this.settings.closeIcon || $(this.$toast).find(this.settings.selector.input).length > 0 || this.has_configActions())) {
        this.settings.closeOnClick = false;
      }
      if (!this.settings.closeOnClick) {
        this.$toastBox.addClass(this.settings.className.unclickable);
      }
      this.bind_events();
    }
    this.instantiate();
    
    if (this.$toastBox) {
      this.show();
    }
  }

  instantiate(): void {
    this.verbose('Storing instance of toast');
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    if (this.$toastBox) {
      this.debug('Removing toast', this.$toastBox);
      this.unbind_events();
      this.$toastBox.remove();
      this.$toastBox = undefined;
      this.$toast = undefined;
      this.$animationObject = undefined;
      this.settings.onRemove.call(this.$toastBox, this.element)
      this.$progress = undefined;
      this.$progressBar = undefined;
      this.$close = undefined;
    }
    this.$element.removeAttr(this.moduleNamespace);
  }

  create_container() {
    this.verbose('Creating container');
    this.$context.append($(`<div class="${this.settings.position} ${this.settings.className.container} ${(this.settings.horizontal ? this.settings.className.horizontal : '')}"/>`));
  }

  create_toast() {
    this.$toastBox = $(`<div class="${this.settings.className.box}"/>`);
    let iconClass = this.get_iconClass();
    if (!this.isToastComponent) {
      this.verbose('Creating toast');
      this.$toast = $('<div/>');
      let $content = $(`<div class="${this.settings.className.content}"/>`);
      if (iconClass !== '') {
        this.$toast.append($(`<i class="${iconClass} ${this.settings.className.icon}"/>`));
      }

      if (this.settings.showImage) {
        this.$toast.append($(`<img src="${this.settings.showImage}" class="${this.settings.className.image} ${this.settings.classImage}">`));
      }
      if (this.settings.title !== '') {
        $content.append($(`<div class="${this.settings.className.title}">${this.settings.title}</div>`));
      }

      $content.append($(`<div class="${this.settings.className.message}">${this.helpers_escape(this.settings.message, this.settings.preserveHTML)}</div>`));

      this.$toast
        .addClass(this.settings.class + ' ' + this.settings.className.toast)
        .append($content)
      ;
      this.$toast.css('opacity', this.settings.opacity);
      if (this.settings.closeIcon) {
        this.$close = $(`<i class="${this.settings.className.close + ' ' + (typeof this.settings.closeIcon === 'string' ? this.settings.closeIcon : '')}"/>`);
        if (this.$close.hasClass(this.settings.className.left)) {
          this.$toast.prepend(this.$close);
        } else {
          this.$toast.append(this.$close);
        }
      }
    } else {
      this.$toast = this.settings.cloneModule ? this.$element.clone().removeAttr('id') : this.$element;
      this.$close = this.$toast.find('> i'+this.helpers_toClass(this.settings.className.close));
      this.settings.closeIcon = (this.$close.length > 0);
      if (iconClass !== '') {
        this.$toast.find(this.settings.selector.icon).attr('class',iconClass + ' ' + this.settings.className.icon);
      }
      if (this.settings.showImage) {
        this.$toast.find(this.settings.selector.image).attr('src',this.settings.showImage);
      }
      if (this.settings.title !== '') {
        this.$toast.find(this.settings.selector.title).html(this.helpers_escape(this.settings.title, this.settings.preserveHTML));
      }
      if (this.settings.message !== '') {
        this.$toast.find(this.settings.selector.message).html(this.helpers_escape(this.settings.message, this.settings.preserveHTML));
      }
    }
    if (this.$toast.hasClass(this.settings.className.compact)) {
      this.settings.compact = true;
    }
    if (this.$toast.hasClass('card')) {
      this.settings.compact = false;
    }
    this.$actions = this.$toast.find('.actions');
    if (this.has_configActions()) {
      if (this.$actions.length === 0) {
        this.$actions = $(`<div class="${this.settings.className.actions} ${(this.settings.classActions || '')}"/>`).appendTo(this.$toast);
      }
      if (this.$toast.hasClass('card') && !this.$actions.hasClass(this.settings.className.attached)) {
        this.$actions.addClass(this.settings.className.extraContent);
        if (this.$actions.hasClass(this.settings.className.vertical)) {
          this.$actions.removeClass(this.settings.className.vertical);
          this.error(this.settings.error.verticalCard);
        }
      }
      this.settings.actions.forEach(function (el) {
        let icon = el[this.settings.fields.icon] ? '<i class="${this.helpers_deQuote(el[this.settings.fields.icon])} icon"></i>' : '',
          text = this.helpers_escape(el[this.settings.fields.text] || '', this.settings.preserveHTML),
          cls = this.helpers_deQuote(el[this.settings.fields.class] || ''),
          click = el[this.settings.fields.click] && $.isFunction(el[this.settings.fields.click]) ? el[this.settings.fields.click] : function () {}
        ;
        this.$actions.append($(`<button class="${this.settings.className.button} ${cls}">${icon + text}</div>`));
        this.$actions.on('click', () => {
          if (click.call(this.element, this.$element) === false) {
            return;
          }
          this.close();
        })
      });
    }
    if (this.$actions && this.$actions.hasClass(this.settings.className.vertical)) {
      this.$toast.addClass(this.settings.className.vertical);
    }
    if (this.$actions.length > 0 && !this.$actions.hasClass(this.settings.className.attached)) {
      if (this.$actions && (!this.$actions.hasClass(this.settings.className.basic) || this.$actions.hasClass(this.settings.className.left))) {
        this.$toast.addClass(this.settings.className.actions);
      }
    }
    if (this.settings.displayTime === null) {
      this.settings.displayTime = Math.max(this.settings.minDisplayTime, this.$toast.text().split(" ").length / this.settings.wordsPerMinute * 60000);
    }
    this.$toastBox.append(this.$toast);

    if (this.$actions.length > 0 && this.$actions.hasClass(this.settings.className.attached)) {
      this.$actions.addClass(this.settings.className.buttons);
      this.$actions.detach();
      this.$toast.addClass(this.settings.className.attached);
      if (!this.$actions.hasClass(this.settings.className.vertical)) {
        if (this.$actions.hasClass(this.settings.className.top)) {
          this.$toastBox.prepend(this.$actions);
          this.$toast.addClass(this.settings.className.bottom);
        } else {
          this.$toastBox.append(this.$actions);
          this.$toast.addClass(this.settings.className.top);
        }
      } else {
        this.$toast.wrap(
          $(`<div class="${this.settings.className.vertical} ${this.settings.className.attached} ${(this.settings.compact ? this.settings.className.compact : '')}"/>`)
        );
        if (this.$actions.hasClass(this.settings.className.left)) {
          this.$toast.addClass(this.settings.className.left).parent().addClass(this.settings.className.left).prepend(this.$actions);
        } else {
          this.$toast.parent().append(this.$actions);
        }
      }
    }
    if (this.$element !==this.$toast) {
      this.$element = this.$toast;
      this.element = this.$toast[0];
    }
    if (this.settings.displayTime > 0) {
      let progressingClass = this.settings.className.progressing+' '+(this.settings.pauseOnHover ? this.settings.className.pausable:'');
      if (!!this.settings.showProgress) {
        let $progress = $(`<div class="${this.settings.className.progress} ${(this.settings.classProgress || this.settings.class)}" data-percent=""/>`);
        if (!this.settings.classProgress) {
          if (this.$toast.hasClass('toast') && !this.$toast.hasClass(this.settings.className.inverted)) {
            $progress.addClass(this.settings.className.inverted);
          } else {
            $progress.removeClass(this.settings.className.inverted);
          }
        }
        let $progressBar = $(`<div class="bar ${(this.settings.progressUp ? 'up ' : 'down ')+progressingClass}"/>`);
        $progress
          .addClass(this.settings.showProgress)
          .append($progressBar)
        ;
        if ($progress.hasClass(this.settings.className.top)) {
          this.$toastBox.prepend($progress);
        } else {
          this.$toastBox.append($progress);
        }
        $progressBar.css('animation-duration', this.settings.displayTime / 1000 + 's');
      }
      this.$animationObject = $(`<span class="${'wait '+progressingClass}"/>`);
      this.$animationObject.css('animation-duration', this.settings.displayTime / 1000 + 's');
      this.$animationObject.appendTo(this.$toast);
    }
    if (this.settings.compact) {
      this.$toastBox.addClass(this.settings.className.compact);
      this.$toast.addClass(this.settings.className.compact);
      if (this.$progress) {
        this.$progress.addClass(this.settings.className.compact);
      }
    }
    if (this.settings.newestOnTop) {
      this.$toastBox.prependTo(this.get_container());
    }
    else {
      this.$toastBox.appendTo(this.get_container());
    }
  }

  show(callback: Function = () => {}) {
    this.debug('Showing toast');
    if (this.settings.onShow.call(this.$toastBox, this.element) === false) {
      this.debug('onShow callback returned false, cancelling toast animation');
      return;
    }
    this.animate_show(callback);
  }

  close(callback: Function = () => {}) {
    this.remove_visible();
    this.unbind_events();
    this.animate_close(callback);
  }

  animate_show(callback: Function = () => {}): void {
    // if (this.settings.transition && this.can_useElement('transition') && $module.transition('is supported')) {
    if (this.settings.transition) {
      this.set_visible();

      this.transition = new Transition(this.$toastBox, {
        animation  : this.settings.transition.showMethod + ' in',
        queue      : false,
        debug      : this.settings.debug,
        verbose    : this.settings.verbose,
        duration   : this.settings.transition.showDuration,
        onComplete : () => {
          callback.call(this.$toastBox, this.element);
          this.settings.onVisible.call(this.$toastBox, this.element);
        }
      });
    }
  }

  animate_close(callback: Function = () => {}): void {
    callback = $.isFunction(callback) ? callback : () => {};
    this.debug('Closing toast');
    if (this.settings.onHide.call(this.$toastBox, this.element) === false) {
      this.debug('onHide callback returned false, cancelling toast animation');
      return;
    }
    // if (this.settings.transition && this.can_useElement('transition') && $module.transition('is supported')) {
    if (this.settings.transition) {
      this.transition = new Transition(this.$toastBox, {
        animation  : this.settings.transition.hideMethod + ' out',
        queue      : false,
        duration   : this.settings.transition.hideDuration,
        debug      : this.settings.debug,
        verbose    : this.settings.verbose,
        interval   : 50,
        onBeforeHide : (callback: Function = () => {}) => {
          // TODO
          if (this.settings.transition.closeEasing !== '') {
              if (this.$toastBox) {
                this.$toastBox.css('opacity', 0);
                // this.$toastBox.wrap('<div/>').parent().hide(this.settings.transition.closeDuration, this.settings.transition.closeEasing, function () {
                //   if (this.$toastBox) {
                //     this.$toastBox.parent().remove();
                //     callback.call(this.$toastBox);
                //   }
                // });
              }
          } else {
            callback.call(this.$toastBox);
          }
        },
        onComplete :() => {
          callback.call(this.$toastBox, this.element);
          this.settings.onHidden.call(this.$toastBox, this.element);
          this.destroy();
        }
      });      
    }
    else {
      this.error(this.settings.error.noTransition);
    }
  }

  animate_pause(): void {
    this.$animationObject.css('animationPlayState','paused');
    if (this.$progressBar) {
      this.$progressBar.css('animationPlayState', 'paused');
    }
  }

  animate_continue(): void {
    this.$animationObject.css('animationPlayState','running');
    if (this.$progressBar) {
      this.$progressBar.css('animationPlayState', 'running');
    }
  }

  bind_events(): void {
    this.debug('Binding events to toast');
    if (this.settings.closeOnClick || this.settings.closeIcon) {
      (this.settings.closeIcon ? this.$close : this.$toast).on('click' + this.eventNamespace, this.event_click.bind(this));
    }
    if (this.$animationObject) {
      this.$animationObject.on('animationend' + this.eventNamespace, this.close.bind(this));
    }

    this.$toastBox.find(this.settings.selector.approve).on('click' + this.eventNamespace, this.event_approve.bind(this));
    this.$toastBox.find(this.settings.selector.deny).on('click' + this.eventNamespace, this.event_deny.bind(this));
  }

  unbind_events(): void {
    this.debug('Unbinding events to toast');
    if (this.settings.closeOnClick || this.settings.closeIcon) {
      (this.settings.closeIcon ? this.$close : this.$toast).off('click' + this.eventNamespace);
    }
    if (this.$animationObject) {
      this.$animationObject.off('animationend' + this.eventNamespace);
    }
    this.$toastBox.off('click' + this.eventNamespace);
  }

  event_click(event) {
    if ($(event.target).closest('a').length === 0) {
      this.settings.onClick.call(this.$toastBox, this.element)
      this.close();
    }
  }

  event_approve() {
    if (this.settings.onApprove.call(this.element, this.$element) === false) {
      this.verbose('Approve callback returned false cancelling close');
      return;
    }
    this.close();
  }

  event_deny() {
    if (this.settings.onDeny.call(this.element, this.$element) === false) {
      this.verbose('Deny callback returned false cancelling close');
      return;
    }
    this.close();
  }

  can_useElement(element) {
    if ($.fn[element] !== undefined) {
      return true;
    }
    this.error(this.settings.error.noElement.replace('{element}', element));
    return false;
  }

  has_configActions(): boolean {
    return Array.isArray(this.settings.actions) && this.settings.actions.length > 0;
  }

  has_container(): boolean {
    this.verbose('Determining if there is already a container');
    return (this.$context.find(this.helpers_toClass(this.settings.position) + this.settings.selector.container + (this.settings.horizontal ? this.helpers_toClass(this.settings.className.horizontal) : '')).length > 0);
  }

  has_toast(): boolean {
    return !!this.get_toast();
  }

  has_toasts(): boolean {
    return this.get_toasts().length > 0;
  }

  get_container() {
    return (this.$context.find(this.helpers_toClass(this.settings.position) + this.settings.selector.container)[0]);
  }

  get_iconClass(): string {
    return typeof this.settings.showIcon === 'string' ? this.settings.showIcon : this.settings.showIcon && this.settings.icons[this.settings.class] ? this.settings.icons[this.settings.class] : '';
  }

  get_remainingTime() {
    return this.$animationObject ? parseFloat(this.$animationObject.css('opacity')) * this.settings.displayTime : 0;
  }

  get_toastBox() {
    return this.$toastBox || null;
  }

  get_toast() {
    return this.$toast || null;
  }

  get_toasts() {
    return $(this.get_container()).find(this.settings.selector.box);
  }

  set_visible(): void {
    this.$toast.addClass(this.settings.className.visible);
  }

  remove_visible(): void {
    this.$toast.removeClass(this.settings.className.visible);
  }

  helpers_deQuote(string): string {
    return String(string).replace(/"/g,"");
  }

  helpers_escape(string: string, preserveHTML: boolean) {
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

  helpers_toClass(selector: string): string {
    let
      classes = selector.split(' '),
      result = ''
    ;

    classes.forEach(function (element: string) {
      result += '.' + element;
    });

    return result;
  }
}
