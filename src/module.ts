"use strict";

import $, { Cash } from 'cash-dom';

export interface ModuleOptions {
  name?       : string;
  namespace?  : string;

  silent?     : boolean;
  debug?      : boolean,
  verbose?    : boolean,
  performance?: boolean,
} 

export abstract class Module {
  selector: string;
  element: HTMLElement;
  $element: Cash;
  settings: any;
  time: number | boolean;
  performance: any;
  callbacks:Array<any>;
  eventNamespace: string;
  moduleNamespace: string;

  constructor(selector: any, parameters, settings: ModuleOptions) {
    this.selector = selector;

    if (typeof selector === 'string') {
      this.element = document.querySelector(this.selector);
    } else if (Array.isArray(this.selector)) {
      this.element = document.querySelector(this.selector);
    } else {
      this.element = this.selector;
    }

    this.$element = $(this.selector);
    this.settings = $.extend(settings, parameters);
    this.time = new Date().getTime();
    this.performance = [];
    this.callbacks = [];
    this.eventNamespace = '.' + this.settings.namespace;
    this.moduleNamespace = 'module-' + this.settings.namespace;
  }

  invokeCallback(name: string, ...args): Function {
    let method = this.callbacks.find(obj => { return obj.name === name });

    if (method !== undefined) {
      if (method.once) {
        this.off(name);
      }

      return method.callback;
    } else {
      return function() {};
    }
  }

  on(event, callback, once: boolean = false): void {
    if (this.settings.events.indexOf(event) != -1) {
      this.register_callback(event, callback, once === undefined ? false : once);
    } else {
      throw Error('Unrecognized event: ' + event);
    }
  }

  once(event, callback): void {
    this.on(event, callback, true);
  }

  off(event) {
    let callback = this.get_registered_callback(event);

    if (callback !== undefined) {
      this.debug('Unregistering callback', event);
      this.callbacks.splice(this.callbacks.indexOf(callback));
    }
  }

  bind(event, callback): void {
    this.on(event, callback);
  }

  unbind(event): void {
    this.off(event);
  }

  get_registered_callback(callbackName) {
    return (this.callbacks.find(obj => { return obj.name === callbackName }));
  }

  register_callback(eventName, callback, once): void {
    if (!this.get_registered_callback(eventName) !== undefined) {
      this.callbacks.push({name: eventName , callback: callback, once: once});
    }
  }

  setting(name, value = undefined): any {
    if ($.isPlainObject(name)) {
      this.debug('Changing setting', name, value);
      $.extend(true, this.settings, name);
    }
    else if (value !== undefined) {
      this.debug('Changing setting', name, value);
      if ($.isPlainObject(this.settings[name])) {
        $.extend(true, this.settings[name], value);
      }
      else {
        this.settings[name] = value;
      }
    }
    else {
      this.debug('Getting setting', name);
      return this.settings[name];
    }
  }

  debug(...args): void {
    if (!this.settings.silent && this.settings.debug) {
      if (this.settings.performance) {
        this.performance_log(args);
      } else {
        this.debug = Function.prototype.bind.call(console.info, console, this.settings.name + ':');
        this.debug.apply(console, args);
      }
    }
  }

  verbose(...args): void {
    if (!this.settings.silent && this.settings.verbose && this.settings.debug) {
      if (this.settings.performance) {
        this.performance_log(args);
      } else {
        this.verbose = Function.prototype.bind.call(console.info, console, this.settings.name + ':');
        this.verbose.apply(console, args);
      }
    }
  }

  error(...args): void {
    if (!this.settings.silent) {
      this.error = Function.prototype.bind.call(console.error, console, this.settings.name + ':');
      this.error.apply(console, args);
    }
  }

  performance_log(message): void {
    let
      currentTime: number,
      executionTime,
      previousTime,
      module = this,
      performance_display = function() {
        let title = module.settings.name + ":",
          totalTime = 0;
        module.time = false;
        clearTimeout(module.performance.timer);
        module.performance.forEach(function (data) {
          totalTime += data["Execution Time"];
        });
        title += " " + totalTime + "ms";
        if (module.selector) {
          title += " '" + module.selector + "'";
        }
        /*if ($allModules.length > 1) {
          title += ' ' + '(' + $allModules.length + ')';
        }*/
        if (
          (console.group !== undefined || console.table !== undefined) &&
          module.performance.length > 0
        ) {
          console.groupCollapsed(title);
          if (console.table) {
            console.table(module.performance);
          } else {
            module.performance.forEach(function (data) {
              console.log(data["Name"] + ": " + data["Execution Time"] + "ms");
            });
          }
          console.groupEnd();
        }
        module.performance = [];
      }
    ;
    if (this.settings.performance) {
      currentTime   = new Date().getTime();
      previousTime  = this.time || currentTime;
      executionTime = currentTime - previousTime;
      this.time          = currentTime;
      this.performance.push({
        'Name'           : message[0],
        'Arguments'      : [].slice.call(message, 1) || '',
        'Element'        : this.element,
        'Execution Time' : executionTime
      });
    }
    clearTimeout(this.performance.timer);
    this.performance.timer = setTimeout(performance_display, 500);
  }
}
