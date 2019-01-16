"use strict";

import $ from 'cash-dom';

export default class Module {
    constructor(selector, parameters, settings) {
        this.selector = selector;
        if ($.isArray(this.selector)) {
            this.element = document.querySelector(this.selector);
        } else {
            this.element = this.selector
        }
        this.$element = $(this.selector);
        this.settings = $.extend(settings, parameters);
        this.time = new Date().getTime();
        this.performance = [];
        this.callbacks = [];
        this.eventNamespace = '.' + this.settings.namespace;
        this.moduleNamespace = 'module-' + this.settings.namespace;
    }

    invokeCallback(name, ...args) {
        var method = this.callbacks.find(obj => { return obj.name === name });

        if (method !== undefined) {
            if (method.once) {
                this.off(name);
            }

            return method.callback;
        } else {
            return function() {};
        }
    }

    on(event, callback, once) {
        if (this.settings.events.indexOf(event) != -1) {
            this.register_callback(event, callback, once === undefined ? false : once);
        } else {
            throw Error('Unrecognized event: ' + event);
        }
    }

    once(event, callback) {
        this.on(event, callback, true);
    }

    off(event) {
        var callback = this.get_registered_callback(event);

        if (callback !== undefined) {
            this.debug('Unregistering callback', event);
            this.callbacks.splice(this.callbacks.indexOf(callback));
        }
    }

    bind(event, callback) {
        this.on(event, callback);
    }

    unbind(event) {
        this.off(event);
    }

    get_registered_callback(callbackName) {
        return (this.callbacks.find(obj => { return obj.name === callbackName }));
    }

    register_callback(eventName, callback, once) {
        if (!this.get_registered_callback(eventName) !== undefined) {
            this.callbacks.push({name: eventName , callback: callback, once: once});
        }
    }

    debug() {
        if(!this.settings.silent && this.settings.debug) {
            if(this.settings.performance) {
                this.performance_log(arguments);
            } else {
                this.debug = Function.prototype.bind.call(console.info, console, this.settings.name + ':');
                this.debug.apply(console, arguments);
            }
        }
    }

    verbose() {
        if(!this.settings.silent && this.settings.verbose && this.settings.debug) {
            if(this.settings.performance) {
                this.performance_log(arguments);
            } else {
                this.verbose = Function.prototype.bind.call(console.info, console, this.settings.name + ':');
                this.verbose.apply(console, arguments);
            }
        }
    }

    error() {
        if(!this.settings.silent) {
            this.error = Function.prototype.bind.call(console.error, console, this.settings.name + ':');
            this.error.apply(console, arguments);
        }
    }

    performance_log(message) {
        var
            currentTime,
            executionTime,
            previousTime,
            module = this,
            performance_display = function() {
                var
                    title = module.settings.name + ':',
                    totalTime = 0
                ;
                module.time = false;
                clearTimeout(module.performance.timer);
                module.performance.forEach(function(data) {
                    totalTime += data['Execution Time'];
                });
                title += ' ' + totalTime + 'ms';
                if (module.selector) {
                    title += ' \'' + module.selector + '\'';
                }
                /*if($allModules.length > 1) {
                    title += ' ' + '(' + $allModules.length + ')';
                }*/
                if ((console.group !== undefined || console.table !== undefined) && module.performance.length > 0) {
                    console.groupCollapsed(title);
                    if (console.table) {
                        console.table(module.performance);
                    } else {
                        module.performance.forEach(function(data) {
                            console.log(data['Name'] + ': ' + data['Execution Time']+'ms')
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