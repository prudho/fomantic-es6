"use strict";

import Module from '../module'

import $ from 'cash-dom';

import './transition'
import { Transition } from './transition';

const clickEvent  = ('ontouchstart' in document.documentElement) ? 'touchstart' : 'click';

const settings = {
    name        : 'Dimmer',
    namespace   : 'dimmer',

    silent      : false,
    debug       : false,
    verbose     : false,
    performance : true,

    useFlex     : true, // whether should use flex layout
    dimmerName  : false, // name to distinguish between multiple dimmers in context
    variation   : false, // whether to add a variation type
    closable    : 'auto', // whether to bind close events
    useCSS      : true, // whether to use css animations
    transition  : 'fade', // css animation to use
    on          : false, // event to bind to
    opacity     : 'auto', // overriding opacity value

    // transition durations
    duration    : {
        show : 500,
        hide : 500
    },
    // whether the dynamically created dimmer should have a loader
    displayLoader: false,
    loaderText  : false,
    loaderVariation : '',

    error   : {
        method   : 'The method you called is not defined.'
    },

    className : {
        active     : 'active',
        animating  : 'animating',
        dimmable   : 'dimmable',
        dimmed     : 'dimmed',
        dimmer     : 'dimmer',
        disabled   : 'disabled',
        hide       : 'hide',
        legacy     : 'legacy',
        pageDimmer : 'page',
        show       : 'show',
        loader     : 'ui loader'
    },

    selector: {
        dimmer   : ':scope > .ui.dimmer',
        content  : '.ui.dimmer > .content, .ui.dimmer > .content > .center'
    },

    template: {
        dimmer: function(settings) {
            var
                d = $('<div/>').addClass('ui dimmer'),
                l
            ;
            if (settings.displayLoader) {
                l = $('<div/>')
                    .addClass(settings.className.loader)
                    .addClass(settings.loaderVariation);
                if (!!settings.loaderText) {
                    l.text(settings.loaderText);
                    l.addClass('text');
                }
                d.append(l);
            }
            return d;
        }
    },

    events: ['change', 'show', 'hide']
}

export class Dimmer extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);
        
        this.preinitialize();

        this.initialize();
    }

    preinitialize() {
        if (this.is_dimmer()) {
            this.$dimmable = this.$element.parent();
            this.$dimmer   = this.$element;
        } else {
            this.$dimmable = this.$element;
            if (this.has_dimmer()) {
                if(this.settings.dimmerName) {
                    this.$dimmer = this.$dimmable.find(this.settings.selector.dimmer).filter('.' + this.settings.dimmerName);
                }
                else {
                    this.$dimmer = this.$dimmable.find(this.settings.selector.dimmer);
                }
            } else {
                this.$dimmer = this.create();
            }
        }
    }

    initialize() {
        this.verbose('Initializing dimmer module', this.settings);

        this.bind_events();
        this.set_dimmable();
        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous module', this.$dimmer);
        this.unbind_events();
        this.remove_variation();      
    }

    bind_events() {
        if (this.settings.on == 'hover') {
            this.$dimmable
              .on('mouseenter' + this.eventNamespace, this.show.bind(this))
              .on('mouseleave' + this.eventNamespace, this.hide.bind(this))
            ;
        } else if (this.settings.on == 'click') {
            this.$dimmable.on(clickEvent + this.eventNamespace, this.toggle.bind(this));
        }
        if (this.is_page()) {
            this.debug('Setting as a page dimmer', this.$dimmable);
            this.set_pageDimmer();
        }

        if (this.is_closable()) {
            this.verbose('Adding dimmer close event', this.$dimmer);
            this.$dimmable.on(clickEvent + this.eventNamespace, this.event_click.bind(this));

            // TODO
            /*$dimmable
                .on(clickEvent + eventNamespace, selector.dimmer, module.event.click)
            ;*/
        }
    }

    event_click(event) {
        this.verbose('Determining if event occured on dimmer', event);
        //if (this.$dimmer.find(event.target).length === 0 || $(event.target).is(this.settings.selector.content)) { INVESTIGATE
        if ($(event.target).is(this.settings.selector.content)) {
            this.hide();
            event.stopImmediatePropagation();
        }
    }

    unbind_events() {
        this.$element.removeData(this.moduleNamespace);
        this.$dimmable.off(this.eventNamespace);
    }

    create() {
        var
            $element = $(this.settings.template.dimmer(this.settings))
        ;
        if (this.settings.dimmerName) {
            this.debug('Creating named dimmer', this.settings.dimmerName);
            $element.addClass(this.settings.dimmerName);
        }
        $element.appendTo(this.$dimmable);
        return $element;
    }

    show(callback) {
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        this.debug('Showing dimmer', this.$dimmer, this.settings);
        this.set_variation();
        if((!this.is_dimmed() || this.is_animating()) && this.is_enabled()) {
            this.animate_show(callback);
            this.invokeCallback('show', this.element);
            this.invokeCallback('change', this.element);
        } else {
            this.debug('Dimmer is already shown or disabled');
        }
    }

    hide(callback) {
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (this.is_dimmed() || this.is_animating()) {
            this.debug('Hiding dimmer', this.$dimmer);
            this.animate_hide(callback);
            this.invokeCallback('hide', this.element);
            this.invokeCallback('change', this.element);
        }
        else {
            this.debug('Dimmer is not visible');
        }
    }

    animate_show(callback) {
        var module = this;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (this.settings.useCSS) { // TODO: add a check if Transition class is loaded... old code includes && $.fn.transition !== undefined  && $dimmer.transition('is supported')
            if (this.settings.useFlex) {
                this.debug('Using flex dimmer');
                this.remove_legacy();
            } else {
                this.debug('Using legacy non-flex dimmer');
                this.set_legacy();
            }
            if (settings.opacity !== 'auto') {
                this.set_opacity();
            }
            var transition = new Transition(this.$dimmer, {
                displayType : this.settings.useFlex ? 'flex' : 'block',
                animation   : this.settings.transition + ' in',
                queue       : false,
                duration    : this.get_duration(),
                useFailSafe : true
            });

            // FIXME
            //transition.on('start', function() {
                module.set_dimmed();
            //})

            transition.on('complete', function() {
                module.set_active();
                callback();
            })
        } else {
            /*
            // fadeTo is not supported in Cash...
            this.verbose('Showing dimmer animation with javascript');
            this.set_dimmed();
            if (this.settings.opacity == 'auto') {
                this.settings.opacity = 0.8;
            }
            this.$dimmer
                //.stop()
                .css({
                    opacity : 0,
                    width   : '100%',
                    height  : '100%'
                })
                .fadeTo(this.get_duration(), this.settings.opacity, function() {
                    module.$dimmer.removeAttr('style');
                    module.set_active();
                    callback();
                })
            ;*/
        }
    }

    animate_hide(callback) {
        var module = this;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (this.settings.useCSS) { // TODO: add a check if Transition class is loaded... old code includes && $.fn.transition !== undefined  && $dimmer.transition('is supported')
            this.verbose('Hiding dimmer with css');
            var transition = new Transition(this.$dimmer, {
                displayType : this.settings.useFlex ? 'flex' : 'block',
                animation   : this.settings.transition + ' out',
                queue       : false,
                duration    : this.get_duration(),
                useFailSafe : true
            });

            // FIXME
            //transition.on('start', function() {
                module.remove_dimmed();
            //})

            transition.on('complete', function() {
                module.remove_variation();
                module.remove_active();
                callback();
            })
        }
        else {
            /*
            // fadeTo is not supported in Cash...
            module.verbose('Hiding dimmer with javascript');
            module.remove.dimmed();
            $dimmer
            .stop()
            .fadeOut(module.get.duration(), function() {
                module.remove.active();
                $dimmer.removeAttr('style');
                callback();
            })
            ;
            */
        }
    }

    toggle() {
        this.verbose('Toggling dimmer visibility', this.$dimmer);
        if (!this.is_dimmed()) {
            this.show();
        } else {
            if (this.is_closable()) {
                this.hide();
            }
        }
    }

    get_dimmer() { 
        return this.$dimmer;
     }    

    get_duration() {
        if (typeof this.settings.duration == 'object') {
            if (this.is_active()) {
                return this.settings.duration.hide;
            } else {
                return this.settings.duration.show;
            }
        }
        return this.settings.duration;
    }

    set_active() {
        this.$dimmer.addClass(this.settings.className.active);
    }

    set_dimmable() {
        this.$dimmable.addClass(this.settings.className.dimmable);
    }

    set_dimmed() {
        this.$dimmable.addClass(this.settings.className.dimmed);
    }

    set_disabled() {
        this.$dimmer.addClass(this.settings.className.disabled);
    }

    set_legacy() {
        this.$dimmer.addClass(this.settings.className.legacy);
    }

    set_opacity(opacity) {
        var
            color      = this.$dimmer.css('background-color'),
            colorArray = color.split(','),
            isRGB      = (colorArray && colorArray.length == 3),
            isRGBA     = (colorArray && colorArray.length == 4)
        ;
        opacity    = this.settings.opacity === 0 ? 0 : this.settings.opacity || opacity;
        if (isRGB || isRGBA) {
            colorArray[3] = opacity + ')';
            color         = colorArray.join(',');
        } else {
            color = 'rgba(0, 0, 0, ' + opacity + ')';
        }
        this.debug('Setting opacity to', opacity);
        this.$dimmer.css('background-color', color);
    }

    set_pageDimmer() {
        this.$dimmer.addClass(this.settings.className.pageDimmer);
    }

    set_variation(variation) {
        variation = variation || this.settings.variation;
        if (variation) {
            this.$dimmer.addClass(variation);
        }
    }

    add_content(element) {
        var
            $content = $(element)
        ;
        this.debug('Add content to dimmer', $content);
        if ($content.parent()[0] !== this.$dimmer[0]) {
            $content.detach().appendTo(this.$dimmer);
        }
    }
    

    can_show() {
        return !this.$dimmer.hasClass(this.settings.className.disabled);
    }

    is_active() {
        return this.$dimmer.hasClass(this.settings.className.active);
    }

    is_animating() {
        return (this.$dimmer.is('animated') || this.$dimmer.hasClass(this.settings.className.animating));
    }

    is_closable() {
        if (this.settings.closable == 'auto') {
            if (this.settings.on == 'hover') {
                return false;
            }
            return true;
        }
        return this.settings.closable;
    }

    is_dimmable() {
        return this.$element.hasClass(this.settings.className.dimmable);
    }

    is_dimmed() {
        return this.$dimmable.hasClass(this.settings.className.dimmed);
    }

    is_dimmer() {
        return this.$element.hasClass(this.settings.className.dimmer);
    }

    is_disabled() {
        return this.$dimmable.hasClass(this.settings.className.disabled);
    }

    is_enabled() {
        return !this.is_disabled();
    }

    is_page() {
        return this.$dimmable.is('body');
    }

    is_pageDimmer() {
        return this.$dimmer.hasClass(this.settings.className.pageDimmer);
    }

    has_dimmer() {
        if(this.settings.dimmerName) {
            return (this.$element.find(this.settings.selector.dimmer).filter('.' + this.settings.dimmerName).length > 0);
        } else {
            return ( this.$element.find(this.settings.selector.dimmer).length > 0 );
        }
    }

    remove_active() {
        this.$dimmer.removeClass(this.settings.className.active);
    }

    remove_dimmed() {
        this.$dimmable.removeClass(this.settings.className.dimmed);
    }

    remove_disabled() {
        this.$dimmer.removeClass(this.settings.className.disabled);
    }

    remove_legacy() {
        this.$dimmer.removeClass(this.settings.className.legacy);
    }

    remove_variation(variation) {
        variation = variation || this.settings.variation;
        if (variation) {
            this.$dimmer.removeClass(variation);
        }
    }
}
