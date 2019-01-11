"use strict";

import Module from '../module'
import { Transition } from './transition';

import $ from 'cash-dom';

const settings = {
    name           : 'Toast',
    namespace      : 'toast',

    silent         : false,
    debug          : false,
    verbose        : false,
    performance    : true,

    context        : 'body',

    position       : 'top right',
    class          : 'info',

    title          : '',
    message        : '',
    displayTime    : 3000, // set to zero to require manually dismissal, otherwise hides on its own
    showIcon       : true,
    newestOnTop    : false,
    showProgress   : false,
    progressUp     : true, //if false, the bar will start at 100% and decrease to 0%
    opacity        : 1,
    compact        : true,
    closeIcon      : false,

    // transition settings
    transition     : {
        showMethod   : 'scale',
        showDuration : 500,
        hideMethod   : 'scale',
        hideDuration : 500,
        closeEasing  : 'easeOutBounce'  //Set to empty string to stack the closed toast area immediately (old behaviour)
    },

    error: {
        method       : 'The method you called is not defined.',
        noTransition : 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>'
    },

    className      : {
        container    : 'toast-container',
        box          : 'toast-box',
        progress     : 'ui attached active progress',
        toast        : 'ui toast',
        icon         : 'icon',
        visible      : 'visible',
        content      : 'content',
        title        : 'header'
    },

    icons          : {
        info         : 'info',
        success      : 'checkmark',
        warning      : 'warning',
        error        : 'times'
    },

    selector       : {
        container    : '.toast-container',
        box          : '.toast-box',
        toast        : '.ui.toast'
    },

    events: ['show', 'visible', 'click', 'hide', 'hidden', 'remove']
}

export class Toast extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.$toastBox    = $('<div/>',{'class':this.settings.className.box}),
        this.$toast       = $('<div/>'),
        this.$progress    = $('<div/>',{'class':this.settings.className.progress+' '+this.settings.class}),
        this.$progressBar = $('<div/>',{'class':'bar'}),

        this.$close       = $('<i/>',{'class':'close icon'}),
        this.$context     = (this.settings.context)
          ? $(this.settings.context)
          : $('body'),
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing toast module', this.settings);

        if (typeof this.settings.showProgress !== 'string' || ['top','bottom'].indexOf(this.settings.showProgress) === -1 ) {
            this.settings.showProgress = false;
        }
        if (!this.has_container()) {
            this.create_container();
        }

        this.create_toast();

        this.bind_events();
        
        if(this.settings.displayTime > 0) {
            this.closeTimer = setTimeout(this.close.bind(this), this.settings.displayTime+(!!this.settings.showProgress ? 300 : 0));
        }
        this.show();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.instance = this; // FIXME
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.debug('Removing toast', this.$toast);
        this.$toast.remove();
        this.$toast = undefined;
        this.invokeCallback('remove')(this.$toast, this.element);
    }

    create_container() {
        this.verbose('Creating container');
        this.$context.append('<div class="ui ' + this.settings.position + ' ' + this.settings.className.container + '"></div>');
    }

    create_toast() {
        var $content = $('<div/>').addClass(this.settings.className.content);
        this.verbose('Creating toast');
        if (this.settings.closeIcon) {
            this.$toast.append(this.$close);
            this.$toast.css('cursor','default');
        }

        var iconClass = typeof this.settings.showIcon === 'string' ? this.settings.showIcon : this.settings.showIcon && this.settings.icons[this.settings.class] ? this.settings.icons[this.settings.class] : '';
        if (iconClass != '') {
            var $icon = $('<i/>').addClass(iconClass + ' ' + this.settings.className.icon);

            this.$toast
                .addClass(this.settings.className.icon)
                .append($icon)
            ;
        }

        if (this.settings.title !== '') {
            var 
            $title = $('<div/>')
                .addClass(this.settings.className.title)
                .text(this.settings.title)
            ;

            $content.append($title);
        }

        $content.append($('<div/>').html(this.settings.message));

        this.$toast
            .addClass(this.settings.class + ' ' + this.settings.className.toast)
            .append($content)
        ;
        this.$toast.css('opacity', this.settings.opacity);
        if (this.settings.compact || this.$toast.hasClass('compact')) {
            this.$toastBox.addClass('compact');
        }
        if(this.$toast.hasClass('toast') && !this.$toast.hasClass('inverted')){
            this.$progress.addClass('inverted');
        } else {
            this.$progress.removeClass('inverted');
        }
        this.$toast = this.$toastBox.append(this.$toast);
        if(!!this.settings.showProgress && this.settings.displayTime > 0){
            this.$progress
            .addClass(this.settings.showProgress)
            .append(this.$progressBar);
            if (this.$progress.hasClass('top')) {
                this.$toast.prepend(this.$progress);
            } else {
                this.$toast.append(this.$progress);
            }
            this.$progressBar.css('transition','width '+(this.settings.displayTime/1000)+'s linear');
            this.$progressBar.width(this.settings.progressUp?'0%':'100%');
            setTimeout(function() {
                if(typeof this.$progress !== 'undefined'){
                    this.$progressBar.width(this.settings.progressUp?'100%':'0%');
            }
            },300);
        }
        if (this.settings.newestOnTop) {
            this.$toast.prependTo(this.get_container());
        } else {
            this.$toast.appendTo(this.get_container());
        }
    }

    show(callback) {
        callback = callback || function(){};
        this.debug('Showing toast');

        if (this.invokeCallback('show')(this.$toast, this.element) === false) {
            this.debug('onShow callback returned false, cancelling toast animation');
            return;
        }
        this.animate_show(callback);
    }

    close(callback) {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
        }
        callback = callback || function(){};
        this.remove_visible();
        this.unbind_events();
        this.animate_close(callback);
    }

    animate_show(callback) {
        callback = $.isFunction(callback) ? callback : function(){};
        // TODO: add a check if Transition class is loaded... old code: if (this.settings.transition && $.fn.transition !== undefined && $module.transition('is supported')) {
        if (this.settings.transition) {
            this.set_visible();
            var transition = new Transition(this.$toast, {
                animation  : this.settings.transition.showMethod + ' in',
                queue      : false,
                duration   : this.settings.transition.showDuration,
                debug      : this.settings.debug,
                verbose    : this.settings.verbose
            });

            transition.on('complete', function() {
                callback.call(this.$toast, this.element);
                this.invokeCallback('visible')(this.$toast, this.element);
            }.bind(this));
        } else {
            this.error(this.settings.error.noTransition);
        }
    }

    animate_close(callback) {
        callback = $.isFunction(callback) ? callback : function(){};
        this.debug('Closing toast');
        if (this.invokeCallback('hide')(this.$toast, this.element) === false) {
            this.debug('onHide callback returned false, cancelling toast animation');
            return;
        }
        // TODO: add a check if Transition class is loaded... old code: if (this.settings.transition && $.fn.transition !== undefined && $module.transition('is supported')) {
        if (this.settings.transition) {
            var transition = new Transition(this.$toast, {
                animation  : this.settings.transition.hideMethod + ' out',
                queue      : false,
                duration   : this.settings.transition.hideDuration,
                debug      : this.settings.debug,
                verbose    : this.settings.verbose
            });

            /* TODO
            transition.on('beforeHide', function() {
                callback = $.isFunction(callback)?callback : function(){};
                if (this.settings.transition.closeEasing !== '') {
                    $toast.css('opacity',0);
                    $toast.wrap('<div/>').parent().slideUp(500,this.settings.transition.closeEasing,function(){
                        $toast.parent().remove();
                        callback.call($toast);
                    });
                } else {
                    callback.call($toast);
                }
            }.bind(this));
            */

            transition.on('complete', function() {
                this.destroy();
                callback.call(this.$toast, this.element);
                this.invokeCallback('hidden')(this.$toast, this.element);
            }.bind(this));
        }
        else {
            this.error(this.settings.error.noTransition);
        }
    }

    bind_events() {
        this.debug('Binding events to toast');
        (this.settings.closeIcon ? this.$close : this.$toast)
            .on('click' + this.eventNamespace, this.event_click.bind(this))
        ;
    }

    event_click() {
        this.invokeCallback('click')(this.$toast, this.element);
        this.close();
    }

    unbind_events() {
        this.debug('Unbinding events to toast');
        (this.settings.closeIcon ? this.$close : this.$toast)
            .off('click' + this.eventNamespace)
        ;
    }

    get_container() {
        return (this.$context.find(this.helpers_toClass(this.settings.position) + this.settings.selector.container)[0]);
    }

    set_visible() {
        this.$toast.addClass(this.settings.className.visible);
    }

    has_container() {
        this.verbose('Determining if there is already a container');
        return (this.$context.find(this.helpers_toClass(this.settings.position) + this.settings.selector.container).length > 0);
    }

    helpers_toClass(selector) {
        var
            classes = selector.split(' '),
            result = ''
        ;

        classes.forEach(function (element) {
            result += '.' + element;
        });

        return result;
    }

    remove_visible() {
        this.$toast.removeClass(this.settings.className.visible);
    }
}
