"use strict";

import Module from '../module'

//const $ = require('cash-dom');

import $ from 'cash-dom';

const settings = {
    name          : 'Rating',
    namespace     : 'rating',
    
    silent        : false,
    debug         : false,
    verbose       : false,
    performance   : true,
    
    initialRating : 0,
    interactive   : true,
    maxRating     : 4,
    fireOnInit    : false,
    clearable     : 'auto',
    
    metadata: {
        rating    : 'rating',
        maxRating : 'maxRating'
    },
    
    className : {
        active   : 'active',
        disabled : 'disabled',
        selected : 'selected'
    },
    
    selector  : {
        icon : '.icon'
    },
    
    templates: {
        icon: function(maxRating) {
        var
            icon = 1,
            html = ''
        ;
        while(icon <= maxRating) {
            html += '<i class="icon"></i>';
            icon++;
        }
        return html;
        }
    },

    events: ['rate']
}

export class Rating extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.eventNamespace = '.' + this.settings.namespace;
        this.moduleNamespace = 'module-' + this.settings.namespace;

        this.$icons = $(this.settings.selector.icon);
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing rating module', this.settings);

        if(this.$icons.length === 0) {
            this.setup_layout();
        }

        if(this.settings.interactive && !this.is_disabled()) {
            this.enable();
        } else {
            this.disable();
        }
        this.initialLoad = true;
        this.set_rating( this.get_initialRating() );
        this.initialLoad = false;
        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.instance = this; // FIXME
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.remove_events();
        this.$element.removeData(this.moduleNamespace);
    }

    setup_layout() {
        var
            maxRating = this.get_maxRating(),
            html      = this.settings.templates.icon(maxRating)
        ;
        this.debug('Generating icon html dynamically');
        this.$element.html(html);
        this.refresh();
    }

    bind_events() {
        this.verbose('Binding events');
        this.$icons
            .on('mouseenter' + this.eventNamespace, this.event_mouseenter.bind(this))
            .on('mouseleave' + this.eventNamespace, this.event_mouseleave.bind(this))
            .on('click'      + this.eventNamespace, this.event_click.bind(this))
        ;
    }

    refresh() {
        this.$icons = this.$element.find(this.settings.selector.icon);
    }

    enable() {
        this.debug('Setting rating to interactive mode');
        this.bind_events();
        this.$element.removeClass(this.settings.className.disabled);
    }

    disable() {
        this.debug('Setting rating to read-only mode');
        this.remove_events();
        this.$element.addClass(this.settings.className.disabled);
    }

    clearRating() {
        this.debug('Clearing current rating');
        this.set_rating(0);
    }

    event_mouseenter(element) {
        var
            $activeIcon = $(element.target),
            idx = this.$icons.index($activeIcon)
        ;
        for(var i = idx + 1; i < this.get_maxRating(); i++) {
            this.$icons.eq(i).removeClass(this.settings.className.selected);
        }
        this.$element.addClass(this.settings.className.selected);
        for(var i = idx; i >= 0; i--) {
            this.$icons.eq(i).addClass(this.settings.className.selected);
        }
    }

    event_mouseleave() {
        this.$element.removeClass(this.settings.className.selected);
        this.$icons.removeClass(this.settings.className.selected);
    }

    event_click(element) {
        var
            $activeIcon = $(element.target),
            currentRating = this.get_rating(),
            rating        = this.$icons.index($activeIcon) + 1,
            canClear      = (this.settings.clearable == 'auto')
                ? (this.$icons.length === 1)
                : this.settings.clearable
        ;
        if (canClear && currentRating == rating) {
            this.clearRating();
        } else {
            this.set_rating(rating);
        }
    }

    get_initialRating() {
        if(this.$element.data(this.settings.metadata.rating) !== undefined) {
            this.$element.removeData(this.settings.metadata.rating);
            return this.$element.data(this.settings.metadata.rating);
          }
          return this.settings.initialRating;
    }

    get_rating() {
        var currentRating = this.$icons.filter('.' + this.settings.className.active).length;
        this.verbose('Current rating retrieved', currentRating);
        return currentRating;
    }

    get_maxRating() {
        if(this.$element.data(this.settings.metadata.maxRating) !== undefined) {
            this.$element.removeData(this.settings.metadata.maxRating);
            return this.$element.data(this.settings.metadata.maxRating);
        }
        return this.settings.maxRating;
    }

    is_disabled() {
        return this.$element.hasClass(this.settings.className.disabled);
    }

    set_rating(rating) {
        var
            ratingIndex = (rating - 1 >= 0)
                ? (rating - 1)
                : 0,
            idx = ratingIndex;
        ;
        this.$element
            .removeClass(this.settings.className.selected)
        ;
        this.$icons
            .removeClass(this.settings.className.selected)
            .removeClass(this.settings.className.active)
        ;
        if(rating > 0) {
            this.verbose('Setting current rating to', rating);
            while (idx >= 0 ) {
                this.$icons.eq(idx).addClass(this.settings.className.active)

                --idx;
            }
        }
        if(!this.initialLoad || this.settings.fireOnInit) {
            this.invokeCallback('rate', rating);
        }
    }
    
    remove_events() {
        this.verbose('Removing events');
        this.$icons.off(this.eventNamespace);
    }
}
