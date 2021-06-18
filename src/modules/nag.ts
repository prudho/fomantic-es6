'use strict';

import { Module, ModuleOptions } from '../module'
import Utils from '../utils';

import $, { Cash } from 'cash-dom';

// Adds easing
// $.extend( $.easing, {
//   easeOutQuad: function (x, t, b, c, d) {
//     return -c *(t/=d)*(t-2) + b;
//   }
// });

export interface NagOptions extends ModuleOptions {
  // allows cookie to be overridden
  persist     : boolean;

  // set to zero to require manually dismissal, otherwise hides on its own
  displayTime : number;

  animation   : {
    show : string;
    hide : string;
  },

  context       : string;
  detachable    : boolean;

  expires       : number;

// cookie storage only options
  domain        : boolean;
  path          : string;
  secure        : boolean;
  samesite      : boolean;

  // type of storage to use
  storageMethod : string;

  // value to store in dismissed localstorage/cookie
  key           : string;
  value         : string;

// Key suffix to support expiration in localstorage
  expirationKey : string;

  error: {
    noStorage       : string;
    method          : string;
    setItem         : string;
    expiresFormat   : string;
  },

  className     : {
    bottom : string;
    fixed  : string;
  },

  selector      : {
    close : string;
  },

  duration      : number;
  easing        : string;

  // callback before show animation, return false to prevent show
  onShow        : Function;

  // called after show animation
  onVisible     : Function;

  // callback before hide animation, return false to prevent hide
  onHide        : Function;

  // callback after hide animation
  onHidden      : Function;
}

const default_settings: NagOptions = {
  name        : 'Nag',
  namespace   : 'Nag',
  
  silent      : false,
  debug       : false,
  verbose     : false,
  performance : true,

  // allows cookie to be overridden
  persist     : false,

  // set to zero to require manually dismissal, otherwise hides on its own
  displayTime : 0,

  animation   : {
    show : 'slide',
    hide : 'slide'
  },

  context       : null,
  detachable    : false,

  expires       : 30,

// cookie storage only options
  domain        : false,
  path          : '/',
  secure        : false,
  samesite      : false,

  // type of storage to use
  storageMethod : 'cookie',

  // value to store in dismissed localstorage/cookie
  key           : 'nag',
  value         : 'dismiss',

// Key suffix to support expiration in localstorage
  expirationKey : 'ExpirationDate',

  error: {
    noStorage       : 'Unsupported storage method',
    method          : 'The method you called is not defined.',
    setItem         : 'Unexpected error while setting value',
    expiresFormat   : '"expires" must be a number of days or a Date Object'
  },

  className     : {
    bottom : 'bottom',
    fixed  : 'fixed'
  },

  selector      : {
    close : ':scope> .close.icon'
  },

  duration      : 500,
  easing        : 'easeOutQuad',

  // callback before show animation, return false to prevent show
  onShow        : function() {},

  // called after show animation
  onVisible     : function() {},

  // callback before hide animation, return false to prevent hide
  onHide        : function() {},

  // callback after hide animation
  onHidden      : function() {}
}

export class Nag extends Module {
  settings: NagOptions;

  $context: Cash;

  storage;

  constructor(selector: string, parameters: any) {
    super(selector, parameters, default_settings);

    this.$context = (this.settings.context)
      ? $(this.settings.context)
      : $('body')
    ;
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing element');
    this.storage = this.get_storage();
    this.$element
      .on('click' + this.eventNamespace, this.settings.selector.close, this.dismiss.bind(this))
      .data(this.moduleNamespace, this)
    ;

    if (this.settings.detachable && this.$element.parent()[0] !== this.$context[0]) {
      this.$element
        .detach()
        .prependTo(this.$context)
      ;
    }

    if (this.settings.displayTime > 0) {
      setTimeout(this.hide, this.settings.displayTime);
    }
    this.show();
  }

  destroy(): void {
    this.verbose('Destroying instance');
    this.$element
      .removeAttr(this.moduleNamespace)
      .off(this.eventNamespace)
    ;
  }

  clear(): void {
    this.storage_remove(this.settings.key);
  }

  dismiss(event): void {
    if (this.hide() !== false && this.settings.storageMethod) {
      this.debug('Dismissing nag', this.settings.storageMethod, this.settings.key, this.settings.value, this.settings.expires);
      this.storage_set(this.settings.key, this.settings.value);
    }
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  show() {
    if (this.should_show() && !this.$element.is('visible') ) {
      if (this.settings.onShow.call(this.element) === false) {
        this.debug('onShow callback returned false, cancelling nag animation');
        return false;
      }
      this.debug('Showing nag', this.settings.animation.show);
      if (this.settings.animation.show === 'fade') {
        // this.$element.fadeIn(this.settings.duration, this.settings.easing, this.settings.onVisible);
        Utils.fadeIn(this.$element, this.settings.duration, this.settings.easing, this.settings.onVisible)
      }
      else {
        // this.$element.slideDown(this.settings.duration, this.settings.easing, this.settings.onVisible);
        Utils.slideDown(this.$element, this.settings.duration, this.settings.onVisible);
      }
    }
  }

  hide() {
    if (this.settings.onHide.call(this.element) === false) {
      this.debug('onHide callback returned false, cancelling nag animation');
      return false;
    }
    this.debug('Hiding nag', this.settings.animation.hide);
    if (this.settings.animation.hide === 'fade') {
      // this.$element.fadeOut(this.settings.duration, this.settings.easing, this.settings.onHidden);
      Utils.fadeOut(this.$element, this.settings.duration, this.settings.easing, this.settings.onHidden)
    }
    else {
      // this.$element.slideUp(this.settings.duration, this.settings.easing, this.settings.onHidden);
      Utils.slideUp(this.$element, this.settings.duration, this.settings.onHidden);
    }
  }

  get_expirationDate(expires) {
    if (typeof expires === 'number') {
      expires = new Date(Date.now() + expires * 864e5);
    }
    if (expires instanceof Date && expires.getTime()) {
      return expires.toUTCString();
    } else {
      this.error(this.settings.error.expiresFormat);
    }
  }

  get_storage() {
    if (this.settings.storageMethod === 'localstorage' && window.localStorage !== undefined) {
      this.debug('Using local storage');
      return window.localStorage;
    }
    else if (this.settings.storageMethod === 'sessionstorage' && window.sessionStorage !== undefined) {
      this.debug('Using session storage');
      return window.sessionStorage;
    }
    else if ("cookie" in document) {
      this.debug('Using cookie');
      return {
        setItem: (key, value, options) => {
          // RFC6265 compliant encoding
          key   = encodeURIComponent(key)
            .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
            .replace(/[()]/g, escape)
          ;
          value = encodeURIComponent(value)
            .replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
          ;

          let cookieOptions = '';
          for (let option in options) {
            if (options.hasOwnProperty(option)) {
              cookieOptions += '; ' + option;
              if (typeof options[option] === 'string') {
                cookieOptions += '=' + options[option].split(';')[0];
              }
            }
          }
          document.cookie = key + '=' + value + cookieOptions;
        },
        getItem: (key) => {
          let cookies = document.cookie.split('; ');
          for (let i = 0, il = cookies.length; i < il; i++) {
            let
              parts    = cookies[i].split('='),
              foundKey = parts[0].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
            ;
            if (key === foundKey) {
              return parts[1] || '';
            }
          }
        },
        removeItem: (key, options) => {
          this.storage.setItem(key,'',options);
        }
      };
    } else {
      this.error(this.settings.error.noStorage);
    }
  }

  get_storageOptions() {
    let options: any = {};
    if (this.settings.expires) {
      options.expires = this.get_expirationDate(this.settings.expires);
    }
    if (this.settings.domain) {
      options.domain = this.settings.domain;
    }
    if (this.settings.path) {
      options.path = this.settings.path;
    }
    if (this.settings.secure) {
      options.secure = this.settings.secure;
    }
    if (this.settings.samesite) {
      options.samesite = this.settings.samesite;
    }
    return options;
  }

  should_show(): boolean {
    if (this.settings.persist) {
      this.debug('Persistent nag is set, can show nag');
      return true;
    }
    if (this.storage_get(this.settings.key) != this.settings.value.toString() ) {
      this.debug('Stored value is not set, can show nag', this.storage_get(this.settings.key));
      return true;
    }
    this.debug('Stored value is set, cannot show nag', this.storage_get(this.settings.key));
    return false;
  }

  storage_get(key: string): string {
    let storedValue ;
    storedValue = this.storage.getItem(key);
    if (this.storage === window.localStorage) {
      let expiration = this.storage.getItem(key + this.settings.expirationKey);
      if (expiration !== null && expiration !== undefined && new Date(expiration) < new Date()) {
        this.debug('Value in localStorage has expired. Deleting key', key);
        this.storage_remove(key);
        storedValue = null;
      }
    }
    if (storedValue == 'undefined' || storedValue == 'null' || storedValue === undefined || storedValue === null) {
      storedValue = undefined;
    }
    return storedValue;
  }

  storage_remove(key): void {
    let options = this.get_storageOptions();
    options.expires = this.get_expirationDate(-1);
    if (this.storage === window.localStorage) {
      this.storage.removeItem(key + this.settings.expirationKey);
    }
    this.storage.removeItem(key, options);
  }

  storage_set(key, value): void {
    let options = this.get_storageOptions();
    if (this.storage === window.localStorage && options.expires) {
      this.debug('Storing expiration value in localStorage', key, options.expires);
      this.storage.setItem(key + this.settings.expirationKey, options.expires);
    }
    this.debug('Value stored', key, value);
    try {
      this.storage.setItem(key, value, options);
    }
    catch(e) {
      this.error(this.settings.error.setItem, e);
    }
  }
}
    